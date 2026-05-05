import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Devuelve el session ID de la URL actual
export function getSessionIdFromURL() {
  const sessionId = location.pathname.split("/s/")[1];
  return sessionId;
}

// Crea una sesión nueva y redirige a /s/[uuid]
export function createNewSession() {
  const id = crypto.randomUUID();
  window.location.href = `/s/${id}`;
}
