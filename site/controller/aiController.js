const childRepository = require("../services/childRepository");
const conversationService = require("../services/conversationService");
const sessionManager = require("../services/sessionManager");
const groqService = require("../services/groqService");

class AIController {

    async chat(req, res) {

        try {

            const { childId, message } = req.body;

            // Usuário autenticado pelo middleware
            const responsavelId = req.user.id;

            if (!childId || !message) {
                return res.status(400).json({
                    success: false,
                    error: "childId e message são obrigatórios."
                });
            }

            // Verifica se a criança pertence ao responsável autenticado
            const child =
                await childRepository.findById(
                    childId,
                    responsavelId
                );

            if (!child) {
                return res.status(403).json({
                    success: false,
                    error: "Criança não pertence ao responsável autenticado."
                });
            }

            // Busca ou cria a conversa
            const conversation =
                await conversationService.getConversation(
                    child.id,
                    child.firstName
                );

            // Sessão da criança
            const session =
                sessionManager.getSession(child.id);

            // Conversa com a IA
            const result =
                await groqService.chat(
                    conversation,
                    session,
                    message
                );

            // Salva memória permanente
            await conversationService.saveConversation(
                result.conversation
            );

            return res.status(200).json({

                success: true,

                response: result.response,

                emotion:
                    result.conversation.getLastEmotion(),

                emotionTrend:
                    result.conversation.getEmotionTrend(),

                activity:
                    result.conversation.getLastActivity()

            });

        } catch (error) {

            console.error("Erro no AIController:", error);

            return res.status(500).json({
                success: false,
                error: "Erro interno do servidor."
            });

        }

    }

}

module.exports = new AIController();