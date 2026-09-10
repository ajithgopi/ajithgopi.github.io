/* =============================================================
 * Ajith AI — Chat UI + engine adapters (v3)
 * -------------------------------------------------------------
 * Engines:
 *   builtin  — AjithAI reasoning engine (js/ai-engine.js), instant, offline
 *   webllm   — real LLM in the browser via WebGPU (@mlc-ai/web-llm),
 *              loaded on demand; uses the built-in retrieval as RAG context
 *   ollama   — local Ollama server (http://localhost:11434), same RAG context
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

    const WEBLLM_MODELS = [
        { id: 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC', label: 'Qwen2.5 0.5B (fast · ~400 MB)' },
        { id: 'SmolLM2-360M-Instruct-q4f16_1-MLC', label: 'SmolLM2 360M (tiny · ~250 MB)' },
        { id: 'Llama-3.2-1B-Instruct-q4f16_1-MLC', label: 'Llama 3.2 1B (~700 MB)' },
        { id: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC', label: 'Qwen2.5 1.5B (best · ~1 GB)' }
    ];
    const ENGINE_META = {
        builtin: { label: 'Built-in', icon: 'fa-microchip', title: 'Built-in reasoning', desc: 'Instant, offline. Intent + entity + BM25 retrieval over the CV.' },
        webllm: { label: 'WebGPU LLM', icon: 'fa-bolt', title: 'In-browser LLM (WebGPU)', desc: 'Runs a real open model on your GPU. One-time download, then offline.' },
        ollama: { label: 'Ollama', icon: 'fa-server', title: 'Local Ollama', desc: 'Use any model from an Ollama server on your machine.' }
    };

    let engine, settings, history = [], busy = false, aborter = null, lastUserText = '';
    let webllm = { engine: null, model: null, loading: false };
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
        if (window.AjithVisuals) window.AjithVisuals.setExcitement(on ? 1 : 0);
        el.send.classList.toggle('is-stop', on);
        el.send.innerHTML = on ? '<i class="fas fa-stop"></i>' : '<i class="fas fa-paper-plane"></i>';
        el.send.title = on ? 'Stop' : 'Send';
    }

    /* ---------------- rendering ---------------- */
    function actionChipsHtml(actions) {
        if (!actions || !actions.length) return '';
        return `<div class="action-chips">${actions.map(a => `<a class="action-chip" href="${escapeHtml(a.href)}"${/^https?:/.test(a.href) ? ' target="_blank" rel="noopener"' : ''}${a.download ? ' download' : ''}><i class="${a.brand ? 'fab' : 'fas'} ${a.icon}"></i>${escapeHtml(a.label)}</a>`).join('')}</div>`;
    }
    function traceHtml(steps, meta, open) {
        return `<details class="ai-trace"${open ? ' open' : ''}>
            <summary class="ai-trace__summary"><i class="fas fa-chevron-right chev"></i><i class="fas fa-lightbulb"></i> ${escapeHtml(meta.title || 'Reasoning')}<span class="meta">${escapeHtml(meta.sub || '')}</span></summary>
            <div class="ai-trace__steps">${steps.map(s => `<div class="ai-trace__step done"><i class="fas ${s.icon || 'fa-check'}"></i><span>${s.text}</span></div>`).join('')}</div>
        </details>`;
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
        const trace = meta.reasoning && meta.reasoning.length ? traceHtml(meta.reasoning, { title: meta.traceTitle || 'Reasoning', sub: meta.traceSub || '' }, false) : '';
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
    function buildMessages(userText) {
        const sys = engine.buildSystemPrompt(userText);
        const msgs = [{ role: 'system', content: sys }];
        const turns = history.filter(h => h.role === 'user' || h.role === 'bot').slice(-6);
        for (const t of turns) msgs.push({ role: t.role === 'user' ? 'user' : 'assistant', content: (t.text || '').slice(0, 1200) });
        if (!turns.length || turns[turns.length - 1].text !== userText) msgs.push({ role: 'user', content: userText });
        return msgs;
    }
    async function ensureWebLLM(onProgress) {
        if (webllm.engine && webllm.model === settings.webllmModel) return webllm.engine;
        if (!navigator.gpu) throw new Error('WebGPU is not available in this browser. Use a recent Chrome or Edge on desktop, or switch back to the built-in engine.');
        webllm.loading = true;
        try {
            const mod = await import('https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2/+esm');
            if (webllm.engine) { try { await webllm.engine.unload(); } catch (e) { /* ignore */ } }
            const eng = await mod.CreateMLCEngine(settings.webllmModel, { initProgressCallback: (p) => onProgress && onProgress(p) });
            webllm.engine = eng; webllm.model = settings.webllmModel;
            return eng;
        } finally { webllm.loading = false; }
    }
    async function* streamWebLLM(messages, signal) {
        const eng = await ensureWebLLM(showProgress);
        hideProgress();
        const chunks = await eng.chat.completions.create({ messages, stream: true, temperature: 0.3, max_tokens: 420 });
        for await (const c of chunks) {
            if (signal.aborted) break;
            const d = c.choices && c.choices[0] && c.choices[0].delta && c.choices[0].delta.content;
            if (d) yield d;
        }
    }
    async function* streamOllama(messages, signal) {
        const base = (settings.ollamaUrl || 'http://localhost:11434').replace(/\/+$/, '');
        const model = settings.ollamaModel || 'llama3.2';
        const res = await fetch(base + '/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model, messages, stream: true, options: { temperature: 0.3, num_predict: 420 } }), signal });
        if (!res.ok) throw new Error(`Ollama responded ${res.status} — is the model "${model}" pulled?`);
        const reader = res.body.getReader(), dec = new TextDecoder(); let buf = '';
        while (true) {
            const { done, value } = await reader.read(); if (done) break;
            buf += dec.decode(value, { stream: true });
            let idx;
            while ((idx = buf.indexOf('\n')) >= 0) {
                const line = buf.slice(0, idx).trim(); buf = buf.slice(idx + 1);
                if (!line) continue;
                let j; try { j = JSON.parse(line); } catch (e) { continue; }
                if (j.error) throw new Error(j.error);
                if (j.message && j.message.content) yield j.message.content;
                if (j.done) return;
            }
        }
    }
    async function fetchOllamaModels() {
        const base = (settings.ollamaUrl || 'http://localhost:11434').replace(/\/+$/, '');
        const res = await fetch(base + '/api/tags');
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const j = await res.json();
        return (j.models || []).map(m => m.name);
    }
    function showProgress(p) {
        el.progress.hidden = false;
        const pct = Math.round((p && typeof p.progress === 'number' ? p.progress : 0) * 100);
        el.progressBar.style.width = pct + '%';
        setStatus(`Loading ${settings.webllmModel.split('-')[0]} · ${pct}% ${p && p.text ? '· ' + p.text.replace(/\[.*?\]/g, '').slice(0, 60) : ''}`, 'busy');
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
        else if (settings.engine === 'webllm') setStatus(webllm.engine && webllm.model === settings.webllmModel ? `WebGPU · ${settings.webllmModel.split('-q4')[0]} loaded` : `WebGPU · ${settings.webllmModel.split('-q4')[0]} (loads on first message)`);
        else setStatus(`Ollama · ${settings.ollamaModel || 'llama3.2'} @ ${(settings.ollamaUrl || 'localhost:11434').replace(/^https?:\/\//, '')}`);
        el.engineBtn.innerHTML = `<span class="chip"></span><i class="fas ${ENGINE_META[settings.engine].icon}"></i><span class="lbl">${ENGINE_META[settings.engine].label}</span><i class="fas fa-chevron-down" style="font-size:.6rem;opacity:.7"></i>`;
    }
    function renderEngineMenu() {
        const m = el.engineMenu;
        m.innerHTML = Object.keys(ENGINE_META).map(k => `<button type="button" class="ai-engine__opt${settings.engine === k ? ' is-selected' : ''}" data-engine="${k}"><i class="fas ${ENGINE_META[k].icon}"></i><span><b>${ENGINE_META[k].title}${k === 'builtin' ? '<span class="tag">default</span>' : ''}${k === 'webllm' && !navigator.gpu ? '<span class="tag" style="background:rgba(239,68,68,.15);color:#ef4444">no WebGPU</span>' : ''}</b><small>${ENGINE_META[k].desc}</small></span></button>`).join('');
        const cfg = document.createElement('div'); cfg.className = 'ai-engine__cfg';
        if (settings.engine === 'webllm') {
            cfg.innerHTML = `<label>Model</label><select id="ai-webllm-model">${WEBLLM_MODELS.map(x => `<option value="${x.id}"${x.id === settings.webllmModel ? ' selected' : ''}>${x.label}</option>`).join('')}</select>
                <div class="hint">Downloads once to your browser cache, then runs offline on your GPU. Answers are grounded in the same CV retrieval the built-in engine uses (RAG).</div>`;
            m.appendChild(cfg);
            cfg.querySelector('#ai-webllm-model').addEventListener('change', (e) => { settings.webllmModel = e.target.value; saveJSON(SETTINGS_KEY, settings); refreshStatus(); });
        } else if (settings.engine === 'ollama') {
            cfg.innerHTML = `<label>Server URL</label><input id="ai-ollama-url" value="${escapeHtml(settings.ollamaUrl || 'http://localhost:11434')}" spellcheck="false">
                <label>Model <button type="button" id="ai-ollama-refresh" style="background:none;border:none;color:var(--primary);cursor:pointer;font-size:.68rem">↻ detect</button></label>
                <input id="ai-ollama-model" list="ai-ollama-models" value="${escapeHtml(settings.ollamaModel || 'llama3.2')}" spellcheck="false"><datalist id="ai-ollama-models"></datalist>
                <div class="hint" id="ai-ollama-hint">Start Ollama with this site allowed as an origin:<br><code>OLLAMA_ORIGINS="${escapeHtml(location.origin)}" ollama serve</code></div>`;
            m.appendChild(cfg);
            cfg.querySelector('#ai-ollama-url').addEventListener('change', (e) => { settings.ollamaUrl = e.target.value.trim(); saveJSON(SETTINGS_KEY, settings); refreshStatus(); });
            cfg.querySelector('#ai-ollama-model').addEventListener('change', (e) => { settings.ollamaModel = e.target.value.trim(); saveJSON(SETTINGS_KEY, settings); refreshStatus(); });
            cfg.querySelector('#ai-ollama-refresh').addEventListener('click', async () => {
                const hint = cfg.querySelector('#ai-ollama-hint');
                try { const models = await fetchOllamaModels(); cfg.querySelector('#ai-ollama-models').innerHTML = models.map(x => `<option value="${escapeHtml(x)}">`).join(''); hint.innerHTML = models.length ? `✅ Connected · ${models.length} model(s): ${models.slice(0, 4).map(escapeHtml).join(', ')}${models.length > 4 ? '…' : ''}` : '⚠️ Connected, but no models pulled. Try <code>ollama pull llama3.2</code>'; if (models.length && !models.includes(settings.ollamaModel)) { settings.ollamaModel = models[0]; cfg.querySelector('#ai-ollama-model').value = models[0]; saveJSON(SETTINGS_KEY, settings); refreshStatus(); } }
                catch (e) { hint.innerHTML = `❌ Can't reach Ollama (${escapeHtml(e.message)}). Make sure it's running with:<br><code>OLLAMA_ORIGINS="${escapeHtml(location.origin)}" ollama serve</code>`; }
            });
        }
        m.querySelectorAll('[data-engine]').forEach(b => b.addEventListener('click', () => {
            settings.engine = b.dataset.engine; saveJSON(SETTINGS_KEY, settings);
            renderEngineMenu(); refreshStatus();
            addSystemNote(`Engine switched to <b>${ENGINE_META[settings.engine].title}</b>${settings.engine === 'webllm' ? ' — the model will download on your first message' : ''}.`);
        }));
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
        const steps = res.reasoning.slice();
        if (useLLM) steps.push({ icon: 'fa-magic', text: `Handing retrieved context to ${settings.engine === 'webllm' ? settings.webllmModel.split('-q4')[0] + ' (WebGPU)' : (settings.ollamaModel || 'llama3.2') + ' (Ollama)'} as RAG context…` });

        // 2. unfold trace
        for (let i = 0; i < steps.length; i++) {
            if (signal.aborted) break;
            stepsEl.insertAdjacentHTML('beforeend', `<div class="ai-trace__step"><i class="fas fa-circle-notch fa-spin"></i><span>${steps[i].text}</span></div>`);
            scrollToBottom();
            await sleep(useLLM && i === steps.length - 1 ? 60 : 110 + Math.random() * 150);
        }
        await sleep(120);

        let finalHtml = res.html, finalText = res.text, engineUsed = 'builtin', llmError = null;

        // 3. LLM generation (streamed) or built-in reveal
        if (useLLM && !signal.aborted) {
            try {
                const messages = buildMessages(text);
                const stream = settings.engine === 'webllm' ? streamWebLLM(messages, signal) : streamOllama(messages, signal);
                let acc = '', raf = null;
                answerEl.innerHTML = '<span class="stream-cursor"></span>';
                for await (const chunk of stream) {
                    if (signal.aborted) break;
                    acc += chunk;
                    if (!raf) raf = requestAnimationFrame(() => { raf = null; answerEl.innerHTML = AjithAI.mdToHtml(acc) + '<span class="stream-cursor"></span>'; scrollToBottom(); });
                }
                if (raf) cancelAnimationFrame(raf);
                if (acc.trim()) { finalText = acc.trim(); finalHtml = AjithAI.mdToHtml(finalText); engineUsed = settings.engine; }
                answerEl.innerHTML = finalHtml;
                answerEl.querySelectorAll('.bar > span').forEach(b => b.style.width = b.style.getPropertyValue('--w'));
            } catch (e) {
                llmError = e && e.message ? e.message : String(e);
                hideProgress();
            }
        }

        // 4. finalise trace
        const elapsed = ((performance.now() - t0) / 1000).toFixed(1);
        const traceTitle = `Reasoned for ${elapsed}s`;
        const traceSub = `${res.intent.replace(/_/g, ' ')} · ${Math.round(res.confidence * 100)}%${engineUsed !== 'builtin' ? ' · ' + engineUsed : ''}`;
        if (llmError) steps.push({ icon: 'fa-exclamation-triangle', text: `LLM engine failed (${escapeHtml(llmError)}) — answering with the built-in engine instead.` });
        traceEl.outerHTML = traceHtml(steps, { title: traceTitle, sub: traceSub }, false);

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
        const entry = { role: 'bot', text: finalText, html: answerEl.innerHTML, prompt: text, meta: { reasoning: steps, traceTitle, traceSub, actions: res.actions, engine: engineUsed, intent: res.intent } };
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
    function setExpanded(on) {
        // Reparent to <body> so the fixed panel escapes the hero's stacking context
        if (on && el.panel.parentElement !== document.body) document.body.appendChild(el.panel);
        else if (!on && el.panel.parentElement === document.body) el.placeholder.insertAdjacentElement('afterend', el.panel);
        el.panel.classList.toggle('is-expanded', on);
        el.backdrop.classList.toggle('is-visible', on);
        el.placeholder.classList.toggle('is-active', on);
        document.body.classList.toggle('ai-expanded', on);
        el.expand.innerHTML = on ? '<i class="fas fa-compress"></i>' : '<i class="fas fa-expand"></i>';
        el.expand.title = on ? 'Exit full screen (Esc)' : 'Full screen';
        if (on) setTimeout(() => el.input.focus(), 50);
        scrollToBottom(true);
    }
    function panelInView() { const r = el.panel.getBoundingClientRect(); return r.top < window.innerHeight * 0.7 && r.bottom > window.innerHeight * 0.3; }

    /* ---------------- voice ---------------- */
    function initVoice() {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) { el.mic.hidden = true; return; }
        let rec = null, listening = false;
        el.mic.addEventListener('click', () => {
            if (listening) { rec && rec.stop(); return; }
            rec = new SR(); rec.lang = 'en-US'; rec.interimResults = true;
            rec.onresult = (e) => { let t = ''; for (const r of e.results) t += r[0].transcript; el.input.value = t; autoGrow(); if (e.results[e.results.length - 1].isFinal) { rec.stop(); setTimeout(() => send(t), 200); } };
            rec.onend = () => { listening = false; el.mic.classList.remove('is-listening'); };
            rec.onerror = () => { listening = false; el.mic.classList.remove('is-listening'); };
            rec.start(); listening = true; el.mic.classList.add('is-listening');
        });
    }
    function autoGrow() { el.input.style.height = 'auto'; el.input.style.height = Math.min(120, el.input.scrollHeight) + 'px'; }

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
        settings = Object.assign({ engine: 'builtin', ollamaUrl: 'http://localhost:11434', ollamaModel: 'llama3.2', webllmModel: WEBLLM_MODELS[0].id }, loadJSON(SETTINGS_KEY, {}));
        try { const qe = new URLSearchParams(location.search).get('engine'); if (qe && ENGINE_META[qe]) settings.engine = qe; } catch (e) { /* ignore */ }
        if (!ENGINE_META[settings.engine]) settings.engine = 'builtin';
        history = loadJSON(STORE_KEY, []);
        if (!Array.isArray(history)) history = [];

        // restore or welcome
        if (history.length) { history.forEach(renderStatic); el.body.insertAdjacentHTML('beforeend', `<div class="chat-msg system"><div class="chat-bubble">Conversation restored · <a href="#" id="ai-restore-clear">start fresh</a></div></div>`); $('ai-restore-clear').addEventListener('click', (e) => { e.preventDefault(); clearChat(); }); }
        else welcome();
        setChips(DEFAULT_CHIPS);
        renderEngineMenu(); refreshStatus();
        requestAnimationFrame(() => scrollToBottom(true));

        // events
        el.form.addEventListener('submit', (e) => { e.preventDefault(); if (busy) { aborter && aborter.abort(); return; } send(el.input.value); });
        el.input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); el.form.requestSubmit ? el.form.requestSubmit() : el.form.dispatchEvent(new Event('submit')); } if (e.key === 'Escape' && el.panel.classList.contains('is-expanded')) setExpanded(false); });
        el.input.addEventListener('input', autoGrow);
        el.clear.addEventListener('click', clearChat);
        el.expand.addEventListener('click', () => setExpanded(!el.panel.classList.contains('is-expanded')));
        el.backdrop.addEventListener('click', () => setExpanded(false));
        el.infoBtn.addEventListener('click', () => { el.info.hidden = !el.info.hidden; el.infoBtn.classList.toggle('is-active', !el.info.hidden); });
        el.engineBtn.addEventListener('click', (e) => { e.stopPropagation(); el.engine.classList.toggle('is-open'); });
        document.addEventListener('click', (e) => { if (!el.engine.contains(e.target)) el.engine.classList.remove('is-open'); });
        document.addEventListener('keydown', (e) => {
            const tag = (e.target.tagName || '').toLowerCase();
            if (e.key === '/' && tag !== 'input' && tag !== 'textarea' && !e.metaKey && !e.ctrlKey) { e.preventDefault(); if (!panelInView()) el.panel.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.input.focus(); }
            if (e.key === 'Escape' && el.panel.classList.contains('is-expanded')) setExpanded(false);
        });
        if (el.fab) el.fab.addEventListener('click', (e) => { e.preventDefault(); if (panelInView()) { el.input.focus(); } else { setExpanded(true); } });
        document.querySelectorAll('[data-ai-prompt]').forEach(b => b.addEventListener('click', (e) => { e.preventDefault(); el.panel.scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(() => send(b.dataset.aiPrompt), 400); }));
        initVoice();

        // deep link: ?ask=your+question sends a prompt on load (shareable)
        try { const q = new URLSearchParams(location.search).get('ask'); if (q) setTimeout(() => send(q), 600); } catch (e) { /* ignore */ }

        // public hooks
        window.sendAIPrompt = (t) => { el.panel.scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(() => send(t), 300); };
        window.clearAIChat = clearChat;
    }

    document.addEventListener('DOMContentLoaded', init);
})();
