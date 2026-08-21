document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    const MINIMUM_LOADING_TIME = 3000;

    const emotions = [
        {
            id: "feliz",
            name: "Feliz",
            image: "/img/mascot/teko-comprimento.webp"
        },
        {
            id: "triste",
            name: "Triste",
            image: "/img/mascot/teko-triste.webp"
        },
        {
            id: "raiva",
            name: "Com raiva",
            image: "/img/mascot/teko-raiva.webp"
        },
        {
            id: "medo",
            name: "Com medo",
            image: "/img/mascot/teko-medo.webp"
        },
        {
            id: "confuso",
            name: "Confuso",
            image: "/img/mascot/teko-confuso.webp"
        }
    ];

    const phases = [
        {
            story: "Teko terminou uma atividade da escola sozinho e recebeu um elogio da professora.",
            question: "Como ele pode estar?",
            answer: "feliz",
            options: ["feliz", "triste", "raiva", "confuso"],
            success: "Muito bem! Receber um elogio pode deixar o Teko feliz."
        },
        {
            story: "Na hora de brincar, o brinquedo favorito do Teko quebrou e não dava mais para usar.",
            question: "Como ele pode estar?",
            answer: "triste",
            options: ["triste", "feliz", "medo", "raiva"],
            success: "Isso mesmo! Perder um brinquedo querido pode deixar o Teko triste."
        },
        {
            story: "Teko organizou seus lápis, mas um colega pegou vários sem pedir e não quis devolver.",
            question: "Como ele pode estar?",
            answer: "raiva",
            options: ["raiva", "confuso", "feliz", "triste"],
            success: "Muito bem! Essa situação pode fazer o Teko sentir raiva."
        },
        {
            story: "À noite, começou uma tempestade e um trovão bem alto acordou o Teko.",
            question: "Como ele pode estar?",
            answer: "medo",
            options: ["medo", "feliz", "confuso", "raiva"],
            success: "Isso mesmo! Um barulho forte e inesperado pode causar medo."
        },
        {
            story: "A professora mudou o horário da aula, mas Teko não entendeu para qual sala deveria ir.",
            question: "Como ele pode estar?",
            answer: "confuso",
            options: ["confuso", "triste", "medo", "feliz"],
            success: "Muito bem! Não entender uma mudança pode deixar o Teko confuso."
        }
    ];

    const elements = {
        stage: document.getElementById("activity-stage"),
        start: document.getElementById("ce-start-btn"),
        round: document.getElementById("ce-round-indicator"),
        story: document.getElementById("ce-story"),
        question: document.getElementById("ce-question"),
        options: document.getElementById("ce-options"),
        feedback: document.getElementById("ce-feedback"),
        playAgain: document.getElementById("ce-play-again-btn")
    };

    const screens = {
        intro: document.getElementById("ce-intro"),
        loading: document.getElementById("ce-loading"),
        game: document.getElementById("ce-game"),
        done: document.getElementById("ce-done")
    };

    const emotionById = new Map(emotions.map(emotion => [emotion.id, emotion]));

    const changeScreen = TekoActivityCore.createScreenTransition({
        screens,
        stage: elements.stage,
        duration: 220,
        activeScreens: ["game", "done"]
    });

    const levelTransition = TekoActivityCore.createLevelTransition({
        container: screens.game
    });

    let currentScreen = "intro";
    let currentPhase = 0;
    let phaseCompleted = false;
    let activityToken = 0;

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

    function createEmotionCard(emotion) {
        const button = document.createElement("button");
        const imageWrap = document.createElement("span");
        const image = document.createElement("img");
        const name = document.createElement("span");

        button.type = "button";
        button.className = "ce-emotion-card";
        button.dataset.emotion = emotion.id;
        button.setAttribute("aria-label", emotion.name);

        imageWrap.className = "ce-emotion-image-wrap";
        image.className = "ce-emotion-image";
        image.src = emotion.image;
        image.alt = `Teko ${emotion.name.toLowerCase()}`;
        name.className = "ce-emotion-name";
        name.textContent = emotion.name;

        imageWrap.appendChild(image);
        button.append(imageWrap, name);

        return button;
    }

    function renderPhase() {
        const phase = phases[currentPhase];
        const shuffledOptions = TekoActivityCore.shuffle(phase.options);
        const fragment = document.createDocumentFragment();

        phaseCompleted = false;
        elements.round.textContent = `Fase ${currentPhase + 1} de ${phases.length}`;
        elements.story.textContent = phase.story;
        elements.question.textContent = phase.question;
        elements.feedback.textContent = "Escolha a emoção que combina com a história.";
        elements.feedback.className = "ce-feedback";
        elements.options.replaceChildren();

        shuffledOptions.forEach(id => {
            fragment.appendChild(createEmotionCard(emotionById.get(id)));
        });

        elements.options.appendChild(fragment);
    }

    function disableOptions() {
        elements.options.querySelectorAll(".ce-emotion-card").forEach(card => {
            card.disabled = true;
        });
    }

    function advancePhase() {
        if (currentPhase < phases.length - 1) {
            currentPhase += 1;
            renderPhase();
            elements.options.querySelector(".ce-emotion-card")?.focus();
            return;
        }

        switchScreen("done", () => {
            elements.playAgain.focus();
        });
    }

    function selectEmotion(card) {
        if (phaseCompleted) {
            return;
        }

        const phase = phases[currentPhase];
        const selectedEmotion = card.dataset.emotion;

        elements.options.querySelectorAll(".ce-emotion-card").forEach(option => {
            option.classList.remove("is-wrong");
        });

        if (selectedEmotion !== phase.answer) {
            card.classList.add("is-wrong");
            elements.feedback.textContent = "Quase! Pense no que aconteceu e tente outra vez.";
            elements.feedback.className = "ce-feedback ce-feedback-retry";
            return;
        }

        phaseCompleted = true;
        card.classList.add("is-correct", "activity-answer-correct");
        disableOptions();
        elements.feedback.textContent = phase.success;
        elements.feedback.className = "ce-feedback ce-feedback-correct";

        levelTransition.run(advancePhase);
    }

    async function startActivity() {
        const token = ++activityToken;
        currentPhase = 0;
        switchScreen("loading");
        elements.stage.classList.add("activity-stage-revealing");

        const minimumDelay = new Promise(resolve => {
            window.setTimeout(resolve, MINIMUM_LOADING_TIME);
        });

        await Promise.all([
            minimumDelay,
            Promise.all(emotions.map(emotion => preloadImage(emotion.image)))
        ]);

        if (token !== activityToken) {
            return;
        }

        renderPhase();
        switchScreen("game", () => {
            elements.options.querySelector(".ce-emotion-card")?.focus();
        });
    }

    function resetActivity() {
        activityToken += 1;
        currentPhase = 0;
        phaseCompleted = false;
        levelTransition.cancel();
        elements.options.replaceChildren();
        elements.stage.classList.remove("activity-stage-revealing");

        switchScreen("intro", () => {
            elements.start.focus();
        });
    }

    elements.options.addEventListener("click", event => {
        const card = event.target.closest(".ce-emotion-card");

        if (card) {
            selectEmotion(card);
        }
    });

    elements.start.addEventListener("click", startActivity);
    elements.playAgain.addEventListener("click", resetActivity);

    window.addEventListener("pagehide", () => {
        activityToken += 1;
        levelTransition.cancel();
    });
});
