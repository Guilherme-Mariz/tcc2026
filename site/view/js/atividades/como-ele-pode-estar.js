document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    const MINIMUM_LOADING_TIME = 2000;

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
            story: "Depois de tentar algumas vezes, Teko conseguiu terminar um desenho difícil. A professora reconheceu seu esforço e ele abriu um grande sorriso.",
            question: "Como ele pode estar?",
            answers: ["feliz"],
            options: ["feliz", "triste", "raiva", "confuso"],
            feedback: {
                feliz: "Faz sentido! Conseguir algo difícil e ter seu esforço reconhecido pode deixar Teko feliz."
            }
        },
        {
            story: "Durante o recreio, o brinquedo favorito de Teko quebrou. Ele queria continuar brincando, mas precisou guardar as peças.",
            question: "Como ele pode estar?",
            answers: ["triste", "raiva"],
            options: ["triste", "feliz", "medo", "raiva"],
            feedback: {
                triste: "Faz sentido! Não poder continuar uma brincadeira importante pode deixar Teko triste.",
                raiva: "Também faz sentido! Algo querido quebrar de repente pode deixar Teko com raiva."
            }
        },
        {
            story: "Teko separou seus lápis para desenhar. Um colega pegou vários sem pedir e continuou usando mesmo depois de Teko pedir que devolvesse.",
            question: "Como ele pode estar?",
            answers: ["raiva", "triste"],
            options: ["raiva", "confuso", "feliz", "triste"],
            feedback: {
                raiva: "Faz sentido! Não respeitarem seu pedido pode deixar Teko com raiva.",
                triste: "Também é possível! Teko pode ficar triste por não respeitarem seu material e seu pedido."
            }
        },
        {
            story: "Durante a noite, um trovão muito alto acordou Teko de repente. Ele não sabia se outro barulho forte aconteceria.",
            question: "Como ele pode estar?",
            answers: ["medo"],
            options: ["medo", "feliz", "confuso", "raiva"],
            feedback: {
                medo: "Faz sentido! Um barulho forte e inesperado pode fazer Teko sentir medo."
            }
        },
        {
            story: "Ao chegar à escola, Teko descobriu que a aula seria em outra sala. Ninguém explicou onde sua turma estava e ele ficou procurando o caminho.",
            question: "Como ele pode estar?",
            answers: ["confuso", "medo"],
            options: ["confuso", "triste", "medo", "feliz"],
            feedback: {
                confuso: "Faz sentido! Uma mudança sem explicação pode deixar Teko confuso sobre o que fazer.",
                medo: "Também é possível! Não encontrar a turma depois de uma mudança pode fazer Teko sentir medo."
            }
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
        elements.feedback.textContent = "Escolha uma emoção possível. Algumas histórias aceitam mais de uma resposta.";
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

        if (!phase.answers.includes(selectedEmotion)) {
            card.classList.add("is-wrong");
            elements.feedback.textContent =
                "Essa emoção pode aparecer em outras situações. Leia as pistas da história e tente novamente.";
            elements.feedback.className = "ce-feedback ce-feedback-retry";
            return;
        }

        phaseCompleted = true;
        card.classList.add("is-correct", "activity-answer-correct");
        disableOptions();
        elements.feedback.textContent = phase.feedback[selectedEmotion];
        elements.feedback.className = "ce-feedback ce-feedback-correct";

        levelTransition.run(advancePhase);
    }

    const activityEntry = TekoActivityCore.createEntryGate({
        stage: elements.stage,
        game: screens.game,
        instruction: "Leia a história e escolha uma emoção que o Teko pode estar sentindo.",
        onStart: () => {
            elements.options.querySelector(".ce-emotion-card")?.focus();
        }
    });

    async function startActivity() {
        activityEntry.cancel();
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
        switchScreen("game", () => activityEntry.show());
    }

    function resetActivity() {
        activityToken += 1;
        currentPhase = 0;
        phaseCompleted = false;
        levelTransition.cancel();
        elements.options.replaceChildren();
        elements.stage.classList.remove("activity-stage-revealing");

        startActivity();
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
    startActivity();
});
