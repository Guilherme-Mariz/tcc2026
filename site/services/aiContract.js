const catalog = require('../data/activities.json');
const categories = {
    calma: ['respire-com-teko', 'oq-pode-me-ajudar'],
    expressao_emocional: ['quebra-cabeca-emocoes', 'como-ele-pode-estar'],
    comunicacao: ['oq-posso-dizer', 'monte-frase'],
    convivencia: ['minha-vez-sua-vez', 'como-ele-pode-estar'],
    rotina: ['oq-vem-depois', 'mudou-o-plano'],
    autonomia: ['oq-fazer-agora', 'oq-pode-me-ajudar']
};
const emotions = ['alegria', 'tristeza', 'raiva', 'medo', 'ansiedade', 'frustracao', 'surpresa', 'calma', 'neutro', 'incerta'];
const trends = ['positiva', 'intermediaria', 'negativa'];
const properties = {
    response: { type: 'string' },
    emotionGroup: { type: 'string', enum: emotions },
    emotionTrend: { type: 'string', enum: trends },
    confidence: { type: 'number' },
    safetyConcern: { type: 'boolean' },
    shouldSuggestActivity: { type: 'boolean' },
    activityCategory: { type: ['string', 'null'], enum: [...Object.keys(categories), null] },
    history: { type: 'string' },
    summary: { type: 'string' },
    childInterests: { type: 'array', items: {
        type: 'object', additionalProperties: false,
        properties: { name: { type: 'string' }, confidence: { type: 'number' } },
        required: ['name', 'confidence']
    } }
};
const schema = { type: 'object', properties, required: Object.keys(properties), additionalProperties: false };
function normalizeTitle(text) {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ').trim();
}

function mentionedActivities(response) {
    const words = ' ' + normalizeTitle(response) + ' ';
    return catalog.filter(game => words.includes(' ' + normalizeTitle(game.titulo) + ' '));
}

function selectActivity(category, previous, named) {
    const choices = categories[category];
    if (!choices) return null;
    if (named && !choices.includes(named.slug)) {
        category = Object.keys(categories).find(key => categories[key].includes(named.slug));
    }
    const slug = named?.slug || choices.find(slug => catalog.find(a => a.slug === slug)?.id !== previous?.id) || choices[0];
    const activity = catalog.find(a => a.slug === slug);
    return activity ? { id: activity.id, title: activity.titulo, category, url: `/atividades/${activity.slug}` } : null;
}
module.exports = { categories, emotions, trends, schema, selectActivity, mentionedActivities };
