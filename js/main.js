/* =============================================================
 * Site behaviour (v3) — vanilla JS, no jQuery
 * theme · hero typing · filters · nav spy · counters · reveal ·
 * timeline progress · marquee · FAB visibility
 * ============================================================= */
(function () {
    'use strict';
    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const $ = (s, r) => (r || document).querySelector(s);
    const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

    /* ---------- Theme ---------- */
    function initTheme() {
        const btn = $('#theme-toggle'), icon = $('#theme-icon');
        const apply = (theme, save) => {
            document.documentElement.setAttribute('data-theme', theme);
            if (icon) icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            if (btn) btn.title = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
            if (save) { try { localStorage.setItem('portfolio-theme', theme); } catch (e) { /* ignore */ } }
        };
        let saved = null; try { const q = new URLSearchParams(location.search).get('theme'); saved = (q === 'light' || q === 'dark') ? q : localStorage.getItem('portfolio-theme'); } catch (e) { /* ignore */ }
        if (saved) apply(saved, false);
        else { const h = new Date().getHours(); apply(h >= 6 && h < 18 ? 'light' : 'dark', false); }
        if (btn) btn.addEventListener('click', () => apply(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark', true));
    }

    /* ---------- Hero typing ---------- */
    const ROLES = ['AI & LLM engineer', 'Full-stack software engineer', 'RAG & agent architect', 'Mobile & FinTech developer'];
    function initTyping() {
        const el = $('#typing-text'); if (!el) return;
        if (reduceMotion) { el.textContent = ROLES[0]; return; }
        let r = 0, c = 0, del = false;
        (function tick() {
            const word = ROLES[r];
            el.textContent = word.substring(0, del ? c - 1 : c + 1);
            c += del ? -1 : 1;
            let speed = del ? 35 : 70;
            if (!del && c === word.length) { speed = 2200; del = true; }
            else if (del && c === 0) { del = false; r = (r + 1) % ROLES.length; speed = 400; }
            setTimeout(tick, speed);
        })();
    }

    /* ---------- Skill filter + search ---------- */
    function initSkillFilter() {
        const input = $('#skill-search'), clear = $('#skill-search-clear'), tabs = $$('.filter-tab'), items = $$('.skill-item'), none = $('#skills-no-match');
        if (!items.length) return;
        let cat = 'all', q = '';
        const run = () => {
            let n = 0;
            items.forEach(it => {
                const tags = (it.dataset.category || '').toLowerCase(), name = it.textContent.toLowerCase();
                const ok = (cat === 'all' || tags.includes(cat)) && (!q || name.includes(q) || tags.includes(q));
                it.classList.toggle('is-hidden', !ok); if (ok) n++;
            });
            if (none) none.style.display = n ? 'none' : 'block';
        };
        tabs.forEach(t => t.addEventListener('click', () => { tabs.forEach(x => x.classList.remove('active')); t.classList.add('active'); cat = t.dataset.filter; run(); }));
        if (input) input.addEventListener('input', () => { q = input.value.trim().toLowerCase(); if (clear) clear.style.display = q ? 'flex' : 'none'; run(); });
        if (clear) clear.addEventListener('click', () => { input.value = ''; q = ''; clear.style.display = 'none'; run(); input.focus(); });
    }
    function initProjectFilter() {
        const tabs = $$('.project-tab'), items = $$('.project-item');
        tabs.forEach(t => t.addEventListener('click', () => {
            tabs.forEach(x => x.classList.remove('active')); t.classList.add('active');
            const f = t.dataset.filter;
            items.forEach(it => it.classList.toggle('is-hidden', !(f === 'all' || (it.dataset.category || '').includes(f))));
        }));
    }

    /* ---------- Navbar: scrolled state, spy, mobile collapse ---------- */
    function initNav() {
        const nav = $('#site-nav'); if (!nav) return;
        const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 24);
        window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
        const links = $$('.nav-link[href^="#"]');
        const sections = links.map(l => $(l.getAttribute('href'))).filter(Boolean);
        if ('IntersectionObserver' in window && sections.length) {
            const io = new IntersectionObserver(entries => {
                entries.forEach(en => { if (en.isIntersecting) { links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + en.target.id)); } });
            }, { rootMargin: '-40% 0px -50% 0px', threshold: 0 });
            sections.forEach(s => io.observe(s));
        }
        const collapse = $('#navbarNav');
        links.forEach(l => l.addEventListener('click', () => { if (collapse && collapse.classList.contains('show') && window.bootstrap) bootstrap.Collapse.getInstance(collapse)?.hide(); }));
    }

    /* ---------- Counters ---------- */
    function initCounters() {
        const els = $$('.counter-val'); if (!els.length) return;
        if (window.AjithAI) { const y = $('[data-stat="years"]'); if (y) y.dataset.target = Math.floor(AjithAI.totalYears()); }
        const animate = (el) => {
            const target = +el.dataset.target || 0, start = performance.now(), dur = reduceMotion ? 0 : 1400;
            const step = (now) => { const p = Math.min(1, (now - start) / dur); const e = 1 - Math.pow(1 - p, 3); el.textContent = Math.round(target * e); if (p < 1) requestAnimationFrame(step); else el.innerHTML = target + '<sup>+</sup>'; };
            requestAnimationFrame(step);
        };
        if ('IntersectionObserver' in window) {
            const io = new IntersectionObserver(entries => entries.forEach(en => { if (en.isIntersecting) { animate(en.target); io.unobserve(en.target); } }), { threshold: 0.4 });
            els.forEach(e => io.observe(e));
        } else els.forEach(animate);
    }

    /* ---------- Reveal on scroll (with stagger) ---------- */
    function initReveal() {
        const sel = '.ai-card, .skill-item, .project-item, .timeline-item, .stat-box, .edu-card, .section-head, .contact-card';
        const targets = $$(sel);
        targets.forEach(el => { el.classList.add('reveal'); });
        // stagger siblings
        $$('.row, .timeline, .contact-cards').forEach(parent => { $$('.reveal', parent).forEach((el, i) => el.style.setProperty('--reveal-delay', Math.min(i, 8) * 70 + 'ms')); });
        if (!('IntersectionObserver' in window) || reduceMotion) { targets.forEach(el => el.classList.add('is-visible')); return; }
        const io = new IntersectionObserver(entries => entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); } }), { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
        targets.forEach(el => io.observe(el));
    }

    /* ---------- Timeline line draw ---------- */
    function initTimeline() {
        const tl = $('.timeline'), line = $('.timeline__line'); if (!tl || !line) return;
        const update = () => {
            const r = tl.getBoundingClientRect(), vh = window.innerHeight;
            const p = Math.max(0, Math.min(1, (vh * 0.75 - r.top) / r.height));
            line.style.setProperty('--progress', p.toFixed(3));
        };
        window.addEventListener('scroll', update, { passive: true }); window.addEventListener('resize', update); update();
    }

    /* ---------- Marquee ---------- */
    function initMarquee() {
        const track = $('.marquee__track'); if (!track) return;
        track.innerHTML += track.innerHTML; // duplicate for seamless loop
    }

    /* ---------- Floating button visibility ---------- */
    function initFab() {
        const fab = $('#floating-ai-btn'), panel = $('#ai-assistant'); if (!fab || !panel) return;
        if ('IntersectionObserver' in window) {
            new IntersectionObserver(entries => fab.classList.toggle('is-visible', !entries[0].isIntersecting), { threshold: 0.15 }).observe(panel);
        } else fab.classList.add('is-visible');
    }

    /* ---------- Responsive placeholders ---------- */
    /* Long placeholders wrap (and get clipped) in narrow single-line fields,
       so swap in a short variant below the mobile breakpoint. */
    function initResponsivePlaceholders() {
        const fields = $$('[data-placeholder-sm]'); if (!fields.length) return;
        fields.forEach(f => { f.dataset.placeholderLg = f.placeholder; });
        let small = null;
        const apply = () => {
            const isSmall = document.documentElement.clientWidth <= 575.98;
            if (isSmall === small) return;
            small = isSmall;
            fields.forEach(f => { f.placeholder = isSmall ? f.dataset.placeholderSm : f.dataset.placeholderLg; });
        };
        apply();
        window.addEventListener('resize', apply, { passive: true });
        window.addEventListener('orientationchange', apply);
    }

    /* ---------- Hero word stagger ---------- */
    function initHeroWords() {
        $$('.hero__title .word').forEach((w, i) => w.style.setProperty('--i', i));
        const panelCol = $('.hero__panel-col'); if (panelCol) requestAnimationFrame(() => panelCol.classList.add('is-in'));
    }

    document.addEventListener('DOMContentLoaded', () => {
        initTheme(); initHeroWords(); initTyping(); initSkillFilter(); initProjectFilter(); initNav(); initCounters(); initReveal(); initTimeline(); initMarquee(); initFab(); initResponsivePlaceholders();
        const y = $('#year'); if (y) y.textContent = new Date().getFullYear();
    });
})();
