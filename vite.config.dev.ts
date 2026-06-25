import { defineConfig, loadConfigFromFile } from "vite";
import type { ConfigEnv } from "vite";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";
import path from "path";

export default defineConfig(async () => {
  const env: ConfigEnv = { command: "serve", mode: "development" };
  const configFile = path.resolve(__dirname, "vite.config.ts");
  const result = await loadConfigFromFile(env, configFile);
  const userConfig = result?.config;

  return {
    ...userConfig,
    define: {
      ...(userConfig?.define || {})
    },
    css: {
      postcss: {
        plugins: [tailwindcss(), autoprefixer()],
      },
    },
    server: {
      ...(userConfig?.server || {}),
      port: 5173,
      host: true,
    },
  };
});