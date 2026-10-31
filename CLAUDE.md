# UniLern — UniTec

Aplicación web para el proyecto final de **Estándares de Seguridad** (Maestría en Seguridad Informática, UMG): **diseño e implementación de un SGSI** con enfoque basado en riesgos para una organización del **sector educativo (universidad ficticia)**. Esta app, desplegada en AWS, es el ambiente real que se construye (E2), se analiza (E4) y al que se le aplican los controles (E4.6/E5). El enunciado es el PDF `PROYECTO.FINAL.ESTANDARES.DE.SEGURIDAD.2026.pdf` (no está en el repo; manda sobre este archivo si hay contradicción).

## Escenario
- **Organización:** **UniTec**, universidad ficticia.
- **Plataforma:** **UniLern**, reseñas de libros de la comunidad universitaria. Catálogo de **100 libros** (unos 70 académicos de las carreras y 30 de literatura). Estudiantes y docentes inician sesión (Google o correo) y publican **una reseña por libro** con nota 1–10; la nota del catálogo es el promedio. El **equipo de TI / coordinación** administra el catálogo (rol admin).
- **Financiamiento:** presupuesto de la universidad. Sin anunciantes ni espacios de publicidad.
- Historial: empezó como InfoGames.org (videojuegos, organización "Infonet"); se cambió a libros para encajar en el sector educativo del PDF. La base local antigua `infogames` (juegos) quedó sin uso; la actual es `unilern`.

## Requisitos del curso que afectan a la implementación
- **Plataforma:** AWS (una de las tres permitidas).
- **Arquitectura "nube híbrida con soporte para móviles, tablets y computadores":** el equipo lo interpreta como acceso desde cualquier dispositivo → la app es **responsive** (vista móvil 390 px). El PDF también menciona integrar infraestructura local con la nube; si el docente lo exige, se documenta como componente **diseñado** (no implementado).
- **Enfoque de controles: seguridad desde el diseño + tratamiento.**
  1. **E1/E2:** los riesgos se identifican en el diseño y los controles de **bajo o ningún costo** se implementan desde el inicio (RDS privada, SG mínimos, HTTPS, usuario IAM + MFA en la cuenta, política de contraseña fuerte, código seguro, CloudTrail/CloudWatch, backups de RDS + prueba de restauración). En la matriz cuentan como **controles existentes**, con su captura de configuración.
  2. **E4 (NIST SP 800-30, OCTAVE, matriz de calor):** cada riesgo con **inherente** (evaluado sin controles) → controles existentes → **residual**. No hace falta desplegar sin controles para calcular el inherente.
  3. **E4.6/E5 (tratamiento):** lo que siga alto, o los hallazgos que aparezcan después de construir (p. ej. falta de moderación de reseñas), con evidencia de **antes y después**.
  - Lo que cuesta dinero (WAF, GuardDuty, Security Hub/SIEM, EDR, MDM/DLP, Multi-AZ/alta disponibilidad) queda como **diseñado, no implementado**: el PDF exige diferenciarlo.
  - **Narrar los hechos como ocurrieron:** no presentar como "hallazgo posterior" algo que se configuró desde el diseño, ni simular un "antes" que no existió.
- Registro vivo: `docs/riesgos.md` (borrador de riesgos; probabilidad/impacto los asigna el equipo) y `docs/controles.md` (cada control con marco, riesgo, estado y n.º de captura). Actualizarlos al implementar cualquier control.
- **No agregar controles de seguridad sin preguntar** ni sin registrarlos en `docs/controles.md`.
- **Evidencias:** identificadas y relacionadas con lo que demuestran; **sin contraseñas, tokens, claves, secretos ni datos personales reales**. Está prohibido **fabricar o alterar evidencias** (no generar datos ficticios presentándolos como uso real; las capturas de consola las toma el equipo).
- **Uso de IA:** permitido como apoyo; el equipo debe poder explicar y defender cada configuración y declarar las herramientas si el docente lo pide.
- **Cronograma (semanas):** 2 E1 diseño · 3 E2 ambiente · 4 E3+E4.1 · 5 E4.2 BIA · 6 E4.3+E4.4 · 7 E4.5+E4.6 · 8 E5 · 9 E6+E7 · 10 entrega y defensa. El diseño (E1) debe aprobarlo el docente antes de construir.

