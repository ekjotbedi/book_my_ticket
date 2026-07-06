// Initialise the database schema. Safe to run repeatedly.
//   npm run db:init
import { initSchema } from "./index.js";

initSchema();
console.log("Database schema initialised.");
