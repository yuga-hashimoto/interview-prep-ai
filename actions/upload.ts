'use server'

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import PDFParser from "pdf2json"
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
      text = await new Promise((resolve, reject) => {
          const pdfParser = new PDFParser(null, true); // true = text only
          
          pdfParser.on("pdfParser_dataError", errData => reject(errData));
          pdfParser.on("pdfParser_dataReady", pdfData => {
              // @ts-ignore
              resolve(pdfParser.getRawTextContent());
          });

          pdfParser.parseBuffer(buffer);
      });
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
