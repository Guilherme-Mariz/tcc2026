
/* =========================================================
   TEKOIA - CHAT
   ========================================================= */


/* ── elementos do chat ── */

const chatInput = document.getElementById("chat-input");
const sendBtn = document.getElementById("send-btn");

const btnSessao =
    document.getElementById("btn-sessao");

const listaSessao =
    document.getElementById("chat-session-list");

const chatDisplay =
    document.getElementById("chat-display-text");

const micBtn =
    document.getElementById("mic-btn");


/* ── estado da sessão ── */

let childIdSelecionado = null;
let criancaAtiva = null;

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


/* ── atualizar nome exibido no botão de sessão ── */

function atualizarNomeSessao(child) {

    if (!btnSessao) return;

    const textoSessao =
        btnSessao.querySelector("span");

    if (!textoSessao) return;

    const nome =
        obterNomeCrianca(child);

    textoSessao.textContent =
        nome || "Sessão";
}


/* =========================================================
   CARREGAR CRIANÇAS
   ========================================================= */

async function carregarCriancas() {

    try {

        const resposta = await fetch(
            "/children",
            {
                method: "GET",
                credentials: "include"
            }
        );

        const dados = await resposta.json();

        if (!resposta.ok || !dados.success) {

            throw new Error(
                dados.error ||
                "Não foi possível carregar as crianças."
            );
        }


        /* ── lista retornada pelo backend ── */

        const children =
            Array.isArray(dados.children)
                ? dados.children
                : [];


        listaSessao.innerHTML = "";


        /* ── nenhuma criança ── */

        if (children.length === 0) {

            listaSessao.innerHTML = `
                <li class="chat-session-empty">
                    Nenhuma criança cadastrada
                </li>
            `;

            childIdSelecionado = null;
            criancaAtiva = null;

            atualizarNomeSessao(null);

            return;
        }


        /* =================================================
           LER SESSÃO ATUAL DO LOCALSTORAGE
           ================================================= */

        const sessaoLocal =
            obterCriancaAtivaLocal();

        const idSessao =
            obterIdCrianca(sessaoLocal);


        console.log(
            "===== TEKOIA - SESSÃO LOCAL ====="
        );

        console.log(
            "Criança salva no teko_session:",
            sessaoLocal
        );

        console.log(
            "ID salvo no teko_session:",
            idSessao
        );


        /* =================================================
           LOCALIZAR A CRIANÇA ATIVA
           ================================================= */

        let criancaSelecionada = null;


        if (idSessao) {

            criancaSelecionada =
                children.find(child =>
                    String(obterIdCrianca(child)) ===
                    String(idSessao)
                ) || null;
        }


        /*
         * Se não existir uma criança válida no
         * teko_session, não força uma sessão.
         *
         * Isso evita mandar mensagem para uma
         * criança errada.
         */

        if (criancaSelecionada) {

            selecionarCrianca(
                criancaSelecionada,
                false
            );

        } else {

            childIdSelecionado = null;
            criancaAtiva = null;

            atualizarNomeSessao(null);
        }


        /* =================================================
           MONTAR LISTA DE CRIANÇAS
           ================================================= */

        children.forEach(child => {

            const item =
                document.createElement("li");

            const nome =
                obterNomeCrianca(child);

            const id =
                obterIdCrianca(child);


            item.textContent =
                nome || "Criança";


            item.dataset.childId =
                id || "";


            item.setAttribute(
                "role",
                "option"
            );


            item.tabIndex = 0;


            /*
             * Marcar visualmente a criança
             * atualmente selecionada.
             */

            if (
                criancaSelecionada &&
                String(id) ===
                String(obterIdCrianca(criancaSelecionada))
            ) {

                item.classList.add("selected");

                item.setAttribute(
                    "aria-selected",
                    "true"
                );

            } else {

                item.setAttribute(
                    "aria-selected",
                    "false"
                );
            }


            /* ── clique ── */

            item.addEventListener(
                "click",
                () => {

                    selecionarCrianca(
                        child,
                        true
                    );

                }
            );


            /* ── teclado ── */

            item.addEventListener(
                "keydown",
                evento => {

                    if (
                        evento.key === "Enter" ||
                        evento.key === " "
                    ) {

                        evento.preventDefault();

                        selecionarCrianca(
                            child,
                            true
                        );
                    }
                }
            );


            listaSessao.appendChild(item);

        });


    } catch (error) {

        console.error(
            "Erro ao carregar crianças:",
            error
        );


        listaSessao.innerHTML = `
            <li class="chat-session-empty">
                Erro ao carregar crianças
            </li>
        `;

    }

}


