const fs = require("fs");
const path = require("path");

class PromptBuilder {

    constructor() {

        this.systemPrompt = fs.readFileSync(
            path.join(__dirname, "../prompts/teko_system.md"),
            "utf8"
        );

    }

    build(conversation, session, userMessage) {

        const memoryPrompt = this.buildMemoryPrompt(conversation);

        return [

            {
                role: "system",
                content: this.systemPrompt
            },

            {
                role: "system",
                content: memoryPrompt
            },

            ...session.getMessages()

      

        ];

    }

    buildMemoryPrompt(conversation) {

        const history =
            conversation.getHistory() || "Nenhum histórico registrado.";

        const summary =
            conversation.getSummary() || "Nenhum resumo disponível.";

        const lastEmotion =
            conversation.getLastEmotion() || "Não identificada.";

        const emotionTrend =
            conversation.getEmotionTrend() || "Não identificada.";

        const lastActivity =
            conversation.getLastActivity()?.category
                ? `${conversation.getLastActivity().category} (aceita: ${conversation.getLastActivity().accepted})`
                : "Nenhuma atividade registrada.";

        const interests = conversation.getChildInterests().length
            ? conversation
                .getChildInterests()
                .map(i => `- ${i.name}`)
                .join("\n")
            : "Nenhum interesse identificado.";

        return `
================ MEMÓRIA DA CRIANÇA ================

Primeiro nome:
${conversation.getFirstName()}

Histórico da criança:
${history}

Resumo da última conversa:
${summary}

Última emoção:
${lastEmotion}

Tendência emocional:
${emotionTrend}

Última atividade:
${lastActivity}

Interesses:
${interests}

====================================================

Utilize essas informações apenas para manter continuidade entre as conversas.

Atualize essas informações quando necessário.

Nunca invente fatos.

Caso alguma informação permaneça válida, mantenha-a.

Ao responder, retorne obrigatoriamente um JSON válido seguindo exatamente o formato definido nas instruções do sistema.
`;

    }

}

module.exports = new PromptBuilder();