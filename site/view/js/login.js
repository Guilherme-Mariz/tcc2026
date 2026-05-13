document.getElementById("form-login").addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const senha = document.getElementById("senha").value;
    const login = document.querySelector('.cad-login');

    if (!email || !senha) {
        validarLogin();
        login.classList.add('sacudir');
        login.addEventListener('animationend', () => login.classList.remove('sacudir'), { once: true });
        return;
    }

    // exibe tela de carregamento
    document.getElementById('loading-screen').classList.add('ativo');

    try {
        const resposta = await fetch("http://localhost:3000/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: 'include',
            body: JSON.stringify({ email, senha })
        });

        const resultado = await resposta.json();

        if (!resposta.ok) {
            document.getElementById('loading-screen').classList.remove('ativo');
            validarLogin();
            login.classList.add('sacudir');
            login.addEventListener('animationend', () => login.classList.remove('sacudir'), { once: true });
            return;
        }

        window.location.href = "/home";

    } catch (erro) {
        console.error(erro);
        document.getElementById('loading-screen').classList.remove('ativo');
    }
});


function validarLogin() {
    let valido = true;

    const login = document.querySelector('.cad-login');
    const email     = document.getElementById('email');
    const senha     = document.getElementById('senha');

    limparErros();

    
    if (!email.value.trim() || !email.value.includes('@')) {
        marcarErro(email, 'Informe um e-mail válido.');
        login.classList.add('sacudir');
        valido = false;
        login.addEventListener('animationend', () => login.classList.remove('sacudir'), { once: true });
        return;
    }

    if (senha.value.length < 8) {
        marcarErro(senha, 'A senha deve ter no mínimo 8 caracteres.');
        login.classList.add('sacudir');

        valido = false;
        login.addEventListener('animationend', () => login.classList.remove('sacudir'), { once: true });
        return;
      }

    

    if (
            !email ||
            !senha 
        ) {
            console.log("Preencha todos os campos!");
            login.classList.add('sacudir');
            login.addEventListener('animationend', () => login.classList.remove('sacudir'), { once: true });
            return;
        }

    return valido;
}

function limparErros() {
    document.querySelectorAll('.campo-erro').forEach(el => el.classList.remove('campo-erro'));
    document.querySelectorAll('.msg-erro').forEach(el => el.remove());
}

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





function toggleSenha() {
      const input = document.getElementById('senha');
      const icone = document.getElementById('icone-olho');
      if (input.type === 'password') {
        input.type = 'text';
        icone.classList.replace('fa-eye', 'fa-eye-slash');
      } else {
        input.type = 'password';
        icone.classList.replace('fa-eye-slash', 'fa-eye');
      }
    }

