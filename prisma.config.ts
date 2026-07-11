import 'dotenv/config';
import { defineConfig } from 'prisma/config';

// Prisma 7 configuration: the connection URL lives here for the CLI
// (migrate/studio) and in the PrismaClient driver adapter at runtime,
// not in schema.prisma.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env.DATABASE_URL ?? '',
  },
});
