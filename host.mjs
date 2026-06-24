// Serveur Node minimal pour servir le build TanStack Start (cible Cloudflare Worker)
// sur un host classique type Coolify, sans Wrangler.
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { readFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, "dist");
const clientDir = join(distDir, "client");

// Cherche l'entrée serveur dans tous les emplacements possibles
// (dist/ssr = @cloudflare/vite-plugin + TanStack Start, dist/server = fallback Nitro/défaut, .output/server = Nitro classique).
const candidates = [
  join(distDir, "server", "server.js"),
  join(distDir, "server", "server.mjs"),
  join(distDir, "ssr", "index.mjs"),
  join(distDir, "ssr", "index.js"),
  join(distDir, "server", "index.mjs"),
  join(distDir, "server", "index.js"),
  join(__dirname, ".output", "server", "index.mjs"),
  join(__dirname, ".output", "server", "index.js"),
];
let serverEntry = candidates.find((p) => existsSync(p));

// Certains hébergeurs lancent la commande de démarrage directement depuis les
// sources sans exécuter le Dockerfile. Dans ce cas, on reconstruit une seule
// fois avant d'abandonner, au lieu de démarrer sans build serveur.
const canRebuild = existsSync(join(__dirname, "package.json")) && existsSync(join(__dirname, "vite.config.ts")) && existsSync(join(__dirname, "src"));

if (!serverEntry && canRebuild) {
  console.log("[server] Build serveur absent, exécution de `bun run build` avant démarrage...");
  const build = spawnSync("bun", ["run", "build"], {
    cwd: __dirname,
    stdio: "inherit",
    env: process.env,
  });

  if (build.status === 0) {
    serverEntry = candidates.find((p) => existsSync(p));
    if (!serverEntry) {
      const { readdirSync } = await import("node:fs");
      const distServer = join(distDir, "server");
      const distSsr = join(distDir, "ssr");
      const listDir = (d) => { try { return readdirSync(d).join(", "); } catch { return "(absent)"; } };
      console.error(`[server] dist/server: ${listDir(distServer)}`);
      console.error(`[server] dist/ssr: ${listDir(distSsr)}`);
    }
  } else {
    console.error(`[server] La reconstruction a échoué avec le code ${build.status ?? "inconnu"}.`);
  }
} else if (!serverEntry) {
  console.error("[server] Build serveur absent et sources de reconstruction absentes dans l'image runtime.");
}

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