/**
 * Main Application Component
 * 
 * Sets up routing using React Router. The app has two main routes:
 * - "/" : Home page (create new library)
 * - "/s/:sessionId" : Library page (access existing library by session ID)
 */

import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

const Home = lazy(() => import("./pages/Home"));
const Library = lazy(() => import("./pages/Library"));

function LoadingFallback() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#FDFAF5",
      fontFamily: "'DM Sans', sans-serif",
      color: "#6B6258"
    }}>
      Loading...
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/s/:sessionId" element={<Library />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}