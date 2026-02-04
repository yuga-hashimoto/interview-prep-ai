'use server'
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { generateObject } from 'ai'
import { z } from 'zod'
import { createOpenAI } from '@ai-sdk/openai'

const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

export async function deleteQuestion(id: string) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Not authenticated" }
    await prisma.question.delete({ where: { id, userId: session.user.id } })
    revalidatePath("/")
}

export async function updateQuestion(id: string, question: string, answer: string) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Not authenticated" }
    await prisma.question.update({
        where: { id, userId: session.user.id },
        data: { question, answer }
    })
    revalidatePath("/")
}

export async function aiRefineQuestion(id: string, instruction: string) {
    const session = await auth()
    if (!session?.user?.id) return { error: "Not authenticated" }
    
    const q = await prisma.question.findUnique({ where: { id, userId: session.user.id } })
    if (!q) return { error: "Question not found" }

    const prompt = `
    以下の面接想定問答を、ユーザーの指示に基づいて修正してください。
    
    指示: ${instruction}
    
    元の質問: ${q.question}
    元の回答: ${q.answer}
    
    出力は日本語で行ってください。
    `

    try {
        const result = await generateObject({
            model: openrouter('google/gemini-2.0-flash-001'),
            schema: z.object({
                question: z.string(),
                answer: z.string()
            }),
            prompt: prompt
        })

        await prisma.question.update({
            where: { id, userId: session.user.id },
            data: {
                question: result.object.question,
                answer: result.object.answer
            }
        })
        revalidatePath("/")
        return { success: true }
    } catch (e) {
        console.error(e)
        return { error: "AI refinement failed" }
    }
}

export async function importQuestions(csvData: {question: string, answer: string, type: string}[]) {
     const session = await auth()
    if (!session?.user?.id) return { error: "Not authenticated" }

    await prisma.question.createMany({
        data: csvData.map(d => ({
            userId: session!.user!.id!,
            question: d.question,
            answer: d.answer,
            type: d.type || "QA"
        }))
    })
    revalidatePath("/")
}
