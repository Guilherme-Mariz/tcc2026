const userModel  = require("../model/userModel");
const supabase   = require("../config/supabase");

// ─────────────────────────────────────────────────────────
// CADASTRO
// ─────────────────────────────────────────────────────────
async function registerCompleto(req, res) {
  const {
    nome, cpf, email, senha, telefone, relacao,
    nomeCrianca, cpfcri, datanasc, genero,
  } = req.body;

  try {
    const resultado = await userModel.criarUsuarioEcrianca(
      nome, cpf, email, senha, telefone, relacao,
      nomeCrianca, datanasc, cpfcri, genero,
    );

    res.status(201).json({
      mensagem: "Cadastro completo realizado com sucesso",
      dados: resultado,
    });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
}

// ─────────────────────────────────────────────────────────
// LOGIN
// Fluxo:
//   1. autentica via Supabase Auth
//   2. busca responsavel em `responsaveis` pelo user_id
//   3. busca crianca em `criancas` pelo responsavel_id
//   4. token → cookie HttpOnly (nunca exposto no JSON)
//   5. retorna { responsavel, crianca } para o front salvar
// ─────────────────────────────────────────────────────────
async function login(req, res) {
  const { email, senha } = req.body;

  if (!email || !email.includes("@"))
    return res.status(400).json({ erro: "Email inválido" });

  if (!senha || senha.length < 8)
    return res.status(400).json({ erro: "Senha deve ter no mínimo 8 caracteres" });

  try {
    // 1. autentica
    const resultado = await userModel.loginUsuario(email, senha);
    const userId    = resultado.user.id;

    // 2. busca responsável — coluna `nome_completo` conforme seu schema
    const { data: responsavel, error: errResp } = await supabase
      .from("responsaveis")
      .select("id, nome_completo, relacao, telefone")
      .eq("user_id", userId)
      .single();

    if (errResp) console.error("Erro ao buscar responsável:", errResp.message);

    // 3. busca criança — FK `responsavel_id` conforme seu schema
    const { data: crianca, error: errCri } = await supabase
      .from("criancas")
      .select("id, nome, data_nasc, genero")
      .eq("responsavel_id", responsavel?.id)
      .single();

    if (errCri) console.error("Erro ao buscar criança:", errCri.message);

    // 4. token apenas no cookie HttpOnly
    res.cookie("token", resultado.session.access_token, {
      httpOnly: true,
      secure: false,             // true em produção (HTTPS)
      sameSite: "Strict",
      maxAge: 60 * 60 * 1000,   // 1 hora
    });

    // 5. retorna dados de exibição — sem senha, sem token
    return res.status(200).json({
      mensagem: "Login realizado com sucesso",
      responsavel: {
        id:           responsavel?.id           ?? null,
        nome_completo: responsavel?.nome_completo ?? null,
        relacao:      responsavel?.relacao       ?? null,
        email:        resultado.user.email,
      },
      crianca: {
        id:        crianca?.id        ?? null,
        nome:      crianca?.nome      ?? null,
        data_nasc: crianca?.data_nasc ?? null,
        genero:    crianca?.genero    ?? null,
      },
    });

  } catch (error) {
    console.error("Erro no login:", error.message);
    return res.status(401).json({ erro: "Email ou senha inválidos" });
  }
}

module.exports = { registerCompleto, login };
