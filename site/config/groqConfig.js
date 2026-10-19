const Groq = require('groq-sdk');

// Inicialização tardia: credencial ausente não derruba login e atividades.
module.exports = function getGroqClient() {
    const apiKey = process.env.GROQ_API_KEY?.trim();
    if (!apiKey || /^(sua[-_ ]?chave|your[-_ ]?api[-_ ]?key|placeholder)/i.test(apiKey)) {
        const error = new Error('Configure GROQ_API_KEY no ambiente do servidor.');
        error.code = 'AI_NOT_CONFIGURED';
        throw error;
    }
    return new Groq({ apiKey, timeout: 20000, maxRetries: 0 });
};
