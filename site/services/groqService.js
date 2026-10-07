const getGroqClient = require('../config/groqConfig');
const promptBuilder = require('./promptBuilder');
const responseParser = require('./responseParser');
const { schema } = require('./aiContract');
class GroqService {
    constructor(clientFactory = getGroqClient) { this.clientFactory = clientFactory; }
    async chat(conversation, session, userMessage) {
        const client = this.clientFactory();
        const messages = promptBuilder.build(conversation, session, userMessage);
        let parsed;
        // Uma tentativa adicional apenas para JSON inválido ou resposta cortada.
        // Credenciais, limite de uso e indisponibilidade não entram neste retry.
        for (let attempt = 0; attempt < 2; attempt++) {
            try {
                const completion = await client.chat.completions.create({
                    model: 'openai/gpt-oss-20b', temperature: 0.3, reasoning_effort: 'low',
                    max_completion_tokens: attempt === 0 ? 4096 : 6144,
                    response_format: { type: 'json_schema', json_schema: { name: 'teko_response', strict: true, schema } },
                    messages
                });
                const choice = completion.choices?.[0];
                try {
                    if (choice?.finish_reason !== 'stop') throw new Error('Resposta incompleta.');
                    parsed = responseParser.parse(JSON.parse(choice.message.content), conversation);
                } catch {
                    const error = new Error('Resposta da IA inválida ou incompleta.');
                    error.code = 'AI_INVALID_RESPONSE';
                    throw error;
                }
                break;
            } catch (error) {
                const providerCode = error.error?.error?.code || error.error?.code || error.code;
                if (providerCode === 'json_validate_failed') error.code = 'AI_INVALID_RESPONSE';
                if (attempt === 1 || error.code !== 'AI_INVALID_RESPONSE') throw error;
            }
        }
        conversation.setHistory(parsed.memory.history);
        conversation.setSummary(parsed.memory.summary);
        conversation.setLastEmotion(parsed.memory.lastEmotion);
        conversation.setEmotionTrend(parsed.memory.emotionTrend);
        conversation.setLastActivity(parsed.memory.lastActivity);
        conversation.setChildInterests(parsed.memory.childInterests);
        return { response: parsed.response, confidence: parsed.confidence, activity: parsed.activity, conversation };
    }
}
module.exports = new GroqService();
module.exports.GroqService = GroqService;
