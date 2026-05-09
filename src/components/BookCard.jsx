/**
 * BookCard Component
 * 
 * Displays a single PDF book as a card with:
 * - Thumbnail (generated from first page of PDF)
 * - Book name
 * - Reading progress bar
 * - Page info ("Página X de Y" or "Sin empezar")
 * - Open and Delete buttons
 * 
 * PERFORMANCE: Memoized with React.memo to prevent re-renders when parent updates
 * but this card's props haven't changed. This is critical for libraries
 * with many books.
 */

import { useMemo, memo } from 'react'
import { usePDFThumbnail } from '../hooks/usePDFThumbnail'

/**
 * BookCard Component - memoized for performance
 * 
 * Uses React.memo to only re-render when book data actually changes.
 * The useMemo hook calculates progress percentage only when needed.
 * 
 * @param {Object} props
 * @param {Object} props.book - Book data object from database
 * @param {Function} props.onOpen - Callback when user wants to open the book
 * @param {Function} props.onDelete - Callback when user wants to delete the book
 */
const BookCard = memo(function BookCard({ book, onOpen, onDelete }) {
  // =============================================================================
  // THUMBNAIL GENERATION
  // =============================================================================

  // Custom hook that generates a thumbnail image from the PDF's public URL
  // Uses caching - will return immediately if thumbnail was already generated
  const thumbnailImage = usePDFThumbnail(book.public_url)

  // =============================================================================
  // READING PROGRESS (memoized to avoid recalculating)
  // =============================================================================

  // Calculate reading progress as a percentage
  // Only recalculates when current_page or total_pages changes
  // useMemo prevents this calculation on every parent re-render
  const progressPercentage = useMemo(() => {
    return book.total_pages
      ? Math.round((book.current_page / book.total_pages) * 100)
      : null
  }, [book.current_page, book.total_pages])

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <div style={styles.card}>
      {/* ---------------------------------------------------------- */}
      {/* THUMBNAIL / COVER IMAGE */}
      {/* ---------------------------------------------------------- */}
      {/* Clicking the thumbnail opens the PDF reader */}
      <div style={styles.thumbnail} onClick={() => onOpen(book)}>
        {/* Show thumbnail image if available */}
        {thumbnailImage ? (
          <img 
            src={thumbnailImage} 
            alt={book.name} 
            style={styles.thumbnailImage} 
            loading="lazy" // Native lazy loading for better performance
          />
        ) : (
          /* Show placeholder icon while thumbnail generates */
          <div style={styles.thumbnailPlaceholder}>📄</div>
        )}
      </div>

      {/* ---------------------------------------------------------- */}
      {/* BOOK INFO: Name, Progress Bar, Page Info */}
      {/* ---------------------------------------------------------- */}
      <div style={styles.info}>
        {/* Book name - truncated if too long */}
        <p style={styles.bookName} title={book.name}>
          {book.name}
        </p>

        {/* Progress bar - only shown if book has been started */}
        {progressPercentage !== null && (
          <div style={styles.progressBarContainer}>
            <div
              style={{
                ...styles.progressBar,
                width: `${progressPercentage}%`,
              }}
            />
          </div>
        )}

        {/* Page progress text */}
        <p style={styles.pageInfo}>
          {book.current_page > 1
            ? `Página ${book.current_page}${book.total_pages ? ` de ${book.total_pages}` : ''}`
            : 'Sin empezar'}
        </p>
      </div>

      {/* ---------------------------------------------------------- */}
      {/* ACTION BUTTONS: Open and Delete */}
      {/* ---------------------------------------------------------- */}
      <div style={styles.actions}>
        {/* Primary button: Open book in PDF reader */}
        <button
          style={styles.openButton}
          onClick={() => onOpen(book)}
        >
          Abrir
        </button>

        {/* Secondary button: Delete book */}
        <button
          style={styles.deleteButton}
          onClick={() => onDelete(book.id, book.storage_path)}
        >
          ✕
        </button>
      </div>
    </div>
  )
})

// Export the memoized component
export default BookCard

// =============================================================================
// STYLES
// =============================================================================

const styles = {
  // Main card container
  card: {
    background: '#fff',
    border: '0.5px solid rgba(44,40,32,0.12)',
    borderRadius: 10,
    overflow: 'hidden', // Clip child elements to border radius
    display: 'flex',
    flexDirection: 'column',
    cursor: 'default',
    transition: 'box-shadow 0.15s', // Subtle hover effect ready
  },

  // Thumbnail / cover image container
  thumbnail: {
    width: '100%',
    aspectRatio: '3/4', // Portrait orientation, like a book cover
    background: '#F5F0E8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer', // Pointer cursor to indicate clickable
    overflow: 'hidden', // Clip image to container
  },

  // Thumbnail image - covers entire container
  thumbnailImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover', // Maintain aspect ratio, fill container
  },

  // Placeholder when thumbnail is loading/failed
  thumbnailPlaceholder: {
    fontSize: 36,
    opacity: 0.4, // Muted appearance
  },

  // Info section: name, progress, page info
  info: {
    padding: '10px 12px 6px',
    flex: 1, // Fill remaining space
  },

  // Book name text
  bookName: {
    fontSize: 13,
    fontWeight: 500,
    color: '#2C2820',
    whiteSpace: 'nowrap', // Don't wrap to second line
    overflow: 'hidden', // Hide overflow
    textOverflow: 'ellipsis', // Show "..." for truncated text
    margin: 0,
    marginBottom: 6,
  },

  // Progress bar background (full width)
  progressBarContainer: {
    height: 3,
    background: '#EDE6D8',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 5,
  },

  // Progress bar fill (width set dynamically)
  progressBar: {
    height: '100%',
    background: '#7C6E5A',
    borderRadius: 2,
    transition: 'width 0.3s', // Smooth width animation
  },

  // Page info text (e.g., "Página 5 de 20")
  pageInfo: {
    fontSize: 11,
    color: '#A09890',
    margin: 0,
  },

  // Actions row with buttons
  actions: {
    display: 'flex',
    gap: 6,
    padding: '8px 12px',
    borderTop: '0.5px solid rgba(44,40,32,0.08)', // Subtle separator line
  },

  // Open book button (primary style)
  openButton: {
    flex: 1, // Take remaining horizontal space
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

  // Delete book button (secondary/ghost style)
  deleteButton: {
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