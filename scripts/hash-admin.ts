/**
 * Genera la línea ADMIN_PASSWORD_HASH para .env.
 * Uso: npm run hash-admin            (pide la contraseña sin mostrarla; no queda en el historial)
 *      npm run hash-admin -- 'Clave' (alternativa no interactiva)
 */
import bcrypt from "bcryptjs";
import { createInterface } from "node:readline";

function askHidden(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    // Silencia el eco de lo que se escribe.
    (rl as unknown as { _writeToOutput: (s: string) => void })._writeToOutput = (s: string) => {
      if (s.includes(question)) process.stdout.write(s);
    };
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
  });
}

async function main() {
  const pass = process.argv[2] ?? (await askHidden("Contraseña del administrador (no se mostrará): "));
  if (!pass || pass.length < 12) {
    console.error("La contraseña debe tener al menos 12 caracteres.");
    process.exit(1);
  }
  // Next.js expande `$VAR` dentro de .env: los `$` del hash bcrypt deben ir escapados.
  const hash = bcrypt.hashSync(pass, 12).replace(/\$/g, "\\$");
  console.log(`ADMIN_PASSWORD_HASH="${hash}"`);
}

main();
