-- Ejecutar en el SQL Editor de Supabase

-- Tabla principal de libros
create table books (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  name text not null,
  storage_path text not null,
  public_url text not null,
  size_bytes bigint,
  current_page integer default 1,
  total_pages integer,
  last_read_at timestamptz,
  created_at timestamptz default now()
);

-- Índice para queries por sesión
create index books_session_id_idx on books(session_id);

-- Row Level Security: cualquiera puede leer/escribir su sesión (sin auth)
alter table books enable row level security;

create policy "acceso libre por sesión"
  on books for all
  using (true)
  with check (true);

-- Storage bucket para PDFs
insert into storage.buckets (id, name, public)
values ('pdfs', 'pdfs', true);

-- Política de storage: lectura y escritura pública
create policy "subida pública"
  on storage.objects for insert
  with check (bucket_id = 'pdfs');

create policy "lectura pública"
  on storage.objects for select
  using (bucket_id = 'pdfs');

create policy "borrado pública"
  on storage.objects for delete
  using (bucket_id = 'pdfs');
