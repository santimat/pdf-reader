import { useEffect, useRef, useState, useCallback } from 'react'
import * as pdfjsLib from 'pdfjs-dist'

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'

export default function PDFReader({ book, onClose, onSaveProgress }) {
  const canvasRef = useRef(null)
  const pdfRef = useRef(null)
  const [currentPage, setCurrentPage] = useState(book.current_page || 1)
  const [totalPages, setTotalPages] = useState(book.total_pages || 0)
  const [scale, setScale] = useState(1.2)
  const [loading, setLoading] = useState(true)
  const saveTimeout = useRef(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      const pdf = await pdfjsLib.getDocument(book.public_url).promise
      if (cancelled) return
      pdfRef.current = pdf
      setTotalPages(pdf.numPages)
      await renderPage(book.current_page || 1, pdf, scale)
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [book.public_url])

  const renderPage = useCallback(async (num, pdf, s) => {
    const doc = pdf || pdfRef.current
    if (!doc || !canvasRef.current) return
    setLoading(true)
    const page = await doc.getPage(num)
    const viewport = page.getViewport({ scale: s || scale })
    const canvas = canvasRef.current
    canvas.width = viewport.width
    canvas.height = viewport.height
    await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise
    setLoading(false)
  }, [scale])

  async function goTo(num) {
    if (!pdfRef.current) return
    const p = Math.max(1, Math.min(num, totalPages))
    setCurrentPage(p)
    await renderPage(p, pdfRef.current, scale)
    clearTimeout(saveTimeout.current)
    saveTimeout.current = setTimeout(() => {
      onSaveProgress(book.id, p, totalPages)
    }, 800)
  }

  async function changeZoom(delta) {
    const newScale = Math.round(Math.max(0.6, Math.min(2.8, scale + delta)) * 10) / 10
    setScale(newScale)
    await renderPage(currentPage, pdfRef.current, newScale)
  }

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goTo(currentPage + 1)
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') goTo(currentPage - 1)
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [currentPage, totalPages])

  const progress = totalPages ? Math.round((currentPage / totalPages) * 100) : 0

  return (
    <div style={styles.overlay}>
      <div style={styles.topbar}>
        <button style={styles.backBtn} onClick={onClose}>← Biblioteca</button>
        <span style={styles.title}>{book.name}</span>
        <div style={styles.controls}>
          <button style={styles.ctrlBtn} onClick={() => changeZoom(-0.2)}>−</button>
          <span style={styles.zoomLabel}>{Math.round((scale / 1.2) * 100)}%</span>
          <button style={styles.ctrlBtn} onClick={() => changeZoom(0.2)}>+</button>
          <div style={styles.divider} />
          <button style={styles.ctrlBtn} disabled={currentPage <= 1} onClick={() => goTo(currentPage - 1)}>‹</button>
          <span style={styles.pageLabel}>{currentPage} / {totalPages || '—'}</span>
          <button style={styles.ctrlBtn} disabled={currentPage >= totalPages} onClick={() => goTo(currentPage + 1)}>›</button>
        </div>
      </div>

      <div style={styles.progressStrip}>
        <div style={{ ...styles.progressFill, width: `${progress}%` }} />
      </div>

      <div style={styles.canvasArea}>
        {loading && <div style={styles.loadingMsg}>Cargando…</div>}
        <div style={{ ...styles.canvasWrapper, opacity: loading ? 0 : 1, transition: 'opacity 0.2s' }}>
          <canvas ref={canvasRef} />
        </div>
      </div>
    </div>
  )
}

const styles = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 100,
    background: '#1A1714',
    display: 'flex', flexDirection: 'column',
  },
  topbar: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '10px 16px',
    background: '#231F1B',
    borderBottom: '0.5px solid rgba(255,255,255,0.08)',
    flexWrap: 'wrap',
  },
  backBtn: {
    background: 'transparent', border: '0.5px solid rgba(255,255,255,0.15)',
    color: '#C8BEB4', borderRadius: 6, padding: '6px 12px',
    fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
  },
  title: {
    flex: 1, fontSize: 13, fontWeight: 500, color: '#EDE6D8',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
    fontFamily: "'Lora', serif",
  },
  controls: {
    display: 'flex', alignItems: 'center', gap: 6,
  },
  ctrlBtn: {
    width: 30, height: 30, background: 'rgba(255,255,255,0.06)',
    border: '0.5px solid rgba(255,255,255,0.12)', borderRadius: 6,
    color: '#C8BEB4', fontSize: 15, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'inherit',
  },
  zoomLabel: { fontSize: 12, color: '#A09890', minWidth: 36, textAlign: 'center' },
  pageLabel: { fontSize: 12, color: '#A09890', minWidth: 56, textAlign: 'center' },
  divider: { width: 0.5, height: 20, background: 'rgba(255,255,255,0.1)', margin: '0 4px' },
  progressStrip: { height: 2, background: 'rgba(255,255,255,0.05)' },
  progressFill: { height: '100%', background: '#7C6E5A', transition: 'width 0.4s' },
  canvasArea: {
    flex: 1, overflow: 'auto',
    display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
    padding: 24,
  },
  canvasWrapper: {
    background: '#fff', borderRadius: 4,
    boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
  },
  loadingMsg: {
    position: 'absolute', color: '#A09890', fontSize: 14,
    top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
  },
}
