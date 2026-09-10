# agopi.in — Ajith Gopi's portfolio

Static site hosted on GitHub Pages (no build step).

## v3 highlights
- **AI-first hero** — the assistant sits beside the intro, with a full-screen mode (⤢ button, `Esc` to exit) and a floating "Ask AI" button once you scroll past it.
- **Animated visuals** — a pseudo-3D neural constellation on a 2D canvas (`js/visuals.js`) that reacts to the mouse and lights up while the assistant is thinking; aurora background, spotlight/tilt cards, scroll-drawn timeline.
- **Local AI assistant** (`js/ai-engine.js` + `js/ai-assistant.js`) — runs 100% in the browser:
  spell-correction → intent classification → entity extraction → BM25 retrieval over the CV → templated answers, with conversational memory for follow-ups (“and Node?”, “tell me more”), slash commands (`/help`, `/skills`, `/projects`, `/experience`, `/contact`, `/cv`, `/clear`), follow-up chips, page actions, voice input and local persistence.
- **Optional real LLM engines** (engine menu in the chat header), both grounded with the same retrieval as RAG context:
  - *In-browser WebGPU* via [WebLLM](https://github.com/mlc-ai/web-llm) — model downloads once to the browser cache.
  - *Local Ollama* — start it with `OLLAMA_ORIGINS="https://agopi.in" ollama serve` and pick a model.

## URL parameters
- `?ask=your+question` — sends a prompt on load (shareable deep link)
- `?theme=light|dark` — force a theme
- `?engine=builtin|webllm|ollama` — pre-select an assistant engine

## Local preview
```bash
python3 -m http.server 8765
```
Then open http://localhost:8765/.
