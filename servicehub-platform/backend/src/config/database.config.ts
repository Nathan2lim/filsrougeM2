import { registerAs } from '@nestjs/config';

export const databaseConfig = registerAs('database', () => ({
  url: process.env.DATABASE_URL,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'servicehub',
  password: process.env.DB_PASSWORD || 'servicehub_secret',
  database: process.env.DB_NAME || 'servicehub_db',
}));

export type DatabaseConfig = ReturnType<typeof databaseConfig>;
