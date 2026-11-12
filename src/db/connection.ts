import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';
import { getDatabaseUrl } from './config';

import dotenv from 'dotenv';

dotenv.config();// Permet de loader les variables d'environnement avant le chargement du fichier.

const connection = mysql.createPool({
  uri: getDatabaseUrl(),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export const db = drizzle(connection, { schema, mode: 'default' });

export const testConnection = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    // Run a simple query to ensure everything is working
    await connection.query('SELECT 1');
    // The pool connects to the database selected by DB_CONNECTION_STRING.
    // Users table existence check
    const [tables] = await connection.query('SHOW TABLES LIKE ?', ['users']);
    if (Array.isArray(tables) && tables.length === 0) {
      throw new Error('Table users does not exist in the database');
    }
    console.log('Database connection successful and users table exists.');
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
    console.error('Database connection failed:', errorMessage);
    return { success: false, error: errorMessage };
  }
};
