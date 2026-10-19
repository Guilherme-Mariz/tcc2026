module.exports = function aiError(error) {
    if (error.code === 'AI_NOT_CONFIGURED' || error.status === 401 || error.status === 403) {
        return { status: 503, code: 'AI_UNAVAILABLE', error: 'Não consigo conversar agora. Peça ajuda ao responsável e tente mais tarde.' };
    }
    if (error.status === 429) return { status: 429, code: 'AI_BUSY', error: 'Preciso de uma pequena pausa. Tente novamente em um minuto.' };
    if (['APIConnectionTimeoutError', 'AbortError', 'TimeoutError'].includes(error.name)) {
        return { status: 504, code: 'AI_TIMEOUT', error: 'Demorei para responder. Você pode tentar de novo.' };
    }
    if (error.code === 'AI_INVALID_RESPONSE') return { status: 502, code: error.code, error: 'Não consegui preparar a resposta. Você pode tentar de novo.' };
    return { status: 503, code: 'CHAT_UNAVAILABLE', error: 'Não consegui concluir a conversa agora. Você pode tentar de novo.' };
};
