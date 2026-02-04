'use client'
import { generateQuestions } from "@/actions/generate"
import { useState } from "react"

export function ResumeList({ documents }: { documents: any[] }) {
    const [generating, setGenerating] = useState<string | null>(null)

    const handleGenerate = async (id: string) => {
        setGenerating(id)
        await generateQuestions(id)
        setGenerating(null)
    }

    if (documents.length === 0) return <div className="text-gray-500 italic p-4">履歴書がありません。</div>

    return (
        <div className="grid gap-4">
            {documents.map(doc => (
                <div key={doc.id} className="border p-4 rounded-lg bg-white shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="overflow-hidden">
                        <div className="font-semibold truncate">{doc.title}</div>
                        <div className="text-xs text-gray-500">{new Date(doc.createdAt).toLocaleDateString()}</div>
                        <div className="text-xs text-gray-400 mt-1 truncate">{doc.content.substring(0, 50)}...</div>
                    </div>
                    <button 
                        onClick={() => handleGenerate(doc.id)} 
                        disabled={generating === doc.id}
                        className="whitespace-nowrap bg-purple-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
                    >
                        {generating === doc.id ? "生成中..." : "質問・回答を生成"}
                    </button>
                </div>
            ))}
        </div>
    )
}
