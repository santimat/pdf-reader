import { useEffect, useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist'

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'

export function usePDFThumbnail(url) {
  const [thumbnail, setThumbnail] = useState(null)

  useEffect(() => {
    if (!url) return
    let cancelled = false

    async function render() {
      try {
        const pdf = await pdfjsLib.getDocument(url).promise
        const page = await pdf.getPage(1)
        const viewport = page.getViewport({ scale: 0.4 })
        const canvas = document.createElement('canvas')
        canvas.width = viewport.width
        canvas.height = viewport.height
        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise
        if (!cancelled) setThumbnail(canvas.toDataURL())
      } catch (e) {
        console.error('Thumbnail error', e)
      }
    }

    render()
    return () => { cancelled = true }
  }, [url])

  return thumbnail
}
