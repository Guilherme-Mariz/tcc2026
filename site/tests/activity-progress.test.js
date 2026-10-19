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
        async progress(id) { return require('../services/progressSummary').summarize(records.filter(r => r.crianca_id === id)); },
        async history(id, offset, limit, cursor) {
            return records.filter(r => r.crianca_id === id && (!cursor || r.created_at < cursor.date ||
                (r.created_at === cursor.date && r.id < cursor.id)))
                .sort((a, b) => b.created_at.localeCompare(a.created_at) || b.id.localeCompare(a.id))
                .slice(offset, offset + limit);
        },
        async report(id) {
            const grouped = new Map();
            for (const row of records.filter(r => r.crianca_id === id)) {
                const item = grouped.get(row.atividade_id) || { activityId: row.atividade_id, count: 0, firstCompletedAt: row.created_at, lastCompletedAt: row.created_at };
                item.count += 1;
                if (row.created_at < item.firstCompletedAt) item.firstCompletedAt = row.created_at;
                if (row.created_at > item.lastCompletedAt) item.lastCompletedAt = row.created_at;
                grouped.set(row.atividade_id, item);
            }
            return { totalRealizations: records.filter(r => r.crianca_id === id).length, activities: [...grouped.values()] };
        },
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

test('resumo usa uma consulta agregada e propaga falhas do banco', async () => {
    const calls = [];
    const repo = new Repository({ async rpc(name, args) {
        calls.push({ name, args });
        return { data: { activities: [{ activityId: catalog[0].id, total: 1501, last: '2026-09-12T12:00:00Z' }],
            days: [{ date: '2026-09-12', count: 1501 }] } };
    } });
    assert.equal((await repo.progress(childId)).totalRealizations, 1501);
    assert.deepEqual(calls, [{ name: 'teko_progress_facts', args: { p_child_id: childId } }]);
    await assert.rejects(new Repository({ async rpc() { return { error: { code: 'offline' } }; } }).progress(childId), { code: 'offline' });
});

test('relatório usa agregação no banco e acrescenta os títulos do catálogo', async () => {
    const calls = [];
    const repo = new Repository({ async rpc(name, args) {
        calls.push({ name, args });
        return { data: { totalRealizations: 3, activities: [{ activityId: catalog[0].id, count: 3,
            firstCompletedAt: '2026-09-01T12:00:00Z', lastCompletedAt: '2026-09-03T12:00:00Z' }] }, error: null };
    } });
    const children = { async findResponsibleIdByUserId() { return 'responsible-a'; }, async findById() { return { id: childId }; } };
    const report = await new Service({ repository: repo, children }).report('parent-a', childId);
    assert.equal(report.totalRealizations, 3);
    assert.equal(report.activities[0].title, catalog[0].titulo);
    assert.deepEqual(calls, [{ name: 'teko_activity_report', args: { p_child_id: childId } }]);
});

