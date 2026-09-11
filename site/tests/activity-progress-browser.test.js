// Testes do JavaScript do navegador em DOM mínimo, sem dependências novas.
// Não substituem uma inspeção visual ou um teste com credenciais reais.
const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const { webcrypto, randomUUID } = require('node:crypto');
const catalog = require('../data/activities.json');
class Element extends EventTarget {
    constructor(tag) {
        super(); this.tagName = tag; this.children = []; this.dataset = {}; this.style = {};
        this.textContent = ''; this.hidden = false; this.attributes = {};
        const classes = new Set();
        this.classList = {
            add: (...names) => names.forEach(n => classes.add(n)),
            remove: (...names) => names.forEach(n => classes.delete(n)),
            contains: name => classes.has(name),
            toggle: (name, force) => { if (force ?? !classes.has(name)) classes.add(name); else classes.delete(name); }
        };
    }
    append(...items) { items.forEach(item => { item.parent = this; this.children.push(item); }); }
    appendChild(item) { this.append(item); return item; }
    setAttribute(name, value) { this.attributes[name] = value; }
    removeAttribute(name) { delete this.attributes[name]; }
    querySelector(selector) {
        for (const child of this.children) {
            if (selector.startsWith('.') ? child.className === selector.slice(1) : child.tagName === selector) return child;
            const found = child.querySelector(selector); if (found) return found;
        }
        return null;
    }
    remove() { this.parent.children = this.parent.children.filter(c => c !== this); }
}
const source = file => fs.readFileSync(path.join(__dirname, '../view/js', file), 'utf8');
const flush = () => new Promise(resolve => setImmediate(resolve));
function fixture(fetchImpl) {
    const childId = randomUUID(); let activeChild = childId;
    const document = new EventTarget(); document.body = new Element('body');
    document.body.dataset.activityId = catalog[0].id;
    document.createElement = tag => new Element(tag);
    const status = new Element('p');
    const cards = catalog.map(a => { const e = new Element('a'); e.dataset.activityId = a.id; return e; });
    document.querySelectorAll = selector => selector === '.atv-card[data-activity-id]' ? cards : [];
    document.getElementById = id => id === 'activity-progress-status' ? status : null;
    const window = new EventTarget(); window.crypto = webcrypto; window.location = { search: '' };
    const requests = [];
    const fetch = async (url, options) => {
        requests.push({ url, options });
        return fetchImpl ? fetchImpl(url, options) : { ok: true, status: 201, json: async () => ({ success: true }) };
    };
    const context = vm.createContext({ window, document, fetch, Event, CustomEvent, AbortSignal, URLSearchParams,
        Uint8Array, localStorage: { getItem: () => JSON.stringify({ crianca: { id: activeChild } }) },
        requestAnimationFrame: fn => fn(), console });
    vm.runInContext(source('activity-progress.js'), context);
    const emit = (name, detail) => document.dispatchEvent(new CustomEvent(name, { detail }));
    return { window, document, context, requests, cards, status, childId, emit,
        setChild(id) { activeChild = id; window.dispatchEvent(new CustomEvent('teko:session-changed')); } };
}

test('abrir/iniciar não registra; conclusão registra uma vez e repetição gera novo ID', async () => {
    const f = fixture(); const screen = new Element('section');
    assert.equal(f.requests.length, 0);
    f.emit('teko:activity-started'); assert.equal(f.requests.length, 0);
    f.emit('teko:activity-completed', { screen }); await flush();
    f.emit('teko:activity-completed', { screen }); await flush();
    assert.equal(f.requests.length, 1);
    assert.equal(screen.querySelector('.activity-save-status'), null);
    const first = JSON.parse(f.requests[0].options.body);
    assert.equal(first.childId, f.childId);
    f.emit('teko:activity-started'); f.emit('teko:activity-completed', { screen }); await flush();
    assert.equal(f.requests.length, 2);
    assert.notEqual(first.realizationId, JSON.parse(f.requests[1].options.body).realizationId);
});

