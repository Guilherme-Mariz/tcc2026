document.addEventListener('DOMContentLoaded', () => {
    const bar = document.getElementById('home-progress-bar');
    const fill = document.getElementById('home-progress-fill');
    const percent = document.getElementById('home-progress-percent');
    const status = document.getElementById('home-progress-status');
    const retry = document.getElementById('home-progress-retry');
    let version = 0;
    let pending;

    const suggestion = document.getElementById('home-suggestion');
    const suggestionTitle = document.getElementById('suggestion-title');
    const suggestionDescription = document.getElementById('suggestion-description');
    const suggestionCover = document.getElementById('suggestion-cover');
    const suggestionCoverWrap = document.getElementById('suggestion-cover-wrap');
    const suggestionAction = document.getElementById('suggestion-action');

    function resetSuggestion(title, description, loading = false) {
        suggestion.removeAttribute('href');
        suggestion.setAttribute('aria-disabled', 'true');
        suggestion.setAttribute('aria-busy', String(loading));
        suggestionTitle.textContent = title;
        suggestionDescription.textContent = description;
        suggestionCoverWrap.hidden = true;
        suggestionCover.removeAttribute('src');
        suggestionAction.hidden = true;
    }

    function renderSuggestion(activity) {
        if (!activity) {
            resetSuggestion('Você concluiu todas as atividades!', 'Parabéns pelas descobertas! Você pode revisitar suas favoritas na página Atividades.');
            return;
        }
        suggestion.setAttribute('href', activity.url);
        suggestion.removeAttribute('aria-disabled');
        suggestion.setAttribute('aria-busy', 'false');
        suggestionTitle.textContent = activity.title;
        suggestionDescription.textContent = activity.description;
        suggestionCover.setAttribute('src', activity.cover);
        suggestionCoverWrap.hidden = false;
        suggestionAction.hidden = false;
    }

    function childId() {
        try {
            const child = JSON.parse(localStorage.getItem('teko_session') || '{}').crianca;
            return child?.id || child?.crianca_id || child?.child_id || null;
        } catch { return null; }
    }

    async function refresh() {
        const current = ++version;
        const id = childId();
        pending?.abort();
        const controller = new AbortController();
        pending = controller;
        bar.removeAttribute('aria-valuenow');
        bar.removeAttribute('aria-valuetext');
        bar.setAttribute('aria-busy', 'true');
        fill.style.width = '0%';
        percent.textContent = '—';
        retry.hidden = true;
        status.textContent = id ? 'Carregando progresso…' : 'Selecione uma criança para ver o progresso.';
        resetSuggestion(id ? 'Buscando sua próxima atividade…' : 'Escolha seu perfil',
            id ? 'Vamos conferir o que você ainda pode descobrir.' : 'Selecione uma criança para ver a sugestão.', Boolean(id));
        if (!id) { bar.setAttribute('aria-busy', 'false'); return; }
        const timeout = setTimeout(() => controller.abort(), 15000);
        try {
            const response = await fetch(`/api/activities/progress/${encodeURIComponent(id)}`, {
                credentials: 'include', cache: 'no-store', signal: controller.signal
            });
            const data = await response.json();
            if (!response.ok || data.success !== true || !Array.isArray(data.activities) ||
                !data.activities.length || !Array.isArray(data.completedActivityIds)) throw new Error('Unavailable');
            if (current !== version || id !== childId()) return;
            // O catálogo retornado pelo servidor contém as dez atividades disponíveis.
            // Interseção e Set impedem repetições ou IDs antigos de inflar a barra.
            const catalog = new Set(data.activities.map(activity => activity.activityId));
            const completed = new Set(data.completedActivityIds.filter(activityId => catalog.has(activityId))).size;
            const value = Math.round(completed / catalog.size * 100);
            fill.style.width = `${value}%`;
            percent.textContent = `${value}%`;
            status.textContent = `${completed} de ${catalog.size} atividades concluídas`;
            bar.setAttribute('aria-valuenow', String(value));
            bar.setAttribute('aria-valuetext', status.textContent);
            renderSuggestion(data.suggestedActivity);
        } catch {
            if (current !== version || id !== childId()) return;
            status.textContent = 'Não foi possível carregar o progresso. Tente novamente.';
            retry.hidden = false;
            resetSuggestion('Sua sugestão está indisponível', 'Use Tentar novamente na área de desempenho para carregar sua próxima atividade.');
        } finally {
            clearTimeout(timeout);
            if (current === version) bar.setAttribute('aria-busy', 'false');
        }
    }

    retry.addEventListener('click', refresh);
    window.addEventListener('teko:session-changed', refresh);
    window.addEventListener('teko:activity-saved', refresh);
    window.addEventListener('focus', refresh);
    window.addEventListener('pageshow', event => { if (event.persisted) refresh(); });
    window.addEventListener('storage', event => {
        if (event.key === 'teko_session' || event.key === null) refresh();
    });
    document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
    refresh();
});
