document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    const LOADING_TIME = 2000;

    const phases = [
        {
            context: "Teko vai lavar as mãos antes do lanche.",
            steps: [
                { id: "molhar", icon: "💧", text: "Molhar as mãos" },
                { id: "ensaboar", icon: "🫧", text: "Passar sabão e esfregar" },
                { id: "enxaguar", icon: "👐", text: "Enxaguar e secar" }
            ],
            success: "Muito bem! As mãos ficaram limpas para o lanche."
        },
        {
            context: "Teko vai preparar a mochila para a escola.",
            steps: [
                { id: "separar", icon: "📚", text: "Separar os materiais" },
                { id: "guardar", icon: "🎒", text: "Guardar tudo na mochila" },
                { id: "fechar", icon: "✅", text: "Fechar e conferir a mochila" }
            ],
            success: "Isso mesmo! A mochila está pronta para a escola."
        },
        {
            context: "Teko vai escovar os dentes depois de comer.",
            steps: [
                { id: "pasta", icon: "🪥", text: "Colocar pasta na escova" },
                { id: "escovar", icon: "😁", text: "Escovar todos os dentes" },
                { id: "finalizar", icon: "🚰", text: "Enxaguar e guardar a escova" }
            ],
            success: "Ótimo! Teko completou a escovação dos dentes."
        },
        {
            context: "A brincadeira terminou e Teko vai organizar o espaço.",
            steps: [
                { id: "juntar", icon: "🧸", text: "Juntar os brinquedos" },
                { id: "organizar", icon: "🧺", text: "Guardar cada um no lugar" },
                { id: "conferir", icon: "✨", text: "Conferir se ficou organizado" }
            ],
            success: "Muito bem! O espaço ficou pronto para a próxima atividade."
        },
        {
            context: "Teko vai preparar um lanche simples.",
            steps: [
                { id: "prato", icon: "🍽️", text: "Colocar o prato na mesa" },
                { id: "lanche", icon: "🥪", text: "Colocar o lanche no prato" },
                { id: "comer", icon: "😋", text: "Sentar e comer com calma" }
            ],
            success: "Parabéns! Você organizou todas as ações do lanche."
        }
    ];

    const screens = {
        intro: document.getElementById("ovd-intro"),
        loading: document.getElementById("ovd-loading"),
        game: document.getElementById("ovd-game"),
        done: document.getElementById("ovd-done")
    };

    const elements = {
        stage: document.getElementById("activity-stage"),
        start: document.getElementById("ovd-start-btn"),
        round: document.getElementById("ovd-round-indicator"),
        context: document.getElementById("ovd-context"),
        sequence: document.getElementById("ovd-sequence"),
        options: document.getElementById("ovd-options"),
        feedback: document.getElementById("ovd-feedback"),
        clear: document.getElementById("ovd-clear-btn"),
        listen: document.getElementById("ovd-listen-btn"),
        confirm: document.getElementById("ovd-confirm-btn"),
        playAgain: document.getElementById("ovd-play-again-btn")
    };

    const changeScreen = TekoActivityCore.createScreenTransition({
        screens,
        stage: elements.stage,
        duration: 220,
        activeScreens: ["game", "done"]
    });

    const levelTransition = TekoActivityCore.createLevelTransition({
        container: screens.game,
        hold: 1050
    });

    let currentScreen = "intro";
    let currentPhase = 0;
    let selectedSteps = [];
    let shuffledSteps = [];
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
        elements.feedback.className = "ovd-feedback";
        elements.sequence.classList.remove("ovd-sequence-wrong");
    }

    function setControlsDisabled(disabled) {
        elements.clear.disabled = disabled;
        elements.listen.disabled = disabled;
        elements.confirm.disabled = disabled;
    }

    function createStepContent(step) {
        const icon = document.createElement("span");
        const text = document.createElement("span");

        icon.className = "ovd-step-icon";
        icon.setAttribute("aria-hidden", "true");
        icon.textContent = step.icon;

        text.className = "ovd-step-text";
        text.textContent = step.text;

        return [icon, text];
    }

    function removeStep(index) {
        if (phaseCompleted) {
            return;
        }

        selectedSteps.splice(index, 1);
        clearFeedback();
        renderPhaseState();
        elements.options.querySelector(".ovd-option")?.focus();
    }

    function createSequenceItem(index) {
        const item = document.createElement("li");
        const number = document.createElement("span");

        item.className = "ovd-sequence-item";
        number.className = "ovd-sequence-number";
        number.textContent = String(index + 1);
        number.setAttribute("aria-hidden", "true");
        item.appendChild(number);

        const stepId = selectedSteps[index];

        if (!stepId) {
            const placeholder = document.createElement("span");

            placeholder.className = "ovd-sequence-placeholder";
            placeholder.textContent = index === 0
                ? "Primeiro"
                : index === 1
                    ? "Depois"
                    : "Por último";

            item.appendChild(placeholder);
            return item;
        }

        const step = currentData().steps.find(itemData => itemData.id === stepId);
        const button = document.createElement("button");

        button.type = "button";
        button.className = "ovd-selected-step";
        button.disabled = phaseCompleted;
        button.setAttribute("aria-label", `${step.text}. Toque para remover da sequência.`);
        button.append(...createStepContent(step));
        button.addEventListener("click", () => removeStep(index));

        item.classList.add("ovd-sequence-filled");
        item.appendChild(button);
        return item;
    }

    function renderSequence() {
        const fragment = document.createDocumentFragment();

        for (let index = 0; index < 3; index += 1) {
            fragment.appendChild(createSequenceItem(index));
        }

        elements.sequence.replaceChildren(fragment);
    }

    function chooseStep(stepId) {
        if (phaseCompleted || selectedSteps.length >= 3) {
            return;
        }

        selectedSteps.push(stepId);
        clearFeedback();
        renderPhaseState();

        const nextOption = elements.options.querySelector(".ovd-option");
        (nextOption || elements.confirm).focus();
    }

    function createOption(step) {
        const button = document.createElement("button");

        button.type = "button";
        button.className = "ovd-option";
        button.disabled = phaseCompleted;
        button.setAttribute("aria-label", `Adicionar: ${step.text}`);
        button.append(...createStepContent(step));
        button.addEventListener("click", () => chooseStep(step.id));

        return button;
    }

    function renderOptions() {
        const fragment = document.createDocumentFragment();

        shuffledSteps.forEach(step => {
            if (!selectedSteps.includes(step.id)) {
                fragment.appendChild(createOption(step));
            }
        });

        elements.options.replaceChildren(fragment);

        if (elements.options.childElementCount === 0) {
            const message = document.createElement("p");

            message.className = "ovd-options-empty";
            message.textContent = "As três ações já estão na sua sequência.";
            elements.options.appendChild(message);
        }
    }

    function renderPhaseState() {
        renderSequence();
        renderOptions();
    }

    function loadPhase() {
        const phase = currentData();

        selectedSteps = [];
        shuffledSteps = TekoActivityCore.shuffle(phase.steps);
        phaseCompleted = false;

        elements.round.textContent = `Fase ${currentPhase + 1} de ${phases.length}`;
        elements.context.textContent = phase.context;
        elements.sequence.className = "ovd-sequence";
        clearFeedback();
        setControlsDisabled(false);
        renderPhaseState();
    }

    function advancePhase() {
        if (currentPhase < phases.length - 1) {
            currentPhase += 1;
            loadPhase();
            elements.options.querySelector(".ovd-option")?.focus();
            return;
        }

        switchScreen("done", () => {
            elements.playAgain.focus();
        });
    }

    function confirmSequence() {
        const phase = currentData();
        const correctOrder = phase.steps.map(step => step.id);

        if (selectedSteps.length < correctOrder.length) {
            elements.feedback.textContent = "Escolha as três ações antes de confirmar.";
            elements.feedback.className = "ovd-feedback ovd-feedback-warn";
            return;
        }

        const isCorrect = selectedSteps.every(
            (stepId, index) => stepId === correctOrder[index]
        );

        if (!isCorrect) {
            elements.sequence.classList.remove("ovd-sequence-wrong");
            void elements.sequence.offsetWidth;
            elements.sequence.classList.add("ovd-sequence-wrong");
            elements.feedback.textContent = "Quase! Observe o que precisa acontecer primeiro e tente outra ordem.";
            elements.feedback.className = "ovd-feedback ovd-feedback-retry";
            return;
        }

        phaseCompleted = true;
        setControlsDisabled(true);
        elements.sequence.classList.add("activity-answer-correct");
        elements.sequence.querySelectorAll(".ovd-selected-step").forEach(button => {
            button.disabled = true;
        });
        elements.feedback.textContent = phase.success;
        elements.feedback.className = "ovd-feedback ovd-feedback-correct";

        levelTransition.run(advancePhase);
    }

    function clearSequence() {
        if (phaseCompleted) {
            return;
        }

        selectedSteps = [];
        clearFeedback();
        renderPhaseState();
        elements.options.querySelector(".ovd-option")?.focus();
    }

    function speakInstructions() {
        if (!("speechSynthesis" in window)) {
            elements.feedback.textContent = "Seu navegador não conseguiu reproduzir o áudio.";
            elements.feedback.className = "ovd-feedback ovd-feedback-warn";
            return;
        }

        window.speechSynthesis.cancel();

        const speech = new SpeechSynthesisUtterance(
            `${currentData().context} Toque nas ações na ordem em que elas acontecem.`
        );

        speech.lang = "pt-BR";
        speech.rate = 0.9;
        window.speechSynthesis.speak(speech);
    }

    const activityEntry = TekoActivityCore.createEntryGate({
        stage: elements.stage,
        game: screens.game,
        instruction: "Escolha as ações na ordem em que acontecem. Depois, confirme a sequência.",
        onStart: () => {
            elements.options.querySelector(".ovd-option")?.focus();
        }
    });

    function startActivity() {
        activityEntry.cancel();
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
            switchScreen("game", () => activityEntry.show());
        }, LOADING_TIME);
    }

    function resetActivity() {
        activityToken += 1;
        window.clearTimeout(loadingTimer);
        levelTransition.cancel();
        window.speechSynthesis?.cancel();
        currentPhase = 0;
        selectedSteps = [];
        shuffledSteps = [];
        phaseCompleted = false;
        elements.stage.classList.remove("activity-stage-revealing");

        startActivity();
    }

    elements.start.addEventListener("click", startActivity);
    elements.clear.addEventListener("click", clearSequence);
    elements.listen.addEventListener("click", speakInstructions);
    elements.confirm.addEventListener("click", confirmSequence);
    elements.playAgain.addEventListener("click", resetActivity);

    window.addEventListener("pagehide", () => {
        activityToken += 1;
        window.clearTimeout(loadingTimer);
        levelTransition.cancel();
        window.speechSynthesis?.cancel();
    });
    startActivity();
});
