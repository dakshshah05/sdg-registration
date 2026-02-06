import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // Hardcoding for stability in this environment, ideally use process.env.DATABASE_URL
    url: "file:d:/SDG/sdg-registration/prisma/dev.db",
  },
});
