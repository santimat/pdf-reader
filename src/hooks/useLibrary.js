import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useLibrary(sessionId) {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  const fetchBooks = useCallback(async () => {
    if (!sessionId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
    if (!error) setBooks(data || [])
    setLoading(false)
  }, [sessionId])

  useEffect(() => { fetchBooks() }, [fetchBooks])

  async function uploadPDF(file) {
    if (!file || !sessionId) return
    setUploading(true)
    try {
      const path = `${sessionId}/${Date.now()}_${file.name}`
      const { error: storageError } = await supabase.storage
        .from('pdfs')
        .upload(path, file, { contentType: 'application/pdf', upsert: false })
      if (storageError) throw storageError

      const { data: urlData } = supabase.storage.from('pdfs').getPublicUrl(path)

      const { error: dbError } = await supabase.from('books').insert({
        session_id: sessionId,
        name: file.name.replace('.pdf', ''),
        storage_path: path,
        public_url: urlData.publicUrl,
        size_bytes: file.size,
        current_page: 1,
        total_pages: null,
      })
      if (dbError) throw dbError
      await fetchBooks()
    } catch (e) {
      console.error('Upload error', e)
      alert('Error al subir el PDF: ' + e.message)
    } finally {
      setUploading(false)
    }
  }

  async function saveProgress(bookId, page, totalPages) {
    await supabase
      .from('books')
      .update({ current_page: page, total_pages: totalPages, last_read_at: new Date().toISOString() })
      .eq('id', bookId)
    setBooks((prev) =>
      prev.map((b) => (b.id === bookId ? { ...b, current_page: page, total_pages: totalPages } : b))
    )
  }

  async function deleteBook(bookId, storagePath) {
    await supabase.storage.from('pdfs').remove([storagePath])
    await supabase.from('books').delete().eq('id', bookId)
    setBooks((prev) => prev.filter((b) => b.id !== bookId))
  }

  return { books, loading, uploading, uploadPDF, saveProgress, deleteBook, refetch: fetchBooks }
}
