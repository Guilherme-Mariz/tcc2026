const catalog = require('../data/activities.json');
class RecommendationRepository {
    constructor(db) { this.db = db; }
    async enqueue(childId, activity) {
        if (!catalog.some(item => item.id === activity?.id)) return false;
        const { data, error } = await this.db.rpc('teko_enqueue_recommendation', {
            p_child_id: childId, p_activity_id: activity.id
        });
        if (error) throw error;
        return data === true;
    }
    async list(childId) {
        const { data, error } = await this.db.from('activity_recommendations')
            .select('id, activity_id, created_at').eq('child_id', childId)
            .order('created_at', { ascending: true }).limit(3);
        if (error) throw error;
        return (data || []).flatMap(row => {
            const activity = catalog.find(item => item.id === row.activity_id);
            return activity ? [{ id: row.id, activityId: activity.id, title: activity.titulo,
                url: `/atividades/${activity.slug}`, createdAt: row.created_at }] : [];
        });
    }
}
module.exports = RecommendationRepository;
