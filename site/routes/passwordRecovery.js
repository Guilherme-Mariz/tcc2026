const express = require("express");
const rateLimit = require("express-rate-limit");
const createAuthClient = require("../config/supabaseAuth");

module.exports = function passwordRecovery(createClient = createAuthClient) {
    const router = express.Router();
    function limit(max) {
        return rateLimit({ windowMs: 15 * 60000, max, standardHeaders: true, legacyHeaders: false,
            message: { erro: "Muitas tentativas. Aguarde 15 minutos." } });
    }
    router.use((req, res, next) => {
        res.set("Cache-Control", "no-store");
        const email = req.body?.email;
        if (typeof email !== "string" || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            return res.status(400).json({ erro: "Informe um e-mail válido." });
        }
        req.body.email = email.trim();
        next();
    });
    router.post("/codigo", limit(5), async (req, res) => {
        const { error } = await createClient().auth.resetPasswordForEmail(req.body.email);
        if (error && (error.status >= 500 || !error.status)) return res.status(503).json({ erro: "Envio indisponível. Tente novamente mais tarde." });
        return res.json({ mensagem: "Se houver uma conta com esse e-mail, você receberá um código. Confira também o spam." });
    });
    router.post("/confirmar", limit(10), async (req, res) => {
        const { email, codigo, senha } = req.body;
        if (typeof codigo !== "string" || !/^\d{6,10}$/.test(codigo) || typeof senha !== "string" || senha.length < 8) {
            return res.status(400).json({ erro: "Confira o código e use uma senha com pelo menos 8 caracteres." });
        }
        const client = createClient();
        const verified = await client.auth.verifyOtp({ email, token: codigo, type: "recovery" });
        if (verified.error || !verified.data?.session) return res.status(400).json({ erro: "Código inválido ou expirado." });
        const { error } = await client.auth.updateUser({ password: senha });
        if (error) return res.status(400).json({ erro: "Não foi possível usar essa senha. Solicite outro código e escolha uma senha diferente." });
        return res.json({ mensagem: "Senha atualizada. Entre com sua nova senha." });
    });
    return router;
};
