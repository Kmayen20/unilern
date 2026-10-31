# Borrador de riesgos (insumo para E4.3 / E4.4 / E4.5)

Identificados sobre la arquitectura real: CloudFront → EC2 (Next.js) → RDS PostgreSQL, Cognito + Google, administrador definido en el servidor.
Referencia: NIST SP 800-30 (activo, amenaza, vulnerabilidad). Los controles citan ISO/IEC 27002:2022.

**Lo completa el equipo:** probabilidad (P) e impacto (I) en escala 1–5, riesgo inherente (P × I, evaluado **sin** controles), controles existentes (ver `docs/controles.md`) y riesgo residual. Los criterios de cada nivel se definen en la matriz de calor (E4.5).

| ID | Activo | Amenaza | Vulnerabilidad | Control posible (ISO 27002) | P | I | Inherente | Controles existentes | Residual |
|---|---|---|---|---|---|---|---|---|---|
| R01 | Cuenta de AWS | Robo de credenciales / phishing del usuario root | Administración con root; sin MFA en la cuenta | Usuario IAM con mínimo privilegio, MFA en root (5.18, 8.2) | | | | | |
| R02 | Cuentas de estudiantes y docentes (Cognito) | Fuerza bruta / credential stuffing | Contraseñas débiles; sin MFA | Política fuerte, MFA TOTP (5.17, 8.5) | | | | | |
| R03 | Acceso de administrador | Fuerza bruta contra `/admin/login` | Una sola credencial en variables de entorno; sin bloqueo, MFA ni límite de intentos | Bloqueo por intentos, alarma (8.5, 8.16) | | | | | |
| R04 | Sesiones | Robo o falsificación de sesión | Con `AUTH_SECRET` se pueden fabricar sesiones de admin; sesiones de 7 días; cerrar sesión no revoca | Secretos en SSM Parameter Store, rotación, sesiones más cortas (8.24, 5.17) | | | | | |
| R05 | Servidor EC2 | Acceso SSH no autorizado | Puerto 22 abierto; llave privada en equipo personal | Session Manager en lugar de SSH (8.20, 8.2) | | | | | |
| R06 | Servidor EC2 | Acceso directo saltándose CloudFront | Puerto 80 abierto a Internet; HTTP sin cifrar entre CloudFront y EC2 | Restringir SG a la lista de prefijos de CloudFront (8.20, 8.22) | | | | | |
| R07 | Disponibilidad del sitio | DoS, bots, abuso del optimizador de imágenes | Sin WAF; una instancia de 1 GB | WAF (diseñado), límite de solicitudes (8.6, 8.20) | | | | | |
| R08 | Configuración en AWS | Error humano (p. ej. RDS pública) | Configuración manual en consola, sin control de cambios | Gestión de cambios ITIL, revisión de configuración (8.9, 8.32) | | | | | |
| R09 | Base de datos (reseñas) | Pérdida por borrado, corrupción o falla | Single-AZ; borrar un elemento del catálogo borra sus reseñas en cascada; respaldos sin probar | Backups automáticos, snapshot, prueba de restauración (8.13; ISO 22301) | | | | | |
| R10 | Integridad del promedio | Cuentas masivas o reseñas falsas | Registro abierto sin CAPTCHA | Verificación de correo (existente); CAPTCHA o dominio institucional (5.15) | | | | | |
| R11 | Reputación de la universidad | Reseñas ofensivas o inapropiadas | **El administrador no puede moderar ni borrar reseñas** | Función de moderación, política de uso aceptable (5.10) | | | | | |
| R12 | Datos personales | Exposición de correos y nombres | Sin política de privacidad ni clasificación de la información | Política de privacidad, clasificación (5.12, 5.34) | | | | | |
| R13 | Registro de usuarios | Imposibilidad de crear cuentas | Correo por defecto de Cognito limitado a ~50 envíos/día | SES (diseñado); documentar como límite de capacidad (8.6) | | | | | |
| R14 | Aplicación | Explotación de vulnerabilidades conocidas | Avisos en `npm audit`; `next-auth` en versión beta | Gestión de parches (8.8) | | | | | |
| R15 | Secretos | Filtración | Secretos compartidos por canales inseguros; `.env` en el equipo del desarrollador | Rotación, política de manejo de secretos (5.17, 8.24) | | | | | |
| R16 | Detección de incidentes | Ataque no detectado | Sin CloudTrail, alarmas ni logs centralizados | CloudTrail, CloudWatch, alarmas (8.15, 8.16; NIST CSF DE) | | | | | |
| R17 | Servicios de terceros | Caída o cambio de proveedor de portadas / Google | Dependencia externa sin alternativa | Aceptar y documentar (5.19–5.22) | | | | | |
| R18 | Finanzas | Cargos inesperados en cuenta personal | Recursos con costo olvidados encendidos | Zero spend budget, procedimiento de apagado (5.9) | | | | | |
| R19 | Continuidad del servicio | Caída prolongada | Sin alta disponibilidad; DNS de EC2 cambia al encender; RDS se reactiva sola a los 7 días | BCP/DRP con RTO/RPO (ISO 22301; 5.29, 5.30) | | | | | |
| R20 | Equipo del desarrollador | Robo o malware | Sesión de AWS, `.env` y base local en la Mac | Cifrado de disco, bloqueo, EDR (diseñado) (8.1) | | | | | |
| R21 | Identidad de los usuarios | Una misma persona con dos identidades (correo y Google) | Cognito crea usuarios separados para el mismo correo si se registra con contraseña y luego entra con Google; las reseñas quedan repartidas y se puede reseñar dos veces el mismo libro | Vincular cuentas con un disparador Pre sign-up (Lambda + `AdminLinkProviderForUser`) o permitir un solo método (5.16) | | | | | |
| R22 | Disco del servidor EC2 | Lectura de datos del volumen o de sus snapshots | Volumen EBS sin cifrar (RDS sí está cifrado) | Cifrado de EBS por defecto en la región y volumen cifrado (8.24) | | | | | |
