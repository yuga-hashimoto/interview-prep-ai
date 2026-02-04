'use client'
import { uploadResume } from "@/actions/upload"
import { useForm } from "react-hook-form"
import { useState } from "react"

export function UploadResume() {
    const { register, handleSubmit, reset } = useForm()
    const [uploading, setUploading] = useState(false)

    const onSubmit = async (data: any) => {
        if (!data.file?.[0]) return
        setUploading(true)
        const formData = new FormData()
        formData.append("file", data.file[0])
        await uploadResume(formData)
        setUploading(false)
        reset()
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center bg-gray-50 p-4 rounded-lg border">
            <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700">新しい履歴書・経歴書をアップロード (PDF/TXT)</label>
                <input {...register("file")} type="file" accept=".pdf,.txt" className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
            </div>
            <button disabled={uploading} type="submit" className="mt-4 sm:mt-0 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50">
                {uploading ? "保存中..." : "保存"}
            </button>
        </form>
    )
}
