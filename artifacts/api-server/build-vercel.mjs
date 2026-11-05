// Assembles a Vercel Build Output API (v3) bundle in <repo>/.vercel/output:
//   static/      -> the built Gyara Vite SPA (artifacts/gyara/dist)
//   functions/api.func -> the Express API server bundled into one file
//   config.json  -> routing: /api/* -> Express, real files -> served as-is,
//                   everything else -> index.html (client-side routing)
//
// Run after `pnpm --filter @workspace/gyara run build`.
// Docs: https://vercel.com/docs/build-output-api/v3
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { cp, mkdir, rm, writeFile, access } from "node:fs/promises";
import { build as esbuild } from "esbuild";

globalThis.require = createRequire(import.meta.url);

const apiDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(apiDir, "..", "..");
const gyaraDist = path.resolve(repoRoot, "artifacts", "gyara", "dist");
const outputDir = path.resolve(repoRoot, ".vercel", "output");
const staticDir = path.join(outputDir, "static");
const funcDir = path.join(outputDir, "functions", "api.func");

async function main() {
  try {
    await access(path.join(gyaraDist, "index.html"));
  } catch {
    throw new Error(
      `Frontend build not found at ${gyaraDist}. Run the Gyara Vite build first.`,
    );
  }

  await rm(outputDir, { recursive: true, force: true });
  await mkdir(funcDir, { recursive: true });

  // 1. Static SPA files
  await cp(gyaraDist, staticDir, { recursive: true });

  // 2. Express API as a single Node.js serverless function.
  //    Entry is app.ts (exports the Express app; no app.listen()).
  await esbuild({
    entryPoints: [path.resolve(apiDir, "src", "app.ts")],
    outfile: path.join(funcDir, "index.mjs"),
    platform: "node",
    target: "node22",
    format: "esm",
    bundle: true,
    logLevel: "info",
    // Logger skips the pino-pretty worker transport in production.
    define: { "process.env.NODE_ENV": '"production"' },
    // CJS-only deps (e.g. express) bundled into ESM need these globals.
    banner: {
      js: `import { createRequire as __bannerCrReq } from 'node:module';
import __bannerPath from 'node:path';
import __bannerUrl from 'node:url';
globalThis.require = __bannerCrReq(import.meta.url);
globalThis.__filename = __bannerUrl.fileURLToPath(import.meta.url);
globalThis.__dirname = __bannerPath.dirname(globalThis.__filename);
`,
    },
  });

  await writeFile(
    path.join(funcDir, ".vc-config.json"),
    JSON.stringify(
      {
        runtime: "nodejs22.x",
        handler: "index.mjs",
        launcherType: "Nodejs",
        shouldAddHelpers: true,
      },
      null,
      2,
    ),
  );

  // 3. Routing
  const config = {
    version: 3,
    routes: [
      // API requests go to the Express function (it mounts its router at /api).
      { src: "^/api(?:/.*)?$", dest: "/api" },
      // Long-cache hashed Vite assets.
      {
        src: "^/assets/(.*)$",
        headers: { "cache-control": "public, max-age=31536000, immutable" },
        continue: true,
      },
      // Serve real files (JS, CSS, images, index.html) when they exist.
      { handle: "filesystem" },
      // A missing hashed asset should 404, not return HTML.
      { src: "^/assets/.*$", status: 404 },
      // Everything else is a client-side route: serve the SPA shell.
      { src: "^/.*$", dest: "/index.html" },
    ],
  };
  await writeFile(
    path.join(outputDir, "config.json"),
    JSON.stringify(config, null, 2),
  );

  console.log(`Vercel build output written to ${outputDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
