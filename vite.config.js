import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";

/**
 * No dev proxy. The browser calls the API's own origin directly, in dev and in
 * production alike, using the absolute `VITE_API_BASE_URL`.
 *
 * The proxy existed to keep dev same-origin for a `SameSite` session cookie.
 * Auth is a bearer token now (see `shared/api/client.js`), and a header the app
 * sets itself is unaffected by the origin it is sent to — so the indirection
 * bought nothing except a dev setup that behaved differently from production.
 *
 * ⚠ It does mean the backend must send CORS headers for this app's origin,
 * including `Access-Control-Allow-Headers: Authorization`. A misconfigured
 * backend shows up as a browser CORS error, not a 401.
 */

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    // Was set at the top level, where Vite ignores it — LAN access from a
    // phone silently never worked. It belongs under `server`.
    host: true,
  },
});
