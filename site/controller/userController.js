const userModel = require("../model/userModel");

// CADASTRO____________________________________________________________________

async function registerCompleto(req, res) {
  const {
    nome,
    cpf,
    email,
    senha,
    telefone,
    relacao,
    nomeCrianca,
    cpfcri,
    datanasc,
    genero,
  } = req.body;

  try {
    const resultado = await userModel.criarUsuarioEcrianca(
      nome,
      cpf,
      email,
      senha,
      telefone,
      relacao,
      nomeCrianca,
      datanasc,
      cpfcri,
      genero,
    );

    res.status(201).json({
      mensagem: "Cadastro completo realizado com sucesso",
      dados: resultado,
    });
  } catch (error) {
    res.status(500).json({
      erro: error.message,
    });
  }
}

module.exports = {
  registerCompleto,
};

// LOGIN__________________________________________________________________________

async function login(req, res) {
  const { email, senha } = req.body;

  if (!email || !email.includes("@")) {
    return res.status(400).json({ erro: "Email inválido" });
  }

  if (!senha || senha.length < 8) {
    return res.status(400).json({ erro: "Senha deve ter no mínimo 8 caracteres" });
  }

  try {
    const resultado = await userModel.loginUsuario(email, senha);

    res
      .cookie("token", resultado.session.access_token, {
        httpOnly: true,
        secure: false, // true em produção (HTTPS)
        sameSite: "Strict",
        maxAge: 60 * 60 * 1000, // 1 hora
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
  login,
};
