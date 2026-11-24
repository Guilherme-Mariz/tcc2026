const TekoAudio = (() => {
    const perfil = TekoPreferencias.perfil();
    let cfg;
    let audio;
    TekoPreferencias.consultar().then(value => { cfg = value; }).catch(() => {});
    function volume() { return (cfg.volNarracao ?? 80) / 100; }
    document.addEventListener("click", event => {
        if (!cfg || perfil !== TekoPreferencias.perfil() || cfg.toggle_efeitos !== true || !volume()
            || !event.target.closest("button") || !window.AudioContext) return;
        audio ??= new AudioContext();
        const tone = audio.createOscillator();
        const gain = audio.createGain();
        gain.gain.setValueAtTime(0.035 * volume(), audio.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.07);
        tone.connect(gain).connect(audio.destination);
        tone.start();
        tone.stop(audio.currentTime + 0.07);
    });
    return { falar(fala) {
        if (!cfg || perfil !== TekoPreferencias.perfil() || cfg.toggle_narracao === false || !volume()) return;
        fala.volume = volume();
        window.speechSynthesis.speak(fala);
    }};
})();
