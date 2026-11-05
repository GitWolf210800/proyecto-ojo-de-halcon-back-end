import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { EventEmitter } from 'node:events';
import { FILTER_METRICS as M } from '../app/services/filter-history-metrics.js';
import { createFilterHistoryService, validateFilterQuery, normalizeFilterCatalog, historicalValues,
  filterSamplingSeconds } from '../app/services/filter-history.js';
import { createFilterHistoryRepository, CATALOG_SQL, presenceStatement, historyStatement,
  exportStatement, exportBudget } from '../app/repositories/filter-history.repository.js';
import { createFilterHistoryController } from '../app/controllers/filter-history.controller.js';
import { createClimateHistoryService } from '../app/services/climate-history.js';
import { createClimateHistoryController } from '../app/controllers/climate-history.controller.js';
import { createClimateHistoryAccess } from '../app/middlewares/climate-history-access.js';

const body = { alcance: 'seleccion', id_instalaciones: [52], desde: '2020-01-01 00:00:00', hasta: '2020-01-02 00:00:00' };
const sensor = (id = 52, extra = {}) => ({ id_instalacion: id, instalacion_existente: id, nombre: `Filtro ${id}`,
  fabrica: 'Fábrica A', id_fabrica: ' A-1 ', info_extra: 'Sector A', id_instalacion_fisica: 4,
  estado: 'ACTIVO', tiene_configuracion_actual: 1, ...extra });
const row = (extra = {}) => ({ id_medicion: 1, id_instalacion: 52, fecha_local: '2020-01-01T01:00:00',
  estado: 1, filtro: 0, min_filtro: 10, max_filtro: 0, total_registros: 99, total_registros_sensor: 99,
  filtro_minimo: 0, filtro_promedio: 5, filtro_maximo: 10, ...extra });
const metric = name => M.find(m => m.campo === name);
function response() {
  return { calls: [], headers: {}, status(code) { this.code = code; return this; },
    set(name, value) { this.headers[name] = value; return this; },
    json(value) { this.calls.push({ code: this.code, value }); return this; } };
}
function harness(options = {}) {
  const calls = [];
  let accesses = 0;
  let connection = { query(sql, values, callback) {
    const kind = sql === CATALOG_SQL ? 'catalog' : sql.startsWith('SELECT MAX') ? 'presence'
      : sql.includes('marcada AS') ? 'history' : 'export';
    calls.push({ kind, sql, values });
    queueMicrotask(() => {
      callback(options.fail === kind ? new Error('PRIVATE DRIVER SQL DETAIL') : null,
        kind === 'catalog' ? options.catalog ?? [sensor()] : kind === 'presence' ? options.presence ?? [{ filtro: 1 }]
          : options.rows ?? [row()]);
      if (options.duplicate) callback(new Error('SECOND CALLBACK'));
    });
  } };
  const repository = createFilterHistoryRepository({ getConnection: () => { accesses++; return connection; } });
  const service = createFilterHistoryService({ repository, makeId: () => 'fixture-id' });
  const controller = createFilterHistoryController({ service });
  return { calls, service, controller, repository, get accesses() { return accesses; },
    replaceConnection(value) { connection = value; },
    async request(operation = 'consult', value = body) {
      const res = response(); await controller[operation]({ body: value }, res); return res;
    } };
}

test('closed registry has precisely the approved 17 metrics and 34 limits', () => {
  assert.deepEqual(M.map(m => m.campo), ['filtro_ventilador', 'prefiltro', 'prefiltro_ventilador', 'filtro',
    'filtro_prefiltro', 'ventilador', 'ventilador_1', 'ventilador_2', 'ventilador_3', 'ventilador_4',
    'picos', 'picos2', 'rpm_filtro', 'rpm_filtro2', 'carro', 'carro2', 'desperdicio']);
  assert.equal(M.reduce((n, m) => n + m.limites.length, 0), 34);
  assert.deepEqual(metric('desperdicio').limites, [{ campo: 'min_desperdicio', tipo: 'min' }]);
  assert.deepEqual(metric('filtro_ventilador').limites.map(l => l.campo),
    ['min_filtro_ventilador', 'max_filtro_ventilador', 'max_alarma_filtro_ventilador']);
  for (const m of M) {
    assert.equal(m.unidad, m.campo.startsWith('rpm') ? 'RPM' : m.campo.startsWith('carro') ? '%' : 'Pa');
    assert.ok(Object.isFrozen(m) && Object.isFrozen(m.limites));
  }
  for (const statement of [presenceStatement([52], body.desde, body.hasta),
    historyStatement([52], body.desde, body.hasta, 60, M), exportStatement([52], body.desde, body.hasta, M)]) {
    assert.doesNotMatch(statement.sql, /ciclon|cilcon|max_desperdicio/i);
  }
});

