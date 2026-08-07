const groqService = require("../services/groqService");

async function chat(req, res) {

    try {

        const { message } = req.body;

        if (!message) {

            return res.status(400).json({
                error: "Mensagem obrigatória."
            });

        }

        const response = await groqService.chat(message);

        res.json(response);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: "Erro ao conversar com a IA."
        });

    }

}

module.exports = {
    chat
};