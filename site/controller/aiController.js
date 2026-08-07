const groqService = require("../services/ai/groqService");

class AIController {

    async chat(req, res) {

        try {

            const {

                childId,
                firstName,
                message,
                context

            } = req.body;

            if (!childId) {
                return res.status(400).json({
                    success: false,
                    error: "childId é obrigatório."
                });
            }

            if (!firstName) {
                return res.status(400).json({
                    success: false,
                    error: "firstName é obrigatório."
                });
            }

            if (!message) {
                return res.status(400).json({
                    success: false,
                    error: "message é obrigatório."
                });
            }

            const response = await groqService.chat({

                childId,
                firstName,
                message,
                context

            });

            if (!response.success) {

                return res.status(500).json(response);

            }

            return res.json(response);

        } catch (error) {

            console.error(error);

            return res.status(500).json({

                success: false,

                error: "Erro interno."

            });

        }

    }

}

module.exports = new AIController();