for (const estado of [1, 0, null, undefined]) test(`historical state ${estado} in graph and export`, async () => {
  for (const operation of ['consult', 'export']) {
    const res = await harness({ rows: [row({ estado })] }).request(operation);
    assert.equal(res.code, 200);
    assert.equal(res.calls.length, 1);
    const result = res.calls[0].value;
    assert.equal((result.puntos ?? result.filas)[0].estado, estado ?? null);
    assert.equal(result.sensores[0].estado_instalacion, 'ACTIVO');
  }
});
test('invalid historical state is a controlled error and releases the shared lease', async () => {
  for (const estado of ['ACTIVO', '1', 1.5, Number.MAX_SAFE_INTEGER + 1, NaN, Infinity, false, {}]) {
    for (const operation of ['consult', 'export']) {
      const res = await harness({ rows: [row({ estado })] }).request(operation);
      assert.equal(res.code, 500);
      assert.equal(res.calls.length, 1);
      assert.deepEqual(res.calls[0].value, { message: 'No se pudo consultar el histórico de filtros.' });
      const next = await harness().request(operation === 'consult' ? 'export' : 'consult');
      assert.equal(next.code, 200);
    }
  }
});

test('catalog union, explicit columns, left join and no current-limit masking', async () => {
  assert.match(CATALOG_SQL, /UNION/); assert.match(CATALOG_SQL, /SELECT DISTINCT id_instalacion FROM mediciones_filtros WHERE id_instalacion IS NOT NULL/);
  assert.match(CATALOG_SQL, /LEFT JOIN instalaciones/); assert.doesNotMatch(CATALOG_SQL, /SELECT \*/);
  const h = harness({ catalog: [sensor(), sensor(53, { tiene_configuracion_actual: 0 }),
    sensor(54, { instalacion_existente: null }), sensor(55, { estado: 'INACTIVO' }), sensor(56, { estado: null })] });
  const res = await h.request('catalog');
  assert.equal(res.code, 200);
  assert.deepEqual(res.calls[0].value.sensores.map(s => s.situacion_catalogo), ['activo', 'historico', 'historico', 'inactivo', 'inactivo']);
  const missing = res.calls[0].value.sensores[2];
  assert.equal(missing.nombre, 'Filtro #54'); assert.equal(missing.etiqueta, 'Filtro #54');
  for (const key of ['descripcion', 'fabrica', 'id_fabrica', 'id_instalacion_fisica', 'estado_instalacion']) assert.equal(missing[key], null);
  assert.equal(res.calls[0].value.sensores[0].id_fabrica, 'A-1');
  assert.equal(res.calls[0].value.sensores[0].descripcion, 'Sector A');
});
for (const estado of ['', ' ', null, undefined, 'INACTIVO', 'activo']) test(`non-ACTIVO state ${estado} is inactive`, () => {
  assert.equal(normalizeFilterCatalog([sensor(52, { estado })])[0].situacion_catalogo, 'inactivo');
});
test('invalid/duplicate catalog IDs fail closed', () => {
  for (const rows of [[sensor(0)], [sensor('SQL')], [sensor(), sensor()]]) assert.throws(() => normalizeFilterCatalog(rows));
});

