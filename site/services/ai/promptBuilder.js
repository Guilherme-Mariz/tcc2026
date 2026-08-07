const fs = require("fs");
const path = require("path");

class PromptBuilder {

    constructor() {

        const promptsPath = path.join(__dirname, "../../prompts");

        this.personalityPrompt = fs.readFileSync(
            path.join(promptsPath, "teko_personality.md"),
            "utf8"
        );

        this.rulesPrompt = fs.readFileSync(
            path.join(promptsPath, "teko_rules.md"),
            "utf8"
        );

    }

    /**
     * Monta o contexto da conversa.
     */
    buildContext(context) {

        return `

==============================
INFORMAÇÕES DA CRIANÇA
==============================

Primeiro nome:
${context.firstName || "Criança"}

==============================
ESTADO EMOCIONAL
==============================

Última emoção:
${context.lastEmotion || "desconhecida"}

Tendência emocional:
${context.emotionTrend || "desconhecida"}

==============================
ÚLTIMA ATIVIDADE
==============================

${context.lastSuggestedActivity || "Nenhuma"}

==============================
RESUMO DA CONVERSA
==============================

${context.summary || "Ainda não existe um resumo desta conversa."}

`;

    }

    /**
     * Monta as mensagens enviadas para a Groq.
     */
    build(context, currentMessage) {

        const messages = [];

        // Personalidade
        messages.push({
            role: "system",
            content: this.personalityPrompt
        });

        // Regras
        messages.push({
            role: "system",
            content: this.rulesPrompt
        });

        // Contexto
        messages.push({
            role: "system",
            content: this.buildContext(context)
        });

        // Histórico
        for (const message of context.history) {

            messages.push({
                role: message.role,
                content: message.content
            });

        }

        // Mensagem atual
        messages.push({
            role: "user",
            content: currentMessage
        });

        return messages;

    }

}

module.exports = new PromptBuilder();