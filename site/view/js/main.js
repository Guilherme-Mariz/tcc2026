// ROTAS DE NAVEGAÇÃO 

function irParaLogin() {
  window.location.href = "/login";
}

function irParaRegister() {
  window.location.href = "/register";
}

function irParaIndex() {
  window.location.href = "/";
}

/* ── Lenis smooth scroll ── */
(function(){
    const lenis = {
        _current: 0, _target: 0, _raf: null,
        _ease: 0.09,
        init() {
            window.addEventListener('wheel', (e) => {
                e.preventDefault();
                this._target += e.deltaY * 0.9;
                this._target = Math.max(0, Math.min(this._target, document.body.scrollHeight - window.innerHeight));
                if (!this._raf) this._tick();
            }, { passive: false });
            window.addEventListener('touchstart', (e) => { this._touchY = e.touches[0].clientY; }, { passive: true });
            window.addEventListener('touchmove', (e) => {
                const dy = (this._touchY - e.touches[0].clientY) * 1.2;
                this._target += dy;
                this._target = Math.max(0, Math.min(this._target, document.body.scrollHeight - window.innerHeight));
                this._touchY = e.touches[0].clientY;
                if (!this._raf) this._tick();
            }, { passive: true });
        },
        _tick() {
            this._current += (this._target - this._current) * this._ease;
            if (Math.abs(this._target - this._current) < 0.1) {
                this._current = this._target;
                window.scrollTo(0, this._current);
                this._raf = null; return;
            }
            window.scrollTo(0, this._current);
            this._raf = requestAnimationFrame(() => this._tick());
        }
    };
    // Only enable on non-touch primary devices
    if (window.matchMedia('(hover: hover)').matches && window.innerWidth > 900) {
        lenis.init();
    }
})();

/* ── GSAP ScrollTrigger reveals ── */
gsap.registerPlugin(ScrollTrigger);

document.querySelectorAll('.section-reveal').forEach(el => {
    gsap.fromTo(el,
        { opacity: 0, y: 50 },
        {
            opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 82%', once: true }
        }
    );
});

/* Stagger cards destaques */
gsap.utils.toArray('.destaque-card').forEach((card, i) => {
    gsap.fromTo(card,
        { opacity: 0, y: 40 },
        {
            opacity: 1, y: 0, duration: 0.75, ease: 'power3.out', delay: i * 0.1,
            scrollTrigger: { trigger: card, start: 'top 85%', once: true }
        }
    );
});

/* Stagger depoimentos */
gsap.utils.toArray('.depoimento-card').forEach((card, i) => {
    gsap.fromTo(card,
        { opacity: 0, y: 36 },
        {
            opacity: 1, y: 0, duration: 0.75, ease: 'power3.out', delay: i * 0.12,
            scrollTrigger: { trigger: card, start: 'top 87%', once: true }
        }
    );
});

/* Stagger metodologia cards */
gsap.utils.toArray('.card-metodologia').forEach((card, i) => {
    gsap.fromTo(card,
        { opacity: 0, y: 50, scale: 0.96 },
        {
            opacity: 1, y: 0, scale: 1, duration: 0.85, ease: 'power3.out', delay: i * 0.15,
            scrollTrigger: { trigger: card, start: 'top 85%', once: true }
        }
    );
});

/* Números contador */
gsap.utils.toArray('.numero-num').forEach(el => {
    const text = el.textContent;

    // Ignora intervalos como "6 a 10 anos"
    if (text.includes('a')) return;

    const num = parseFloat(text.replace(/[^0-9.]/g, ''));

    if (!isNaN(num) && num > 1) {
        const prefix = text.match(/^\+/) ? '+' : '';
        const suffix = text.replace(/^[+\d.–]+/, '').trim();

        gsap.fromTo(
            { val: 0 },
            { val: 0 },
            {
                val: num,
                duration: 1.6,
                ease: 'power2.out',

                onUpdate: function () {
                    el.textContent =
                        prefix +
                        Math.round(this.targets()[0].val) +
                        (suffix || '');
                },

                scrollTrigger: {
                    trigger: el,
                    start: 'top 85%',
                    once: true
                }
            }
        );
    }
});

