/* =============================================================
 * Ajith AI — WebLLM worker
 * -------------------------------------------------------------
 * Hosts the MLCEngine off the main thread. Everything expensive
 * about running a model in the browser — fetching and caching the
 * weight shards, the WASM/TVM runtime, tokenisation, and the
 * WebGPU dispatch loop — happens here instead of in the page, so
 * scrolling, the hero canvas and the chat UI stay responsive
 * while a model downloads or generates.
 *
 * The library URL is handed over by the page (same CDN fallback
 * list) rather than hard-coded, and messages that arrive before
 * the import finishes are queued — WebWorkerMLCEngine starts
 * posting from its own constructor.
 * ============================================================= */
'use strict';

let handler = null, booting = false, announced = false;
const queued = [];

self.onmessage = (event) => {
    const data = event.data;
    if (data && data.__ajith === 'init') { boot(data.urls || []); return; }
    if (handler) handler.onmessage(event);
    else queued.push(event);
};

function describe(err) { return err && err.message ? err.message : String(err); }

async function boot(urls) {
    if (booting) return;
    booting = true;
    const errors = [];
    for (const url of urls) {
        try {
            const mod = await import(url);
            if (!mod || typeof mod.WebWorkerMLCEngineHandler !== 'function') throw new Error('unexpected module shape');
            handler = new mod.WebWorkerMLCEngineHandler();
            /* Sent exactly once, and always before the page constructs its
               WebWorkerMLCEngine — that client throws on message kinds it
               does not know, so no `__ajith` traffic may follow it. */
            if (!announced) { announced = true; self.postMessage({ __ajith: 'ready' }); }
            while (queued.length) handler.onmessage(queued.shift());
            return;
        } catch (err) {
            let host = url;
            try { host = new URL(url).host; } catch (e) { /* keep the raw url */ }
            errors.push(host + ': ' + describe(err));
        }
    }
    if (!announced) { announced = true; self.postMessage({ __ajith: 'fail', error: errors.join(' · ') }); }
}