/* =========================================================
   SELECIONAR CRIANÇA
   ========================================================= */

function selecionarCrianca(
    child,
    mostrarMensagem = true
) {

    if (!child) return;


    const id =
        obterIdCrianca(child);

    const nome =
        obterNomeCrianca(child);


    /*
     * O ID utilizado pelo TEKOIA para conversar
     * com o backend é SEMPRE o ID da tabela criancas.
     */

    childIdSelecionado =
        id || null;


    criancaAtiva =
        child;


    console.log(
        "===== TEKOIA - CRIANÇA SELECIONADA ====="
    );

    console.log(
        "Nome:",
        nome
    );

    console.log(
        "childId:",
        childIdSelecionado
    );


    /* ── atualizar botão ── */

    atualizarNomeSessao(child);


    /* ── fechar lista ── */

    if (listaSessao) {

        listaSessao.hidden = true;
    }


    if (btnSessao) {

        btnSessao.setAttribute(
            "aria-expanded",
            "false"
        );
    }


    /* =================================================
       ATUALIZAR VISUAL DA LISTA
       ================================================= */

    if (listaSessao) {

        listaSessao
            .querySelectorAll(".chat-session-option, li")
            .forEach(opcao => {

                opcao.classList.remove(
                    "selected"
                );

                opcao.setAttribute(
                    "aria-selected",
                    "false"
                );
            });


        const opcaoSelecionada =
            listaSessao.querySelector(
                `[data-child-id="${CSS.escape(String(id))}"]`
            );


        if (opcaoSelecionada) {

            opcaoSelecionada.classList.add(
                "selected"
            );

            opcaoSelecionada.setAttribute(
                "aria-selected",
                "true"
            );
        }
    }


    /* =================================================
       MANTER teko_session SINCRONIZADO
       ================================================= */

    try {

        const sessao =
            obterSessaoLocal();


        sessao.crianca = {

            ...child,

            id: id,

            nome: nome
        };


        localStorage.setItem(
            "teko_session",
            JSON.stringify(sessao)
        );


    } catch (error) {

        console.error(
            "Erro ao atualizar teko_session:",
            error
        );
    }


    /* ── mensagem inicial ── */

    if (mostrarMensagem && nome) {

        digitarMensagem(
            `Oi, ${nome}! 👋 Como você está se sentindo hoje? 😊`
        );
    }

}


/* =========================================================
   MENU DE SESSÃO
   ========================================================= */

if (btnSessao && listaSessao) {

    btnSessao.addEventListener(
        "click",
        evento => {

            evento.stopPropagation();


            const aberto =
                !listaSessao.hidden;


            listaSessao.hidden =
                aberto;


            btnSessao.setAttribute(
                "aria-expanded",
                String(!aberto)
            );

        }
    );


    document.addEventListener(
        "click",
        () => {

            listaSessao.hidden =
                true;


            btnSessao.setAttribute(
                "aria-expanded",
                "false"
            );

        }
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
            'Primeiro escolha uma criança na opção "Sessão". 😊'
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


        if (!child) return;


        console.log(
            "TEKOIA recebeu troca de sessão:",
            child
        );


        selecionarCrianca(
            child,
            true
        );

    }
);


/* =========================================================
   INICIALIZAÇÃO
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        /*
         * Primeiro tenta carregar a sessão salva.
         * Depois busca as crianças no backend.
         */

        const sessao =
            obterCriancaAtivaLocal();


        if (sessao) {

            const id =
                obterIdCrianca(sessao);


            if (id) {

                childIdSelecionado =
                    id;

                criancaAtiva =
                    sessao;


                atualizarNomeSessao(
                    sessao
                );


                console.log(
                    "TEKOIA iniciou com sessão salva:",
                    sessao
                );

            }

        }


        /* ── avatar ── */

        if (
            typeof carregarAvatar ===
            "function"
        ) {

            carregarAvatar();

        }


        /* ── carregar crianças ── */

        carregarCriancas();


        /*
         * Mensagem padrão somente quando
         * ainda não existe uma criança ativa.
         */

        if (!sessao) {

            digitarMensagem(
                "Oi! 👋 Eu sou o Teko, seu amigo virtual! Como você está se sentindo hoje? 😊"
            );

        }

    }
);

