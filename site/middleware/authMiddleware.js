const supabase = require("../config/supabase");

async function verificarAuth(req, res, next) {
    console.log("Middleware rodando");
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ erro: "Não autorizado" });
    }

    try {
        const { data, error } = await supabase.auth.getUser(token);

        if (error || !data.user) {
            return res.status(401).json({ erro: "Token inválido" });
        }

        // 🔥 salva usuário na requisição (muito útil)
        req.user = data.user;

        next(); // continua para a rota

    } catch (err) {
        return res.status(500).json({ erro: "Erro ao verificar autenticação" });
    }
}

module.exports = verificarAuth;