document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    const TURN_DURATION = 10000;
    const LOADING_DURATION = 3000;
    const TURN_GAP = 650;
    const WATER_COOLDOWN = 720;

    const turns = [
        { owner: "child", title: "Agora é a sua vez!", instruction: "Arraste o regador até uma plantinha." },
        { owner: "teko", title: "Agora é a vez do Teko!", instruction: "Observe o Teko e espere o próximo turno." },
        { owner: "child", title: "Sua vez novamente!", instruction: "Continue regando as plantinhas." },
        { owner: "teko", title: "Última vez do Teko!", instruction: "Espere só mais um pouco para ver o jardim." }
    ];

    const screens = {
        intro: document.getElementById("mvsv-intro"),
        loading: document.getElementById("mvsv-loading"),
        game: document.getElementById("mvsv-game"),
        done: document.getElementById("mvsv-done")
    };

    const stage = document.getElementById("activity-stage");
    const scene = document.getElementById("mvsv-scene");
    const can = document.getElementById("mvsv-watering-can");
    const plants = [...document.querySelectorAll(".mvsv-plant")];

    const elements = {
        start: document.getElementById("mvsv-start-btn"),
        restart: document.getElementById("mvsv-restart-btn"),
        turnCount: document.getElementById("mvsv-turn-count"),
        seconds: document.getElementById("mvsv-seconds"),
        progress: document.getElementById("mvsv-progress-bar"),
        speech: document.getElementById("mvsv-teko-speech"),
        live: document.getElementById("mvsv-turn-live")
    };

    const changeScreen = TekoActivityCore.createScreenTransition({
        screens,
        stage,
        duration: 220,
        activeScreens: ["game"]
    });

    let currentScreen = "intro";
    let currentTurnIndex = -1;
    let running = false;
    let timerFrame = null;
    let loadingTimer = null;
    let gapTimer = null;
    let turnTimeouts = [];
    let dragState = null;
    let lastDropAt = 0;
    let lastWaterCheckAt = 0;
    let childWaterings = 0;
    let childTurnWaterings = 0;
    const lastPlantWatering = plants.map(() => 0);

    function switchTo(next, onEnter) {
        changeScreen(currentScreen, next, () => {
            currentScreen = next;
            onEnter?.();
        });
    }

    function isChildTurn() {
        return running && turns[currentTurnIndex]?.owner === "child";
    }

    function clearTurnWork() {
        cancelAnimationFrame(timerFrame);
        timerFrame = null;
        clearTimeout(gapTimer);
        gapTimer = null;
        turnTimeouts.forEach(clearTimeout);
        turnTimeouts = [];
        gsap.killTweensOf(can);
        stopDragging();
    }

    function resetCan(animate = false) {
        const targetLeft = Math.max(22, scene.clientWidth - can.offsetWidth - 30);
        const targetTop = scene.clientWidth < 600 ? 122 : 96;
        const properties = {
            left: targetLeft,
            top: targetTop,
            rotation: 0,
            duration: animate ? 0.45 : 0,
            ease: "power2.out"
        };

        gsap.to(can, properties);
    }

    function resetGarden() {
        clearTurnWork();
        running = false;
        currentTurnIndex = -1;
        childWaterings = 0;
        childTurnWaterings = 0;
        scene.classList.remove("teko-turn", "garden-complete");
        screens.game.classList.remove("teko-active");

        plants.forEach((plant, index) => {
            plant.dataset.growth = "0";
            plant.className = "mvsv-plant growth-0";
            plant.setAttribute("aria-label", `Planta ${index + 1}, pequena`);
            lastPlantWatering[index] = 0;
        });

        elements.progress.style.transform = "scaleX(1)";
        elements.seconds.textContent = "10";
        elements.speech.textContent = "Vamos cuidar juntos!";
        elements.live.textContent = "";
        can.classList.remove("locked", "dragging");
        can.setAttribute("aria-disabled", "false");
        resetCan(false);
    }

    function startActivity() {
        resetGarden();
        switchTo("loading", () => {
            stage.classList.add("activity-stage-revealing");
        });
        clearTimeout(loadingTimer);

        loadingTimer = setTimeout(() => {
            switchTo("game", () => {
                resetCan(false);
                startTurn(0);
            });
        }, LOADING_DURATION);
    }

    function startTurn(index) {
        clearTurnWork();

        if (index >= turns.length) {
            finishActivity();
            return;
        }

        currentTurnIndex = index;
        running = true;
        childTurnWaterings = 0;
        const turn = turns[index];
        const child = turn.owner === "child";

        elements.turnCount.textContent = `Turno ${index + 1} de ${turns.length}`;
        elements.seconds.textContent = "10";
        elements.progress.style.transform = "scaleX(1)";
        screens.game.classList.toggle("teko-active", !child);
        scene.classList.toggle("teko-turn", !child);
        can.classList.toggle("locked", !child);
        can.setAttribute("aria-disabled", String(!child));

        if (child) {
            elements.speech.textContent = turn.title;
            elements.live.textContent = `${turn.title} ${turn.instruction}`;
            resetCan(true);
        } else {
            elements.speech.textContent = "Minha vez! Depois será a sua.";
            elements.live.textContent = `${turn.title} ${turn.instruction}`;
            runTekoTurn();
        }

        const turnStartedAt = performance.now();

        function updateTimer(now) {
            if (!running || currentTurnIndex !== index) return;

            const elapsed = Math.min(TURN_DURATION, now - turnStartedAt);
            const remaining = Math.max(0, TURN_DURATION - elapsed);
            const seconds = Math.max(0, Math.ceil(remaining / 1000));
            const progress = Math.max(0, 1 - elapsed / TURN_DURATION);

            elements.seconds.textContent = String(seconds);
            elements.progress.style.transform = `scaleX(${progress})`;

            if (elapsed >= TURN_DURATION) {
                endTurn(index);
                return;
            }

            timerFrame = requestAnimationFrame(updateTimer);
        }

        timerFrame = requestAnimationFrame(updateTimer);
    }

    function endTurn(index) {
        if (!running || currentTurnIndex !== index) return;

        cancelAnimationFrame(timerFrame);
        timerFrame = null;
        stopDragging();
        turnTimeouts.forEach(clearTimeout);
        turnTimeouts = [];

        const wasChild = turns[index].owner === "child";
        running = false;

        if (wasChild) {
            elements.speech.textContent = childTurnWaterings > 0
                ? "Muito bem! Agora entregue a vez ao Teko."
                : "Tudo bem! Agora observe a vez do Teko.";
        } else {
            elements.speech.textContent = index === turns.length - 1
                ? "Vocês terminaram de cuidar do jardim!"
                : "O Teko terminou. Prepare-se para a sua vez!";
        }

        resetCan(true);
        gapTimer = setTimeout(() => startTurn(index + 1), TURN_GAP);
    }

    function runTekoTurn() {
        const moments = [950, 3100, 5250, 7400];

        moments.forEach((delay, position) => {
            turnTimeouts.push(setTimeout(() => {
                if (!running || turns[currentTurnIndex]?.owner !== "teko") return;

                const plant = getLeastGrownPlant(position);
                moveCanToPlant(plant, () => {
                    createWaterBurst(plant, 5);
                    growPlant(plant, "teko");
                    elements.speech.textContent = position % 2 === 0
                        ? "Um pouco de água aqui!"
                        : "Esta plantinha também!";
                });

            }, delay));
        });
    }

    function getLeastGrownPlant(offset = 0) {
        const ordered = [...plants].sort((a, b) => {
            const difference = Number(a.dataset.growth) - Number(b.dataset.growth);
            if (difference !== 0) return difference;
            return Number(a.dataset.plantIndex) - Number(b.dataset.plantIndex);
        });

        return ordered[offset % Math.min(ordered.length, 3)];
    }

    function moveCanToPlant(plant, onArrive) {
        const sceneRect = scene.getBoundingClientRect();
        const plantRect = plant.getBoundingClientRect();
        const left = plantRect.left - sceneRect.left + plantRect.width / 2 + 26;
        const top = Math.max(82, plantRect.top - sceneRect.top - 70);

        gsap.to(can, {
            left: Math.min(scene.clientWidth - can.offsetWidth - 10, left),
            top,
            rotation: -17,
            duration: 0.68,
            ease: "power2.inOut",
            onComplete: onArrive
        });
    }

    function growPlant(plant, owner) {
        const index = Number(plant.dataset.plantIndex);
        const current = Number(plant.dataset.growth);
        const next = Math.min(4, current + 1);

        if (next === current) return;

        plant.dataset.growth = String(next);
        plant.classList.remove(`growth-${current}`);
        plant.classList.add(`growth-${next}`);
        plant.setAttribute(
            "aria-label",
            `Planta ${index + 1}, estágio ${next} de crescimento`
        );

        gsap.fromTo(plant,
            { scale: 0.94 },
            { scale: 1, duration: 0.5, ease: "back.out(2)" }
        );

        if (owner === "child") {
            childWaterings += 1;
            childTurnWaterings += 1;
            elements.speech.textContent = next >= 4
                ? "A flor abriu! Você pode cuidar de outra planta."
                : "A plantinha cresceu! Continue cuidando do jardim.";
        }
    }

    function waterPlantFromChild(plant) {
        if (!isChildTurn()) {
            remindTekoTurn();
            return;
        }

        const index = Number(plant.dataset.plantIndex);
        const now = performance.now();

        if (now - lastPlantWatering[index] < WATER_COOLDOWN) return;

        lastPlantWatering[index] = now;
        createWaterBurst(plant, 4);
        growPlant(plant, "child");
    }

    function createWaterBurst(plant, amount) {
        const sceneRect = scene.getBoundingClientRect();
        const plantRect = plant.getBoundingClientRect();
        const startX = plantRect.left - sceneRect.left + plantRect.width / 2;
        const startY = Math.max(60, plantRect.top - sceneRect.top - 42);
        const distance = Math.max(44, plantRect.bottom - sceneRect.top - startY - 18);

        for (let index = 0; index < amount; index += 1) {
            turnTimeouts.push(setTimeout(() => {
                createDrop(
                    startX + (Math.random() - 0.5) * 22,
                    startY,
                    distance + Math.random() * 18
                );
            }, index * 90));
        }
    }

    function createDrop(x, y, distance = 95) {
        const drop = document.createElement("span");
        drop.className = "mvsv-water-drop";
        drop.style.left = `${x}px`;
        drop.style.top = `${y}px`;
        scene.appendChild(drop);

        gsap.to(drop, {
            x: (Math.random() - 0.5) * 20,
            y: distance,
            opacity: 0,
            duration: 0.58,
            ease: "power1.in",
            onComplete: () => drop.remove()
        });
    }

    function remindTekoTurn() {
        elements.speech.textContent = "Espere só um pouquinho!";
        elements.live.textContent = "Agora é a vez do Teko. Logo será a sua.";
        gsap.fromTo(can, { x: -4 }, { x: 4, duration: 0.08, yoyo: true, repeat: 5, clearProps: "x" });
    }

    function startDragging(event) {
        if (!isChildTurn()) {
            remindTekoTurn();
            return;
        }

        event.preventDefault();
        event.stopPropagation();
        gsap.killTweensOf(can);

        const sceneRect = scene.getBoundingClientRect();
        const pointerX = event.clientX - sceneRect.left;
        const pointerY = event.clientY - sceneRect.top;
        dragState = {
            pointerId: event.pointerId,
            offsetX: pointerX - can.offsetLeft,
            offsetY: pointerY - can.offsetTop
        };
        lastWaterCheckAt = 0;

        scene.setPointerCapture?.(event.pointerId);
        can.classList.add("dragging");
        scene.classList.add("is-dragging");
    }

    function moveDragging(event) {
        if (!dragState || dragState.pointerId !== event.pointerId || !isChildTurn()) return;

        event.preventDefault();
        const sceneRect = scene.getBoundingClientRect();
        const left = clamp(
            event.clientX - sceneRect.left - dragState.offsetX,
            -8,
            scene.clientWidth - can.offsetWidth + 8
        );
        const top = clamp(
            event.clientY - sceneRect.top - dragState.offsetY,
            34,
            scene.clientHeight - can.offsetHeight - 28
        );

        // A posição acompanha o ponteiro imediatamente. As plantas apenas são
        // consultadas depois do movimento e nunca controlam o regador.
        gsap.set(can, { left, top, rotation: -17 });

        const now = performance.now();
        if (now - lastDropAt > 135) {
            const tipX = left - 29;
            const tipY = top + 46;
            createDrop(tipX, tipY, 82);
            lastDropAt = now;
        }

        // A detecção é limitada para não misturar leituras de layout com cada
        // atualização do ponteiro, especialmente enquanto uma flor cresce.
        if (now - lastWaterCheckAt > 70) {
            const target = findPlantUnderSpout(left - 29, top + 46);
            if (target) waterPlantFromChild(target);
            lastWaterCheckAt = now;
        }
    }

    function stopDragging(event) {
        if (!dragState) return;
        if (event && dragState.pointerId !== event.pointerId) return;

        try {
            scene.releasePointerCapture?.(dragState.pointerId);
        } catch (error) {
            // O ponteiro pode já ter sido liberado pelo navegador.
        }

        dragState = null;
        can.classList.remove("dragging");
        scene.classList.remove("is-dragging");
        gsap.to(can, { rotation: 0, duration: 0.22, ease: "power2.out" });
    }

    function findPlantUnderSpout(x, y) {
        const sceneRect = scene.getBoundingClientRect();

        return plants.find(plant => {
            const rect = plant.getBoundingClientRect();
            const centerX = rect.left - sceneRect.left + rect.width / 2;
            const top = rect.top - sceneRect.top;
            const bottom = rect.bottom - sceneRect.top;

            return Math.abs(centerX - x) <= 48 && y >= top - 100 && y <= bottom - 18;
        }) || null;
    }

    function clamp(value, minimum, maximum) {
        return Math.min(maximum, Math.max(minimum, value));
    }

    function finishActivity() {
        clearTurnWork();
        running = false;
        scene.classList.add("garden-complete");
        can.classList.add("locked");
        can.setAttribute("aria-disabled", "true");
        elements.speech.textContent = "Conseguimos juntos!";
        elements.live.textContent = "O jardim ficou lindo. Você concluiu a atividade.";

        plants.forEach((plant, index) => {
            turnTimeouts.push(setTimeout(() => {
                const current = Number(plant.dataset.growth);
                plant.dataset.growth = "4";
                plant.classList.remove(`growth-${current}`);
                plant.classList.add("growth-4");
                plant.setAttribute("aria-label", `Planta ${index + 1}, florida`);
                gsap.fromTo(plant, { scale: 0.9 }, { scale: 1, duration: 0.55, ease: "back.out(2.2)" });
            }, index * 120));
        });

        gapTimer = setTimeout(() => {
            switchTo("done", () => elements.restart.focus());
        }, 1850);
    }

    function restartActivity() {
        clearTimeout(loadingTimer);
        resetGarden();
        stage.classList.remove("activity-stage-revealing");
        switchTo("intro", () => elements.start.focus());
    }

    can.addEventListener("pointerdown", startDragging);
    window.addEventListener("pointermove", moveDragging, { passive: false });
    window.addEventListener("pointerup", stopDragging);
    window.addEventListener("pointercancel", stopDragging);

    plants.forEach(plant => {
        plant.addEventListener("click", () => waterPlantFromChild(plant));
    });

    elements.start.addEventListener("click", startActivity);
    elements.restart.addEventListener("click", restartActivity);

    window.addEventListener("resize", () => {
        if (!dragState && currentScreen === "game" && isChildTurn()) resetCan(false);
    });

    window.addEventListener("pagehide", () => {
        clearTimeout(loadingTimer);
        clearTurnWork();
        document.querySelectorAll(".mvsv-water-drop").forEach(drop => drop.remove());
    });

    screens.intro.hidden = false;
    screens.loading.hidden = true;
    screens.game.hidden = true;
    screens.done.hidden = true;
});
