document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    const GRID_SIZE = 3;
    const PIECE_COUNT = GRID_SIZE * GRID_SIZE;
    const MINIMUM_LOADING_TIME = 2000;
    const PREVIEW_TIME = 2600;

    const phases = [
        {
            emotion: "felicidade",
            image: "/img/atv/quebra-cabeca-emocoes/fase-feliz.webp",
            causes: [
                {
                    text: "Conseguiu fazer algo difícil e recebeu um elogio.",
                    correct: true
                },
                {
                    text: "Perdeu um objeto de que gostava muito.",
                    correct: false
                },
                {
                    text: "Ouviu um barulho muito alto e inesperado.",
                    correct: false
                }
            ]
        },
        {
            emotion: "tristeza",
            image: "/img/atv/quebra-cabeca-emocoes/fase-triste.webp",
            causes: [
                {
                    text: "Seu brinquedo favorito quebrou durante a brincadeira.",
                    correct: true
                },
                {
                    text: "Foi convidado para uma brincadeira de que gosta.",
                    correct: false
                },
                {
                    text: "Não entendeu para qual sala deveria ir.",
                    correct: false
                }
            ]
        },
        {
            emotion: "raiva",
            image: "/img/atv/quebra-cabeca-emocoes/fase-raiva.webp",
            causes: [
                {
                    text: "Alguém pegou seu material sem pedir e não quis devolver.",
                    correct: true
                },
                {
                    text: "Terminou uma tarefa e recebeu parabéns.",
                    correct: false
                },
                {
                    text: "Encontrou um amigo que não via há muito tempo.",
                    correct: false
                }
            ]
        },
        {
            emotion: "medo",
            image: "/img/atv/quebra-cabeca-emocoes/fase-medo.webp",
            causes: [
                {
                    text: "Um trovão muito forte o acordou de repente.",
                    correct: true
                },
                {
                    text: "Ganhou um presente que estava esperando.",
                    correct: false
                },
                {
                    text: "Escolheu sua brincadeira preferida para o recreio.",
                    correct: false
                }
            ]
        },
        {
            emotion: "confusão",
            image: "/img/atv/quebra-cabeca-emocoes/fase-confuso.webp",
            causes: [
                {
                    text: "A rotina mudou e ninguém explicou o que aconteceria.",
                    correct: true
                },
                {
                    text: "Comeu seu lanche favorito com os amigos.",
                    correct: false
                },
                {
                    text: "Conseguiu descansar em um lugar tranquilo.",
                    correct: false
                }
            ]
        }
    ];

    const elements = {
        stage: document.getElementById("activity-stage"),
        start: document.getElementById("qe-start-btn"),
        board: document.getElementById("qe-board"),
        round: document.getElementById("qe-round-indicator"),
        counter: document.getElementById("qe-correct-counter"),
        selectionStatus: document.getElementById("qe-selection-status"),
        preview: document.getElementById("qe-preview"),
        previewImage: document.getElementById("qe-preview-image"),
        previewButton: document.getElementById("qe-preview-btn"),
        controls: document.querySelector(".qe-controls"),
        causePanel: document.getElementById("qe-cause-panel"),
        causeQuestion: document.getElementById("qe-cause-question"),
        causeOptions: document.getElementById("qe-cause-options"),
        causeFeedback: document.getElementById("qe-cause-feedback"),
        restart: document.getElementById("qe-restart-btn"),
        playAgain: document.getElementById("qe-play-again-btn"),
    };

    const screens = {
        intro: document.getElementById("qe-intro"),
        loading: document.getElementById("qe-loading"),
        game: document.getElementById("qe-game"),
        done: document.getElementById("qe-done")
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
    let selectedSlot = null;
    let draggedSlot = null;
    let order = [];
    let completed = false;
    let activityToken = 0;
    let previewTimer = null;

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

    function createShuffledOrder() {
        const correctOrder = Array.from(
            { length: PIECE_COUNT },
            (_, index) => index
        );
        const shuffled = TekoActivityCore.shuffle(correctOrder);

        if (shuffled.every((piece, slot) => piece === slot)) {
            [shuffled[0], shuffled[1]] = [shuffled[1], shuffled[0]];
        }

        return shuffled;
    }

    function getBackgroundPosition(pieceIndex) {
        const column = pieceIndex % GRID_SIZE;
        const row = Math.floor(pieceIndex / GRID_SIZE);
        const divisor = GRID_SIZE - 1;

        return `${(column / divisor) * 100}% ${(row / divisor) * 100}%`;
    }

    function countCorrectPieces() {
        return order.reduce(
            (total, piece, slot) => total + Number(piece === slot),
            0
        );
    }

    function updateCounter() {
        const correctPieces = countCorrectPieces();
        elements.counter.textContent = `${correctPieces} de ${PIECE_COUNT} peças no lugar`;
    }

    function updatePiece(button, slot) {
        const pieceIndex = order[slot];
        const phase = phases[currentPhase];

        button.dataset.slot = String(slot);
        button.dataset.piece = String(pieceIndex);
        button.style.backgroundImage = `url("${phase.image}")`;
        button.style.backgroundSize = `${GRID_SIZE * 100}% ${GRID_SIZE * 100}%`;
        button.style.backgroundPosition = getBackgroundPosition(pieceIndex);
        button.classList.toggle("is-correct", pieceIndex === slot);
        button.setAttribute(
            "aria-label",
            `Posição ${slot + 1} do quebra-cabeça${pieceIndex === slot ? ", peça correta" : ""}`
        );
    }

    function updateAllPieces() {
        const buttons = elements.board.querySelectorAll(".qe-piece");

        buttons.forEach((button, slot) => {
            updatePiece(button, slot);
        });

        updateCounter();
    }

    function buildBoard() {
        const fragment = document.createDocumentFragment();
        const phase = phases[currentPhase];

        elements.board.replaceChildren();
        elements.board.classList.remove("is-complete");
        elements.round.textContent = `Fase ${currentPhase + 1} de ${phases.length}`;
        elements.previewImage.src = phase.image;

        for (let slot = 0; slot < PIECE_COUNT; slot += 1) {
            const button = document.createElement("button");
            button.className = "qe-piece";
            button.type = "button";
            button.draggable = true;
            button.setAttribute("aria-pressed", "false");
            updatePiece(button, slot);
            fragment.appendChild(button);
        }

        elements.board.appendChild(fragment);
        updateCounter();
    }

    function clearSelection(message = "Escolha a primeira peça.") {
        selectedSlot = null;
        elements.board.querySelectorAll(".qe-piece").forEach(piece => {
            piece.classList.remove("is-selected");
            piece.setAttribute("aria-pressed", "false");
        });
        elements.selectionStatus.textContent = message;
    }

    function hidePreview() {
        if (previewTimer) {
            window.clearTimeout(previewTimer);
            previewTimer = null;
        }

        elements.preview.hidden = true;
        elements.previewButton.disabled = false;
    }

    function createCauseOption(cause) {
        const button = document.createElement("button");

        button.type = "button";
        button.className = "qe-cause-option";
        button.textContent = cause.text;
        button.dataset.correct = String(cause.correct);

        return button;
    }

    function showCauseQuestion() {
        const phase = phases[currentPhase];
        const fragment = document.createDocumentFragment();

        elements.causeQuestion.textContent =
            `O que pode ter acontecido para o Teko sentir ${phase.emotion}?`;
        elements.causeFeedback.textContent =
            "Escolha uma possibilidade entre as três opções.";
        elements.causeFeedback.className = "qe-cause-feedback";
        elements.causeOptions.replaceChildren();

        TekoActivityCore.shuffle(phase.causes).forEach(cause => {
            fragment.appendChild(createCauseOption(cause));
        });

        elements.causeOptions.appendChild(fragment);
        elements.controls.hidden = true;
        elements.causePanel.hidden = false;
        elements.causeOptions.querySelector(".qe-cause-option")?.focus();
    }

    function advancePhase() {
        if (currentPhase < phases.length - 1) {
            currentPhase += 1;
            preparePhase();
            elements.board.querySelector(".qe-piece")?.focus();
            return;
        }

        switchScreen("done", () => {
            elements.playAgain.focus();
        });
    }

    function selectCause(button) {
        if (button.disabled) {
            return;
        }

        elements.causeOptions.querySelectorAll(".qe-cause-option").forEach(option => {
            option.classList.remove("is-wrong");
        });

        if (button.dataset.correct !== "true") {
            button.classList.add("is-wrong");
            elements.causeFeedback.textContent =
                "Essa situação pode provocar outra emoção. Observe a expressão do Teko e tente novamente.";
            elements.causeFeedback.className =
                "qe-cause-feedback qe-cause-feedback-retry";
            return;
        }

        button.classList.add("is-correct", "activity-answer-correct");
        elements.causeOptions.querySelectorAll(".qe-cause-option").forEach(option => {
            option.disabled = true;
        });
        elements.causeFeedback.textContent =
            "Muito bem! Essa é uma situação que pode fazer alguém se sentir assim.";
        elements.causeFeedback.className =
            "qe-cause-feedback qe-cause-feedback-correct";

        levelTransition.run(advancePhase);
    }

    function finishPhase() {
        completed = true;
        clearSelection("Quebra-cabeça concluído!");
        hidePreview();
        elements.board.classList.add("is-complete");

        elements.board.querySelectorAll(".qe-piece").forEach(piece => {
            piece.disabled = true;
            piece.draggable = false;
        });

        showCauseQuestion();
    }

    function swapPieces(firstSlot, secondSlot) {
        [order[firstSlot], order[secondSlot]] = [
            order[secondSlot],
            order[firstSlot]
        ];

        updateAllPieces();
        clearSelection("Peças trocadas. Escolha outra peça.");

        if (countCorrectPieces() === PIECE_COUNT) {
            finishPhase();
        }
    }

    function selectPiece(slot) {
        if (completed) {
            return;
        }

        const piece = elements.board.querySelector(`[data-slot="${slot}"]`);

        if (selectedSlot === null) {
            selectedSlot = slot;
            piece.classList.add("is-selected");
            piece.setAttribute("aria-pressed", "true");
            elements.selectionStatus.textContent = "Agora escolha onde esta peça deve ficar.";
            return;
        }

        if (selectedSlot === slot) {
            clearSelection();
            return;
        }

        swapPieces(selectedSlot, slot);
    }

    function preparePhase() {
        completed = false;
        order = createShuffledOrder();
        hidePreview();
        elements.causePanel.hidden = true;
        elements.causeOptions.replaceChildren();
        elements.controls.hidden = false;
        buildBoard();
        clearSelection();
    }

    const activityEntry = TekoActivityCore.createEntryGate({
        stage: elements.stage,
        game: screens.game,
        instruction: "Monte a imagem trocando as peças de lugar. Depois, escolha o que pode ter acontecido.",
        onStart: () => {
            elements.board.querySelector(".qe-piece")?.focus();
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
            Promise.all(phases.map(phase => preloadImage(phase.image)))
        ]);

        if (token !== activityToken) {
            return;
        }

        preparePhase();
        switchScreen("game", () => activityEntry.show());
    }

    function restartPhase() {
        activityToken += 1;
        levelTransition.cancel();
        preparePhase();
        elements.board.querySelector(".qe-piece")?.focus();
    }

    function resetActivity() {
        activityToken += 1;
        currentPhase = 0;
        completed = false;
        order = [];
        hidePreview();
        levelTransition.cancel();
        elements.causePanel.hidden = true;
        elements.causeOptions.replaceChildren();
        elements.controls.hidden = false;
        elements.board.replaceChildren();
        elements.stage.classList.remove("activity-stage-revealing");

        startActivity();
    }

    function showPreview() {
        if (completed) {
            return;
        }

        hidePreview();
        elements.preview.hidden = false;
        elements.previewButton.disabled = true;
        elements.selectionStatus.textContent = "Observe a imagem completa e tente lembrar.";

        previewTimer = window.setTimeout(() => {
            hidePreview();
            clearSelection();
            elements.previewButton.focus();
        }, PREVIEW_TIME);
    }

    function moveKeyboardFocus(button, key) {
        const slot = Number(button.dataset.slot);
        const row = Math.floor(slot / GRID_SIZE);
        const column = slot % GRID_SIZE;
        let nextRow = row;
        let nextColumn = column;

        if (key === "ArrowUp") nextRow = Math.max(0, row - 1);
        if (key === "ArrowDown") nextRow = Math.min(GRID_SIZE - 1, row + 1);
        if (key === "ArrowLeft") nextColumn = Math.max(0, column - 1);
        if (key === "ArrowRight") nextColumn = Math.min(GRID_SIZE - 1, column + 1);

        const nextSlot = nextRow * GRID_SIZE + nextColumn;
        elements.board.querySelector(`[data-slot="${nextSlot}"]`)?.focus();
    }

    elements.board.addEventListener("click", event => {
        const piece = event.target.closest(".qe-piece");

        if (piece) {
            selectPiece(Number(piece.dataset.slot));
        }
    });

    elements.board.addEventListener("keydown", event => {
        if (!event.key.startsWith("Arrow")) {
            return;
        }

        const piece = event.target.closest(".qe-piece");

        if (piece) {
            event.preventDefault();
            moveKeyboardFocus(piece, event.key);
        }
    });

    elements.board.addEventListener("dragstart", event => {
        const piece = event.target.closest(".qe-piece");

        if (!piece || completed) {
            event.preventDefault();
            return;
        }

        draggedSlot = Number(piece.dataset.slot);
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", String(draggedSlot));
    });

    elements.board.addEventListener("dragover", event => {
        const piece = event.target.closest(".qe-piece");

        if (!piece || completed) {
            return;
        }

        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        elements.board.querySelectorAll(".is-drag-target").forEach(item => {
            item.classList.remove("is-drag-target");
        });
        piece.classList.add("is-drag-target");
    });

    elements.board.addEventListener("dragleave", event => {
        event.target.closest(".qe-piece")?.classList.remove("is-drag-target");
    });

    elements.board.addEventListener("drop", event => {
        const piece = event.target.closest(".qe-piece");

        if (!piece || draggedSlot === null || completed) {
            return;
        }

        event.preventDefault();
        const targetSlot = Number(piece.dataset.slot);
        piece.classList.remove("is-drag-target");

        if (targetSlot !== draggedSlot) {
            swapPieces(draggedSlot, targetSlot);
        }

        draggedSlot = null;
    });

    elements.board.addEventListener("dragend", () => {
        draggedSlot = null;
        elements.board.querySelectorAll(".is-drag-target").forEach(item => {
            item.classList.remove("is-drag-target");
        });
    });

    elements.causeOptions.addEventListener("click", event => {
        const option = event.target.closest(".qe-cause-option");

        if (option) {
            selectCause(option);
        }
    });

    elements.start.addEventListener("click", startActivity);
    elements.previewButton.addEventListener("click", showPreview);
    elements.restart.addEventListener("click", restartPhase);
    elements.playAgain.addEventListener("click", resetActivity);

    window.addEventListener("pagehide", () => {
        activityToken += 1;
        hidePreview();
        levelTransition.cancel();
    });
    startActivity();
});
