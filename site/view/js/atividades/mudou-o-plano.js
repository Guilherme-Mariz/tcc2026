document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    const LOADING_TIME = 3000;

    const phases = [
        {
            plan: "Brincar no parque",
            planIcon: "🛝",
            change: "Começou a chover forte",
            changeIcon: "🌧️",
            answer: "brincar-dentro",
            options: [
                { id: "brincar-dentro", icon: "🧩", text: "Escolher uma brincadeira dentro de casa e deixar o parque para outro dia" },
                { id: "ir-chuva", icon: "⛈️", text: "Ir sozinho ao parque mesmo com a chuva forte" },
                { id: "nao-contar", icon: "🤐", text: "Ficar parado sem contar a ninguém do que precisa" }
            ],
            success: "Muito bem! O parque pode ficar para outro dia e a diversão pode continuar em um lugar seguro."
        },
        {
            plan: "Usar o lápis azul favorito",
            planIcon: "✏️",
            change: "O lápis azul quebrou",
            changeIcon: "💥",
            answer: "outro-lapis",
            options: [
                { id: "pegar-sem-pedir", icon: "🫳", text: "Pegar o lápis de outra pessoa sem pedir" },
                { id: "outro-lapis", icon: "🖍️", text: "Usar outro lápis agora e pedir ajuda para apontar o azul depois" },
                { id: "parar-tarefa", icon: "🚫", text: "Guardar a atividade e não contar o que aconteceu" }
            ],
            success: "Isso mesmo! Usar outro lápis por enquanto ajuda a continuar a atividade."
        },
        {
            plan: "Voltar para casa de ônibus",
            planIcon: "🚌",
            change: "O ônibus está atrasado",
            changeIcon: "⏰",
            answer: "esperar-com-adulto",
            options: [
                { id: "procurar-sozinho", icon: "🚶", text: "Sair sozinho para procurar o ônibus" },
                { id: "esperar-com-adulto", icon: "🤝", text: "Ver o novo horário e esperar em segurança com o adulto" },
                { id: "gritar", icon: "📣", text: "Gritar com as pessoas que também estão esperando" }
            ],
            success: "Ótima escolha! Conferir a informação e esperar acompanhado deixa a mudança mais segura."
        },
        {
            plan: "Começar a aula com uma história",
            planIcon: "📖",
            change: "A professora colocou matemática primeiro",
            changeIcon: "🔢",
            answer: "seguir-nova-ordem",
            options: [
                { id: "seguir-nova-ordem", icon: "📋", text: "Olhar a nova ordem e começar pela atividade de matemática" },
                { id: "ignorar", icon: "🙈", text: "Ignorar a professora e abrir o livro de história" },
                { id: "ir-embora", icon: "🚪", text: "Guardar o material e sair da sala sem avisar" }
            ],
            success: "Muito bem! Ver a nova ordem ajuda a saber o que acontece agora e o que ficou para depois."
        },
        {
            plan: "Brincar com um amigo no recreio",
            planIcon: "⚽",
            change: "O amigo faltou à escola",
            changeIcon: "🏠",
            answer: "nova-escolha",
            options: [
                { id: "nova-escolha", icon: "🎲", text: "Escolher outra brincadeira ou convidar outra criança" },
                { id: "mandar-parar", icon: "✋", text: "Mandar todas as crianças pararem de brincar" },
                { id: "sumir", icon: "🫥", text: "Sair do recreio sem avisar nenhum adulto" }
            ],
            success: "Parabéns! Fazer uma nova escolha ajuda quando uma pessoa ou atividade não está disponível."
        }
    ];

    const screens = {
        intro: document.getElementById("mp-intro"),
        loading: document.getElementById("mp-loading"),
        game: document.getElementById("mp-game"),
        done: document.getElementById("mp-done")
    };

    const elements = {
        stage: document.getElementById("activity-stage"),
        start: document.getElementById("mp-start-btn"),
        round: document.getElementById("mp-round-indicator"),
        planIcon: document.getElementById("mp-plan-icon"),
        plan: document.getElementById("mp-plan"),
        changeIcon: document.getElementById("mp-change-icon"),
        change: document.getElementById("mp-change"),
        options: document.getElementById("mp-options"),
        feedback: document.getElementById("mp-feedback"),
        listen: document.getElementById("mp-listen-btn"),
        confirm: document.getElementById("mp-confirm-btn"),
        playAgain: document.getElementById("mp-play-again-btn")
    };

    const changeScreen = TekoActivityCore.createScreenTransition({
        screens,
        stage: elements.stage,
        duration: 220,
        activeScreens: ["game", "done"]
    });

    const levelTransition = TekoActivityCore.createLevelTransition({
        container: screens.game,
        hold: 1100
    });

    let currentScreen = "intro";
    let currentPhase = 0;
    let selectedOption = "";
    let shuffledOptions = [];
    let phaseCompleted = false;
    let loadingTimer = null;
    let activityToken = 0;

    function switchScreen(nextScreen, onEnter) {
        const previousScreen = currentScreen;
        currentScreen = nextScreen;
        changeScreen(previousScreen, nextScreen, onEnter);
    }

    function currentData() {
        return phases[currentPhase];
    }

    function clearFeedback() {
        elements.feedback.textContent = "";
        elements.feedback.className = "mp-feedback";
    }

    function createOption(option) {
        const button = document.createElement("button");
        const icon = document.createElement("span");
        const text = document.createElement("span");

        button.type = "button";
        button.className = "mp-option";
        button.dataset.option = option.id;
        button.disabled = phaseCompleted;
        button.setAttribute("aria-pressed", String(selectedOption === option.id));

        if (selectedOption === option.id) {
            button.classList.add("mp-option-selected");
        }

        if (phaseCompleted && option.id === currentData().answer) {
            button.classList.add("activity-answer-correct");
        }

        icon.className = "mp-option-icon";
        icon.setAttribute("aria-hidden", "true");
        icon.textContent = option.icon;

        text.className = "mp-option-text";
        text.textContent = option.text;

        button.append(icon, text);
        button.addEventListener("click", () => selectOption(option.id));
        return button;
    }

    function renderOptions() {
        const fragment = document.createDocumentFragment();

        shuffledOptions.forEach(option => {
            fragment.appendChild(createOption(option));
        });

        elements.options.replaceChildren(fragment);
    }

    function selectOption(optionId) {
        if (phaseCompleted) {
            return;
        }

        selectedOption = optionId;
        clearFeedback();
        renderOptions();
        elements.options.querySelector(`[data-option="${optionId}"]`)?.focus();
    }

    function setControlsDisabled(disabled) {
        elements.listen.disabled = disabled;
        elements.confirm.disabled = disabled;
    }

    function loadPhase() {
        const phase = currentData();

        selectedOption = "";
        shuffledOptions = TekoActivityCore.shuffle(phase.options);
        phaseCompleted = false;

        elements.round.textContent = `Fase ${currentPhase + 1} de ${phases.length}`;
        elements.planIcon.textContent = phase.planIcon;
        elements.plan.textContent = phase.plan;
        elements.changeIcon.textContent = phase.changeIcon;
        elements.change.textContent = phase.change;
        clearFeedback();
        setControlsDisabled(false);
        renderOptions();
    }

    function advancePhase() {
        if (currentPhase < phases.length - 1) {
            currentPhase += 1;
            loadPhase();
            elements.options.querySelector(".mp-option")?.focus();
            return;
        }

        switchScreen("done", () => {
            elements.playAgain.focus();
        });
    }

    function confirmOption() {
        const phase = currentData();

        if (!selectedOption) {
            elements.feedback.textContent = "Escolha uma opção antes de confirmar.";
            elements.feedback.className = "mp-feedback mp-feedback-warn";
            return;
        }

        if (selectedOption !== phase.answer) {
            const selectedButton = elements.options.querySelector(
                `[data-option="${selectedOption}"]`
            );

            selectedButton?.classList.remove("mp-option-wrong");

            if (selectedButton) {
                void selectedButton.offsetWidth;
                selectedButton.classList.add("mp-option-wrong");
            }

            elements.feedback.textContent = "Essa escolha não resolve o novo plano. Tente outra opção.";
            elements.feedback.className = "mp-feedback mp-feedback-retry";
            return;
        }

        phaseCompleted = true;
        setControlsDisabled(true);
        elements.feedback.textContent = phase.success;
        elements.feedback.className = "mp-feedback mp-feedback-correct";
        renderOptions();

        levelTransition.run(advancePhase);
    }

    function speakSituation() {
        if (!("speechSynthesis" in window)) {
            elements.feedback.textContent = "Seu navegador não conseguiu reproduzir o áudio.";
            elements.feedback.className = "mp-feedback mp-feedback-warn";
            return;
        }

        const phase = currentData();
        const speech = new SpeechSynthesisUtterance(
            `O plano era: ${phase.plan}. Mas aconteceu uma mudança: ${phase.change}. O que pode ajudar agora?`
        );

        window.speechSynthesis.cancel();
        speech.lang = "pt-BR";
        speech.rate = 0.9;
        window.speechSynthesis.speak(speech);
    }

    function startActivity() {
        const token = ++activityToken;
        window.clearTimeout(loadingTimer);
        levelTransition.cancel();
        switchScreen("loading");
        elements.stage.classList.add("activity-stage-revealing");

        loadingTimer = window.setTimeout(() => {
            if (token !== activityToken) {
                return;
            }

            currentPhase = 0;
            loadPhase();
            switchScreen("game", () => {
                elements.options.querySelector(".mp-option")?.focus();
            });
        }, LOADING_TIME);
    }

    function resetActivity() {
        activityToken += 1;
        window.clearTimeout(loadingTimer);
        levelTransition.cancel();
        window.speechSynthesis?.cancel();
        currentPhase = 0;
        selectedOption = "";
        shuffledOptions = [];
        phaseCompleted = false;
        elements.stage.classList.remove("activity-stage-revealing");

        switchScreen("intro", () => {
            elements.start.focus();
        });
    }

    elements.start.addEventListener("click", startActivity);
    elements.listen.addEventListener("click", speakSituation);
    elements.confirm.addEventListener("click", confirmOption);
    elements.playAgain.addEventListener("click", resetActivity);

    window.addEventListener("pagehide", () => {
        activityToken += 1;
        window.clearTimeout(loadingTimer);
        levelTransition.cancel();
        window.speechSynthesis?.cancel();
    });
});
