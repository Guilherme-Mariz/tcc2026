document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    const MINIMUM_LOADING_TIME = 2000;
    const SCREEN_FADE_DURATION = 220;

    const phases = [
        {
            situation: "O quebra-cabeça está difícil e o Teko começou a ficar frustrado.",
            background: "/img/atv/oq-pode-me-ajudar/fase1.webp",
            backgroundAlt: "Um quebra-cabeça incompleto sobre uma mesa em um cantinho de brincar",
            teko: "/img/mascot/teko-frustrado.webp",
            tekoAlt: "Teko frustrado diante de uma tarefa difícil",
            options: [
                { id: "ask-hint", label: "Pedir uma pista", icon: "fa-hand", title: "Uma pista pode ajudar", consequence: "Alguém pode mostrar por onde começar, sem montar o quebra-cabeça no lugar do Teko." },
                { id: "small-break", label: "Fazer uma pequena pausa", icon: "fa-mug-hot", title: "Uma pausa pode dar descanso", consequence: "Teko pode descansar um pouco e decidir depois se quer tentar novamente." },
                { id: "try-edge", label: "Procurar primeiro as peças das bordas", icon: "fa-puzzle-piece", title: "Mudar a estratégia pode ajudar", consequence: "Começar pelas bordas pode deixar a tarefa mais organizada e fácil de entender." },
                { id: "slow-breath", label: "Respirar devagar algumas vezes", icon: "fa-wind", title: "Respirar é uma possibilidade", consequence: "Teko pode usar a respiração para fazer uma pausa antes de escolher o próximo passo." }
            ]
        },
        {
            situation: "A música da festa está muito alta e o barulho está incomodando o Teko.",
            background: "/img/atv/oq-pode-me-ajudar/fase2.webp",
            backgroundAlt: "Um salão de festa com balões, mesa e caixa de som",
            teko: "/img/mascot/teko-incomodado.webp",
            tekoAlt: "Teko cobrindo os lados da cabeça por causa do barulho",
            options: [
                { id: "ask-lower", label: "Pedir para abaixar o som", icon: "fa-volume-low", title: "Explicar o incômodo pode ajudar", consequence: "Outra pessoa pode entender que o som está desconfortável e diminuir o volume." },
                { id: "headphones", label: "Usar um protetor de ouvido", icon: "fa-headphones", title: "Proteger os ouvidos pode ajudar", consequence: "Um protetor adequado pode reduzir parte do barulho enquanto Teko permanece na festa." },
                { id: "quiet-place", label: "Ir para um lugar mais tranquilo", icon: "fa-tree", title: "Um lugar tranquilo pode ajudar", consequence: "Com um adulto avisado, Teko pode se afastar do som e voltar quando se sentir pronto." },
                { id: "tell-adult", label: "Contar a um adulto de confiança", icon: "fa-person-circle-check", title: "Pedir apoio é uma estratégia", consequence: "O adulto pode ajudar Teko a explicar o incômodo e encontrar uma opção segura." }
            ]
        },
        {
            situation: "Depois de fazer várias tarefas, o Teko está cansado e está difícil continuar.",
            background: "/img/atv/oq-pode-me-ajudar/fase3.webp",
            backgroundAlt: "Um cantinho de estudos com folhas, caderno, lápis e estojo",
            teko: "/img/mascot/teko-cansado.webp",
            tekoAlt: "Teko cansado depois de realizar tarefas",
            options: [
                { id: "stretch", label: "Fazer uma pausa para se alongar", icon: "fa-person-walking", title: "Movimentar o corpo pode ajudar", consequence: "Uma pausa curta para levantar e se alongar pode diminuir o cansaço de ficar na mesma posição." },
                { id: "small-parts", label: "Dividir a tarefa em partes menores", icon: "fa-list-check", title: "Uma parte de cada vez", consequence: "Olhar apenas para o próximo passo pode fazer a tarefa parecer mais organizada." },
                { id: "ask-help", label: "Pedir ajuda com a parte difícil", icon: "fa-circle-question", title: "Pedir ajuda é permitido", consequence: "Alguém pode explicar a parte difícil e deixar Teko continuar aquilo que consegue fazer." },
                { id: "water-rest", label: "Beber água e descansar um pouco", icon: "fa-glass-water", title: "Cuidar do corpo pode ajudar", consequence: "Teko pode verificar se precisa de água e de alguns minutos de descanso antes de continuar." }
            ]
        },
        {
            situation: "Começou a chover e o Teko ficou chateado porque queria brincar lá fora.",
            background: "/img/atv/oq-pode-me-ajudar/fase4.webp",
            backgroundAlt: "Uma varanda com vista para o jardim e o escorregador durante a chuva",
            teko: "/img/mascot/teko-decepcionado.webp",
            tekoAlt: "Teko olhando para baixo, chateado com a mudança de planos",
            options: [
                { id: "say-feeling", label: "Contar que ficou chateado", icon: "fa-comment-dots", title: "Falar sobre o sentimento pode ajudar", consequence: "Outra pessoa pode compreender a decepção do Teko e conversar com ele sobre a mudança." },
                { id: "indoor-play", label: "Escolher uma brincadeira dentro de casa", icon: "fa-house", title: "Um Plano B pode ser divertido", consequence: "A brincadeira será diferente da que Teko queria, mas pode trazer uma nova possibilidade para o momento." },
                { id: "new-day", label: "Combinar outro dia para brincar fora", icon: "fa-calendar-check", title: "Antecipar outra oportunidade", consequence: "Marcar outra possibilidade pode ajudar Teko a entender que o plano foi adiado, não perdido." },
                { id: "company", label: "Pedir companhia por alguns minutos", icon: "fa-people-group", title: "Companhia pode acolher", consequence: "Teko pode ficar perto de alguém enquanto aceita a mudança e escolhe o que quer fazer depois." }
            ]
        },
        {
            situation: "Está chegando a hora da apresentação e o Teko começou a ficar nervoso.",
            background: "/img/atv/oq-pode-me-ajudar/fase5.webp",
            backgroundAlt: "Uma sala de aula preparada para uma pequena apresentação",
            teko: "/img/mascot/teko-nervoso.webp",
            tekoAlt: "Teko nervoso antes de uma apresentação",
            options: [
                { id: "practice", label: "Ensaiar mais uma vez", icon: "fa-comments", title: "Ensaiar pode trazer segurança", consequence: "Teko pode praticar o começo da fala e lembrar qual será o primeiro passo da apresentação." },
                { id: "support-person", label: "Pedir para alguém ficar por perto", icon: "fa-user-group", title: "Ter apoio pode ajudar", consequence: "Uma pessoa de confiança pode permanecer próxima enquanto Teko começa a apresentação." },
                { id: "note-card", label: "Usar um cartão com lembretes", icon: "fa-note-sticky", title: "Lembretes podem organizar", consequence: "Palavras curtas no cartão podem ajudar Teko a encontrar o próximo assunto se esquecer alguma parte." },
                { id: "pause-breathe", label: "Pausar e respirar antes de começar", icon: "fa-lungs", title: "Uma pausa antes de começar", consequence: "Teko pode respirar no próprio ritmo e avisar quando estiver pronto para iniciar." }
            ]
        }
    ];

    const stage = document.getElementById("activity-stage");
    const screens = {
        intro: document.getElementById("opma-intro"),
        loading: document.getElementById("opma-loading"),
        game: document.getElementById("opma-game"),
        done: document.getElementById("opma-done")
    };
    const elements = {
        start: document.getElementById("opma-start-btn"),
        round: document.getElementById("opma-round-indicator"),
        situation: document.getElementById("opma-situation"),
        background: document.getElementById("opma-background"),
        teko: document.getElementById("opma-teko"),
        options: document.getElementById("opma-options"),
        feedback: document.getElementById("opma-feedback"),
        feedbackTitle: document.getElementById("opma-feedback-title"),
        feedbackText: document.getElementById("opma-feedback-text"),
        next: document.getElementById("opma-next-btn"),
        backpackTitle: document.getElementById("opma-backpack-title"),
        backpackInstruction: document.getElementById("opma-backpack-instruction"),
        looseItems: document.getElementById("opma-loose-items"),
        backpack: document.getElementById("opma-backpack"),
        packStatus: document.getElementById("opma-pack-status"),
        doneActions: document.getElementById("opma-done-actions"),
        playAgain: document.getElementById("opma-play-again-btn")
    };

    const changeScreen = TekoActivityCore.createScreenTransition({
        screens,
        stage,
        duration: SCREEN_FADE_DURATION,
        activeScreens: ["game", "done"]
    });
    const levelTransition = TekoActivityCore.createLevelTransition({
        container: screens.game,
        hold: 150,
        duration: 220
    });

    let currentScreen = "intro";
    let currentPhase = 0;
    let selectedId = null;
    let shuffledOptions = [];
    let kitChoices = [];
    let loadingToken = 0;
    let packedItems = 0;
    let activeDrag = null;
    let backpackTimer = null;
    let receiveTimer = null;

    function switchScreen(nextScreen, onEnter) {
        const previousScreen = currentScreen;
        currentScreen = nextScreen;
        changeScreen(previousScreen, nextScreen, onEnter);
    }

    function preloadImage(source) {
        return new Promise(resolve => {
            const image = new Image();
            image.onload = resolve;
            image.onerror = resolve;
            image.src = source;
        });
    }

    function createOption(option) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "opma-option";
        button.dataset.optionId = option.id;
        button.setAttribute("aria-pressed", String(option.id === selectedId));
        if (option.id === selectedId) button.classList.add("is-selected");

        const icon = document.createElement("span");
        icon.className = "opma-option-icon";
        icon.setAttribute("aria-hidden", "true");
        icon.innerHTML = `<i class="fa-solid ${option.icon}"></i>`;

        const label = document.createElement("span");
        label.textContent = option.label;

        const check = document.createElement("span");
        check.className = "opma-option-check";
        check.setAttribute("aria-hidden", "true");
        check.innerHTML = '<i class="fa-solid fa-check"></i>';

        button.append(icon, label, check);
        button.addEventListener("click", () => selectOption(option));
        return button;
    }

    function renderOptions() {
        const fragment = document.createDocumentFragment();
        shuffledOptions.forEach(option => fragment.appendChild(createOption(option)));
        elements.options.replaceChildren(fragment);
    }

    function selectOption(option) {
        selectedId = option.id;
        renderOptions();
        elements.feedbackTitle.textContent = option.title;
        elements.feedbackText.textContent = option.consequence;
        elements.feedback.hidden = false;
        elements.next.textContent = currentPhase === phases.length - 1 ? "Preparar mochila" : "Continuar";
        elements.next.insertAdjacentHTML("beforeend", ' <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>');
    }

    function renderPhase() {
        const phase = phases[currentPhase];
        selectedId = null;
        shuffledOptions = TekoActivityCore.shuffle(phase.options);

        elements.round.textContent = `Fase ${currentPhase + 1} de ${phases.length}`;
        elements.situation.textContent = phase.situation;
        elements.background.src = phase.background;
        elements.background.alt = phase.backgroundAlt;
        elements.teko.src = phase.teko;
        elements.teko.alt = phase.tekoAlt;
        elements.feedback.hidden = true;
        elements.feedbackTitle.textContent = "";
        elements.feedbackText.textContent = "";
        renderOptions();
    }

    function createLooseItem(choice, index) {
        const button = document.createElement("button");
        const icon = document.createElement("span");
        const label = document.createElement("span");
        const check = document.createElement("span");

        button.type = "button";
        button.className = "opma-option opma-loose-item";
        button.dataset.itemIndex = String(index);
        button.setAttribute("aria-label", `Arraste ${choice.label} para dentro da mochila.`);

        icon.className = "opma-option-icon";
        icon.setAttribute("aria-hidden", "true");
        icon.innerHTML = `<i class="fa-solid ${choice.icon}"></i>`;
        label.textContent = choice.label;
        check.className = "opma-option-check";
        check.setAttribute("aria-hidden", "true");

        button.append(icon, label, check);
        button.addEventListener("pointerdown", beginDrag);
        return button;
    }

    function renderBackpack() {
        const fragment = document.createDocumentFragment();

        window.clearTimeout(backpackTimer);
        window.clearTimeout(receiveTimer);
        activeDrag = null;
        packedItems = 0;

        kitChoices.forEach((choice, index) => {
            fragment.appendChild(createLooseItem(choice, index));
        });

        elements.looseItems.replaceChildren(fragment);
        elements.backpack.className = "opma-backpack is-open";
        elements.backpack.disabled = false;
        elements.backpack.setAttribute(
            "aria-label",
            `Mochila aberta. Arraste os ${kitChoices.length} itens para dentro dela.`
        );
        elements.backpackTitle.textContent = "Prepare sua Mochila de Ajuda";
        elements.backpackInstruction.textContent = "Arraste cada uma das ideias para dentro da mochila.";
        elements.packStatus.textContent = `0 de ${kitChoices.length} itens guardados`;
        elements.packStatus.className = "opma-pack-status";
        elements.doneActions.hidden = true;
    }

    function finishActivity() {
        renderBackpack();
        switchScreen("done", () => {
            elements.looseItems.querySelector(".opma-loose-item")?.focus();
        });
    }

    function pointIsInsideBackpack(x, y) {
        const rect = elements.backpack.getBoundingClientRect();
        return (
            x >= rect.left &&
            x <= rect.right &&
            y >= rect.top &&
            y <= rect.bottom
        );
    }

    function beginDrag(event) {
        const button = event.currentTarget;

        if (
            activeDrag ||
            button.disabled ||
            (event.button !== undefined && event.button !== 0)
        ) {
            return;
        }

        event.preventDefault();
        const rect = button.getBoundingClientRect();

        activeDrag = {
            button,
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            originRect: rect
        };

        button.classList.add("is-dragging");
        button.setPointerCapture?.(event.pointerId);
        elements.backpack.classList.add("is-drag-active");
        elements.backpack.classList.toggle(
            "is-drop-hover",
            pointIsInsideBackpack(event.clientX, event.clientY)
        );
        elements.packStatus.textContent = "Leve o item até a abertura da mochila.";
    }

    function moveDrag(event) {
        if (!activeDrag || event.pointerId !== activeDrag.pointerId) return;

        event.preventDefault();
        const deltaX = event.clientX - activeDrag.startX;
        const deltaY = event.clientY - activeDrag.startY;

        activeDrag.button.style.transform =
            `translate3d(${deltaX}px, ${deltaY}px, 0)`;

        elements.backpack.classList.toggle(
            "is-drop-hover",
            pointIsInsideBackpack(event.clientX, event.clientY)
        );
    }

    function returnItem(button) {
        button.classList.remove("is-dragging");
        button.classList.add("is-returning");
        button.style.transform = "translate3d(0, 0, 0)";
        elements.packStatus.textContent =
            `${packedItems} de ${kitChoices.length} itens guardados. Solte o item dentro da mochila.`;

        window.setTimeout(() => {
            button.classList.remove("is-returning");
            button.style.removeProperty("transform");
        }, 290);
    }

    function packItem(drag) {
        const { button, originRect } = drag;
        const backpackRect = elements.backpack.getBoundingClientRect();
        const targetX = (
            backpackRect.left + backpackRect.width / 2
        ) - (
            originRect.left + originRect.width / 2
        );
        const targetY = (
            backpackRect.top + Math.min(72, backpackRect.height * 0.3)
        ) - (
            originRect.top + originRect.height / 2
        );

        button.disabled = true;
        button.classList.remove("is-dragging");
        button.classList.add("is-packing");
        button.style.transform =
            `translate3d(${targetX}px, ${targetY}px, 0) scale(0.18)`;

        window.setTimeout(() => {
            button.hidden = true;
            button.classList.remove("is-packing");
            packedItems += 1;
            elements.backpack.classList.add("is-receiving");
            window.clearTimeout(receiveTimer);
            receiveTimer = window.setTimeout(() => {
                elements.backpack.classList.remove("is-receiving");
            }, 370);

            if (packedItems < kitChoices.length) {
                elements.packStatus.textContent =
                    `${packedItems} de ${kitChoices.length} itens guardados`;
                elements.looseItems.querySelector(
                    ".opma-loose-item:not([hidden])"
                )?.focus();
                return;
            }

            elements.backpack.classList.add("is-ready");
            elements.backpackTitle.textContent = "Tudo guardado!";
            elements.backpackInstruction.textContent =
                "Agora, feche a mochila para terminar.";
            elements.packStatus.textContent =
                `${packedItems} de ${kitChoices.length} itens guardados`;
            elements.packStatus.classList.add("is-ready");
            elements.backpack.setAttribute(
                "aria-label",
                "Todos os itens foram guardados. Clique para fechar a mochila."
            );
            elements.backpack.focus();
        }, 440);
    }

    function endDrag(event) {
        if (!activeDrag || event.pointerId !== activeDrag.pointerId) return;

        event.preventDefault();
        const drag = activeDrag;
        const droppedInside = pointIsInsideBackpack(
            event.clientX,
            event.clientY
        );

        drag.button.releasePointerCapture?.(event.pointerId);
        elements.backpack.classList.remove(
            "is-drag-active",
            "is-drop-hover"
        );
        activeDrag = null;

        if (droppedInside) {
            packItem(drag);
            return;
        }

        returnItem(drag.button);
    }

    function cancelDrag(event) {
        if (!activeDrag || event.pointerId !== activeDrag.pointerId) return;

        const drag = activeDrag;
        activeDrag = null;
        elements.backpack.classList.remove(
            "is-drag-active",
            "is-drop-hover"
        );
        returnItem(drag.button);
    }

    function closeBackpack() {
        if (packedItems < kitChoices.length) {
            const missing = kitChoices.length - packedItems;
            elements.backpack.classList.remove("is-not-ready");
            void elements.backpack.offsetWidth;
            elements.backpack.classList.add("is-not-ready");
            elements.packStatus.textContent = missing === 1
                ? "Ainda falta guardar 1 item."
                : `Ainda faltam ${missing} itens para guardar.`;
            return;
        }

        if (
            elements.backpack.classList.contains("is-closing") ||
            elements.backpack.classList.contains("is-closed")
        ) {
            return;
        }

        elements.backpack.classList.remove("is-open", "is-ready");
        elements.backpack.classList.add("is-closing");
        elements.backpack.disabled = true;
        elements.backpack.setAttribute("aria-label", "Fechando a mochila.");
        elements.packStatus.textContent = "Fechando a mochila...";

        backpackTimer = window.setTimeout(() => {
            elements.backpack.classList.remove("is-closing");
            elements.backpack.classList.add("is-closed");
            elements.backpackTitle.textContent = "Sua Mochila de Ajuda está pronta!";
            elements.backpackInstruction.textContent =
                "Você guardou cinco ideias que pode experimentar quando precisar.";
            elements.packStatus.textContent = "Mochila fechada.";
            elements.packStatus.className = "opma-pack-status is-ready";
            elements.doneActions.hidden = false;
            elements.playAgain.focus();
        }, 700);
    }

    function advancePhase() {
        if (!selectedId) return;
        const selected = phases[currentPhase].options.find(option => option.id === selectedId);
        kitChoices[currentPhase] = selected;

        levelTransition.run(() => {
            currentPhase += 1;
            if (currentPhase < phases.length) {
                renderPhase();
                return;
            }
            finishActivity();
        }, () => elements.options.querySelector(".opma-option")?.focus());
    }

    const activityEntry = TekoActivityCore.createEntryGate({
        stage,
        game: screens.game,
        instruction: "Leia a situação e escolha uma ideia que pode ajudar. Todas as opções são possibilidades.",
        onStart: () => elements.options.querySelector(".opma-option")?.focus()
    });

    async function startActivity() {
        const token = ++loadingToken;
        window.clearTimeout(backpackTimer);
        window.clearTimeout(receiveTimer);
        activeDrag = null;
        activityEntry.cancel();
        levelTransition.cancel();
        stage.classList.remove("activity-stage-revealing");
        switchScreen("loading", () => stage.classList.add("activity-stage-revealing"));

        const imageSources = phases.flatMap(phase => [phase.background, phase.teko]);
        await Promise.all([
            new Promise(resolve => window.setTimeout(resolve, MINIMUM_LOADING_TIME)),
            ...imageSources.map(preloadImage)
        ]);
        if (token !== loadingToken) return;

        currentPhase = 0;
        selectedId = null;
        kitChoices = [];
        renderPhase();
        switchScreen("game", () => activityEntry.show());
    }

    elements.start.addEventListener("click", startActivity);
    elements.next.addEventListener("click", advancePhase);
    elements.backpack.addEventListener("click", closeBackpack);
    elements.playAgain.addEventListener("click", startActivity);
    window.addEventListener("pointermove", moveDrag, { passive: false });
    window.addEventListener("pointerup", endDrag, { passive: false });
    window.addEventListener("pointercancel", cancelDrag);
    window.addEventListener("pagehide", () => {
        loadingToken += 1;
        window.clearTimeout(backpackTimer);
        window.clearTimeout(receiveTimer);
        levelTransition.cancel();
        activityEntry.cancel();
    });

    Object.values(screens).forEach(screen => { screen.hidden = true; });
    startActivity();
});
