const TekoAudio = (() => {
    let audio;
    function volume(cfg) { return cfg.volNarracao / 100; }
    document.addEventListener("click", event => {
        const cfg = TekoPreferencias.atual;
        if (!cfg?.toggle_efeitos || !volume(cfg) || !event.target.closest("button") || !window.AudioContext) return;
        audio ??= new AudioContext();
        const tone = audio.createOscillator();
        const gain = audio.createGain();
        gain.gain.setValueAtTime(0.035 * volume(cfg), audio.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.07);
        tone.connect(gain).connect(audio.destination);
        tone.start();
        tone.stop(audio.currentTime + 0.07);
    });
    return { falar(fala) {
        const cfg = TekoPreferencias.atual;
        if (!cfg?.toggle_narracao || !volume(cfg)) return;
        fala.volume = volume(cfg);
        window.speechSynthesis.speak(fala);
    }};
})();
