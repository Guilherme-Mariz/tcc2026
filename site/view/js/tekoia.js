
/* =========================================================
   TEKOIA - CHAT
   ========================================================= */


/* ── elementos do chat ── */

const chatInput = document.getElementById("chat-input");
const sendBtn = document.getElementById("send-btn");

const chatDisplay =
    document.getElementById("chat-display-text");

const micBtn =
    document.getElementById("mic-btn");


/* ── estado da sessão ── */

let childIdSelecionado = null;

let typingTimer = null;
let gravando = false;


/* =========================================================
   UTILITÁRIOS
   ========================================================= */


/* ── pegar nome da criança ── */

function obterNomeCrianca(child) {

    return (
        child?.nome ||
        child?.nome_completo ||
        child?.firstName ||
        child?.nomeCrianca ||
        ""
    );
}


/* ── pegar ID da criança ── */

function obterIdCrianca(child) {

    return (
        child?.id ||
        child?.crianca_id ||
        child?.child_id ||
        null
    );
}


/* ── ler teko_session ── */

function obterSessaoLocal() {

    try {

        const sessao = JSON.parse(
            localStorage.getItem("teko_session") || "{}"
        );

        return sessao;

    } catch (error) {

        console.error(
            "Erro ao ler teko_session:",
            error
        );

        return {};
    }
}


/* ── pegar criança ativa do teko_session ── */

function obterCriancaAtivaLocal() {

    const sessao = obterSessaoLocal();

    return sessao?.crianca || null;
}


/* ── carregar exclusivamente a sessão global ativa ── */

function carregarSessaoAtiva(child = obterCriancaAtivaLocal()) {

    const id = obterIdCrianca(child);
    const nome = obterNomeCrianca(child);

    // O TEKO.IA não escolhe nem altera sessões; apenas consome a sessão global.
    childIdSelecionado = id || null;

    if (!childIdSelecionado) {
        chatInput.disabled = true;
        sendBtn.disabled = true;

        digitarMensagem(
            "Nenhuma sessão está ativa. Use “Trocar sessão” no menu para escolher uma criança."
        );

        return;
    }

    chatInput.disabled = false;
    sendBtn.disabled = false;

    digitarMensagem(
        `Oi, ${nome || "amigo"}! 👋 Como você está se sentindo hoje? 😊`
    );
}


/* =========================================================
   ÁREA DA RESPOSTA
   ========================================================= */

function digitarMensagem(texto) {

    clearTimeout(
        typingTimer
    );


    if (!chatDisplay) return;


    chatDisplay.classList.remove(
        "is-loading"
    );


    chatDisplay.textContent =
        "";


    let i = 0;


    (function passo() {

        if (i < texto.length) {

            chatDisplay.textContent +=
                texto.charAt(i);


            i++;


            typingTimer =
                setTimeout(
                    passo,
                    22
                );

        }

    })();

}


/* =========================================================
   CARREGANDO
   ========================================================= */

function mostrarCarregando() {

    clearTimeout(
        typingTimer
    );


    if (!chatDisplay) return;


    chatDisplay.classList.add(
        "is-loading"
    );


    chatDisplay.innerHTML = `
        <span class="loading-dots">
            <span></span>
            <span></span>
            <span></span>
        </span>
    `;

}


/* =========================================================
   MICROFONE
   ========================================================= */

if (micBtn) {

    micBtn.addEventListener(
        "click",
        () => {

            gravando =
                !gravando;


            micBtn.classList.toggle(
                "recording",
                gravando
            );


            micBtn.setAttribute(
                "aria-pressed",
                String(gravando)
            );


            // Futuramente:
            // SpeechRecognition

        }
    );

}


/* =========================================================
   ENVIAR MENSAGEM
   ========================================================= */

async function enviarMensagem() {

    if (!chatInput) return;


    const texto =
        chatInput.value.trim();


    if (!texto) return;


    /*
     * IMPORTANTE:
     *
     * O TEKOIA só envia mensagem se houver
     * um childId válido.
     */

    if (!childIdSelecionado) {

        digitarMensagem(
            'Use “Trocar sessão” no menu para escolher uma criança antes de conversar. 😊'
        );

        return;
    }


    console.log(
        "===== ENVIO PARA TEKO ====="
    );

    console.log(
        "childId enviado:",
        childIdSelecionado
    );

    console.log(
        "message:",
        texto
    );


    chatInput.value =
        "";


    sendBtn.disabled =
        true;


    mostrarCarregando();


    try {

        const resposta =
            await fetch(
                "/api/ai/chat",
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    credentials: "include",

                    body: JSON.stringify({

                        childId:
                            childIdSelecionado,

                        message:
                            texto
                    })

                }
            );


        const dados =
            await resposta.json();


        if (!resposta.ok) {

            if (
                resposta.status === 403
            ) {

                digitarMensagem(
                    "Você não tem acesso a essa criança."
                );

                return;
            }


            if (
                resposta.status === 401
            ) {

                digitarMensagem(
                    "Sua sessão expirou. Faça login novamente."
                );

                return;
            }


            throw new Error(
                dados.error ||
                "Erro ao conversar com o TEKO."
            );

        }


        digitarMensagem(
            dados.response ||
            "Hmm, não entendi. Pode repetir? 😊"
        );


    } catch (error) {

        console.error(
            "Erro ao enviar mensagem:",
            error
        );


        digitarMensagem(
            "Ops, tive um problema aqui. Tenta de novo! 😅"
        );


    } finally {

        sendBtn.disabled =
            false;


        chatInput.focus();

    }

}


/* ── botão enviar ── */

if (sendBtn) {

    sendBtn.addEventListener(
        "click",
        enviarMensagem
    );

}


/* ── Enter ── */

if (chatInput) {

    chatInput.addEventListener(
        "keydown",
        evento => {

            if (
                evento.key === "Enter" &&
                !evento.shiftKey
            ) {

                evento.preventDefault();

                enviarMensagem();

            }

        }
    );

}


/* =========================================================
   SINCRONIZAÇÃO COM TROCA DE SESSÃO
   ========================================================= */

window.addEventListener(
    "teko:session-changed",
    evento => {

        const child =
            evento.detail?.child ||
            obterCriancaAtivaLocal();


        carregarSessaoAtiva(child);

    }
);


/* =========================================================
   INICIALIZAÇÃO
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {
        /* ── avatar ── */

        if (
            typeof carregarAvatar ===
            "function"
        ) {

            carregarAvatar();

        }


        // A criança já foi definida no login ou no fluxo global de troca de sessão.
        carregarSessaoAtiva();

    }
);
