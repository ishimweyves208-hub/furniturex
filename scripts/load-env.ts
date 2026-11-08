import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import path from "node:path";

for (const file of [".env.local", ".env"]) {
  const full = path.resolve(process.cwd(), file);
  if (existsSync(full)) {
    loadEnvFile(full);
    break;
  }
}
