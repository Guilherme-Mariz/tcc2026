/* ════════════════════════════════════════
       PIN
    ════════════════════════════════════════ */
    const pinInput   = document.getElementById('pin-input');
    const pinOverlay = document.getElementById('pin-overlay');
    const respPage   = document.getElementById('resp-page');
    const btnPin     = document.getElementById('btn-pin');
    const pinError   = document.getElementById('pin-error');

    // Foca o input ao carregar
    window.addEventListener('load', () => { pinInput.focus(); });

    // Submete ao pressionar Enter
    pinInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') verificarPin();
        pinError.textContent = '';
        pinInput.classList.remove('error');
    });

    // Só aceita números
    pinInput.addEventListener('input', () => {
        pinInput.value = pinInput.value.replace(/\D/g, '').slice(0, 4);
    });

    function verificarPin() {
        const val = pinInput.value.trim();
        if (val.length < 4) {
            pinInput.classList.add('error');
            pinError.textContent = 'Digite os 4 dígitos do PIN.';
            setTimeout(() => pinInput.classList.remove('error'), 600);
            return;
        }

        const pinCadastrado = obterPinCadastrado();

        if (!pinCadastrado) {
            pinInput.classList.add('error');
            pinError.textContent = 'Nenhum PIN foi configurado para esta conta.';
            setTimeout(() => pinInput.classList.remove('error'), 600);
            return;
        }

        if (val === pinCadastrado) {
            sucesso();
        } else {
            erroPin();
        }
    }

    function obterPinCadastrado() {
        const pinLocal = localStorage.getItem('teko_access_pin');

        if (/^\d{4}$/.test(pinLocal || '')) {
            return pinLocal;
        }

        try {
            const sessao = JSON.parse(
                localStorage.getItem('teko_session') || '{}'
            );

            const pinSessao = String(
                sessao?.responsavel?.pin || ''
            );

            return /^\d{4}$/.test(pinSessao)
                ? pinSessao
                : '';
        } catch (erro) {
            return '';
        }
    }

    function sucesso() {
        // 1. animação de check no botão
        btnPin.classList.add('success');

        // 2. após 700ms, fecha o overlay
        setTimeout(() => {
            pinOverlay.classList.add('hiding');
            respPage.classList.add('unlocked');
            carregarDados();
            mostrarToast('Área desbloqueada!');
        }, 700);

        // 3. após transição, remove do fluxo
        setTimeout(() => {
            pinOverlay.style.display = 'none';
        }, 1250);
    }

    function erroPin() {
        pinInput.classList.add('error');
        pinError.textContent = 'PIN incorreto. Tente novamente.';
        pinInput.value = '';
        setTimeout(() => {
            pinInput.classList.remove('error');
            pinInput.focus();
        }, 700);
    }

    function bloquearDashboard() {
        // restaura overlay e blur
        pinOverlay.style.display = 'flex';
        pinOverlay.classList.remove('hiding');
        respPage.classList.remove('unlocked');
        // reset input
        pinInput.value = '';
        pinError.textContent = '';
        btnPin.classList.remove('success');
        setTimeout(() => pinInput.focus(), 100);
    }

    /* ════════════════════════════════════════
       DADOS DA SESSÃO
    ════════════════════════════════════════ */
    function carregarDados() {
        try {
            const sessao = JSON.parse(localStorage.getItem('teko_session') || '{}');

            const resp = sessao?.responsavel;
            if (resp?.nome_completo) {
                document.getElementById('resp-nome').textContent =
                    resp.nome_completo.split(' ')[0];
            }

            const cri = sessao?.crianca;
            if (cri) {
                document.getElementById('dado-nome').textContent = cri.nome || '—';
                document.getElementById('resp-crianca-nome-sub').textContent = cri.nome || 'sua criança';

                if (cri.data_nasc) {
                    const nasc = new Date(cri.data_nasc);
                    document.getElementById('dado-nasc').textContent =
                        nasc.toLocaleDateString('pt-BR');
                    const hoje = new Date();
                    let idade = hoje.getFullYear() - nasc.getFullYear();
                    const m = hoje.getMonth() - nasc.getMonth();
                    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
                    document.getElementById('dado-idade').textContent = idade + ' anos';
                }

                const generoMap = { M: 'Masculino', F: 'Feminino', O: 'Outro' };
                document.getElementById('dado-genero').textContent =
                    generoMap[cri.genero] || cri.genero || '—';
            }

            // estatísticas — zeradas até progressModel estar implementado
            document.getElementById('stat-atividades').textContent = '0';
            document.getElementById('stat-sequencia').textContent  = '0';
            document.getElementById('stat-acertos').textContent    = '0%';

            animarBarra('bar-emocoes',       'pct-emocoes',       0);
            animarBarra('bar-comunicacao',   'pct-comunicacao',   0);
            animarBarra('bar-comportamento', 'pct-comportamento', 0);

        } catch(e) { console.error('Erro ao carregar dados:', e); }
    }

    function animarBarra(barId, pctId, valor) {
        const bar = document.getElementById(barId);
        const pct = document.getElementById(pctId);
        if (!bar || !pct) return;
        requestAnimationFrame(() => {
            bar.style.width = valor + '%';
            pct.textContent = valor + '%';
        });
    }

    /* ════════════════════════════════════════
       TOAST
    ════════════════════════════════════════ */
    function mostrarToast(msg) {
        const toast = document.getElementById('toast');
        document.getElementById('toast-msg').textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2800);
    }
