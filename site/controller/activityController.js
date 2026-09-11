class ActivityController {
    constructor(service) {
        this.service = service;
    }

    failure(res, error) {
        const status = Number.isInteger(error.status) ? error.status : 500;
        if (status === 500) console.error("Falha ao registrar/consultar atividade:", error.code || "database_error");
        return res.status(status).json({
            success: false,
            error: status === 500 ? "Não foi possível acessar o progresso. Tente novamente." : error.message
        });
    }

    async complete(req, res) {
        try {
            const { record, created } = await this.service.complete(req.user?.id, req.body);
            return res.status(created ? 201 : 200).json({ success: true, created, realization: record });
        } catch (error) {
            return this.failure(res, error);
        }
    }

    async progress(req, res) {
        try {
            return res.json({ success: true, ...await this.service.progress(req.user?.id, req.params.childId) });
        } catch (error) {
            return this.failure(res, error);
        }
    }
}
module.exports = ActivityController;