/* Trustbar items */
gsap.utils.toArray('.trust-item').forEach((item, i) => {
    gsap.fromTo(item,
        { opacity: 0, y: 16 },
        {
            opacity: 0.62, y: 0, duration: 0.55, ease: 'power2.out', delay: i * 0.08,
            scrollTrigger: { trigger: '#trustbar', start: 'top 88%', once: true }
        }
    );
});

/* Header scroll */
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

/* Mobile menu */
const overlay = document.getElementById('mobile_overlay');
const menu = document.getElementById('mobile_menu');
const mobileBtn = document.getElementById('mobile_btn');
const closeBtn = document.getElementById('mobile_close_btn');

function openMenu()  { menu.classList.add('active'); overlay.classList.add('active'); document.body.style.overflow = 'hidden'; }
function closeMenu() { menu.classList.remove('active'); overlay.classList.remove('active'); document.body.style.overflow = ''; }

mobileBtn.addEventListener('click', openMenu);
closeBtn.addEventListener('click', closeMenu);
overlay.addEventListener('click', closeMenu);
menu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));

/* ── Page Transition to Login ── */
function irParaLogin() {
    const overlay = document.getElementById('page-transition');
    const logo = overlay.querySelector('.pt-logo');

    // Phase 1: slide up overlay
    gsap.to(overlay, {
        scaleY: 1, transformOrigin: 'bottom', duration: 0.52,
        ease: 'power3.inOut',
        onComplete: () => {
            // Phase 2: show logo
            gsap.to(logo, { opacity: 1, y: 0, duration: 0.28, ease: 'power2.out',
                onComplete: () => {
                    setTimeout(() => {
                        window.location.href = 'pages/login.html';
                    }, 340);
                }
            });
        }
    });
}

/* Smooth anchor scroll */
document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
        const target = document.querySelector(a.getAttribute('href'));
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

/* ── Carrossel Metodologia ── */
(function () {
    const track = document.querySelector('.carrossel-track');
    const dots  = document.querySelectorAll('.carrossel-dot');
    if (!track) return;

    let current = 0;
    const total = track.children.length;

    function goTo(i) {
        current = (i + total) % total;
        track.style.transform = `translateX(-${current * 100}%)`;
        dots.forEach((d, idx) => d.classList.toggle('active', idx === current));
    }

    document.querySelector('.carrossel-prev').addEventListener('click', () => goTo(current - 1));
    document.querySelector('.carrossel-next').addEventListener('click', () => goTo(current + 1));
    dots.forEach((d, i) => d.addEventListener('click', () => goTo(i)));
})();

/* sessao teko.ia  */