## Requisitos funcionales
- Visitante sin login: ver catálogo (buscar por título o autor, filtrar por área), detalle de cada libro y sus reseñas.
- Registro / login de usuarios con **Google** o **correo + contraseña** (Amazon Cognito).
- Usuario logueado: deja **una** reseña por libro con nota **1–10** + opinión; puede editarla.
- **Administrador**: credenciales definidas **a nivel de servidor** (variables de entorno, no Cognito). Solo él agrega / modifica / elimina libros.
- Cada libro: **portada** (URL de **Open Library**, `covers.openlibrary.org/b/id/{id}-L.jpg`), **título** (único), **autor**, **área o género**, **calificación** = `AVG(rating)` de las reseñas, calculada automáticamente (el admin nunca la edita; sin reseñas se muestra "Sin calificaciones todavía").
- El catálogo inicia con **100 libros**.

## Arquitectura AWS (cuenta personal, us-east-1, Free Tier)
```
Usuario ──HTTPS──> CloudFront (*.cloudfront.net)
                      └─HTTP─> EC2 t3.micro (Amazon Linux 2023, Nginx :80 → Next.js :3000 con PM2)
                                  ├─> RDS PostgreSQL db.t4g.micro (privada, Single-AZ, 20 GB)
                                  └─> Cognito User Pool (pantallas propias vía API + Google IdP por el dominio de Cognito)
```
- **CloudFront es obligatorio**: Cognito y Google exigen callback HTTPS y no hay dominio propio (sin ACM). Usar la URL `*.cloudfront.net`.
- VPC por defecto. SG de EC2: 80 (CloudFront/0.0.0.0/0) y 22 solo desde la IP del equipo. SG de RDS: 5432 solo desde el SG de EC2.
- CloudFront: `CachingDisabled` + `AllViewer` para rutas dinámicas; caché para `/_next/static/*`.
- **Costos:** todo dentro de capa gratuita / créditos. Evitar NAT Gateway, Multi-AZ, Elastic IP (se cobra aunque la instancia esté apagada) e instancias más grandes. Primer paso en AWS: **Zero spend budget** (`infogames-zero`, avisa con el primer centavo de gasto).
- Apagar cuando no se use: `deploy/stop.sh` / `deploy/start.sh` (EC2 + RDS). RDS detenido se re-enciende solo a los 7 días. Al encender, el DNS público de EC2 cambia → `start.sh` actualiza el origen de CloudFront.
- EC2 tiene 1 GB de RAM: `deploy/setup-ec2.sh` crea **swap de 2 GB** para que `next build` no falle.

## Stack
- **Next.js 15** (App Router) + **TypeScript** + **Tailwind CSS**.
- **Pantallas de cuenta propias** (las del canvas), no la Hosted UI: correo + contraseña llaman a la API de Cognito desde el servidor (`src/lib/cognito.ts`: SignUp, ConfirmSignUp, ForgotPassword, InitiateAuth `USER_PASSWORD_AUTH` con `SECRET_HASH`). Google usa OAuth del dominio de Cognito con `identity_provider=Google`. El app client necesita secreto, `ALLOW_USER_PASSWORD_AUTH`, correo como username y atributo `name`.
- **Auth.js (next-auth v5)**: proveedor `Cognito` para usuarios + proveedor `Credentials` para admin (compara con `ADMIN_USERNAME` y `ADMIN_PASSWORD_HASH` bcrypt; sesión con `role: "admin"`). `middleware.ts` protege `/admin/*` (excepto `/admin/login`); las server actions de admin vuelven a verificar el rol.
- **Prisma** + PostgreSQL. Validación con **zod** en el servidor.
- UI y textos **en español**.

### Estructura
```
prisma/schema.prisma          # Book, Review
prisma/seed.ts                # carga data/books.json (100 libros)
data/books-list.json          # 100 títulos + autor + área (curados a mano; coverId opcional fija la portada)
data/books.json               # generado: + URL de portada de Open Library
scripts/fetch-covers.ts       # API de Open Library → data/books.json (sin API key)
scripts/hash-admin.ts         # genera ADMIN_PASSWORD_HASH
src/auth.ts, src/auth.config.ts, src/middleware.ts
src/lib/db.ts, books.ts, rating.ts, genres.ts, cognito.ts, actions/
src/app/page.tsx              # catálogo
src/app/libros/[id]/page.tsx  # detalle + reseñas + formulario
src/app/acceso/…              # login, crear cuenta, confirmar, recuperar
src/app/admin/page.tsx        # CRUD de libros
src/app/admin/login/page.tsx
src/app/not-found.tsx         # 404
deploy/                       # nginx.conf, ecosystem.config.js, setup-ec2.sh, start.sh, stop.sh (pendiente)
docs/DEPLOY.md                # guía paso a paso en la consola AWS (pendiente)
docs/riesgos.md, docs/controles.md
```

