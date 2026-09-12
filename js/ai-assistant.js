/* =============================================================
 * Ajith AI — Chat UI + engine adapters (v3)
 * -------------------------------------------------------------
 * Engines:
 *   builtin  — AjithAI reasoning engine (js/ai-engine.js), instant, offline
 *   webllm   — real LLM in the browser via WebGPU (@mlc-ai/web-llm),
 *              loaded on demand; uses the built-in retrieval as RAG context
 *
 * UI: streaming reveal, live reasoning trace, follow-up chips, page
 * actions, copy/regenerate, voice input, persistence, expand mode.
 * ============================================================= */
(function () {
    'use strict';

    const STORE_KEY = 'ajith-ai-chat-v3';
    const SETTINGS_KEY = 'ajith-ai-settings-v3';
    const MAX_HISTORY = 60;
    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* `thinks: true` — the model natively emits a <think>…</think> chain of thought,
       so the trace can stream the model's own reasoning instead of scripted steps. */
    const WEBLLM_MODELS = [
        { id: 'SmolLM2-360M-Instruct-q4f16_1-MLC', label: 'SmolLM2 360M (tiny · ~250 MB)' },
        { id: 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC', label: 'Qwen2.5 0.5B (fast · ~400 MB)' },
        { id: 'Qwen3-0.6B-q4f16_1-MLC', label: 'Qwen3 0.6B (thinking · ~450 MB)', thinks: true },
        { id: 'Llama-3.2-1B-Instruct-q4f16_1-MLC', label: 'Llama 3.2 1B (~700 MB)' },
        { id: 'Qwen3-1.7B-q4f16_1-MLC', label: 'Qwen3 1.7B (thinking · ~1.1 GB)', thinks: true },
        { id: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC', label: 'Qwen2.5 1.5B (~1 GB)' }
    ];
    const ENGINE_META = {
        builtin: { label: 'Built-in', icon: 'fa-microchip', title: 'Built-in reasoning', desc: 'Instant, offline. Intent + entity + BM25 retrieval over the CV.' },
        webllm: { label: 'WebGPU LLM', icon: 'fa-bolt', title: 'In-browser LLM (WebGPU)', desc: 'Runs a real open model on your GPU. One-time download, then offline.' }
    };

    const WEBLLM_VERSION = '0.2.85';
    const WEBLLM_CDNS = [
        `https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@${WEBLLM_VERSION}/lib/index.js`,
        `https://unpkg.com/@mlc-ai/web-llm@${WEBLLM_VERSION}/lib/index.js`
    ];

    /* Resolved against this script's own URL so the worker is found no matter
       which page embeds the assistant. */
    const WORKER_URL = (function () {
        try { return new URL('ai-worker.js', (document.currentScript && document.currentScript.src) || location.href).href; }
        catch (e) { return 'js/ai-worker.js'; }
    })();

    let engine, settings, history = [], busy = false, aborter = null, lastUserText = '';
    let webllm = { engine: null, model: null, worker: null }, webllmModule = null;
    let download = { seq: 0, active: false, promise: null, model: null, card: null };
    let onInitProgress = null;
    const INPUT_PLACEHOLDER = 'Ask about experience, skills, projects… (try /help)';
    let el = {};

    /* ---------------- helpers ---------------- */
    const $ = (id) => document.getElementById(id);
    const sleep = (ms) => new Promise(r => setTimeout(r, reduceMotion ? 0 : ms));
    const escapeHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    function loadJSON(key, fallback) { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; } }
    function saveJSON(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* private mode */ } }
    function nearBottom() { return el.body.scrollHeight - el.body.scrollTop - el.body.clientHeight < 140; }
    function scrollToBottom(force) { if (force || nearBottom()) el.body.scrollTop = el.body.scrollHeight; }
    function setThinking(on) {
        el.panel.classList.toggle('is-thinking', on);
        el.status.classList.toggle('is-busy', on);
        if (window.AjithVisuals) {
            window.AjithVisuals.setExcitement(on ? 1 : 0);
            /* While the LLM generates, the canvas drops to ~30fps: the GPU is busy with
               the model and a full-rate redraw is what visitors feel as stutter. */
            if (typeof window.AjithVisuals.setEconomy === 'function') window.AjithVisuals.setEconomy(on && settings && settings.engine === 'webllm');
        }
        el.send.classList.toggle('is-stop', on);
        el.send.innerHTML = on ? '<i class="fas fa-stop"></i>' : '<i class="fas fa-paper-plane"></i>';
        el.send.title = on ? 'Stop' : 'Send';
    }

    /* ---------------- rendering ---------------- */
    function actionChipsHtml(actions) {
        if (!actions || !actions.length) return '';
        return `<div class="action-chips">${actions.map(a => `<a class="action-chip" href="${escapeHtml(a.href)}"${/^https?:/.test(a.href) ? ' target="_blank" rel="noopener"' : ''}${a.download ? ' download' : ''}><i class="${a.brand ? 'fab' : 'fas'} ${a.icon}"></i>${escapeHtml(a.label)}</a>`).join('')}</div>`;
    }
    function thoughtHtml(text, live) {
        return `<div class="ai-thought${live ? ' is-live' : ''}"><i class="fas fa-brain"></i><div class="ai-thought__txt">${escapeHtml(text)}</div></div>`;
    }
    function traceHtml(steps, meta, open) {
        return `<details class="ai-trace"${open ? ' open' : ''}>
            <summary class="ai-trace__summary"><i class="fas fa-chevron-right chev"></i><i class="fas ${meta.thought ? 'fa-brain' : 'fa-lightbulb'}"></i> ${escapeHtml(meta.title || 'Reasoning')}<span class="meta">${escapeHtml(meta.sub || '')}</span></summary>
            <div class="ai-trace__steps">${steps.map(s => `<div class="ai-trace__step done"><i class="fas ${s.icon || 'fa-check'}"></i><span>${s.text}</span></div>`).join('')}${meta.thought ? thoughtHtml(meta.thought, false) : ''}</div>
        </details>`;
    }
    /* Real chain of thought straight from the model. Reasoning models (Qwen3) emit
       <think>…</think> on their own; the others are asked for the same shape in the
       system prompt. Some chat templates pre-fill the opening tag, so a lone closing
       tag counts too. A half-written tag at the tail is hidden until it completes. */
    const stripPartialTag = (s) => s.replace(/<\/?[a-z]*$/i, '');
    function splitThinking(raw) {
        const s = String(raw || '');
        const open = s.indexOf('<think>'), close = s.indexOf('</think>');
        if (close >= 0) {
            const from = open >= 0 && open < close ? open + 7 : 0;
            const before = open > 0 ? s.slice(0, open) : '';
            return { thought: s.slice(from, close), answer: before + s.slice(close + 8), thinking: false };
        }
        if (open >= 0) return { thought: stripPartialTag(s.slice(open + 7)), answer: s.slice(0, open), thinking: true };
        return { thought: '', answer: stripPartialTag(s), thinking: false };
    }
    function userMsgHtml(text) {
        return `<div class="chat-msg user"><div class="chat-avatar"><i class="fas fa-user"></i></div><div class="chat-bubble-wrap"><div class="chat-bubble">${escapeHtml(text)}</div></div></div>`;
    }
    function botShell(id) {
        return `<div class="chat-msg bot" id="${id}">
            <div class="chat-avatar"><i class="fas fa-brain"></i></div>
            <div class="chat-bubble-wrap">
                <div class="chat-bubble">
                    <div class="ai-trace" id="${id}-trace">
                        <div class="ai-trace__summary"><i class="fas fa-brain fa-spin"></i> Thinking<span class="thinking-dots"><span></span><span></span><span></span></span></div>
                        <div class="ai-trace__steps" id="${id}-steps"></div>
                    </div>
                    <div class="chat-answer" id="${id}-answer"></div>
                    <div class="chat-extra" id="${id}-extra"></div>
                </div>
                <div class="chat-actions" id="${id}-actions"></div>
            </div>
        </div>`;
    }
    function actionsBarHtml(entry) {
        return `<button type="button" data-act="copy" title="Copy answer"><i class="far fa-copy"></i> Copy</button>
                <button type="button" data-act="regen" title="Regenerate"><i class="fas fa-redo"></i> Retry</button>
                ${entry && entry.meta && entry.meta.engine && entry.meta.engine !== 'builtin' ? `<span class="mono" style="font-size:.66rem;color:var(--text-dim)">via ${escapeHtml(entry.meta.engine)}</span>` : ''}`;
    }
    function renderStatic(entry) {
        if (entry.role === 'user') { el.body.insertAdjacentHTML('beforeend', userMsgHtml(entry.text)); return; }
        if (entry.role === 'system') { el.body.insertAdjacentHTML('beforeend', `<div class="chat-msg system"><div class="chat-bubble">${entry.html}</div></div>`); return; }
        const id = 'm' + Math.random().toString(36).slice(2, 8);
        const meta = entry.meta || {};
        const trace = (meta.reasoning && meta.reasoning.length) || meta.thought ? traceHtml(meta.reasoning || [], { title: meta.traceTitle || 'Reasoning', sub: meta.traceSub || '', thought: meta.thought }, false) : '';
        el.body.insertAdjacentHTML('beforeend', `<div class="chat-msg bot" id="${id}"><div class="chat-avatar"><i class="fas fa-brain"></i></div><div class="chat-bubble-wrap"><div class="chat-bubble">${trace}<div class="chat-answer">${entry.html}</div><div class="chat-extra">${actionChipsHtml(meta.actions)}</div></div><div class="chat-actions">${actionsBarHtml(entry)}</div></div></div>`);
        bindActions($(id), entry);
        // animate bars
        requestAnimationFrame(() => $(id).querySelectorAll('.bar > span').forEach(b => b.style.width = b.style.getPropertyValue('--w')));
    }
    function bindActions(msgEl, entry) {
        if (!msgEl) return;
        msgEl.querySelectorAll('[data-act]').forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.dataset.act === 'copy') {
                    const txt = entry.text || msgEl.querySelector('.chat-answer').innerText;
                    navigator.clipboard && navigator.clipboard.writeText(txt).then(() => { btn.innerHTML = '<i class="fas fa-check"></i> Copied'; setTimeout(() => btn.innerHTML = '<i class="far fa-copy"></i> Copy', 1500); });
                } else if (btn.dataset.act === 'regen') {
                    if (entry.prompt) send(entry.prompt, { regenerate: true });
                }
            });
        });
    }
    function setChips(list) {
        el.chips.innerHTML = (list || []).map((t, i) => `<button type="button" class="prompt-chip" style="animation-delay:${i * 60}ms"><i class="fas fa-level-up-alt" style="transform:rotate(90deg);font-size:.7em;opacity:.7"></i>${escapeHtml(t)}</button>`).join('');
        el.chips.querySelectorAll('.prompt-chip').forEach(b => b.addEventListener('click', () => send(b.textContent.trim())));
    }
    const DEFAULT_CHIPS = ['What is his AI experience?', 'Summarise his career', 'How many years of React?', 'Which projects used Node.js?', 'Is he open to remote work?', 'How do I contact him?'];

    /* ---------------- typewriter reveal over real DOM ---------------- */
    function revealElement(container, html, signal) {
        return new Promise(resolve => {
            container.innerHTML = html;
            const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
            const nodes = [];
            let n; while ((n = walker.nextNode())) nodes.push({ node: n, text: n.nodeValue });
            const total = nodes.reduce((a, b) => a + b.text.length, 0);
            const cursor = document.createElement('span'); cursor.className = 'stream-cursor';
            if (reduceMotion || total < 40 || document.hidden) { finish(); return; }
            // hide element descendants until their first text arrives
            container.querySelectorAll('*').forEach(e => { if (!e.classList.contains('bar')) e.classList.add('tw-hidden'); });
            nodes.forEach(x => x.node.nodeValue = '');
            let i = 0, pos = 0;
            const cps = Math.min(1400, Math.max(320, total * 1.6)); // chars per second scales with length
            let lastT = performance.now();
            function tick(now) {
                if ((signal && signal.aborted) || document.hidden) { finish(); return; } // no animation while aborted or tab hidden
                let budget = Math.max(1, Math.round((now - lastT) / 1000 * cps)); lastT = now;
                while (budget > 0 && i < nodes.length) {
                    const cur = nodes[i];
                    if (pos === 0) { let p = cur.node.parentElement; while (p && p !== container) { p.classList.remove('tw-hidden'); p = p.parentElement; } cur.node.parentElement.appendChild(cursor); }
                    const take = Math.min(budget, cur.text.length - pos);
                    pos += take; budget -= take;
                    cur.node.nodeValue = cur.text.slice(0, pos);
                    if (pos >= cur.text.length) { i++; pos = 0; }
                }
                scrollToBottom();
                if (i < nodes.length) schedule(tick); else finish();
            }
            const schedule = (fn) => document.hidden ? setTimeout(() => fn(performance.now()), 16) : requestAnimationFrame(fn);
            schedule(tick);
            function finish() {
                nodes.forEach(x => x.node.nodeValue = x.text);
                container.querySelectorAll('.tw-hidden').forEach(e => e.classList.remove('tw-hidden'));
                cursor.remove();
                container.querySelectorAll('.bar > span').forEach(b => b.style.width = b.style.getPropertyValue('--w'));
                scrollToBottom();
                resolve();
            }
        });
    }

    /* ---------------- LLM adapters ---------------- */
    function buildMessages(userText, grounded) {
        /* The retrieved context rides in the final USER turn, not the system prompt —
           see buildPrompt() in ai-engine.js for why. */
        const prompt = engine.buildPrompt(userText, grounded);
        const offDomain = !!(grounded && grounded.offDomain);
        const wantThinking = !offDomain, native = modelThinks(settings.webllmModel);
        /* Models that don't reason natively are asked for the same <think> shape, so the
           trace shows what the model actually worked through rather than a script. */
        const nudge = wantThinking && !native
            ? '\n\nTHINKING: start your reply with a <think> block — two or three short sentences working out what is being asked and which facts you were given answer it. Close it with </think>, then write the visitor-facing answer. Never mention the block or repeat it in the answer.'
            : '';
        const msgs = [{ role: 'system', content: prompt.system + nudge }];
        /* Earlier turns carry the plain question, not its context block — replaying six
           retrieval dumps would bury the current one. */
        const turns = history.filter(h => h.role === 'user' || h.role === 'bot').slice(-4);
        for (const t of turns) msgs.push({ role: t.role === 'user' ? 'user' : 'assistant', content: stripThought(t.text || '').slice(0, 600) });
        msgs.push({ role: 'user', content: prompt.user });
        /* Off-domain replies are a one-line "not in the CV" — Qwen3 reads /no_think in
           the last user turn as "answer without reasoning", which keeps it that short. */
        if (native && !wantThinking) {
            for (let i = msgs.length - 1; i > 0; i--) if (msgs[i].role === 'user') { msgs[i].content += ' /no_think'; break; }
        }
        return msgs;
    }
    const stripThought = (t) => splitThinking(t).answer.trim() || String(t || '');

    /* The prompt fences the verified answer in triple quotes, and small models
       sometimes copy a fence or an opening quote into their reply along with it. */
    function cleanAnswer(text) {
        let t = String(text || '').replace(/^\s*"{3,}\s*/, '').replace(/\s*"{3,}\s*$/, '').trim();
        /* The whole reply quoted back verbatim — the fence copied, not a quotation. */
        if (t.length > 1 && t.startsWith('"') && t.endsWith('"') && !t.slice(1, -1).includes('"')) t = t.slice(1, -1).trim();
        const quotes = (t.match(/"/g) || []).length;
        if (quotes % 2 === 1) { if (t.startsWith('"')) t = t.slice(1); else if (t.endsWith('"')) t = t.slice(0, -1); }
        return t.trim();
    }

    /* Last line of defence for questions the CV does not cover. A refusal is short and
       makes no claim; anything that endorses Ajith for the thing asked about, or runs
       on far past a two-sentence "not in his profile", is the failure mode we are
       guarding against. Returns why it was rejected, or null if the reply is fine. */
    /* Two tiers, because "not in his CV" covers two different questions. For a field he
       has never worked in (plumbing, medicine) ANY claim of relevant background is
       wrong. For a technology he simply hasn't listed (Rust, Kafka) naming his actual
       stack alongside the "not listed" is correct and useful — only a claim about the
       technology that was asked about is not. */
    const FIT_CLAIMS = [
        /\bgood (?:fit|match|choice)\b/i, /\bwell[- ]suited\b/i, /\bsuitable for\b/i,
        /\bideal (?:for|candidate)\b/i, /\bmakes him\b/i, /\bthis means he\b/i,
        /\bhe can help you\b/i, /\bqualified (?:for|as|in)\b/i
    ];
    const BACKGROUND_CLAIMS = [
        /\b(?:has|with|brings) (?:extensive |deep |strong |significant )?(?:experience|expertise|skills?|background) (?:in|with)\b/i,
        /\b(?:highly )?(?:skilled|experienced|proficient|expert)\b/i
    ];
    /* A reply that only offers alternatives ("I can tell you about his projects
       instead") leaves the actual question unanswered and reads as a dodge. */
    const DENIAL = /\b(?:not|isn't|is not|no|doesn't|does not|don't|won't|outside|beyond|unrelated|nothing)\b/i;
    function offDomainProblem(answer, off) {
        const text = String(answer || '');
        const words = text.split(/\s+/).filter(Boolean).length;
        const strict = !off || off.kind !== 'unlisted';
        if (FIT_CLAIMS.some(re => re.test(text))) return 'it argued he is a fit for something the CV does not cover';
        if (strict && BACKGROUND_CLAIMS.some(re => re.test(text))) return 'it claimed relevant experience the CV does not list';
        if (!DENIAL.test(text)) return 'it never actually said the topic is outside his profile';
        const cap = strict ? 90 : 130;
        if (words > cap) return `it ran to ${words} words instead of a short "not in his profile"`;
        return null;
    }

    /* In-scope answers get the same treatment for the one failure that matters on a
       portfolio: a small model that drifts past the verified answer starts inventing
       employers and products ("IBM Cloud Pak for React"). */
    function inventedContent(answer, groundedText) {
        const terms = engine.unsupportedTerms(answer, groundedText);
        if (!terms.length) return null;
        return `it introduced ${terms.slice(0, 3).map(t => '“' + t + '”').join(', ')}, which appear nowhere in the CV`;
    }

    /* The library is imported as a pinned, pre-built ESM *file* rather than through
       jsDelivr's on-demand /+esm build service, which 503s on a cold bundle for a
       package this large. Each CDN is tried in turn so one bad edge node isn't fatal. */
    async function importWebLLM() {
        if (webllmModule) return webllmModule;
        const errors = [];
        for (const url of WEBLLM_CDNS) {
            try {
                const mod = await import(url);
                if (!mod || typeof mod.CreateMLCEngine !== 'function') throw new Error('unexpected module shape');
                webllmModule = mod;
                return mod;
            } catch (e) {
                errors.push(`${new URL(url).host}: ${e && e.message ? e.message : e}`);
            }
        }
        throw new Error('Could not load the WebLLM library from any CDN (' + errors.join(' · ') + '). Check your network or ad-blocker, then retry.');
    }
    /* Boot the worker and wait for it to confirm it has the library, because a
       WebWorkerMLCEngine starts posting from its own constructor and a worker that
       never imported anything would swallow those messages forever. `addEventListener`
       is used rather than `onmessage`, which WebWorkerMLCEngine claims for itself. */
    function startEngineWorker() {
        return new Promise((resolve, reject) => {
            let worker;
            try { worker = new Worker(WORKER_URL, { type: 'module' }); }
            catch (e) { reject(e); return; }
            let settled = false;
            const finish = (fn, arg) => {
                if (settled) return;
                settled = true;
                worker.removeEventListener('message', onMessage);
                worker.removeEventListener('error', onError);
                fn(arg);
            };
            const kill = () => { try { worker.terminate(); } catch (e) { /* already gone */ } };
            const onMessage = (e) => {
                const d = e.data;
                if (!d || !d.__ajith) return;
                if (d.__ajith === 'ready') finish(resolve, worker);
                else if (d.__ajith === 'fail') { kill(); finish(reject, new Error(d.error || 'worker could not load WebLLM')); }
            };
            const onError = (e) => { kill(); finish(reject, new Error((e && e.message) || 'worker failed to start')); };
            worker.addEventListener('message', onMessage);
            worker.addEventListener('error', onError);
            worker.postMessage({ __ajith: 'init', urls: WEBLLM_CDNS });
        });
    }
    /* One long-lived engine is reused for every model: engine.unload() aborts an
       in-flight engine.reload(), which is how switching models mid-download pauses the
       old one. Shards already fetched stay in the browser's Cache API, so going back to
       a paused model resumes from where it stopped rather than starting over.
       It lives in a worker so weight fetching, cache writes, the WASM runtime and the
       WebGPU dispatch loop never block the page — on the main thread they stall
       rendering badly enough to make the whole machine feel stuck. A browser without
       module workers, or a blocked worker URL, falls back to an in-page engine: still
       works, just with the jank. */
    async function getMLCEngine() {
        if (!navigator.gpu) throw new Error('WebGPU is not available in this browser. Use a recent Chrome or Edge on desktop, or switch back to the built-in engine.');
        const mod = await importWebLLM();
        if (webllm.engine) return webllm.engine;
        const onProgress = (p) => { if (onInitProgress) onInitProgress(p); };
        try {
            webllm.worker = await startEngineWorker();
            webllm.engine = new mod.WebWorkerMLCEngine(webllm.worker, { initProgressCallback: onProgress });
        } catch (e) {
            webllm.worker = null;
            if (window.console && console.warn) console.warn('Ajith AI: running the model on the main thread — the worker did not start (' + (e && e.message ? e.message : e) + ').');
            webllm.engine = new mod.MLCEngine({ initProgressCallback: onProgress });
        }
        return webllm.engine;
    }
    /* unload()/interruptGenerate() are async once the engine is in a worker; a
       rejection from an abort we asked for is expected, not an error. */
    function quietly(fn) {
        try { const r = fn(); if (r && typeof r.catch === 'function') r.catch(() => { }); }
        catch (e) { /* older builds are synchronous */ }
    }
    /* reload() *resolves* rather than throwing when unload() aborts it, so a superseded
       load looks exactly like a successful one. Every load therefore carries a sequence
       number and a stale one is not allowed to claim the engine, the card or the chat. */
    async function runModelLoad(model, seq) {
        const eng = await getMLCEngine();
        if (seq !== download.seq) return null;
        // Only ever one model in flight — drop whatever is loaded or still downloading.
        webllm.model = null;
        try { await eng.unload(); } catch (e) { /* ignore */ }
        if (seq !== download.seq) return null;
        onInitProgress = (p) => { if (seq === download.seq) updateDownload(p); };
        await eng.reload(model);
        if (seq !== download.seq) return null;
        webllm.model = model;
        return eng;
    }
    /* Models that have completed a full load before, so their weights are in the
       browser's Cache API. Used to decide what to auto-load and how to label the card. */
    function readyModels() { return Array.isArray(settings.readyModels) ? settings.readyModels : []; }
    function isCached(id) { return readyModels().indexOf(id) >= 0; }
    function markCached(id) {
        if (isCached(id)) return;
        settings.readyModels = readyModels().concat([id]);
        saveJSON(SETTINGS_KEY, settings);
    }
    function modelLabel(id) { const m = WEBLLM_MODELS.find(x => x.id === id); return m ? m.label.split(' (')[0] : String(id).split('-q4')[0]; }
    function modelThinks(id) { const m = WEBLLM_MODELS.find(x => x.id === id); return !!(m && m.thinks); }

    /* ----- model download UX: progress card + disabled chat ----- */
    function setChatDisabled(on, placeholder) {
        el.input.disabled = on; el.send.disabled = on; el.mic.disabled = on; el.clear.disabled = on;
        el.chips.classList.toggle('is-disabled', on);
        el.panel.classList.toggle('is-loading-model', on);
        if (on) el.input.placeholder = placeholder || 'Downloading model…'; else restorePlaceholder();
        document.querySelectorAll('[data-ai-prompt]').forEach(b => b.disabled = on);
    }
    /* The hero constellation redraws ~150 nodes and their edges every frame. That is
       fine on its own, but it competes with model loading for the same main thread and
       the same GPU, so it stands down until the model is ready. */
    function pauseVisuals(on) {
        if (window.AjithVisuals && typeof window.AjithVisuals.setPaused === 'function') window.AjithVisuals.setPaused(on);
    }

    function removeDownloadCards() {
        el.body.querySelectorAll('.ai-dl').forEach(n => n.remove());
        download.card = null;
    }
    function renderDownloadCard(label, cached) {
        removeDownloadCards();
        el.body.insertAdjacentHTML('beforeend', `<div class="chat-msg system ai-dl" id="ai-dl"><div class="chat-bubble ai-dl__card" role="status" aria-live="polite">
            <div class="ai-dl__head"><i class="fas ${cached ? 'fa-microchip' : 'fa-download'}"></i><b id="ai-dl-title">${cached ? 'Loading' : 'Downloading'} ${escapeHtml(label)}</b><span class="ai-dl__pct" id="ai-dl-pct">0%</span></div>
            <div class="ai-dl__bar"><span id="ai-dl-bar" style="width:0%"></span></div>
            <div class="ai-dl__text" id="ai-dl-text">${cached ? 'Already downloaded — restoring it to your GPU.' : 'Preparing… the model is fetched once and cached by your browser. Chat is paused until it\'s ready.'}</div>
            <div class="ai-dl__foot"><span class="ai-dl__eta" id="ai-dl-eta"><i class="fas fa-circle-notch fa-spin"></i> starting</span><button type="button" class="action-chip" id="ai-dl-cancel"><i class="fas fa-microchip"></i> Use built-in instead</button></div>
        </div></div>`);
        download.card = $('ai-dl');
        $('ai-dl-cancel').addEventListener('click', () => switchEngine('builtin'));
        scrollToBottom(true);
    }
    /* WebLLM reports progress once per shard and once per cache write — hundreds of
       times for a 1 GB model. Painting the card on a frame tick instead of on every
       report keeps the download from thrashing layout on top of everything else. */
    let dlFrame = null, dlLatest = null;
    function updateDownload(p) {
        dlLatest = p;
        if (dlFrame) return;
        dlFrame = requestAnimationFrame(() => { dlFrame = null; const q = dlLatest; dlLatest = null; if (q && download.active) paintDownload(q); });
    }
    function stopDownloadPaint() {
        if (dlFrame) cancelAnimationFrame(dlFrame);
        dlFrame = null; dlLatest = null;
    }
    function paintDownload(p) {
        const pct = Math.max(0, Math.min(100, Math.round((p && typeof p.progress === 'number' ? p.progress : 0) * 100)));
        const text = p && p.text ? String(p.text).replace(/\[.*?\]/g, '').replace(/\s+/g, ' ').trim() : '';
        const gpuPhase = /gpu|shader|loading/i.test(text) && pct >= 100;
        // The browser can evict cached weights; if real fetching starts, correct the label.
        // WebLLM says "Start to fetch params" even on a pure cache restore, so key off the
        // download phase specifically ("Fetching param cache") and not the word "fetch".
        const fetching = /fetching param/i.test(text) && !/from cache/i.test(text);
        if (download.card && fetching && download.labelledCached) {
            download.labelledCached = false;
            const t = $('ai-dl-title'); if (t) t.textContent = 'Downloading ' + modelLabel(download.model);
        }
        if (download.card) {
            const pctEl = $('ai-dl-pct'), bar = $('ai-dl-bar'), txt = $('ai-dl-text'), eta = $('ai-dl-eta');
            if (pctEl) pctEl.textContent = pct + '%';
            if (bar) bar.style.width = pct + '%';
            if (txt && text) txt.textContent = text.length > 160 ? text.slice(0, 160) + '…' : text;
            if (eta) eta.innerHTML = gpuPhase ? '<i class="fas fa-bolt"></i> compiling for your GPU' : (p && p.timeElapsed ? `<i class="fas fa-clock"></i> ${Math.round(p.timeElapsed)}s elapsed` : '<i class="fas fa-circle-notch fa-spin"></i> downloading');
        }
        el.progress.hidden = false; el.progressBar.style.width = pct + '%';
        setStatus(`Loading ${modelLabel(download.model || settings.webllmModel)} · ${pct}%`, 'busy');
    }
    function finishDownload(ok, err) {
        const label = modelLabel(download.model || settings.webllmModel);
        download.active = false; download.promise = null; onInitProgress = null;
        stopDownloadPaint();
        pauseVisuals(false);
        removeDownloadCards();           // the card only ever represents an active download
        hideProgress();
        setChatDisabled(false);
        if (ok) { markCached(download.model || settings.webllmModel); announceActiveModel(label); }
        else {
            addSystemNote(`<i class="fas fa-exclamation-triangle"></i> <b>${escapeHtml(label)}</b> failed to load — ${escapeHtml(err && err.message ? err.message : String(err))}`);
            if (settings.engine === 'webllm') { settings.engine = 'builtin'; saveJSON(SETTINGS_KEY, settings); renderEngineMenu(); refreshStatus(); }
        }
    }
    function announceActiveModel(label) {
        addSystemNote(`<i class="fas fa-check-circle"></i> Now using <b>${escapeHtml(label)}</b> — a real LLM running on your GPU, grounded in Ajith's CV via retrieval.${settings.engine !== 'webllm' ? ' Switch the engine to <b>WebGPU LLM</b> to use it.' : ''}`);
    }
    /* Pause whatever is downloading and clear its card. Fetched shards stay cached, so
       coming back to this model later resumes instead of restarting. */
    function cancelModelLoad() {
        if (!download.active) return;
        download.seq++;                  // invalidates the in-flight load
        download.active = false; download.promise = null; download.model = null;
        onInitProgress = null;
        stopDownloadPaint();
        pauseVisuals(false);
        webllm.model = null;
        removeDownloadCards();
        setChatDisabled(false);
        hideProgress();
        if (webllm.engine) quietly(() => webllm.engine.unload());
    }
    function loadWebLLM() {
        const model = settings.webllmModel;
        if (!download.active && webllm.model === model) return Promise.resolve(webllm.engine);
        if (download.active && download.model === model) {
            if (settings.engine === 'webllm') setChatDisabled(true, `Downloading ${modelLabel(model)}… chat resumes when it's ready`);
            return download.promise;
        }
        return startModelLoad(model);
    }
    function startModelLoad(model) {
        const seq = ++download.seq;      // supersedes anything already in flight
        const paused = download.active ? download.model : null;
        const label = modelLabel(model);
        download.active = true; download.model = model; onInitProgress = null;
        download.labelledCached = isCached(model);
        if (paused) addSystemNote(`<i class="fas fa-pause-circle"></i> Paused the <b>${escapeHtml(modelLabel(paused))}</b> download and started <b>${escapeHtml(label)}</b> — what it fetched is cached, so resuming it later picks up where it stopped.`);
        pauseVisuals(true);
        renderDownloadCard(label, download.labelledCached);
        setChatDisabled(true, `${download.labelledCached ? 'Loading' : 'Downloading'} ${label}… chat resumes when it's ready`);
        updateDownload({ progress: 0, text: '' });
        download.promise = runModelLoad(model, seq)
            .then(eng => { if (seq === download.seq) finishDownload(true); return eng; })
            .catch(err => { if (seq === download.seq) finishDownload(false, err); throw err; });
        return download.promise;
    }
    async function* streamWebLLM(messages, signal, opts) {
        const eng = await loadWebLLM();
        if (!eng) throw new Error('Model loading was interrupted by a model switch.');
        opts = opts || {};
        /* Thinking eats tokens before a single word of the answer is written, so the
           budget grows when the trace is going to show it. */
        const chunks = await eng.chat.completions.create({
            messages, stream: true,
            temperature: opts.temperature || 0.3,
            max_tokens: opts.maxTokens || 420,
            /* Sub-1B models fall into paragraph loops once they run out of things to
               say; penalising tokens they have already used is what breaks the cycle. */
            frequency_penalty: opts.frequencyPenalty != null ? opts.frequencyPenalty : 0.7,
            presence_penalty: opts.presencePenalty != null ? opts.presencePenalty : 0.4
        });
        const seen = new Set();
        let acc = '', done = false;
        /* Walking away from a half-finished stream leaves MLCEngine mid-generation and
           the next request never resolves, so stopping early means asking the engine to
           stop and then draining what is already queued — never just returning. */
        const halt = () => { done = true; if (typeof eng.interruptGenerate === 'function') quietly(() => eng.interruptGenerate()); };
        /* The consumer breaks out of this generator when the visitor hits Stop, which
           abandons `chunks` mid-flight; the finally is what still frees the engine. */
        try {
            for await (const c of chunks) {
                if (signal.aborted) { halt(); continue; }
                if (done) continue;
                const d = c.choices && c.choices[0] && c.choices[0].delta && c.choices[0].delta.content;
                if (!d) continue;
                yield d;
                /* Penalties reduce looping but don't end it — a model can restate a whole
                   sentence in different tokens. Any substantial sentence arriving twice means
                   the answer is over. */
                acc += d;
                const parts = acc.split(/(?<=[.!?])\s+/);
                acc = parts.pop() || '';
                for (const part of parts) {
                    const key = part.toLowerCase().replace(/[^a-z0-9 ]+/g, '').replace(/\s+/g, ' ').trim();
                    if (key.length < 30) continue;
                    if (seen.has(key)) { halt(); break; }
                    seen.add(key);
                }
            }
        } finally { halt(); }
    }
    function hideProgress() { el.progress.hidden = true; el.progressBar.style.width = '0%'; refreshStatus(); }

    /* ---------------- status / engine UI ---------------- */
    function setStatus(text, state) {
        el.status.innerHTML = `<i class="dot"></i> ${escapeHtml(text)}`;
        el.status.classList.toggle('is-busy', state === 'busy');
        el.status.classList.toggle('is-error', state === 'error');
    }
    function refreshStatus() {
        if (settings.engine === 'builtin') setStatus('Built-in · runs in your browser');
        else setStatus(webllm.model === settings.webllmModel ? `WebGPU · ${settings.webllmModel.split('-q4')[0]} loaded` : `WebGPU · ${settings.webllmModel.split('-q4')[0]} (loads on first message)`);
        el.engineBtn.innerHTML = `<span class="chip"></span><i class="fas ${ENGINE_META[settings.engine].icon}"></i><span class="lbl">${ENGINE_META[settings.engine].label}</span><i class="fas fa-chevron-down" style="font-size:.6rem;opacity:.7"></i>`;
    }
    function renderEngineMenu() {
        const m = el.engineMenu;
        m.innerHTML = Object.keys(ENGINE_META).map(k => `<button type="button" class="ai-engine__opt${settings.engine === k ? ' is-selected' : ''}" data-engine="${k}"><i class="fas ${ENGINE_META[k].icon}"></i><span><b>${ENGINE_META[k].title}${k === 'builtin' ? '<span class="tag">default</span>' : ''}${k === 'webllm' && !navigator.gpu ? '<span class="tag" style="background:rgba(239,68,68,.15);color:#ef4444">no WebGPU</span>' : ''}</b><small>${ENGINE_META[k].desc}</small></span></button>`).join('');
        const cfg = document.createElement('div'); cfg.className = 'ai-engine__cfg';
        let cfgHtml = '';
        if (settings.engine === 'webllm') {
            cfgHtml += `<label>Model</label><select id="ai-webllm-model">${WEBLLM_MODELS.map(x => `<option value="${x.id}"${x.id === settings.webllmModel ? ' selected' : ''}>${x.label}</option>`).join('')}</select>
                <div class="hint">Downloads once to your browser cache, then runs offline on your GPU. Answers are grounded in the same CV retrieval the built-in engine uses (RAG). The trace streams the model's own reasoning as it arrives — the <b>thinking</b> models reason out loud by design, the others are asked for a short thought block.</div>`;
        }
        if (cfgHtml) {
            cfg.innerHTML = cfgHtml;
            m.appendChild(cfg);
            cfg.querySelector('#ai-webllm-model').addEventListener('change', (e) => selectModel(e.target.value));
        }
        m.querySelectorAll('[data-engine]').forEach(b => b.addEventListener('click', () => switchEngine(b.dataset.engine)));
    }
    function selectModel(id) {
        if (id === settings.webllmModel && (download.active || webllm.model === id)) return;
        settings.webllmModel = id; saveJSON(SETTINGS_KEY, settings); refreshStatus();
        if (settings.engine !== 'webllm') { addSystemNote(`Model set to <b>${escapeHtml(modelLabel(id))}</b> — it loads when you switch to the <b>WebGPU LLM</b> engine.`); return; }
        if (webllm.model === id && !download.active) { announceActiveModel(modelLabel(id)); return; }
        loadWebLLM().catch(() => { /* surfaced by finishDownload */ });
    }
    function switchEngine(k) {
        if (!ENGINE_META[k]) return;
        const prev = settings.engine;
        settings.engine = k; saveJSON(SETTINGS_KEY, settings);
        renderEngineMenu(); refreshStatus();
        if (k === 'webllm') {
            if (!navigator.gpu) { addSystemNote('This browser has no <b>WebGPU</b> — the in-browser LLM needs a recent Chrome or Edge on desktop. Staying on the built-in engine.'); settings.engine = 'builtin'; saveJSON(SETTINGS_KEY, settings); renderEngineMenu(); refreshStatus(); return; }
            if (webllm.model === settings.webllmModel && !download.active) { announceActiveModel(modelLabel(settings.webllmModel)); return; }
            loadWebLLM().catch(() => { /* surfaced by finishDownload */ });
        } else if (prev !== k) {
            const paused = download.active ? modelLabel(download.model) : null;
            cancelModelLoad();
            addSystemNote(`Engine switched to <b>${ENGINE_META[k].title}</b>.${paused ? ` The <b>${escapeHtml(paused)}</b> download was paused — what it fetched is cached, so resuming it later picks up where it stopped.` : ''}`);
        }
    }
    function addSystemNote(html) {
        el.body.insertAdjacentHTML('beforeend', `<div class="chat-msg system"><div class="chat-bubble">${html}</div></div>`);
        scrollToBottom(true);
    }

    /* ---------------- main send flow ---------------- */
    async function send(rawText, opts) {
        opts = opts || {};
        const text = String(rawText || '').trim();
        if (!text || busy) return;
        if (download.active && settings.engine === 'webllm') { addSystemNote('⏳ The model is still downloading — chat resumes automatically when it\'s ready.'); return; }
        if (/^\/(clear|reset)$/i.test(text)) { clearChat(); return; }
        if (/^\/engine\b/i.test(text)) { el.engine.classList.add('is-open'); el.input.value = ''; return; }

        busy = true; lastUserText = text;
        try { await sendInner(text, opts); }
        catch (err) { console.error('[AjithAI] send failed', err); addSystemNote('Something went wrong while answering — please try again.'); }
        finally { setThinking(false); busy = false; aborter = null; }
    }
    async function sendInner(text, opts) {
        el.input.value = ''; autoGrow();
        if (!opts.regenerate) { el.body.insertAdjacentHTML('beforeend', userMsgHtml(text)); history.push({ role: 'user', text }); }
        el.chips.innerHTML = '';
        setThinking(true);
        scrollToBottom(true);
        aborter = new AbortController();
        const signal = aborter.signal;
        const t0 = performance.now();

        // 1. local reasoning (always — provides trace, retrieval, fallback answer)
        const res = engine.ask(text);
        const id = 'msg-' + Date.now();
        el.body.insertAdjacentHTML('beforeend', botShell(id));
        const stepsEl = $(id + '-steps'), traceEl = $(id + '-trace'), answerEl = $(id + '-answer'), extraEl = $(id + '-extra'), actionsEl = $(id + '-actions');
        scrollToBottom(true);

        const useLLM = settings.engine !== 'builtin';
        const offDomain = !!res.offDomain;
        const showThought = useLLM && !offDomain;
        const steps = res.reasoning.slice();
        if (useLLM && offDomain) steps.push({ icon: 'fa-shield-halved', text: `Nothing in the CV covers this — the model gets a scope-only prompt with no résumé to draw on, and its reply is checked before it is shown.` });
        if (useLLM) steps.push({ icon: 'fa-magic', text: `Handing retrieved context to ${settings.webllmModel.split('-q4')[0]} (WebGPU) as RAG context${showThought ? ' — its own reasoning streams below' : ''}…` });

        // 2. unfold trace — only the step still running spins, the ones behind it settle
        let liveStep = null, liveStepData = null;
        const settleStep = () => {
            if (!liveStep || liveStep.classList.contains('done')) { liveStep = null; return; }
            liveStep.classList.add('done');
            const ic = liveStep.querySelector('i');
            if (ic) ic.className = 'fas ' + ((liveStepData && liveStepData.icon) || 'fa-check');
            liveStep = null;
        };
        for (let i = 0; i < steps.length; i++) {
            if (signal.aborted) break;
            settleStep();
            stepsEl.insertAdjacentHTML('beforeend', `<div class="ai-trace__step"><i class="fas fa-circle-notch fa-spin"></i><span>${steps[i].text}</span></div>`);
            liveStep = stepsEl.lastElementChild; liveStepData = steps[i];
            scrollToBottom();
            await sleep(useLLM ? 0 : 110 + Math.random() * 150);
        }
        // the hand-off step keeps spinning while the model generates; anything else is finished here
        if (!useLLM || signal.aborted) settleStep();
        await sleep(useLLM ? 0 : 120);

        let finalHtml = res.html, finalText = res.text, engineUsed = 'builtin', llmError = null;
        let thought = '', thinkMs = 0;

        // 3. LLM generation (streamed) or built-in reveal
        if (useLLM && !signal.aborted) {
            try {
                const native = modelThinks(settings.webllmModel);
                const messages = buildMessages(text, res);
                const stream = streamWebLLM(messages, signal, {
                    maxTokens: offDomain ? 120 : showThought ? (native ? 1400 : 700) : 380,
                    temperature: offDomain ? 0.2 : showThought && native ? 0.6 : 0.3
                });
                let acc = '', raf = null, thoughtEl = null, thoughtTxt = null;
                const streamT0 = performance.now();
                answerEl.innerHTML = '<span class="stream-cursor"></span>';
                /* The model's thinking and its answer arrive in one token stream; the
                   split is re-derived each frame so a tag arriving mid-chunk still
                   routes the text to the right place. */
                const paint = () => {
                    settleStep();   // tokens are arriving — the hand-off is done
                    const part = splitThinking(acc);
                    if (showThought && part.thought.trim()) {
                        if (!thoughtEl) {
                            stepsEl.insertAdjacentHTML('beforeend', thoughtHtml('', true));
                            thoughtEl = stepsEl.lastElementChild;
                            thoughtTxt = thoughtEl.querySelector('.ai-thought__txt');
                        }
                        thought = part.thought.trim();
                        thoughtTxt.textContent = thought;
                        thoughtTxt.scrollTop = thoughtTxt.scrollHeight;
                    }
                    if (thoughtEl && !part.thinking && thoughtEl.classList.contains('is-live')) {
                        thoughtEl.classList.remove('is-live');
                        thinkMs = performance.now() - streamT0;
                    }
                    const ans = part.answer.trim();
                    answerEl.innerHTML = (ans ? AjithAI.mdToHtml(ans) : '') + '<span class="stream-cursor"></span>';
                    scrollToBottom();
                };
                for await (const chunk of stream) {
                    if (signal.aborted) break;
                    acc += chunk;
                    if (!raf) raf = requestAnimationFrame(() => { raf = null; paint(); });
                }
                if (raf) cancelAnimationFrame(raf);
                const part = splitThinking(acc);
                thought = showThought ? part.thought.trim() : '';   // off-domain: a model that thinks anyway keeps it to itself
                const answer = cleanAnswer(part.answer);
                if (!thinkMs && thought) thinkMs = performance.now() - streamT0;
                const rejected = !answer ? null
                    : offDomain ? offDomainProblem(answer, res.offDomain)
                        : inventedContent(answer, res.text);
                if (rejected) {
                    /* The prompt is as tight as it can be, but a 360M model can still
                       talk itself into a "good fit" answer or invent an employer.
                       Showing the built-in reply instead keeps a wrong claim about
                       Ajith off the page, and the trace says what was dropped. */
                    steps.push({ icon: 'fa-triangle-exclamation', text: `Discarded the model's reply — ${rejected}. Answering from the CV index instead.` });
                    answerEl.innerHTML = finalHtml;
                } else if (answer) {
                    finalText = answer; finalHtml = AjithAI.mdToHtml(answer); engineUsed = settings.engine;
                    answerEl.innerHTML = finalHtml;
                    answerEl.querySelectorAll('.bar > span').forEach(b => b.style.width = b.style.getPropertyValue('--w'));
                } else if (part.thought.trim() && !signal.aborted) {
                    steps.push({ icon: 'fa-exclamation-triangle', text: 'The model used its whole token budget thinking and never reached an answer — the built-in engine answered instead.' });
                }
            } catch (e) {
                llmError = e && e.message ? e.message : String(e);
                hideProgress();
            }
        }

        // 4. finalise trace
        settleStep();   // nothing is still running by here (stream ended, errored or aborted)
        const elapsed = ((performance.now() - t0) / 1000).toFixed(1);
        const traceTitle = thought ? `Thought for ${((thinkMs || (performance.now() - t0)) / 1000).toFixed(1)}s` : `Reasoned for ${elapsed}s`;
        const traceSub = `${thought ? modelLabel(settings.webllmModel) + ' · its own words' : res.intent.replace(/_/g, ' ') + ' · ' + Math.round(res.confidence * 100) + '%'}${engineUsed !== 'builtin' && !thought ? ' · ' + engineUsed : ''}`;
        if (llmError) steps.push({ icon: 'fa-exclamation-triangle', text: `LLM engine failed (${escapeHtml(llmError)}) — answering with the built-in engine instead.` });
        traceEl.outerHTML = traceHtml(steps, { title: traceTitle, sub: traceSub, thought: thought }, false);

        // 5. reveal built-in answer (typewriter) when no LLM text was produced
        if (engineUsed === 'builtin' && !signal.aborted) {
            const notice = llmError ? `<div class="notice"><i class="fas fa-exclamation-triangle"></i> ${escapeHtml(llmError).slice(0, 140)}</div>` : '';
            await revealElement(answerEl, notice + res.html, signal);
        } else if (signal.aborted && !answerEl.textContent.trim()) {
            answerEl.innerHTML = res.html;
        }
        answerEl.querySelector('.stream-cursor') && answerEl.querySelector('.stream-cursor').remove();

        // 6. actions, follow-ups, persist
        extraEl.innerHTML = actionChipsHtml(res.actions);
        const entry = { role: 'bot', text: finalText, html: answerEl.innerHTML, prompt: text, meta: { reasoning: steps, traceTitle, traceSub, thought: thought, actions: res.actions, engine: engineUsed, intent: res.intent } };
        actionsEl.innerHTML = actionsBarHtml(entry);
        bindActions($(id), entry);
        history.push(entry);
        if (history.length > MAX_HISTORY) history = history.slice(-MAX_HISTORY);
        saveJSON(STORE_KEY, history);
        setChips(res.followups && res.followups.length ? res.followups : DEFAULT_CHIPS);
        scrollToBottom(true);
        if (window.AjithVisuals) window.AjithVisuals.burst(6);
    }

    function clearChat() {
        history = []; saveJSON(STORE_KEY, history); engine.reset();
        el.body.innerHTML = '';
        welcome();
        setChips(DEFAULT_CHIPS);
        el.input.focus();
    }
    function welcome() {
        const yrs = AjithAI.totalYearsLabel();
        const html = AjithAI.mdToHtml(`👋 Hi, I'm **Ajith's AI assistant**. I run entirely in your browser — no server, no API keys, nothing you type leaves this page.\n\nAsk me about his **${yrs}** of full-stack work, his **AI/LLM projects**, specific technologies, or how to **get in touch**. Try a suggestion below, or type \`/help\`.`);
        const entry = { role: 'bot', text: 'Welcome', html, meta: { actions: [] } };
        renderStatic(entry);
    }

    /* ---------------- expand mode ---------------- */
    /* Focusing the chat expands it to full screen; clicking away puts it back.
       The two states have very different boxes, so the transition is a FLIP:
       the panel is always laid out at its *destination* size, then an inverted
       transform fakes the starting box and animates away. Only `transform`
       changes per frame, so the browser composites instead of re-laying out
       a scrolling message list behind two backdrop filters. */
    const MORPH_MS = 360;
    const MORPH_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
    let expanded = false, landing = false, morphTimer = null;

    function reducedMotion() {
        try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; }
    }

    /* Body scroll lock, minus the sideways jolt of a disappearing scrollbar. */
    function lockScroll(on) {
        if (on) {
            const gap = window.innerWidth - document.documentElement.clientWidth;
            document.body.style.paddingRight = gap > 0 ? gap + 'px' : '';
            document.body.classList.add('ai-expanded');
        } else {
            document.body.classList.remove('ai-expanded');
            document.body.style.paddingRight = '';
        }
    }

    /* Moving a subtree in the DOM blurs whatever inside it had focus, and both the
       expand and the collapse reparent the panel. Carry the caret across the move so
       a half-typed question keeps its cursor and the user never has to click twice. */
    function keepFocus(mutate) {
        const active = document.activeElement;
        const held = active && active !== document.body && el.panel.contains(active);
        let sel = null;
        if (held && typeof active.selectionStart === 'number') {
            try { sel = [active.selectionStart, active.selectionEnd, active.selectionDirection || 'none']; } catch (e) { /* not a text field */ }
        }
        mutate();
        if (!held) return;
        // preventScroll: the panel is mid-flight, and letting the browser chase the
        // field would fight the morph.
        try { active.focus({ preventScroll: true }); } catch (e) { active.focus(); }
        if (sel) { try { active.setSelectionRange(sel[0], sel[1], sel[2]); } catch (e) { /* ignore */ } }
    }

    function setPanelBox(r) {
        const st = el.panel.style;
        st.top = r.top + 'px'; st.left = r.left + 'px';
        st.width = r.width + 'px'; st.height = r.height + 'px';
    }

    /* Commit whatever the in-flight morph was heading towards, immediately. */
    function endMorph() {
        clearTimeout(morphTimer); morphTimer = null;
        const st = el.panel.style;
        // Drop the transform with transitions off, so a morph that was cut short (or
        // frozen in a background tab) snaps to its destination instead of easing back
        // through the panel's default 0.5s transform transition.
        st.transition = 'none';
        st.transform = 'none';
        void el.panel.offsetWidth;
        st.transition = ''; st.transform = ''; st.transformOrigin = '';
        el.panel.classList.remove('is-morphing');
        if (!landing) return;
        landing = false;
        el.panel.classList.remove('is-landing');
        st.top = st.left = st.width = st.height = '';
        keepFocus(() => el.placeholder.insertAdjacentElement('afterend', el.panel));
        el.placeholder.classList.remove('is-active');
        el.placeholder.style.height = '';
    }

    function morph(from) {
        if (reducedMotion()) { endMorph(); return; }
        const to = el.panel.getBoundingClientRect();
        if (!to.width || !to.height || !from.width) { endMorph(); return; }
        // Panel scrolled out of sight (expanded from the floating button): a flight
        // across two screens is noise, so grow gently in place instead.
        if (from.bottom < 40 || from.top > window.innerHeight - 40) {
            from = { left: to.left + to.width * 0.04, top: to.top + to.height * 0.05, width: to.width * 0.92, height: to.height * 0.9 };
        }
        const dx = from.left - to.left, dy = from.top - to.top;
        const sx = from.width / to.width, sy = from.height / to.height;
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1 && Math.abs(sx - 1) < 0.01 && Math.abs(sy - 1) < 0.01) { endMorph(); return; }
        const st = el.panel.style;
        el.panel.classList.add('is-morphing');
        st.transition = 'none';
        st.transformOrigin = 'top left';
        st.transform = `translate3d(${dx}px, ${dy}px, 0) scale(${sx}, ${sy})`;
        void el.panel.offsetWidth;                     // paint the inverted frame first
        st.transition = `transform ${MORPH_MS}ms ${MORPH_EASE}`;
        st.transform = 'translate3d(0, 0, 0) scale(1, 1)';
        morphTimer = setTimeout(endMorph, MORPH_MS + 60);
    }

    function setExpanded(on) {
        on = !!on;
        if (on === expanded) return;
        const from = el.panel.getBoundingClientRect();   // includes any in-flight transform
        endMorph();
        expanded = on;

        if (on) {
            // Freeze the hero slot at exactly the box the panel is vacating. Read the
            // layout height, not `from` — if this interrupted a collapse, `from` is a
            // half-animated box and would leave the slot the wrong size.
            el.placeholder.style.height = el.panel.offsetHeight + 'px';
            el.placeholder.classList.add('is-active');
            // Reparent to <body> so the fixed panel escapes the hero's stacking context
            keepFocus(() => document.body.appendChild(el.panel));
            el.panel.classList.add('is-expanded');
            lockScroll(true);
        } else {
            lockScroll(false);                            // restore the scrollbar before measuring
            const slot = el.placeholder.getBoundingClientRect();
            el.panel.classList.remove('is-expanded');
            el.panel.classList.add('is-landing');         // stays fixed + unclipped until it arrives
            setPanelBox(slot);
            landing = true;
        }
        el.backdrop.classList.toggle('is-visible', on);
        // Re-class the icon rather than replacing it. Swapping the node out detaches
        // whatever the click landed on, and a detached target answers `closest` and
        // `contains` with a flat no for the rest of that event.
        const icon = el.expand.querySelector('i');
        if (icon) icon.className = on ? 'fas fa-compress' : 'fas fa-expand';
        else el.expand.innerHTML = on ? '<i class="fas fa-compress"></i>' : '<i class="fas fa-expand"></i>';
        el.expand.title = on ? 'Exit full screen (Esc)' : 'Full screen';
        morph(from);
        scrollToBottom(true);
    }

    /* ---------------- voice input ---------------- */
    /* Voice is a progressive enhancement, and plenty of real devices advertise it
       and then fail on first use — Android WebView and the in-app browsers built
       on it ship the constructor with no speech service behind it, and anything
       served over plain http is refused outright. Support is therefore probed
       before the button is ever shown, and a fatal failure retires it for good.

       Answers are never read back: the assistant listens, it does not speak. */

    const VOICE_BLOCKED_KEY = 'ajith-ai-voice-unsupported';
    const SPEECH_LANG = 'en-US';
    const speech = { input: false, listening: false };

    /* Every failure here used to be swallowed, so a blocked mic looked identical to a
       dead button. Each one now says what happened and what to do about it. */
    const VOICE_ERRORS = {
        'not-allowed': 'Microphone access is blocked for this site. Allow it from the icon in your browser\'s address bar, then try again.',
        'service-not-allowed': 'Your browser has no speech service available, so voice input has been turned off here. Typing works exactly the same.',
        'audio-capture': 'No microphone was found, so voice input has been turned off. Connect one and reload to use it.',
        'network': 'Voice input needs a network connection — your browser transcribes speech through its own service, not on this page.',
        'no-speech': 'I didn\'t catch anything — try again and start speaking once the mic turns red.',
        'language-not-supported': 'Your browser can\'t transcribe English here, so voice input has been turned off.',
        'aborted': null  // user cancelled on purpose
    };
    /* Errors that mean "this browser cannot do speech at all" rather than "not this
       time". After one of these the mic is hidden and stays hidden on return visits. */
    const VOICE_FATAL = ['service-not-allowed', 'audio-capture', 'language-not-supported'];

    function voiceBlocked() { try { return !!localStorage.getItem(VOICE_BLOCKED_KEY); } catch (e) { return false; } }
    function blockVoice() { try { localStorage.setItem(VOICE_BLOCKED_KEY, '1'); } catch (e) { /* private mode */ } }

    /* Synchronous half of the probe — everything knowable before touching hardware. */
    function probeVoiceInput() {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) return 'no SpeechRecognition API';
        if (window.isSecureContext === false) return 'insecure origin';
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return 'no microphone API';
        if (voiceBlocked()) return 'failed on this device before';
        // `; wv)` is the Android WebView marker; the rest are in-app browsers built on it.
        if (/;\s*wv\)|\bFB(AN|AV|_IAB)|\bInstagram\b|\bLine\/|\bMicroMessenger\b/i.test(navigator.userAgent || '')) return 'in-app browser';
        try { const probe = new SR(); if (!probe || typeof probe.start !== 'function') return 'unusable SpeechRecognition'; }
        catch (e) { return 'SpeechRecognition could not be created'; }
        return null;
    }
    /* Asynchronous half: is there actually an input device? Before permission is
       granted labels are blank but kinds are still listed, so an empty list means the
       browser is withholding everything rather than that the machine has no mic. */
    async function hasMicrophone() {
        try {
            if (!navigator.mediaDevices.enumerateDevices) return true;
            const devices = await navigator.mediaDevices.enumerateDevices();
            return !devices.length || devices.some(d => d.kind === 'audioinput');
        } catch (e) { return true; }
    }

    function setVoiceInputEnabled(on, why) {
        speech.input = on;
        el.mic.hidden = !on;
        if (!on && why) console.info('[AjithAI] voice input unavailable:', why);
    }

    function initSpeech() {
        el.mic.hidden = true;                                  // stay hidden until the probe passes
        const why = probeVoiceInput();
        if (why) { setVoiceInputEnabled(false, why); return; }
        hasMicrophone().then(found => {
            if (!found) { setVoiceInputEnabled(false, 'no audio input device'); return; }
            setVoiceInputEnabled(true);
            wireMic();
        });
    }

    function wireMic() {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        let rec = null, cancelled = false, heard = '';
        function setListening(on) {
            speech.listening = on;
            el.mic.classList.toggle('is-listening', on);
            el.mic.title = on ? 'Stop listening' : 'Voice input';
            if (on) el.input.placeholder = 'Listening…';
            else if (!el.input.disabled) restorePlaceholder();
        }
        el.mic.addEventListener('click', () => {
            if (speech.listening) { cancelled = true; try { rec.stop(); } catch (e) { /* ignore */ } return; }
            if (busy || el.input.disabled) return;
            cancelled = false; heard = '';
            rec = new SR();
            rec.lang = SPEECH_LANG; rec.interimResults = true; rec.continuous = false;
            rec.onstart = () => setListening(true);            // only turn red once actually live
            rec.onresult = (e) => {
                let t = ''; for (const r of e.results) t += r[0].transcript;
                heard = t.trim(); el.input.value = t; autoGrow();
            };
            rec.onerror = (e) => {
                const msg = VOICE_ERRORS[e.error];
                if (msg) addSystemNote(`<i class="fas fa-microphone-slash"></i> ${msg}`);
                else if (!cancelled && e.error) addSystemNote(`<i class="fas fa-microphone-slash"></i> Voice input failed (${escapeHtml(e.error)}).`);
                cancelled = true;                              // never auto-send after a failure
                if (VOICE_FATAL.indexOf(e.error) >= 0) { blockVoice(); setVoiceInputEnabled(false, e.error); }
            };
            // Sending on end (not on the final result) keeps a deliberate stop from firing one off.
            rec.onend = () => { setListening(false); if (!cancelled && heard) send(heard); };
            try { rec.start(); }
            catch (err) { setListening(false); addSystemNote(`<i class="fas fa-microphone-slash"></i> Couldn't start voice input (${escapeHtml(err.message || err.name || String(err))}).`); }
        });
    }

    /* main.js owns the narrow/wide placeholder swap for every field on the page; the
       assistant only contributes the richer wide variant and asks for it back after
       borrowing the field for "Listening…" or a model download. */
    function restorePlaceholder() {
        el.input.dataset.placeholderLg = INPUT_PLACEHOLDER;
        if (window.refreshPlaceholders) window.refreshPlaceholders();
        else el.input.placeholder = INPUT_PLACEHOLDER;
    }
    function autoGrow() {
        el.input.style.height = 'auto';
        const h = el.input.scrollHeight;
        el.input.style.height = Math.min(120, h) + 'px';
        el.input.style.overflowY = h > 120 ? 'auto' : 'hidden';
    }

    /* ---------------- init ---------------- */
    function init() {
        el = {
            panel: $('ai-assistant'), body: $('ai-chat-body'), input: $('ai-chat-input'), send: $('ai-send-btn'), form: $('ai-form'),
            chips: $('ai-chips'), status: $('ai-status'), clear: $('ai-clear-btn'), expand: $('ai-expand-btn'), info: $('ai-info'), infoBtn: $('ai-info-btn'),
            engine: $('ai-engine'), engineBtn: $('ai-engine-btn'), engineMenu: $('ai-engine-menu'), progress: $('ai-progress'), progressBar: $('ai-progress-bar'),
            mic: $('ai-mic-btn'), backdrop: $('ai-backdrop'), placeholder: $('ai-panel-placeholder'), fab: $('floating-ai-btn')
        };
        if (!el.panel || !el.body || !window.AjithAI) return;
        engine = AjithAI.createEngine();
        settings = Object.assign({ engine: 'builtin', webllmModel: WEBLLM_MODELS[0].id }, loadJSON(SETTINGS_KEY, {}));
        try { const qe = new URLSearchParams(location.search).get('engine'); if (qe && ENGINE_META[qe]) settings.engine = qe; } catch (e) { /* ignore */ }
        if (!ENGINE_META[settings.engine]) settings.engine = 'builtin';
        if (!WEBLLM_MODELS.some(m => m.id === settings.webllmModel)) settings.webllmModel = WEBLLM_MODELS[0].id;
        history = loadJSON(STORE_KEY, []);
        if (!Array.isArray(history)) history = [];

        // restore or welcome
        if (history.length) { history.forEach(renderStatic); el.body.insertAdjacentHTML('beforeend', `<div class="chat-msg system"><div class="chat-bubble">Conversation restored · <a href="#" id="ai-restore-clear">start fresh</a></div></div>`); $('ai-restore-clear').addEventListener('click', (e) => { e.preventDefault(); clearChat(); }); }
        else welcome();
        setChips(DEFAULT_CHIPS);
        renderEngineMenu(); refreshStatus();
        if (settings.engine === 'webllm') {
            if (!navigator.gpu) { settings.engine = 'builtin'; saveJSON(SETTINGS_KEY, settings); renderEngineMenu(); refreshStatus(); }
            else if (isCached(settings.webllmModel)) {
                // Weights are already in the browser cache — restore them now so the first
                // message doesn't pay for the GPU compile.
                loadWebLLM().catch(() => { /* surfaced by finishDownload */ });
            } else {
                addSystemNote(`<b>WebGPU LLM</b> selected — ${escapeHtml(modelLabel(settings.webllmModel))} loads on your first message, or <a href="#" id="ai-load-now">load it now</a>.`);
                const ln = $('ai-load-now'); if (ln) ln.addEventListener('click', (e) => { e.preventDefault(); loadWebLLM().catch(() => { /* surfaced by finishDownload */ }); });
            }
        }
        requestAnimationFrame(() => scrollToBottom(true));

        // events
        el.form.addEventListener('submit', (e) => { e.preventDefault(); if (busy) { aborter && aborter.abort(); return; } send(el.input.value); });
        el.input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); el.form.requestSubmit ? el.form.requestSubmit() : el.form.dispatchEvent(new Event('submit')); } if (e.key === 'Escape' && expanded) { e.stopPropagation(); setExpanded(false); } });
        el.input.addEventListener('input', autoGrow);
        el.clear.addEventListener('click', clearChat);
        el.expand.addEventListener('click', () => { const on = !expanded; setExpanded(on); if (on) el.input.focus(); });
        el.backdrop.addEventListener('click', () => setExpanded(false));

        /* Clicking the message input is what opens the chat — not a click anywhere in
           the panel, which turned reading an answer or reaching for a header control
           into a jump to full screen. Expansion waits for the `click` rather than the
           pointerdown because it reparents the panel, and moving the element
           mid-gesture breaks the browser's own focus and text selection.

           What the collapse needs is read from the *pointerdown* target instead: a
           handler that runs first can detach the node the click started on, and a
           detached target reports itself outside everything. */
        let pointerActive = false, downInPanel = false, downOnPrompt = false, downOnFab = false, tabbing = false;
        document.addEventListener('pointerdown', (e) => {
            const t = e.target;
            pointerActive = true; tabbing = false;
            downInPanel = el.panel.contains(t);
            downOnPrompt = !!(t.closest && t.closest('[data-ai-prompt]'));
            downOnFab = !!(el.fab && el.fab.contains(t));
        }, true);
        document.addEventListener('pointerup', () => { pointerActive = false; }, true);
        document.addEventListener('keydown', (e) => { tabbing = e.key === 'Tab'; }, true);

        el.input.addEventListener('click', () => setExpanded(true));
        // Tab into the field and you get the same view. A focus() we made ourselves —
        // clearing the chat, say — is not a request to expand.
        el.input.addEventListener('focus', () => { if (!pointerActive && tabbing) setExpanded(true); });

        // A drag that began in the panel and ended outside still counts as inside.
        document.addEventListener('click', () => {
            if (!expanded || downInPanel || downOnPrompt || downOnFab) return;
            setExpanded(false);
        });
        el.infoBtn.addEventListener('click', () => { el.info.hidden = !el.info.hidden; el.infoBtn.classList.toggle('is-active', !el.info.hidden); });
        el.engineBtn.addEventListener('click', (e) => { e.stopPropagation(); el.engine.classList.toggle('is-open'); });
        document.addEventListener('click', (e) => { if (!el.engine.contains(e.target)) el.engine.classList.remove('is-open'); });
        document.addEventListener('keydown', (e) => {
            const tag = (e.target.tagName || '').toLowerCase();
            if (e.key === '/' && tag !== 'input' && tag !== 'textarea' && !e.metaKey && !e.ctrlKey) { e.preventDefault(); setExpanded(true); el.input.focus(); }
            if (e.key === 'Escape' && expanded) setExpanded(false);
        });
        if (el.fab) el.fab.addEventListener('click', (e) => { e.preventDefault(); setExpanded(true); el.input.focus(); });
        document.querySelectorAll('[data-ai-prompt]').forEach(b => b.addEventListener('click', (e) => { e.preventDefault(); setExpanded(true); setTimeout(() => send(b.dataset.aiPrompt), 260); }));
        initSpeech();
        restorePlaceholder();

        // deep link: ?ask=your+question sends a prompt on load (shareable)
        try { const q = new URLSearchParams(location.search).get('ask'); if (q) setTimeout(() => send(q), 600); } catch (e) { /* ignore */ }

        // public hooks
        window.sendAIPrompt = (t) => { setExpanded(true); setTimeout(() => send(t), 260); };
        window.clearAIChat = clearChat;
        window.AjithAIChat = { switchEngine, loadWebLLM, send };
    }

    document.addEventListener('DOMContentLoaded', init);
})();