for (const m of M) test(`historical eligibility and zero/null semantics: ${m.campo}`, () => {
  const limit = m.limites[0].campo;
  assert.equal(historicalValues({ [m.campo]: 0, [limit]: -2 }, [m])[m.campo], 0);
  for (const value of [null, 0, '0', undefined, '', 'bad']) {
    const values = historicalValues({ [m.campo]: 10, [limit]: value }, [m]);
    assert.equal(values[m.campo], null); assert.equal(values[limit], null);
  }
  for (const value of [null, '', undefined, 'bad', false]) assert.equal(historicalValues({ [m.campo]: value, [limit]: 10 }, [m])[m.campo], null);
});
test('retired filter with historical limits remains consultable without current configuration', async () => {
  const h = harness({ catalog: [sensor(52, { tiene_configuracion_actual: 0 })] });
  const res = await h.request(); assert.equal(res.code, 200);
  const data = res.calls[0].value;
  assert.equal(data.puntos[0].filtro, 0); assert.equal(data.puntos[0].max_filtro, null);
  assert.equal(data.sensores[0].situacion_catalogo, 'historico');
  assert.equal(data.resumen.total_registros, 99); assert.equal(data.resumen.puntos_mostrados, 1);
  assert.equal(data.resumen_por_sensor[0].metricas.filtro.promedio, 5);
});

const invalid = [null, [], 'body', {}, { ...body, alcance: 'sensor' }, { ...body, id_fabrica: null },
  { ...body, tabla: 'SQL' }, { ...body, id_instalaciones: [] }, { ...body, id_instalaciones: Array(101).fill(52) },
  ...[0, -1, 1.2, '52', null, true, Number.MAX_SAFE_INTEGER + 1].map(id => ({ ...body, id_instalaciones: [id] })),
  ...['2020-02-30 00:00:00', '2019-02-29 00:00:00', '2020-01-01T00:00:00', '2020-01-01 24:00:00', '2020-1-01 00:00:00'].map(desde => ({ ...body, desde })),
  { ...body, hasta: body.desde }, { ...body, hasta: '2019-01-01 00:00:00' },
  { ...body, hasta: '2020-07-04 00:00:00' }];
