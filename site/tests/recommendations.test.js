const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const { randomUUID } = require('node:crypto');
const createRouter = require('../routes/recommendationRoutes');
const Repository = require('../services/recommendationRepository');
const catalog = require('../data/activities.json');

test('recomendações exigem sessão e vínculo e não expõem dados de outra criança', async () => {
    const childId = randomUUID(); let reads = 0;
    const app = express();
    app.use(createRouter({
        authenticate(req, res, next) { if (req.headers.authorization) req.user = {id:'user'}; next(); },
        children: { findResponsibleIdByUserId: async () => 'parent', findById: async id => id === childId ? {id} : null },
        repository: { list: async () => { reads++; return [{id:'recommendation',title:'Atividade'}]; } }
    }));
    const server = app.listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    const url = `http://127.0.0.1:${server.address().port}`;
    try {
        assert.equal((await fetch(`${url}/${childId}`)).status, 401);
        assert.equal((await fetch(`${url}/${randomUUID()}`, {headers:{authorization:'test'}})).status, 403);
        assert.equal((await fetch(`${url}/invalid`, {headers:{authorization:'test'}})).status, 400);
        const response = await fetch(`${url}/${childId}`, {headers:{authorization:'test'}});
        assert.equal(response.status, 200);
        assert.equal(response.headers.get('cache-control'), 'no-store');
        assert.equal((await response.json()).recommendations.length, 1);
        assert.equal(reads, 1);
    } finally { await new Promise(resolve => server.close(resolve)); }
});

test('repositório aceita somente atividade do catálogo e usa fila transacional', async () => {
    let called;
    const repo = new Repository({rpc: async (name, args) => {called={name,args};return {data:true};}});
    assert.equal(await repo.enqueue('child', {id:'inventada'}), false);
    assert.equal(called, undefined);
    assert.equal(await repo.enqueue('child', catalog[0]), true);
    assert.equal(called.name, 'teko_enqueue_recommendation');
    assert.deepEqual(called.args, {p_child_id:'child',p_activity_id:catalog[0].id});
});
