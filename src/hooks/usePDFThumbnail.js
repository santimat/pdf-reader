/**
 * PDF Thumbnail Generation Hook
 * 
 * This hook generates a thumbnail image (small preview) of the first page
 * of a PDF document. The thumbnail is generated on the client-side using
 * the pdf.js library.
 * 
 * USES CACHING to avoid regenerating thumbnails on every render.
 * This dramatically improves performance for large libraries.
 */

import { useEffect, useState, useRef } from 'react'

const thumbnailCache = new Map()
let pdfjsLib = null

async function getPdfJs() {
  if (!pdfjsLib) {
    const module = await import('pdfjs-dist')
    pdfjsLib = module
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
  }
  return pdfjsLib
}

export function usePDFThumbnail(url) {
  const [thumbnail, setThumbnail] = useState(null)
  const cacheKeyRef = useRef(null)

  useEffect(() => {
    if (!url) return

    const cacheKey = url.split('?')[0]
    cacheKeyRef.current = cacheKey

    if (thumbnailCache.has(cacheKey)) {
      setThumbnail(thumbnailCache.get(cacheKey))
      return
    }

    let cancelled = false

    async function renderThumbnail() {
      try {
        const pdfjs = await getPdfJs()
        const pdfDocument = await pdfjs.getDocument(url).promise
        
        if (cancelled) return
        
        const firstPage = await pdfDocument.getPage(1)
        const viewport = firstPage.getViewport({ scale: 0.3 })
        
        const canvas = document.createElement('canvas')
        canvas.width = viewport.width
        canvas.height = viewport.height
        
        const ctx = canvas.getContext('2d')
        
        await firstPage.render({ canvasContext: ctx, viewport }).promise
        
        if (!cancelled) {
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7)
          thumbnailCache.set(cacheKey, dataUrl)
          
          if (cacheKeyRef.current === cacheKey) {
            setThumbnail(dataUrl)
          }
        }
      } catch (error) {
        console.error('Thumbnail generation error', error)
      }
    }

    renderThumbnail()

    return () => {
      cancelled = true
    }
  }, [url])

  return thumbnail
}