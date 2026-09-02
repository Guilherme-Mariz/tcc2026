const userModel = require("../model/userModel");
const supabaseAdmin = require("../config/supabase");
const createAuthClient = require("../config/supabaseAuth");

const {
    OAUTH_PKCE_COOKIE,
    setAuthCookie,
    clearAuthCookie,
    setOAuthPkceCookie,
    clearOAuthPkceCookie
} = require("../config/authCookies");

const {
    createOAuthPkceStorage,
    serializeOAuthStorage,
    deserializeOAuthStorage
} = require("../services/oauthPkceStorage");

function setNoStore(res) {
    res.set("Cache-Control", "private, no-store");
    res.set("Pragma", "no-cache");
}

function getAppUrl(req) {
    const configuredUrl = process.env.APP_URL?.trim();

    if (configuredUrl) {
        const parsed = new URL(configuredUrl);

        if (!["http:", "https:"].includes(parsed.protocol)) {
            throw new Error("APP_URL precisa usar HTTP ou HTTPS.");
        }

        if (
            process.env.NODE_ENV === "production" &&
            parsed.protocol !== "https:"
        ) {
            throw new Error("APP_URL precisa usar HTTPS em produção.");
        }

        return parsed.origin;
    }

    if (process.env.NODE_ENV === "production") {
        throw new Error("APP_URL precisa estar configurada em produção.");
    }

    return `${req.protocol}://${req.get("host")}`;
}

function usuarioPossuiGoogle(user) {
    const providers = user?.app_metadata?.providers || [
        user?.app_metadata?.provider
    ];

    return Array.isArray(providers) && providers.includes("google");
}

function dadosComplementaresValidos(body) {
    const {
        nome,
        cpf,
        pin,
        relacao,
        criancas
    } = body;

    return Boolean(
        nome?.trim() &&
        cpf?.replace(/\D/g, "").length === 11 &&
        /^\d{4}$/.test(String(pin || "")) &&
        relacao &&
        Array.isArray(criancas) &&
        criancas.length >= 1 &&
        criancas.length <= 2 &&
        criancas.every((crianca) => (
            crianca?.nome?.trim() &&
            crianca?.dataNascimento &&
            crianca?.cpf?.replace(/\D/g, "").length === 11 &&
            crianca?.genero
        ))
    );
}

function statusErroCadastro(error) {
    if (error?.code === "23505") {
        return {
            status: 409,
            mensagem: "CPF ou conta já cadastrada."
        };
    }

    return {
        status: 500,
        mensagem: "Não foi possível concluir o cadastro."
    };
}

// CADASTRO COM E-MAIL E SENHA ________________________________________________

async function registerCompleto(req, res) {
    const {
        nome,
        cpf,
        email,
        senha,
        pin,
        telefone,
        relacao,
        criancas
    } = req.body;

    if (
        !dadosComplementaresValidos(req.body) ||
        !email ||
        !email.includes("@") ||
        !senha ||
        senha.length < 8
    ) {
        return res.status(400).json({
            erro: "Dados de cadastro inválidos."
        });
    }

    try {
        const resultado = await userModel.criarUsuarioEcriancas(
            nome,
            cpf,
            email,
            senha,
            pin,
            telefone,
            relacao,
            criancas
        );

        const loginResultado = await userModel.loginUsuario(email, senha);

        setAuthCookie(
            res,
            loginResultado.session.access_token,
            loginResultado.session.expires_in
        );

        return res.status(201).json({
            mensagem: "Cadastro completo realizado com sucesso",
            dados: resultado
        });
    } catch (error) {
        console.error("Erro no cadastro tradicional:", error);

        const resposta = statusErroCadastro(error);

        return res.status(resposta.status).json({
            erro: resposta.mensagem
        });
    }
}

// LOGIN COM E-MAIL E SENHA ___________________________________________________

async function login(req, res) {
    const { email, senha } = req.body;

    if (!email || !email.includes("@")) {
        return res.status(400).json({ erro: "Email inválido" });
    }

    if (!senha || senha.length < 8) {
        return res.status(400).json({
            erro: "Senha deve ter no mínimo 8 caracteres"
        });
    }

    try {
        const resultado = await userModel.loginUsuario(email, senha);

        setAuthCookie(
            res,
            resultado.session.access_token,
            resultado.session.expires_in
        );

        return res.status(200).json({
            mensagem: "Login realizado com sucesso",
            user: {
                id: resultado.user.id,
                email: resultado.user.email
            }
        });
    } catch (error) {
        return res.status(401).json({
            erro: "Email ou senha inválidos"
        });
    }
}

// LOGIN COM GOOGLE ____________________________________________________________

