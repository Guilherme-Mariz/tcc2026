const supabase = require("../config/supabase");
const Conversation = require("../model/conversation");

class ConversationRepository {

    constructor() {
        this.table = "conversations";
    }

    async findByChildId(childId) {

        const { data, error } = await supabase
            .from(this.table)
            .select("*")
            .eq("child_id", childId)
            .maybeSingle();

        if (error) {
            throw error;
        }

        if (!data) {
            return null;
        }

        return new Conversation({
            childId: data.child_id,

            history: data.history || [],
            summary: data.summary || "",

            lastEmotion: data.last_emotion,
            emotionTrend: data.emotion_trend,

            lastActivity: data.last_activity || {
                category: null,
                accepted: null
            },

            childInterests: data.child_interests || [],

            createdAt: data.created_at,
            updatedAt: data.updated_at
        });

    }

    async create(conversation) {

        const c = conversation.toJSON();

        const { error } = await supabase
            .from(this.table)
            .insert({
                child_id: c.childId,

                history: c.history,
                summary: c.summary,

                last_emotion: c.lastEmotion,
                emotion_trend: c.emotionTrend,

                last_activity: c.lastActivity,

                child_interests: c.childInterests
            });

        if (error) {
            throw error;
        }

    }

    async update(conversation) {

        const c = conversation.toJSON();

        const { error } = await supabase
            .from(this.table)
            .update({

                history: c.history,
                summary: c.summary,

                last_emotion: c.lastEmotion,
                emotion_trend: c.emotionTrend,

                last_activity: c.lastActivity,

                child_interests: c.childInterests,

                updated_at: new Date().toISOString()

            })
            .eq("child_id", c.childId);

        if (error) {
            throw error;
        }

    }

    async save(conversation) {

        const exists = await this.findByChildId(
            conversation.getChildId()
        );

        if (exists) {
            return this.update(conversation);
        }

        return this.create(conversation);

    }

    async delete(childId) {

        const { error } = await supabase
            .from(this.table)
            .delete()
            .eq("child_id", childId);

        if (error) {
            throw error;
        }

    }

}

module.exports = new ConversationRepository();