//Back-End______________

document.addEventListener('DOMContentLoaded', () => {

    let dadosEtapa1 = {}; // 🔥 guarda dados da etapa 1

    const form1 = document.getElementById('etapa1');

    form1.addEventListener('submit', async (e) => {
        e.preventDefault();

        const botao = document.querySelector("button");
        botao.disabled = true;

        const formData = new FormData(form1);

        if (!validarEtapa1()) {
            sacudir('etapa1');
            botao.disabled = false;
            return;
        }

        // 🔥 SALVA (NÃO ENVIA)
        dadosEtapa1 = {
            nome: formData.get("nome"),
            cpf: formData.get("cpf_responsavel"),
            email: formData.get("email"),
            senha: formData.get("senha"),
            telefone: formData.get("telefone"),
            relacao: formData.get("relacao")
        };

        mostrarEtapa(2, 'avancar');
        botao.disabled = false;
    });


    const form2 = document.getElementById('etapa2');

    form2.addEventListener('submit', async (e) => {
        e.preventDefault();

        const botao = document.querySelector("button");
        botao.disabled = true;

        const formData = new FormData(form2);

        if (!validarEtapa2()) {
            sacudir('etapa2');
            botao.disabled = false;
            return;
        }

        const dadosEtapa2 = {
            nomeCrianca: formData.get("nome_crianca"),
            datanasc: formData.get("data_nascimento"),
            cpfcri: formData.get("cpf_crianca"),
            genero: formData.get("genero")
        };

        // 🔥 JUNTA TUDO
        const dadosCompletos = {
            ...dadosEtapa1,
            ...dadosEtapa2
        };

        try {
            const resposta = await fetch('http://localhost:3000/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dadosCompletos)
            });

            const resultado = await resposta.json();

            if (!resposta.ok) {
                alert(resultado.erro || "Erro ao cadastrar");
                botao.disabled = false;
                return;
            }


            document.getElementById('sucessoOverlay').classList.add('aberto');
            document.body.style.overflow = 'hidden';

        } catch (erro) {
            console.error("Erro: ", erro);
            alert("Erro ao cadastrar");
        }

        botao.disabled = false;
    });

});




















//_______________________________________________________________________
const TOTAL_ETAPAS = 2;
let etapaAtual = 1;

