/**
 * Library Page Component
 *
 * Main page for managing a user's PDF library.
 * Displays a grid of books with upload/delete functionality.
 *
 * URL pattern: /s/:sessionId
 * Each session ID represents a separate user's library.
 */

import { useState, useRef, lazy, Suspense } from "react";

import { useParams } from "react-router-dom";

import { useLibrary } from "../hooks/useLibrary";

import BookCard from "../components/BookCard";

const PDFReader = lazy(() => import("../components/PDFReader"));

function PDFReaderFallback() {
  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 100,
      background: "#1A1714",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#A09890"
    }}>
      Loading reader...
    </div>
  );
}

export default function Library() {
  // =============================================================================
  // URL & STATE
  // =============================================================================

  // Extract the session ID from the URL (/s/:sessionId)
  const { sessionId } = useParams();

  // Get all library functions and state from the custom hook
  const { books, isLoading, isUploading, uploadPDF, saveProgress, deleteBook } =
    useLibrary(sessionId);

  // Currently open book (for PDF Reader overlay)
  // null = library view, object = PDF Reader view
  const [activeBook, setActiveBook] = useState(null);

  // Temporary state for "URL copied" feedback message
  const [showCopiedMessage, setShowCopiedMessage] = useState(false);

  // Hidden file input for PDF upload (triggered by button click)
  const fileInputRef = useRef(null);

  // =============================================================================
  // COPY SESSION URL
  // =============================================================================

  /**
   * Copies the current page URL to the clipboard.
   * Users can share this URL to access their library from any device.
   */
  function copySessionURL() {
    navigator.clipboard.writeText(window.location.href);

    // Show "Copied!" feedback for 2 seconds
    setShowCopiedMessage(true);
    setTimeout(() => setShowCopiedMessage(false), 2000);
  }

  // =============================================================================
  // DRAG & DROP UPLOAD
  // =============================================================================

  /**
   * Handles files dropped onto the page.
   * Validates that the dropped file is a PDF before uploading.
   *
   * @param {DragEvent} event - Drag and drop event
   */
  function handleFileDrop(event) {
    // Prevent default browser behavior (don't open the file)
    event.preventDefault();

    // Get the first dropped file
    const droppedFile = event.dataTransfer.files[0];

    // Only process PDF files
    if (droppedFile?.type === "application/pdf") {
      uploadPDF(droppedFile);
    }
  }

  // =============================================================================
  // CONDITIONAL RENDER: PDF READER vs LIBRARY
  // =============================================================================

  // If a book is active, show the PDF Reader overlay instead of library
  if (activeBook) {
    return (
      <Suspense fallback={<PDFReaderFallback />}>
        <PDFReader
          book={activeBook}
          onClose={() => setActiveBook(null)}
          onSaveProgress={saveProgress}
        />
      </Suspense>
    );
  }

  // =============================================================================
  // LIBRARY VIEW (DEFAULT)
  // =============================================================================

  return (
    // Main page container
    // onDragOver: Required to enable drop zone (must prevent default)
    // onDrop: Handle dropped files
    <div
      style={styles.page}
      onDragOver={(event) => event.preventDefault()} // Allow dropping
      onDrop={handleFileDrop} // Process dropped files
    >
      {/* ---------------------------------------------------------- */}
      {/* HEADER: Title, Session URL Copy, Upload Button */}
      {/* ---------------------------------------------------------- */}
      <header style={styles.header}>
        {/* Page title */}
        <h1 style={styles.logo}>📚 Mi biblioteca</h1>

        {/* Right side: copy URL and upload buttons */}
        <div style={styles.headerRight}>
          {/* Button to copy session URL to clipboard */}
          <button style={styles.copyURLButton} onClick={copySessionURL}>
            {showCopiedMessage ? "✓ Copiado" : "🔗 Copiar URL de sesión"}
          </button>

          {/* Primary button to upload new PDF */}
          <button
            style={styles.uploadButton}
            onClick={() => fileInputRef.current.click()} // Trigger hidden file input
            disabled={isUploading} // Disable while uploading
          >
            {isUploading ? "Subiendo…" : "+ Agregar PDF"}
          </button>

          {/* Hidden file input - always accepts PDF files */}
          {/* Triggered by clicking the upload button above */}
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf" // Only show PDF files in file picker
            style={{ display: "none" }} // Hide the input
            onChange={(event) => {
              // Upload the selected file if one was chosen
              if (event.target.files[0]) {
                uploadPDF(event.target.files[0]);
              }
            }}
          />
        </div>
      </header>

      {/* ---------------------------------------------------------- */}
      {/* SESSION INFO BAR */}
      {/* ---------------------------------------------------------- */}
      {/* Shows the session ID (partial for privacy) and helpful text */}
      <div style={styles.sessionInfo}>
        {/* Green dot indicating session is active */}
        <span style={styles.sessionDot} />

        <span>
          Sesión:{" "}
          <code style={styles.sessionCode}>{sessionId.slice(0, 8)}…</code>
        </span>

        {/* Helper text about saving the URL */}
        <span style={{ color: "#A09890" }}>
          — guardá esta URL para acceder desde otros dispositivos
        </span>
      </div>

      {/* ---------------------------------------------------------- */}
      {/* MAIN CONTENT: Books Grid or Empty State */}
      {/* ---------------------------------------------------------- */}
      {isLoading ? (
        /* Loading state while fetching books */
        <div style={styles.emptyState}>Cargando biblioteca…</div>
      ) : books.length === 0 ? (
        /* Empty state - no books yet */
        <div
          style={styles.dropZone}
          onClick={() => fileInputRef.current.click()} // Also clickable to upload
        >
          <div style={styles.dropIcon}>📄</div>
          <p style={styles.dropTitle}>Agregá tu primer PDF</p>
          <p style={styles.dropSubtitle}>
            Hacé clic aquí o arrastrá un archivo
          </p>
        </div>
      ) : (
        /* Books grid - displays all books as cards */
        <div style={styles.booksGrid}>
          {/* Map each book to a BookCard component */}
          {books.map((book) => (
            <BookCard
              key={book.id} // React key for list rendering
              book={book} // Book data object
              onOpen={setActiveBook} // Callback when user clicks to open book
              onDelete={deleteBook} // Callback when user clicks delete
            />
          ))}

          {/* "Add More" card - another way to upload */}
          <div
            style={styles.addBookCard}
            onClick={() => fileInputRef.current.click()}
          >
            <span style={styles.addIcon}>+</span>
            <span style={styles.addLabel}>Agregar PDF</span>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = {
  // Main page container
  page: {
    maxWidth: 900,
    margin: "0 auto",
    padding: "24px 20px",
    fontFamily: "'DM Sans', sans-serif",
    minHeight: "100vh",
  },

  // Header row: title, buttons
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    flexWrap: "wrap",
    gap: 10,
  },

  // App title
  logo: {
    fontFamily: "'Lora', serif",
    fontSize: 22,
    fontWeight: 400,
    color: "#2C2820",
  },

  // Container for header buttons
  headerRight: {
    display: "flex",
    gap: 8,
    alignItems: "center",
  },

  // Secondary button style for copying URL
  copyURLButton: {
    background: "transparent",
    border: "0.5px solid rgba(44,40,32,0.2)",
    borderRadius: 7,
    padding: "8px 14px",
    fontSize: 13,
    cursor: "pointer",
    color: "#6B6258",
    fontFamily: "inherit",
  },

  // Primary button style for uploading PDFs
  uploadButton: {
    background: "#2C2820",
    color: "#F5F0E8",
    border: "none",
    borderRadius: 7,
    padding: "8px 16px",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    fontFamily: "inherit",
  },

  // Session info bar (shows session ID and helper text)
  sessionInfo: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 12,
    color: "#6B6258",
    marginBottom: 24,
    background: "#F5F0E8",
    padding: "8px 12px",
    borderRadius: 8,
  },

  // Green dot indicating active session
  sessionDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#7BAF7A",
  },

  // Monospace text for displaying session ID
  sessionCode: {
    fontFamily: "monospace",
    background: "#EDE6D8",
    padding: "1px 5px",
    borderRadius: 4,
    fontSize: 11,
  },

  // Grid layout for book cards - responsive columns
  booksGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", // Auto-responsive columns
    gap: 16,
  },

  // Card for adding new books - dashed border
  addBookCard: {
    border: "0.5px dashed rgba(44,40,32,0.2)",
    borderRadius: 10,
    aspectRatio: "3/4", // Same aspect ratio as book covers
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    cursor: "pointer",
    color: "#A09890",
    transition: "background 0.15s",
  },

  addIcon: { fontSize: 24 },
  addLabel: { fontSize: 12 },

  // Empty state / drop zone when no books
  dropZone: {
    border: "0.5px dashed rgba(44,40,32,0.2)",
    borderRadius: 12,
    padding: 60,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
    cursor: "pointer",
  },

  dropIcon: { fontSize: 40 },
  dropTitle: {
    fontSize: 16,
    fontWeight: 500,
    color: "#2C2820",
    fontFamily: "'Lora', serif",
  },
  dropSubtitle: { fontSize: 13, color: "#A09890" },

  // Loading / empty text
  emptyState: {
    textAlign: "center",
    color: "#A09890",
    padding: 60,
    fontSize: 14,
  },
};