test('HTTP: sequência e histórico validam sessão, vínculo, paginação e falhas', async () => {
    const f = fixture();
    const app = express();
    app.use('/api/activities', createRouter({ service: f.service, authenticate(req, res, next) {
        if (req.headers.authorization !== 'Bearer valid') return res.status(401).json({ error: 'Sessão expirada' });
        req.user = { id: 'parent-a' }; next();
    } }));
    const server = app.listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    const base = `http://127.0.0.1:${server.address().port}/api/activities`;
    const get = (path, authenticated = true) => fetch(base + path, { headers: authenticated ? { Authorization: 'Bearer valid' } : {} });
    try {
        for (const endpoint of ['progress', 'streak', 'history', 'report']) {
            const denied = await get(`/${endpoint}/${childId}`, false);
            assert.equal(denied.status, 401);
            assert.equal(denied.headers.get('cache-control'), 'no-store');
            assert.equal((await get(`/${endpoint}/${foreignChild}`)).status, 403);
            assert.equal((await get(`/${endpoint}/invalid`)).status, 400);
        }
        for (const query of ['limit=0', 'limit=101', 'limit=1.5', 'limit=', 'limit=1&limit=2',
            'offset=-1', 'offset=1000001', 'offset=NaN', 'offset=', 'cursor=garbage']) {
            assert.equal((await get(`/history/${childId}?${query}`)).status, 400, query);
        }
        for (let i = 0; i < 1505; i++) f.records.push({ id: randomUUID(), crianca_id: childId,
            atividade_id: catalog[i % 2].id, resultado: { concluida: true },
            created_at: new Date(Date.parse('2026-09-01T12:00:00Z') + i * 1000).toISOString() });
        const first = await (await get(`/history/${childId}?limit=100`)).json();
        assert.equal(first.limit, 100); assert.equal(first.offset, 0); assert.equal(first.hasMore, true);
        assert.equal(first.history.length, 100); assert.equal(first.history[0].title, catalog[0].titulo);
        const offsetPage = await (await get(`/history/${childId}?offset=100&limit=50`)).json();
        assert.equal(offsetPage.history[0].id, f.records[1404].id);
        const seen = first.history.map(r => r.id);
        let cursor = first.nextCursor;
        // Inserção entre páginas não repete nem omite registros da navegação iniciada.
        f.records.push({ ...f.records[0], id: randomUUID(), created_at: '2026-09-12T12:00:00.123456Z' });
        while (cursor) {
            const response = await get(`/history/${childId}?limit=100&cursor=${cursor}`);
            assert.equal(response.status, 200); assert.equal(response.headers.get('cache-control'), 'no-store');
            const page = await response.json();
            seen.push(...page.history.map(r => r.id)); cursor = page.nextCursor;
            assert.equal(page.hasMore, Boolean(cursor));
        }
        assert.equal(seen.length, 1505); assert.equal(new Set(seen).size, 1505);
        assert.equal((await (await get(`/progress/${childId}`)).json()).totalRealizations, 1506);
        const streak = await (await get(`/streak/${childId}`)).json();
        assert.equal(streak.streak.activeDays, 2); assert.equal(streak.timeZone, 'America/Sao_Paulo');
        const report = await (await get(`/report/${childId}`)).json();
        assert.equal(report.totalRealizations, 1506);
        assert.equal(report.activities[0].title, catalog[0].titulo);
        const empty = await (await get(`/history/${childId}?offset=9999`)).json();
        assert.deepEqual(empty.history, []); assert.equal(empty.hasMore, false); assert.equal(empty.nextCursor, null);
        assert.equal((await get(`/history/${childId}?offset=1&cursor=${first.nextCursor}`)).status, 400);
        f.repository.history = f.repository.progress = async () => { throw { code: 'database_offline' }; };
        for (const endpoint of ['history', 'streak']) {
            const response = await get(`/${endpoint}/${childId}`);
            assert.equal(response.status, 500);
            assert.equal((await response.json()).error, 'Não foi possível acessar o progresso. Tente novamente.');
        }
    } finally { await new Promise(resolve => server.close(resolve)); }
});

test('cursor mantém precisão de microssegundos e não aceita outra criança', async () => {
    const f = fixture();
    const date = '2026-09-12T12:00:00.123456+00:00';
    f.records.push(...Array.from({ length: 3 }, () => ({ id: randomUUID(), crianca_id: childId,
        atividade_id: catalog[0].id, created_at: date })));
    const page = await f.service.history('parent-a', childId, { limit: '1' });
    assert.equal(JSON.parse(Buffer.from(page.nextCursor, 'base64url')).date, date);
    const next = await f.service.history('parent-a', childId, { cursor: page.nextCursor, limit: '1' });
    assert.notEqual(next.history[0].id, page.history[0].id);
    const wrong = Buffer.from(JSON.stringify({ childId: foreignChild, date, id: randomUUID() })).toString('base64url');
    await assert.rejects(f.service.history('parent-a', childId, { cursor: wrong }), { status: 400 });
});
