const childRepository = require("../services/childRepository");

class ChildController {

    async getChildren(req, res) {

        try {

            const responsavelId = req.user.id;

            const children = await childRepository.findByUserId(req.user.id);

            return res.status(200).json({
                success: true,
                children
            });

        } catch (error) {

            console.error(
                "Erro ao buscar crianças:",
                error
            );

            return res.status(500).json({
                success: false,
                error: "Erro ao buscar crianças."
            });
        }
    }
}

module.exports = new ChildController();