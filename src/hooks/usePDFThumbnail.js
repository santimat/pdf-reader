/**
 * PDF Thumbnail Generation Hook
 * 
 * This hook generates a thumbnail image (small preview) of the first page
 * of a PDF document. The thumbnail is generated on the client-side using
 * the pdf.js library.
 */

import { useEffect, useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist'

// Configure pdf.js worker - required for processing PDFs in the browser
// The worker handles PDF parsing in a separate thread to avoid blocking UI
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'

/**
 * Custom hook to generate a thumbnail from a PDF URL.
 * 
 * @param {string} url - The public URL of the PDF file
 * @returns {string|null} - Data URL of the thumbnail image, or null if still loading/failed
 */
export function usePDFThumbnail(url) {
  // Stores the generated thumbnail as a data URL (base64 encoded image)
  const [thumbnail, setThumbnail] = useState(null)

  useEffect(() => {
    // Skip if no URL provided
    if (!url) return

    // Flag to prevent state updates if component unmounts during async operation
    let cancelled = false

    /**
     * Async function to render the first page of the PDF as a small image.
     * Steps:
     * 1. Load the PDF document from the URL
     * 2. Get the first page
     * 3. Render it to a canvas at a small scale (0.4)
     * 4. Convert canvas to a data URL and store in state
     */
    async function renderThumbnail() {
      try {
        // Load the PDF document (fetches and parses the PDF)
        const pdfDocument = await pdfjsLib.getDocument(url).promise
        
        // Get the first page of the document
        const firstPage = await pdfDocument.getPage(1)
        
        // Create a viewport (render area) at scale 0.4 (40% of original size)
        // This small scale keeps the thumbnail lightweight
        const viewport = firstPage.getViewport({ scale: 0.4 })
        
        // Create an off-screen canvas element to render the thumbnail
        const canvas = document.createElement('canvas')
        canvas.width = viewport.width   // Set canvas width to match viewport
        canvas.height = viewport.height // Set canvas height to match viewport
        
        // Render the PDF page onto the canvas
        const renderContext = {
          canvasContext: canvas.getContext('2d'), // Canvas 2D context for drawing
          viewport: viewport,                      // The render area/size
        }
        await firstPage.render(renderContext).promise
        
        // Only update state if component hasn't unmounted
        if (!cancelled) {
          // Convert canvas to a data URL (base64 PNG image)
          // This is what we display in the <img> tag
          setThumbnail(canvas.toDataURL())
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