// Entry point: initialise the schema and start the HTTP server.

import { createApp } from "./app.js";
import { config } from "./config.js";
import { initSchema } from "./db/index.js";

initSchema();

const app = createApp();
app.listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port}`);
  console.log(`API docs at     http://localhost:${config.port}/api/docs`);
});
