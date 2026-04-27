'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function Home() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)

  async function handleStart() {
    if (!file) return
    setLoading(true)
    const res = await fetch('/api/room', { method: 'POST' })
    const { code } = await res.json()
    sessionStorage.setItem(`pdf-${code}`, await toBase64(file))
    router.push(`/present/${code}`)
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 p-8 bg-gray-950 text-white">
      <h1 className="text-4xl font-bold tracking-tight">Move Your Slides</h1>
      <p className="text-gray-400">Upload a PDF and control slides from your phone.</p>

      <label className="cursor-pointer border-2 border-dashed border-gray-600 hover:border-blue-500 rounded-xl p-10 text-center transition-colors">
        <input
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        {file ? (
          <span className="text-blue-400 font-medium">{file.name}</span>
        ) : (
          <span className="text-gray-400">Click to select a PDF</span>
        )}
      </label>

      <button
        onClick={handleStart}
        disabled={!file || loading}
        className="px-8 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 rounded-lg font-semibold transition-colors"
      >
        {loading ? 'Starting…' : 'Start Presentation'}
      </button>
    </main>
  )
}

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
