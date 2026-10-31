#!/usr/bin/env bash
# Preparación de la instancia EC2 (Amazon Linux 2023). Ejecutar como ec2-user:  bash setup-ec2.sh
# Es idempotente: se puede volver a correr. La primera vez se detiene para que registres la deploy key en GitHub.
set -euo pipefail
REPO="git@github.com:Kmayen20/unilern.git"
APP_DIR="$HOME/unilern"

echo "== 1/6 Swap"
if ! swapon --show | grep -q /swapfile; then
  sudo dd if=/dev/zero of=/swapfile bs=1M count=2048 status=none
  sudo chmod 600 /swapfile && sudo mkswap /swapfile >/dev/null && sudo swapon /swapfile
  grep -q /swapfile /etc/fstab || echo '/swapfile swap swap defaults 0 0' | sudo tee -a /etc/fstab >/dev/null
fi

echo "== 2/6 Paquetes (tarda unos minutos)"
sudo dnf install -y git nginx
if ! command -v node >/dev/null || [[ "$(node -v)" != v22* ]]; then
  curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash - >/dev/null
  sudo dnf install -y nodejs
fi
command -v pm2 >/dev/null || sudo npm install -g pm2

echo "== 3/6 Deploy key"
mkdir -p ~/.ssh && chmod 700 ~/.ssh
if [[ ! -f ~/.ssh/unilern_deploy ]]; then
  ssh-keygen -q -t ed25519 -N "" -f ~/.ssh/unilern_deploy -C "unilern-ec2-deploy"
fi
grep -q "unilern_deploy" ~/.ssh/config 2>/dev/null || printf 'Host github.com\n  IdentityFile ~/.ssh/unilern_deploy\n  IdentitiesOnly yes\n' >> ~/.ssh/config
chmod 600 ~/.ssh/config
grep -q "^github.com" ~/.ssh/known_hosts 2>/dev/null || ssh-keyscan -t ed25519 github.com >> ~/.ssh/known_hosts 2>/dev/null

if [[ ! -d "$APP_DIR/.git" ]]; then
  if ! git ls-remote "$REPO" >/dev/null 2>&1; then
    echo
    echo ">>> Registra esta llave pública en GitHub (repo → Settings → Deploy keys → Add deploy key, SIN 'Allow write access'):"
    echo
    cat ~/.ssh/unilern_deploy.pub
    echo
    echo ">>> Luego vuelve a correr: bash setup-ec2.sh"
    exit 0
  fi
  echo "== 4/6 Repositorio"
  git clone -q "$REPO" "$APP_DIR"
else
  echo "== 4/6 Repositorio"
fi

echo "== 5/6 Nginx"
sudo cp "$APP_DIR/deploy/nginx.conf" /etc/nginx/conf.d/unilern.conf
sudo nginx -t -q
sudo systemctl enable --now nginx >/dev/null 2>&1
sudo systemctl reload nginx

echo "== 6/6 PM2"
sudo env PATH="$PATH" pm2 startup systemd -u ec2-user --hp "$HOME" >/dev/null

echo
if [[ ! -f "$APP_DIR/.env" ]]; then
  echo "Listo. Falta crear $APP_DIR/.env (ver docs/DEPLOY.md) y luego correr: bash $APP_DIR/deploy/update.sh"
else
  echo "Listo. Para desplegar: bash $APP_DIR/deploy/update.sh"
fi
