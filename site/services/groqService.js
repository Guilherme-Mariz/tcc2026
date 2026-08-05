const groq = require("../config/groqConfig");
const { loadPrompts } = require("./promptLoader");

async function chat(userMessage, history = []) {

    try {

        const messages = loadPrompts(history, userMessage);

        const completion = await groq.chat.completions.create({

            model: process.env.GROQ_MODEL,

            messages,

            temperature: 0.7,

            max_completion_tokens: 500,

            response_format: {
                type: "json_object"
            }

        });

        const content = completion.choices[0].message.content;

        return JSON.parse(content);

    } catch (error) {

        console.error("Erro ao conversar com a Groq:");

        console.error(error);

        throw error;

    }

}

module.exports = {
    chat
};