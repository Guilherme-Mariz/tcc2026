const childRepository = require("../services/childRepository");

class ChildController {

    constructor(repository = childRepository) {
        this.repository = repository;
    }

    isValidImage(buffer, mimeType) {
        if (!Buffer.isBuffer(buffer) || buffer.length === 0) return false;
        if (mimeType === "image/jpeg") return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
        if (mimeType === "image/png") return buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
        if (mimeType === "image/webp") return buffer.length >= 12 && buffer.subarray(0, 4).toString() === "RIFF" && buffer.subarray(8, 12).toString() === "WEBP";
        return false;
    }

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
                await this.repository.findByUserId(
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
            const valid = await this.repository.verifyPinByUserId(
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

    async updateAvatar(req, res) {
        try {
            if (!req.user?.id) return res.status(401).json({ success: false, error: "Usuário não autenticado." });
            if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(req.params.childId || "")) {
                return res.status(400).json({ success: false, error: "Criança inválida." });
            }
            const mimeType = String(req.headers["content-type"] || "").split(";")[0].trim().toLowerCase();
            if (!this.isValidImage(req.body, mimeType)) {
                return res.status(415).json({ success: false, error: "Escolha uma imagem JPEG, PNG ou WebP válida." });
            }
            const result = await this.repository.updateAvatarByUserId(req.user.id, req.params.childId, req.body, mimeType);
            if (!result) return res.status(403).json({ success: false, error: "Criança não disponível para esta conta." });
            return res.status(200).json({ success: true, ...result });
        } catch (error) {
            if (error.type === "entity.too.large") {
                return res.status(413).json({ success: false, error: "A imagem deve ter no máximo 3 MB." });
            }
            console.error("Erro ao atualizar foto da criança:", error.code || error.message);
            return res.status(500).json({ success: false, error: "Não foi possível salvar a foto. Tente novamente." });
        }
    }
}

module.exports = new ChildController();
module.exports.ChildController = ChildController;
