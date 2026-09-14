import { getConfig } from "./config/env.js";
import { createApp } from "./app.js";

async function main() {
  const config = getConfig();
  const server = await createApp(config);

  try {
    await server.listen({
      port: config.API_PORT,
      host: config.API_HOST,
    });

    console.log(`
╔══════════════════════════════════════════════╗
║   Portal de Dados CVM - API                 ║
║   Running on http://${config.API_HOST}:${config.API_PORT}         ║
║   Mode: ${config.USE_MOCK_DATA ? "MOCK DATA" : "DATABRICKS"}                        ║
║   Environment: ${config.NODE_ENV}                 ║
╚══════════════════════════════════════════════╝
    `);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

main();
