# Registro de controles (insumo para E2 y E5.2)

Cada control se anota al implementarse. Estado: **Implementado** (con evidencia), **Diseñado** (en la arquitectura, no implementado), **Planificado** (en el plan de tratamiento).
Evidencia: n.º de captura (`docs/capturas/`) o archivo del código. Riesgos: ver `docs/riesgos.md`.

| ID | Control | Marco | Riesgos | Estado | Cómo se implementó | Evidencia |
|---|---|---|---|---|---|---|
| C01 | Alerta de gasto (Zero spend budget `infogames-zero`) | ISO 27002 5.9; COBIT APO06 | R18 | Implementado | AWS Budgets, avisa con el primer gasto > USD 0.01 | CAPTURA 01, 02 |
| C02 | Validación de entradas en el servidor | ISO 27002 8.28 | R10, R14 | Implementado | Esquemas zod en todas las server actions (nota entera 1–10, opinión ≤ 1000, URL de portada solo de dominio permitido) | `src/lib/actions/*.ts` |
| C03 | Consultas parametrizadas | ISO 27002 8.28 | R14 | Implementado | Prisma ORM; sin SQL concatenado | `src/lib/games.ts`, `src/lib/actions/*.ts` |
| C04 | Reglas de integridad en la base de datos | ISO 27002 8.28 | R10 | Implementado | `CHECK (rating BETWEEN 1 AND 10)`, `CHECK (char_length(opinion) BETWEEN 1 AND 1000)`, `UNIQUE (bookId, userId)` | `prisma/migrations/*_init/migration.sql` |
| C05 | Control de acceso al panel de administración en dos capas | ISO 27002 5.15, 8.3; Zero Trust | R03 | Implementado | Middleware protege `/admin/*` y cada server action vuelve a verificar `role === "admin"` | `src/middleware.ts`, `src/lib/actions/admin.ts` |
| C06 | Credencial de administrador almacenada como hash | ISO 27002 5.17, 8.24 | R03, R15 | Implementado | bcrypt (costo 12) en variable de entorno; comparación de usuario en tiempo constante | `src/auth.ts`, `scripts/hash-admin.ts` |
| C07 | Registro de intentos fallidos de administrador | ISO 27002 8.15 | R03, R16 | Implementado (local, en logs de la app) | `console.warn` por cada intento fallido | `src/auth.ts` |
| C08 | Secretos fuera del repositorio | ISO 27002 8.24, 5.17 | R15 | Implementado | `.env` en `.gitignore`; `.env.example` sin valores | `.gitignore`, `.env.example` |
| C09 | Prevención de redirecciones abiertas | ISO 27002 8.28 | R04 | Implementado | Solo se aceptan rutas internas en `volver` | `src/lib/actions/account.ts` |
| C10 | No revelar qué correos tienen cuenta al recuperar contraseña | ISO 27002 8.5 | R02, R12 | Implementado | Mismo mensaje exista o no la cuenta | `src/lib/actions/account.ts` |
| C11 | Verificación de correo al registrarse | ISO 27002 5.16 | R10 | Implementado (Cognito: verificación por código, plantilla en español) | Código de 6 dígitos de Cognito | `src/lib/actions/account.ts` |
| C12 | Vinculación de identidades (Google ↔ correo) con verificación de correo | ISO 27002 5.16, 8.5 | R21 | Implementado (Lambda `unilern--vincular-cuentas`, rol con solo `ListUsers` y `AdminLinkProviderForUser`) | Disparador Pre sign-up: vincula Google a la cuenta confirmada con el mismo correo solo si Google lo da como verificado; bloquea registros con contraseña de correos que ya entran con Google | CAPTURAS 23–26; `aws/lambda/presignup-vincular/` |
| C13 | MFA en root, usuario IAM administrador y CloudTrail | ISO 27002 5.18, 8.2, 8.5, 8.15 | R01, R16 | **No implementado: riesgo aceptado por el equipo** (decisión 2026-10-31); candidato para el plan de tratamiento | — | — |
| C14 | Segmentación de red con Security Groups | ISO 27002 8.20, 8.22; Zero Trust | R05, R06 | Implementado | `unilern-ec2-sg`: 80 solo desde la lista de prefijos de CloudFront (`pl-3b927c52`), 22 solo desde la IP del equipo. `unilern-rds-sg`: 5432 solo desde `unilern-ec2-sg` | CAPTURAS 29, 30 |
| C15 | Base de datos privada | ISO 27002 8.20, 8.22 | R06, R08 | Implementado | RDS `unilern-db` con *Public access = No* | CAPTURA 31 |
| C16 | Respaldos automáticos de la base de datos | ISO 27002 8.13; ISO 22301 | R09, R19 | Implementado (retención 7 días); prueba de restauración pendiente | Backups automáticos de RDS | CAPTURA 32 |
| C17 | Cifrado de datos en reposo | ISO 27002 8.24 | R09, R22 | Implementado | RDS cifrado (`aws/rds`); disco EBS de EC2 cifrado (`aws/ebs`). Hallazgo: la primera instancia se creó con disco sin cifrar; se eliminó y se recreó cifrada | CAPTURAS 32, 35 (antes), nueva captura del disco cifrado (después) |
| C18 | IMDSv2 obligatorio en EC2 | ISO 27002 8.20 | R04 | Implementado | Metadata version: V2 only (token required) | CAPTURA 35 |
