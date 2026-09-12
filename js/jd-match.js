/* =============================================================
 * Ajith AI — JD Matcher (recruiter toolkit)
 * -------------------------------------------------------------
 * Paste a job description, get an honest read on the fit.
 * Runs 100% in the browser against the same CV knowledge base
 * the assistant uses (window.AjithAI.KB) — no upload, no server,
 * no storage. Nothing a recruiter pastes ever leaves the tab.
 *
 * Pipeline:
 *   normalize → section split (must-have / nice-to-have) →
 *   requirement extraction (KB skills + an outside-stack lexicon)
 *   → per-requirement years + weight → weighted fit score →
 *   evidence lookup → "how he'd help" plays → plaintext brief.
 *
 * Public API (window.AjithJD):
 *   AjithJD.analyze(jdText) → result object (see buildResult)
 *   AjithJD.brief(result)   → plaintext summary for copy / email
 * ============================================================= */
(function (global) {
    'use strict';

    const AI = global.AjithAI;
    const KB = AI && AI.KB;

    /* ---------------------------------------------------------
     * 1. Text utilities
     * ------------------------------------------------------- */

    /* Keep +, #, . and / — they carry meaning in tech names (C++, C#,
       Node.js, CI/CD) and would otherwise be lost. Commas, semicolons and
       line breaks collapse to a single "|" so clause boundaries survive:
       without them "5+ years React Native, TypeScript, App Store" hands its
       years figure to every item in the list. */
    function norm(str) {
        return ' ' + String(str || '')
            .toLowerCase()
            .replace(/[‘’“”]/g, "'")
            .replace(/[,;:\n\r•·|()]+/g, ' | ')
            .replace(/[^a-z0-9+#./|\-\s]+/g, ' ')
            .replace(/[ \t]+/g, ' ')
            .trim() + ' ';
    }

    const reCache = Object.create(null);
    function termRe(term) {
        if (reCache[term]) { reCache[term].lastIndex = 0; return reCache[term]; }
        const esc = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        /* A term is a hit only on its own boundaries: "node" must not fire
           inside "node.js", and "net" must not fire inside "asp.net". */
        const left = /^[.+#]/.test(term) ? '' : '(?<![a-z0-9+#])(?<![a-z0-9]\\.)';
        const right = '(?![a-z0-9+#])(?!\\.[a-z0-9])';
        return (reCache[term] = new RegExp(left + esc + right, 'g'));
    }

    /* Every index where `term` occurs in already-normalized text. */
    function hits(text, term) {
        const re = termRe(term), out = [];
        let m;
        while ((m = re.exec(text))) { out.push(m.index); if (out.length > 60) break; }
        return out;
    }

    function esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

    function uniq(arr) { return arr.filter((v, i) => arr.indexOf(v) === i); }

    /* "MySQL / MariaDB" reads fine in a question; "(ES6+)" does not. */
    function shortName(name) { return String(name).replace(/\s*\([^)]*\)/g, '').trim(); }

    function listJoin(arr, last) {
        const a = arr.filter(Boolean);
        if (!a.length) return '';
        if (a.length === 1) return a[0];
        return a.slice(0, -1).join(', ') + ' ' + (last || 'and') + ' ' + a[a.length - 1];
    }

    /* ---------------------------------------------------------
     * 2. Lexicons
     * ------------------------------------------------------- */

    /* Aliases that read as ordinary English and would fire on prose
       ("we design great products", "the team is agile") rather than on a
       real requirement. Kept out of matching so the score stays honest. */
    const NOISY_ALIASES = new Set([
        'design', 'models', 'model', 'prediction', 'predictive', 'statistics', 'automation',
        'performance', 'optimization', 'optimisation', 'scalable', 'scalability', 'distributed',
        'infrastructure', 'cloud', 'server', 'servers', 'deploy', 'deployment', 'deployments',
        'database', 'databases', 'db', 'schema', 'backend', 'back-end', 'back end', 'frontend',
        'front-end', 'front end', 'mobile', 'apple', 'agile', 'sprint', 'json', 'xml', 'yaml',
        'ui', 'ux', 'ui/ux', 'ui ux', 'responsive', 'animation', 'animations', 'realtime',
        'real-time', 'real time', 'streaming', 'cache', 'caching', 'in-memory', 'relational',
        'rdbms', 'graph', 'containers', 'container', 'pipeline', 'pipelines', 'code review',
        'code reviews', 'version control', 'go lang', 'r', 'ml', 'ai', 'prompt', 'prompts',
        'agent', 'agents', 'data pipeline', 'data pipelines', 'cross platform', 'cross-platform',
        'mobile apps', 'mobile app development', 'mobile development', 'api development',
        'scripting', 'algorithms', 'data structures', 'design patterns', 'load optimization',
        'query optimization', 'query optimisation', 'microservice', 'microservices', 'apache'
    ]);

    /* Requirements the CV does not cover. Each carries an honest note on the
       nearest thing Ajith has actually shipped — recruiters trust a gap list
       far more than a wall of green ticks. */
    const OUTSIDE = [
        { id: 'java', label: 'Java', terms: ['java'], near: 'Nearest: TypeScript/Node services and Kotlin on Android — strong OOP, but no production JVM work.' },
        { id: 'spring', label: 'Spring / Spring Boot', terms: ['spring', 'springboot', 'spring boot'], near: 'Nearest: Express and Laravel MVC services — the same patterns on a different runtime.' },
        { id: 'dotnet', label: 'C# / .NET', terms: ['c#', 'csharp', 'dotnet', '.net', 'asp.net'], near: 'Nearest: TypeScript and Java-family syntax; no .NET in production.' },
        { id: 'ruby', label: 'Ruby / Rails', terms: ['ruby', 'rails', 'ruby on rails'], near: 'Nearest: Laravel and Express — same MVC/convention style.' },
        { id: 'rust', label: 'Rust', terms: ['rust'], near: 'Nearest: Golang backend functions (Tutorhow Virtual Front Desk).' },
        { id: 'scala', label: 'Scala', terms: ['scala'], near: 'Nearest: functional patterns in TypeScript; no JVM data work.' },
        { id: 'elixir', label: 'Elixir / Erlang', terms: ['elixir', 'erlang', 'phoenix'], near: 'Nearest: Node.js and WebSockets for concurrent real-time features.' },
        { id: 'django', label: 'Django', terms: ['django'], near: 'Has Python (4 yrs) with Flask/FastAPI-style services; Django itself would be new.' },
        { id: 'terraform', label: 'Terraform / IaC', terms: ['terraform', 'ansible', 'pulumi', 'cloudformation', 'infrastructure as code'], near: 'Nearest: Docker, Kubernetes/EKS and Jenkins + Bitbucket Pipelines, provisioned by hand and script.' },
        { id: 'elastic', label: 'Elasticsearch / OpenSearch', terms: ['elasticsearch', 'opensearch', 'elastic', 'solr', 'lucene'], near: 'Nearest: hand-built BM25 and vector retrieval, plus Mongo/Postgres query tuning.' },
        { id: 'bigdata', label: 'Spark / big-data stack', terms: ['spark', 'hadoop', 'databricks', 'snowflake', 'bigquery', 'redshift', 'airflow', 'dbt', 'flink'], near: 'Nearest: PostgreSQL analytics behind reach52 Insights and Pandas/NumPy pipelines.' },
        { id: 'rabbit', label: 'RabbitMQ / NATS', terms: ['rabbitmq', 'nats', 'activemq', 'sqs', 'pubsub'], near: 'Has Apache Kafka and WebSockets for messaging and streaming.' },
        { id: 'salesforce', label: 'Salesforce / SAP', terms: ['salesforce', 'sap', 'dynamics 365', 'netsuite'], near: 'Nearest: ServiceNow enterprise-platform support at Infosys.' },
        { id: 'cms', label: 'WordPress / CMS platforms', terms: ['wordpress', 'drupal', 'magento', 'shopify', 'contentful', 'sitecore'], near: 'Nearest: PHP/Laravel and Next.js content platforms built from scratch.' },
        { id: 'unity', label: 'Unity / Unreal', terms: ['unity', 'unreal', 'godot'], near: 'Nearest: Canvas/WebGL visuals and game-server control panels as a side interest.' },
        { id: 'blockchain', label: 'Blockchain / Web3', terms: ['blockchain', 'solidity', 'web3', 'ethereum', 'smart contract', 'smart contracts'], near: 'No on-chain work; closest is FinTech-grade backend at Emirates NBD.' },
        { id: 'mlops', label: 'Model training / MLOps', terms: ['tensorflow', 'keras', 'mlops', 'sagemaker', 'kubeflow', 'mlflow', 'model training', 'fine-tuning', 'fine tuning'], near: 'Applies models rather than trains them: RAG, embeddings, agentic workflows, plus Pandas/NumPy and PyTorch basics.' },
        { id: 'vectordb', label: 'Managed vector databases', terms: ['pinecone', 'weaviate', 'qdrant', 'milvus', 'chroma', 'pgvector'], near: 'Has built the retrieval layer directly — embeddings, BM25 and vector search inside RAG pipelines.' },
        { id: 'qa', label: 'Test automation suites', terms: ['selenium', 'cypress', 'playwright', 'jest', 'mocha', 'junit', 'pytest', 'test automation', 'unit testing', 'tdd'], near: 'Writes tests and ran QA for a 5-person team at Tutorhow; no dedicated SDET tooling ownership.' },
        { id: 'observability', label: 'Observability tooling', terms: ['grafana', 'prometheus', 'datadog', 'splunk', 'new relic', 'newrelic', 'sentry', 'elk'], near: 'Nearest: production support and performance tuning on AWS-hosted microservices.' },
        { id: 'security', label: 'Security engineering', terms: ['penetration testing', 'pentest', 'appsec', 'owasp', 'iso 27001', 'soc 2', 'siem'], near: 'Works alongside architecture and security teams in a regulated bank; not a security specialist.' },
        { id: 'sre', label: 'SRE / on-call ownership', terms: ['sre', 'site reliability', 'on-call', 'on call', 'incident response', 'slo', 'sla'], near: 'Owns deployments and production fixes for the services he builds, without a formal SRE rotation.' },
        { id: 'embedded', label: 'Embedded / firmware', terms: ['embedded', 'firmware', 'rtos', 'verilog', 'vhdl', 'plc'], near: 'Nearest: IoT and multimedia automation (Arduino/ESP32-class) as a personal interest.' },
        { id: 'lowlevel', label: 'C / C++', terms: ['c++', 'cpp'], near: 'Nearest: Golang and Swift for performance-sensitive work.' }
    ];

    /* Extra signals that are not skills but change the shape of the answer. */
    const DOMAINS = [
        { id: 'banking', label: 'Banking / FinTech', terms: ['bank', 'banking', 'fintech', 'financial services', 'payments', 'trading', 'capital markets', 'lending', 'wealth', 'insurance', 'regulated'], evidence: () => 'Two years inside Emirates NBD building corporate-banking apps for Relationship Managers — deal processing, OracleDB shared services, and sign-off from architecture and security teams.' },
        { id: 'health', label: 'Healthcare / life sciences', terms: ['healthcare', 'health', 'medical', 'clinical', 'patient', 'pharma', 'hospital', 'telehealth'], evidence: () => 'Three years at reach52 building data and analytics microservices for a global healthcare organisation reaching underserved communities.' },
        { id: 'edtech', label: 'Education / EdTech', terms: ['edtech', 'education', 'e-learning', 'elearning', 'learning platform', 'student', 'teacher', 'training platform', 'lms'], evidence: () => 'Led the team behind Tutorhow: an online-class platform, a lead-management PWA and a white-labelled training app for institutes.' },
        { id: 'analytics', label: 'Data & analytics products', terms: ['analytics', 'dashboard', 'dashboards', 'business intelligence', 'reporting', 'data visualisation', 'data visualization', 'insights'], evidence: () => 'Built reach52 Insights — an enterprise platform turning complex statistical data into graphics clients can actually read.' },
        { id: 'enterprise', label: 'Enterprise / regulated scale', terms: ['enterprise', 'large scale', 'mission critical', 'compliance', 'audit', 'governance'], evidence: () => 'Has shipped inside Infosys, a Singapore healthcare org and a UAE bank — used to review gates, compliance and shared-service integrations.' },
        { id: 'startup', label: 'Startup pace', terms: ['startup', 'start-up', 'fast-paced', 'fast paced', 'scale-up', 'scaleup', 'zero to one', '0 to 1', 'wear many hats', 'ambiguity'], evidence: () => 'Was employee-scale early at Tutorhow and reach52: picked the stack, led delivery and shipped across web, mobile and infrastructure.' }
    ];

    const SENIOR_RE = /\b(senior|sr\.?|lead|principal|staff|architect|head of|manager|director|vp)\b/;
    const JUNIOR_RE = /\b(junior|jr\.?|intern|internship|entry[- ]level|graduate|fresher|trainee|apprentice)\b/;
    const MID_RE = /\b(mid[- ]level|mid level|intermediate)\b/;

    /* ---------------------------------------------------------
     * 3. Section weighting
     * ------------------------------------------------------- */

    const MUST_HEAD = /\b(requirements?|qualifications?|must[- ]haves?|must have|what you.ll need|what we.re looking for|who you are|essential|your profile|skills? (and|&) experience|minimum)\b/g;
    const NICE_HEAD = /\b(nice[- ]to[- ]haves?|nice to have|preferred|bonus|desirable|plus(es)?|advantageous|good to have|it would be great)\b/g;

    /* Ranges of the text that sit under a must-have / nice-to-have heading.
       Everything from a heading runs until the next heading of either kind. */
    function sections(text) {
        const marks = [];
        let m;
        MUST_HEAD.lastIndex = 0;
        while ((m = MUST_HEAD.exec(text))) marks.push({ at: m.index, kind: 'must' });
        NICE_HEAD.lastIndex = 0;
        while ((m = NICE_HEAD.exec(text))) marks.push({ at: m.index, kind: 'nice' });
        marks.sort((a, b) => a.at - b.at);
        return marks.map((mk, i) => ({ kind: mk.kind, from: mk.at, to: i + 1 < marks.length ? marks[i + 1].at : text.length }));
    }

    function zoneOf(secs, index) {
        for (const s of secs) if (index >= s.from && index < s.to) return s.kind;
        return null;
    }

    /* ---------------------------------------------------------
     * 4. Requirement extraction
     * ------------------------------------------------------- */

    const YEARS_RE = /(\d{1,2})\s*(?:\+|plus)?\s*(?:\s*(?:-|–|to)\s*\d{1,2}\s*)?(?:\+)?\s*(?:years?|yrs?)/;

    /* Years asked for near a mention, e.g. "5+ years of React". Looks in a
       window around the hit so it does not steal a number from another line —
       and never reuses the headline "8+ years of experience", which sits near
       everything in a short description without belonging to any of it. */
    function yearsNear(text, index, term, skipAt) {
        /* Asymmetric: JDs write "5+ years of React", occasionally
           "React (5+ years)", but rarely a figure a whole clause later. */
        const from = Math.max(0, index - 55);
        const w = text.slice(from, index + term.length + 25);
        const re = new RegExp(YEARS_RE.source, 'g');
        let m, best = null;
        while ((m = re.exec(w))) {
            const at = from + m.index;
            if (skipAt != null && Math.abs(at - skipAt) < 6) continue;
            /* Same clause only — a "|" between the figure and the term means
               the JD was listing, not qualifying. */
            const span = text.slice(Math.min(at, index), Math.max(at + m[0].length, index + term.length));
            if (span.indexOf('|') >= 0) continue;
            const d = Math.abs(at - index);
            if (!best || d < best.d) best = { d, years: Math.min(20, parseInt(m[1], 10)) };
        }
        return best ? best.years : null;
    }

    /* The overall "N+ years of experience" line: its value and where it sits. */
    function overallYears(text) {
        const m = text.match(/(\d{1,2})\s*(?:\+|plus)?\s*(?:\s*(?:-|–|to)\s*(\d{1,2})\s*)?(?:\+)?\s*(?:years?|yrs?)[^.]{0,40}?\bexperience\b/) ||
            text.match(/\bexperience\b[^.]{0,30}?(\d{1,2})\s*(?:\+|plus)?\s*(?:years?|yrs?)/);
        if (!m) return { years: null, at: null };
        /* index of the number itself, not of the sentence it opens */
        const at = m.index + m[0].search(/\d/);
        return { years: Math.min(20, parseInt(m[1], 10)), at };
    }

    /* Which of Ajith's roles and projects actually used this skill. */
    function evidenceFor(skill) {
        const terms = uniq([skill.id].concat(skill.aliases || []).filter(t => t.length > 2 && !NOISY_ALIASES.has(t)));
        const inStack = (stack) => (stack || []).some(s => { const n = norm(s); return terms.some(t => hits(n, t).length); });
        const roles = (KB.experience || []).filter(x => inStack(x.stack)).map(x => x.short);
        const projects = (KB.projects || []).filter(p => inStack(p.stack)).map(p => p.name);
        return { roles: roles.slice(0, 3), projects: projects.slice(0, 2) };
    }

    function matchSkills(text, secs, skipAt) {
        const out = [];
        (KB.skills || []).forEach(skill => {
            const terms = uniq([skill.id].concat(skill.aliases || []));
            let count = 0, first = -1, zone = null, want = null, hitTerm = null;
            terms.forEach(term => {
                if (term.length < 2) return;
                /* Noisy aliases still count once a stronger alias has matched —
                   they add weight to a real hit but never create one alone. */
                const noisy = NOISY_ALIASES.has(term);
                const at = hits(text, term);
                if (!at.length) return;
                if (noisy) { count += Math.min(at.length, 2) * 0.5; return; }
                count += at.length;
                if (first < 0 || at[0] < first) { first = at[0]; hitTerm = term; }
                at.forEach(i => {
                    const z = zoneOf(secs, i);
                    if (z === 'must' || (z === 'nice' && zone !== 'must')) zone = z;
                    const y = yearsNear(text, i, term, skipAt);
                    if (y != null) want = Math.max(want || 0, y);
                });
            });
            if (first < 0) return;

            /* Weight: how loudly the JD asks for it. */
            let weight = 1 + Math.min(count - 1, 4) * 0.3;
            if (zone === 'must') weight += 0.8;
            if (zone === 'nice') weight *= 0.5;
            if (first < text.length * 0.12) weight += 0.4;   // in the title / opening blurb
            weight = Math.min(weight, 3.2);

            /* Strength: how well the CV answers it. */
            let strength = 1, gapNote = null;
            if (want != null && skill.years < want) {
                const ratio = skill.years / want;
                strength = ratio >= 0.7 ? 0.85 : ratio >= 0.45 ? 0.65 : 0.45;
                gapNote = `asks for ${want}+ yrs · has ${skill.years}`;
            }
            if (skill.level < 60) strength = Math.min(strength, 0.7);

            out.push({
                kind: 'skill', id: skill.id, name: skill.name, note: skill.note,
                years: skill.years, level: skill.level, want, weight, strength, count,
                mustHave: zone === 'must', niceToHave: zone === 'nice',
                gapNote, term: hitTerm, evidence: evidenceFor(skill)
            });
        });
        return out.sort((a, b) => (b.weight * b.strength) - (a.weight * a.strength));
    }

    function matchGaps(text, secs) {
        const out = [];
        OUTSIDE.forEach(item => {
            let count = 0, first = -1, zone = null;
            item.terms.forEach(term => {
                const at = hits(text, term);
                if (!at.length) return;
                count += at.length;
                if (first < 0 || at[0] < first) first = at[0];
                at.forEach(i => { const z = zoneOf(secs, i); if (z === 'must' || (z === 'nice' && zone !== 'must')) zone = z; });
            });
            if (first < 0) return;
            let weight = 1.2 + Math.min(count - 1, 3) * 0.3;
            if (zone === 'must') weight += 0.8;
            if (zone === 'nice') weight *= 0.65;
            weight = Math.min(weight, 3.2);
            out.push({ kind: 'gap', id: item.id, name: item.label, near: item.near, weight, count, mustHave: zone === 'must', niceToHave: zone === 'nice' });
        });
        return out.sort((a, b) => b.weight - a.weight);
    }

    /* ---------------------------------------------------------
     * 5. Context: seniority, location, work mode, domain
     * ------------------------------------------------------- */

    const PLACES = [
        { terms: ['dubai', 'uae', 'united arab emirates', 'abu dhabi', 'sharjah', 'dxb'], label: 'the UAE', local: true },
        { terms: ['saudi', 'riyadh', 'jeddah', 'ksa', 'qatar', 'doha', 'kuwait', 'bahrain', 'oman', 'muscat', 'gcc'], label: 'the wider GCC', local: false },
        { terms: ['singapore', 'india', 'bangalore', 'bengaluru', 'hyderabad', 'mumbai', 'pune', 'chennai', 'kochi', 'cochin'], label: 'Asia', local: false },
        { terms: ['london', 'uk', 'united kingdom', 'england', 'ireland', 'dublin', 'europe', 'germany', 'berlin', 'munich', 'netherlands', 'amsterdam', 'poland', 'portugal', 'lisbon', 'spain', 'madrid'], label: 'Europe', local: false },
        { terms: ['usa', 'united states', 'new york', 'san francisco', 'california', 'texas', 'austin', 'seattle', 'boston', 'toronto', 'canada', 'vancouver'], label: 'North America', local: false },
        { terms: ['australia', 'sydney', 'melbourne', 'new zealand'], label: 'Australia / NZ', local: false }
    ];

    function readContext(text) {
        const ctx = { seniority: null, place: null, mode: null, visa: false, contract: null, leadership: false, domains: [] };

        if (JUNIOR_RE.test(text)) ctx.seniority = 'junior';
        else if (/\b(principal|staff engineer|head of|director|vp of|vice president|cto)\b/.test(text)) ctx.seniority = 'principal';
        else if (SENIOR_RE.test(text)) ctx.seniority = 'senior';
        else if (MID_RE.test(text)) ctx.seniority = 'mid';

        for (const p of PLACES) if (p.terms.some(t => hits(text, t).length)) { ctx.place = p; break; }

        if (/\b(fully remote|remote[- ]first|work from anywhere|100% remote)\b/.test(text)) ctx.mode = 'remote';
        else if (/\bhybrid\b/.test(text)) ctx.mode = 'hybrid';
        else if (/\b(on[- ]?site|in[- ]office|onsite)\b/.test(text)) ctx.mode = 'onsite';
        else if (/\bremote\b/.test(text)) ctx.mode = 'remote';

        ctx.visa = /\b(visa|sponsorship|sponsor|work permit|relocation|relocate|right to work|work authori[sz]ation)\b/.test(text);
        if (/\b(contract|contractor|freelance|b2b|outsourc)\w*\b/.test(text)) ctx.contract = 'contract';
        else if (/\b(part[- ]time)\b/.test(text)) ctx.contract = 'part-time';
        ctx.leadership = /\b(lead|leading|mentor|mentoring|coach|line manage|manage a team|team lead|own the|ownership|code review|guide junior)\b/.test(text);

        DOMAINS.forEach(d => { const n = d.terms.reduce((s, t) => s + hits(text, t).length, 0); if (n) ctx.domains.push({ id: d.id, label: d.label, evidence: d.evidence(), n }); });
        ctx.domains.sort((a, b) => b.n - a.n);
        return ctx;
    }

    /* ---------------------------------------------------------
     * 6. Score
     * ------------------------------------------------------- */

    function scoreOf(matched, gaps, ctx, wantYears, haveYears) {
        const got = matched.reduce((s, m) => s + m.weight * m.strength, 0);
        const asked = matched.reduce((s, m) => s + m.weight, 0) + gaps.reduce((s, g) => s + g.weight, 0);
        if (!asked) return 0;
        /* Damped: the CV side of this matcher is exhaustive while the gap
           lexicon is finite, so raw coverage always reads a little high. */
        let score = 93 * got / asked;

        /* Seniority and total-experience reality checks. */
        if (ctx.seniority === 'principal') score -= 8;
        if (ctx.seniority === 'junior') score -= 18;
        if (ctx.seniority === 'senior' && haveYears >= 6) score += 2;
        if (wantYears != null) {
            if (haveYears >= wantYears) score += 2;
            else score -= Math.min(15, (wantYears - haveYears) * 3.5);
        }
        /* Never claim a perfect fit — no CV is one. */
        return Math.max(8, Math.min(94, Math.round(score)));
    }

    function bandOf(score) {
        if (score >= 80) return { key: 'strong', label: 'Strong match' };
        if (score >= 65) return { key: 'good', label: 'Good match' };
        if (score >= 45) return { key: 'partial', label: 'Partial match' };
        return { key: 'low', label: 'Limited overlap' };
    }

    /* ---------------------------------------------------------
     * 7. "How he'd help here" — grounded in the CV, not invented
     * ------------------------------------------------------- */

    function buildPlays(matched, ctx) {
        const by = {};
        matched.forEach(m => { by[m.id] = m; });
        const w = (...ids) => ids.reduce((s, id) => s + (by[id] ? by[id].weight : 0), 0);
        const out = [];
        const add = (weight, icon, title, text) => { if (weight > 0) out.push({ weight, icon, title, text }); };

        add(w('ai', 'ml'), 'fa-brain', 'Own the AI layer, not just the API key',
            'Designs RAG pipelines, context-aware document search, prompt-engineered workflows and agentic automation with Claude, OpenAI and local Ollama models — and shipped in-sprint AI automation inside a bank. The assistant on this page is his: intent classifier plus BM25 retrieval over his own CV, running entirely in your browser.');

        add(w('react', 'nextjs', 'node', 'typescript', 'javascript', 'tailwind') * 0.55, 'fa-layer-group', 'Cover the full stack without a handoff',
            'React, Next.js, TypeScript and Tailwind on the front, Node.js/Express microservices and REST/GraphQL APIs behind them — the same end-to-end delivery he does today on Emirates NBD\'s Relationship Manager platform.');

        add(w('aws', 'docker', 'kubernetes', 'cicd') * 0.7, 'fa-cloud-upload-alt', 'Take features all the way to production',
            'Deploys what he builds: AWS (EC2, EKS, Lambda, S3, RDS, ElastiCache), Docker and Kubernetes, with Jenkins and Bitbucket Pipelines wiring the releases. No waiting on someone else to ship it.');

        add(w('mongodb', 'sql', 'postgresql', 'redis', 'oracledb', 'dynamodb', 'neo4j') * 0.6, 'fa-database', 'Design the data layer for the load it will actually see',
            'Schema design and query optimisation across MongoDB, PostgreSQL, MySQL/MariaDB, OracleDB, Redis, DynamoDB and Neo4j — chosen per workload rather than per habit.');

        add(w('swift', 'kotlin', 'reactnative', 'flutter') * 0.8, 'fa-mobile-alt', 'Ship the mobile side too',
            'Native iOS in Swift/SwiftUI with WidgetKit and Face ID (Gold Vault Tracker, on the App Store), Kotlin on Android, and React Native for the white-labelled Tutorhow training app on a serverless AWS backend.');

        add(w('architecture', 'api') * 0.6, 'fa-sitemap', 'Bring the architecture conversation, not just the ticket',
            'Microservices design, load optimisation and system efficiency for distributed systems — plus REST, GraphQL, Kafka and WebSocket messaging between them.');

        add(ctx.leadership ? 2.2 : 0, 'fa-users', 'Lead without stepping back from the code',
            'Led 3 developers and 2 QA engineers at Tutorhow — delivery, quality standards, mentoring and code reviews — while still building the platform himself.');

        add(ctx.mode === 'remote' ? 2 : ctx.mode === 'hybrid' ? 1.2 : 0, 'fa-globe', 'Already proven remote across time zones',
            'Worked three years fully remote for reach52 in Singapore from India and the UAE, with cross-functional product, design and QA teams spread across time zones.');

        ctx.domains.slice(0, 2).forEach((d, i) => add(2.4 - i * 0.6, 'fa-briefcase', 'Knows your domain: ' + d.label.toLowerCase(), d.evidence));

        add(0.5, 'fa-bolt', 'Moves fast on unfamiliar ground',
            'Four employers across banking, healthcare, edtech and IT services in seven years — a proven track record of learning a new stack and domain quickly and delivering on time.');

        return out.sort((a, b) => b.weight - a.weight).slice(0, 5);
    }

    /* ---------------------------------------------------------
     * 8. Analyse
     * ------------------------------------------------------- */

    function analyze(raw) {
        const source = String(raw || '').slice(0, 24000);
        const text = norm(source);
        const words = text.trim() ? text.trim().split(' ').length : 0;
        if (words < 12) return { ok: false, reason: 'short' };

        const secs = sections(text);
        const ctx = readContext(text);
        const overall = overallYears(text);
        const all = matchSkills(text, secs, overall.at);
        const gaps = matchGaps(text, secs);

        if (all.length + gaps.length < 2) return { ok: false, reason: 'unclear', words };

        const haveYears = AI && AI.totalYears ? Math.floor(AI.totalYears()) : 7;
        const wantYears = overall.years;
        const score = scoreOf(all, gaps, ctx, wantYears, haveYears);
        /* Five signals is not much to score on; say so instead of implying precision. */
        const thin = all.length + gaps.length < 5;

        const matched = all.filter(m => m.strength >= 0.8);
        const partial = all.filter(m => m.strength < 0.8);

        /* The job title is usually the first short line of a pasted JD. */
        const firstLine = String(source).split(/\n+/).map(s => s.trim()).filter(Boolean)[0] || '';
        const title = firstLine.length > 0 && firstLine.length <= 90 ? firstLine.replace(/\s+/g, ' ') : '';

        const questions = uniq([
            all[0] ? `How many years of ${shortName(all[0].name)} does Ajith have?` : null,
            gaps[0] ? `Does Ajith have any experience with ${shortName(gaps[0].name)}?` : null,
            ctx.domains[0] && ctx.domains[0].id === 'banking' ? 'What did he build at Emirates NBD?' :
                ctx.domains[0] && ctx.domains[0].id === 'health' ? 'What did he do at reach52?' : 'What is he working on right now?',
            ctx.visa || (ctx.place && !ctx.place.local) ? 'Is Ajith open to relocation?' : 'Is Ajith available for new roles?',
            'Why should I hire Ajith?'
        ].filter(Boolean)).slice(0, 5);

        return {
            ok: true, score, band: bandOf(score), title, words, thin,
            years: { want: wantYears, have: haveYears },
            ctx, matched, partial, gaps: gaps.slice(0, 8), all,
            plays: buildPlays(all, ctx),
            notes: buildNotes(ctx, wantYears, haveYears),
            questions
        };
    }

    /* Short, factual lines about the things a JD asks that are not skills. */
    function buildNotes(ctx, wantYears, haveYears) {
        const p = KB.profile, out = [];
        if (wantYears != null) {
            out.push({ icon: 'fa-hourglass-half', label: 'Experience', text: haveYears >= wantYears
                ? `Asks for ${wantYears}+ years — Ajith has ${haveYears}+ across four employers since 2019.`
                : `Asks for ${wantYears}+ years — Ajith has ${haveYears}+, so slightly under on paper.` });
        }
        if (ctx.seniority) {
            const map = {
                senior: `Senior-level scope fits: ${haveYears}+ years, currently building corporate-banking platforms at Emirates NBD, previously lead developer over a team of five.`,
                principal: `Principal/head-of scope is a stretch on title, though he has led a 5-person team and owns architecture decisions on his current platform.`,
                mid: `Mid-level ask — comfortably covered, and he would likely land at the top of the band.`,
                junior: `Written for a junior — Ajith is ${haveYears}+ years in, so this would be a step down unless the scope is broader than the title.`
            };
            out.push({ icon: 'fa-user-tie', label: 'Seniority', text: map[ctx.seniority] });
        }
        if (ctx.place || ctx.mode || ctx.visa) {
            const bits = [`Based in ${p.location.short}, ${p.location.tz}`];
            if (ctx.mode === 'remote') bits.push('remote is proven — three years fully remote for a Singapore company');
            if (ctx.mode === 'hybrid' || ctx.mode === 'onsite') bits.push(ctx.place && ctx.place.local ? 'already on the ground in the UAE, no relocation needed' : 'open to relocation for the right role');
            if (ctx.place && !ctx.place.local) bits.push(`this role reads as ${ctx.place.label} — he is open to relocating`);
            if (ctx.visa) bits.push('holds a UAE residence visa; would need sponsorship elsewhere');
            out.push({ icon: 'fa-map-marker-alt', label: 'Location & mode', text: bits.join('; ') + '.' });
        }
        if (ctx.contract) {
            out.push({ icon: 'fa-file-signature', label: 'Engagement', text: `Reads as ${ctx.contract} — worth raising directly; he is open to ${p.openTo}.` });
        }
        return out;
    }

    /* ---------------------------------------------------------
     * 9. Plaintext brief (copy / email)
     * ------------------------------------------------------- */

    function brief(r) {
        if (!r || !r.ok) return '';
        const p = KB.profile;
        const line = (s) => s + '\n';
        let out = '';
        out += line(`AJITH GOPI — JD MATCH ${r.score}% (${r.band.label})`);
        if (r.title) out += line(`Role: ${r.title}`);
        out += line(`Generated by the JD matcher on ${p.website} — scored in-browser against his CV.`);
        out += line('');
        if (r.matched.length) {
            out += line('MEETS');
            r.matched.slice(0, 14).forEach(m => {
                const ev = m.evidence.roles.length ? ` — ${m.evidence.roles.join(', ')}` : '';
                out += line(`  + ${m.name}: ${m.years} yrs${ev}`);
            });
            out += line('');
        }
        if (r.partial.length) {
            out += line('PARTIAL');
            r.partial.slice(0, 6).forEach(m => out += line(`  ~ ${m.name}: ${m.gapNote || `${m.years} yrs, working level`}`));
            out += line('');
        }
        if (r.gaps.length) {
            out += line('NOT ON THE CV');
            r.gaps.forEach(g => out += line(`  - ${g.name}: ${g.near}`));
            out += line('');
        }
        if (r.plays.length) {
            out += line('WHERE HE WOULD HELP');
            r.plays.forEach(pl => out += line(`  * ${pl.title} — ${pl.text}`));
            out += line('');
        }
        if (r.notes.length) {
            out += line('NOTES');
            r.notes.forEach(n => out += line(`  ${n.label}: ${n.text}`));
            out += line('');
        }
        out += line(`Contact: ${p.email} · ${p.phone} · ${p.socials.linkedin}`);
        return out;
    }

    global.AjithJD = { analyze, brief, norm, hits };

    /* ---------------------------------------------------------
     * 10. UI — the recruiter toolkit inside #recruiterModal
     * ------------------------------------------------------- */

    const SAMPLE = `Senior Full Stack Engineer (AI Products)
Dubai, UAE · Hybrid

About the role
We are building AI-assisted products for enterprise banking clients and are looking for a senior full stack engineer to own features end to end.

Requirements
- 6+ years of professional software engineering experience
- Strong JavaScript and TypeScript, with 4+ years of React
- Node.js and Express microservices in production
- Experience integrating LLMs — RAG pipelines, embeddings, prompt engineering
- MongoDB and PostgreSQL; comfortable with schema design and query optimisation
- AWS (EC2, Lambda, S3), Docker and CI/CD pipelines
- Experience mentoring engineers and running code reviews

Nice to have
- Kubernetes
- Next.js
- Exposure to Java or Spring Boot
- Terraform`;

    function pct(n) { return Math.max(0, Math.min(100, Math.round(n))); }

    function ring(score, band) {
        const deg = pct(score) * 3.6;
        return `<div class="jd-score jd-score--${band.key}" style="--deg:${deg}deg" role="img" aria-label="${score} percent — ${esc(band.label)}">
            <div class="jd-score__inner"><span class="jd-score__num">${score}<small>%</small></span></div>
        </div>`;
    }

    function evidenceLine(m) {
        const bits = [];
        if (m.evidence.roles.length) bits.push(m.evidence.roles.join(' · '));
        if (m.evidence.projects.length) bits.push(m.evidence.projects.join(' · '));
        return bits.join(' — ');
    }

    function reqRow(m, tone, showMust) {
        const badge = m.mustHave ? (showMust ? '<span class="jd-req__flag must">must-have</span>' : '') : m.niceToHave ? '<span class="jd-req__flag nice">nice-to-have</span>' : '';
        const ev = evidenceLine(m);
        const meta = m.gapNote ? esc(m.gapNote) : `${m.years} yrs hands-on`;
        return `<li class="jd-req jd-req--${tone}">
            <i class="fas ${tone === 'yes' ? 'fa-check-circle' : 'fa-adjust'} jd-req__icon"></i>
            <div class="jd-req__body">
                <div class="jd-req__head"><span class="jd-req__name">${esc(m.name)}</span>${badge}<span class="jd-req__meta">${meta}</span></div>
                ${ev ? `<div class="jd-req__ev">${esc(ev)}</div>` : ''}
                <div class="jd-req__bar"><span style="width:${pct(m.level)}%"></span></div>
            </div>
        </li>`;
    }

    function gapRow(g, showMust) {
        const badge = g.mustHave ? (showMust ? '<span class="jd-req__flag must">must-have</span>' : '') : g.niceToHave ? '<span class="jd-req__flag nice">nice-to-have</span>' : '';
        return `<li class="jd-req jd-req--no">
            <i class="fas fa-minus-circle jd-req__icon"></i>
            <div class="jd-req__body">
                <div class="jd-req__head"><span class="jd-req__name">${esc(g.name)}</span>${badge}<span class="jd-req__meta">not on the CV</span></div>
                <div class="jd-req__ev">${esc(g.near)}</div>
            </div>
        </li>`;
    }

    function render(r) {
        if (!r.ok) {
            const msg = r.reason === 'short'
                ? 'That looks a little short. Paste the full job description — title, responsibilities and requirements — and I will match it line by line.'
                : 'I could not pick out any concrete requirements from that. Paste the requirements or must-have section and try again.';
            return `<div class="jd-empty"><i class="fas fa-info-circle"></i> ${msg}</div>`;
        }

        const p = KB.profile;
        const matched = r.matched.slice(0, 16), partial = r.partial.slice(0, 8), gaps = r.gaps;
        const hidden = (r.matched.length - matched.length) + (r.partial.length - partial.length);
        /* A must-have badge on every single row says nothing — only show it
           when the description actually separated the two. */
        const showMust = matched.concat(partial, gaps).some(x => !x.mustHave);
        const summary = [
            r.matched.length ? `${r.matched.length} requirement${r.matched.length === 1 ? '' : 's'} met` : null,
            r.partial.length ? `${r.partial.length} partial` : null,
            r.gaps.length ? `${r.gaps.length} not covered` : null
        ].filter(Boolean).join(' · ');

        return `
        <div class="jd-head">
            ${ring(r.score, r.band)}
            <div class="jd-head__text">
                <span class="jd-band jd-band--${r.band.key}">${esc(r.band.label)}</span>
                <h6 class="jd-head__title">${esc(r.title || 'This role')}</h6>
                <p class="jd-head__sub">${esc(summary)}${r.years.want ? ` · asks for ${r.years.want}+ yrs, has ${r.years.have}+` : ''}</p>
                ${r.thin ? '<p class="jd-head__thin"><i class="fas fa-exclamation-triangle"></i> Only a handful of requirements were detected — paste the full description for a sharper read.</p>' : ''}
                <div class="jd-head__chips">
                    ${r.ctx.seniority ? `<span class="tag-chip">${esc(r.ctx.seniority)} level</span>` : ''}
                    ${r.ctx.mode ? `<span class="tag-chip">${esc(r.ctx.mode)}</span>` : ''}
                    ${r.ctx.place ? `<span class="tag-chip">${esc(r.ctx.place.label)}</span>` : ''}
                    ${r.ctx.domains.slice(0, 2).map(d => `<span class="tag-chip ai">${esc(d.label)}</span>`).join('')}
                </div>
            </div>
        </div>

        <div class="jd-grid">
            <section class="jd-block">
                <h6 class="jd-block__title"><i class="fas fa-clipboard-check"></i> Requirement by requirement</h6>
                <ul class="jd-req-list">
                    ${matched.map(m => reqRow(m, 'yes', showMust)).join('')}
                    ${partial.map(m => reqRow(m, 'part', showMust)).join('')}
                    ${gaps.map(g => gapRow(g, showMust)).join('')}
                </ul>
                ${hidden ? `<p class="jd-note">${hidden} weaker signal${hidden === 1 ? '' : 's'} from the description not shown.</p>` : ''}
            </section>

            <section class="jd-block">
                <h6 class="jd-block__title"><i class="fas fa-hand-holding-heart"></i> Where he would help</h6>
                <ul class="jd-play-list">
                    ${r.plays.map(pl => `<li class="jd-play"><i class="fas ${pl.icon}"></i><div><strong>${esc(pl.title)}</strong><span>${esc(pl.text)}</span></div></li>`).join('')}
                </ul>
                ${r.notes.length ? `<h6 class="jd-block__title mt"><i class="fas fa-info-circle"></i> Worth knowing</h6>
                <ul class="jd-note-list">
                    ${r.notes.map(n => `<li><i class="fas ${n.icon}"></i><div><strong>${esc(n.label)}</strong><span>${esc(n.text)}</span></div></li>`).join('')}
                </ul>` : ''}
            </section>
        </div>

        <div class="jd-ask">
            <span class="jd-ask__label"><i class="fas fa-comments"></i> Dig deeper with the assistant</span>
            <div class="jd-ask__chips">
                ${r.questions.map(q => `<button type="button" class="filter-tab jd-ask__chip" data-jd-ask="${esc(q)}">${esc(q)}</button>`).join('')}
            </div>
        </div>

        <div class="jd-actions">
            <button type="button" class="btn-ghost btn-sm-custom" id="jd-copy"><i class="fas fa-copy"></i> Copy the brief</button>
            <a class="btn-ghost btn-sm-custom" id="jd-email" href="#"><i class="fas fa-envelope"></i> Email this to Ajith</a>
            <a class="btn-ghost btn-sm-custom" href="${esc(p.socials.linkedin)}" target="_blank" rel="noopener"><i class="fab fa-linkedin"></i> LinkedIn</a>
            <span class="jd-disclaimer">Scored in your browser against Ajith's CV — a starting point for the conversation, not a verdict.</span>
        </div>`;
    }

    /* ---------------------------------------------------------
     * 8. Matching loader — the same reasoning trace the assistant
     *    shows while it thinks. The analysis itself is instant, so
     *    the steps are paced: they describe what actually ran, and
     *    give the recruiter something to read instead of a flash.
     * ------------------------------------------------------- */

    const REDUCE_MOTION = !!(global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    function loaderHtml() {
        return `<div class="ai-trace jd-trace" id="jd-trace">
            <div class="ai-trace__summary"><i class="fas fa-brain fa-spin"></i> Matching against the CV<span class="thinking-dots"><span></span><span></span><span></span></span></div>
            <div class="ai-trace__steps" id="jd-trace-steps"></div>
        </div>`;
    }

    /* Every line is derived from the result, so the trace never claims
       work that did not happen. */
    function loaderSteps(r, wordCount) {
        const steps = [];
        /* The UI's own word count, so the trace and the counter under the
           textarea never disagree (the analyser counts normalised tokens). */
        const words = (wordCount != null ? wordCount : r.words) || 0;
        steps.push({ icon: 'fa-file-lines', text: `Read the job description — ${words} ${words === 1 ? 'word' : 'words'}${r.title ? ` · “${shortName(r.title)}”` : ''}.` });
        if (!r.ok) {
            steps.push({ icon: 'fa-magnifying-glass', text: 'Scanned it for skills, tools and requirement lines.' });
            return steps;
        }
        steps.push({ icon: 'fa-layer-group', text: 'Split the text into must-have and nice-to-have sections.' });
        const reqs = r.all.length + r.gaps.length;
        steps.push({ icon: 'fa-key', text: `Extracted ${reqs} ${reqs === 1 ? 'requirement' : 'requirements'}${r.years && r.years.want ? `, including the ${r.years.want} years it asks for` : ''}.` });
        steps.push({ icon: 'fa-database', text: `Looked each one up in the CV knowledge base — ${r.matched.length} solid, ${r.partial.length} partial.` });
        steps.push({ icon: r.gaps.length ? 'fa-triangle-exclamation' : 'fa-check', text: r.gaps.length ? `Flagged ${r.gaps.length} ${r.gaps.length === 1 ? 'gap' : 'gaps'} and the nearest thing on the CV to each.` : 'Found nothing asked for that the CV does not cover.' });
        steps.push({ icon: 'fa-scale-balanced', text: 'Weighted the score by must-have vs nice-to-have and by the years each line asks for.' });
        steps.push({ icon: 'fa-pen-nib', text: 'Writing up the fit, the gaps and where he would help…' });
        return steps;
    }

    function initUI() {
        const modal = document.getElementById('recruiterModal');
        const input = document.getElementById('jd-input');
        const runBtn = document.getElementById('jd-run');
        const out = document.getElementById('jd-result');
        if (!modal || !input || !runBtn || !out || !KB) return;

        const count = document.getElementById('jd-count');
        const runLabel = runBtn.innerHTML;
        const clearBtn = document.getElementById('jd-clear');
        const sampleBtn = document.getElementById('jd-sample');
        let last = null;

        const words = () => input.value.trim() ? input.value.trim().split(/\s+/).length : 0;
        const syncCount = () => {
            const n = words();
            if (count) count.textContent = n === 1 ? '1 word' : n + ' words';
            runBtn.disabled = n < 12;
        };

        /* Bumped on every run (and on clear) so a trace still playing out
           from an earlier click stops touching the DOM. */
        let runToken = 0;

        async function playSteps(steps, token) {
            const host = document.getElementById('jd-trace-steps');
            if (!host) return;
            let live = null, liveData = null;
            const settle = () => {
                if (!live || live.classList.contains('done')) { live = null; return; }
                live.classList.add('done');
                const ic = live.querySelector('i');
                if (ic) ic.className = 'fas ' + ((liveData && liveData.icon) || 'fa-check');
                live = null;
            };
            for (let i = 0; i < steps.length; i++) {
                if (token !== runToken) return;
                settle();
                host.insertAdjacentHTML('beforeend', `<div class="ai-trace__step"><i class="fas fa-circle-notch fa-spin"></i><span>${esc(steps[i].text)}</span></div>`);
                live = host.lastElementChild; liveData = steps[i];
                if (!REDUCE_MOTION) await sleep(150 + Math.random() * 170);
            }
            if (token !== runToken) return;
            settle();
            if (!REDUCE_MOTION) await sleep(180);
        }

        async function run() {
            const token = ++runToken;
            const r = analyze(input.value);
            last = r;

            /* Show the trace first, then swap in the result it produced. */
            out.hidden = false;
            out.innerHTML = loaderHtml();
            out.classList.remove('is-in');
            requestAnimationFrame(() => out.classList.add('is-in'));
            const trace = document.getElementById('jd-trace');
            if (trace && trace.scrollIntoView) setTimeout(() => { if (token === runToken) trace.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, 60);

            runBtn.disabled = true;
            runBtn.classList.add('is-busy');
            runBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Matching…';
            try {
                await playSteps(loaderSteps(r, words()), token);
            } finally {
                if (token === runToken) { runBtn.classList.remove('is-busy'); runBtn.innerHTML = runLabel; syncCount(); }
            }
            if (token !== runToken) return;

            out.innerHTML = render(r);
            if (!r.ok) return;

            const copy = document.getElementById('jd-copy');
            if (copy) copy.addEventListener('click', () => {
                const text = brief(last);
                const done = () => { copy.innerHTML = '<i class="fas fa-check"></i> Copied'; setTimeout(() => { copy.innerHTML = '<i class="fas fa-copy"></i> Copy the brief'; }, 1800); };
                if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, () => fallbackCopy(text, done));
                else fallbackCopy(text, done);
            });

            const mail = document.getElementById('jd-email');
            if (mail) {
                const subject = `Role for you: ${last.title || 'opportunity'} (${last.score}% match)`;
                const body = brief(last) + '\n---\nSent from the JD matcher on ' + KB.profile.website + '\n\nAbout the role:\n';
                mail.href = `mailto:${KB.profile.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body.slice(0, 1600))}`;
            }

            out.querySelectorAll('[data-jd-ask]').forEach(b => b.addEventListener('click', () => {
                const q = b.dataset.jdAsk;
                if (global.bootstrap) { const inst = global.bootstrap.Modal.getInstance(modal); if (inst) inst.hide(); }
                if (typeof global.sendAIPrompt === 'function') setTimeout(() => global.sendAIPrompt(q), 320);
            }));

            /* Long results: bring the score into view rather than leaving the
               recruiter staring at the textarea they just filled. */
            const head = out.querySelector('.jd-head');
            if (head && head.scrollIntoView) setTimeout(() => head.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 60);
        }

        function fallbackCopy(text, done) {
            const ta = document.createElement('textarea');
            ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
            document.body.appendChild(ta); ta.select();
            try { document.execCommand('copy'); done(); } catch (e) { /* ignore */ }
            document.body.removeChild(ta);
        }

        input.addEventListener('input', syncCount);
        runBtn.addEventListener('click', run);
        /* Ctrl/Cmd + Enter runs it without reaching for the mouse. */
        input.addEventListener('keydown', (e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && !runBtn.disabled) { e.preventDefault(); run(); } });
        if (clearBtn) clearBtn.addEventListener('click', () => { runToken++; input.value = ''; syncCount(); out.hidden = true; out.innerHTML = ''; input.focus(); });
        if (sampleBtn) sampleBtn.addEventListener('click', () => { input.value = SAMPLE; syncCount(); run(); });

        /* Tabs */
        const tabs = Array.from(modal.querySelectorAll('[data-rt-tab]'));
        tabs.forEach(t => t.addEventListener('click', () => {
            tabs.forEach(x => { x.classList.toggle('active', x === t); x.setAttribute('aria-selected', x === t ? 'true' : 'false'); });
            modal.querySelectorAll('[data-rt-pane]').forEach(p => { p.hidden = p.dataset.rtPane !== t.dataset.rtTab; });
        }));

        modal.addEventListener('shown.bs.modal', () => { if (!out.innerHTML) input.focus(); });
        syncCount();
    }

    document.addEventListener('DOMContentLoaded', initUI);
})(window);
