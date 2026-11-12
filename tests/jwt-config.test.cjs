const { test } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

process.env.DB_CONNECTION_STRING = 'mysql://test:test@127.0.0.1/test';
process.env.JWT_KEY = 'test-only-jwt-key';
delete process.env.JWT_SECRET;

const { AuthService } = require('../dist/services/auth.service');
const { AccountService } = require('../dist/services/account.service');
const { AuthController } = require('../dist/controllers/auth.controller');
const { AccountController } = require('../dist/controllers/account.controller');

function response() {
  return {
    statusCode: 200,
    status(value) { this.statusCode = value; return this; },
    json(value) { this.body = value; return this; },
    cookie() { return this; },
  };
}

test('login signs with JWT_KEY and accounts accepts that token', async (t) => {
  t.mock.method(AuthService.prototype, 'login', async () => ({ id: 'user-123' }));
  const accounts = [{ id: 'account-123' }];
  const lookup = t.mock.method(AccountService.prototype, 'getUserAccounts', async () => accounts);
  const loginRes = response();
  await new AuthController().login({ body: {} }, loginRes);
  assert.equal(loginRes.statusCode, 200);
  assert.equal(jwt.verify(loginRes.body.token, process.env.JWT_KEY).userId, 'user-123');

  const accountRes = response();
  await new AccountController().getUserAccounts({
    get: () => `Bearer ${loginRes.body.token}`,
  }, accountRes, () => {});
  assert.equal(accountRes.statusCode, 200);
  assert.deepEqual(accountRes.body, accounts);
  assert.deepEqual(lookup.mock.calls[0].arguments, ['user-123']);
});
