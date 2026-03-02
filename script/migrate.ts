import { execSync } from "child_process";

// This runs Drizzle migration inside Railway
execSync("npx drizzle-kit push", { stdio: "inherit" });

console.log("✅ Migration complete");