const supabaseAdmin = require("../config/supabase");
const createAuthClient = require("../config/supabaseAuth");

// CADASTRO ________________________________________________________________________________

async function criarUsuarioEcriancas(
    nome,
    cpf,
    email,
    senha,
    pin,
    telefone,
    relacao,
    criancas
) {

    // 1. Cria o usuário com o cliente administrativo.
    const { data: authData, error: authError } =
        await supabaseAdmin.auth.admin.createUser({
            email: email,
            password: senha,
            email_confirm: true
        });

    if (authError) {
        throw authError;
    }

    const userId = authData.user.id;


    // 2. Cria o responsável relacionado ao usuário do Supabase Auth.
    const { data: respData, error: respError } =
        await supabaseAdmin
            .from("responsaveis")
            .insert([{
                nome_completo: nome,
                cpf: cpf,
                telefone: telefone || null,
                relacao: relacao,
                user_id: userId,
                pin: pin
            }])
            .select();

    if (respError) {
        throw respError;
    }

    const responsavelId = respData[0].id;


    // 3. Prepara as crianças usando os nomes enviados pelo frontend.
    const criancasParaInserir = criancas.map((crianca) => ({
        nome: crianca.nome,
        responsavel_id: responsavelId,
        cpf: crianca.cpf,
        data_nasc: crianca.dataNascimento,
        genero: crianca.genero
    }));


    // 4. Cria as crianças com o mesmo cliente administrativo isolado.
    const { data: criancaData, error: criancaError } =
        await supabaseAdmin
            .from("criancas")
            .insert(criancasParaInserir)
            .select();

    if (criancaError) {
        throw criancaError;
    }


    // 5. Retorna os dados criados.
    return {
        usuario: authData.user,
        responsavel: respData[0],
        criancas: criancaData
    };
}


// LOGIN __________________________________________________________________

async function loginUsuario(email, senha) {
    // O cliente é descartado após este login e nunca altera o cliente administrativo.
    const supabaseAuth = createAuthClient();

    const { data, error } =
        await supabaseAuth.auth.signInWithPassword({
            email: email,
            password: senha
        });

    if (error) {
        throw error;
    }

    return data;
}


// PERFIL DO RESPONSÁVEL ______________________________________________________

async function buscarResponsavelPorUsuario(userId) {
    const { data, error } = await supabaseAdmin
        .from("responsaveis")
        .select("id, nome_completo, user_id")
        .eq("user_id", userId)
        .maybeSingle();

    if (error) {
        throw error;
    }

    return data;
}

async function buscarCriancasPorResponsavel(responsavelId) {
    const { data, error } = await supabaseAdmin
        .from("criancas")
        .select("id, nome, data_nasc, cpf, genero, responsavel_id")
        .eq("responsavel_id", responsavelId)
        .order("created_at", { ascending: true });

    if (error) {
        throw error;
    }

    return data || [];
}

async function completarCadastroGoogle(
    userId,
    nome,
    cpf,
    pin,
    telefone,
    relacao,
    criancas
) {
    let responsavel = await buscarResponsavelPorUsuario(userId);
    let criouResponsavel = false;

    // Uma repetição do callback ou do envio do formulário não pode criar
    // outro responsável para o mesmo usuário autenticado.
    if (responsavel) {
        const criancasExistentes =
            await buscarCriancasPorResponsavel(responsavel.id);

        if (criancasExistentes.length > 0) {
            return {
                responsavel,
                criancas: criancasExistentes,
                cadastroExistente: true
            };
        }
    } else {
        const { data, error } = await supabaseAdmin
            .from("responsaveis")
            .insert([{
                nome_completo: nome,
                cpf,
                telefone: telefone || null,
                relacao,
                user_id: userId,
                pin
            }])
            .select("id, nome_completo, user_id")
            .single();

        if (error) {
            throw error;
        }

        responsavel = data;
        criouResponsavel = true;
    }

    const criancasParaInserir = criancas.map((crianca) => ({
        nome: crianca.nome,
        responsavel_id: responsavel.id,
        cpf: crianca.cpf,
        data_nasc: crianca.dataNascimento,
        genero: crianca.genero
    }));

    const { data: criancasCriadas, error: criancasError } =
        await supabaseAdmin
            .from("criancas")
            .insert(criancasParaInserir)
            .select();

    if (criancasError) {
        // Evita deixar um perfil vazio quando a criação das crianças falha.
        if (criouResponsavel) {
            await supabaseAdmin
                .from("responsaveis")
                .delete()
                .eq("id", responsavel.id);
        }

        throw criancasError;
    }

    return {
        responsavel,
        criancas: criancasCriadas,
        cadastroExistente: false
    };
}


module.exports = {
    criarUsuarioEcriancas,
    loginUsuario,
    buscarResponsavelPorUsuario,
    completarCadastroGoogle
};
