import { useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useLibrary } from '../hooks/useLibrary'
import BookCard from '../components/BookCard'
import PDFReader from '../components/PDFReader'

export default function Library() {
  const { sessionId } = useParams()
  const { books, loading, uploading, uploadPDF, saveProgress, deleteBook } = useLibrary(sessionId)
  const [openBook, setOpenBook] = useState(null)
  const [copied, setCopied] = useState(false)
  const fileRef = useRef()

  function copyURL() {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleDrop(e) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file?.type === 'application/pdf') uploadPDF(file)
  }

  if (openBook) {
    return (
      <PDFReader
        book={openBook}
        onClose={() => setOpenBook(null)}
        onSaveProgress={saveProgress}
      />
    )
  }

  return (
    <div style={styles.page} onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
      <header style={styles.header}>
        <h1 style={styles.logo}>📚 Mi biblioteca</h1>
        <div style={styles.headerRight}>
          <button style={styles.copyBtn} onClick={copyURL}>
            {copied ? '✓ Copiado' : '🔗 Copiar URL de sesión'}
          </button>
          <button style={styles.uploadBtn} onClick={() => fileRef.current.click()} disabled={uploading}>
            {uploading ? 'Subiendo…' : '+ Agregar PDF'}
          </button>
          <input ref={fileRef} type="file" accept="application/pdf" style={{ display: 'none' }}
            onChange={(e) => { if (e.target.files[0]) uploadPDF(e.target.files[0]) }} />
        </div>
      </header>

      <div style={styles.sessionNote}>
        <span style={styles.sessionDot} />
        <span>Sesión: <code style={styles.code}>{sessionId.slice(0, 8)}…</code></span>
        <span style={{ color: '#A09890' }}>— guardá esta URL para acceder desde otros dispositivos</span>
      </div>

      {loading ? (
        <div style={styles.empty}>Cargando biblioteca…</div>
      ) : books.length === 0 ? (
        <div style={styles.dropZone} onClick={() => fileRef.current.click()}>
          <div style={styles.dropIcon}>📄</div>
          <p style={styles.dropTitle}>Agregá tu primer PDF</p>
          <p style={styles.dropSub}>Hacé clic aquí o arrastrá un archivo</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {books.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onOpen={setOpenBook}
              onDelete={deleteBook}
            />
          ))}
          <div style={styles.addCard} onClick={() => fileRef.current.click()}>
            <span style={styles.addIcon}>+</span>
            <span style={styles.addLabel}>Agregar PDF</span>
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  page: {
    maxWidth: 900, margin: '0 auto', padding: '24px 20px',
    fontFamily: "'DM Sans', sans-serif",
    minHeight: '100vh',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 10, flexWrap: 'wrap', gap: 10,
  },
  logo: {
    fontFamily: "'Lora', serif", fontSize: 22, fontWeight: 400,
    color: '#2C2820',
  },
  headerRight: { display: 'flex', gap: 8, alignItems: 'center' },
  copyBtn: {
    background: 'transparent',
    border: '0.5px solid rgba(44,40,32,0.2)',
    borderRadius: 7, padding: '8px 14px',
    fontSize: 13, cursor: 'pointer', color: '#6B6258',
    fontFamily: 'inherit',
  },
  uploadBtn: {
    background: '#2C2820', color: '#F5F0E8',
    border: 'none', borderRadius: 7, padding: '8px 16px',
    fontSize: 13, fontWeight: 500, cursor: 'pointer',
    fontFamily: 'inherit',
  },
  sessionNote: {
    display: 'flex', alignItems: 'center', gap: 8,
    fontSize: 12, color: '#6B6258', marginBottom: 24,
    background: '#F5F0E8', padding: '8px 12px', borderRadius: 8,
  },
  sessionDot: {
    width: 6, height: 6, borderRadius: '50%', background: '#7BAF7A',
  },
  code: {
    fontFamily: 'monospace', background: '#EDE6D8',
    padding: '1px 5px', borderRadius: 4, fontSize: 11,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: 16,
  },
  addCard: {
    border: '0.5px dashed rgba(44,40,32,0.2)',
    borderRadius: 10, aspectRatio: '3/4',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    gap: 8, cursor: 'pointer', color: '#A09890',
    transition: 'background 0.15s',
  },
  addIcon: { fontSize: 24 },
  addLabel: { fontSize: 12 },
  dropZone: {
    border: '0.5px dashed rgba(44,40,32,0.2)',
    borderRadius: 12, padding: 60,
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: 10, cursor: 'pointer',
  },
  dropIcon: { fontSize: 40 },
  dropTitle: { fontSize: 16, fontWeight: 500, color: '#2C2820', fontFamily: "'Lora', serif" },
  dropSub: { fontSize: 13, color: '#A09890' },
  empty: { textAlign: 'center', color: '#A09890', padding: 60, fontSize: 14 },
}
