const groq = require("../config/groqConfig");

const promptBuilder = require("./promptBuilder");
const responseParser = require("./responseParser");

const jsonExtractor = require("../utils/jsonExtractor");

class GroqService {
  async chat(conversation, session, userMessage) {
    // Adiciona a mensagem da criança à sessão temporária
    session.addUserMessage(userMessage);

    // Monta o prompt
    const messages = promptBuilder.build(conversation, session, userMessage);

    // Chama o Groq
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",

      temperature: 0.7,

      response_format: {
        type: "json_object",
      },

      messages,
    });

    const rawResponse = completion.choices[0].message.content;

    // Extrai o JSON
    const aiResponse = jsonExtractor.extract(rawResponse);

    console.log("\n===== RESPOSTA BRUTA DA IA =====");
    console.dir(aiResponse, { depth: null });
    console.log("================================\n");

    // Valida a resposta
    const parsed = responseParser.parse(aiResponse, conversation);

    // Atualiza a memória permanente
    conversation.setHistory(parsed.memory.history);

    conversation.setSummary(parsed.memory.summary);

    conversation.setLastEmotion(parsed.memory.lastEmotion);

    conversation.setEmotionTrend(parsed.memory.emotionTrend);

    conversation.setLastActivity(parsed.memory.lastActivity);

    conversation.setChildInterests(parsed.memory.childInterests);

    // Guarda a resposta na sessão temporária
    session.addAssistantMessage(parsed.response);
    
    console.log("\n===== RESPOSTA BRUTA DA IA =====");
    console.dir(aiResponse, { depth: null });
    console.log("================================\n");
    return {
      response: parsed.response,

      conversation,
    };
  }
}


module.exports = new GroqService();
