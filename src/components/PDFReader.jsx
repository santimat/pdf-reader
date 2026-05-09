import { useEffect, useRef, useState, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import "../styles/pdfReader.css";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

const CACHE_NAME = "pdf-reader-v1";
const ZOOM_KEY = "pdf-reader-zoom";

function getSavedZoom() {
  try {
    const zoom = parseFloat(localStorage.getItem(ZOOM_KEY));
    return isNaN(zoom) ? null : zoom;
  } catch {
    return null;
  }
}
function saveZoom(zoom) {
  try {
    localStorage.setItem(ZOOM_KEY, zoom);
  } catch {}
}

function isMobile() {
  return window.innerWidth <= 768;
}

function calcFitScale(viewport, padding = 10) {
  const available = window.innerWidth - padding;
  return available / viewport.width;
}

// Intenta servir desde Cache API, si no descarga y guarda
async function fetchWithCache(url) {
  if (!("caches" in window)) {
    const res = await fetch(url);
    return new Uint8Array(await res.arrayBuffer());
  }
  const cache = await caches.open(CACHE_NAME);
  let cached = await cache.match(url);
  if (!cached) {
    const res = await fetch(url);
    // Clonar antes de consumir — fetch solo permite leer el body una vez
    await cache.put(url, res.clone());
    cached = res;
  }
  return new Uint8Array(await cached.arrayBuffer());
}

export default function PDFReader({ book, onClose, onSaveProgress }) {
  const canvasRef = useRef(null);
  const canvasAreaRef = useRef(null);
  const pdfRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(book.current_page || 1);
  const [totalPages, setTotalPages] = useState(book.total_pages || 0);
  const [scale, setScale] = useState(1.2);
  const [loading, setLoading] = useState(true);
  const [cached, setCached] = useState(false);
  const [toolbarOpen, setToolbarOpen] = useState(!isMobile());
  const saveTimeout = useRef(null);
  const currentPageRef = useRef(book.current_page || 1);
  const totalPagesRef = useRef(book.total_pages || 0);
  const scaleRef = useRef(1.2);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const isScrollingRef = useRef(false);
  const sentinelBottomRef = useRef(null);
  const pageChangingRef = useRef(false);
  const hasScrolledDownRef = useRef(false);

  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);
  useEffect(() => {
    totalPagesRef.current = totalPages;
  }, [totalPages]);
  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  // Renderiza con devicePixelRatio para pantallas retina/HiDPI
  const renderPage = useCallback(async (num, pdf, s) => {
    const doc = pdf || pdfRef.current;
    if (!doc || !canvasRef.current) return;
    setLoading(true);

    const dpr = window.devicePixelRatio || 1;
    const page = await doc.getPage(num);
    const baseViewport = page.getViewport({ scale: s ?? scaleRef.current });

    const canvas = canvasRef.current;
    // Canvas interno al doble/triple de resolución
    canvas.width = Math.floor(baseViewport.width * dpr);
    canvas.height = Math.floor(baseViewport.height * dpr);
    // CSS lo muestra al tamaño lógico
    canvas.style.width = `${Math.floor(baseViewport.width)}px`;
    canvas.style.height = `${Math.floor(baseViewport.height)}px`;

    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);

    await page.render({ canvasContext: ctx, viewport: baseViewport }).promise;
    setLoading(false);
    return true;
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setCached(false);

      // Verificar si ya está en caché antes de descargar
      let isFromCache = false;
      if ("caches" in window) {
        const cache = await caches.open(CACHE_NAME);
        const hit = await cache.match(book.public_url);
        isFromCache = !!hit;
      }

      const data = await fetchWithCache(book.public_url);
      if (cancelled) return;

      setCached(true);
      if (!isFromCache) {
        // Recién cacheado
        console.log("[PDF Cache] Guardado:", book.name);
      } else {
        console.log("[PDF Cache] Servido desde caché:", book.name);
      }

      const pdf = await pdfjsLib.getDocument({ data }).promise;
      if (cancelled) return;
      pdfRef.current = pdf;
      setTotalPages(pdf.numPages);
      totalPagesRef.current = pdf.numPages;

      const firstPage = await pdf.getPage(1);
      const baseViewport = firstPage.getViewport({ scale: 1 });
      const fitScale = calcFitScale(baseViewport);
      const autoScale = isMobile() ? fitScale : Math.max(fitScale, 1.0);
      const autoScaleWithSaved = getSavedZoom() ?? autoScale;
      setScale(autoScaleWithSaved);
      scaleRef.current = autoScaleWithSaved;

      const startPage = book.current_page || 1;
      setCurrentPage(startPage);
      currentPageRef.current = startPage;
      await renderPage(startPage, pdf, autoScaleWithSaved);
      updateLayout();
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [book.public_url]);

  // Re-fit on resize / rotation
  useEffect(() => {
    let timeout;
    async function onResize() {
      clearTimeout(timeout);
      timeout = setTimeout(async () => {
        if (!pdfRef.current) return;
        const page = await pdfRef.current.getPage(currentPageRef.current);
        const baseViewport = page.getViewport({ scale: 1 });
        const fitScale = calcFitScale(baseViewport, isMobile() ? 10 : 25);
        const newScale = isMobile() ? fitScale : Math.max(fitScale, 1.0);
        setScale(newScale);
        scaleRef.current = newScale;
        await renderPage(currentPageRef.current, pdfRef.current, newScale);
      }, 200);
    }
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      clearTimeout(timeout);
    };
  }, []);

  async function goTo(num) {
    if (!pdfRef.current) return;
    const p = Math.max(1, Math.min(num, totalPagesRef.current));
    setCurrentPage(p);
    currentPageRef.current = p;
    if (canvasAreaRef.current) canvasAreaRef.current.scrollTop = 0;
    await renderPage(p, pdfRef.current, scaleRef.current);
    clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      onSaveProgress(book.id, p, totalPagesRef.current);
    }, 800);
  }

  function updateLayout() {
    const el = canvasAreaRef.current;
    if (!el) return;
    const hasScroll = el.scrollHeight > el.clientHeight;
    el.style.justifyContent = hasScroll ? "flex-start" : "center";
  }

  function changeZoom(delta) {
    const newScale =
      Math.round(Math.max(0.4, Math.min(3.0, scaleRef.current + delta)) * 10) /
      10;
    setScale(newScale);
    scaleRef.current = newScale;
    saveZoom(newScale);
    renderPage(currentPageRef.current, pdfRef.current, newScale).then(
      updateLayout,
    );
  }

  useEffect(() => {
    function onKey(e) {
      if (e.key === "ArrowRight" || e.key === "ArrowDown")
        goTo(currentPageRef.current + 1);
      if (e.key === "ArrowLeft" || e.key === "ArrowUp")
        goTo(currentPageRef.current - 1);
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Scroll-based page navigation via IntersectionObserver on sentinel elements
  useEffect(() => {
    const sentinelBottom = sentinelBottomRef.current;
    const area = canvasAreaRef.current;
    if (!sentinelBottom || !area) return;

    // --- Bottom sentinel: advance to next page ---
    const bottomObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (
          entry.isIntersecting &&
          !pageChangingRef.current &&
          currentPageRef.current < totalPagesRef.current &&
          area.scrollHeight > area.clientHeight + 20
        ) {
          pageChangingRef.current = true;
          hasScrolledDownRef.current = false;
          goTo(currentPageRef.current + 1).then(() => {
            setTimeout(() => {
              pageChangingRef.current = false;
            }, 800);
          });
        }
      },
      { root: area, rootMargin: "0px 0px 4px 0px", threshold: 0 },
    );
    bottomObserver.observe(sentinelBottom);

    // --- Top detection: go to previous page ---
    // We use the scroll event but only fire when:
    // 1. User had scrolled down at some point (hasScrolledDownRef = true)
    // 2. scrollTop reaches 0 again (they pulled all the way up)
    // 3. Not in the middle of a programmatic page change
    let lastScrollTop = 0;
    function onScroll() {
      const { scrollTop } = area;

      // Mark that the user has scrolled down meaningfully
      if (scrollTop > 50) {
        hasScrolledDownRef.current = true;
      }

      // Detect reaching top after having scrolled down
      if (
        scrollTop === 0 &&
        lastScrollTop > 0 &&
        hasScrolledDownRef.current &&
        !pageChangingRef.current &&
        currentPageRef.current > 1
      ) {
        pageChangingRef.current = true;
        hasScrolledDownRef.current = false;
        goTo(currentPageRef.current - 1).then(() => {
          // Scroll to bottom of previous page so user can scroll up to go further back
          requestAnimationFrame(() => {
            area.scrollTop = area.scrollHeight;
            setTimeout(() => {
              pageChangingRef.current = false;
            }, 800);
          });
        });
      }

      lastScrollTop = scrollTop;
    }
    area.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      bottomObserver.disconnect();
      area.removeEventListener("scroll", onScroll);
    };
  }, []);

  function onTouchStart(e) {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }

  function onTouchEnd(e) {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
      if (dx < 0) goTo(currentPageRef.current + 1);
      else goTo(currentPageRef.current - 1);
    }
    touchStartX.current = null;
    touchStartY.current = null;
  }

  function onWheel(e) {
    if (mobile) return;
    if (isScrollingRef.current) return;
    const el = canvasAreaRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const atBottom = scrollTop + clientHeight >= scrollHeight - 5;
    const atTop = scrollTop <= 5;

    if (
      e.deltaY > 0 &&
      atBottom &&
      currentPageRef.current < totalPagesRef.current
    ) {
      isScrollingRef.current = true;
      goTo(currentPageRef.current + 1);
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 400);
    } else if (e.deltaY < 0 && atTop && currentPageRef.current > 1) {
      isScrollingRef.current = true;
      goTo(currentPageRef.current - 1);
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 400);
    }
  }

  const progress = totalPages
    ? Math.round((currentPage / totalPages) * 100)
    : 0;
  const mobile = isMobile();

  return (
    <div style={styles.overlay}>
      <div
        style={{
          ...styles.topbar,
          ...(toolbarOpen ? {} : styles.topbarCollapsed),
        }}
      >
        {toolbarOpen && (
          <>
            <button style={styles.backBtn} onClick={onClose}>
              ← Biblioteca
            </button>
            <span style={styles.title}>{book.name}</span>
            <div style={styles.controls}>
              <button style={styles.ctrlBtn} onClick={() => changeZoom(-0.1)}>
                −
              </button>
              <span style={styles.zoomLabel}>{Math.round(scale * 100)}%</span>
              <button style={styles.ctrlBtn} onClick={() => changeZoom(0.1)}>
                +
              </button>
              <div style={styles.divider} />
              <button
                style={styles.ctrlBtn}
                disabled={currentPage <= 1}
                onClick={() => goTo(currentPage - 1)}
              >
                ‹
              </button>
              <span style={styles.pageLabel}>
                {currentPage} / {totalPages || "—"}
              </span>
              <button
                style={styles.ctrlBtn}
                disabled={currentPage >= totalPages}
                onClick={() => goTo(currentPage + 1)}
              >
                ›
              </button>
            </div>
          </>
        )}
        <button
          style={toolbarOpen ? styles.toggleBtn : styles.toggleBtnFloating}
          onClick={() => setToolbarOpen((v) => !v)}
        >
          {toolbarOpen ? "▲" : "▼"}
        </button>
      </div>

      <div style={styles.progressStrip}>
        <div style={{ ...styles.progressFill, width: `${progress}%` }} />
      </div>

      <div
        ref={canvasAreaRef}
        style={{ ...styles.canvasArea }}
        id="canvas-area"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onWheel={onWheel}
      >
        {loading && (
          <div style={styles.loadingMsg}>
            {cached ? "Renderizando…" : "Descargando PDF…"}
          </div>
        )}
        <div
          style={{
            ...styles.canvasWrapper,
            opacity: loading ? 0 : 1,
            transition: "opacity 0.2s",
          }}
        >
          <canvas ref={canvasRef} style={{ display: "block" }} />
        </div>
        {/* Sentinel: becomes visible when user reaches the bottom → next page */}
        <div
          ref={sentinelBottomRef}
          style={{
            width: "100%",
            height: 1,
            flexShrink: 0,
            alignSelf: "flex-end",
          }}
        />
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 100,
    background: "#1A1714",
    display: "flex",
    flexDirection: "column",
  },
  topbar: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 14px",
    background: "#231F1B",
    borderBottom: "0.5px solid rgba(255,255,255,0.08)",
    flexWrap: "wrap",
  },
  topbarCollapsed: {
    padding: 0,
    borderBottom: "none",
    background: "transparent",
    position: "relative",
  },
  backBtn: {
    background: "transparent",
    border: "0.5px solid rgba(255,255,255,0.15)",
    color: "#C8BEB4",
    borderRadius: 6,
    padding: "7px 12px",
    fontSize: 13,
    cursor: "pointer",
    fontFamily: "inherit",
    whiteSpace: "nowrap",
  },
  title: {
    flex: 1,
    fontSize: 13,
    fontWeight: 500,
    color: "#EDE6D8",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    fontFamily: "'Lora', serif",
    minWidth: 0,
  },
  controls: { display: "flex", alignItems: "center", gap: 6, flexShrink: 0 },
  ctrlBtn: {
    width: 34,
    height: 34,
    background: "rgba(255,255,255,0.06)",
    border: "0.5px solid rgba(255,255,255,0.12)",
    borderRadius: 7,
    color: "#C8BEB4",
    fontSize: 16,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "inherit",
  },
  toggleBtn: {
    marginLeft: "auto",
    background: "rgba(255,255,255,0.06)",
    border: "0.5px solid rgba(255,255,255,0.12)",
    borderRadius: 6,
    color: "#A09890",
    fontSize: 10,
    cursor: "pointer",
    padding: "4px 10px",
    fontFamily: "inherit",
  },
  toggleBtnFloating: {
    position: "absolute",
    top: 8,
    right: 12,
    zIndex: 10,
    background: "#231F1B",
    border: "0.5px solid rgba(255,255,255,0.15)",
    borderRadius: 6,
    color: "#A09890",
    fontSize: 10,
    cursor: "pointer",
    padding: "5px 10px",
    fontFamily: "inherit",
  },
  zoomLabel: {
    fontSize: 12,
    color: "#A09890",
    minWidth: 40,
    textAlign: "center",
  },
  pageLabel: {
    fontSize: 12,
    color: "#A09890",
    minWidth: 56,
    textAlign: "center",
  },
  divider: {
    width: 0.5,
    height: 20,
    background: "rgba(255,255,255,0.1)",
    margin: "0 2px",
  },
  progressStrip: {
    height: 2,
    background: "rgba(255,255,255,0.05)",
    flexShrink: 0,
  },
  progressFill: {
    height: "100%",
    background: "#7C6E5A",
    transition: "width 0.4s",
  },
  canvasArea: {
    flex: 1,
    overflowY: "auto",
    overflowX: "hidden",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    WebkitOverflowScrolling: "touch",
    padding: "5px 0",
  },
  canvasWrapper: {
    background: "#fff",
    borderRadius: 3,
    boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
    flexShrink: 0,
  },
  loadingMsg: {
    position: "absolute",
    color: "#A09890",
    fontSize: 14,
    top: "50%",
    left: "50%",
    transform: "translate(-50%,-50%)",
  },
};
