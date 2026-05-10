/**
 * Home Page Component
 *
 * Landing page that allows users to:
 * 1. Create a new library session (generates a unique session ID)
 * 2. Automatically redirect to an existing session if one is saved in localStorage
 */

import { useEffect } from "react";

// Utility function to create new session (redirects to /s/[uuid])
import { createNewSession } from "../lib/supabase";

export default function Home() {
  /**
   * On component mount, check if there's a saved session in localStorage.
   * If yes, automatically redirect the user to their existing library.
   * This provides a seamless "continue where you left off" experience.
   */
  useEffect(() => {
    const savedSessionId = localStorage.getItem("last_session");
    if (savedSessionId) {
      // Redirect to the saved session's library page
      window.location.href = `/s/${savedSessionId}`;
    }
  }, []); // Empty dependency array = runs only once on mount

  /**
   * Creates a new library session:
   * 1. Generates a random UUID
   * 2. Saves it to localStorage so the user can return later
   * 3. Redirects to the new library page
   */
  function handleCreateNewLibrary() {
    const newSessionId = crypto.randomUUID();
    localStorage.setItem("last_session", newSessionId);
    window.location.href = `/s/${newSessionId}`;
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* App title */}
        <h1 style={styles.title}>PDF Reader</h1>

        {/* Description of the app */}
        <p style={styles.description}>
          Tu biblioteca personal de PDFs, accesible desde cualquier dispositivo
          con solo guardar la URL.
        </p>

        {/* Button to create a new library session */}
        <button style={styles.createButton} onClick={handleCreateNewLibrary}>
          Crear nueva biblioteca →
        </button>

        {/* Helper text for users who already have a session */}
        <p style={styles.helperText}>
          ¿Ya tenés una? Abrí tu URL de sesión directamente.
        </p>
      </div>
    </div>
  );
}

// =============================================================================
// STYLES
// =============================================================================
const styles = {
  // Main page container - centers content vertically and horizontally
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#FDFAF5",
    fontFamily: "'DM Sans', sans-serif",
  },

  // Card container - the white box that holds the main content
  card: {
    background: "#fff",
    border: "0.5px solid rgba(44,40,32,0.12)",
    borderRadius: 14,
    padding: "40px 44px",
    maxWidth: 400,
    textAlign: "center",
  },

  // App title styling
  title: {
    fontFamily: "'Lora', serif",
    fontSize: 26,
    fontWeight: 400,
    color: "#2C2820",
    marginBottom: 12,
  },

  // Description paragraph styling
  description: {
    fontSize: 14,
    color: "#6B6258",
    lineHeight: 1.6,
    marginBottom: 28,
  },

  // Primary button to create new library
  createButton: {
    background: "#2C2820",
    color: "#F5F0E8",
    border: "none",
    borderRadius: 8,
    padding: "12px 24px",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    fontFamily: "inherit",
    width: "100%", // Full width button
    marginBottom: 16,
  },

  // Helper text styling (smaller, lighter color)
  helperText: {
    fontSize: 12,
    color: "#A09890",
  },
};
