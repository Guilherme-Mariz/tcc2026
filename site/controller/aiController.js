const childRepository = require('../services/childRepository');
const conversationService = require('../services/conversationService');
const sessionManager = require('../services/sessionManager');
const groqService = require('../services/groqService');
const aiError = require('../services/aiErrors');
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
class AIController {
    constructor(deps = {}) {
        this.children = deps.children || childRepository;
        this.conversations = deps.conversations || conversationService;
        this.sessions = deps.sessions || sessionManager;
        this.ai = deps.ai || groqService;
        this.pending = new Set();
    }
    async chat(req, res) {
        res.set('Cache-Control', 'no-store');
        const { childId, message } = req.body || {};
        if (typeof childId !== 'string' || !UUID.test(childId) ||
            typeof message !== 'string' || !message.trim() || message.length > 2000) {
            return res.status(400).json({ success: false, error: 'Envie uma criança válida e uma mensagem de até 2.000 caracteres.' });
        }
        const id = childId.toLowerCase();
        let locked = false;
        let stage = 'authorization';
        try {
            const responsibleId = await this.children.findResponsibleIdByUserId(req.user.id);
            const child = responsibleId && await this.children.findById(id, responsibleId);
            if (!child) return res.status(403).json({ success: false, error: 'Criança não disponível para esta conta.' });
            if (this.pending.has(id)) return res.status(409).json({ success: false, code: 'CHAT_PENDING', error: 'Espere minha resposta antes de enviar outra mensagem.' });
            this.pending.add(id);
            locked = true;
            stage = 'memory_read';
            const conversation = await this.conversations.getConversation(id, child.firstName);
            const session = this.sessions.getSession(id);
            stage = 'groq';
            const result = await this.ai.chat(conversation, session, message.trim());
            stage = 'memory_save';
            await this.conversations.saveConversation(result.conversation);
            session.addUserMessage(message.trim());
            session.addAssistantMessage(result.response);
            return res.status(200).json({
                success: true, response: result.response,
                emotion: result.conversation.getLastEmotion(), emotionTrend: result.conversation.getEmotionTrend(),
                confidence: result.confidence, activity: result.activity
            });
        } catch (error) {
            // Não registrar texto, perfil, memória, cabeçalhos ou credenciais.
            console.error('Falha no chat', { stage, code: error.code, status: error.status, type: error.name });
            const result = aiError(stage === 'groq' ? error : {});
            if (result.status === 429) res.set('Retry-After', '60');
            return res.status(result.status).json({ success: false, ...result });
        } finally {
            if (locked) this.pending.delete(id);
        }
    }
}
module.exports = new AIController();
module.exports.AIController = AIController;