// ─── TRANSIÇÃO ENTRE ETAPAS ───────────────────────────
function mostrarEtapa(nova, direcao) {
    const atual   = document.getElementById('etapa' + etapaAtual);
    const proxima = document.getElementById('etapa' + nova);

    atual.classList.add('saindo');

    atual.addEventListener('animationend', () => {
        atual.classList.remove('active', 'saindo');
        proxima.classList.add('active');

        if (direcao === 'voltar') {
            proxima.classList.add('voltando');
            proxima.addEventListener('animationend', () => {
                proxima.classList.remove('voltando');
            }, { once: true });
        }

        etapaAtual = nova;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, { once: true });
}

function voltar(etapa) {
    if (etapa > 1) {
        limparErros();
        mostrarEtapa(etapa - 1, 'voltar');
    }
}

// ─── SUBMIT DA ETAPA 1 ────────────────────────────────
document.getElementById('etapa1').addEventListener('submit', function(e) {
    e.preventDefault();

    

    // Aqui você fará a requisição ao backend (ex: fetch POST /cadastro/responsavel)
    // Por enquanto avança para a etapa 2
    // mostrarEtapa(2, 'avancar');
});

// ─── SUBMIT DA ETAPA 2 ────────────────────────────────
document.getElementById('etapa2').addEventListener('submit', function(e) {
    e.preventDefault();

    

    
});

// ─── VALIDAÇÕES ───────────────────────────────────────
function validarEtapa1() {
    let valido = true;

    const nome      = document.getElementById('nome');
    const cpfResp   = document.getElementById('cpf-responsavel');
    const email     = document.getElementById('reg-email');
    const senha     = document.getElementById('reg-senha');
    const confirmar = document.getElementById('confirmar-senha');
    const relacao   = document.querySelector('input[name="relacao"]:checked');
    const termos    = document.getElementById('termos');

    limparErros();

    if (!nome.value.trim()) {
        marcarErro(nome, 'Informe o nome completo.');
        valido = false;
    }

    if (cpfResp.value.replace(/\D/g, '').length !== 11) {
        marcarErro(cpfResp, 'Informe um CPF válido (11 dígitos).');
        valido = false;
    }

    if (!email.value.trim() || !email.value.includes('@')) {
        marcarErro(email, 'Informe um e-mail válido.');
        valido = false;
    }

    if (senha.value.length < 8) {
        marcarErro(senha, 'A senha deve ter no mínimo 8 caracteres.');
        valido = false;
    }

    if (confirmar.value !== senha.value) {
        marcarErro(confirmar, 'As senhas não coincidem.');
        valido = false;
    }

    if (!relacao) {
        mostrarErroGrupo('relacao', 'Selecione sua relação com a criança.');
        valido = false;
    }

    if (!termos.checked) {
        mostrarErroCheck(termos, 'Você deve aceitar os termos para continuar.');
        valido = false;
    }

    if (
            !nome ||
            !cpfResp ||
            !email ||
            !confirmar ||
            !senha ||
            !relacao ||
            !termos
        ) {
            console.log("Preencha todos os campos!");
            return;
        }

    return valido;
}

function validarEtapa2() {
    let valido = true;

    const nomeCrianca = document.getElementById('nome-crianca');
    const datanasc    = document.getElementById('data-nascimento');
    const cpf         = document.getElementById('cpf');
    const genero      = document.getElementById('genero');

    limparErros();

    if (!nomeCrianca.value.trim()) {
        marcarErro(nomeCrianca, 'Informe o nome da criança.');
        valido = false;
    }
    
    if (!genero.value.trim()) {
        marcarErro(genero, 'Informe o genero da criança.');
        valido = false;
    }

    if (!datanasc.value) {
        marcarErro(datanasc, 'Informe a data de nascimento.');
        valido = false;
    } else {
        const nascimento = new Date(datanasc.value);
        const hoje = new Date();
        const idade = hoje.getFullYear() - nascimento.getFullYear();
        if (nascimento > hoje || idade > 18) {
            marcarErro(datanasc, 'Informe uma data de nascimento válida.');
            valido = false;
        }
    }

    if (cpf.value.replace(/\D/g, '').length !== 11) {
        marcarErro(cpf, 'Informe um CPF válido (11 dígitos).');
        valido = false;
    }

    if (
            !nomeCrianca ||
            !cpf ||
            !datanasc ||
            !genero
        ) {
            console.log("Preencha todos os campos!");
            return;
        }

    return valido;

}

// ─── UTILITÁRIOS DE ERRO ──────────────────────────────
function marcarErro(input, msg) {
    const grupo = input.closest('.input-group');
    grupo.classList.add('campo-erro');
    if (!grupo.querySelector('.msg-erro')) {
        const err = document.createElement('span');
        err.className = 'msg-erro';
        err.textContent = msg;
        grupo.appendChild(err);
    }
    input.focus();
}

function mostrarErroGrupo(name, msg) {
    const input = document.querySelector('input[name="' + name + '"]');
    if (!input) return;
    const grupo = input.closest('.input-group');
    if (grupo.querySelector('.msg-erro')) return;
    const err = document.createElement('span');
    err.className = 'msg-erro';
    err.textContent = msg;
    grupo.appendChild(err);
}

function mostrarErroCheck(input, msg) {
    const grupo = input.closest('.input-group');
    if (grupo.querySelector('.msg-erro')) return;
    const err = document.createElement('span');
    err.className = 'msg-erro';
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

// ─── TOGGLE SENHA ─────────────────────────────────────
function togglePass(inputId, iconeId) {
    const input = document.getElementById(inputId);
    const icone = document.getElementById(iconeId);
    if (input.type === 'password') {
        input.type = 'text';
        icone.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        input.type = 'password';
        icone.classList.replace('fa-eye-slash', 'fa-eye');
    }
}

// ─── MÁSCARAS CPF ─────────────────────────────────────
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