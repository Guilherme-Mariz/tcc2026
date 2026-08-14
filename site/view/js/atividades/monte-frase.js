(function () {
    "use strict";

    const ROUNDS = [
        {
            instruction: "Monte uma frase para pedir água.",
            correct: ["Eu quero", "água"],
            options: ["água", "brincar", "Eu quero", "não"]
        },
        {
            instruction: "Monte uma frase para pedir ajuda.",
            correct: ["Eu preciso", "de ajuda"],
            options: ["de ajuda", "Eu preciso", "brincar", "água"]
        },
        {
            instruction: "Monte uma frase para dizer que quer brincar.",
            correct: ["Eu quero", "brincar"],
            options: ["parar", "brincar", "Eu quero", "de ajuda"]
        },
        {
            instruction: "Monte uma frase para pedir que algo pare.",
            correct: ["Eu quero", "parar"],
            options: ["Eu quero", "ler", "parar", "água"]
        },
        {
            instruction: "Monte uma frase sobre algo que você gosta.",
            correct: ["Eu gosto", "de ler"],
            options: ["de ler", "Eu gosto", "parar", "brincar"]
        }
    ];

    const introPanel   = document.getElementById("mf-intro");
    const loadingPanel = document.getElementById("mf-loading");
    const gamePanel    = document.getElementById("mf-game");
    const donePanel     = document.getElementById("mf-done");

    const startBtn      = document.getElementById("mf-start-btn");
    const roundIndicator = document.getElementById("mf-round-indicator");
    const instructionEl = document.getElementById("mf-instruction");
    const sentenceArea  = document.getElementById("mf-sentence-area");
    const sentencePlaceholder = document.getElementById("mf-sentence-placeholder");
    const optionsArea   = document.getElementById("mf-options-area");
    const feedbackEl    = document.getElementById("mf-feedback");
    const clearBtn       = document.getElementById("mf-clear-btn");
    const listenBtn       = document.getElementById("mf-listen-btn");
    const confirmBtn     = document.getElementById("mf-confirm-btn");
    const nextBtn         = document.getElementById("mf-next-btn");
    const doneText        = document.getElementById("mf-done-text");
    const replayBtn       = document.getElementById("mf-replay-btn");

    let currentRoundIndex = 0;
    let shuffledOptions = [];
    let selectedWords = [];
    let roundSolved = false;

    function shuffle(array) {
        const copy = array.slice();
        for (let i = copy.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        return copy;
    }

    function showPanel(panel) {
        [introPanel, loadingPanel, gamePanel, donePanel].forEach(p => {
            if (!p) return;
            p.hidden = p !== panel;
        });
    }

    function startActivity() {
        showPanel(loadingPanel);
        setTimeout(() => {
            currentRoundIndex = 0;
            loadRound(currentRoundIndex);
            showPanel(gamePanel);
        }, 1500);
    }

    function loadRound(index) {
        const round = ROUNDS[index];
        selectedWords = [];
        roundSolved = false;
        shuffledOptions = shuffle(round.options);

        roundIndicator.textContent = `Frase ${index + 1} de ${ROUNDS.length}`;
        instructionEl.textContent = round.instruction;

        feedbackEl.textContent = "";
        feedbackEl.className = "mf-feedback";

        confirmBtn.hidden = false;
        confirmBtn.disabled = false;
        nextBtn.hidden = true;

        renderOptions();
        renderSentence();
    }

    function renderOptions() {
        optionsArea.innerHTML = "";
        shuffledOptions.forEach(word => {
            const isUsed = isWordFullyConsumed(word);
            if (isUsed) return;
            optionsArea.appendChild(createWordCard(word, false));
        });
    }

    function isWordFullyConsumed(word) {
        const totalInOptions = shuffledOptions.filter(w => w === word).length;
        const usedCount = selectedWords.filter(w => w === word).length;
        return usedCount >= totalInOptions;
    }

    function createWordCard(word, isSelected) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "word-card";
        if (isSelected) btn.classList.add("mf-selected");
        btn.setAttribute("aria-label", word);

        const span = document.createElement("span");
        span.textContent = word;
        btn.appendChild(span);

        btn.addEventListener("click", () => {
            if (roundSolved) return;
            if (isSelected) {
                removeWordAt(word, btn);
            } else {
                addWord(word);
            }
        });

        return btn;
    }

    function addWord(word) {
        selectedWords.push(word);
        renderOptions();
        renderSentence();
        feedbackEl.textContent = "";
        feedbackEl.className = "mf-feedback";
    }

    function removeWordAt(word, btnEl) {
        const cards = Array.from(sentenceArea.querySelectorAll(".word-card"));
        const idx = cards.indexOf(btnEl);
        if (idx === -1) return;
        selectedWords.splice(idx, 1);
        renderOptions();
        renderSentence();
    }

    function renderSentence() {
        sentenceArea.innerHTML = "";
        if (selectedWords.length === 0) {
            sentenceArea.classList.remove("mf-has-words");
            const p = document.createElement("p");
            p.className = "mf-sentence-placeholder";
            p.textContent = "Toque nas palavras abaixo para montar sua frase";
            sentenceArea.appendChild(p);
            return;
        }
        sentenceArea.classList.add("mf-has-words");
        selectedWords.forEach(word => {
            sentenceArea.appendChild(createWordCard(word, true));
        });
    }

    function clearSentence() {
        if (roundSolved) return;
        selectedWords = [];
        renderOptions();
        renderSentence();
        feedbackEl.textContent = "";
        feedbackEl.className = "mf-feedback";
    }

    function confirmSentence() {
        const round = ROUNDS[currentRoundIndex];
        const isCorrect =
            selectedWords.length === round.correct.length &&
            selectedWords.every((word, i) => word === round.correct[i]);

        if (isCorrect) {
            roundSolved = true;
            feedbackEl.textContent = "Muito bem! Você mostrou o que queria dizer.";
            feedbackEl.className = "mf-feedback mf-feedback-correct";
            confirmBtn.hidden = true;
            nextBtn.hidden = false;
            nextBtn.focus();
        } else {
            feedbackEl.textContent = "Quase! Vamos tentar organizar as palavras de outro jeito?";
            feedbackEl.className = "mf-feedback mf-feedback-retry";
        }
    }

    function goToNextRound() {
        currentRoundIndex += 1;
        if (currentRoundIndex >= ROUNDS.length) {
            finishActivity();
            return;
        }
        loadRound(currentRoundIndex);
    }

    function finishActivity() {
        doneText.textContent = `Você completou ${ROUNDS.length} de ${ROUNDS.length} frases.`;
        showPanel(donePanel);
    }

    function restartActivity() {
        showPanel(introPanel);
    }

    function speakSentence() {
        if (!("speechSynthesis" in window)) return;

        if (selectedWords.length === 0) {
            listenBtn.classList.remove("mf-listen-shake");
            void listenBtn.offsetWidth;
            listenBtn.classList.add("mf-listen-shake");
            feedbackEl.textContent = "Escolha as palavras primeiro para ouvir a frase.";
            feedbackEl.className = "mf-feedback mf-feedback-warn";
            return;
        }

        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(selectedWords.join(" "));
        utterance.lang = "pt-BR";
        window.speechSynthesis.speak(utterance);
    }

    startBtn.addEventListener("click", startActivity);
    clearBtn.addEventListener("click", clearSentence);
    listenBtn.addEventListener("click", speakSentence);
    confirmBtn.addEventListener("click", confirmSentence);
    nextBtn.addEventListener("click", goToNextRound);
    replayBtn.addEventListener("click", restartActivity);

    showPanel(introPanel);
})();