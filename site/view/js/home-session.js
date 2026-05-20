/* ═══════════════════════════════════════════════════════
   home-session.js  —  preenche a home com dados da sessão
   
   Adicione na home.html, antes do </body>:
   <script src="../js/home-session.js"></script>
   
   (substitui o bloco <script> inline que estava na home)
   ═══════════════════════════════════════════════════════ */

(function () {
    'use strict';

    /* ── lê a sessão salva pelo login.js ── */
    function lerSessao() {
        try {
            return JSON.parse(localStorage.getItem('teko_session') || '{}');
        } catch (_) {
            return {};
        }
    }

    /* ── extrai o nome da criança com fallbacks seguros ──
       Ordem de prioridade:
       1. sessao.crianca.nome          ← estrutura nova (após este fix)
       2. sessao.responsavel.nome      ← fallback: mostra o nome do resp.
       3. sessao.user.email → prefixo  ← estrutura legada (antes do fix)
       ─────────────────────────────────────────────────── */
    function obterNome(sessao) {
        const bruto =
            sessao?.crianca?.nome        ||
            sessao?.responsavel?.nome    ||
            sessao?.user?.email?.split('@')[0] ||
            null;

        if (!bruto) return null;

        // capitaliza apenas o primeiro nome (ex: "lucas henrique" → "Lucas")
        return bruto
            .trim()
            .split(' ')[0]
            .charAt(0).toUpperCase() +
            bruto.trim().split(' ')[0].slice(1).toLowerCase();
    }

    /* ── aplica nome, avatar e streak na DOM ── */
    function aplicar() {
        const sessao = lerSessao();

        /* sem sessão → redireciona para login */
        const temSessao =
            sessao?.crianca?.nome     ||
            sessao?.responsavel?.nome ||
            sessao?.user?.email;

        if (!temSessao) {
            const pagina = window.location.pathname;
            const ehPublica = ['/login', '/register', '/'].some(p => pagina.includes(p));
            if (!ehPublica) window.location.href = '/pages/login.html';
            return;
        }

        const nome = obterNome(sessao);

        /* nome na saudação */
        const elNome = document.getElementById('child-name');
        if (elNome && nome) elNome.textContent = nome;

        /* avatar (sidebar desktop + mobile) */
        document.querySelectorAll('#user-avatar, #user-avatar-mobile').forEach(el => {
            if (el) el.textContent = nome ? nome.charAt(0).toUpperCase() : 'T';
        });

        /* streak */
        const streak = parseInt(localStorage.getItem('teko_streak'), 10) || 1;
        const elStreak = document.getElementById('streak-count');
        if (elStreak) elStreak.textContent = streak;

        /* anima barras de progresso */
        document.querySelectorAll('.progress-fill').forEach(bar => {
            const alvo = bar.style.width || '0%';
            bar.style.width = '0%';
            requestAnimationFrame(() => setTimeout(() => { bar.style.width = alvo; }, 150));
        });
    }

    /* ── inicializa ── */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', aplicar);
    } else {
        aplicar();
    }

    /* ── logout global (use onclick="tekoLogout()" em qualquer botão) ── */
    window.tekoLogout = function () {
        localStorage.removeItem('teko_session');
        localStorage.removeItem('teko_streak');
        window.location.href = '/pages/login.html';
    };

})();
