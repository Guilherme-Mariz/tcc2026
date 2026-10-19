const test = require('node:test');
const assert = require('node:assert/strict');
const { summarize } = require('../services/progressSummary');
const catalog = require('../data/activities.json');
const row = (date, activity = 0) => ({ atividade_id: catalog[activity].id,
    created_at: date, resultado: { concluida: true } });

test('repetições contam no total, mas não completam um módulo sozinhas', () => {
    const rows = [row('2026-09-12T12:00:00Z'), row('2026-09-12T13:00:00Z')];
    const result = summarize(rows, new Date('2026-09-12T15:00:00Z'));
    assert.equal(result.totalRealizations, 2);
    assert.equal(result.modules[0].percent, 50);
    assert.equal(result.completedModules, 0);
    assert.equal(result.streak.current, 1);
    assert.equal(result.daily.at(-1).count, 2);
    rows.push(row('2026-09-12T14:00:00Z', 1));
    assert.equal(summarize(rows).completedModules, 1);
});

test('sequência usa São Paulo, mantém ontem e zera após um dia sem atividade', () => {
    const rows = [row('2026-09-10T02:59:00Z'), row('2026-09-11T02:59:00Z')];
    assert.equal(summarize(rows, new Date('2026-09-11T12:00:00Z')).streak.current, 2);
    const result = summarize(rows, new Date('2026-09-12T12:00:00Z'));
    assert.equal(result.streak.current, 0);
    assert.equal(result.streak.longest, 2);
    assert.equal(result.streak.activeDays, 2);
});

test('período vazio, passagem de mês e resultados incompletos', () => {
    const empty = summarize([], new Date('2026-03-01T12:00:00Z'));
    assert.equal(empty.daily[0].date, '2026-02-23');
    assert.equal(empty.streak.current, 0);
    assert.equal(empty.totalRealizations, 0);
    assert.equal(summarize([{ ...row('2026-03-01T12:00:00Z'), resultado: {} }]).totalRealizations, 0);
});