test('falha permite reenvio com mesmo ID e não mostra sucesso antecipado', async () => {
    let online = false;
    const f = fixture(async () => { if (!online) throw new Error('offline'); return { ok: true, json: async () => ({ success: true }) }; });
    const screen = new Element('section');
    f.emit('teko:activity-started'); f.emit('teko:activity-completed', { screen }); await flush();
    assert.match(screen.querySelector('p').textContent, /não foi confirmado/);
    assert.equal(screen.querySelector('button').hidden, false);
    online = true; await screen.querySelector('button').onclick();
    assert.equal(f.requests[0].options.body, f.requests[1].options.body);
    assert.equal(screen.querySelector('.activity-save-status'), null);
});

test('trocar criança durante a atividade invalida a tentativa em andamento', async () => {
    const f = fixture(); const screen = new Element('section');
    f.emit('teko:activity-started'); f.setChild(randomUUID());
    f.emit('teko:activity-completed', { screen }); await flush();
    assert.equal(f.requests.length, 0);
    assert.match(screen.querySelector('p').textContent, /inicie a atividade novamente/);
});

test('cards refletem servidor, permanecem jogáveis e limpam marcas na troca de criança', async () => {
    let ids = [catalog[0].id];
    const f = fixture(async () => ({ ok: true, json: async () => ({ success: true, completedActivityIds: ids }) }));
    vm.runInContext(source('atividades.js'), f.context);
    f.document.dispatchEvent(new Event('DOMContentLoaded')); await flush();
    assert.ok(f.cards[0].querySelector('.atv-completed-badge'));
    assert.equal(f.cards[0].querySelector('.atv-completed-badge').attributes['aria-label'], 'Atividade concluída');
    assert.equal(f.cards[0].attributes['aria-disabled'], undefined);
    assert.equal(f.cards[1].querySelector('.atv-completed-badge'), null);
    ids = [catalog[1].id]; f.setChild(randomUUID()); await flush();
    assert.equal(f.cards[0].querySelector('.atv-completed-badge'), null);
    assert.ok(f.cards[1].querySelector('.atv-completed-badge'));
    f.window.dispatchEvent(new Event('pageshow')); await flush();
    assert.ok(f.cards[1].querySelector('.atv-completed-badge'));
});

test('resposta atrasada da criança anterior não pode marcar o perfil atual', async () => {
    const pending = [];
    const f = fixture(() => new Promise(resolve => pending.push(resolve)));
    vm.runInContext(source('atividades.js'), f.context);
    f.document.dispatchEvent(new Event('DOMContentLoaded'));
    f.setChild(randomUUID());
    pending[1]({ ok: true, json: async () => ({ success: true, completedActivityIds: [] }) }); await flush();
    pending[0]({ ok: true, json: async () => ({ success: true, completedActivityIds: [catalog[0].id] }) }); await flush();
    assert.equal(f.cards[0].querySelector('.atv-completed-badge'), null);
});

test('dez jogos, cards e seed usam o mesmo catálogo; todos integram início e conclusão pelo core', () => {
    const html = fs.readFileSync(path.join(__dirname, '../view/pages/atividades.html'), 'utf8');
    const seed = fs.readFileSync(path.join(__dirname, '../supabase/seed_activities.sql'), 'utf8');
    assert.equal(new Set(catalog.map(a => a.id)).size, 10);
    for (const activity of catalog) {
        const page = fs.readFileSync(path.join(__dirname, `../view/pages/atividades/${activity.slug}.html`), 'utf8');
        const game = source(`atividades/${activity.slug}.js`);
        assert.ok(page.includes(`data-activity-id="${activity.id}"`));
        assert.ok(html.includes(`data-activity-id="${activity.id}"`));
        assert.ok(seed.includes(activity.id));
        assert.ok(page.indexOf('/js/activity-progress.js') < page.indexOf('/js/atividades/activity-core.js'));
        assert.match(game, /TekoActivityCore.createScreenTransition/);
        assert.match(game, /TekoActivityCore.createEntryGate/);
        assert.match(game, /["'](?:done|conclusao)["']/);
    }
});
