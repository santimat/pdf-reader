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
import * as pdfjsLib from 'pdfjs-dist'

// Configure pdf.js worker - required for processing PDFs in the browser
// The worker runs in a separate thread to avoid blocking UI
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'

// In-memory cache for thumbnails (survives across component remounts)
// This is a simple Map that stores URL -> thumbnail data URL
// Since it's module-level, it persists as long as the page is open
const thumbnailCache = new Map()

/**
 * Custom hook to generate a thumbnail from a PDF URL.
 * Uses caching to avoid regenerating thumbnails unnecessarily.
 * 
 * @param {string} url - The public URL of the PDF file
 * @returns {string|null} - Data URL of the thumbnail image, or null if still loading/failed
 */
export function usePDFThumbnail(url) {
  // Stores the generated thumbnail as a data URL (base64 encoded JPEG)
  const [thumbnail, setThumbnail] = useState(null)
  // Track the current URL to prevent stale updates after unmount
  const cacheKeyRef = useRef(null)

  useEffect(() => {
    // Skip if no URL provided
    if (!url) return

    // Create a cache key from the URL (strip query params)
    // This ensures we cache based on the actual PDF, not the URL variant
    const cacheKey = url.split('?')[0]
    cacheKeyRef.current = cacheKey

    // CHECK CACHE FIRST - avoid expensive PDF rendering if already generated
    if (thumbnailCache.has(cacheKey)) {
      setThumbnail(thumbnailCache.get(cacheKey))
      return
    }

    // Flag to prevent state updates if component unmounts during async operation
    let cancelled = false

    /**
     * Async function to render the first page of the PDF as a small image.
     * Steps:
     * 1. Load the PDF document from the URL
     * 2. Get the first page
     * 3. Render it to a canvas at a small scale (0.3 = 30%)
     * 4. Convert canvas to a JPEG data URL and store in state + cache
     */
    async function renderThumbnail() {
      try {
        // Load the PDF document (fetches and parses the PDF)
        const pdfDocument = await pdfjsLib.getDocument(url).promise
        
        // Get the first page of the document
        const firstPage = await pdfDocument.getPage(1)
        
        // Create a viewport at scale 0.3 (30% of original size)
        // Smaller scale = faster rendering, smaller thumbnail
        const viewport = firstPage.getViewport({ scale: 0.3 })
        
        // Create an off-screen canvas element to render the thumbnail
        const canvas = document.createElement('canvas')
        canvas.width = viewport.width
        canvas.height = viewport.height
        
        // Get the 2D drawing context
        const ctx = canvas.getContext('2d')
        
        // Render the PDF page onto the canvas
        await firstPage.render({ canvasContext: ctx, viewport }).promise
        
        // Only update state if component hasn't unmounted
        if (!cancelled) {
          // Convert canvas to JPEG data URL (70% quality for smaller size)
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7)
          
          // Store in module-level cache for future renders
          thumbnailCache.set(cacheKey, dataUrl)
          
          // Only update React state if this is still the current request
          if (cacheKeyRef.current === cacheKey) {
            setThumbnail(dataUrl)
          }
        }
      } catch (error) {
        // Log errors (e.g., invalid PDF URL, network issues)
        console.error('Thumbnail generation error', error)
      }
    }

    // Start thumbnail generation
    renderThumbnail()

    // Cleanup function - prevents memory leaks and state updates on unmounted components
    return () => {
      cancelled = true
    }
  }, [url]) // Re-run when URL changes (new book selected)

  // Return the thumbnail data URL, or null if not yet generated
  return thumbnail
}