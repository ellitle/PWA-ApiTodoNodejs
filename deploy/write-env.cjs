const fs = require('node:fs');

function createEnvironmentFile(env) {
  const lines = ['NODE_ENV=production', 'PORT=3001'];
  for (const name of ['DB_CONNECTION_STRING', 'JWT_KEY']) {
    const value = env[name];
    if (!value || /[\r\n\0]/.test(value)) {
      throw new Error(`${name} must be nonempty and contain no line breaks or NUL`);
    }
    // EnvironmentFile uses shell-style double quoting, without expansion.
    const escaped = value.replace(/[\\"$`]/g, '\\$&');
    lines.push(`${name}="${escaped}"`);
  }
  return `${lines.join('\n')}\n`;
}

if (require.main === module) {
  fs.writeFileSync('bank.env', createEnvironmentFile(process.env), { mode: 0o600 });
}

module.exports = { createEnvironmentFile };
