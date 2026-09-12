const catalog = require('../data/activities.json');
const moduleNames = ['Emoções', 'Comunicação', 'Situações sociais', 'Rotina', 'Autorregulação'];
const timeZone = 'America/Sao_Paulo';
const dateKey = value => new Intl.DateTimeFormat('en-CA', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit'
}).format(new Date(value));
const previousDay = (date, offset = 1) => new Date(Date.parse(date + 'T12:00:00Z') - offset * 86400000).toISOString().slice(0, 10);

function summarize(records, now = new Date()) {
    const rows = records.filter(row => row.resultado?.concluida === true);
    const today = dateKey(now);
    const counts = new Map();
    for (const row of rows) {
        const day = dateKey(row.created_at);
        counts.set(day, (counts.get(day) || 0) + 1);
    }
    const dates = [...counts.keys()].sort();
    let longest = 0, run = 0, last = null;
    for (const day of dates) {
        run = last === previousDay(day) ? run + 1 : 1;
        longest = Math.max(longest, run);
        last = day;
    }
    let current = 0;
    let cursor = counts.has(today) ? today : previousDay(today);
    while (counts.has(cursor)) { current++; cursor = previousDay(cursor); }
    const modules = moduleNames.map((title, index) => {
        const activities = catalog.filter(a => a.modulo_id === index + 1);
        const matching = rows.filter(r => activities.some(a => a.id === r.atividade_id));
        const unique = new Set(matching.map(r => r.atividade_id)).size;
        return { moduleId: index + 1, title, totalRealizations: matching.length,
            completedActivities: unique, totalActivities: activities.length,
            percent: Math.round(unique / activities.length * 100),
            lastRealization: matching.map(r => r.created_at).sort().at(-1) || null };
    });
    return {
        timeZone, totalRealizations: rows.length,
        completedActivityIds: [...new Set(rows.map(r => r.atividade_id))],
        completedModules: modules.filter(m => m.percent === 100).length, modules,
        streak: { current, longest, activeDays: dates.length, lastActiveDay: dates.at(-1) || null },
        daily: Array.from({ length: 7 }, (_, i) => {
            const date = previousDay(today, 6 - i);
            return { date, count: counts.get(date) || 0 };
        }),
        activities: catalog.map(a => ({ activityId: a.id, title: a.titulo,
            totalRealizations: rows.filter(r => r.atividade_id === a.id).length }))
    };
}
module.exports = { summarize, dateKey };
