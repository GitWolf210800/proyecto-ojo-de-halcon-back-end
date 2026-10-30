import test from 'node:test';
import assert from 'node:assert/strict';
import { validateResetCardaPayload, ResetCardaPayloadError } from '../app/validators/reset-carda-lock.validator.js';
import { createResetCardaRepository, ResetCardaRepositoryError } from '../app/repositories/reset-carda-lock.repository.js';

const selection = { estado_maquina: 'PARO', produccion: 0, puntos_gruesos: 0 };
const selectSql = 'SELECT nombre, direccion_ip, id_fabrica FROM instalaciones WHERE nombre = ?';
const insertSql = 'INSERT INTO desbloqueo_cardas (id_legajo, fecha, maquinas) VALUES (?, CURRENT_TIMESTAMP, ?)';
const row = { nombre: 'Carda de prueba', direccion_ip: 'device.example.invalid', id_fabrica: 42 };
const controlled = (code) => (error) => {
  assert.ok(error instanceof ResetCardaRepositoryError);
  assert.equal(error.code, code);
  assert.equal(error.message, 'No se pudo completar la operación de datos de desbloqueo');
  assert.equal(error.cause, undefined);
  return true;
};

function harness() {
  const calls = [];
  let activeConnection = { query(sql, parameters, callback) { calls.push({ sql, parameters, callback }); } };
  const repository = createResetCardaRepository({ getConnection: () => activeConnection });
  return { repository, calls, replace(value) { activeConnection = value; } };
}

test('validator: one machine and no mutation', () => {
  const body = Object.freeze({ carda: Object.freeze({ ...selection }) });
  assert.deepEqual(validateResetCardaPayload(body), ['carda']);
});
test('validator: multiple literal names, deterministic order and ignored display values', () => {
  const names = [' Carda Á-1 ', "Carda O'Brien", 'Máquina con espacios'];
  const body = Object.fromEntries(names.map(name => [name, { ...selection }]));
  assert.deepEqual(validateResetCardaPayload(body), names);
  body[names[0]] = {};
  assert.deepEqual(validateResetCardaPayload(body), names);
});
for (const [label, body] of [
  ['absent', undefined], ['null', null], ['empty', {}], ['array', []],
  ['string', 'carda'], ['number', 1], ['boolean', true], ['date', new Date(0)],
  ['custom prototype', Object.create({ inherited: selection })],
  ['null prototype', Object.create(null)],
]) {
  test(`validator: rejects ${label}`, () => {
    assert.throws(() => validateResetCardaPayload(body), ResetCardaPayloadError);
  });
}
for (const value of [null, undefined, [], 'invalid', 1, false, new Date(0)]) {
  test(`validator: rejects interior ${String(value)} (${typeof value})`, () => {
    assert.throws(() => validateResetCardaPayload({ carda: value }), ResetCardaPayloadError);
  });
}
for (const name of ['', '   ', '__proto__', 'prototype', 'constructor']) {
  test(`validator: rejects key ${JSON.stringify(name)}`, () => {
    const body = JSON.parse(JSON.stringify({ [name]: selection }));
    assert.throws(() => validateResetCardaPayload(body), ResetCardaPayloadError);
  });
}
test('validator: obtains selections exclusively from enumerable own string keys', () => {
  const body = { carda: selection, [Symbol('not JSON')]: selection };
  Object.defineProperty(body, 'hidden', { value: selection });
  assert.deepEqual(validateResetCardaPayload(body), ['carda']);
});

