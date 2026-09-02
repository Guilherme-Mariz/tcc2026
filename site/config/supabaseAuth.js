const { createClient } = require("@supabase/supabase-js");

function createAuthClient(options = {}) {
    const supabaseURL = process.env.SUPABASE_URL;

    // A chave publicável é preferida. O fallback mantém compatibilidade com o .env atual
    // e permanece somente no servidor, sem ser enviado ao navegador.
    const authKey =
        process.env.SUPABASE_PUBLISHABLE_KEY ||
        process.env.SUPABASE_ANON_KEY ||
        process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseURL || !authKey) {
        throw new Error(
            "SUPABASE_URL e uma chave do Supabase precisam estar configuradas."
        );
    }

    const authOptions = {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
        flowType: options.flowType || "implicit"
    };

    // O fluxo OAuth PKCE precisa de um armazenamento temporário para o
    // code_verifier. Ele é fornecido por requisição e nunca é compartilhado.
    if (options.storage) {
        authOptions.storage = options.storage;
    }

    // Um cliente novo por login impede que a sessão de um usuário afete outras requisições.
    return createClient(
        supabaseURL,
        authKey,
        {
            auth: authOptions
        }
    );
}

module.exports = createAuthClient;