### Modelo de datos
- `Book { id, title (unique), author, genre, imageUrl, createdAt, updatedAt }`
- `Review { id, bookId → Book (onDelete: Cascade), userId (sub de Cognito), userName, rating Int (CHECK 1–10), opinion Text (máx. 1000), createdAt, updatedAt; @@unique([bookId, userId]) }`
- La calificación **no se guarda** en `Book`: se calcula con `_avg` / `groupBy` al consultar. Mostrar con 1 decimal.

### Variables de entorno (`.env`, nunca en git)
`DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL=https://<id>.cloudfront.net`, `AUTH_TRUST_HOST=true`, `AUTH_COGNITO_ID`, `AUTH_COGNITO_SECRET`, `AUTH_COGNITO_ISSUER`, `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` (solo para registrar Google como IdP en Cognito).

### Open Library (portadas)
- API pública sin key: `GET https://openlibrary.org/search.json?title=…&author=…` → `cover_i` → `https://covers.openlibrary.org/b/id/{cover_i}-L.jpg` (responde 302 a archive.org; `next/image` sigue la redirección).
- `next.config` → `images.remotePatterns` para `covers.openlibrary.org`. El admin solo acepta portadas de ese dominio.
- Portadas revisadas a mano: 8 se fijaron con `coverId` (libro equivocado o edición en otro idioma).

## Diseño (aprobado)
Canvas de Claude Design con las 10 vistas (hecho para InfoGames; mismas vistas y estilo, ahora con libros): https://claude.ai/artifact/2BycuEGCPddDGdARe1aZ7k
(Si el canvas y el código no coinciden, manda el canvas; preguntar ante dudas.)

**Estilo: revista / tabla de puntuaciones.** El equipo rechazó una variante "moderna" (esquinas redondeadas, sombras suaves, Bricolage/Geist) por verse genérica de IA: **no volver a ese estilo**.
- **Tipografía:** `Big Shoulders Display` (en Google Fonts/next-font ahora se llama `Big Shoulders`) 800–900 en MAYÚSCULAS para titulares y logo; `IBM Plex Sans` para texto; `IBM Plex Mono` con `tabular-nums` para notas y datos.
- **Formas:** esquinas rectas (sin border-radius), bordes de 2px en tinta, cabecera con borde inferior de 4px, separadores de sección con línea de 2px. Sin degradados, sin emojis, sin sombras difusas.
- **Fondo blanco, sin modo oscuro** (decisión del equipo; `globals.css` desactiva la variante `dark:`). Incluye `/admin/login`, que en el canvas era oscura.
- **Tokens:** `bg #FFFFFF` (el canvas usaba `#E6E9ED`), `surface #F6F7F9`, `ink #0F1B2D`, `muted #4A5568`, `line #C3CAD3`, `accent #E8550F` (texto tinta sobre naranja).
- **Sellos de nota** (cuadrados, mono): `≥ 8` azul `#1F48C9` texto blanco · `5–7.9` ámbar `#F2B705` texto tinta · `< 5` rojo `#B3261E` texto blanco · sin reseñas: "—" con borde punteado.
- Logo: `UNI` + `LERN` en naranja.

### Vistas
1. **Catálogo** (`/`): top 5 mejor calificados (n.º 1 destacado con numeral "01" en contorno), buscador, chips de área, orden (mejor nota / más reseñas / A–Z), grid de portadas 2:3 con sello de nota, paginación, estado "sin resultados".
2. **Detalle** (`/libros/[id]`): portada, título enorme, autor, nota promedio, distribución 1–10 en barras, formulario "Tu reseña" (selector 1–10 + opinión con contador /1000), orden de reseñas (recientes / mejor / peor), "También te puede gustar". Sin sesión: aviso "Inicia sesión para opinar".
3. **Libro sin reseñas:** "—", "Sin calificaciones todavía", "Sé el primero en calificarlo".
4. **Iniciar sesión / Crear cuenta:** panel izquierdo tinta ("Tu nota mueve el promedio.") + pestañas, "Continuar con Google", correo y contraseña, enlace "Acceso para administradores".
5. **Confirmar correo:** código de 6 dígitos (Cognito), reenviar código, cambiar correo.
6. **Recuperar contraseña:** paso 1 correo → paso 2 código + nueva contraseña → listo. Política de contraseña: **fuerte desde el inicio** (8+ caracteres con mayúscula, minúscula, número y carácter especial; el canvas mostraba solo número y mayúscula). Cognito y la validación de la app deben pedir lo mismo.
7. **Login de administrador** (`/admin/login`): pantalla oscura "área restringida", usuario + contraseña del servidor.
8. **Panel de administración** (`/admin`): sidebar tinta, tabla (portada, título y autor, área, nota, reseñas, Editar), formulario agregar/editar con vista previa de portada, calificación bloqueada, eliminar con confirmación (avisa que borra sus reseñas).
9. **404:** "404" en contorno + "Este libro no está en el catálogo" + buscador.
10. **Catálogo móvil** (390 px): misma estructura, grid de 2 columnas, chips con scroll horizontal.

