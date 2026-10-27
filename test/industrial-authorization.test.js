import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { createIndustrialAuthorization, industrialPolicies } from '../app/middlewares/industrial-authorization.js';

// Ephemeral synthetic signing material; never read environment or import DB/bootstrap.
const signingKey = randomBytes(32);
const validToken = jwt.sign({ user: 123 }, signingKey);

function harness(policy, options = {}) {
  const responses = [];
  const queries = [];
  let controllerCalls = 0;
  let release;
  let activeConnection = {
    query(sql, values, callback) {
      queries.push({ sql, values });
      const complete = () => {
        callback(options.sqlError ? new Error('Synthetic SQL detail') : null,
          options.rows ?? [{ id_priv: options.role ?? 0 }]);
        if (options.duplicateCallback) callback(new Error('Late synthetic failure'));
      };
      if (options.throwQuery) throw new Error('Synthetic query failure');
      if (options.delayed) release = complete;
      else setImmediate(complete);
    },
  };
  const middleware = createIndustrialAuthorization({
    getConnection: () => activeConnection,
    verifyJwt: (token) => jwt.verify(token, signingKey, { algorithms: ["HS256"] }),
  }, policy);
  const res = {
    status(code) { this.code = code; return this; },
    json(body) { responses.push({ code: this.code, body }); return this; },
  };
  return {
    responses, queries,
    get controllerCalls() { return controllerCalls; },
    setConnection(value) { activeConnection = value; },
    release() { release(); },
    run: () => middleware(options.req ?? { cookies: { jwt: options.token ?? validToken } }, res,
      () => { controllerCalls += 1; }),
  };
}

function denied(h, policy) {
  assert.equal(h.controllerCalls, 0);
  assert.deepEqual(h.responses, [{ code: 400, body: { status: 'Error', message: policy.message } }]);
}

const expected = {
  edicionCardaLock: [0, 5, 6], formlimsent: [0, 1], formCalSent: [0, 2],
};

for (const [route, policy] of Object.entries(industrialPolicies)) {
  test(`${route}: valid HS256 JWT from req.cookies.jwt`, async () => {
    const h = harness(policy, { req: { cookies: { jwt: validToken } } });
    await h.run();
    assert.equal(h.controllerCalls, 1);
    assert.equal(h.responses.length, 0);
  });
  test(`${route}: exact privilege matrix`, () => {
    assert.deepEqual(policy.allowedPrivileges, expected[route]);
    assert.equal(policy.message, 'El usuario no tiene autorizacion para la peticion' + (route === 'formlimsent' ? '!' : ''));
  });
  for (const role of [0, 1, 2, 3, 4, 5, 6, 7, -1, 999, '0', '5', null,
    'RESPONSABLE_MANTENIMIENTO_CLIMA', 'JEFE_PRODUCCION']) {
    test(`${route}: privilege ${role}`, async () => {
      const h = harness(policy, { rows: [{ id_priv: role }] });
      await h.run();
      if (expected[route].includes(role)) {
        assert.equal(h.controllerCalls, 1);
        assert.equal(h.responses.length, 0);
      } else denied(h, policy);
      assert.deepEqual(h.queries, [{ sql: 'SELECT id_priv FROM usuarios WHERE id_legajo = ?', values: [123] }]);
    });
  }

  const failures = [
    ['no req.cookies', { req: {} }, true],
    ['no jwt cookie', { req: { cookies: {} } }, true],
    ['other cookie', { req: { cookies: { other: 'value' } } }, true],
    ['raw header alone is not used', { req: { headers: { cookie: `jwt=${validToken}` } } }, true],
    ['empty cookie', { token: '' }, true],
    ['non-string cookie', { req: { cookies: { jwt: 123 } } }, true],
    ['object cookie', { req: { cookies: { jwt: {} } } }, true],
    ['null cookie', { req: { cookies: { jwt: null } } }, true],
    ['invalid cookie', { token: 'synthetic-invalid' }, true],
    ['expired cookie', { token: jwt.sign({ user: 123 }, signingKey, { expiresIn: -1 }) }, true],
    ['HS384 with same key', { token: jwt.sign({ user: 123 }, signingKey, { algorithm: 'HS384' }) }, true],
    ['wrong signature', { token: jwt.sign({ user: 123 }, randomBytes(32)) }, true],
    ['no decoded.user', { token: jwt.sign({}, signingKey) }, true],
    ['object decoded.user', { token: jwt.sign({ user: { id: 123 } }, signingKey) }, true],
    ['SQL fragment in decoded.user', { token: jwt.sign({ user: '123 OR 1=1' }, signingKey) }, true],
    ['nonexistent user', { rows: [] }],
    ['SQL error', { sqlError: true }],
    ['SQL throws', { throwQuery: true }],
    ['ambiguous user', { rows: [{ id_priv: 0 }, { id_priv: 0 }] }],
    ['malformed rows', { rows: {} }],
    ['duplicate denial callback', { sqlError: true, duplicateCallback: true }],
  ];
  for (const [name, options, noQuery] of failures) {
    test(`${route}: ${name} blocks industrial controller with one response`, async () => {
      const h = harness(policy, options);
      await h.run();
      denied(h, policy);
      if (noQuery) assert.equal(h.queries.length, 0);
    });
  }
  for (const options of [{ role: 0 }, { role: 999 }, { rows: [] }, { sqlError: true }]) {
    test(`${route}: delayed authorization ${JSON.stringify(options)}`, async () => {
      const h = harness(policy, { ...options, delayed: true });
      const pending = h.run();
      await new Promise(resolve => setImmediate(resolve));
      assert.equal(h.controllerCalls, 0);
      assert.equal(h.responses.length, 0);
      h.release();
      await pending;
      if (options.role === 0) {
        assert.equal(h.controllerCalls, 1);
        assert.equal(h.responses.length, 0);
      } else denied(h, policy);
    });
  }
  test(`${route}: duplicate SQL callback cannot advance twice`, async () => {
    const h = harness(policy, { duplicateCallback: true });
    await h.run();
    assert.equal(h.controllerCalls, 1);
    assert.equal(h.responses.length, 0);
  });
  test(`${route}: uses connection replaced after middleware creation`, async () => {
    const h = harness(policy);
    let replacementCalls = 0;
    h.setConnection({ query(sql, values, callback) {
      replacementCalls += 1;
      callback(null, [{ id_priv: 0 }]);
    } });
    await h.run();
    assert.equal(replacementCalls, 1);
    assert.equal(h.queries.length, 0);
    assert.equal(h.controllerCalls, 1);
    assert.equal(h.responses.length, 0);
  });
}

test('index registers each barrier before its existing industrial controller (read only)', () => {
  const source = readFileSync(new URL('../app/index.js', import.meta.url), 'utf8');
  const cookieParserPosition = source.indexOf('app.use(cookieParser());');
  assert.ok(cookieParserPosition >= 0);
  for (const [route, controller] of Object.entries({
    edicionCardaLock: 'resetCardaLock', formlimsent: 'formLimFildataIn', formCalSent: 'formCalSent',
  })) {
    assert.ok(source.includes(`app.post('/api/${route}', industrialBarrier(industrialPolicies.${route}), authorization.${controller});`));
    assert.ok(cookieParserPosition < source.indexOf(`app.post('/api/${route}'`));
  }
  assert.ok(source.includes('getConnection: () => connection'));
  assert.match(source, /jsonwebtoken\.verify\(token, process\.env\.JWT_SECRET,\s*\{\s*algorithms:\s*\["HS256"\],?\s*\}\)/);
});
