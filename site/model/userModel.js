const supabase = require("../config/supabase");

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

    // 1. Cria o usuário no Supabase Auth
    const { data: authData, error: authError } =
        await supabase.auth.admin.createUser({
            email: email,
            password: senha,
            email_confirm: true
        });

    if (authError) {
        throw authError;
    }

    const userId = authData.user.id;


    // 2. Cria o responsável
    const { data: respData, error: respError } =
        await supabase
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


    // 3. Prepara as crianças usando os nomes enviados pelo frontend
    const criancasParaInserir = criancas.map((crianca) => ({
        nome: crianca.nome,
        responsavel_id: responsavelId,
        cpf: crianca.cpf,
        data_nasc: crianca.dataNascimento,
        genero: crianca.genero
    }));


    // 4. Cria as crianças
    const { data: criancaData, error: criancaError } =
        await supabase
            .from("criancas")
            .insert(criancasParaInserir)
            .select();

    if (criancaError) {
        throw criancaError;
    }


    // 5. Retorna os dados criados
    return {
        usuario: authData.user,
        responsavel: respData[0],
        criancas: criancaData
    };
}


// LOGIN __________________________________________________________________

async function loginUsuario(email, senha) {

    const { data, error } =
        await supabase.auth.signInWithPassword({
            email: email,
            password: senha
        });

    if (error) {
        throw error;
    }

    return data;
}


module.exports = {
    criarUsuarioEcriancas,
    loginUsuario
};