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