async function iniciarLoginGoogle(req, res) {
    setNoStore(res);

    try {
        const callbackUrl = new URL(
            "/auth/google/callback",
            getAppUrl(req)
        ).toString();

        const oauthStorage = createOAuthPkceStorage();
        const supabaseAuth = createAuthClient({
            flowType: "pkce",
            persistSession: true,
            storage: oauthStorage.storage
        });

        const { data, error } = await supabaseAuth.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: callbackUrl,
                scopes: "openid email profile",
                queryParams: {
                    access_type: "online",
                    prompt: "select_account"
                }
            }
        });

        if (error || !data?.url) {
            throw error || new Error("URL OAuth não gerada.");
        }

        const storedValues = oauthStorage.snapshot();

        // Evita iniciar um fluxo que inevitavelmente falharia no callback.
        // O supabase-js só grava o code_verifier quando a persistência do
        // cliente PKCE está habilitada, mesmo usando um storage personalizado.
        if (
            !Object.keys(storedValues).some((key) =>
                key.endsWith("-code-verifier")
            )
        ) {
            throw new Error("Code verifier PKCE não foi criado.");
        }

        const serializedStorage = serializeOAuthStorage(storedValues);

        setOAuthPkceCookie(res, serializedStorage);

        return res.redirect(303, data.url);
    } catch (error) {
        console.error("Erro ao iniciar login Google:", error);
        clearOAuthPkceCookie(res);

        return res.redirect(303, "/login?google_error=unavailable");
    }
}

async function finalizarLoginGoogle(req, res) {
    setNoStore(res);

    const oauthError = req.query.error;
    const code = typeof req.query.code === "string"
        ? req.query.code
        : null;

    if (oauthError || !code) {
        clearOAuthPkceCookie(res);

        const reason = oauthError === "access_denied"
            ? "cancelled"
            : "invalid_callback";

        return res.redirect(303, `/login?google_error=${reason}`);
    }

    try {
        const storedValues = deserializeOAuthStorage(
            req.cookies[OAUTH_PKCE_COOKIE]
        );

        if (Object.keys(storedValues).length === 0) {
            throw new Error("Cookie PKCE ausente ou inválido.");
        }

        const oauthStorage = createOAuthPkceStorage(storedValues);
        const supabaseAuth = createAuthClient({
            flowType: "pkce",
            persistSession: true,
            storage: oauthStorage.storage
        });

        const { data, error } =
            await supabaseAuth.auth.exchangeCodeForSession(code);

        if (error || !data?.session || !data?.user) {
            throw error || new Error("Sessão OAuth não criada.");
        }

        if (!usuarioPossuiGoogle(data.user) || !data.user.email) {
            throw new Error("Identidade Google não confirmada.");
        }

        clearOAuthPkceCookie(res);
        setAuthCookie(
            res,
            data.session.access_token,
            data.session.expires_in
        );

        const responsavel =
            await userModel.buscarResponsavelPorUsuario(data.user.id);

        if (responsavel) {
            return res.redirect(303, "/login?google=success");
        }

        return res.redirect(303, "/register?google=complete");
    } catch (error) {
        console.error("Erro no callback do Google:", error);
        clearOAuthPkceCookie(res);
        clearAuthCookie(res);

        return res.redirect(303, "/login?google_error=callback_failed");
    }
}

async function obterPerfilGoogle(req, res) {
    setNoStore(res);

    if (!usuarioPossuiGoogle(req.user)) {
        return res.status(403).json({
            erro: "Esta sessão não foi autenticada com Google."
        });
    }

    try {
        const responsavel =
            await userModel.buscarResponsavelPorUsuario(req.user.id);

        const nome =
            req.user.user_metadata?.full_name ||
            req.user.user_metadata?.name ||
            "";

        return res.status(200).json({
            email: req.user.email,
            nome,
            cadastroCompleto: Boolean(responsavel)
        });
    } catch (error) {
        console.error("Erro ao consultar perfil Google:", error);

        return res.status(500).json({
            erro: "Não foi possível consultar o cadastro."
        });
    }
}

async function completarCadastroGoogle(req, res) {
    setNoStore(res);

    if (!usuarioPossuiGoogle(req.user)) {
        return res.status(403).json({
            erro: "Esta sessão não foi autenticada com Google."
        });
    }

    if (!dadosComplementaresValidos(req.body)) {
        return res.status(400).json({
            erro: "Dados de cadastro inválidos."
        });
    }

    const {
        nome,
        cpf,
        pin,
        telefone,
        relacao,
        criancas
    } = req.body;

    try {
        const resultado = await userModel.completarCadastroGoogle(
            req.user.id,
            nome,
            cpf,
            pin,
            telefone,
            relacao,
            criancas
        );

        return res.status(201).json({
            mensagem: "Cadastro Google concluído com sucesso.",
            dados: {
                usuario: {
                    id: req.user.id,
                    email: req.user.email
                },
                responsavel: resultado.responsavel,
                criancas: resultado.criancas
            }
        });
    } catch (error) {
        console.error("Erro ao completar cadastro Google:", error);

        const resposta = statusErroCadastro(error);

        return res.status(resposta.status).json({
            erro: resposta.mensagem
        });
    }
}

async function logout(req, res) {
    const token = req.cookies.token;

    try {
        if (token) {
            const { error } = await supabaseAdmin.auth.admin.signOut(
                token,
                "local"
            );

            if (error) {
                console.error("Erro ao revogar sessão:", error);
            }
        }
    } catch (error) {
