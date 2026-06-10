// Serveur Node minimal pour servir le build TanStack Start (cible Cloudflare Worker)
// sur un host classique type Coolify, sans Wrangler.
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, "dist");
const clientDir = join(distDir, "client");

// Cherche l'entrée serveur dans tous les emplacements possibles
// (dist/server = preset cloudflare actuel, .output/server = défaut Nitro).
const candidates = [
  join(distDir, "server", "index.mjs"),
  join(distDir, "server", "index.js"),
  join(__dirname, ".output", "server", "index.mjs"),
  join(__dirname, ".output", "server", "index.js"),
];
const serverEntry = candidates.find((p) => existsSync(p));

if (!serverEntry) {
  console.error(
    `[server] Build introuvable. Emplacements testés:\n  - ${candidates.join("\n  - ")}\n` +
      `Lance "bun run build" avant de démarrer (et vide le cache de build Coolify si l'erreur persiste).`
  );
  process.exit(1);
}
console.log(`[server] Entrée serveur: ${serverEntry}`);

// Charge le handler worker (export default { fetch })
const mod = await import(serverEntry);
const worker = mod.default;
if (!worker || typeof worker.fetch !== "function") {
  console.error("[server] L'entrée serveur n'expose pas un handler fetch.");
  process.exit(1);
}

const app = new Hono();

// Assets statiques (immutables, hashés)
app.use(
  "/assets/*",
  serveStatic({
    root: "./dist/client",
    rewriteRequestPath: (path) => path,
  })
);

// Fichiers à la racine de /dist/client (favicon, robots, manifest, images, etc.)
app.use(
  "/*",
  serveStatic({
    root: "./dist/client",
  })
);

// Fallback : tout le reste est délégué au worker (SSR + server functions)
app.all("*", async (c) => {
  const env = process.env;
  return worker.fetch(c.req.raw, env, {
    waitUntil: () => {},
    passThroughOnException: () => {},
  });
});

const port = Number(process.env.PORT) || 3000;
serve({ fetch: app.fetch, port, hostname: "0.0.0.0" }, (info) => {
  console.log(`[server] Listening on http://0.0.0.0:${info.port}`);
});