const Conversation = require("../model/conversation");
const conversationRepository = require("./conversationRepository");

class ConversationService {

    async getConversation(childId, firstName) {

        let conversation = await conversationRepository.findByChildId(childId);

        if (!conversation) {

            conversation = new Conversation({
                childId,
                firstName
            });
            // Só criar no banco depois de obter e validar a primeira resposta.

        } else {

            // O primeiro nome vem da tabela "criancas",
            // não é persistido na tabela "conversations".
            conversation.setFirstName(firstName);

        }

        return conversation;

    }

    async saveConversation(conversation) {

        await conversationRepository.save(conversation);

    }

}

module.exports = new ConversationService();