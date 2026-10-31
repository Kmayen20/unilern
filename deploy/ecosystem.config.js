// PM2: mantiene Next.js corriendo y lo reinicia si se cae o al reiniciar la instancia.
// Next.js lee las variables de /home/ec2-user/unilern/.env.
module.exports = {
  apps: [
    {
      name: "unilern",
      cwd: "/home/ec2-user/unilern",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000 -H 127.0.0.1",
      env: { NODE_ENV: "production" },
      max_memory_restart: "600M",
      time: true,
    },
  ],
};
