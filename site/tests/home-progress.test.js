const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const { summarize } = require('../services/progressSummary');
const catalog = require('../data/activities.json');
const tick = () => new Promise(resolve => setImmediate(resolve));
const reply = (data, ok = true) => ({ ok, json: async () => data });
function progress(ids) {
    return { success: true, ...summarize(ids.map(index => ({ atividade_id: catalog[index].id,
        created_at: '2026-10-19T12:00:00Z', resultado: { concluida: true } }))) };
}
function fixture(fetch) {
    let child = 'ana';
    const elements = new Map();
    function target() {
        const listeners = {};
        return { style: {}, attributes: {}, hidden: false,
            addEventListener: (name, fn) => (listeners[name] ||= []).push(fn),
            emit: (name, event = {}) => Promise.all((listeners[name] || []).map(fn => fn(event))),
            setAttribute(name, value) { this.attributes[name] = value; },
            removeAttribute(name) { delete this.attributes[name]; } };
    }
    const document = target(), window = target();
    document.getElementById = id => {
        if (!elements.has(id)) elements.set(id, target());
        return elements.get(id);
    };
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../view/js/home-progress.js'), 'utf8'), {
        document, window, fetch, AbortController, setTimeout, clearTimeout,
        localStorage: { getItem: () => JSON.stringify({ crianca: child ? { id: child } : null }) }
    });
    return { document, window, el: name => document.getElementById('home-progress-' + name),
        suggestion: name => document.getElementById(name),
        select: value => { child = value; } };
}

test('Home usa conclusões reais: zero, repetição, cada uma das dez e limite de 100%', async () => {
    let ids = [];
    const f = fixture(async () => reply(progress(ids)));
    await f.document.emit('DOMContentLoaded'); await tick();
    assert.equal(catalog.length, 10);
    assert.equal(f.el('percent').textContent, '0%');
    ids = [0, 0]; await f.window.emit('focus');
    assert.equal(f.el('percent').textContent, '10%');
    for (let count = 2; count <= 10; count++) {
        ids = Array.from({ length: count }, (_, i) => i);
        await f.window.emit('teko:activity-saved');
        assert.equal(f.el('fill').style.width, `${count * 10}%`);
        assert.equal(f.el('bar').attributes['aria-valuenow'], String(count * 10));
    }
    ids.push(0); await f.window.emit('pageshow', { persisted: true }); await tick();
    assert.equal(f.el('status').textContent, '10 de 10 atividades concluídas');
});

test('troca de criança ignora resposta antiga; erro permite tentar novamente e ausência de perfil limpa barra', async () => {
    let resolveOld, fail = false;
    const f = fixture(url => url.endsWith('/ana') ? new Promise(resolve => { resolveOld = resolve; }) :
        Promise.resolve(fail ? reply({}, false) : reply(progress([1, 2]))));
    await f.document.emit('DOMContentLoaded');
    f.select('bruno'); await f.window.emit('teko:session-changed');
    resolveOld(reply(progress(Array.from({ length: 10 }, (_, i) => i)))); await tick();
    assert.equal(f.el('percent').textContent, '20%');
    fail = true; await f.window.emit('focus');
    assert.equal(f.el('percent').textContent, '—');
    assert.equal(f.el('retry').hidden, false);
    fail = false; await f.el('retry').emit('click');
    assert.equal(f.el('percent').textContent, '20%');
    f.select(null); await f.window.emit('storage', { key: 'teko_session' });
    assert.equal(f.el('fill').style.width, '0%');
    assert.equal(f.el('bar').attributes['aria-valuenow'], undefined);
    assert.match(f.el('status').textContent, /Selecione/);
});


test('sugestão usa link real, avança após conclusão e termina sem recomendar repetição', async () => {
    let ids = [];
    const f = fixture(async () => reply(progress(ids)));
    await f.document.emit('DOMContentLoaded'); await tick();
    for (let index = 0; index < catalog.length; index++) {
        assert.equal(f.suggestion('suggestion-title').textContent, catalog[index].titulo);
        assert.equal(f.suggestion('suggestion-description').textContent, catalog[index].descricao);
        assert.equal(f.suggestion('home-suggestion').attributes.href, `/atividades/${catalog[index].slug}`);
        assert.equal(f.suggestion('suggestion-action').hidden, false);
        ids.push(index);
        await f.window.emit('teko:activity-saved');
    }
    assert.equal(f.suggestion('home-suggestion').attributes.href, undefined);
    assert.equal(f.suggestion('suggestion-action').hidden, true);
    assert.match(f.suggestion('suggestion-title').textContent, /todas/);
});

test('erro e troca de perfil removem sugestão e link antigos', async () => {
    let fail = false;
    const f = fixture(async () => fail ? reply({}, false) : reply(progress([])));
    await f.document.emit('DOMContentLoaded'); await tick();
    fail = true; await f.window.emit('focus');
    assert.equal(f.suggestion('home-suggestion').attributes.href, undefined);
    fail = false; await f.el('retry').emit('click');
    assert.ok(f.suggestion('home-suggestion').attributes.href);
    f.select(null); await f.window.emit('teko:session-changed');
    assert.equal(f.suggestion('home-suggestion').attributes.href, undefined);
});

test('todas as sugestões têm a capa existente e a rota da atividade', () => {
    const html = fs.readFileSync(path.join(__dirname, '../view/pages/atividades.html'), 'utf8');
    for (const activity of catalog) {
        assert.ok(fs.existsSync(path.join(__dirname, '../view', activity.capa)));
        assert.ok(fs.existsSync(path.join(__dirname, `../view/pages/atividades/${activity.slug}.html`)));
        assert.ok(html.includes(`src="..${activity.capa}"`));
    }
});
