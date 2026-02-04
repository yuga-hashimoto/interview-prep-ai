'use server'

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { generateObject } from 'ai'
import { z } from 'zod'
import { createOpenAI } from '@ai-sdk/openai'
import { revalidatePath } from "next/cache"

const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

export async function generateQuestions(documentId: string) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Not authenticated" }

    const doc = await prisma.document.findUnique({
        where: { id: documentId, userId: session.user.id }
    })
    if (!doc) return { error: "Document not found" }

    const prompt = `
    以下の履歴書・職務経歴書の内容を分析し、想定される面接の質問と模範回答を作成してください。
    また、候補者が面接官に聞くべき「逆質問」もいくつか作成してください。
    
    出力は全て日本語で行ってください。

    履歴書内容:
    ${doc.content.substring(0, 20000)}
    `

    try {
        const result = await generateObject({
            model: openrouter('google/gemini-2.0-flash-001'),
            schema: z.object({
                qa: z.array(z.object({
                    question: z.string().describe("面接官からの質問"),
                    answer: z.string().describe("その質問に対する模範回答"),
                })),
                reverse: z.array(z.object({
                    question: z.string().describe("面接官への逆質問"),
                    context: z.string().describe("その質問をする意図や背景"),
                }))
            }),
            prompt: prompt
        })

        // Save to DB
        const questions = result.object.qa.map(q => ({
            userId: session.user!.id!,
            question: q.question,
            answer: q.answer,
            type: "QA"
        }));

        const reverseQuestions = result.object.reverse.map(q => ({
            userId: session.user!.id!,
            question: q.question,
            answer: q.context, 
            type: "REVERSE"
        }));

        await prisma.$transaction([
            prisma.question.createMany({ data: questions }),
            prisma.question.createMany({ data: reverseQuestions })
        ]);

        revalidatePath("/")
        return { success: true }
    } catch (e) {
        console.error("AI Generation Error:", e)
        return { error: "Failed to generate questions. Check API Key." }
    }
}
