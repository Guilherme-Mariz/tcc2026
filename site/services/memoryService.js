class MemoryService {

    constructor() {

        // Quantidade máxima de mensagens
        // enviadas para a IA.
        this.MAX_HISTORY = 20;

    }

    /**
     * Retorna o contexto da conversa
     * que será enviado ao PromptLoader.
     */
    getContext(conversation) {

        const history = conversation
            .getHistory()
            .slice(-this.MAX_HISTORY);

        return {

            childId: conversation.childId,

            firstName: conversation.firstName,

            summary: conversation.getSummary(),

            history,

            lastEmotion: conversation.lastEmotion,

            emotionTrend: conversation.emotionTrend,

            lastSuggestedActivity:
                conversation.lastSuggestedActivity

        };

    }

    /**
     * Futuramente fará o resumo automático.
     */
    async updateSummary(conversation) {

        // Implementaremos depois.

        return conversation;

    }

}

module.exports = new MemoryService();