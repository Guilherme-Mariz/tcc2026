const getGroqClient = require('../config/groqConfig');
const promptBuilder = require('./promptBuilder');
const responseParser = require('./responseParser');
const { schema } = require('./aiContract');
class GroqService {
    constructor(clientFactory = getGroqClient) { this.clientFactory = clientFactory; }
    async chat(conversation, session, userMessage) {
        const completion = await this.clientFactory().chat.completions.create({
            model: 'openai/gpt-oss-20b', temperature: 0.3, reasoning_effort: 'low', max_completion_tokens: 4096,
            response_format: { type: 'json_schema', json_schema: { name: 'teko_response', strict: true, schema } },
            messages: promptBuilder.build(conversation, session, userMessage)
        });
        const choice = completion.choices?.[0];
        let parsed;
        try {
            if (choice?.finish_reason !== 'stop') throw new Error('Resposta incompleta.');
            parsed = responseParser.parse(JSON.parse(choice.message.content), conversation);
        } catch {
            const error = new Error('Resposta da IA inválida ou incompleta.');
            error.code = 'AI_INVALID_RESPONSE';
            throw error;
        }
        conversation.setHistory(parsed.memory.history);
        conversation.setSummary(parsed.memory.summary);
        conversation.setLastEmotion(parsed.memory.lastEmotion);
        conversation.setEmotionTrend(parsed.memory.emotionTrend);
        conversation.setLastActivity(parsed.memory.lastActivity);
        conversation.setChildInterests(parsed.memory.childInterests);
        // O controller confirma a sessão apenas depois de salvar a memória.
        return { response: parsed.response, confidence: parsed.confidence, activity: parsed.activity, conversation };
    }
}
module.exports = new GroqService();
module.exports.GroqService = GroqService;
