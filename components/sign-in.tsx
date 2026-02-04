
import { signIn } from "@/auth"

export function SignIn() {
  return (
    <form
      action={async (formData) => {
        "use server"
        await signIn("credentials", formData)
      }}
      className="flex flex-col gap-2"
    >
      <input 
        name="email" 
        type="email" 
        placeholder="メールアドレスを入力" 
        className="border p-2 rounded text-gray-900" 
        required
      />
      <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
        ログイン / 新規登録
      </button>
    </form>
  )
}
