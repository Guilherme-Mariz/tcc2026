const supabase = require("../config/supabase");

// CADASTRO ________________________________________________________________________________

async function criarUsuarioEcrianca(
    nome, cpf, email, senha, telefone, relacao,
    nomeCrianca, datanasc, cpfcri, genero
) {
    // 🔥 ALTERAÇÃO AQUI
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: email,
        password: senha,
        email_confirm: true
    });

    if (authError) {
        throw authError;
    }

    const userId = authData.user.id;

    const { data: respData, error: respError } = await supabase
        .from('responsaveis')
        .insert([{
            nome_completo: nome,
            cpf: cpf,
            telefone: telefone,
            relacao: relacao,
            user_id: userId
        }])
        .select();

    if (respError) {
        throw respError;
    }

    const responsavelId = respData[0].id;

    const { data: criancaData, error: criancaError } = await supabase
        .from('criancas')
        .insert([{
            nome: nomeCrianca,
            responsavel_id: responsavelId,
            cpf: cpfcri,
            data_nasc: datanasc,
            genero: genero
        }])
        .select();

    if (criancaError) {
        throw criancaError;
    }

    return {
        usuario: authData.user,
        responsavel: respData[0],
        crianca: criancaData[0]
    };
}




// LOGIN__________________________________________________________________

async function loginUsuario(email, senha) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: senha
    });

    if (error) {
        throw error;
    }

    return data;
}

module.exports = {
    criarUsuarioEcrianca,
    loginUsuario
};