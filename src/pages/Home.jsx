import { useEffect } from 'react'
import { createNewSession } from '../lib/supabase'

export default function Home() {
  // Si ya hay una sesión guardada en localStorage, redirige directo
  useEffect(() => {
    const saved = localStorage.getItem('last_session')
    if (saved) {
      window.location.href = `/s/${saved}`
    }
  }, [])

  function handleNew() {
    const id = crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36)
    localStorage.setItem('last_session', id)
    window.location.href = `/s/${id}`
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>PDF Reader</h1>
        <p style={styles.sub}>
          Tu biblioteca personal de PDFs, accesible desde cualquier dispositivo
          con solo guardar la URL.
        </p>
        <button style={styles.btn} onClick={handleNew}>
          Crear nueva biblioteca →
        </button>
        <p style={styles.hint}>
          ¿Ya tenés una? Abrí tu URL de sesión directamente.
        </p>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    background: '#FDFAF5', fontFamily: "'DM Sans', sans-serif",
  },
  card: {
    background: '#fff', border: '0.5px solid rgba(44,40,32,0.12)',
    borderRadius: 14, padding: '40px 44px', maxWidth: 400, textAlign: 'center',
  },
  title: {
    fontFamily: "'Lora', serif", fontSize: 26, fontWeight: 400,
    color: '#2C2820', marginBottom: 12,
  },
  sub: { fontSize: 14, color: '#6B6258', lineHeight: 1.6, marginBottom: 28 },
  btn: {
    background: '#2C2820', color: '#F5F0E8',
    border: 'none', borderRadius: 8, padding: '12px 24px',
    fontSize: 14, fontWeight: 500, cursor: 'pointer',
    fontFamily: 'inherit', width: '100%', marginBottom: 16,
  },
  hint: { fontSize: 12, color: '#A09890' },
}
