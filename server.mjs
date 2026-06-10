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
const serverEntryMjs = join(distDir, "server", "index.mjs");
const serverEntryJs = join(distDir, "server", "index.js");
const serverEntry = existsSync(serverEntryMjs) ? serverEntryMjs : serverEntryJs;

if (!existsSync(serverEntry)) {
  console.error(`[server] Build introuvable: ${serverEntryMjs}. Lance "bun run build" d'abord.`);
  process.exit(1);
}

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