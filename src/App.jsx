/**
 * Main Application Component
 * 
 * Sets up routing using React Router. The app has two main routes:
 * - "/" : Home page (create new library)
 * - "/s/:sessionId" : Library page (access existing library by session ID)
 */

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Page components
import Home from "./pages/Home";      // Landing page to create new sessions
import Library from "./pages/Library"; // Page to view/add PDFs for a specific session

export default function App() {
  return (
    /*
     * BrowserRouter: Enables client-side routing (no page reloads when navigating)
     * future: Opt-in flags for React Router v7 compatibility
     */
    <BrowserRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      {/*
       * Routes: Container for all route definitions
       * Route: Defines a path and which component to render
       */}
      <Routes>
        {/* Home page - create new library */}
        <Route path="/" element={<Home />} />

        {/* Library page - access existing library by session ID */}
        {/* :sessionId is a dynamic parameter extracted with useParams() */}
        <Route path="/s/:sessionId" element={<Library />} />

        {/* Catch-all route - redirect any unknown paths to home */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}