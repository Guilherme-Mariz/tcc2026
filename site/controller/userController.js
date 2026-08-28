const userModel = require("../model/userModel");

// CADASTRO ____________________________________________________________________

async function registerCompleto(req, res) {

    const {
        nome,
        cpf,
        email,
        senha,
        pin,
        telefone,
        relacao,
        criancas,
    } = req.body;

    // Validação básica
    if (
        !nome ||
        !cpf ||
        !email ||
        !senha ||
        !pin ||
        !relacao ||
        !Array.isArray(criancas) ||
        criancas.length < 1 ||
        criancas.length > 2
    ) {
        return res.status(400).json({
            erro: "Dados de cadastro inválidos."
        });
    }

    try {

        const resultado =
            await userModel.criarUsuarioEcriancas(
                nome,
                cpf,
                email,
                senha,
                pin,
                telefone,
                relacao,
                criancas
            );

        res.status(201).json({
            mensagem: "Cadastro completo realizado com sucesso",
            dados: resultado,
        });

    } catch (error) {

        console.error("Erro no cadastro:", error);

        res.status(500).json({
            erro: error.message,
        });
    }
}


// LOGIN ________________________________________________________________________

async function login(req, res) {

    console.log("LOGIN RECEBIDO");
    console.log(req.body);

    const { email, senha } = req.body;

    if (!email || !email.includes("@")) {
        return res.status(400).json({
            erro: "Email inválido"
        });
    }

    if (!senha || senha.length < 8) {
        return res.status(400).json({
            erro: "Senha deve ter no mínimo 8 caracteres"
        });
    }

    try {

        const resultado =
            await userModel.loginUsuario(
                email,
                senha
            );

        res
            .cookie("token", resultado.session.access_token, {
                httpOnly: true,
                secure: false,
                sameSite: "Strict",
                maxAge: 60 * 60 * 1000,
            })
            .status(200)
            .json({
                mensagem: "Login realizado com sucesso",
                user: {
                    id: resultado.user.id,
                    email: resultado.user.email,
                },
            });

    } catch (error) {

        res.status(401).json({
            erro: "Email ou senha inválidos",
        });
    }
}


module.exports = {
    registerCompleto,
    login
}