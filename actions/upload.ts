'use server'

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
const pdf = require("pdf-parse")
import { revalidatePath } from "next/cache"

export async function uploadResume(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Not authenticated" }

  const file = formData.get("file") as File
  if (!file) return { error: "No file provided" }

  let text = ""
  
  try {
    const buffer = Buffer.from(await file.arrayBuffer())

    if (file.type === "application/pdf") {
      const data = await pdf(buffer)
      text = data.text
    } else if (file.type === "text/plain") {
      text = buffer.toString("utf-8")
    } else {
      return { error: "Unsupported file type. Please upload PDF or TXT." }
    }

    await prisma.document.create({
      data: {
        userId: session.user.id,
        title: file.name,
        content: text,
        type: "RESUME"
      }
    })

    revalidatePath("/")
    return { success: true }
  } catch (e) {
    console.error(e)
    return { error: "Failed to process file" }
  }
}