(function () {
    'use strict';

    const block  = document.getElementById('tia-block');
    const canvas = document.getElementById('tia-canvas');
    const cursor = document.getElementById('tia-cursor');
    if (!block || !canvas) return;

    /* ── WebGL: ondas pretas com reação ao mouse ── */
    const gl = canvas.getContext('webgl', { antialias: true, alpha: true });
    if (!gl) return;

    const VS = `
        attribute vec2 a_pos;
        void main(){ gl_Position = vec4(a_pos, 0., 1.); }
    `;

    const FS = `
        precision highp float;
        uniform float u_time;
        uniform vec2  u_res;
        uniform vec2  u_mouse;

        float wave(vec2 uv, float freq, float speed, float amp, float phase){
            return sin(uv.x * freq + u_time * speed + phase) * amp;
        }

        void main(){
            vec2 uv = gl_FragCoord.xy / u_res;

            /* influência do mouse */
            vec2 m  = u_mouse; m.y = 1.0 - m.y;
            float md = distance(uv, m);
            float mp = smoothstep(0.38, 0.0, md) * 0.065;

            float lines = 0.0;
            float thick  = 0.009;

            for(int i = 0; i < 6; i++){
                float fi  = float(i);
                float off = fi * 0.16 + 0.06;
                float spd = 0.42 + fi * 0.11;
                float frq = 6.0  + fi * 1.8;
                float amp = 0.028 + fi * 0.004;
                float ph  = fi * 1.15;

                float wl = wave(uv, frq, spd, amp, ph)
                         + mp * sin(uv.x * (4.5 + fi) + u_time * (0.4 + fi * 0.15));

                float dist = abs(uv.y - off - wl);
                lines += smoothstep(thick, 0.0, dist) * (1.0 - fi * 0.10);
            }

            float alpha = clamp(lines * 1.5, 0.0, 1.0);
            gl_FragColor = vec4(0.0, 0.0, 0.0, alpha * 0.52);
        }
    `;

    function compile(src, type) {
        const s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        return s;
    }

    const prog = gl.createProgram();
    gl.attachShader(prog, compile(VS, gl.VERTEX_SHADER));
    gl.attachShader(prog, compile(FS, gl.FRAGMENT_SHADER));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uTime  = gl.getUniformLocation(prog, 'u_time');
    const uRes   = gl.getUniformLocation(prog, 'u_res');
    const uMouse = gl.getUniformLocation(prog, 'u_mouse');

    function resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width  = Math.floor(block.offsetWidth  * dpr);
        canvas.height = Math.floor(block.offsetHeight * dpr);
        gl.viewport(0, 0, canvas.width, canvas.height);
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(block);

    /* mouse tracking */
    let mx = 0.5, my = 0.5, txm = 0.5, tym = 0.5;

    block.addEventListener('mousemove', e => {
        const r = block.getBoundingClientRect();
        txm = (e.clientX - r.left) / r.width;
        tym = (e.clientY - r.top)  / r.height;
        if (cursor) {
            cursor.style.left = (e.clientX - r.left) + 'px';
            cursor.style.top  = (e.clientY - r.top)  + 'px';
        }
    }, { passive: true });

    block.addEventListener('touchmove', e => {
        const r = block.getBoundingClientRect();
        const t = e.touches[0];
        txm = (t.clientX - r.left) / r.width;
        tym = (t.clientY - r.top)  / r.height;
    }, { passive: true });

    /* render loop — só quando visível */
    let visible = false;
    const start = performance.now();

    const io = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (visible) tick(performance.now());
    }, { threshold: 0.05 });
    io.observe(block);

    function tick(now) {
        if (!visible) return;
        requestAnimationFrame(tick);
        mx += (txm - mx) * 0.07;
        my += (tym - my) * 0.07;
        const t = (now - start) * 0.001;
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform1f(uTime, t);
        gl.uniform2f(uRes, canvas.width, canvas.height);
        gl.uniform2f(uMouse, mx, my);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    /* ── hover desktop ── */
    const isTouchDevice = window.matchMedia('(hover: none)').matches;

    if (!isTouchDevice) {
        block.addEventListener('mouseenter', () => block.classList.add('hovered'));
        block.addEventListener('mouseleave', () => {
            block.classList.remove('hovered');
            if (cursor) { cursor.style.left = '-100px'; cursor.style.top = '-100px'; }
        });
    } else {
        /* mobile: ativa ao entrar no viewport */
        const mobIO = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setTimeout(() => block.classList.add('hovered'), 250);
                mobIO.disconnect();
            }
        }, { threshold: 0.45 });
        mobIO.observe(block);
    }

    /* GSAP scroll reveal */
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.fromTo(block,
            { opacity: 0, y: 30 },
            {
                opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
                scrollTrigger: { trigger: block, start: 'top 85%', once: true }
            }
        );
    }

})();