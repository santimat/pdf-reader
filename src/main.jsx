/**
 * Application Entry Point
 * 
 * This file is the main entry point for the React application.
 * It renders the root App component into the DOM element with id="root".
 */

// Import React core functionality
import React from 'react'

// Import React DOM's createRoot method for rendering
import ReactDOM from 'react-dom/client'

// Import the main App component (contains all routes)
import App from './App'

// Create a root container and render the React application
// StrictMode adds extra development checks (double rendering in dev mode)
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)