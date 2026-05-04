import { usePDFThumbnail } from '../hooks/usePDFThumbnail'

export default function BookCard({ book, onOpen, onDelete }) {
  const thumbnail = usePDFThumbnail(book.public_url)
  const progress = book.total_pages
    ? Math.round((book.current_page / book.total_pages) * 100)
    : null

  return (
    <div style={styles.card}>
      <div style={styles.thumb} onClick={() => onOpen(book)}>
        {thumbnail
          ? <img src={thumbnail} alt={book.name} style={styles.thumbImg} />
          : <div style={styles.thumbPlaceholder}>📄</div>
        }
      </div>
      <div style={styles.info}>
        <p style={styles.name} title={book.name}>{book.name}</p>
        {progress !== null && (
          <div style={styles.progressWrap}>
            <div style={{ ...styles.progressBar, width: `${progress}%` }} />
          </div>
        )}
        <p style={styles.meta}>
          {book.current_page > 1
            ? `Página ${book.current_page}${book.total_pages ? ` de ${book.total_pages}` : ''}`
            : 'Sin empezar'}
        </p>
      </div>
      <div style={styles.actions}>
        <button style={styles.openBtn} onClick={() => onOpen(book)}>Abrir</button>
        <button style={styles.deleteBtn} onClick={() => onDelete(book.id, book.storage_path)}>✕</button>
      </div>
    </div>
  )
}

const styles = {
  card: {
    background: '#fff',
    border: '0.5px solid rgba(44,40,32,0.12)',
    borderRadius: 10,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    cursor: 'default',
    transition: 'box-shadow 0.15s',
  },
  thumb: {
    width: '100%',
    aspectRatio: '3/4',
    background: '#F5F0E8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    overflow: 'hidden',
  },
  thumbImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  thumbPlaceholder: {
    fontSize: 36,
    opacity: 0.4,
  },
  info: {
    padding: '10px 12px 6px',
    flex: 1,
  },
  name: {
    fontSize: 13,
    fontWeight: 500,
    color: '#2C2820',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    margin: 0,
    marginBottom: 6,
  },
  progressWrap: {
    height: 3,
    background: '#EDE6D8',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 5,
  },
  progressBar: {
    height: '100%',
    background: '#7C6E5A',
    borderRadius: 2,
    transition: 'width 0.3s',
  },
  meta: {
    fontSize: 11,
    color: '#A09890',
    margin: 0,
  },
  actions: {
    display: 'flex',
    gap: 6,
    padding: '8px 12px',
    borderTop: '0.5px solid rgba(44,40,32,0.08)',
  },
  openBtn: {
    flex: 1,
    background: '#2C2820',
    color: '#F5F0E8',
    border: 'none',
    borderRadius: 6,
    padding: '6px 0',
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  deleteBtn: {
    background: 'transparent',
    border: '0.5px solid rgba(44,40,32,0.15)',
    borderRadius: 6,
    padding: '6px 10px',
    fontSize: 12,
    color: '#A09890',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
}
