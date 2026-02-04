import { auth, signOut } from "@/auth"
import { SignIn } from "@/components/sign-in"
import { UploadResume } from "@/components/upload-resume"
import { ResumeList } from "@/components/resume-list"
import { QuestionList } from "@/components/question-list"
import { prisma } from "@/lib/prisma"

export default async function Home() {
  const session = await auth()

  if (!session?.user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Interview Prep AI</h1>
            <p className="text-gray-600">
                AIを活用した面接対策プラットフォーム。<br/>
                履歴書をアップロードして、<br/>
                想定質問と逆質問を自動生成しましょう。
            </p>
            <SignIn />
        </div>
      </div>
    )
  }

  const documents = await prisma.document.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' }
  })

  const questions = await prisma.question.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
        <header className="bg-white border-b shadow-sm sticky top-0 z-10">
            <div className="max-w-5xl mx-auto px-4 h-16 flex justify-between items-center">
                <h1 className="text-xl font-bold text-gray-900">Interview Prep AI</h1>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500 hidden sm:inline">{session.user.email}</span>
                    <form action={async () => { "use server"; await signOut() }}>
                        <button className="text-sm text-red-600 hover:text-red-800 font-medium">ログアウト</button>
                    </form>
                </div>
            </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 py-8 space-y-10">
            <section className="space-y-4">
                <div className="flex justify-between items-end border-b pb-2">
                    <h2 className="text-2xl font-bold text-gray-800">1. 履歴書・職務経歴書</h2>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
                    <UploadResume />
                    <ResumeList documents={documents} />
                </div>
            </section>

            <section className="space-y-4">
                 <div className="flex justify-between items-end border-b pb-2">
                    <h2 className="text-2xl font-bold text-gray-800">2. 面接対策 (想定質問 & 逆質問)</h2>
                    <span className="text-sm text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded">{questions.length} 件</span>
                </div>
                <QuestionList questions={questions} />
            </section>
        </main>
    </div>
  )
}
