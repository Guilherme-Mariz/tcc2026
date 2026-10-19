const test = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');

const configPath = require.resolve('../config/supabase');
const previousConfig = require.cache[configPath];
require.cache[configPath] = { id: configPath, filename: configPath, loaded: true, exports: {} };
const { ChildController } = require('../controller/childController');
if (previousConfig) require.cache[configPath] = previousConfig;
else delete require.cache[configPath];

function response() {
    return {
        statusCode: 200,
        payload: null,
        status(code) { this.statusCode = code; return this; },
        json(payload) { this.payload = payload; return this; }
    };
}

const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0]);

test('foto valida conteúdo, sessão e vínculo antes de salvar', async () => {
    const childId = randomUUID();
    const calls = [];
    const controller = new ChildController({
        async updateAvatarByUserId(...args) {
            calls.push(args);
            return { id: childId, avatarUrl: 'https://signed.example/avatar' };
        }
    });

    let res = response();
    await controller.updateAvatar({ user: { id: 'parent-a' }, params: { childId }, headers: { 'content-type': 'image/png' }, body: png }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.payload.avatarUrl, 'https://signed.example/avatar');
    assert.equal(calls.length, 1);

    res = response();
    await controller.updateAvatar({ user: { id: 'parent-a' }, params: { childId }, headers: { 'content-type': 'image/png' }, body: Buffer.from('not-png') }, res);
    assert.equal(res.statusCode, 415);
    assert.equal(calls.length, 1);

    res = response();
    await controller.updateAvatar({ user: { id: 'parent-a' }, params: { childId: 'invalid' }, headers: { 'content-type': 'image/png' }, body: png }, res);
    assert.equal(res.statusCode, 400);
});

test('foto de criança sem vínculo é recusada', async () => {
    const controller = new ChildController({ async updateAvatarByUserId() { return null; } });
    const res = response();
    await controller.updateAvatar({ user: { id: 'parent-a' }, params: { childId: randomUUID() }, headers: { 'content-type': 'image/png' }, body: png }, res);
    assert.equal(res.statusCode, 403);
});
