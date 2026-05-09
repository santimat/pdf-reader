/**
 * Library Management Hook
 * 
 * This custom React hook handles all library-related operations:
 * - Fetching books from the database
 * - Uploading new PDFs to storage
 * - Saving reading progress
 * - Deleting books
 * 
 * The hook is tied to a specific session ID, which groups books together.
 * Each session represents one user's personal library.
 */

import { useState, useEffect, useCallback } from "react";

// Supabase client for database and storage operations
import { supabase } from "../lib/supabase";

/**
 * Main hook function
 * 
 * @param {string} sessionId - Unique identifier for the user's library session
 * @returns {Object} - Functions and state for library management
 */
export function useLibrary(sessionId) {
  // =============================================================================
  // STATE
  // =============================================================================
  
  // Array of book objects from the database
  const [books, setBooks] = useState([]);
  
  // Loading state - true while fetching books initially
  const [isLoading, setIsLoading] = useState(true);
  
  // Uploading state - true while a PDF is being uploaded
  const [isUploading, setIsUploading] = useState(false);

  // =============================================================================
  // FETCH BOOKS
  // =============================================================================

  /**
   * Fetches all books belonging to the current session from the database.
   * Books are sorted by creation date (newest first).
   * 
   * This function is memoized with useCallback to prevent unnecessary re-renders.
   */
  const fetchBooks = useCallback(async () => {
    // Don't fetch if no session ID (shouldn't happen, but safety check)
    if (!sessionId) return;

    setIsLoading(true);

    // Query Supabase 'books' table
    // .eq("session_id", sessionId) = filter to only this user's books
    // .order("created_at", { ascending: false }) = newest first
    const { data, error } = await supabase
      .from("books")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false });

    // Update state if no error
    if (!error) {
      setBooks(data || []); // Use empty array if data is null
    }

    setIsLoading(false);
  }, [sessionId]);

  // Fetch books when sessionId changes
  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  // =============================================================================
  // UPLOAD PDF
  // =============================================================================

  /**
   * Uploads a new PDF file to Supabase Storage and creates a database entry.
   * 
   * Steps:
   * 1. Upload the file to Supabase Storage bucket "pdfs"
   * 2. Get the public URL for the uploaded file
   * 3. Insert a new record in the "books" table with the URL and metadata
   * 4. Refresh the book list to show the new upload
   * 
   * @param {File} file - The PDF file object from the file input
   */
  async function uploadPDF(file) {
    // Validate inputs
    if (!file || !sessionId) return;

    setIsUploading(true);

    try {
      // Sanitize filename - replace spaces with underscores
      // This prevents issues with special characters in file paths
      const sanitizedFilename = file.name.replace(/ /g, "_");

      // Create storage path: [sessionId]_[filename]
      // This ensures each user's files are namespaced and don't conflict
      const storagePath = `${sessionId}_${sanitizedFilename}`;

      // STEP 1: Upload file to Supabase Storage
      // .upload(path, file, options):
      // - contentType: "application/pdf" ensures proper MIME type
      // - upsert: false = don't overwrite if file exists (will error instead)
      const { error: storageError } = await supabase.storage
        .from("pdfs") // Storage bucket name
        .upload(storagePath, file, {
          contentType: "application/pdf",
          upsert: false,
        });

      // If upload failed, throw the error to be caught
      if (storageError) throw storageError;

      // STEP 2: Get the public URL for the uploaded file
      // This URL can be used in the browser to download/view the file
      const { data: urlData } = supabase.storage
        .from("pdfs")
        .getPublicUrl(storagePath);

      // STEP 3: Create database record for this book
      // This stores metadata about the PDF in the 'books' table
      const { error: dbError } = await supabase.from("books").insert({
        session_id: sessionId,          // Links book to this user's session
        name: file.name.replace(".pdf", ""), // Display name (without extension)
        storage_path: storagePath,       // Path in Supabase Storage
        public_url: urlData.publicUrl,   // Public URL for the file
        size_bytes: file.size,          // File size for display
        current_page: 1,                // Default: start at page 1
        total_pages: null,              // Unknown until PDF is loaded (updated later)
      });

      // If database insert failed, throw the error
      if (dbError) throw dbError;

      // STEP 4: Refresh the book list to show the newly uploaded book
      await fetchBooks();

    } catch (error) {
      // Log error and show user-friendly alert
      console.error("PDF upload error:", error);
      alert("Error al subir el PDF: " + error.message);
    } finally {
      // Always reset uploading state, whether success or failure
      setIsUploading(false);
    }
  }

  // =============================================================================
  // SAVE PROGRESS
  // =============================================================================

  /**
   * Saves the user's reading progress for a book.
   * Called when the user finishes reading a page or closes the reader.
   * 
   * @param {number} bookId - Database ID of the book
   * @param {number} currentPage - Current page number
   * @param {number} totalPages - Total pages in the PDF (may be null initially)
   */
  async function saveProgress(bookId, currentPage, totalPages) {
    // Update the book's record in the database
    await supabase
      .from("books")
      .update({
        current_page: currentPage,              // Current page number
        total_pages: totalPages,                // Total pages (may have been discovered)
        last_read_at: new Date().toISOString(), // Timestamp for "recently read" sorting
      })
      .eq("id", bookId); // Only update the specific book

    // Optimistically update local state so UI reflects the change immediately
    // (instead of waiting for a full database refresh)
    setBooks((previousBooks) =>
      previousBooks.map((book) =>
        book.id === bookId
          ? {
              ...book,
              current_page: currentPage,
              total_pages: totalPages,
            }
          : book,
      ),
    );
  }

  // =============================================================================
  // DELETE BOOK
  // =============================================================================

  /**
   * Deletes a book from storage and database.
   * This action is permanent and cannot be undone.
   * 
   * @param {number} bookId - Database ID of the book to delete
   * @param {string} storagePath - Path of the file in Supabase Storage
   */
  async function deleteBook(bookId, storagePath) {
    // STEP 1: Delete the file from Supabase Storage
    await supabase.storage
      .from("pdfs")
      .remove([storagePath]);

    // STEP 2: Delete the database record
    await supabase
      .from("books")
      .delete()
      .eq("id", bookId);

    // Update local state to remove the deleted book
    // This provides immediate UI feedback without waiting for a refresh
    setBooks((previousBooks) =>
      previousBooks.filter((book) => book.id !== bookId)
    );
  }

  // =============================================================================
  // RETURN
  // =============================================================================

  // Return all state and functions for use in components
  return {
    // State
    books,           // Array of book objects
    isLoading,        // True while initially loading books
    isUploading,      // True while a PDF upload is in progress

    // Functions
    uploadPDF,        // Upload a new PDF file
    saveProgress,    // Save reading progress to database
    deleteBook,       // Delete a book from storage and database
    refetch: fetchBooks, // Manually refresh the book list
  };
}