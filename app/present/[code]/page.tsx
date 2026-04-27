'use client'
import { useEffect, useState, use } from 'react'
import { usePdf } from '@/lib/use-pdf'
import { getPusherClient } from '@/lib/pusher-client'
import { QRCodeCanvas } from 'qrcode.react'

export default function PresentPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params)
  const [file, setFile] = useState<File | null>(null)
  const [showQr, setShowQr] = useState(true)
  const { canvasRef, currentPage, totalPages, goNext, goPrev } = usePdf(file)

  // Load PDF from sessionStorage
  useEffect(() => {
    const data = sessionStorage.getItem(`pdf-${code}`)
    if (!data) return
    fetch(data)
      .then((r) => r.blob())
      .then((blob) => setFile(new File([blob], 'slides.pdf', { type: 'application/pdf' })))
  }, [code])

  // Listen for remote slide changes
  useEffect(() => {
    const pusher = getPusherClient()
    const channel = pusher.subscribe(`room-${code}`)
    channel.bind('slide:change', ({ direction }: { direction: 'next' | 'prev' }) => {
      if (direction === 'next') goNext()
      else goPrev()
    })
    return () => pusher.unsubscribe(`room-${code}`)
  }, [code, goNext, goPrev])

  // Keyboard navigation
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goNext()
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') goPrev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goNext, goPrev])

  const remoteUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/remote/${code}`
    : ''

  return (
    <div className="relative w-screen h-screen bg-black flex items-center justify-center">
      <canvas ref={canvasRef} className="max-w-full max-h-full" />

      {/* Slide counter */}
      {totalPages > 0 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-sm">
          {currentPage} / {totalPages}
        </div>
      )}

      {/* Room code + QR toggle */}
      <button
        onClick={() => setShowQr((v) => !v)}
        className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white text-sm px-3 py-1 rounded-lg"
      >
        {code}
      </button>

      {showQr && remoteUrl && (
        <div className="absolute top-12 right-4 bg-white p-3 rounded-xl shadow-xl">
          <QRCodeCanvas value={remoteUrl} size={140} />
          <p className="text-center text-xs text-gray-500 mt-1">{code}</p>
        </div>
      )}
    </div>
  )
}
