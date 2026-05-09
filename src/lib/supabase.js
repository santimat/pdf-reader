/**
 * Supabase Client Configuration
 * 
 * This file initializes the Supabase client used throughout the app
 * to interact with the backend database and file storage.
 */

// Import Supabase client factory
import { createClient } from "@supabase/supabase-js";

// Read environment variables from .env file (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create and export the Supabase client instance
// This client is used to make all database queries and storage operations
export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Extracts the session ID from the current URL's pathname.
 * URLs follow the format: /s/[sessionId]
 * 
 * @returns {string|null} The session ID from URL, or null if not found
 * 
 * @example
 * // For URL: https://app.com/s/abc123-def456-...
 * // Returns: "abc123-def456-..."
 */
export function getSessionIdFromURL() {
  const sessionId = location.pathname.split("/s/")[1];
  return sessionId;
}

/**
 * Creates a new session by generating a random UUID and redirecting
 * the user to a new library page with that session ID.
 * 
 * The session ID is stored in localStorage on the Home page,
 * then this function is called to navigate to the new session.
 */
export function createNewSession() {
  const id = crypto.randomUUID();
  window.location.href = `/s/${id}`;
}