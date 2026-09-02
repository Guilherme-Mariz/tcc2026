const childRepository = require("../services/childRepository");

class ChildController {

    async getChildren(req, res) {

        try {
            // A rota já usa o middleware, mas esta checagem evita acesso sem usuário válido.
            if (!req.user?.id) {
                return res.status(401).json({
                    success: false,
                    error: "Usuário não autenticado."
                });
            }

            const children =
                await childRepository.findByUserId(
                    req.user.id
                );

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

    async verifyPin(req, res) {
        try {
            if (!req.user?.id) {
                return res.status(401).json({
                    success: false,
                    valid: false,
                    error: "Usuário não autenticado."
                });
            }

            const pin = String(req.body?.pin ?? "").trim();

            if (!/^\d{4}$/.test(pin)) {
                return res.status(400).json({
                    success: false,
                    valid: false,
                    error: "Digite um PIN com exatamente 4 números."
                });
            }

            // A consulta usa o ID obtido do token; o cliente nunca informa qual responsável validar.
            const valid = await childRepository.verifyPinByUserId(
                req.user.id,
                pin
            );

            if (!valid) {
                return res.status(403).json({
                    success: false,
                    valid: false,
                    error: "PIN incorreto. Tente novamente."
                });
            }

            return res.status(200).json({
                success: true,
                valid: true
            });

        } catch (error) {
            console.error("Erro ao validar PIN:", error);

            return res.status(500).json({
                success: false,
                valid: false,
                error: "Erro ao validar PIN."
            });
        }
    }
}

module.exports = new ChildController();

