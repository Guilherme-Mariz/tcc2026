const groq = require("../../config/groq");

const conversationService = require("../conversationService");
const memoryService = require("../memoryService");

const promptBuilder = require("./promptBuilder");
const responseParser = require("./responseParser");

const jsonExtractor = require("../../utils/jsonExtractor");

class GroqService {

    async chat({
        childId,
        firstName,
        message,
        context = {}
    }) {

        try {

            // Busca (ou cria) a conversa
            const conversation = conversationService.getConversation(
                childId,
                firstName
            );

            // Salva a mensagem do usuário
            conversation.addMessage("user", message);

            // Contexto da conversa
            const memoryContext =
                memoryService.getContext(conversation);

            // Junta contexto extra enviado pelo frontend
            const finalContext = {
                ...memoryContext,
                ...context
            };

            // Monta os prompts
            const messages =
                promptBuilder.build(
                    finalContext,
                    message
                );

            // Chamada para a Groq
            const completion =
                await groq.chat.completions.create({

                    model: "llama-3.3-70b-versatile",

                    messages,

                    temperature: 0.7

                });

            const aiText =
                completion.choices[0].message.content;

            // Extrai JSON
            const json =
                jsonExtractor.extract(aiText);

            // Valida
            const parsed =
                responseParser.parse(json);

            // Atualiza a conversa
            conversation.applyAIResponse(parsed);

            return {

                success: true,

                data: parsed

            };

        } catch (error) {

            console.error("\n===== ERRO GROQ =====");
            console.error(error);
            console.error("=====================\n");

            return {

                success: false,

                error: error.message

            };

        }

    }

}

module.exports = new GroqService();