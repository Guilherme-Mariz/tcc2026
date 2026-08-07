class Conversation {
    constructor({
        childId,
        firstName,
        history = [],
        summary = "",
        lastEmotion = null,
        emotionTrend = null,
        lastSuggestedActivity = null,
        activityAcceptance = null,
        createdAt = new Date(),
        updatedAt = new Date()
    }) {
        this.childId = childId;
        this.firstName = firstName;

        this.history = history;
        this.summary = summary;

        this.lastEmotion = lastEmotion;
        this.emotionTrend = emotionTrend;

        this.lastSuggestedActivity = lastSuggestedActivity;
        this.activityAcceptance = activityAcceptance;

        this.createdAt = new Date(createdAt);
        this.updatedAt = new Date(updatedAt);

        this.MAX_HISTORY = 20;
    }

    addMessage(role, content) {
        this.history.push({
            role,
            content,
            timestamp: new Date()
        });

        this.trimHistory();

        this.touch();
    }

    trimHistory() {
        while (this.history.length > this.MAX_HISTORY) {
            this.history.shift();
        }
    }

    getHistory() {
        return this.history;
    }

    clearHistory() {
        this.history = [];
        this.summary = "";
        this.touch();
    }

    updateSummary(summary) {
        this.summary = summary;
        this.touch();
    }

    updateEmotion(emotionGroup) {
        this.lastEmotion = emotionGroup;
        this.touch();
    }

    updateEmotionTrend(emotionTrend) {
        this.emotionTrend = emotionTrend;
        this.touch();
    }

    updateSuggestedActivity(activityCategory) {
        this.lastSuggestedActivity = activityCategory;
        this.touch();
    }

    updateActivityAcceptance(value) {
        this.activityAcceptance = value;
        this.touch();
    }

    updateFirstName(firstName) {
        this.firstName = firstName;
        this.touch();
    }

    touch() {
        this.updatedAt = new Date();
    }

    toJSON() {
        return {
            childId: this.childId,
            firstName: this.firstName,

            history: this.history,

            summary: this.summary,

            lastEmotion: this.lastEmotion,
            emotionTrend: this.emotionTrend,

            lastSuggestedActivity: this.lastSuggestedActivity,
            activityAcceptance: this.activityAcceptance,

            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    static fromJSON(data) {
        return new Conversation(data);
    }

    getSummary() {
        return this.summary;
    }
    
    applyAIResponse(aiResponse) {
    
        this.updateEmotion(aiResponse.emotionGroup);
    
        this.updateSuggestedActivity(
            aiResponse.activityCategory
        );
    
        this.addMessage(
            "assistant",
            aiResponse.response
        );
    
    }
}



module.exports = Conversation;