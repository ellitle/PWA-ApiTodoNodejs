import type { Config } from 'drizzle-kit';
import 'dotenv/config';
import { getDatabaseUrl } from './src/db/config';
export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'mysql',
  dbCredentials: {
    url: getDatabaseUrl(),
  },
} satisfies Config;
