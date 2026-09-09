import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

function d1DevPlugin(): Plugin {
  return {
    name: 'd1-dev-server',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url && req.url.startsWith('/api')) {
          try {
            const { handleD1ApiRequest } = await import('./src/server/d1DevServer');
            const handled = await handleD1ApiRequest(req, res);
            if (handled) return;
          } catch (err) {
            console.error('[D1 Dev Server] Request error:', err);
          }
        }
        next();
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "0.0.0.0",
    port: 3000,
    allowedHosts: true,
  },
  plugins: [
    react(),
    d1DevPlugin(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});

