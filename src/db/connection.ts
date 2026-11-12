import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';

import dotenv from 'dotenv';

dotenv.config();// Permet de loader les variables d'environnement avant le chargement du fichier.

const connection = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'ScammistanBank',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export const db = drizzle(connection, { schema, mode: 'default' });

export const testConnection = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    // Run a simple query to ensure everything is working
    await connection.query('SELECT 1');
    // Check if the database exists
    const [databases] = await connection.query('SHOW DATABASES LIKE ?', ['ScammistanBank']);
    if (Array.isArray(databases) && databases.length === 0) {
      throw new Error('Database ScammistanBank does not exist');
    }
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