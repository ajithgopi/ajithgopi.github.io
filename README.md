# agopi.in — Ajith Gopi's portfolio

Static site hosted on GitHub Pages (no build step).

## v3 highlights
- **AI-first, mobile-first hero** — the assistant is the centrepiece: beside the intro on desktop, directly under the headline on phones (above the fold), with a full-screen mode (⤢ button, `Esc` to exit) and a floating "Ask AI" button once you scroll past it.
- **Animated visuals** — a pseudo-3D neural constellation on a 2D canvas (`js/visuals.js`) that reacts to the mouse and lights up while the assistant is thinking; aurora background, spotlight/tilt cards, scroll-drawn timeline. Visual layers are kept behind the content and toned down so text stays readable (all text colours meet WCAG AA in both themes).
- **Local AI assistant** (`js/ai-engine.js` + `js/ai-assistant.js`) — runs 100% in the browser:
  spell-correction → intent classification → entity extraction → BM25 retrieval over the CV → templated answers, with conversational memory for follow-ups (“and Node?”, “tell me more”), slash commands (`/help`, `/skills`, `/projects`, `/experience`, `/contact`, `/cv`, `/clear`), follow-up chips, page actions, voice input and local persistence.
- **Recruiter toolkit** (`js/jd-match.js`) — the *Recruiter view* button opens a JD matcher: paste a job description and it scores the fit against the same CV knowledge base the assistant uses, requirement by requirement. Weighted by must-have vs nice-to-have sections and by the years each requirement asks for, with an honest gap list (what is *not* on the CV, and the nearest thing that is), a "where he would help" section, location/seniority notes, one-click follow-up questions into the assistant, and a copy/email-able plaintext brief. Matching plays out through the same reasoning trace the assistant uses, step by step. Runs entirely in the browser — nothing pasted is uploaded or stored.
- **Real LLM engine, loaded by itself** (engine menu in the chat header), grounded with the same retrieval as RAG context:
  - *In-browser WebGPU* via [WebLLM](https://github.com/mlc-ai/web-llm) — on page open the model is fetched in the background with no progress card, no paused chat and no announcement; the built-in engine answers every message meanwhile, and the chat switches itself to the WebGPU engine once the weights are compiled onto the GPU. Weights are cached by the browser, so later visits only recompile. Skipped on Data Saver, 2G and browsers without WebGPU.
  - Pick an engine yourself and that choice sticks — no more automatic downloading or switching. Starting the model from the menu shows the usual progress card, pauses the chat until it's ready and offers a one-click fallback to the built-in engine; asking for it mid-background-download simply adopts the download already in flight. The library is pinned and loaded as a pre-built ESM file, with a second CDN as fallback.

## URL parameters
- `?ask=your+question` — sends a prompt on load (shareable deep link)
- `?theme=light|dark` — force a theme (dark is the default everywhere; only this parameter or the toggle switches it)
- `?engine=builtin|webllm` — pre-select an assistant engine

## Local preview
```bash
python3 -m http.server 8765
```
Then open http://localhost:8765/.
