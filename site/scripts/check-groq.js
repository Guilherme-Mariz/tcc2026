// Verificação de autenticação, sem enviar conversas ou imprimir a chave.
require('dotenv').config({ path: require('node:path').join(__dirname, '../.env'), quiet: true });
const getGroqClient = require('../config/groqConfig');
async function main() {
    try {
        const models = await getGroqClient().models.list();
        if (!models.data.some(model => model.id === 'openai/gpt-oss-20b')) {
            console.error('Autenticação aceita, mas o modelo do TEKO não está na lista disponível.');
            process.exitCode = 1;
            return;
        }
        console.log('Autenticação Groq aceita; modelo do TEKO listado. A geração de respostas não foi testada.');
    } catch (error) {
        const message = error.code === 'AI_NOT_CONFIGURED' ? 'GROQ_API_KEY ausente. Configure no ambiente do servidor ou em site/.env.'
            : error.status === 401 ? 'A Groq recusou a chave. Confira ou substitua GROQ_API_KEY e reinicie o servidor.'
            : error.status === 403 ? 'A credencial não tem permissão para esta operação. Confira o projeto Groq.'
            : 'Não foi possível verificar a Groq. Confira conexão e disponibilidade do serviço.';
        console.error(message);
        process.exitCode = 1;
    }
}
main();
