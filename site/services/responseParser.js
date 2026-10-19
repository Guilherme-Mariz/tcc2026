const { categories, emotions, trends, schema, selectActivity } = require('./aiContract');
function invalid() {
    const error = new Error('Resposta da IA fora do formato esperado.');
    error.code = 'AI_INVALID_RESPONSE';
    throw error;
}
const text = (value, max) => typeof value === 'string' && value.length <= max;
const confidence = value => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1;
module.exports = {
    parse(value, conversation) {
        if (!value || Array.isArray(value) || typeof value !== 'object' ||
            Object.keys(value).some(key => !schema.required.includes(key)) ||
            schema.required.some(key => !Object.hasOwn(value, key)) ||
            !text(value.response, 1600) || !value.response.trim() ||
            !emotions.includes(value.emotionGroup) || !trends.includes(value.emotionTrend) ||
            !confidence(value.confidence) || typeof value.safetyConcern !== 'boolean' ||
            typeof value.shouldSuggestActivity !== 'boolean' ||
            !(value.activityCategory === null || Object.hasOwn(categories, value.activityCategory)) ||
            !text(value.history, 2000) || !text(value.summary, 1000) ||
            !Array.isArray(value.childInterests) || value.childInterests.length > 10 ||
            value.childInterests.some(i => !i || !text(i.name, 80) || !i.name.trim() || !confidence(i.confidence))) invalid();
        const current = conversation.toJSON();
        const certain = value.confidence >= 0.65 && value.emotionGroup !== 'incerta';
        const activity = value.shouldSuggestActivity && certain && !value.safetyConcern
            ? selectActivity(value.activityCategory, current.lastActivity) : null;
        return {
            response: value.response.trim(), confidence: value.confidence, activity,
            memory: {
                history: value.history, summary: value.summary,
                lastEmotion: certain ? value.emotionGroup : 'incerta',
                emotionTrend: certain ? value.emotionTrend : 'intermediaria',
                // Memória anterior não é a sugestão atual.
                lastActivity: activity ? { ...activity, accepted: null } : current.lastActivity,
                childInterests: value.childInterests.filter(i => i.confidence >= 0.65)
            }
        };
    }
};
