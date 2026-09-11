const express = require("express");
const ActivityController = require("../controller/activityController");
const ActivityService = require("../services/activityService");
const ActivityRepository = require("../services/activityRepository");

// Injeção permite testar as rotas sem credenciais nem escrita no banco real.
function createActivityRouter({ service, authenticate } = {}) {
    if (!service) {
        service = new ActivityService({
            repository: new ActivityRepository(require("../config/supabase")),
            children: require("../services/childRepository")
        });
    }
    const controller = new ActivityController(service);
    const router = express.Router();
    router.use(authenticate || require("../middleware/authMiddleware"));
    router.use((req, res, next) => {
        res.set("Cache-Control", "no-store");
        next();
    });
    router.post("/complete", (req, res, next) => {
        // JSON obrigatório: impede POST simples de formulário de outra origem.
        if (!req.is("application/json")) return res.status(415).json({ success: false, error: "Envie JSON." });
        return next();
    }, (req, res) => controller.complete(req, res));
    router.get("/progress/:childId", (req, res) => controller.progress(req, res));
    return router;
}
module.exports = createActivityRouter;
