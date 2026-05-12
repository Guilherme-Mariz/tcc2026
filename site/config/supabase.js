const { createClient } = require("@supabase/supabase-js");

const supabaseURL = process.env.SUPABASE_URL;
const supabaseKEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseURL, supabaseKEY);



module.exports = supabase;