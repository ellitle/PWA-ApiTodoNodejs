const { test } = require('node:test');
const assert = require('node:assert/strict');
const mysql = require('mysql2');
const { getDatabaseUrl } = require('../dist/db/config');
const { createEnvironmentFile } = require('../deploy/write-env.cjs');

test('database URL selects the database and decodes credentials', async () => {
  const uri = getDatabaseUrl({
    DB_CONNECTION_STRING: 'mysql://bank:p%40ss%3Aword@127.0.0.1:3307/custom_bank',
  });
  const pool = mysql.createPool({ uri });
  const config = pool.config.connectionConfig;
  assert.equal(config.database, 'custom_bank');
  assert.equal(config.password, 'p@ss:word');
  assert.equal(config.port, 3307);
  await pool.promise().end();
});

test('database config rejects missing and unsupported strings without exposing credentials', () => {
  assert.throws(() => getDatabaseUrl({}), /DB_CONNECTION_STRING is required/);
  for (const value of ['Server=localhost;Password=private;', 'postgres://user:private@host/db', 'mysql://host']) {
    assert.throws(() => getDatabaseUrl({ DB_CONNECTION_STRING: value }), {
      message: 'DB_CONNECTION_STRING must be a mysql:// URL with a database name',
    });
  }
});

test('deployment quotes secret characters for systemd', () => {
  assert.equal(createEnvironmentFile({
    DB_CONNECTION_STRING: 'mysql://user:password@host/bank',
    JWT_KEY: 'a"b\\c$d`e\'f# g',
  }), 'NODE_ENV=production\nPORT=3001\nDB_CONNECTION_STRING="mysql://user:password@host/bank"\nJWT_KEY="a\\"b\\\\c\\$d\\`e\'f# g"\n');
});

test('deployment rejects empty secrets and environment line injection', () => {
  for (const name of ['DB_CONNECTION_STRING', 'JWT_KEY']) {
    for (const value of ['', 'secret\nPORT=9999', 'secret\r', 'secret\0']) {
      assert.throws(() => createEnvironmentFile({
        DB_CONNECTION_STRING: 'mysql://user:password@host/bank', JWT_KEY: 'key', [name]: value,
      }), new RegExp(name));
    }
  }
});
