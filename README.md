# PDF Reader

Biblioteca personal de PDFs sincronizada entre dispositivos via URL de sesión. Sin login, sin registro.

## Demo

> Tu biblioteca accessible desde cualquier dispositivo con solo guardar la URL de sesión.

## Características

- **Sin cuenta** - Solo necesitás guardar tu URL de sesión
- **Sincronización** - Subí un PDF desde tu PC, leé desde tu celular
- **Portada automática** - Genera thumbnail de la primera página
- **Progreso guardado** - Retomá desde donde dejaste en cualquier dispositivo
- **Zoom** - Controles +/− y atajos de teclado (← →)
- **Subida múltiple** - Arrastrá archivos o usá el botón
- **Diseño responsivo** - Funciona en desktop y móvil

## Estructura del Proyecto

```
src/
├── lib/
│   └── supabase.js           # Cliente Supabase
├── hooks/
│   ├── useLibrary.js         # CRUD de libros + progreso
│   └── usePDFThumbnail.js    # Thumbnail de portada
├── components/
│   ├── BookCard.jsx          # Tarjeta con thumbnail y progreso
│   └── PDFReader.jsx         # Lector fullscreen
└── pages/
    ├── Home.jsx              # Landing + crear sesión
    └── Library.jsx           # Biblioteca principal
```

## Uso

1. Abrí la app → se crea tu sesión automáticamente
2. La URL `/s/[uuid]` es tu biblioteca
3. **Guardala como favorito** o copiala con el botón
4. Desde cualquier dispositivo con esa URL, accedés a todos tus PDFs
