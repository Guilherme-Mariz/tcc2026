const { createClient } = require("@supabase/supabase-js");

const supabaseURL = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseURL || !serviceRoleKey) {
    throw new Error(
        "SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY precisam estar configuradas."
    );
}

// Cliente administrativo isolado: nenhum login de usuário deve ser feito nele.
const supabaseAdmin = createClient(
    supabaseURL,
    serviceRoleKey,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
            detectSessionInUrl: false
        }
    }
);

module.exports = supabaseAdmin;
