const express = require('express');
const RecommendationRepository = require('../services/recommendationRepository');
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
module.exports = function createRecommendationRouter(deps = {}) {
    const repository = deps.repository || new RecommendationRepository(require('../config/supabase'));
    const children = deps.children || require('../services/childRepository');
    const router = express.Router();
    router.use((req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
    router.use(deps.authenticate || require('../middleware/authMiddleware'));
    router.get('/:childId', async (req, res) => {
        if (!req.user?.id) return res.status(401).json({ error: 'Entre novamente.' });
        if (!UUID.test(req.params.childId)) return res.status(400).json({ error: 'Criança inválida.' });
        try {
            const childId = req.params.childId.toLowerCase();
            const responsibleId = await children.findResponsibleIdByUserId(req.user.id);
            const child = responsibleId && await children.findById(childId, responsibleId);
            if (!child) return res.status(403).json({ error: 'Criança não disponível nesta conta.' });
            return res.json({ recommendations: await repository.list(childId) });
        } catch (error) {
            console.error('Falha ao consultar recomendações', { code: error.code });
            return res.status(503).json({ error: 'Não foi possível carregar as recomendações. Tente novamente.' });
        }
    });
    return router;
};
