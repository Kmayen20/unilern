# UniLern — UniTec

Plataforma de reseñas de libros de la universidad ficticia UniTec (proyecto final de Estándares de Seguridad, UMG).
Requisitos, arquitectura, diseño y estado del proyecto: ver `CLAUDE.md`.

## Desarrollo local
```bash
cp .env.example .env            # completar valores (nunca subir .env)
npm install
npx prisma migrate dev          # crea las tablas (con CHECK de nota 1–10)
npm run fetch-covers            # opcional: regenera data/books.json desde Open Library
npm run db:seed                 # carga los 100 libros
npm run hash-admin -- 'Clave'   # línea ADMIN_PASSWORD_HASH para .env
npm run dev
```

## Documentos del SGSI
- `docs/riesgos.md`: borrador de riesgos (NIST SP 800-30).
- `docs/controles.md`: registro de controles con su evidencia.
- `aws/`: código y políticas de recursos de AWS (Lambda de vinculación de cuentas).