test('repository: explicit columns, literal apostrophe bound, normalized single row', async () => {
  const h = harness();
  const name = " Carda Á-1 O'Brien ";
  const pending = h.repository.findInstallationByName(name);
  assert.equal(h.calls[0].sql, selectSql);
  assert.deepEqual(h.calls[0].parameters, [name]);
  assert.equal(h.calls[0].sql.includes(name), false);
  h.calls[0].callback(null, [{ ...row, nombre: name, extra: 'discarded' }]);
  assert.deepEqual(await pending, { ...row, nombre: name });
});
for (const [label, rows, code] of [
  ['zero rows', [], 'INSTALLATION_NOT_FOUND'],
  ['multiple rows', [row, row], 'INSTALLATION_NOT_UNIQUE'],
  ['invalid result', {}, 'INVALID_SQL_RESULT'],
  ['invalid row', [null], 'INVALID_SQL_RESULT'],
]) {
  test(`repository: ${label}`, async () => {
    const h = harness();
    const pending = h.repository.findInstallationByName('carda');
    h.calls[0].callback(null, rows);
    await assert.rejects(pending, controlled(code));
  });
}
for (const operation of ['findInstallationByName', 'insertUnlockHistory']) {
  test(`repository: ${operation} SQL error is controlled`, async () => {
    const h = harness();
    const pending = h.repository[operation](operation === 'findInstallationByName' ? 'carda' : { userId: 7, machineId: 42 });
    h.calls[0].callback(new Error('Synthetic internal SQL detail'));
    await assert.rejects(pending, controlled('SQL_ERROR'));
  });
  test(`repository: ${operation} uses replaced connection on each invocation`, async () => {
    const h = harness();
    let replacementCalls = 0;
    for (let i = 0; i < 2; i++) {
      h.replace({ query(sql, values, callback) {
        replacementCalls += 1;
        callback(null, operation === 'findInstallationByName' ? [row] : { affectedRows: 1 });
      } });
      await h.repository[operation](operation === 'findInstallationByName' ? 'carda' : { userId: 7, machineId: 42 });
    }
    assert.equal(replacementCalls, 2);
    assert.equal(h.calls.length, 0);
  });
}
test('repository: history preserves id_fabrica and waits for INSERT confirmation', async () => {
  const h = harness();
  const lookup = h.repository.findInstallationByName(row.nombre);
  h.calls[0].callback(null, [{ ...row, id_instalacion: 999 }]);
  const installation = await lookup;
  let finished = false;
  const pending = h.repository.insertUnlockHistory({ userId: 7, machineId: installation.id_fabrica })
    .then(() => { finished = true; });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(finished, false);
  assert.equal(h.calls.length, 2);
  assert.equal(h.calls[1].sql, insertSql);
  assert.deepEqual(h.calls[1].parameters, [7, 42]);
  assert.equal(h.calls[1].sql.includes(';'), false);
  h.calls[1].callback(null, { affectedRows: 1 });
  await pending;
  assert.equal(finished, true);
});
test('repository: one independent INSERT per machine', async () => {
  const h = harness();
  for (const machineId of [42, 43]) {
    const pending = h.repository.insertUnlockHistory({ userId: 7, machineId });
    const call = h.calls.at(-1);
    assert.equal(call.sql, insertSql);
    assert.deepEqual(call.parameters, [7, machineId]);
    call.callback(null, { affectedRows: 1 });
    await pending;
  }
  assert.equal(h.calls.length, 2);
});
for (const affectedRows of [0, 2, undefined]) {
  test(`repository: rejects unconfirmed insert ${affectedRows}`, async () => {
    const h = harness();
    const pending = h.repository.insertUnlockHistory({ userId: 7, machineId: 42 });
    h.calls[0].callback(null, { affectedRows });
    await assert.rejects(pending, controlled('HISTORY_NOT_INSERTED'));
  });
}
test('repository: synchronous provider failure is controlled', async () => {
  const repository = createResetCardaRepository({ getConnection() { throw new Error('Synthetic provider failure'); } });
  await assert.rejects(repository.findInstallationByName('carda'), controlled('SQL_ERROR'));
});
test('repository: factory is lazy and never obtains a connection on creation', () => {
  createResetCardaRepository({ getConnection() { assert.fail('Must not be called'); } });
});

