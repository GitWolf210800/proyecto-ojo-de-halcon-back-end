import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegister } from '../app/controllers/register.controller.js';

// Only synthetic values; no application bootstrap, DB driver or environment loaded.
function harness(options = {}) {
    const calls = [];
    const createdUsers = [];
    const cryptoCalls = [];
    const body = {
        name: "Test O'Example", lastName: 'Fixture', legajo: '123', puesto: 'Test',
        email: 'fixture@example.invalid', clavex: 'VISITANTE',
        passUser: 'synthetic-input', legajoPat: '456', passUserPat: 'synthetic-input'
    };
    const connection = {
        query(sql, values, callback) {
            calls.push({ sql, values });
            const step = calls.length;
            const complete = () => {
                if (options.failQuery === step) return callback(new Error('Synthetic failure'));
                if (step === 1) return callback(null, options.missing ? [] : [{ passwordd: 'synthetic-hash', id_priv: options.role ?? 0 }]);
                if (step === 2) return callback(null, options.duplicate ? [{ id_legajo: 123 }] : []);
                createdUsers.push(values);
                callback(null, { affectedRows: 1 });
            };
            // Callbacks deliberately run after query() returns, as with the real driver.
            if (step === 1 && options.deferSponsor) options.deferSponsor(complete);
            else setImmediate(complete);
        }
    };
    const bcryptjs = {
        async compare() {
            cryptoCalls.push('compare');
            await new Promise(resolve => setImmediate(resolve));
            if (options.failCompare) throw new Error('Synthetic failure');
            return options.validPassword ?? true;
        },
        async genSalt() {
            cryptoCalls.push('genSalt');
            if (options.failGenSalt) throw new Error('Synthetic failure');
            return 'synthetic-salt';
        },
        async hash() {
            cryptoCalls.push('hash');
            if (options.failHash) throw new Error('Synthetic failure');
            return 'synthetic-hash';
        }
    };
    const responses = [];
    const res = {
        statusCode: 200,
        status(code) { this.statusCode = code; return this; },
        send(payload) { responses.push({ code: this.statusCode, payload }); return this; }
    };
    let activeConnection = connection;
    const register = createRegister({ getConnection: () => activeConnection, bcryptjs });
    return {
        calls, createdUsers, cryptoCalls, responses, body, connection,
        setConnection(next) { activeConnection = next; },
        run: () => register(options.missingBody ? {} : { body }, res)
    };
}

const denials = [
    ['incorrect sponsor password', { validPassword: false }, 'Error de password de usuario Patrocinador'],
    ['missing sponsor', { missing: true }, 'El Usuario Patrocinador ingresado no existe'],
    ...[1, 2, 3, 4, 5, 6, 99, '0'].map(role => [
        `unauthorized sponsor role ${JSON.stringify(role)}`, { role },
        'El usuario patrocinador ingresado, no tiene autorizacion para la solicitud!'
    ])
];

for (const [label, options, message] of denials) {
    test(`${label}: no user creation or SQL writes, one compatible denial`, async () => {
        const h = harness(options);
        await h.run();
        await new Promise(resolve => setImmediate(resolve));
        assert.equal(h.calls.length, 1);
        assert.match(h.calls[0].sql, /^SELECT /);
        assert.deepEqual(h.createdUsers, []);
        assert.equal(h.cryptoCalls.includes('hash'), false);
        assert.equal(h.cryptoCalls.includes('genSalt'), false);
        assert.deepEqual(h.responses, [{ code: 400, payload: { status: 'Error', message } }]);
    });
}

test('pending sponsor authorization cannot start subsequent work', async () => {
    let release;
    const h = harness({ validPassword: false, deferSponsor: complete => { release = complete; } });
    const pending = h.run();
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(h.calls.length, 1);
    assert.deepEqual(h.cryptoCalls, []);
    assert.deepEqual(h.createdUsers, []);
    assert.deepEqual(h.responses, []);
    release();
    await pending;
    assert.equal(h.calls.length, 1);
    assert.equal(h.responses[0].code, 400);
});

for (const options of [{ failQuery: 1 }, { failCompare: true }, { failQuery: 2 }, { failGenSalt: true }, { failHash: true }]) {
    test(`dependency failure stops before SQL writes: ${JSON.stringify(options)}`, async () => {
        const h = harness(options);
        await h.run();
        assert.ok(h.calls.every(call => call.sql.startsWith('SELECT ')));
        assert.deepEqual(h.createdUsers, []);
        assert.deepEqual(h.responses, [{ code: 500, payload: { status: 'Error', message: 'Error al registrar usuario' } }]);
    });
}

