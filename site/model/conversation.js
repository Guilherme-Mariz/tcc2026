class Conversation {

    constructor({

        childId,

        firstName = "",

        history = "",

        summary = "",

        lastEmotion = null,

        emotionTrend = null,

        lastActivity = {
            category: null,
            accepted: null
        },

        childInterests = [],

        createdAt = new Date(),

        updatedAt = new Date()

    }) {

        this.childId = childId;

        this.firstName = firstName;

        this.history = history;

        this.summary = summary;

        this.lastEmotion = lastEmotion;

        this.emotionTrend = emotionTrend;

        this.lastActivity = lastActivity;

        this.childInterests = childInterests;

        this.createdAt = new Date(createdAt);

        this.updatedAt = new Date(updatedAt);

    }

    // ===== Getters =====

    getChildId() {
        return this.childId;
    }

    getFirstName() {
        return this.firstName;
    }

    getHistory() {
        return this.history;
    }

    getSummary() {
        return this.summary;
    }

    getLastEmotion() {
        return this.lastEmotion;
    }

    getEmotionTrend() {
        return this.emotionTrend;
    }

    getLastActivity() {
        return this.lastActivity;
    }

    getChildInterests() {
        return this.childInterests;
    }

    // ===== Setters =====

    setFirstName(firstName) {
        this.firstName = firstName;
        this.touch();
    }

    setHistory(history) {
        this.history = history;
        this.touch();
    }

    setSummary(summary) {
        this.summary = summary;
        this.touch();
    }

    setLastEmotion(emotion) {
        this.lastEmotion = emotion;
        this.touch();
    }

    setEmotionTrend(trend) {
        this.emotionTrend = trend;
        this.touch();
    }

    setLastActivity(activity) {
        this.lastActivity = activity;
        this.touch();
    }

    setChildInterests(interests) {
        this.childInterests = interests;
        this.touch();
    }

    touch() {
        this.updatedAt = new Date();
    }

    toJSON() {

        return {

            childId: this.childId,

            history: this.history,

            summary: this.summary,

            lastEmotion: this.lastEmotion,

            emotionTrend: this.emotionTrend,

            lastActivity: this.lastActivity,

            childInterests: this.childInterests,

            createdAt: this.createdAt,

            updatedAt: this.updatedAt

        };

    }

    static fromJSON(data) {

        return new Conversation(data);

    }

}

module.exports = Conversation;