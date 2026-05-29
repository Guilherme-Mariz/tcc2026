// ─── BACK-END ────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {

    let dadosEtapa1 = {};

    // ── SUBMIT ETAPA 1 ────────────────────────────────
    const form1 = document.getElementById('etapa1');

    form1.addEventListener('submit', async (e) => {
        e.preventDefault();

        const botao = form1.querySelector('button[type="submit"]');
        botao.disabled = true;

        if (!validarEtapa1()) {
            sacudir('etapa1');
            botao.disabled = false;
            return;
        }

        const formData = new FormData(form1);

        dadosEtapa1 = {
            nome:     formData.get("nome"),
            cpf:      formData.get("cpf_responsavel"),
            email:    formData.get("email"),
            senha:    formData.get("senha"),
            telefone: formData.get("telefone"),
            relacao:  formData.get("relacao")
        };

        // Usa a função de transição GSAP definida no HTML
        irParaEtapa2();
        botao.disabled = false;
    });

    // ── SUBMIT ETAPA 2 ────────────────────────────────
    const form2 = document.getElementById('etapa2');

    form2.addEventListener('submit', async (e) => {
        e.preventDefault();

        const botao = form2.querySelector('button[type="submit"]');
        botao.disabled = true;

        if (!validarEtapa2()) {
            sacudir('etapa2');
            botao.disabled = false;
            return;
        }

        const formData = new FormData(form2);

        const dadosEtapa2 = {
            nomeCrianca: formData.get("nome_crianca"),
            datanasc:    formData.get("data_nascimento"),
            cpfcri:      formData.get("cpf_crianca"),
            genero:      formData.get("genero")
        };

        const dadosCompletos = { ...dadosEtapa1, ...dadosEtapa2 };

        try {
            const resposta = await fetch('http://localhost:3000/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dadosCompletos)
            });

            const resultado = await resposta.json();

            if (!resposta.ok) {
                alert(resultado.erro || "Erro ao cadastrar");
                botao.disabled = false;
                return;
            }

            // Usa a função de sucesso GSAP definida no HTML
            mostrarSucesso();

        } catch (erro) {
            console.error("Erro: ", erro);
            alert("Erro ao conectar com o servidor. Verifique se o servidor está rodando.");
        }

        botao.disabled = false;
    });

});

// ─── VALIDAÇÕES ──────────────────────────────────────────────────────────────

function validarEtapa1() {
    let valido   = true;
    let primeiro = true;

    const nome      = document.getElementById('nome');
    const cpfResp   = document.getElementById('cpf-responsavel');
    const email     = document.getElementById('reg-email');
    const senha     = document.getElementById('reg-senha');
    const confirmar = document.getElementById('confirmar-senha');
    const relacao   = document.querySelector('input[name="relacao"]:checked');
    const termos    = document.getElementById('termos');

    limparErros();

    if (!nome.value.trim()) {
        marcarErro(nome, 'Informe o nome completo.', primeiro);
        valido = false; primeiro = false;
    }

    if (cpfResp.value.replace(/\D/g, '').length !== 11) {
        marcarErro(cpfResp, 'Informe um CPF válido (11 dígitos).', primeiro);
        valido = false; primeiro = false;
    }

    if (!email.value.trim() || !email.value.includes('@')) {
        marcarErro(email, 'Informe um e-mail válido.', primeiro);
        valido = false; primeiro = false;
    }

    if (senha.value.length < 8) {
        marcarErro(senha, 'A senha deve ter no mínimo 8 caracteres.', primeiro);
        valido = false; primeiro = false;
    }

    if (confirmar.value !== senha.value) {
        marcarErro(confirmar, 'As senhas não coincidem.', primeiro);
        valido = false; primeiro = false;
    }

    if (!relacao) {
        mostrarErroGrupo('relacao', 'Selecione sua relação com a criança.');
        valido = false;
    }

    if (!termos.checked) {
        mostrarErroCheck(termos, 'Você deve aceitar os termos para continuar.');
        valido = false;
    }

    return valido;
}

function validarEtapa2() {
    let valido   = true;
    let primeiro = true;

    const nomeCrianca = document.getElementById('nome-crianca');
    const datanasc    = document.getElementById('data-nascimento');
    const cpf         = document.getElementById('cpf');
    const genero      = document.getElementById('genero');

    limparErros();

    if (!nomeCrianca.value.trim()) {
        marcarErro(nomeCrianca, 'Informe o nome da criança.', primeiro);
        valido = false; primeiro = false;
    }

    if (!datanasc.value) {
        marcarErro(datanasc, 'Informe a data de nascimento.', primeiro);
        valido = false; primeiro = false;
    } else {
        const nascimento = new Date(datanasc.value);
        const hoje       = new Date();
        const idade      = hoje.getFullYear() - nascimento.getFullYear();
        if (nascimento > hoje || idade > 18) {
            marcarErro(datanasc, 'Informe uma data de nascimento válida.', primeiro);
            valido = false; primeiro = false;
        }
    }

    if (cpf.value.replace(/\D/g, '').length !== 11) {
        marcarErro(cpf, 'Informe um CPF válido (11 dígitos).', primeiro);
        valido = false; primeiro = false;
    }

    if (!genero.value) {
        marcarErro(genero, 'Selecione o gênero da criança.', primeiro);
        valido = false;
    }

    return valido;
}

// ─── UTILITÁRIOS DE ERRO ─────────────────────────────────────────────────────

function marcarErro(input, msg, primeiroErro) {
    const grupo = input.closest('.field') || input.closest('.input-group');
    grupo.classList.add('campo-erro');
    if (!grupo.querySelector('.msg-erro')) {
        const err = document.createElement('span');
        err.className   = 'msg-erro';
        err.textContent = msg;
        grupo.appendChild(err);
    }
    if (primeiroErro) input.focus();
}

function mostrarErroGrupo(name, msg) {
    const input = document.querySelector('input[name="' + name + '"]');
    if (!input) return;
    const grupo = input.closest('.field') || input.closest('.input-group');
    if (grupo.querySelector('.msg-erro')) return;
    const err = document.createElement('span');
    err.className   = 'msg-erro';
    err.textContent = msg;
    grupo.appendChild(err);
}

function mostrarErroCheck(input, msg) {
    const grupo = input.closest('.field') || input.closest('.input-group');
    if (grupo.querySelector('.msg-erro')) return;
    const err = document.createElement('span');
    err.className   = 'msg-erro';
    err.textContent = msg;
    grupo.appendChild(err);
}

function limparErros() {
    document.querySelectorAll('.campo-erro').forEach(el => el.classList.remove('campo-erro'));
    document.querySelectorAll('.msg-erro').forEach(el => el.remove());
}

function sacudir(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add('sacudir');
    el.addEventListener('animationend', () => el.classList.remove('sacudir'), { once: true });
}

// ─── MÁSCARAS CPF ────────────────────────────────────────────────────────────

function aplicarMascaraCPF(inputId) {
    const el = document.getElementById(inputId);
    if (!el) return;
    el.addEventListener('input', () => {
        let v = el.value.replace(/\D/g, '').slice(0, 11);
        if (v.length > 9)      v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4');
        else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d{0,3})/, '$1.$2.$3');
        else if (v.length > 3) v = v.replace(/(\d{3})(\d{0,3})/, '$1.$2');
        el.value = v;
    });
}

aplicarMascaraCPF('cpf-responsavel');
aplicarMascaraCPF('cpf');