async function settlesOnce(promise, code) {
  let resolved = 0;
  let rejected = 0;
  let value;
  await promise.then(
    result => { resolved += 1; value = result; },
    error => { rejected += 1; value = error; },
  );
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual([resolved, rejected], code ? [0, 1] : [1, 0]);
  if (code) controlled(code)(value);
  return value;
}

for (const operation of ['findInstallationByName', 'insertUnlockHistory']) {
  const argument = operation === 'findInstallationByName' ? 'carda' : { userId: 7, machineId: 42 };
  for (const [label, options] of [
    ['undefined factory argument', undefined],
    ['null factory argument', null],
    ['missing getConnection', {}],
    ['invalid getConnection', { getConnection: 123 }],
    ['missing query', { getConnection: () => ({}) }],
    ['query throws before callback', { getConnection: () => ({ query() { throw new Error('Synthetic internal detail'); } }) }],
  ]) {
    test(`repository: ${operation} ${label} rejects once`, async () => {
      const repository = createResetCardaRepository(options);
      await settlesOnce(repository[operation](argument), 'SQL_ERROR');
    });
  }
  for (const lateError of [false, true]) {
    test(`repository: ${operation} success followed by ${lateError ? 'late error' : 'duplicate success'} settles once`, async () => {
      const h = harness();
      const pending = h.repository[operation](argument);
      const result = operation === 'findInstallationByName' ? [row] : { affectedRows: 1 };
      h.calls[0].callback(null, result);
      setImmediate(() => h.calls[0].callback(lateError ? new Error('Synthetic late SQL error') : null, result));
      const value = await settlesOnce(pending);
      assert.deepEqual(value, operation === 'findInstallationByName' ? row : undefined);
      assert.equal(h.calls.length, 1);
    });
  }
}

for (const [label, changes] of [
  ['missing nombre', { nombre: undefined }], ['empty nombre', { nombre: '' }],
  ['non-string nombre', { nombre: 123 }], ['whitespace nombre', { nombre: ' ' }],
  ['missing direccion_ip', { direccion_ip: undefined }], ['empty direccion_ip', { direccion_ip: '' }],
  ['non-string direccion_ip', { direccion_ip: 123 }], ['whitespace direccion_ip', { direccion_ip: ' ' }],
  ['missing id_fabrica', { id_fabrica: undefined }], ['null id_fabrica', { id_fabrica: null }],
]) {
  test(`repository: installation ${label} rejects once`, async () => {
    const h = harness();
    const pending = h.repository.findInstallationByName('carda');
    h.calls[0].callback(null, [{ ...row, ...changes }]);
    await settlesOnce(pending, 'INVALID_INSTALLATION_DATA');
  });
}
test('repository: id_fabrica zero is preserved and resolves once', async () => {
  const h = harness();
  const pending = h.repository.findInstallationByName(row.nombre);
  h.calls[0].callback(null, [{ ...row, id_fabrica: 0 }]);
  assert.deepEqual(await settlesOnce(pending), { ...row, id_fabrica: 0 });
});
for (const field of ['userId', 'machineId']) {
  for (const value of [null, undefined]) {
    test(`repository: history ${field} ${value} rejects once before obtaining connection`, async () => {
      let connectionCalls = 0;
      const repository = createResetCardaRepository({ getConnection() { connectionCalls += 1; return {}; } });
      await settlesOnce(repository.insertUnlockHistory({ userId: 7, machineId: 42, [field]: value }), 'INVALID_HISTORY_DATA');
      assert.equal(connectionCalls, 0);
    });
  }
}
test('repository: history accepts both zero identifiers and resolves once', async () => {
  const h = harness();
  const pending = h.repository.insertUnlockHistory({ userId: 0, machineId: 0 });
  assert.equal(h.calls[0].sql, insertSql);
  assert.deepEqual(h.calls[0].parameters, [0, 0]);
  h.calls[0].callback(null, { affectedRows: 1 });
  await settlesOnce(pending);
  assert.equal(h.calls.length, 1);
});
