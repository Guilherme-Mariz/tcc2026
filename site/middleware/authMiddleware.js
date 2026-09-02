const supabaseAdmin = require("../config/supabase");

async function verificarAuth(req, res, next) {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ erro: "Não autorizado" });
    }

    try {
        // getUser(token) valida o JWT recebido sem iniciar uma sessão no cliente global.
        const { data, error } = await supabaseAdmin.auth.getUser(token);

        if (error || !data.user) {
            return res.status(401).json({ erro: "Token inválido" });
        }

        // Disponibiliza o usuário validado para os controllers protegidos.
        req.user = data.user;

        return next();

    } catch (error) {
        console.error("Erro ao verificar autenticação:", error);

        return res.status(500).json({
            erro: "Erro ao verificar autenticação"
        });
    }
}

module.exports = verificarAuth;
