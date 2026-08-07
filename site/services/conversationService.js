const Conversation = require("../model/conversation.js");

class ConversationService {

    constructor() {
        this.conversations = new Map();
    }

    /**
     * Retorna uma conversa existente ou cria uma nova.
     */
    getConversation(childId, firstName) {

        let conversation = this.conversations.get(childId);

        if (!conversation) {

            conversation = new Conversation({
                childId,
                firstName
            });

            this.conversations.set(childId, conversation);

        } else if (firstName && conversation.firstName !== firstName) {

            conversation.updateFirstName(firstName);

        }

        return conversation;
    }

    /**
     * Retorna somente o histórico.
     */
    getHistory(childId, firstName) {

        return this
            .getConversation(childId, firstName)
            .getHistory();

    }

    /**
     * Adiciona uma mensagem.
     */
    addMessage(childId, firstName, role, content) {

        const conversation = this.getConversation(
            childId,
            firstName
        );

        conversation.addMessage(role, content);

        return conversation;

    }

    /**
     * Limpa o histórico.
     */
    clearConversation(childId) {

        const conversation = this.conversations.get(childId);

        if (!conversation) return;

        conversation.clearHistory();

    }

    /**
     * Remove completamente uma conversa da memória.
     */
    removeConversation(childId) {

        this.conversations.delete(childId);

    }

    /**
     * Retorna todas as conversas ativas.
     * Muito útil para debug.
     */
    getAllConversations() {

        return Array.from(this.conversations.values());

    }

    /**
     * Quantidade de conversas ativas.
     */
    count() {

        return this.conversations.size;

    }

}

module.exports = new ConversationService();