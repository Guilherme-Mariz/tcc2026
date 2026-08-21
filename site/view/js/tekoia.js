/* ── chat ── */

        const chatInput = document.getElementById('chat-input');
        const sendBtn = document.getElementById('send-btn');

        let childIdSelecionado = null;
        let typingTimer = null;

        function horaAtual() {
            return new Date().toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
            });
        }


        /* ── carregar crianças ── */

        async function carregarCriancas() {

            try {

                const resposta = await fetch(
                    '/children',
                    {
                        method: 'GET',
                        credentials: 'include'
                    }
                );

                const dados = await resposta.json();

                if (!resposta.ok || !dados.success) {
                    throw new Error('Não foi possível carregar as crianças.');
                }

                listaSessao.innerHTML = '';

                if (!dados.children || dados.children.length === 0) {

                    listaSessao.innerHTML = `
                <li class="chat-session-empty">
                    Nenhuma criança cadastrada
                </li>
            `;

                    return;
                }

                dados.children.forEach(child => {

                    const item = document.createElement('li');

                    item.textContent = child.firstName;
                    item.dataset.childId = child.id;
                    item.setAttribute('role', 'option');
                    item.tabIndex = 0;

                    item.addEventListener('click', () => {
                        selecionarCrianca(child);
                    });

                    listaSessao.appendChild(item);
                });

            } catch (error) {

                console.error(
                    'Erro ao carregar crianças:',
                    error
                );

                listaSessao.innerHTML = `
            <li class="chat-session-empty">
                Erro ao carregar crianças
            </li>
        `;
            }
        }


        /* ── selecionar criança ── */

        function selecionarCrianca(child) {

            childIdSelecionado = child.id;

            const textoSessao =
                document.querySelector('#btn-sessao span');

            if (textoSessao) {
                textoSessao.textContent = child.firstName;
            }

            listaSessao.hidden = true;

            btnSessao.setAttribute(
                'aria-expanded',
                'false'
            );

            console.log(
                'Criança selecionada:',
                child
            );

            digitarMensagem(
                `Oi, ${child.firstName}! 👋 Como você está se sentindo hoje? 😊`
            );
        }


        /* ── menu de sessão ── */

        const btnSessao =
            document.getElementById('btn-sessao');

        const listaSessao =
            document.getElementById('chat-session-list');

        btnSessao.addEventListener('click', (e) => {

            e.stopPropagation();

            const aberto = !listaSessao.hidden;

            listaSessao.hidden = aberto;

            btnSessao.setAttribute(
                'aria-expanded',
                String(!aberto)
            );
        });

        document.addEventListener('click', () => {

            listaSessao.hidden = true;

            btnSessao.setAttribute(
                'aria-expanded',
                'false'
            );
        });


        /* ── área da resposta ── */

        const chatDisplay =
            document.getElementById('chat-display-text');


        function digitarMensagem(texto) {

            clearTimeout(typingTimer);

            chatDisplay.classList.remove('is-loading');

            chatDisplay.textContent = '';

            let i = 0;

            (function passo() {

                if (i < texto.length) {

                    chatDisplay.textContent +=
                        texto.charAt(i);

                    i++;

                    typingTimer =
                        setTimeout(passo, 22);
                }

            })();
        }


        function mostrarCarregando() {

            clearTimeout(typingTimer);

            chatDisplay.innerHTML = `
        <span class="loading-dots">
            <span></span>
            <span></span>
            <span></span>
        </span>
    `;
        }


        /* ── microfone ── */

        const micBtn =
            document.getElementById('mic-btn');

        let gravando = false;

        micBtn.addEventListener('click', () => {

            gravando = !gravando;

            micBtn.classList.toggle(
                'recording',
                gravando
            );

            micBtn.setAttribute(
                'aria-pressed',
                String(gravando)
            );

            // Futuramente:
            // SpeechRecognition
        });


        /* ── enviar mensagem ── */

        async function enviarMensagem() {

            const texto =
                chatInput.value.trim();

            if (!texto) return;


            if (!childIdSelecionado) {

                digitarMensagem(
                    'Primeiro escolha uma criança na opção "Sessão". 😊'
                );

                return;
            }


            chatInput.value = '';

            sendBtn.disabled = true;

            mostrarCarregando();


            try {

                const resposta = await fetch(
                    '/api/ai/chat',
                    {
                        method: 'POST',

                        headers: {
                            'Content-Type': 'application/json'
                        },

                        credentials: 'include',

                        body: JSON.stringify({
                            childId: childIdSelecionado,
                            message: texto
                        })
                    }
                );


                const dados = await resposta.json();


                if (!resposta.ok) {

                    if (resposta.status === 403) {

                        digitarMensagem(
                            'Você não tem acesso a essa criança.'
                        );

                        return;
                    }

                    if (resposta.status === 401) {

                        digitarMensagem(
                            'Sua sessão expirou. Faça login novamente.'
                        );

                        return;
                    }

                    throw new Error(
                        dados.error ||
                        'Erro ao conversar com o TEKO.'
                    );
                }


                digitarMensagem(
                    dados.response ||
                    'Hmm, não entendi. Pode repetir? 😊'
                );


            } catch (error) {

                console.error(
                    'Erro ao enviar mensagem:',
                    error
                );

                digitarMensagem(
                    'Ops, tive um problema aqui. Tenta de novo! 😅'
                );

            } finally {

                sendBtn.disabled = false;

                chatInput.focus();
            }
        }


        sendBtn.addEventListener(
            'click',
            enviarMensagem
        );


        chatInput.addEventListener(
            'keydown',
            e => {

                if (
                    e.key === 'Enter' &&
                    !e.shiftKey
                ) {

                    e.preventDefault();

                    enviarMensagem();
                }
            }
        );

        /* ── init ── */
        carregarAvatar();
        carregarCriancas();
        digitarMensagem('Oi! 👋 Eu sou o Teko, seu amigo virtual! Como você está se sentindo hoje? 😊');
