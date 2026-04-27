'use client'
import { use, useState } from 'react'

export default function RemotePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params)
  const [feedback, setFeedback] = useState<'next' | 'prev' | null>(null)

  async function send(direction: 'next' | 'prev') {
    setFeedback(direction)
    setTimeout(() => setFeedback(null), 200)
    await fetch('/api/slide', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, direction }),
    })
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center gap-6 p-8 select-none">
      <p className="text-gray-400 text-sm tracking-widest uppercase">Room {code}</p>

      <div className="flex gap-6 w-full max-w-sm">
        <button
          onPointerDown={() => send('prev')}
          className={`flex-1 h-40 rounded-2xl text-3xl font-bold transition-colors ${
            feedback === 'prev' ? 'bg-blue-400' : 'bg-gray-800 active:bg-gray-700'
          }`}
        >
          ←
        </button>
        <button
          onPointerDown={() => send('next')}
          className={`flex-1 h-40 rounded-2xl text-3xl font-bold transition-colors ${
            feedback === 'next' ? 'bg-blue-400' : 'bg-gray-800 active:bg-gray-700'
          }`}
        >
          →
        </button>
      </div>

      <p className="text-gray-600 text-xs">Tap to control slides</p>
    </main>
  )
}
