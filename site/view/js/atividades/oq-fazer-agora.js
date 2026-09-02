document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    const LOADING_TIME = 2000;
    const SCREEN_FADE_DURATION = 220;

    const phases = [
        {
            icon: "fa-people-arrows-left-right",
            story: "Teko esperava na fila do escorregador. Uma criança chegou e passou na frente dele.",
            question: "O que Teko pode fazer agora?",
            options: [
                { id: "say-turn", label: "Dizer com calma: “Eu estava esperando a minha vez.”", icon: "fa-comment", tone: "supportive", effect: "Comunicação clara", title: "A outra criança pode perceber o que aconteceu", consequence: "Teko explica o problema sem empurrar ninguém. A criança pode voltar ao lugar dela ou conversar sobre quem será o próximo." },
                { id: "adult-help", label: "Pedir ajuda a um adulto que está por perto.", icon: "fa-person-circle-question", tone: "supportive", effect: "Apoio de outra pessoa", title: "Um adulto pode ajudar a organizar a fila", consequence: "Se estiver difícil resolver sozinho, Teko pode explicar o que ocorreu e o adulto pode ajudar as crianças a combinar os turnos." },
                { id: "cut-back", label: "Passar na frente da criança também.", icon: "fa-person-running", tone: "careful", effect: "Pode aumentar o conflito", title: "Os dois podem começar a disputar o lugar", consequence: "Passar na frente pode deixar a outra criança irritada e não resolve como a fila deve funcionar. Teko pode voltar e experimentar outra ideia." }
            ]
        },
        {
            icon: "fa-palette",
            story: "Teko estava desenhando quando um colega pegou seu marcador favorito sem pedir.",
            question: "Como ele pode cuidar do material e conversar com o colega?",
            options: [
                { id: "explain-ask", label: "Explicar: “Eu estava usando. Peça antes, por favor.”", icon: "fa-comments", tone: "supportive", effect: "Pedido direto e respeitoso", title: "O colega pode entender o limite", consequence: "Teko diz o que aconteceu e mostra como gostaria que o colega agisse da próxima vez." },
                { id: "take-force", label: "Puxar o marcador da mão do colega.", icon: "fa-hand", tone: "careful", effect: "Pode provocar uma disputa", title: "O material pode cair ou alguém pode se machucar", consequence: "Puxar com força pode aumentar o problema. Teko pode proteger seu material usando palavras ou procurando ajuda." },
                { id: "offer-turn", label: "Combinar: “Quando eu terminar, será a sua vez.”", icon: "fa-arrows-rotate", tone: "supportive", effect: "Acordo de turnos", title: "Os dois podem saber quando usar o marcador", consequence: "O combinado organiza a espera, mas Teko ainda pode explicar que o colega precisa pedir antes de pegar." }
            ]
        },
        {
            icon: "fa-futbol",
            story: "Durante uma brincadeira, os colegas mudaram a regra sem avisar. Teko não entendeu por que sua jogada deixou de valer.",
            question: "O que pode ajudar a brincadeira a continuar?",
            options: [
                { id: "ask-rule", label: "Pedir que expliquem a nova regra.", icon: "fa-circle-question", tone: "supportive", effect: "Buscar informação", title: "Os colegas podem explicar o que mudou", consequence: "Com a regra explicada, Teko consegue decidir se entendeu e se quer continuar brincando." },
                { id: "agree-rule", label: "Propor que todos escolham juntos qual regra usar.", icon: "fa-people-group", tone: "supportive", effect: "Criar um acordo", title: "O grupo pode combinar uma regra clara", consequence: "Conversar permite que todos saibam qual regra vale e diminui as mudanças inesperadas durante o jogo." },
                { id: "shout-leave", label: "Gritar que a brincadeira é injusta e ir embora.", icon: "fa-door-open", tone: "careful", effect: "A conversa pode ser interrompida", title: "Os colegas talvez não entendam o que incomodou", consequence: "Teko pode escolher sair, mas gritar dificulta explicar o problema. Se precisar de uma pausa, ele pode avisar e conversar depois." }
            ]
        },
        {
            icon: "fa-user-group",
            story: "No recreio, Teko viu uma criança sentada sozinha enquanto as outras brincavam.",
            question: "Como Teko pode descobrir se ela quer companhia?",
            options: [
                { id: "ask-company", label: "Perguntar: “Você quer companhia ou prefere ficar sozinho?”", icon: "fa-comment-dots", tone: "supportive", effect: "Respeitar a preferência", title: "A criança pode dizer do que precisa", consequence: "Perguntar oferece companhia sem obrigar a criança a conversar ou brincar." },
                { id: "invite-play", label: "Convidar a criança para participar da brincadeira.", icon: "fa-hand-holding-heart", tone: "supportive", effect: "Fazer um convite", title: "Ela pode aceitar ou recusar", consequence: "O convite abre uma possibilidade. Se a criança não quiser, Teko pode respeitar a resposta." },
                { id: "force-join", label: "Puxar a criança para brincar sem perguntar.", icon: "fa-person-walking-arrow-right", tone: "careful", effect: "Pode desrespeitar o espaço", title: "A criança pode se sentir pressionada", consequence: "Estar sozinho nem sempre significa querer brincar. Perguntar antes ajuda Teko a respeitar a escolha dela." }
            ]
        },
        {
            icon: "fa-cubes-stacked",
            story: "Um colega esbarrou sem querer na torre de blocos do Teko, e todas as peças caíram.",
            question: "O que Teko pode fazer depois desse acidente?",
            options: [
                { id: "say-upset", label: "Dizer que ficou chateado e pedir alguns minutos.", icon: "fa-face-frown", tone: "supportive", effect: "Nomear o sentimento", title: "O colega pode entender como Teko se sentiu", consequence: "Teko comunica seu incômodo e ganha tempo antes de decidir se quer reconstruir a torre." },
                { id: "rebuild", label: "Convidar o colega para reconstruir junto.", icon: "fa-hammer", tone: "supportive", effect: "Reparar juntos", title: "Os dois podem transformar o acidente em cooperação", consequence: "Se Teko estiver pronto, o colega pode ajudar a refazer a torre e tomar mais cuidado ao redor dela." },
                { id: "knock-theirs", label: "Derrubar a construção do colega para ficar igual.", icon: "fa-burst", tone: "careful", effect: "Pode criar outro problema", title: "Agora duas construções estariam destruídas", consequence: "Derrubar outra torre não conserta a primeira e pode machucar o colega. Teko pode tentar uma forma de explicar ou reparar o que aconteceu." }
            ]
        }
    ];

    const stage = document.getElementById("activity-stage");
    const screens = {
        intro: document.getElementById("oqfa-intro"),
        loading: document.getElementById("oqfa-loading"),
        game: document.getElementById("oqfa-game"),
        done: document.getElementById("oqfa-done")
    };
    const elements = {
        start: document.getElementById("oqfa-start-btn"),
        round: document.getElementById("oqfa-round-indicator"),
        storyIcon: document.getElementById("oqfa-story-icon"),
        story: document.getElementById("oqfa-story"),
        question: document.getElementById("oqfa-question"),
        options: document.getElementById("oqfa-options"),
        consequence: document.getElementById("oqfa-consequence"),
        effectLabel: document.getElementById("oqfa-effect-label"),
        consequenceTitle: document.getElementById("oqfa-consequence-title"),
        consequenceText: document.getElementById("oqfa-consequence-text"),
        tryAnother: document.getElementById("oqfa-try-another-btn"),
        next: document.getElementById("oqfa-next-btn"),
        help: document.getElementById("oqfa-help"),
        doneText: document.getElementById("oqfa-done-text"),
        playAgain: document.getElementById("oqfa-play-again-btn")
    };

    const changeScreen = TekoActivityCore.createScreenTransition({ screens, stage, duration: SCREEN_FADE_DURATION });
    const levelTransition = TekoActivityCore.createLevelTransition({ container: screens.game, hold: 150, duration: 220 });

    let currentScreen = "intro";
    let currentPhase = 0;
    let selectedId = null;
    let shuffledOptions = [];
    let explored = new Set();
    let totalExplored = 0;
    let loadingTimer = null;

    function switchScreen(nextScreen, onEnter) {
        const previousScreen = currentScreen;
        currentScreen = nextScreen;
        changeScreen(previousScreen, nextScreen, onEnter);
    }

    function createOption(option) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "oqfa-option";
        if (option.id === selectedId) button.classList.add("is-selected");
        if (explored.has(option.id)) button.classList.add("was-explored");
        button.disabled = selectedId !== null;
        button.setAttribute("aria-pressed", String(option.id === selectedId));
        button.setAttribute(
            "aria-label",
            explored.has(option.id)
                ? `${option.label} Possibilidade já explorada.`
                : option.label
        );

        const icon = document.createElement("span");
        icon.className = "oqfa-option-icon";
        icon.setAttribute("aria-hidden", "true");
        icon.innerHTML = `<i class="fa-solid ${option.icon}"></i>`;

        const label = document.createElement("span");
        label.textContent = option.label;

        const mark = document.createElement("span");
        mark.className = "oqfa-option-explored";
        mark.setAttribute("aria-hidden", "true");
        mark.innerHTML = '<i class="fa-solid fa-check"></i>';

        button.append(icon, label, mark);
        button.addEventListener("click", () => showConsequence(option));
        return button;
    }

    function renderOptions() {
        const fragment = document.createDocumentFragment();
        shuffledOptions.forEach(option => fragment.appendChild(createOption(option)));
        elements.options.replaceChildren(fragment);
    }

    function showConsequence(option) {
        selectedId = option.id;
        if (!explored.has(option.id)) {
            explored.add(option.id);
            totalExplored += 1;
        }
        renderOptions();
        elements.consequence.dataset.tone = option.tone;
        elements.effectLabel.textContent = `Possível efeito: ${option.effect}`;
        elements.consequenceTitle.textContent = option.title;
        elements.consequenceText.textContent = option.consequence;
        elements.next.innerHTML = currentPhase === phases.length - 1
            ? 'Concluir <i class="fa-solid fa-check" aria-hidden="true"></i>'
            : 'Próxima história <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>';
        elements.consequence.hidden = false;
        elements.help.textContent = "Você pode seguir ou voltar para conhecer outra consequência.";
        elements.consequence.focus?.({ preventScroll: true });
    }

    function tryAnotherPossibility() {
        selectedId = null;
        elements.consequence.hidden = true;
        elements.help.textContent = "Escolha outra opção para descobrir o que pode acontecer.";
        renderOptions();
        elements.options.querySelector(".oqfa-option:not(.was-explored)")?.focus();
    }

    function renderPhase() {
        const phase = phases[currentPhase];
        selectedId = null;
        explored = new Set();
        shuffledOptions = TekoActivityCore.shuffle(phase.options);
        elements.round.textContent = `História ${currentPhase + 1} de ${phases.length}`;
        elements.storyIcon.innerHTML = `<i class="fa-solid ${phase.icon}"></i>`;
        elements.story.textContent = phase.story;
        elements.question.textContent = phase.question;
        elements.consequence.hidden = true;
        elements.help.textContent = "Escolha uma opção para descobrir uma possível consequência.";
        renderOptions();
    }

    function finishActivity() {
        const extra = totalExplored > phases.length
            ? ` Você voltou e comparou ${totalExplored - phases.length} possibilidade${totalExplored - phases.length === 1 ? " extra" : "s extras"}.`
            : " Você pode fazer novamente para conhecer outros resultados.";
        elements.doneText.textContent = `Você imaginou cinco situações e observou como diferentes decisões podem mudar o que acontece depois.${extra}`;
        switchScreen("done", () => elements.playAgain.focus());
    }

    function nextPhase() {
        if (!selectedId) return;
        levelTransition.run(() => {
            currentPhase += 1;
            if (currentPhase < phases.length) {
                renderPhase();
                return;
            }
            finishActivity();
        }, () => elements.options.querySelector(".oqfa-option")?.focus());
    }

    const activityEntry = TekoActivityCore.createEntryGate({
        stage,
        game: screens.game,
        instruction: "Leia e imagine cada história. Escolha uma decisão e veja uma possível consequência.",
        onStart: () => elements.options.querySelector(".oqfa-option")?.focus()
    });

    function startActivity() {
        window.clearTimeout(loadingTimer);
        activityEntry.cancel();
        levelTransition.cancel();
        stage.classList.remove("activity-stage-revealing");
        switchScreen("loading", () => stage.classList.add("activity-stage-revealing"));

        loadingTimer = window.setTimeout(() => {
            currentPhase = 0;
            totalExplored = 0;
            renderPhase();
            switchScreen("game", () => activityEntry.show());
        }, LOADING_TIME);
    }

    elements.start.addEventListener("click", startActivity);
    elements.tryAnother.addEventListener("click", tryAnotherPossibility);
    elements.next.addEventListener("click", nextPhase);
    elements.playAgain.addEventListener("click", startActivity);
    window.addEventListener("pagehide", () => {
        window.clearTimeout(loadingTimer);
        levelTransition.cancel();
        activityEntry.cancel();
    });

    Object.values(screens).forEach(screen => { screen.hidden = true; });
    startActivity();
});
