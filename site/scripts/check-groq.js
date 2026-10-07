// Diagnóstico com mensagem fictícia: não usa perfis, banco ou conversas reais.
require('dotenv').config({ path: require('node:path').join(__dirname, '../.env'), quiet: true });
const groqService = require('../services/groqService');
const Conversation = require('../model/conversation');
const Session = require('../model/chatSession');
async function main() {
    try {
        await groqService.chat(new Conversation({ childId: 'diagnostico', firstName: 'Teste' }), new Session('diagnostico'), 'Oi, estou bem hoje.');
        console.log('Groq respondeu: autenticação, modelo, geração e formato JSON do TEKO validados. Nenhum dado foi salvo.');
    } catch (error) {
        const message = error.code === 'AI_NOT_CONFIGURED' ? 'GROQ_API_KEY ausente. Configure no ambiente do servidor ou em site/.env.'
            : error.status === 401 ? 'A Groq recusou a chave. Substitua GROQ_API_KEY em site/.env e reinicie o servidor.'
            : error.status === 403 ? 'A chave não tem permissão para usar o modelo. Confira o projeto e as permissões na Groq.'
            : error.status === 429 ? 'Limite de uso da Groq atingido. Aguarde a renovação da cota e tente novamente.'
            : error.code === 'AI_INVALID_RESPONSE' ? 'A Groq respondeu, mas o formato continuou inválido após uma nova tentativa.'
            : error.status === 400 || error.status === 404 ? 'A Groq recusou o modelo ou os parâmetros da geração. Confira a configuração do projeto.'
            : ['APIConnectionTimeoutError', 'AbortError', 'TimeoutError'].includes(error.name) ? 'A Groq não respondeu a tempo. Verifique a conexão e tente novamente.'
            : 'Não foi possível conectar à Groq. Confira a conexão e a disponibilidade do serviço.';
        console.error(message);
        console.error('Diagnóstico:', { code: error.code, status: error.status, type: error.name });
        process.exitCode = 1;
    }
}
main();
