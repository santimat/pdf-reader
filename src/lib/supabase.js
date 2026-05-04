import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

// Genera un UUID v4 simple
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

// Devuelve el session ID de la URL actual
export function getSessionFromURL() {
  const parts = window.location.pathname.split('/')
  const idx = parts.indexOf('s')
  if (idx !== -1 && parts[idx + 1]) return parts[idx + 1]
  return null
}

// Crea una sesión nueva y redirige a /s/[uuid]
export function createNewSession() {
  const id = generateUUID()
  window.location.href = `/s/${id}`
}
