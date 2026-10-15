import { defineConfig } from "drizzle-kit";

// Load backend/.env locally; on Render the variables are set in the dashboard instead.
try {
  process.loadEnvFile();
} catch {
  // no .env file: fine for `db:generate`, which doesn't connect to the database
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/common/db/schema.ts",
  out: "./drizzle", // migration files, committed to git
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
});
