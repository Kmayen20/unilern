#!/usr/bin/env bash
# Despliega la última versión de main en la instancia EC2. Ejecutar como ec2-user:  bash ~/unilern/deploy/update.sh
set -euo pipefail
cd "$HOME/unilern"
[[ -f .env ]] || { echo "Falta .env (ver docs/DEPLOY.md)"; exit 1; }

git pull --ff-only
npm ci --no-audit --no-fund
npx prisma migrate deploy
NODE_OPTIONS="--max-old-space-size=1536" npm run build
pm2 startOrReload deploy/ecosystem.config.js --update-env
pm2 save >/dev/null
echo "Desplegado: $(git log -1 --format='%h %s')"
