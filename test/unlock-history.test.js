import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import jwt from 'jsonwebtoken';
import { createUnlockHistoryRepository } from '../app/repositories/unlock-history.repository.js';
import { createUnlockHistoryAccess } from '../app/middlewares/unlock-history-access.js';
import { createUnlockHistoryController } from '../app/controllers/unlock-history.controller.js';
const key = randomBytes(32);
const token = (payload = { user: 123 }, options = {}) => jwt.sign(payload, key, options);
function harness(options = {}) {
  const queries = [], responses = [];
  let nextCalls = 0, connectionCalls = 0;
  const row = { id_desbloqueo: 28, id_legajo: 4010, nombre: null, apellido: null, fecha: '2026-10-19T15:00:51.000Z', maquinas: ' B-309, B-310\n' };
  let connection = { query(sql, values, callback) {
    queries.push({ sql, values });
    setImmediate(() => {
      const kind = sql.includes('COUNT') ? 'count' : sql.includes('LEFT JOIN') ? 'list' : 'user';
      callback(options.fail === kind ? new Error('private detail') : null,
        kind === 'count' ? [{ total: options.total ?? 28 }] : kind === 'list' ? options.items ?? [row] : options.users ?? [{ id_legajo: 123, id_priv: options.role }]);
      if (options.duplicate) callback(new Error('late callback'));
    });
  } };
  const repository = createUnlockHistoryRepository({ getConnection: () => { connectionCalls++; return connection; } });
  const access = createUnlockHistoryAccess({ getAccessMode: () => options.mode, verifyJwt: (value, settings) => jwt.verify(value, key, settings), repository });
  const controller = createUnlockHistoryController({ repository });
  const req = { cookies: { jwt: options.token }, query: options.query ?? {} };
  const res = { status(code) { this.code = code; return this; }, json(body) { responses.push({ code: this.code, body }); return this; } };
  return { queries, responses, row, repository, setConnection(value) { connection = value; }, get connectionCalls() { return connectionCalls; }, get nextCalls() { return nextCalls; },
    authorize: () => access(req, res, () => { nextCalls++; }), run: () => controller(req, res) };
}
for (const mode of ['local', ' LOCAL ']) test(`anonymous local: ${mode}`, async () => {
  const h = harness({ mode }); await h.authorize(); assert.equal(h.nextCalls, 1); assert.equal(h.queries.length, 0);
});
for (const mode of ['internet', undefined, '', 'unknown', ' localx ']) test(`closed default: ${mode}`, async () => {
  const h = harness({ mode }); await h.authorize(); assert.equal(h.responses[0].code, 401); assert.equal(h.responses.length, 1); assert.equal(h.nextCalls, 0); assert.equal(h.queries.length, 0);
});
for (const [name, value] of Object.entries({ invalid: 'bad', expired: token({ user: 123 }, { expiresIn: -1 }), algorithm: token({ user: 123 }, { algorithm: 'HS384' }), missingUser: token({}), array: token({ user: [123] }), zero: token({ user: 0 }), negative: token({ user: -1 }), decimal: token({ user: 1.5 }), text: token({ user: 'abc' }) })) test(`reject JWT: ${name}`, async () => {
  const h = harness({ token: value }); await h.authorize(); assert.equal(h.responses[0].code, 401); assert.equal(h.nextCalls, 0); assert.equal(h.queries.length, 0);
});
for (const role of [0, 1, 2, 3, 4, 5, 6, 99]) test(`existing user, no role restriction: ${role}`, async () => {
  const h = harness({ mode: 'internet', token: token(), role }); await h.authorize(); assert.equal(h.nextCalls, 1); assert.deepEqual(h.queries, [{ sql: 'SELECT id_legajo FROM usuarios WHERE id_legajo = ?', values: [123] }]);
});
test('missing user denied; SQL error stops', async () => {
  for (const options of [{ users: [] }, { fail: 'user' }]) {
    const h = harness({ token: token(), ...options }); await h.authorize(); assert.equal(h.nextCalls, 0); assert.equal(h.responses.length, 1); assert.equal(h.responses[0].code, options.fail ? 500 : 401);
  }
});
test('defaults, LEFT JOIN, ordering, parameters, deleted user and literal fields', async () => {
  const h = harness(); await h.run();
  assert.equal(h.responses.length, 1); assert.equal(h.responses[0].code, 200);
  assert.deepEqual(h.responses[0].body, { items: [h.row], pagination: { page: 1, pageSize: 25, total: 28, totalPages: 2 } });
  assert.deepEqual(h.queries[0], { sql: 'SELECT COUNT(*) AS total FROM desbloqueo_cardas WHERE ? = ?', values: [1, 1] });
  assert.match(h.queries[1].sql, /LEFT JOIN usuarios AS u ON u.id_legajo = d.id_legajo/);
  assert.match(h.queries[1].sql, /ORDER BY d.fecha DESC, d.id_desbloqueo DESC\nLIMIT \? OFFSET \?$/);
  assert.deepEqual(h.queries[1].values, [25, 0]);
  for (const q of h.queries) { assert.match(q.sql, /^SELECT /); assert.doesNotMatch(q.sql, /;|INSERT|UPDATE|DELETE|DROP|ALTER/); }
  assert.equal(h.connectionCalls, 2);
});
test('page offset and maximum size', async () => {
  const h = harness({ query: { page: '3', pageSize: '100' }, total: 201 }); await h.run(); assert.deepEqual(h.queries[1].values, [100, 200]); assert.equal(h.responses[0].body.pagination.totalPages, 3);
});
for (const field of ['page', 'pageSize']) for (const value of ['0', '-1', '1.5', 'abc', '', ' 1', '1e2', ['1'], {}, '9007199254740992']) test(`invalid ${field}: ${JSON.stringify(value)}`, async () => {
  const h = harness({ query: { [field]: value } }); await h.run(); assert.equal(h.responses[0].code, 400); assert.equal(h.responses.length, 1); assert.equal(h.queries.length, 0);
});
for (const query of [{ pageSize: '101' }, { page: '9007199254740991', pageSize: '100' }]) test('size / offset overflow rejected', async () => {
  const h = harness({ query }); await h.run(); assert.equal(h.responses[0].code, 400); assert.equal(h.queries.length, 0);
});
test('empty list', async () => {
  const h = harness({ total: 0, items: [] }); await h.run(); assert.deepEqual(h.responses[0].body.items, []); assert.equal(h.responses[0].body.pagination.totalPages, 0);
});
for (const fail of ['count', 'list']) test(`SQL failure ${fail} responds once and stops`, async () => {
  const h = harness({ fail, duplicate: true }); await h.run(); assert.equal(h.responses.length, 1); assert.equal(h.responses[0].code, 500); assert.equal(h.queries.length, fail === 'count' ? 1 : 2); assert.doesNotMatch(JSON.stringify(h.responses), /private detail/);
});
test('uses replacement live connection', async () => {
  const h = harness(); await h.repository.count(); h.setConnection({ query(sql, values, cb) { cb(null, [{ total: 55 }]); } }); assert.deepEqual(await h.repository.count(), [{ total: 55 }]);
});
test('composition reads backend environment and installs access before controller', () => {
  const source = readFileSync(new URL('../app/index.js', import.meta.url), 'utf8');
  assert.match(source, /getAccessMode: \(\) => process.env.APP_ACCESS_MODE/);
  assert.match(source, /jsonwebtoken.verify\(token, process.env.JWT_SECRET, options\)/);
  assert.match(source, /app.get\('\/api\/historial-desbloqueo-cardas', createUnlockHistoryAccess\([\s\S]*?createUnlockHistoryController/);
});
