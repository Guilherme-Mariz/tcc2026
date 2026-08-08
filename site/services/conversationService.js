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

            await conversationRepository.create(conversation);

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