Accesibilidad: botones/enlaces reales, `label` en todos los campos, foco visible naranja, objetivos táctiles ≥ 44 px, contraste ≥ 4.5:1.

## Estado y próximos pasos
1. ✅ Plan de arquitectura y diseño de las 10 vistas.
2. ✅ Entorno local: Node 22, AWS CLI v2, PostgreSQL 16 (Homebrew; no están en el PATH por defecto: `export PATH="/opt/homebrew/opt/node@22/bin:/opt/homebrew/opt/postgresql@16/bin:$PATH"`; Postgres se arranca con `pg_ctl -D /opt/homebrew/var/postgresql@16 start`).
3. ✅ Scaffold Next.js 15 + Tailwind v4 + Prisma 6 + Auth.js v5.
4. ✅ 100 libros con portada de Open Library (`data/books.json`).
5. ✅ Vistas públicas, cuenta y admin. ✅ Cognito funcionando en local: registro con código, login con Google (`nonce`, `prompt=select_account`), vinculación Google ↔ correo con Lambda Pre sign-up `unilern--vincular-cuentas` (código en `aws/lambda/presignup-vincular/`; la app reintenta sola una vez el primer login tras vincular).
6. ✅ App adaptada a libros (UniLern / UniTec), fondo blanco, política de contraseña fuerte en la validación.
7. ✅ AWS desplegado: https://d17jpgxptydxb5.cloudfront.net (CloudFront `E2YXN0CYLZQYWG` + WAF gratuito → EC2 `i-04a8f2894cfa869b4` → RDS `unilern-db`). IDs en `deploy/aws.env` (ignorado); resumen en `docs/ARQUITECTURA.md`. ⏳ `docs/DEPLOY.md` (guía paso a paso) pendiente.
8. Inventario de activos real (IDs de EC2/RDS, IPs, SG) para E4.1, y evidencias para E2.
9. Controles del plan de tratamiento (E4.6/E5) con capturas de antes/después.

**Provisto por el equipo:** ⏳ OAuth Client de Google en un **proyecto nuevo `UniLern`** (consentimiento External en modo Prueba, usuarios de prueba, scopes `openid email profile` en Google; la app pide a Cognito `openid email profile` + `prompt=select_account` y valida `nonce`; origen `https://unilern-unitec.auth.us-east-1.amazoncognito.com`, redirect `https://unilern-unitec.auth.us-east-1.amazoncognito.com/oauth2/idpresponse`). El cliente viejo del proyecto `nextcloud-485615` se borra cuando el nuevo funcione (su secreto se expuso en el chat). ✅ AWS CLI (`aws login`, por ahora con la cuenta root). ✅ Repo privado `https://github.com/Kmayen20/unilern` (rama `main`); EC2 lo clonará con una deploy key de solo lectura.

## Verificación
- Local: 100 libros con portada; login Cognito (callback `localhost`) y Google; crear reseña → el promedio cambia; nota fuera de 1–10 rechazada; segunda reseña del mismo usuario edita la primera; admin crea/edita/elimina libros; `/admin` y sus acciones inaccesibles sin rol admin.
- AWS: flujo completo en `https://<id>.cloudfront.net`; RDS no accesible desde Internet.

## Nota: capturas de pantalla
- **La configuración en AWS y Google la hace el equipo en la consola**; Claude da los pasos y solo usa el CLI para verificaciones de lectura (o cambios que el equipo apruebe explícitamente).
- Mientras se hace la implementación, agregar pasos para tomar una captura y anunciar el **n.º de captura** y su **nombre corto**, con el formato `CAPTURA NN · nombre-corto`, para guardarlas localmente.
- Se guardan en `docs/capturas/NN-nombre-corto.png` (carpeta en `.gitignore`: pueden mostrar IDs de cuenta). Antes de guardar, tapar secretos: client secrets, claves de acceso, contraseñas.
- Cognito: pool `us-east-1_I1oVzy2Af` (Essentials, correo como usuario, `name` requerido, política de contraseña fuerte por defecto), app client `infogames-web`, dominio a crear: **`unilern-unitec`**.
- La numeración sigue en orden; la última captura usada se anota aquí: **26** (`26-cognito-usuario-vinculado`).
