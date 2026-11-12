export function getDatabaseUrl(env: NodeJS.ProcessEnv = process.env): string {
  const value = env.DB_CONNECTION_STRING;
  if (!value) {
    throw new Error('DB_CONNECTION_STRING is required');
  }
  try {
    const url = new URL(value);
    if (url.protocol !== 'mysql:' || !url.hostname || url.pathname.length < 2) {
      throw new Error();
    }
  } catch {
    // Do not include the URL: it contains database credentials.
    throw new Error('DB_CONNECTION_STRING must be a mysql:// URL with a database name');
  }
  return value;
}
