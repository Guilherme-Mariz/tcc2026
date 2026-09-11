const test = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const express = require('express');
const cookieParser = require('cookie-parser');
const Service = require('../services/activityService');
const Repository = require('../services/activityRepository');
const createRouter = require('../routes/activityRoutes');
const catalog = require('../data/activities.json');
const childId = randomUUID(), foreignChild = randomUUID();
const payload = (overrides = {}) => ({ childId, activityId: catalog[0].id, realizationId: randomUUID(), ...overrides });
function fixture() {
    const records = [];
    const repository = {
        async findActivity(id) { return catalog.find(a => a.id === id); },
        async insertCompletion(row) {
            const found = records.find(r => r.id === row.id);
            if (found) return { record: found, created: false };
            records.push({ ...row, created_at: new Date().toISOString() });
            return { record: records.at(-1), created: true };
        },
        async completedActivityIds(id) { return [...new Set(records.filter(r => r.crianca_id === id).map(r => r.atividade_id))]; }
    };
    const children = {
        async findResponsibleIdByUserId(user) { return user === 'parent-a' ? 'responsible-a' : null; },
        async findById(id, parent) { return id === childId && parent === 'responsible-a' ? { id } : null; }
    };
    return { records, repository, service: new Service({ repository, children }) };
}

test('HTTP: autenticação real, conclusão, reenvio, repetição e isolamento', async () => {
    const f = fixture();
    // Só o provedor externo é simulado; middleware, rotas e validações são reais.
    const configPath = require.resolve('../config/supabase');
    const old = require.cache[configPath];
    require.cache[configPath] = { id: configPath, filename: configPath, loaded: true, exports: {
        auth: { async getUser(token) { return token === 'valid-token'
            ? { data: { user: { id: 'parent-a' } }, error: null }
            : { data: { user: null }, error: { message: 'expired' } }; } }
    } };
    const authenticate = require('../middleware/authMiddleware');
    if (old) require.cache[configPath] = old; else delete require.cache[configPath];
    const app = express(); app.use(cookieParser()); app.use(express.json());
    app.use('/api/activities', createRouter({ service: f.service, authenticate }));
    const server = app.listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    const base = `http://127.0.0.1:${server.address().port}/api/activities`;
    const post = (body, cookie = 'token=valid-token', type = 'application/json') => fetch(base + '/complete', {
        method: 'POST', headers: { Cookie: cookie, 'Content-Type': type }, body: JSON.stringify(body)
    });
    try {
        assert.equal((await post(payload(), '')).status, 401);
        assert.equal((await post(payload(), 'token=expired')).status, 401);
        assert.equal((await post(payload(), 'token=valid-token', 'text/plain')).status, 415);
        assert.equal((await post(payload({ childId: foreignChild }))).status, 403);
        assert.equal((await fetch(base + `/progress/${foreignChild}`, { headers: { Cookie: 'token=valid-token' } })).status, 403);
        assert.equal(f.records.length, 0);
        const attempt = payload();
        assert.equal((await post(attempt)).status, 201);
        assert.equal((await post(attempt)).status, 200);
        assert.equal(f.records.length, 1);
        assert.equal((await post(payload())).status, 201);
        assert.equal(f.records.length, 2);
        assert.notEqual(f.records[0].id, f.records[1].id);
        assert.equal(f.records[0].resultado.concluida, true);
        const response = await fetch(base + `/progress/${childId}`, { headers: { Cookie: 'token=valid-token' } });
        assert.equal(response.headers.get('cache-control'), 'no-store');
        assert.deepEqual((await response.json()).completedActivityIds, [catalog[0].id]);
    } finally { await new Promise(resolve => server.close(resolve)); }
});

test('validação rejeita campos ausentes, UUIDs, atividade desconhecida e resultado inválido', async () => {
    const { service, records } = fixture();
    for (const input of [null, [], {}, payload({ childId: 'invalid' }), payload({ resultado: [] }), payload({ resultado: 'texto' }), payload({ resultado: { huge: 'x'.repeat(4100) } })]) {
        await assert.rejects(service.complete('parent-a', input), { status: 400 });
    }
    await assert.rejects(service.complete('parent-a', payload({ activityId: randomUUID() })), { status: 404 });
    await assert.rejects(service.complete(null, payload()), { status: 401 });
    assert.equal(records.length, 0);
});

test('falha de catálogo/gravação não produz confirmação de conclusão', async () => {
    const f = fixture(); f.repository.findActivity = async () => null;
    await assert.rejects(f.service.complete('parent-a', payload()), { status: 503 });
    f.repository.findActivity = async () => ({ id: catalog[0].id });
    f.repository.insertCompletion = async () => { throw new Error('offline'); };
    await assert.rejects(f.service.complete('parent-a', payload()), /offline/);
    assert.deepEqual((await f.service.progress('parent-a', childId)).completedActivityIds, []);
});

function fakeDb(responses, calls = []) {
    return { from(table) {
        const query = { table, filters: [] }; calls.push(query);
        return {
            select(value) { query.select = value; return this; },
            insert(value) { query.insert = value; return this; },
            eq(...value) { query.filters.push(value); return this; },
            in(...value) { query.in = value; return this; },
            order(value) { query.order = value; return this; },
            range(...value) { query.range = value; return Promise.resolve(responses.shift()); },
            single() { return Promise.resolve(responses.shift()); },
            maybeSingle() { return Promise.resolve(responses.shift()); }
        };
    } };
}

test('repository faz INSERT e trata reenvio pela PK sem UPDATE de histórico', async () => {
    const row = { id: randomUUID(), crianca_id: childId, atividade_id: catalog[0].id, resultado: { concluida: true } };
    const calls = [];
    const repo = new Repository(fakeDb([{ error: { code: '23505' } }, { data: row, error: null }], calls));
    assert.equal((await repo.insertCompletion(row)).created, false);
    assert.deepEqual(calls[0].insert, row); assert.equal(calls[0].table, 'realizações_atividades');
    const conflict = new Repository(fakeDb([{ error: { code: '23505' } }, { data: { ...row, crianca_id: foreignChild }, error: null }]));
    await assert.rejects(conflict.insertCompletion(row), { status: 409 });
    const outage = new Repository(fakeDb([{ error: { code: 'offline' } }]));
    await assert.rejects(outage.insertCompletion(row), { code: 'offline' });
});

test('consulta inclui conclusões além das mil primeiras realizações', async () => {
    const calls = [];
    const repo = new Repository(fakeDb([
        { data: Array.from({ length: 1000 }, () => ({ atividade_id: catalog[0].id })) },
        { data: [{ atividade_id: catalog[1].id }] }
    ], calls));
    assert.deepEqual(await repo.completedActivityIds(childId, catalog.map(a => a.id)), [catalog[0].id, catalog[1].id]);
    assert.deepEqual(calls[1].range, [1000, 1999]);
    assert.ok(calls.every(c => c.filters.some(([n, v]) => n === 'crianca_id' && v === childId)));
    assert.ok(calls.every(c => c.filters.some(([n, v]) => n === 'resultado->>concluida' && v === 'true')));
});
