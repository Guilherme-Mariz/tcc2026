const catalog = require('../data/activities.json');
const moduleNames = ['Emoções', 'Comunicação', 'Situações sociais', 'Rotina', 'Autorregulação'];
const timeZone = 'America/Sao_Paulo';
const dateKey = value => new Intl.DateTimeFormat('en-CA', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit'
}).format(new Date(value));
const previousDay = (date, offset = 1) => new Date(Date.parse(date + 'T12:00:00Z') - offset * 86400000).toISOString().slice(0, 10);

function summarize(records, now = new Date()) {
    const activities = new Map(), days = new Map();
    for (const row of records.filter(row => row.resultado?.concluida === true)) {
        const day = dateKey(row.created_at);
        days.set(day, (days.get(day) || 0) + 1);
        const item = activities.get(row.atividade_id) || {
            activityId: row.atividade_id, total: 0, last: null
        };
        item.total++;
        if (!item.last || new Date(row.created_at) > new Date(item.last)) item.last = row.created_at;
        activities.set(row.atividade_id, item);
    }
    return summarizeFacts({ activities: [...activities.values()],
        days: [...days].map(([date, count]) => ({ date, count })) }, now);
}

function summarizeFacts(facts, now = new Date()) {
    const today = dateKey(now);
    const counts = new Map(facts.days.map(day => [day.date, Number(day.count)]));
    const stats = new Map(facts.activities.map(a => [a.activityId, a]));
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
        const matching = activities.map(a => stats.get(a.id)).filter(Boolean);
        const unique = matching.length;
        return { moduleId: index + 1, title, totalRealizations: matching.reduce((sum, a) => sum + Number(a.total), 0),
            completedActivities: unique, totalActivities: activities.length,
            percent: activities.length ? Math.round(unique / activities.length * 100) : 0,
            lastRealization: matching.map(a => a.last).sort((a, b) => new Date(a) - new Date(b)).at(-1) || null };
    });
    return {
        timeZone, totalRealizations: facts.activities.reduce((sum, a) => sum + Number(a.total), 0),
        completedActivityIds: [...stats.keys()],
        completedModules: modules.filter(m => m.percent === 100).length, modules,
        streak: { current, longest, activeDays: dates.length, lastActiveDay: dates.at(-1) || null },
        daily: Array.from({ length: 7 }, (_, i) => {
            const date = previousDay(today, 6 - i);
            return { date, count: counts.get(date) || 0 };
        }),
        activities: catalog.map(a => ({ activityId: a.id, title: a.titulo,
            totalRealizations: Number(stats.get(a.id)?.total || 0) }))
    };
}
module.exports = { summarize, summarizeFacts, dateKey };
