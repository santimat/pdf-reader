# PDF Reader

Biblioteca personal de PDFs sincronizada entre dispositivos via URL de sesión. Sin login.

## Setup en 5 pasos

### 1. Supabase
1. Creá un proyecto en [supabase.com](https://supabase.com) (gratis, sin tarjeta)
2. Andá a **SQL Editor** y ejecutá todo el contenido de `supabase-setup.sql`
3. En **Project Settings → API** copiá:
   - `Project URL`
   - `anon public` key

### 2. Variables de entorno
```bash
cp .env.example .env
```
Completá `.env` con tus valores de Supabase.

### 3. Instalar y correr
```bash
npm install
npm run dev
```

### 4. Deploy (Vercel)
```bash
npm install -g vercel
vercel
```
Agregá las variables de entorno en el dashboard de Vercel.

### 5. Usar
- Abrí la app → se crea tu sesión automáticamente
- La URL `/s/[uuid]` es tu biblioteca
- **Guardala como favorito** o copiala con el botón 🔗
- Desde cualquier dispositivo que tenga esa URL, accedés a todos tus PDFs

## Estructura

```
src/
├── lib/
│   └── supabase.js        # Cliente Supabase + lógica de sesión
├── hooks/
│   ├── useLibrary.js      # CRUD de libros (upload, delete, progress)
│   └── usePDFThumbnail.js # Renderiza thumbnail de portada
├── components/
│   ├── BookCard.jsx       # Tarjeta de libro con thumbnail y progreso
│   └── PDFReader.jsx      # Lector fullscreen con guardado automático
└── pages/
    ├── Home.jsx           # Landing / creación de sesión
    └── Library.jsx        # Vista principal de biblioteca
```

## Features
- Subida de PDFs a Supabase Storage (1 GB gratis)
- Thumbnail automático de portada
- Guardado de página automático (sincronizado en DB)
- Retoma desde donde dejaste en cualquier dispositivo
- Zoom y navegación por teclado (← →)
- Drag & drop para subir PDFs
