'use client'
import { useEffect, useRef, useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

export function usePdf(file: File | null) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [totalPages, setTotalPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const pdfRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null)

  useEffect(() => {
    if (!file) return
    const url = URL.createObjectURL(file)
    pdfjsLib.getDocument(url).promise.then((pdf) => {
      pdfRef.current = pdf
      setTotalPages(pdf.numPages)
      setCurrentPage(1)
    })
    return () => URL.revokeObjectURL(url)
  }, [file])

  useEffect(() => {
    const pdf = pdfRef.current
    const canvas = canvasRef.current
    if (!pdf || !canvas) return

    pdf.getPage(currentPage).then((page) => {
      const viewport = page.getViewport({ scale: 1 })
      const scale = Math.min(
        canvas.parentElement!.clientWidth / viewport.width,
        canvas.parentElement!.clientHeight / viewport.height
      )
      const scaled = page.getViewport({ scale })
      canvas.width = scaled.width
      canvas.height = scaled.height
      page.render({ canvasContext: canvas.getContext('2d')!, viewport: scaled })
    })
  }, [currentPage, totalPages])

  function goNext() {
    setCurrentPage((p) => Math.min(p + 1, totalPages))
  }

  function goPrev() {
    setCurrentPage((p) => Math.max(p - 1, 1))
  }

  return { canvasRef, currentPage, totalPages, goNext, goPrev }
}