test('existing target user stops before hashing or insertion', async () => {
    const h = harness({ duplicate: true });
    await h.run();
    assert.equal(h.calls.length, 2);
    assert.deepEqual(h.createdUsers, []);
    assert.deepEqual(h.cryptoCalls, ['compare']);
    assert.deepEqual(h.responses, [{ code: 400, payload: { status: 'Error', message: 'Este Usuario ya Existe!' } }]);
});

test('authorized sponsor creates exactly one user with bound values and original response', async () => {
    const h = harness();
    await h.run();
    assert.equal(h.calls.length, 3);
    assert.deepEqual(h.calls[0].values, ['456']);
    assert.deepEqual(h.calls[1].values, [123]);
    assert.match(h.calls[2].sql, /^INSERT INTO usuarios /);
    assert.equal(h.calls[2].sql.includes(h.body.name), false);
    assert.deepEqual(h.createdUsers, [[123, h.body.name, 'Fixture', 'Test', h.body.email, 'synthetic-hash', 3]]);
    assert.deepEqual(h.cryptoCalls, ['compare', 'genSalt', 'hash']);
    assert.deepEqual(h.responses, [{ code: 201, payload: { status: 'ok', message: 'Usuario 123 agregado', redirect: '/' } }]);
});

test('failed insertion never reports success', async () => {
    const h = harness({ failQuery: 3 });
    await h.run();
    assert.deepEqual(h.createdUsers, []);
    assert.equal(h.responses.length, 1);
    assert.equal(h.responses[0].code, 500);
});

test('connection replaced after controller creation is used for every query', async () => {
    const old = harness();
    const next = harness();
    old.setConnection(next.connection);
    await old.run();
    assert.deepEqual(old.calls, []);
    assert.deepEqual(old.createdUsers, []);
    assert.equal(next.calls.length, 3);
    assert.ok(next.calls.slice(0, 2).every(call => call.sql.startsWith('SELECT ')));
    assert.match(next.calls[2].sql, /^INSERT /);
    assert.equal(next.createdUsers.length, 1);
    assert.equal(old.responses.length, 1);
    assert.equal(old.responses[0].code, 201);
});

test('connection provider is consulted again between queries', async () => {
    let release;
    const h = harness({ deferSponsor: complete => { release = complete; } });
    const pending = h.run();
    const nextCalls = [];
    h.setConnection({
        query(sql, values, callback) {
            nextCalls.push({ sql, values });
            setImmediate(() => callback(null, sql.startsWith('SELECT ') ? [] : { affectedRows: 1 }));
        }
    });
    release();
    await pending;
    assert.equal(h.calls.length, 1);
    assert.equal(nextCalls.length, 2);
    assert.match(nextCalls[0].sql, /^SELECT /);
    assert.match(nextCalls[1].sql, /^INSERT /);
    assert.equal(h.responses.length, 1);
    assert.equal(h.responses[0].code, 201);
});

for (const role of ['0', 0, 'ROL_DESCONOCIDO', 'SUPER_USER ', {}, false, []]) {
    test(`invalid clavex ${JSON.stringify(role)}: no SQL or bcrypt calls`, async () => {
        const h = harness();
        h.body.clavex = role;
        await h.run();
        assert.deepEqual(h.calls, []);
        assert.deepEqual(h.cryptoCalls, []);
        assert.deepEqual(h.createdUsers, []);
        assert.deepEqual(h.responses, [{ code: 400, payload: { status: 'Error', message: 'Rol inválido' } }]);
    });
}

for (const [role, expected] of [
    ['SUPER_USER', 0], ['ADMIN_LIMITES', 1], ['CALIBRACION_CLIMA', 2], ['VISITANTE', 3],
    [undefined, null], [null, null], ['', null]
]) {
    test(`allowed clavex ${JSON.stringify(role)} maps to ${expected}`, async () => {
        const h = harness();
        if (role === undefined) delete h.body.clavex;
        else h.body.clavex = role;
        await h.run();
        assert.equal(h.createdUsers.length, 1);
        assert.equal(h.createdUsers[0][6], expected);
        assert.equal(h.responses.length, 1);
        assert.equal(h.responses[0].code, 201);
    });
}

test('missing request body returns one generic error without SQL or bcrypt', async () => {
    const h = harness({ missingBody: true });
    await h.run();
    assert.deepEqual(h.calls, []);
    assert.deepEqual(h.cryptoCalls, []);
    assert.deepEqual(h.createdUsers, []);
    assert.deepEqual(h.responses, [{ code: 500, payload: { status: 'Error', message: 'Error al registrar usuario' } }]);
});
