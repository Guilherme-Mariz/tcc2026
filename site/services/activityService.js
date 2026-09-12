const catalog = require("../data/activities.json");
const { summarize } = require('./progressSummary');
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function reject(status, message) {
    const error = new Error(message);
    error.status = status;
    throw error;
}

function validId(value, name) {
    if (typeof value !== "string" || !UUID.test(value)) reject(400, `${name} inválido.`);
    return value.toLowerCase();
}

class ActivityService {
    constructor({ repository, children }) {
        this.repository = repository;
        this.children = children;
    }

    async authorize(userId, childId) {
        if (!userId) reject(401, "Sessão expirada. Entre novamente.");
        const responsibleId = await this.children.findResponsibleIdByUserId(userId);
        const child = responsibleId && await this.children.findById(childId, responsibleId);
        if (!child) reject(403, "Criança não disponível para esta conta.");
    }

    async complete(userId, body = {}) {
        if (!body || typeof body !== "object" || Array.isArray(body)) reject(400, "Envie um objeto JSON.");
        const childId = validId(body.childId, "childId");
        const activityId = validId(body.activityId, "activityId");
        const realizationId = validId(body.realizationId, "realizationId");
        const result = body.resultado ?? {};
        if (typeof result !== "object" || Array.isArray(result) ||
            Object.getPrototypeOf(result) !== Object.prototype ||
            Buffer.byteLength(JSON.stringify(result), "utf8") > 4096) {
            reject(400, "Resultado deve ser um objeto JSON de até 4 KB.");
        }
        await this.authorize(userId, childId);
        if (!catalog.some(activity => activity.id === activityId)) reject(404, "Atividade não encontrada.");
        if (!await this.repository.findActivity(activityId)) {
            reject(503, "Catálogo indisponível. Peça ajuda ao responsável.");
        }
        return this.repository.insertCompletion({
            id: realizationId,
            crianca_id: childId,
            atividade_id: activityId,
            resultado: { ...result, concluida: true, versao: 1 }
        });
    }

    async progress(userId, rawChildId) {
        const childId = validId(rawChildId, "childId");
        await this.authorize(userId, childId);
        return { childId, ...summarize(await this.repository.allHistory(childId)) };
    }

    async history(userId, rawChildId, query = {}) {
        const childId = validId(rawChildId, 'childId');
        await this.authorize(userId, childId);
        const offset = Number(query.offset ?? 0), limit = Number(query.limit ?? 50);
        if (!Number.isSafeInteger(offset) || offset < 0 || offset > 1000000 ||
            !Number.isInteger(limit) || limit < 1 || limit > 100) reject(400, 'Paginação inválida.');
        const rows = await this.repository.history(childId, offset, limit + 1);
        return { childId, offset, limit, hasMore: rows.length > limit,
            history: rows.slice(0, limit).map(row => ({ ...row,
                title: catalog.find(a => a.id === row.atividade_id)?.titulo || 'Atividade' })) };
    }
}
module.exports = ActivityService;
