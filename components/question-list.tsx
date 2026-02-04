'use client'
import { useState } from "react"
import { deleteQuestion, updateQuestion, aiRefineQuestion, importQuestions } from "@/actions/questions"
import { useForm } from "react-hook-form"

type Question = {
    id: string
    question: string
    answer: string | null
    type: string
}

export function QuestionList({ questions }: { questions: Question[] }) {
    const [filter, setFilter] = useState("ALL")
    const [mode, setMode] = useState("LIST")
    const [editingId, setEditingId] = useState<string | null>(null)
    const [refiningId, setRefiningId] = useState<string | null>(null)

    const filtered = questions.filter(q => filter === "ALL" || q.type === filter)

    const handleExport = () => {
        // Simple CSV generation
        const header = "Type,Question,Answer\n"
        const rows = questions.map(q => {
            const escape = (t: string|null) => `"${(t||"").replace(/"/g, '""')}"`
            return `${q.type},${escape(q.question)},${escape(q.answer)}`
        }).join("\n")
        
        const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `interview_questions_${new Date().toISOString().slice(0,10)}.csv`
        a.click()
    }

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = async (evt) => {
            const text = evt.target?.result as string
            const lines = text.split("\n")
            // Naive CSV parser
            const data = lines.slice(1).map(line => {
                if (!line.trim()) return null
                // Split by comma respecting quotes is hard without lib.
                // Assuming standard Excel CSV export style
                // Matches "..." or non-comma
                // This regex is imperfect but sufficient for simple MVP
                const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g)
                if (!matches || matches.length < 2) return null
                
                const clean = (s: string) => s.replace(/^"|"$/g, '').replace(/""/g, '"')
                return {
                    type: clean(matches[0]) || "QA",
                    question: clean(matches[1]),
                    answer: matches[2] ? clean(matches[2]) : ""
                }
            }).filter(Boolean) as any[]
            
            if (data.length > 0) {
                 await importQuestions(data)
            }
        }
        reader.readAsText(file)
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-2 justify-between items-start sm:items-center bg-white p-4 rounded-lg shadow-sm border">
                <div className="flex gap-2">
                    <button onClick={() => setFilter("ALL")} className={`px-3 py-1 text-sm rounded-full transition-colors ${filter==="ALL"?"bg-blue-600 text-white":"bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>すべて</button>
                    <button onClick={() => setFilter("QA")} className={`px-3 py-1 text-sm rounded-full transition-colors ${filter==="QA"?"bg-blue-600 text-white":"bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>想定問答</button>
                    <button onClick={() => setFilter("REVERSE")} className={`px-3 py-1 text-sm rounded-full transition-colors ${filter==="REVERSE"?"bg-blue-600 text-white":"bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>逆質問</button>
                </div>
                
                <div className="flex gap-2 items-center flex-wrap">
                    <button onClick={() => setMode(mode==="LIST"?"FLASHCARD":"LIST")} className="px-3 py-1 rounded border border-purple-200 text-purple-700 hover:bg-purple-50 text-sm font-medium">
                        {mode==="LIST" ? "暗記モード (答えを隠す)" : "リストモード"}
                    </button>
                    <button onClick={handleExport} className="px-3 py-1 rounded border border-green-200 text-green-700 hover:bg-green-50 text-sm font-medium">CSV出力</button>
                    <label className="px-3 py-1 rounded border border-orange-200 text-orange-700 hover:bg-orange-50 text-sm font-medium cursor-pointer">
                        CSV取込
                        <input type="file" accept=".csv" onChange={handleImport} className="hidden" />
                    </label>
                </div>
            </div>

            <div className="grid gap-4">
                {filtered.length === 0 && <div className="text-gray-500 text-center py-8">質問がありません。</div>}
                {filtered.map(q => (
                    <QuestionCard 
                        key={q.id} 
                        question={q} 
                        mode={mode} 
                        isEditing={editingId === q.id} 
                        setEditing={setEditingId}
                        isRefining={refiningId === q.id}
                        setRefining={setRefiningId}
                    />
                ))}
            </div>
        </div>
    )
}

function QuestionCard({ question, mode, isEditing, setEditing, isRefining, setRefining }: any) {
    const [showAnswer, setShowAnswer] = useState(false)
    const { register, handleSubmit } = useForm({ defaultValues: { q: question.question, a: question.answer } })
    const [aiPrompt, setAiPrompt] = useState("")

    const onSave = async (data: any) => {
        await updateQuestion(question.id, data.q, data.a)
        setEditing(null)
    }

    const onAiRefine = async () => {
        if (!aiPrompt) return
        setRefining(question.id)
        await aiRefineQuestion(question.id, aiPrompt)
        setRefining(null)
        setAiPrompt("")
        setEditing(null)
    }

    if (isEditing) {
        return (
            <div className="border border-blue-200 p-4 rounded-lg bg-blue-50 shadow-sm">
                <form onSubmit={handleSubmit(onSave)} className="space-y-3">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">質問</label>
                        <textarea {...register("q")} className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" rows={2} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">回答 / コンテキスト</label>
                        <textarea {...register("a")} className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" rows={4} />
                    </div>
                    <div className="flex gap-2 pt-2">
                        <button type="submit" className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-blue-700">保存</button>
                        <button type="button" onClick={() => setEditing(null)} className="text-gray-600 px-4 py-1.5 rounded text-sm hover:bg-gray-200">キャンセル</button>
                    </div>
                </form>
                
                <div className="mt-4 border-t border-blue-200 pt-4">
                    <label className="block text-xs font-bold text-purple-700 mb-2 flex items-center gap-1">
                         ✨ AI修正 (指示を入力)
                    </label>
                    <div className="flex gap-2">
                        <input 
                            value={aiPrompt} 
                            onChange={e => setAiPrompt(e.target.value)} 
                            placeholder="例: もっと自信のある言い回しにして、具体例を入れて..." 
                            className="flex-grow border p-2 rounded text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                            onKeyDown={e => e.key === 'Enter' && onAiRefine()}
                        />
                        <button onClick={onAiRefine} disabled={isRefining || !aiPrompt} className="bg-purple-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-purple-700 disabled:opacity-50 whitespace-nowrap">
                            {isRefining ? "AI思考中..." : "AI修正"}
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="border p-5 rounded-lg bg-white shadow-sm hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${question.type === "QA" ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"}`}>
                    {question.type === "QA" ? "想定問答" : "逆質問"}
                </span>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setEditing(question.id)} className="text-gray-400 hover:text-blue-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                    </button>
                    <button onClick={() => deleteQuestion(question.id)} className="text-gray-400 hover:text-red-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </div>
            </div>
            
            <div className="font-bold text-lg text-gray-900 mb-3">{question.question}</div>
            
            {mode === "FLASHCARD" ? (
                <div className="mt-4 border-t pt-3">
                    {showAnswer ? (
                        <div onClick={() => setShowAnswer(false)} className="cursor-pointer bg-gray-50 p-4 rounded text-gray-800 animate-in fade-in slide-in-from-top-2">
                            {question.answer}
                            <div className="text-xs text-gray-400 mt-2 text-center">(クリックで隠す)</div>
                        </div>
                    ) : (
                        <button onClick={() => setShowAnswer(true)} className="w-full py-8 bg-gray-50 rounded border-2 border-dashed border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600 transition-colors">
                            クリックして答えを表示
                        </button>
                    )}
                </div>
            ) : (
                 <div className="mt-2 text-gray-700 whitespace-pre-wrap leading-relaxed border-t pt-3 border-gray-100">{question.answer}</div>
            )}
        </div>
    )
}
