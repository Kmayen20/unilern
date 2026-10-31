/** Uso: npm run hash-admin -- 'MiClaveSegura'  → imprime la línea para ADMIN_PASSWORD_HASH */
import bcrypt from "bcryptjs";

const pass = process.argv[2];
if (!pass || pass.length < 12) {
  console.error("Uso: npm run hash-admin -- '<contraseña de 12+ caracteres>'");
  process.exit(1);
}
// Next.js expande `$VAR` dentro de .env: los `$` del hash bcrypt deben ir escapados.
const hash = bcrypt.hashSync(pass, 12).replace(/\$/g, "\\$");
console.log(`ADMIN_PASSWORD_HASH="${hash}"`);
