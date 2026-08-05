const fs = require("fs");
const path = require("path");

// Guarda o prompt em memória (cache)
let systemPrompt = null;

// Lê os arquivos apenas uma vez
function getSystemPrompt() {

    if (systemPrompt) {
        return systemPrompt;
    }

    const promptFolder = path.join(__dirname, "../prompts");

    const system = fs.readFileSync(
        path.join(promptFolder, "system_prompt.md"),
        "utf8"
    );

    const personality = fs.readFileSync(
        path.join(promptFolder, "teko_personality.md"),
        "utf8"
    );

    const rules = fs.readFileSync(
        path.join(promptFolder, "teko_rules.md"),
        "utf8"
    );

    systemPrompt = `${system}

${personality}

${rules}`;

    return systemPrompt;
}

// Monta as mensagens para enviar à Groq
function loadPrompts(history = [], userMessage) {

    return [
        {
            role: "system",
            content: getSystemPrompt()
        },

        ...history,

        {
            role: "user",
            content: userMessage
        }
    ];
}

module.exports = {
    loadPrompts
};