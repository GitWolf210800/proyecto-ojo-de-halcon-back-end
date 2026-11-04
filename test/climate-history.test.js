import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import jwt from 'jsonwebtoken';
import { createClimateHistoryAccess } from '../app/middlewares/climate-history-access.js';
import { createClimateHistoryRepository, historyStatement, CATALOG_SQL } from '../app/repositories/climate-history.repository.js';
import { createClimateHistoryService, validateClimateQuery, samplingSeconds, numberOrNull, MAX_POINTS, METRICS, POINT_FIELDS } from '../app/services/climate-history.js';
import { createClimateHistoryController } from '../app/controllers/climate-history.controller.js';

const key = randomBytes(32);
const sign = (payload = { user: 1 }, options = {}) => jwt.sign(payload, key, { algorithm: 'HS256', expiresIn: 60, ...options });
const body = { alcance: 'sensor', id_instalacion: 52, fabrica: null, desde: '2026-01-01 00:00:00', hasta: '2026-01-02 00:00:00' };
const catalogRow = { id_instalacion: 52, nombre: 'sensor-fixture', info_extra: 'Preparación', fabrica: 'Fábrica fixture', id_fabrica: 'F1', id_instalacion_fisica: 12 };
const point = { id_medicion: 1, id_instalacion: 52, fecha_local: '2026-01-01T01:00:00', temperatura: '20.5', humedad: '60', total_registros: 999, total_registros_sensor: 999, temperatura_minimo: '10', temperatura_promedio: '18', temperatura_maximo: '30' };
function response() {
  const calls = [];
  const headers = {};
  return { calls, headers, set(name, value) { headers[name] = value; return this; }, status(code) { this.code = code; return this; }, json(value) { calls.push({ code: this.code, value }); return this; } };
}
function harness(options = {}) {
  const queries = [];
  let connectionCalls = 0;
  let connection = { query(sql, values, callback) {
    queries.push({ sql, values });
    const kind = sql.startsWith('WITH') ? 'history' : sql.includes('FROM usuarios') ? 'user' : 'catalog';
    setImmediate(() => {
      callback(options.fail === kind ? new Error('PRIVATE SQL DRIVER DETAILS') : null,
        kind === 'history' ? options.rows ?? [point] : kind === 'user' ? options.users ?? [{ id_legajo: 1, id_priv: options.role }] : options.catalog ?? [catalogRow]);
      if (options.duplicate) callback(new Error('SECOND CALLBACK'));
    });
  } };
  const repository = createClimateHistoryRepository({ getConnection: () => { connectionCalls++; return connection; } });
  const service = createClimateHistoryService({ repository, makeId: () => 'server-generated' });
  const controller = createClimateHistoryController({ service });
  const access = createClimateHistoryAccess({ getAccessMode: () => options.mode, repository,
    verifyJwt: (token, config) => jwt.verify(token, key, config) });
  const res = response();
  let nextCalls = 0;
  const req = { body: options.body === undefined ? body : options.body, cookies: { jwt: options.token } };
  return { queries, res, repository, service, get connectionCalls() { return connectionCalls; }, get nextCalls() { return nextCalls; },
    setConnection(next) { connection = next; },
    authorize: () => access(req, res, () => { nextCalls++; }),
    consult: () => controller.consult(req, res), catalog: () => controller.catalog(req, res),
    async request() { await access(req, res, async () => { nextCalls++; await controller.consult(req, res); }); },
  };
}

