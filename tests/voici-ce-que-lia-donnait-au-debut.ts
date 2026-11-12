import { spawn, type ChildProcess } from 'node:child_process';
import dotenv from 'dotenv';
import waitOn from 'wait-on';

// Charge le .env (PORT, DB_*, NODE_ENV...) : le serveur et les tests utilisent la même configuration.
dotenv.config();

const PORT = process.env.PORT || '3001';
const BASE_URL = `http://localhost:${PORT}`;
const STARTUP_TIMEOUT_MS = 20_000;

let server: ChildProcess | undefined;

// Exécuté une seule fois avant tous les fichiers de test.
export async function globalSetup(): Promise<void> {
  process.env.TEST_BASE_URL = BASE_URL;

  server = spawn(process.execPath, ['--import', 'tsx', 'src/server.ts'], {
    stdio: 'inherit',
    env: process.env,
  });

  const serverExited = new Promise<never>((_, reject) => {
    server!.once('exit', (code) => reject(new Error(`Le serveur s'est arrêté (code ${code}) avant d'être prêt`)));
  });

  try {
    // /health vérifie aussi la connexion à la base de données et l'existence de la table.
    await Promise.race([
      waitOn({ resources: [`${BASE_URL}/health`], timeout: STARTUP_TIMEOUT_MS }),
      serverExited,
    ]);
  } catch (error) {
    server.kill();
    throw error;
  }
}

// Exécuté une seule fois après tous les fichiers de test.
export async function globalTeardown(): Promise<void> {
  server?.kill();
}