for (const [i, value] of invalid.entries()) test(`invalid request ${i} rejected before any SQL in both operations`, async () => {
  const h = harness();
  for (const op of ['consult', 'export']) { const res = await h.request(op, value); assert.equal(res.code, 400); assert.equal(res.calls.length, 1); }
  assert.equal(h.calls.length, 0);
});
test('old 184 days accepted, 185 days refused without clock restriction', async () => {
  const h = harness({ presence: [{}] });
  for (const op of ['consult', 'export']) {
    assert.equal((await h.request(op, { ...body, desde: '2000-01-01 00:00:00', hasta: '2000-07-03 00:00:00' })).code, 200);
    const count = h.calls.length;
    assert.equal((await h.request(op, { ...body, desde: '2000-01-01 00:00:00', hasta: '2000-07-04 00:00:00' })).code, 400);
    assert.equal(h.calls.length, count);
  }
});
test('ordered deduplication and all unknown IDs refused before presence/history/export', async () => {
  assert.deepEqual(validateFilterQuery({ ...body, id_instalaciones: [53, 52, 53] }).id_instalaciones, [53, 52]);
  const h = harness();
  for (const op of ['consult', 'export']) assert.equal((await h.request(op, { ...body, id_instalaciones: [52, 53] })).code, 400);
  assert.deepEqual(h.calls.map(c => c.kind), ['catalog', 'catalog']);
});
test('100 distinct IDs across factories retain order and parameterize every IN member', async () => {
  const ids = Array.from({ length: 100 }, (_, i) => 10000 + i).reverse();
  const h = harness({ catalog: ids.map(id => sensor(id, { fabrica: id % 2 ? 'B' : 'A' })), rows: [] });
  const res = await h.request('consult', { ...body, id_instalaciones: ids });
  assert.equal(res.code, 200); assert.deepEqual(res.calls[0].value.sensores.map(s => s.id_instalacion), ids);
  assert.equal(res.calls[0].value.resumen_por_sensor.length, 100);
  const sql = h.calls.find(c => c.kind === 'history');
  assert.equal(sql.sql.match(/IN \(([^)]+)\)/)[1].match(/\?/g).length, 100);
  assert.deepEqual(sql.values.slice(0, 100), ids);
  for (const id of ids) assert.ok(!sql.sql.includes(String(id)));
  assert.equal(sql.values.at(-2), filterSamplingSeconds(86400000, 100, 1));
  const count = h.calls.length;
  assert.equal((await h.request('consult', { ...body, id_instalaciones: [...ids, 20000] })).code, 400);
  assert.equal(h.calls.length, count);
});
test('different historical metrics per filter and sensors without records', async () => {
  const h = harness({ catalog: [sensor(), sensor(53), sensor(54)], presence: [{ filtro: 1, carro: 1 }],
    rows: [row(), row({ id_medicion: 2, id_instalacion: 53, filtro: null, min_filtro: null,
      carro: 20, min_carro: 10, carro_minimo: 20, carro_promedio: 20, carro_maximo: 20 })] });
  const data = (await h.request('consult', { ...body, id_instalaciones: [54, 53, 52] })).calls[0].value;
  assert.deepEqual(data.metricas.map(m => m.campo), ['filtro', 'carro']);
  assert.equal(data.puntos[0].carro, null); assert.equal(data.puntos[1].filtro, null);
  assert.deepEqual(data.resumen_por_sensor[0], { id_instalacion: 54, total_registros: 0,
    metricas: { filtro: { minimo: null, promedio: null, maximo: null }, carro: { minimo: null, promedio: null, maximo: null } } });
});
test('empty effective union skips heavy SQL but preserves all selected sensors and summaries', async () => {
  const h = harness({ presence: [{}] });
  const data = (await h.request()).calls[0].value;
  assert.deepEqual(data.puntos, []); assert.deepEqual(data.metricas, []); assert.equal(data.muestreo_segundos, null);
  assert.equal(data.sensores.length, 1); assert.equal(data.resumen_por_sensor[0].total_registros, 0);
  assert.deepEqual(data.resumen_por_sensor[0].metricas, {});
  const exp = (await h.request('export')).calls[0].value;
  assert.equal(exp.total_exportado, 0); assert.deepEqual(exp.filas, []);
  assert.deepEqual(h.calls.map(c => c.kind), ['catalog', 'presence', 'catalog', 'presence']);
});
test('presence is aggregate without windows, using each historical row, never current configuration', () => {
  const s = presenceStatement([52, 53], body.desde, body.hasta);
  assert.equal((s.sql.match(/MAX\(CASE/g) ?? []).length, 17);
  assert.doesNotMatch(s.sql, /OVER|filtros_limites|nombre|estado|LIMIT/);
  assert.match(s.sql, /`filtro` IS NOT NULL AND \(NULLIF\(`min_filtro`, 0\)/);
  assert.deepEqual(s.values, [52, 53, body.desde, body.hasta]);
});
test('statistics precede reduction, only effective metrics get windows, all dynamic values bound', () => {
  const s = historyStatement([52, 53], body.desde, body.hasta, 600, [metric('filtro')]);
  assert.deepEqual(s.values, [52, 53, body.desde, body.hasta, 600, 12001]);
  assert.equal((s.sql.match(/\?/g) ?? []).length, s.values.length);
  assert.ok(s.sql.indexOf('AVG(`filtro`)') < s.sql.indexOf('marcada AS'));
  assert.match(s.sql, /COUNT\(\*\) OVER \(PARTITION BY id_instalacion\)/);
  assert.equal((s.sql.match(/ROW_NUMBER/g) ?? []).length, 4);
  assert.doesNotMatch(s.sql, /carro|ventilador/);
  assert.match(s.sql, /ORDER BY fecha ASC, id_instalacion ASC, id_medicion ASC\nLIMIT \?/);
  assert.throws(() => historyStatement([52], body.desde, body.hasta, 60, [{ campo: 'injected' }]));
  assert.throws(() => historyStatement(['52 OR 1'], body.desde, body.hasta, 60, M));
});
test('documented SQL matches the actual statements, including all presence expressions', () => {
  const text = readFileSync(new URL('../docs/filter-history.sql', import.meta.url), 'utf8');
  const statements = text.split('\n').filter(line => !line.trim().startsWith('--')).join('\n').split(';').filter(s => s.trim());
  const compact = sql => sql.replace(/\s+/g, ' ').trim();
  assert.deepEqual(statements.map(compact), [CATALOG_SQL,
    presenceStatement([52, 53], body.desde, body.hasta).sql,
    historyStatement([52, 53], body.desde, body.hasta, 300, [metric('filtro')]).sql,
    exportStatement([52, 53], body.desde, body.hasta, [metric('filtro')]).sql].map(compact));
});
test('invalid history rows fail closed and release the lease in both operations', async () => {
  for (const extra of [{ id_instalacion: 999 }, { id_medicion: 0 }, { fecha_local: '2020-02-30T00:00:00' },
    { fecha_local: '2019-12-31T23:59:59' }, { filtro: null }, { min_filtro: 0 }]) {
    for (const op of ['consult', 'export']) {
      const res = await harness({ rows: [row(extra)] }).request(op);
      assert.equal(res.code, 500); assert.deepEqual(Object.keys(res.calls[0].value), ['message']);
    }
  }
  assert.equal((await harness().request()).code, 200);
});
for (const sensors of [1, 7, 20, 30, 100]) for (const metrics of [1, 4, 17]) test(`184-day sampling budget ${sensors} sensors, ${metrics} metrics`, () => {
  const range = 184 * 86400000, seconds = filterSamplingSeconds(range, sensors, metrics);
  assert.ok((Math.ceil(range / 1000 / seconds) + 1) * sensors * (2 + 2 * metrics) <= 12000);
  if (sensors >= 20 && metrics >= 4) assert.ok(seconds > 86400);
});
test('invalid sampling arguments rejected', () => {
  for (const count of [0, -1, 1.5, '2', 101]) assert.throws(() => filterSamplingSeconds(86400000, count, 1));
});
for (const count of [12000, 12001]) test(`graph hard limit ${count}`, async () => {
  const h = harness({ rows: Array.from({ length: count }, (_, i) => row({ id_medicion: i + 1 })) });
  const res = await h.request(); assert.equal(res.code, count === 12000 ? 200 : 422);
  if (count === 12000) assert.equal(res.calls[0].value.puntos.length, count);
  else assert.deepEqual(Object.keys(res.calls[0].value), ['message']);
});
test('export budget counts values and exact limits; full rows without windows or truncation', async () => {
  assert.deepEqual(exportBudget(M), { columnas: 59, limite_filas: 25423 });
  assert.deepEqual(exportBudget([metric('desperdicio')]), { columnas: 10, limite_filas: 60000 });
  const sql = exportStatement([52], body.desde, body.hasta, M);
  assert.deepEqual(sql.values, [52, body.desde, body.hasta, 25424]);
  assert.doesNotMatch(sql.sql, /ROW_NUMBER|OVER|bloque|filtros_limites/);
  assert.match(sql.sql, /ORDER BY fecha ASC, id_instalacion ASC, id_medicion ASC/);
  const h = harness(); const data = (await h.request('export')).calls[0].value;
  assert.equal(data.muestreado, false); assert.equal(data.total_exportado, 1);
  assert.equal(data.columnas, 11); assert.equal(data.filas[0].filtro, 0);
  assert.deepEqual(h.calls.map(c => c.kind), ['catalog', 'presence', 'export']);
});
for (const count of [25423, 25424]) test(`export accepts exact limit and rejects extra row ${count}`, async () => {
  const h = harness({ presence: [Object.fromEntries(M.map(m => [m.campo, 1]))],
    rows: Array.from({ length: count }, (_, i) => row({ id_medicion: i + 1 })) });
  const res = await h.request('export'); assert.equal(res.code, count === 25423 ? 200 : 422);
  if (res.code === 200) assert.equal(res.calls[0].value.filas.length, count);
  else assert.deepEqual(Object.keys(res.calls[0].value), ['message']);
});
test('export revalidates catalog after an earlier graph query', async () => {
  const h = harness(); assert.equal((await h.request()).code, 200);
  h.replaceConnection({ query(sql, values, callback) { assert.equal(sql, CATALOG_SQL); callback(null, []); } });
  assert.equal((await h.request('export')).code, 400);
});
for (const fail of ['catalog', 'presence', 'history', 'export']) test(`generic error, single response and lease release after ${fail} failure`, async () => {
  const h = harness({ fail, duplicate: true });
  const res = await h.request(fail === 'export' ? 'export' : 'consult');
  assert.equal(res.code, 500); assert.equal(res.calls.length, 1);
  assert.doesNotMatch(JSON.stringify(res.calls), /PRIVATE|DRIVER|SQL|stack/);
  assert.equal((await harness().request()).code, 200);
});
test('dynamic connection per operation and duplicate callbacks never send twice', async () => {
  const h = harness({ duplicate: true }); const res = await h.request();
  assert.equal(h.accesses, 3); assert.equal(res.calls.length, 1);
  h.replaceConnection({ query(sql, values, callback) { callback(null, []); } });
  assert.deepEqual(await h.service.catalog(), []); assert.equal(h.accesses, 4);
});

for (const holder of ['climate', 'consult', 'export']) test(`shared lease held by ${holder}, HTTP disconnect cannot release pending SQL`, async () => {
  let releaseSQL, started;
  const ready = new Promise(resolve => { started = resolve; });
  const pending = () => new Promise(resolve => { releaseSQL = () => resolve([]); started(); });
  const climate = createClimateHistoryService({ repository: { catalog: async () => [sensor()], history: pending } });
  const filters = createFilterHistoryService({ repository: { catalog: async () => [sensor()],
    presence: async () => [{ filtro: 1 }], history: pending, exportRows: pending } });
  const req = Object.assign(new EventEmitter(), { body });
  const controller = holder === 'climate' ? createClimateHistoryController({ service: climate })
    : createFilterHistoryController({ service: filters });
  const res = response(); const running = controller[holder === 'export' ? 'export' : 'consult'](req, res);
  await ready;
  try {
    req.emit('close'); req.emit('aborted');
    assert.equal((await climate.catalog()).length, 1); assert.equal((await filters.catalog()).length, 1);
    const competitors = [
      [createClimateHistoryController({ service: climate }), 'consult'],
      [createFilterHistoryController({ service: filters }), 'consult'],
      [createFilterHistoryController({ service: filters }), 'export'],
    ];
    for (const [other, op] of competitors) {
      const busy = response(); await other[op]({ body }, busy);
      assert.equal(busy.code, 429); assert.equal(busy.headers['Retry-After'], '5'); assert.equal(busy.calls.length, 1);
    }
  } finally { releaseSQL(); await running; }
  assert.equal(res.code, 200); assert.equal((await harness().request()).code, 200);
});

test('all three routes reuse the same access middleware via neutral alias', () => {
  const source = readFileSync(new URL('../app/index.js', import.meta.url), 'utf8');
  assert.match(source, /const historyAccess = climateAccess/);
  for (const route of ['catalogo', 'consulta', 'exportacion']) assert.match(source,
    new RegExp(`'/api/historico-filtros/${route}', historyAccess, filterController\\.`));
});
for (const operation of ['catalog', 'consult', 'export']) test(`access policy before ${operation}: anonymous local, HS256 existing user otherwise`, async () => {
  for (const mode of ['local', 'internet', undefined]) {
    let users = 0;
    const access = createClimateHistoryAccess({ getAccessMode: () => mode,
      verifyJwt(token, options) { assert.deepEqual(options, { algorithms: ['HS256'] }); if (token !== 'fixture') throw Error(); return { user: 1 }; },
      repository: { findUser: async () => { users++; return [{ id_legajo: 1, id_priv: 99 }]; } } });
    const h = harness(), res = response(), req = { body, cookies: {} };
    await access(req, res, () => h.controller[operation](req, res));
    assert.equal(res.code, mode === 'local' ? 200 : 401);
    if (mode !== 'local') assert.equal(h.calls.length, 0);
    assert.equal(users, 0);
    const valid = response(); req.cookies.jwt = 'fixture';
    await access(req, valid, () => h.controller[operation](req, valid)); assert.equal(valid.code, 200);
  }
});