for (const mode of ['local', ' LOCAL ']) test(`local access ${mode}`, async () => {
  const h = harness({ mode }); await h.authorize(); assert.equal(h.nextCalls, 1); assert.equal(h.queries.length, 0);
});
for (const mode of ['internet', undefined, '', ' ', 'unknown']) test(`closed access ${String(mode)}`, async () => {
  const h = harness({ mode }); await h.request(); assert.equal(h.res.calls[0].code, 401); assert.equal(h.nextCalls, 0); assert.equal(h.queries.length, 0);
});
for (const token of ['invalid', sign({}, { expiresIn: -1 }), sign({ user: 1 }, { algorithm: 'HS384' }), sign({ user: 0 }), sign({ user: 'bad' })]) test('invalid JWT denied without SQL', async () => {
  const h = harness({ token, mode: 'internet' }); await h.request(); assert.equal(h.res.calls.length, 1); assert.equal(h.res.calls[0].code, 401); assert.equal(h.queries.length, 0);
});
for (const role of [0, 1, 2, 3, 4, 5, 6, 99]) test(`any existing role ${role}`, async () => {
  const h = harness({ token: sign(), mode: 'internet', role }); await h.request(); assert.equal(h.res.calls[0].code, 200); assert.equal(h.queries.length, 3);
});
test('missing user and user SQL errors stop before catalog', async () => {
  for (const options of [{ users: [] }, { fail: 'user' }]) {
    const h = harness({ ...options, token: sign() }); await h.request(); assert.equal(h.nextCalls, 0); assert.equal(h.queries.length, 1); assert.equal(h.res.calls.length, 1);
    assert.equal(h.res.calls[0].code, options.fail ? 500 : 401);
  }
});
test('catalog uses the proven relationships and returns only selection fields', async () => {
  const h = harness({ catalog: [{ ...catalogRow, direccion_ip: 'not-returned', temperatura: 20 }] }); await h.catalog();
  assert.equal(h.res.calls[0].code, 200);
  assert.deepEqual(Object.keys(h.res.calls[0].value.sensores[0]).sort(), ['id_instalacion','nombre','descripcion','etiqueta','fabrica','id_fabrica','id_instalacion_fisica'].sort());
  assert.match(CATALOG_SQL, /EXISTS \(SELECT 1 FROM clima_limites/);
  assert.match(CATALOG_SQL, /EXISTS \(SELECT 1 FROM factor_calibracion_puestos_clima/);
  assert.doesNotMatch(CATALOG_SQL, /direccion_ip|temperatura|id_priv/);
});
test('empty catalog', async () => { const h = harness({ catalog: [] }); await h.catalog(); assert.deepEqual(h.res.calls[0].value.sensores, []); });
test('reject invalid IDs from catalog rather than constructing IN', async () => {
  for (const id of ['1 OR 1=1', 0, 1.5, null]) {
    const h = harness({ catalog: [{ ...catalogRow, id_instalacion: id }] }); await h.consult(); assert.equal(h.res.calls[0].code, 500); assert.equal(h.queries.length, 1);
  }
});
const invalidBodies = [null, [], 'text', 1, new Date(), { ...body, solicitud_id: 'client' },
  { ...body, tabla: 'anything' }, { ...body, columnas: [] }, { ...body, ids: [52] },
  { ...body, alcance: 'SENSOR' }, { ...body, alcance: 'other' },
  ...['52', 0, -1, 2.5, Infinity].map(id_instalacion => ({ ...body, id_instalacion })),
  { ...body, fabrica: 'unexpected' }, { ...body, alcance: 'fabrica', fabrica: 'F', id_instalacion: 52 },
  { ...body, alcance: 'fabrica', fabrica: '', id_instalacion: null },
  ...['2026-02-30 00:00:00', '2025-02-29 00:00:00', '2026-13-01 00:00:00', '2026-01-01 24:00:00', '2026-01-01 00:60:00', '2026-01-01T00:00:00', '2026-01-01 00:00:00Z', '2026-1-01 00:00:00'].map(desde => ({ ...body, desde })),
  { ...body, hasta: body.desde }, { ...body, hasta: '2025-12-31 00:00:00' },
  { ...body, hasta: '2027-01-03 00:00:00' }];
invalidBodies.forEach((value, index) => test(`invalid request ${index} rejected before SQL`, async () => {
  const h = harness({ body: value }); await h.consult(); assert.equal(h.res.calls[0].code, 400); assert.equal(h.queries.length, 0); assert.equal(h.res.calls.length, 1);
}));
test('leap calendar accepted', () => {
  assert.ok(validateClimateQuery({ ...body, desde: '2024-02-29 00:00:00', hasta: '2024-03-01 00:00:00' }));
});
test('unlisted sensor and factory rejected before history SQL', async () => {
  for (const value of [{ ...body, id_instalacion: 99 }, { ...body, alcance: 'fabrica', id_instalacion: null, fabrica: null, id_fabrica: 'missing' }]) {
    const h = harness({ body: value }); await h.consult(); assert.equal(h.res.calls[0].code, 400); assert.equal(h.queries.length, 1);
  }
});
test('factory resolved only through server catalog', async () => {
  const h = harness({ body: { ...body, alcance: 'fabrica', id_instalacion: null, fabrica: null, id_fabrica: catalogRow.id_fabrica },
    catalog: [catalogRow, { ...catalogRow, id_instalacion: 53 }] }); await h.consult();
  assert.equal(h.res.calls[0].code, 200); assert.deepEqual(h.queries[1].values.slice(1,3), [52,53]);
});
test('SQL values parametrized, readonly single statement and deterministic extrema', () => {
  const { sql, values } = historyStatement([52, 53], body.desde, body.hasta, 60);
  assert.equal((sql.match(/\?/g) || []).length, values.length);
  assert.deepEqual(values, [60, 52, 53, body.desde, body.hasta, MAX_POINTS + 1]);
  assert.match(sql, /IN \(\?, \?\)/); assert.doesNotMatch(sql, /;|\b(INSERT|UPDATE|DELETE|DROP|ALTER|CALL)\b/i);
  assert.match(sql, /fecha >= \? AND fecha <= \?/);
  assert.match(sql, /ORDER BY fecha ASC, id_instalacion ASC, id_medicion ASC\nLIMIT \?/);
  assert.match(sql, /ORDER BY fecha DESC, id_medicion DESC/);
  for (const metric of METRICS) {
    assert.match(sql, new RegExp(`MIN\\(${metric}\\) OVER`));
    assert.match(sql, new RegExp(`AVG\\(${metric}\\) OVER`));
    assert.match(sql, new RegExp(`MAX\\(${metric}\\) OVER`));
    assert.match(sql, new RegExp(`${metric} ASC, fecha ASC, id_medicion ASC`));
    assert.match(sql, new RegExp(`${metric} DESC, fecha ASC, id_medicion ASC`));
  }
  assert.ok(sql.indexOf('AVG(') < sql.indexOf('marcada AS'));
  for (const ids of [[], ['52'], [52,52], [NaN], [1.5], ['1) OR 1=1']]) assert.throws(() => historyStatement(ids, body.desde, body.hasta, 60));
});
test('sampling scales respond to range and number of sensors', () => {
  assert.equal(samplingSeconds(86400000, 1), 300);
  assert.equal(samplingSeconds(86400000, 20), 3600);
  assert.equal(samplingSeconds(184 * 86400000, 1), 43200);
});
for (const sensorCount of [7, 20, 30, 100]) test(`184 days: global sampling budget for ${sensorCount} sensors`, async () => {
  const rangeSeconds = 184 * 86400;
  const step = samplingSeconds(rangeSeconds * 1000, sensorCount);
  const maxRowsPerBlock = 2 + 2 * METRICS.length;
  const conservativePoints = sensorCount * maxRowsPerBlock * (Math.ceil(rangeSeconds / step) + 1);
  assert.ok(step > 86400);
  assert.ok(conservativePoints <= 8000);
  assert.ok(conservativePoints < MAX_POINTS);
  // Exercise factory selection through the real service and mock repository too.
  const h = harness({ body: { ...body, alcance: 'fabrica', id_instalacion: null, id_fabrica: 'F1',
    desde: '2001-01-01 00:00:00', hasta: '2001-07-04 00:00:00' }, rows: [],
    catalog: Array.from({ length: sensorCount }, (_, index) => ({ ...catalogRow, id_instalacion: index + 1 })) });
  await h.consult();
  assert.equal(h.res.calls[0].code, 200);
  assert.equal(h.res.calls[0].value.muestreo_segundos, step);
  assert.equal(h.queries[1].values[0], step);
});
test('sampling rejects invalid sensor counts', () => {
  for (const count of [0, -1, 1.5, '7', null, undefined, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => samplingSeconds(86400000, count), RangeError);
  }
});
test('sampling falls back to calculated ideal beyond the largest scale', () => {
  const seconds = 184 * 86400;
  assert.equal(samplingSeconds(seconds * 1000, 800), seconds);
  assert.ok(samplingSeconds(seconds * 1000, 800) > 90 * 86400);
});
test('short intervals retain the 600-block per-sensor budget including alignment', () => {
  const step = samplingSeconds(600000, 1);
  assert.ok(Math.ceil(600 / step) + 1 <= 600);
});
test('factory ID is trimmed in catalog and request without changing selection', async () => {
  const h = harness({ body: { ...body, alcance: 'fabrica', id_instalacion: null, id_fabrica: ' F1 ' },
    catalog: [{ ...catalogRow, id_fabrica: '  F1\t' }, { ...catalogRow, id_instalacion: 53, id_fabrica: 'F2' }] });
  await h.consult();
  assert.equal(h.res.calls[0].code, 200);
  assert.equal(h.res.calls[0].value.id_fabrica, 'F1');
  assert.deepEqual(h.res.calls[0].value.sensores.map(sensor => sensor.id_fabrica), ['F1']);
});
test('statistics use SQL full-population values, points preserve all historical fields', async () => {
  const h = harness(); await h.consult(); const result = h.res.calls[0].value;
  assert.equal(result.solicitud_id, 'server-generated'); assert.equal(result.zona_horaria, 'America/Argentina/Buenos_Aires');
  assert.deepEqual(result.resumen, { total_registros: 999, puntos_mostrados: 1 });
  assert.deepEqual(result.resumen_por_sensor[0].temperatura, { minimo: 10, promedio: 18, maximo: 30 });
  assert.equal(result.puntos[0].temperatura, 20.5);
  for (const field of POINT_FIELDS) assert.ok(Object.hasOwn(result.puntos[0], field));
  assert.equal(result.desde, body.desde); assert.equal(result.puntos[0].fecha, point.fecha_local);
});
test('normalization never turns empty, invalid or nonfinite values into measurements', () => {
  for (const value of ['', ' ', null, undefined, NaN, Infinity, -Infinity, 'bad', 'Infinity', {}, [], false]) assert.equal(numberOrNull(value), null);
  assert.equal(numberOrNull('0'), 0); assert.equal(numberOrNull('-2.5'), -2.5);
});
test('empty history has explicit empty results', async () => {
  const h = harness({ rows: [] }); await h.consult(); const result = h.res.calls[0].value;
  assert.deepEqual(result.puntos, []); assert.equal(result.sensores.length, 1);
  assert.equal(result.resumen_por_sensor[0].total_registros, 0);
  for (const metric of METRICS) assert.deepEqual(result.resumen_por_sensor[0][metric], { minimo: null, promedio: null, maximo: null });
  assert.deepEqual(result.resumen, { total_registros: 0, puntos_mostrados: 0 });
});
test('excessive points rejected with no silent truncation', async () => {
  const h = harness({ rows: Array(MAX_POINTS + 1).fill(point) }); await h.consult();
  assert.equal(h.res.calls[0].code, 422); assert.equal(h.res.calls[0].value.puntos, undefined);
});
for (const fail of ['catalog', 'history']) test(`SQL ${fail} error stops and responds once`, async () => {
  const h = harness({ fail, duplicate: true }); await h.consult();
  assert.equal(h.queries.length, fail === 'catalog' ? 1 : 2); assert.equal(h.res.calls.length, 1);
  assert.equal(h.res.calls[0].code, 500); assert.doesNotMatch(JSON.stringify(h.res.calls), /PRIVATE|SECOND|SELECT|WITH/);
});
test('connection provider resolves replacement for every operation', async () => {
  const h = harness(); await h.repository.catalog(); let used = false;
  h.setConnection({ query(sql, values, cb) { used = true; cb(null, []); } });
  await h.repository.history([52], body.desde, body.hasta, 60); assert.equal(used, true); assert.equal(h.connectionCalls, 2);
});
test('modules have no real connection/bootstrap or Node-RED calls; registration preserves access order', () => {
  const files = ['repositories/climate-history.repository.js', 'services/climate-history.js', 'middlewares/climate-history-access.js', 'controllers/climate-history.controller.js'];
  for (const file of files) {
    const source = readFileSync(new URL(`../app/${file}`, import.meta.url), 'utf8');
    assert.doesNotMatch(source, /\bfetch\s*\(|axios|createConnection|\.connect\s*\(|\.listen\s*\(|from ['"].*(?:db\.js|mysql|node-fetch)|multipleStatements\s*:/);
  }
  const index = readFileSync(new URL('../app/index.js', import.meta.url), 'utf8');
  assert.match(index, /createClimateHistoryRepository\(\{ getConnection: \(\) => connection \}\)/);
  assert.match(index, /app.get\('\/api\/historico-clima\/catalogo', climateAccess, climateController.catalog\)/);
  assert.match(index, /app.post\('\/api\/historico-clima\/consulta', climateAccess, climateController.consult\)/);
});

test('old interval of exactly 184 days accepted without any age restriction', async () => {
  const old = { ...body, desde: '2001-01-01 00:00:00', hasta: '2001-07-04 00:00:00' };
  assert.equal(validateClimateQuery(old).rangeMs, 184 * 86400000);
  const h = harness({ body: old, rows: [] }); await h.consult();
  assert.equal(h.res.calls[0].code, 200);
  assert.deepEqual(h.queries[1].values.slice(-3, -1), [old.desde, old.hasta]);
});
test('185 days rejected before any SQL with the documented message', async () => {
  const h = harness({ body: { ...body, desde: '2001-01-01 00:00:00', hasta: '2001-07-05 00:00:00' } });
  await h.consult(); assert.equal(h.queries.length, 0); assert.equal(h.res.calls[0].code, 400);
  assert.match(h.res.calls[0].value.message, /El intervalo máximo por consulta es de 184 días, aproximadamente seis meses/);
});
test('validation never reads the current clock, including for ancient periods', () => {
  const RealDate = globalThis.Date;
  class NoCurrentClock extends RealDate {
    constructor(...args) {
      assert.ok(args.length, 'Reading the current date is forbidden');
      super(...args);
    }
    static now() { throw new Error('Reading the current clock is forbidden'); }
  }
  globalThis.Date = NoCurrentClock;
  try {
    for (const year of ['1900', '1980', '2001', '2024']) {
      assert.ok(validateClimateQuery({ ...body, desde: `${year}-01-01 00:00:00`, hasta: `${year}-02-01 00:00:00` }));
    }
  } finally { globalThis.Date = RealDate; }
});
test('same factory label cannot combine different factory IDs; renamed label does not split an ID', async () => {
  const h = harness({ body: { ...body, alcance: 'fabrica', id_instalacion: null, id_fabrica: 'F1' },
    catalog: [catalogRow, { ...catalogRow, id_instalacion: 53, fabrica: 'Etiqueta nueva' },
      { ...catalogRow, id_instalacion: 54, id_fabrica: 'F2' }] });
  await h.consult(); const result = h.res.calls[0].value;
  assert.equal(h.res.calls[0].code, 200); assert.equal(result.id_fabrica, 'F1');
  assert.deepEqual(result.sensores.map(sensor => sensor.id_instalacion), [52, 53]);
  assert.deepEqual(result.resumen_por_sensor.map(sensor => sensor.id_instalacion), [52, 53]);
  assert.equal(result.resumen_por_sensor[0].total_registros, 999);
  assert.equal(result.resumen_por_sensor[1].total_registros, 0);
  for (const metric of METRICS) assert.deepEqual(result.resumen_por_sensor[1][metric], { minimo: null, promedio: null, maximo: null });
});
test('factory selection requires exact catalog ID, never a label or ambiguous scope', async () => {
  for (const value of [
    { ...body, id_fabrica: 'F1' },
    { ...body, alcance: 'fabrica', id_instalacion: null, fabrica: catalogRow.fabrica },
    { ...body, alcance: 'fabrica', id_instalacion: null, id_fabrica: 1 },
    { ...body, alcance: 'fabrica', id_instalacion: null, id_fabrica: '' },
  ]) {
    const h = harness({ body: value }); await h.consult();
    assert.equal(h.res.calls[0].code, 400); assert.equal(h.queries.length, 0);
  }
});
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
test('process-wide gate rejects overlap across service instances; catalog remains accessible', async () => {
  const running = deferred(), entered = deferred();
  let active = 0, peak = 0;
  const first = createClimateHistoryService({ repository: {
    catalog: async () => [catalogRow],
    history: async () => { active++; peak = Math.max(peak, active); entered.resolve();
      try { return await running.promise; } finally { active--; } },
  } });
  const pending = first.consult(body);
  try {
    await entered.promise;
    const other = harness(); await other.consult();
    assert.equal(other.res.calls.length, 1); assert.equal(other.res.calls[0].code, 429);
    assert.equal(other.res.headers['Retry-After'], '5'); assert.equal(other.queries.length, 0);
    const catalogOnly = harness(); await catalogOnly.catalog();
    assert.equal(catalogOnly.res.calls[0].code, 200); assert.equal(catalogOnly.queries.length, 1);
    assert.equal(peak, 1);
  } finally { running.resolve([]); await pending; }
  const after = harness(); await after.consult(); assert.equal(after.res.calls[0].code, 200);
});
test('gate releases after rejected SQL, invalid selection, normalization errors and point overflow', async () => {
  for (const options of [
    { fail: 'catalog' }, { fail: 'history' }, { body: { ...body, id_instalacion: 99 } },
    { rows: [{ ...point, fecha_local: 'invalid' }] }, { rows: Array(MAX_POINTS + 1).fill(point) },
  ]) {
    const h = harness(options); await h.consult(); assert.ok([400, 422, 500].includes(h.res.calls[0].code));
    const after = harness(); await after.consult(); assert.equal(after.res.calls[0].code, 200);
  }
});
test('gate stays held until a failing pending SQL operation actually settles', async () => {
  const running = deferred(), entered = deferred();
  const service = createClimateHistoryService({ repository: {
    catalog: async () => [catalogRow], history: () => { entered.resolve(); return running.promise; },
  } });
  const controller = createClimateHistoryController({ service });
  const res = response(); const pending = controller.consult({ body }, res);
  try {
    await entered.promise;
    const h = harness(); await h.consult(); assert.equal(h.res.calls[0].code, 429);
  } finally { running.reject(new Error('PRIVATE')); await pending; }
  assert.equal(res.calls[0].code, 500); assert.equal(res.calls.length, 1);
  const next = harness(); await next.consult(); assert.equal(next.res.calls[0].code, 200);
});


const selection = ids => ({ alcance: 'seleccion', id_instalaciones: ids, desde: body.desde, hasta: body.hasta });

test('selection of one sensor uses the singular entity label', async () => {
  const h = harness({ body: selection([52]) });
  await h.consult();
  assert.equal(h.res.calls[0].code, 200);
  assert.equal(h.res.calls[0].value.entidad, 'Selección de 1 sensor');
});

test('selection accepts exactly 100 distinct catalog IDs and binds every ID', async () => {
  const ids = Array.from({ length: 100 }, (_, index) => 90000 + index);
  const catalog = ids.map(id_instalacion => ({ ...catalogRow, id_instalacion }));
  const h = harness({ body: selection(ids), catalog, rows: [] });
  await h.consult();
  const [{ code, value }] = h.res.calls;
  assert.equal(code, 200);
  assert.deepEqual(value.sensores.map(s => s.id_instalacion), ids);
  const seconds = samplingSeconds(86400000, 100);
  assert.equal(value.muestreo_segundos, seconds);
  const { sql, values } = h.queries[1];
  assert.equal(sql.match(/id_instalacion IN \(([^)]*)\)/)[1], ids.map(() => '?').join(', '));
  for (const id of ids) assert.ok(!sql.includes(String(id)));
  assert.deepEqual(values, [seconds, ...ids, body.desde, body.hasta, 12001]);
});

for (const [name, list] of [
  ['missing', undefined], ['not array', {}], ['empty', []], ['101 before deduplication', Array(101).fill(52)],
  ...['52', 0, -1, 2.5, null, NaN, {}, Number.MAX_SAFE_INTEGER + 1].map((id, i) => ['invalid element ' + i, [52, id]]),
]) test('selection rejects ' + name + ' before SQL', async () => {
  const h = harness({ body: selection(list) });
  await h.consult();
  assert.equal(h.queries.length, 0);
  assert.equal(h.res.calls.length, 1);
  assert.equal(h.res.calls[0].code, 400);
});

test('selection rejects mixed selectors, unexpected fields and invalid period before SQL', async () => {
  for (const patch of [{ id_instalacion: 52 }, { id_fabrica: 'F1' }, { fabrica: 'name' }, { extra: 1 },
    { hasta: '2027-01-01 00:00:00' }, { alcance: 'sensor', id_instalacion: 52 }, { alcance: 'fabrica', id_fabrica: 'F1' }]) {
    const h = harness({ body: { ...selection([52]), ...patch } });
    await h.consult();
    assert.equal(h.queries.length, 0);
    assert.equal(h.res.calls[0].code, 400);
  }
});

test('selection validates every ID before history and releases the gate on a catalog miss', async () => {
  const missing = harness({ body: selection([52, 999]) });
  await missing.consult();
  assert.deepEqual(missing.queries.map(q => q.sql), [CATALOG_SQL]);
  assert.equal(missing.res.calls.length, 1);
  assert.equal(missing.res.calls[0].code, 400);
  const next = harness({ body: selection(Array(100).fill(52)) });
  await next.consult();
  assert.equal(next.res.calls[0].code, 200);
  assert.equal(next.res.calls[0].value.sensores.length, 1);
});

for (const [secondLabel, secondId, label, id] of [
  ['Norte', 'F1', 'Norte', 'F1'], ['Sur', 'F2', 'Varias fábricas', null],
  ['Norte', 'F2', 'Norte', null], ['Sur', 'F1', 'Varias fábricas', 'F1'],
]) test('selection resolves independent factory label and ID for ' + secondLabel + '/' + secondId, async () => {
  const catalog = [{ ...catalogRow, fabrica: 'Norte' },
    { ...catalogRow, id_instalacion: 205, fabrica: secondLabel, id_fabrica: secondId, info_extra: 'Otro sector' },
    { ...catalogRow, id_instalacion: 999 }];
  const h = harness({ body: { ...selection([205, 52, 205]), id_instalacion: null, id_fabrica: null }, catalog });
  await h.consult();
  const [{ code, value }] = h.res.calls;
  assert.equal(code, 200);
  assert.equal(value.alcance, 'seleccion');
  assert.equal(value.entidad, 'Selección de 2 sensores');
  assert.equal(value.fabrica, label);
  assert.equal(value.id_fabrica, id);
  assert.deepEqual(value.sensores.map(s => s.id_instalacion), [205, 52]);
  assert.deepEqual(value.resumen_por_sensor.map(s => s.id_instalacion), [205, 52]);
  assert.deepEqual(value.puntos.map(p => p.id_instalacion), [52]);
  const empty = value.resumen_por_sensor[0];
  assert.equal(empty.total_registros, 0);
  for (const metric of METRICS) assert.deepEqual(empty[metric], { minimo: null, promedio: null, maximo: null });
  assert.deepEqual(h.queries[1].values, [samplingSeconds(86400000, 2), 205, 52, body.desde, body.hasta, 12001]);
});

test('selection binds three distinct IDs in order; sampling uses neither catalog size nor raw list length', async () => {
  const ids = [110, 205, 309];
  const catalog = [...ids, ...Array.from({ length: 97 }, (_, i) => i + 1)].map(id => ({ ...catalogRow, id_instalacion: id }));
  const h = harness({ body: selection([...ids, ...Array(97).fill(110)]), catalog, rows: [] });
  await h.consult();
  assert.equal(h.res.calls[0].code, 200);
  const { sql, values } = h.queries[1];
  assert.match(sql, /WHERE id_instalacion IN \(\?, \?, \?\)/);
  assert.equal(sql.match(/\?/g).length, 7);
  assert.doesNotMatch(sql, /\b(110|205|309)\b/);
  assert.deepEqual(values, [600, ...ids, body.desde, body.hasta, 12001]);
});

test('selection shares the process gate through a failing history query', async () => {
  const entered = deferred(), pending = deferred();
  const service = createClimateHistoryService({ repository: { catalog: async () => [catalogRow],
    history: () => { entered.resolve(); return pending.promise; } } });
  const res = response();
  const running = createClimateHistoryController({ service }).consult({ body: selection([52]) }, res);
  await entered.promise;
  try {
    const busy = harness({ body: selection([52]) });
    await busy.consult();
    assert.equal(busy.res.calls[0].code, 429);
    assert.equal(busy.res.headers['Retry-After'], '5');
    assert.equal(busy.queries.length, 0);
  } finally { pending.reject(new Error('PRIVATE')); await running; }
  assert.equal(res.calls.length, 1);
  assert.equal(res.calls[0].code, 500);
  assert.doesNotMatch(res.calls[0].value.message, /PRIVATE/);
  const overflow = harness({ body: selection([52]), rows: Array(MAX_POINTS + 1).fill(point) });
  await overflow.consult();
  assert.deepEqual(overflow.res.calls, [{ code: 422, value: { message: 'La consulta supera 12000 puntos. Reducí el período o la cantidad de sensores.' } }]);
});
