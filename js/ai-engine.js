/* =============================================================
 * Ajith AI — Local Reasoning Engine (v3)
 * -------------------------------------------------------------
 * Runs 100% in the browser. No server, no API keys, no tracking.
 *
 * Pipeline:
 *   normalize → spell-correct → slash commands → context/follow-up
 *   resolution → entity extraction → intent classification →
 *   BM25 retrieval over the CV knowledge base → answer composition
 *   (markdown-lite) → follow-up suggestions + page actions.
 *
 * Public API (window.AjithAI):
 *   const engine = AjithAI.createEngine();
 *   const res = engine.ask("How many years of React?");
 *   res => { text, html, reasoning[], followups[], actions[],
 *            intent, confidence, entities, sources[] }
 *   engine.reset();  engine.buildSystemPrompt(query) → string for LLMs
 * ============================================================= */
(function (global) {
    'use strict';

    /* ---------------------------------------------------------
     * 1. Knowledge base
     * ------------------------------------------------------- */
    const KB = {
        profile: {
            name: 'Ajith Gopi',
            first: 'Ajith',
            title: 'Full Stack & AI Engineer',
            headline: 'Full Stack Engineer specialising in Node, React, Next.js, MongoDB, SQL and AI/LLM integrations.',
            careerStart: '2019-06',
            location: { city: 'Dubai', country: 'United Arab Emirates', short: 'Dubai, UAE', origin: 'Kerala, India', tz: 'GST (UTC+4)' },
            email: 'ajithgopikklm@gmail.com',
            email2: 'me@agopi.in',
            phone: '(+971) 555-166-278',
            website: 'https://agopi.in',
            cv: 'Ajith - CV.pdf',
            socials: {
                github: 'https://github.com/ajithgopi',
                linkedin: 'https://www.linkedin.com/in/ahgopi/',
                stackoverflow: 'https://stackoverflow.com/users/5321660/ajith-gopi',
                youtube: 'https://www.youtube.com/distrostudios',
                instagram: 'https://instagram.com/ajith_gp',
                twitter: 'https://twitter.com/ahgopi'
            },
            summary: [
                'Full-stack developer proficient in JavaScript (ES6+), TypeScript, React, Next.js and Tailwind CSS, with backend experience in Node.js, PHP (Laravel) and Python.',
                'Expertise in AWS cloud infrastructure, microservices architecture and CI/CD pipelines for scalable distributed systems.',
                'Strong database skills: schema design and query optimisation across SQL (MySQL, PostgreSQL, MariaDB) and NoSQL (MongoDB, DynamoDB, Redis, Neo4j).',
                'Prioritises AI-assisted engineering (Claude, OpenAI, Ollama) with in-sprint automation, RAG pipelines and agentic workflows.',
                'Skilled in UI/UX principles, building high-fidelity, intuitive interfaces with a detail-oriented approach.'
            ],
            competencies: [
                'Strong knowledge of algorithms, data structures and software architecture design',
                'Expert in problem-solving, debugging and performance optimisation; writes clean, well-documented code',
                'Proven ability to learn and apply new technologies quickly',
                'Leadership with a sense of ownership and a track record of delivering on time',
                'Fluent in English with excellent collaboration skills in cross-functional teams'
            ],
            education: {
                degree: 'Bachelor of Computer Application (BCA)',
                school: 'Mahatma Gandhi University',
                place: 'Kottayam, Kerala, India',
                years: '2016 – 2019',
                grade: '7.7 CGPA'
            },
            languages: ['English (fluent, professional working language)'],
            interests: ['Music — a passionate musician', 'Runs the YouTube channel Distro Studios', 'IoT and multimedia automation', 'Building game-server control panels'],
            openTo: 'senior full-stack, AI architecture and LLM-integration roles (on-site in Dubai, remote, or relocation for the right opportunity)'
        },

        experience: [
            {
                id: 'enbd', company: 'Emirates NBD', short: 'Emirates NBD', via: 'Synechron Technologies', role: 'Full Stack Engineer (Corporate Banking)',
                location: 'Dubai, UAE', start: '2024-11', end: null, current: true,
                aliases: ['emirates nbd', 'emirates', 'enbd', 'synechron', 'bank', 'banking', 'corporate banking', 'current job', 'current role', 'current company'],
                summary: 'Builds corporate-banking applications for Relationship Managers’ daily workflows and deal management.',
                highlights: [
                    'Developed full-fledged corporate banking applications for Relationship Manager daily-job management and deal processing',
                    'Built with React and Node.js on custom internal frameworks; supports deployments',
                    'MongoDB as the primary application database, OracleDB for reading shared-service data',
                    'Collaborates with architecture and security teams to keep the banking environment safe and compliant',
                    'Prioritised AI-based (Claude) development and wrote in-sprint automation while delivering features'
                ],
                stack: ['React', 'Node.js', 'MongoDB', 'OracleDB', 'Claude AI automation', 'TypeScript']
            },
            {
                id: 'reach52', company: 'reach52 Pte. Ltd.', short: 'reach52', via: null, role: 'Full Stack Engineer',
                location: 'Singapore (remote)', start: '2022-01', end: '2024-11', current: false,
                aliases: ['reach52', 'reach 52', 'singapore', 'healthcare'],
                summary: 'Engineered microservices-based data-management and analytics applications for a global healthcare organisation.',
                highlights: [
                    'Developed and deployed microservices with Next.js and Node.js (Express) in JavaScript/TypeScript and MongoDB',
                    'Leveraged AWS EC2, EKS, ElastiCache, Lambda, RDS and S3',
                    'Built responsive UIs with Angular, React, Redux and Tailwind CSS',
                    'Implemented CI/CD pipelines with Jenkins, Bitbucket Pipelines, Docker and Kubernetes',
                    'Conducted code reviews, maintained documentation and testing for quality and scalability',
                    'Worked fully remotely with cross-functional product, design and QA teams across time zones'
                ],
                stack: ['Next.js', 'Node.js', 'Express', 'TypeScript', 'MongoDB', 'PostgreSQL', 'Angular', 'React', 'Redux', 'Tailwind CSS', 'AWS', 'Docker', 'Kubernetes', 'Jenkins']
            },
            {
                id: 'tutorhow', company: 'Tutorhow Scientific Edutech Pvt. Ltd.', short: 'Tutorhow', via: null, role: 'Lead Developer / Full Stack Engineer',
                location: 'Cochin, India', start: '2020-01', end: '2021-12', current: false,
                aliases: ['tutorhow', 'tutor how', 'edtech', 'cochin', 'kochi', 'lead developer'],
                summary: 'Led a team of 3 developers and 2 QA engineers building edtech platforms, PWAs and mobile apps.',
                highlights: [
                    'Led a team of 3 developers and 2 QA professionals, overseeing delivery and quality standards',
                    'Delivered scalable apps with Next.js, Tailwind CSS, Laravel, MongoDB, MySQL, MariaDB, Redis, DynamoDB and WebSockets',
                    'Integrated real-time video and audio communication tools into web applications',
                    'Used AWS EC2, S3, SES, RDS and ElastiCache for cloud infrastructure',
                    'Developed React Native mobile apps; mentored the team and ran code reviews',
                    'Managed deployment processes and optimised application performance'
                ],
                stack: ['Next.js', 'Tailwind CSS', 'Laravel', 'PHP', 'Node.js', 'Python', 'Bash', 'MongoDB', 'MySQL', 'MariaDB', 'Redis', 'DynamoDB', 'WebSockets', 'React Native', 'AWS', 'Golang', 'Neo4j']
            },
            {
                id: 'infosys', company: 'Infosys Ltd.', short: 'Infosys', via: null, role: 'Systems Engineer',
                location: 'Bangalore, India', start: '2019-06', end: '2020-01', current: false,
                aliases: ['infosys', 'bangalore', 'bengaluru', 'servicenow', 'first job'],
                summary: 'Maintained Python web applications and supported the ServiceNow enterprise platform.',
                highlights: [
                    'Modified existing web applications written in Python',
                    'Provided technical support and resolution to end users on the ServiceNow platform',
                    'Responded to and resolved customer inquiries related to ServiceNow applications'
                ],
                stack: ['Python', 'ServiceNow', 'Web applications']
            }
        ],

        projects: [
            {
                id: 'insights', name: 'reach52 Insights', period: '2023 – present', company: 'reach52', category: ['ai', 'web', 'analytics'],
                aliases: ['insights', 'reach52 insights', 'analytics platform', 'monitoring platform', 'dashboard', 'dashboards'],
                summary: 'A closed enterprise platform for clients to monitor ongoing healthcare projects, presenting complex analytical and statistical data graphically in human-friendly formats.',
                stack: ['Node.js', 'React', 'Redux', 'React-Bootstrap', 'Express', 'PostgreSQL'],
                deploy: 'AWS EKS via Bitbucket Pipelines'
            },
            {
                id: 'connect', name: 'reach52 Connect', period: '2022 – 2023', company: 'reach52', category: ['web'],
                aliases: ['connect', 'reach52 connect', 'campaign', 'campaigns', 'admin automation'],
                summary: 'Internal application for the business-administration team to create campaigns and manage daily activities — automating user tracking and campaign management.',
                stack: ['Node.js', 'Angular', 'Material UI', 'Express', 'MongoDB'],
                deploy: 'AWS EC2 via Jenkins CI/CD'
            },
            {
                id: 'vfd', name: 'Tutorhow Virtual Front Desk', period: '2020 – 2021', company: 'Tutorhow', category: ['web', 'ai'],
                aliases: ['virtual front desk', 'front desk', 'lead management', 'lead system', 'lms', 'pwa', 'progressive web app'],
                summary: 'A lead-management Progressive Web App that acts as a high-performance, secure container for the ETO platform.',
                stack: ['Next.js (full stack)', 'Golang', 'MongoDB', 'Neo4j', 'MySQL', 'Redis'],
                deploy: 'Cloud PWA'
            },
            {
                id: 'mobile', name: 'Tutorhow Training Mobile App', period: '2019 – 2021', company: 'Tutorhow', category: ['mobile'],
                aliases: ['training mobile app', 'training app', 'tutorhow mobile', 'tutorhow app', 'white label', 'white-labelled', 'mobile app'],
                summary: 'A white-labelled mobile application that lets clients run their own training institutes, backed by serverless cloud infrastructure.',
                stack: ['React Native', 'MongoDB Atlas', 'AWS Lambda (serverless)'],
                deploy: 'App stores, serverless backend'
            },
            {
                id: 'eto', name: 'Tutorhow ETO', period: '2019 – 2021', company: 'Tutorhow', category: ['web'],
                aliases: ['eto', 'online class', 'online classes', 'fee platform', 'fees', 'fee collection', 'learning platform'],
                summary: 'Online-class platform letting teachers market under their own brand and collect student fees, with student management, assignments and scheduling.',
                stack: ['PHP Laravel', 'Node.js', 'HTML/CSS', 'Bootstrap', 'jQuery', 'MySQL', 'DynamoDB'],
                deploy: 'Unmanaged VPS via Bash and SSH'
            },
            {
                id: 'goldvault', name: 'Gold Vault Tracker', period: '2023 – present', company: 'Personal', category: ['mobile'],
                aliases: ['gold vault', 'gold vault tracker', 'gold tracker', 'gold app', 'vault', 'widgetkit', 'ios app'],
                summary: 'Native iOS asset-tracking app for precious metals with WidgetKit home-screen widgets, real-time market APIs and biometric (Face ID) authentication.',
                stack: ['Swift', 'SwiftUI', 'WidgetKit', 'Market data APIs'],
                deploy: 'App Store'
            },
            {
                id: 'site', name: 'This portfolio & AI assistant', period: '2026', company: 'Personal', category: ['ai', 'web'],
                aliases: ['this website', 'this site', 'portfolio site', 'this page', 'this chatbot', 'this assistant', 'this bot', 'agopi.in'],
                summary: 'Static site on GitHub Pages with canvas-rendered 3D neural visuals and a fully client-side AI assistant (intent classifier + BM25 retrieval over the CV, with optional WebGPU in-browser LLM or local Ollama backends).',
                stack: ['Vanilla JS', 'Canvas 2D', 'Bootstrap 5', 'WebGPU / WebLLM (optional)', 'Ollama (optional)'],
                deploy: 'GitHub Pages'
            }
        ],

        /* Skills: level = 0-100 proficiency, years = hands-on years */
        skills: [
            { id: 'javascript', name: 'JavaScript (ES6+)', cat: 'web', years: 7, level: 95, aliases: ['javascript', 'js', 'es6', 'ecmascript', 'vanilla js', 'jquery'], note: 'Core language across React, Next.js, Node.js, Express and PWAs — used daily since 2019.' },
            { id: 'typescript', name: 'TypeScript', cat: 'web', years: 5, level: 88, aliases: ['typescript', 'ts'], note: 'Type-safe enterprise microservices and React front-ends at reach52 and Emirates NBD.' },
            { id: 'react', name: 'React / Redux', cat: 'web', years: 6, level: 92, aliases: ['react', 'reactjs', 'react.js', 'redux', 'hooks', 'jsx'], note: 'Builds Relationship-Manager deal platforms at Emirates NBD, analytics dashboards at reach52 and enterprise PWAs.' },
            { id: 'nextjs', name: 'Next.js', cat: 'web', years: 5, level: 88, aliases: ['next.js', 'nextjs', 'next js', 'ssr', 'server side rendering'], note: 'Full-stack Next.js apps: Tutorhow Virtual Front Desk and reach52 microservices.' },
            { id: 'node', name: 'Node.js / Express', cat: 'web', years: 6, level: 92, aliases: ['node', 'nodejs', 'node.js', 'node js', 'express', 'expressjs', 'express.js', 'backend', 'back-end', 'back end', 'api development'], note: 'Architects scalable Node.js microservices, REST APIs and gateways backed by MongoDB, PostgreSQL and AWS.' },
            { id: 'python', name: 'Python', cat: 'ai', years: 4, level: 80, aliases: ['python', 'python3', 'py', 'flask', 'fastapi', 'scripting'], note: 'AI/RAG pipelines, backend automation and scripting; started with Python web apps at Infosys.' },
            { id: 'ai', name: 'AI / LLM Engineering', cat: 'ai', years: 3, level: 84, aliases: ['ai', 'artificial intelligence', 'llm', 'llms', 'large language model', 'large language models', 'rag', 'retrieval augmented generation', 'vector search', 'vector database', 'embeddings', 'embedding', 'prompt engineering', 'prompt', 'prompts', 'agent', 'agents', 'agentic', 'autonomous agents', 'openai', 'gpt', 'chatgpt', 'claude', 'anthropic', 'ollama', 'langchain', 'nlp', 'generative ai', 'genai', 'chroma', 'faiss', 'copilot', 'automation'], note: 'Designs RAG pipelines, context-aware document search, prompt-engineered workflows and agentic automation with Claude, OpenAI and local Ollama models — including in-sprint AI automation at Emirates NBD.' },
            { id: 'ml', name: 'Machine Learning & Data', cat: 'ai', years: 3, level: 72, aliases: ['machine learning', 'ml', 'deep learning', 'data science', 'pandas', 'numpy', 'scikit', 'scikit-learn', 'sklearn', 'pytorch', 'jupyter', 'colab', 'statistics', 'prediction', 'predictive', 'models', 'data pipeline', 'data pipelines'], note: 'Data pipelines and statistical prediction models with Pandas/NumPy for financial-market data, analytics dashboards and mobile app engines.' },
            { id: 'aws', name: 'AWS Cloud', cat: 'database', years: 5, level: 84, aliases: ['aws', 'amazon web services', 'ec2', 'eks', 'lambda', 's3', 'rds', 'elasticache', 'ses', 'serverless', 'cloud', 'cloud infrastructure', 'infrastructure'], note: 'Deploys microservices on EC2, EKS, Lambda, S3, RDS, ElastiCache and SES; serverless backends for mobile apps.' },
            { id: 'cloud-other', name: 'Azure & GCP', cat: 'database', years: 2, level: 55, aliases: ['azure', 'gcp', 'google cloud', 'microsoft azure'], note: 'Working knowledge of Azure and Google Cloud alongside primary AWS expertise; Linux/Windows server management.' },
            { id: 'docker', name: 'Docker', cat: 'tools', years: 4, level: 80, aliases: ['docker', 'container', 'containers', 'containerization', 'containerisation'], note: 'Containerised microservices for cloud deployments and staging environments at reach52.' },
            { id: 'kubernetes', name: 'Kubernetes', cat: 'tools', years: 3, level: 68, aliases: ['kubernetes', 'k8s', 'orchestration', 'helm'], note: 'Container orchestration and scaling on AWS EKS.' },
            { id: 'cicd', name: 'CI/CD & DevOps', cat: 'tools', years: 4, level: 80, aliases: ['ci/cd', 'cicd', 'ci cd', 'continuous integration', 'continuous deployment', 'jenkins', 'bitbucket pipelines', 'pipelines', 'pipeline', 'devops', 'github actions', 'deployment', 'deployments', 'deploy'], note: 'Jenkins and Bitbucket Pipelines with Docker and Kubernetes at reach52; VPS deployments via Bash/SSH at Tutorhow.' },
            { id: 'mongodb', name: 'MongoDB', cat: 'database', years: 5, level: 90, aliases: ['mongodb', 'mongo', 'nosql', 'atlas', 'mongoose'], note: 'Primary database at Emirates NBD and reach52; high-performance schema design and Atlas cloud.' },
            { id: 'sql', name: 'MySQL / MariaDB', cat: 'database', years: 6, level: 85, aliases: ['sql', 'mysql', 'mariadb', 'relational', 'rdbms', 'database', 'databases', 'db', 'schema', 'query optimization', 'query optimisation'], note: 'Schema design and query optimisation across MySQL, MariaDB, PostgreSQL and OracleDB.' },
            { id: 'postgresql', name: 'PostgreSQL', cat: 'database', years: 4, level: 80, aliases: ['postgresql', 'postgres', 'psql'], note: 'Backs reach52 Insights analytics; RDS-hosted PostgreSQL.' },
            { id: 'oracledb', name: 'OracleDB', cat: 'database', years: 2, level: 62, aliases: ['oracle', 'oracledb', 'oracle db', 'pl/sql', 'plsql'], note: 'Reads shared-service data for corporate banking at Emirates NBD.' },
            { id: 'redis', name: 'Redis', cat: 'database', years: 5, level: 78, aliases: ['redis', 'cache', 'caching', 'in-memory'], note: 'Caching and session stores at Tutorhow and reach52 (ElastiCache).' },
            { id: 'dynamodb', name: 'DynamoDB', cat: 'database', years: 3, level: 65, aliases: ['dynamodb', 'dynamo'], note: 'Used in Tutorhow ETO alongside MySQL.' },
            { id: 'neo4j', name: 'Neo4j (Graph DB)', cat: 'database', years: 2, level: 60, aliases: ['neo4j', 'graph database', 'graph db', 'graph', 'cypher'], note: 'Graph data for Tutorhow Virtual Front Desk and graph-data dashboards.' },
            { id: 'swift', name: 'Swift / iOS', cat: 'mobile', years: 3, level: 72, aliases: ['swift', 'swiftui', 'ios', 'iphone', 'xcode', 'widgetkit', 'apple', 'app store'], note: 'Native iOS apps such as Gold Vault Tracker with WidgetKit extensions and biometric security.' },
            { id: 'kotlin', name: 'Kotlin / Android', cat: 'mobile', years: 3, level: 62, aliases: ['kotlin', 'android', 'android studio', 'play store'], note: 'Native Android development alongside cross-platform mobile work.' },
            { id: 'reactnative', name: 'React Native', cat: 'mobile', years: 3, level: 78, aliases: ['react native', 'react-native', 'expo', 'cross platform', 'cross-platform', 'mobile', 'mobile apps', 'mobile app development', 'mobile development'], note: 'Built the white-labelled Tutorhow Training mobile app with a serverless AWS Lambda backend.' },
            { id: 'flutter', name: 'Flutter / Dart', cat: 'mobile', years: 2, level: 58, aliases: ['flutter', 'dart'], note: 'Cross-platform app development.' },
            { id: 'php', name: 'PHP / Laravel', cat: 'web', years: 4, level: 76, aliases: ['php', 'laravel', 'composer', 'blade'], note: 'Laravel backends and REST APIs for the Tutorhow ETO platform.' },
            { id: 'angular', name: 'Angular', cat: 'web', years: 3, level: 70, aliases: ['angular', 'angularjs', 'material ui', 'angular material'], note: 'Modular enterprise front-ends — reach52 Connect admin suite.' },
            { id: 'vue', name: 'Vue.js', cat: 'web', years: 2, level: 60, aliases: ['vue', 'vuejs', 'vue.js', 'nuxt'], note: 'Progressive web apps and component-driven UIs.' },
            { id: 'tailwind', name: 'Tailwind / CSS / UI-UX', cat: 'web', years: 7, level: 88, aliases: ['tailwind', 'tailwindcss', 'bootstrap', 'css', 'sass', 'scss', 'html', 'html5', 'ui', 'ux', 'ui/ux', 'ui ux', 'design', 'frontend', 'front-end', 'front end', 'responsive', 'animation', 'animations'], note: 'High-fidelity, responsive interfaces with Tailwind, Bootstrap, SASS and a detail-oriented UI/UX approach.' },
            { id: 'golang', name: 'Golang', cat: 'web', years: 2, level: 55, aliases: ['golang', 'go lang'], note: 'Backend functions for Tutorhow Virtual Front Desk.' },
            { id: 'api', name: 'APIs: REST, GraphQL, Kafka, WebSockets', cat: 'web', years: 6, level: 85, aliases: ['graphql', 'rest', 'rest api', 'restful', 'api', 'apis', 'kafka', 'apache kafka', 'protobuf', 'grpc', 'websocket', 'websockets', 'socket.io', 'realtime', 'real-time', 'real time', 'streaming', 'microservice', 'microservices', 'json', 'xml', 'yaml'], note: 'REST and GraphQL APIs, Apache Kafka and Protobuf messaging, WebSocket real-time audio/video features.' },
            { id: 'linux', name: 'Linux & Bash', cat: 'tools', years: 7, level: 85, aliases: ['linux', 'bash', 'shell', 'ubuntu', 'server', 'servers', 'nginx', 'apache', 'vps', 'ssh', 'windows server', 'server management', 'sysadmin'], note: 'Linux/Windows server setup, web-server management and Bash automation.' },
            { id: 'git', name: 'Git, Jira & Agile', cat: 'tools', years: 7, level: 92, aliases: ['git', 'github', 'bitbucket', 'gitlab', 'version control', 'jira', 'agile', 'scrum', 'sprint', 'code review', 'code reviews'], note: 'Git workflows on GitHub/Bitbucket, Jira-driven agile sprints, code reviews and documentation.' },
            { id: 'architecture', name: 'System Design & Architecture', cat: 'tools', years: 5, level: 84, aliases: ['architecture', 'system design', 'distributed', 'distributed systems', 'scalable', 'scalability', 'design patterns', 'algorithms', 'data structures', 'performance', 'optimization', 'optimisation', 'load optimization'], note: 'Microservices architecture, load optimisation and system efficiency for distributed systems.' },
            { id: 'servicenow', name: 'ServiceNow', cat: 'tools', years: 1, level: 45, aliases: ['servicenow', 'service now', 'itsm'], note: 'Enterprise platform support and issue resolution at Infosys.' }
        ],

        /* Fun / small talk */
        jokes: [
            'Why did Ajith’s RAG pipeline go to therapy? Too many unresolved embeddings. 🧠',
            'Ajith doesn’t fear `undefined` — `undefined` fears Ajith. (Mostly because he uses TypeScript.)',
            'A MongoDB document walks into a bar. The bartender says: “No schema? No problem.”',
            'Why does Ajith love Kubernetes? Because even his pods know how to scale under pressure.',
            'Ajith once fixed a race condition… twice, at the same time.'
        ]
    };

    /* ---------------------------------------------------------
     * 2. Text utilities
     * ------------------------------------------------------- */
    const STOP = new Set(('a an the and or but of to in on at for with by from as is are was were be been being am do does did doing have has had having it its this that these those he him his she her they them their you your yours we our ours me my mine i what which who whom whose when where why how much many can could would should shall will may might must about into over under again further then once here there all any both each few more most other some such no nor not only own same so than too very s t just don now tell please give show list know does').split(' '));

    const KNOWN_TECH = 'rust java ruby rails scala elixir erlang haskell clojure csharp dotnet net django spring springboot unity unreal blockchain solidity web3 terraform ansible svelte solid remix deno bun perl cobol fortran matlab r julia swiftui objective-c objc xamarin ionic cordova capacitor electron tauri wordpress drupal magento shopify salesforce sap oracle sqlite cassandra couchdb elasticsearch elastic solr rabbitmq nats kafka spark hadoop airflow dbt snowflake bigquery redshift databricks tensorflow keras jax huggingface transformers llamaindex pinecone weaviate qdrant milvus supabase firebase heroku vercel netlify cloudflare digitalocean linode gcp azure openshift nomad consul vault grafana prometheus datadog sentry newrelic splunk jest mocha cypress playwright selenium puppeteer storybook webpack vite rollup esbuild babel eslint prettier graphql grpc trpc prisma sequelize typeorm knex drizzle mongoose flask fastapi tornado celery redux mobx zustand recoil tailwind bootstrap sass less styled figma sketch photoshop illustrator blender unity3d arduino raspberry esp32 mqtt zigbee opencv yolo cuda metal vulkan opengl webgl threejs three d3 chartjs highcharts stripe paypal razorpay twilio sendgrid mailchimp auth0 okta keycloak oauth jwt saml ldap kerberos nginx apache caddy haproxy traefik istio linkerd envoy';
const COMMON = (KNOWN_TECH + ' hello hi hey good morning afternoon evening thanks thank yes no okay sure please what which who where when why how many much long years year experience experienced skills skill technology technologies tech stack projects project work worked working build built company companies job jobs role roles contact email phone reach hire hiring available availability salary location live based education degree university studied study about tell more detail details compare versus difference better best favourite favorite favorite languages language speak spoken hobbies hobby interests interest music remote relocate relocation visa notice period team lead leadership manage management strengths strength weakness weaknesses why should recommend summary overview background career history resume cv download link links portfolio website site chatbot assistant engine model running browser local offline joke funny time timezone current currently latest recent first last previous next also again another something anything everything nothing know knows familiar proficient expert level rate rating certification certifications certified achievement achievements award awards open opportunities opportunity freelance contract full time part senior junior mid principal architect engineer developer programmer fullstack frontend backend mobile cloud devops database data science machine learning artificial intelligence learning models model apps app application applications platform platforms enterprise startup banking finance fintech healthcare edtech').split(' ');

    function normalize(str) {
        return String(str || '')
            .toLowerCase()
            .replace(/[’‘]/g, "'")
            .replace(/(\w)'s\b/g, '$1')
            .replace(/n't\b/g, ' not')
            .replace(/'re\b/g, ' are').replace(/'ve\b/g, ' have').replace(/'ll\b/g, ' will').replace(/'d\b/g, ' would').replace(/'m\b/g, ' am')
            .replace(/[“”"]/g, '')
            .replace(/[\u2013\u2014]/g, '-')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function tokenize(str) {
        return (normalize(str).replace(/[^a-z0-9+#./\s-]/g, ' ').match(/[a-z0-9][a-z0-9+#./-]*/g) || []);
    }

    function stem(w) {
        if (w.length <= 3) return w;
        return w.replace(/(ies)$/, 'y').replace(/(sses)$/, 'ss').replace(/(ing|ed|es|s)$/, '');
    }

    function levenshtein(a, b) {
        if (a === b) return 0;
        const m = a.length, n = b.length;
        if (!m) return n; if (!n) return m;
        let prev = new Array(n + 1), cur = new Array(n + 1);
        for (let j = 0; j <= n; j++) prev[j] = j;
        for (let i = 1; i <= m; i++) {
            cur[0] = i;
            for (let j = 1; j <= n; j++) {
                const cost = a[i - 1] === b[j - 1] ? 0 : 1;
                cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
                if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) cur[j] = Math.min(cur[j], prev[j - 1]); // transposition-lite
            }
            [prev, cur] = [cur, prev];
        }
        return prev[n];
    }

    function pick(arr, rng) { return arr[Math.floor((rng || Math.random)() * arr.length)]; }
    function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
    function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
    function plural(n, w) { return n + ' ' + w + (n === 1 ? '' : 's'); }

    function yearsBetween(startYm, endYm) {
        const [sy, sm] = startYm.split('-').map(Number);
        let ey, em;
        if (endYm) { [ey, em] = endYm.split('-').map(Number); }
        else { const d = new Date(); ey = d.getFullYear(); em = d.getMonth() + 1; }
        return (ey - sy) + (em - sm) / 12;
    }
    function fmtDuration(years) {
        const y = Math.floor(years), m = Math.round((years - y) * 12);
        if (y === 0) return plural(Math.max(m, 1), 'month');
        if (m === 0) return plural(y, 'year');
        return plural(y, 'year') + ' ' + plural(m, 'month');
    }
    function fmtYm(ym) {
        if (!ym) return 'Present';
        const [y, m] = ym.split('-').map(Number);
        return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m - 1] + ' ' + y;
    }
    const totalYears = () => yearsBetween(KB.profile.careerStart, null);
    const totalYearsLabel = () => Math.floor(totalYears()) + '+ years';

    /* ---------------------------------------------------------
     * 3. Markdown-lite → HTML
     * ------------------------------------------------------- */
    function inline(md) {
        let s = esc(md);
        s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+|#[^\s)]+|[^\s)]+\.pdf)\)/g, (m, t, u) => `<a href="${u}"${/^https?:/.test(u) ? ' target="_blank" rel="noopener"' : ''}>${t}</a>`);
        s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        s = s.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
        s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
        return s;
    }
    function mdToHtml(md) {
        const lines = String(md || '').split('\n');
        let html = '', list = null, para = [];
        const flushPara = () => { if (para.length) { html += `<p>${inline(para.join(' '))}</p>`; para = []; } };
        const closeList = () => { if (list) { html += `</${list}>`; list = null; } };
        for (const raw of lines) {
            const line = raw.trimEnd();
            if (!line.trim()) { flushPara(); closeList(); continue; }
            let m;
            if ((m = line.match(/^#{1,4}\s+(.*)$/))) { flushPara(); closeList(); html += `<h4>${inline(m[1])}</h4>`; continue; }
            if ((m = line.match(/^\s*[-•]\s+(.*)$/))) { flushPara(); if (list !== 'ul') { closeList(); html += '<ul>'; list = 'ul'; } html += `<li>${inline(m[1])}</li>`; continue; }
            if ((m = line.match(/^\s*\d+[.)]\s+(.*)$/))) { flushPara(); if (list !== 'ol') { closeList(); html += '<ol>'; list = 'ol'; } html += `<li>${inline(m[1])}</li>`; continue; }
            if ((m = line.match(/^::bar\s+(\d+)\s*$/))) { flushPara(); closeList(); html += `<div class="bar"><span style="--w:${Math.min(100, +m[1])}%"></span></div>`; continue; }
            closeList();
            para.push(line.trim());
        }
        flushPara(); closeList();
        return html;
    }

    /* ---------------------------------------------------------
     * 4. Retrieval index (BM25)
     * ------------------------------------------------------- */
    function buildDocs() {
        const docs = [];
        const p = KB.profile;
        docs.push({ id: 'profile', type: 'profile', title: `${p.name} — ${p.title}`, text: [p.headline, ...p.summary, ...p.competencies, 'based in ' + p.location.short, 'from ' + p.location.origin].join(' '), section: '#about' });
        docs.push({ id: 'education', type: 'education', title: 'Education', text: `${p.education.degree} ${p.education.school} ${p.education.place} ${p.education.years} ${p.education.grade} bachelor computer application college university degree graduate study studied`, section: '#experience' });
        docs.push({ id: 'contact', type: 'contact', title: 'Contact', text: `contact email ${p.email} ${p.email2} phone ${p.phone} linkedin github stackoverflow youtube instagram twitter website ${p.website} reach hire message call`, section: '#contact' });
        docs.push({ id: 'interests', type: 'interests', title: 'Interests', text: 'hobbies interests music musician youtube channel distro studios iot multimedia automation game server panels personal life outside work fun', section: '#about' });
        for (const e of KB.experience) docs.push({ id: 'exp:' + e.id, type: 'experience', title: `${e.role} @ ${e.company}`, text: [e.company, e.via || '', e.role, e.location, e.summary, ...e.highlights, ...e.stack, ...e.aliases].join(' '), section: '#experience', ref: e });
        for (const pr of KB.projects) docs.push({ id: 'proj:' + pr.id, type: 'project', title: pr.name, text: [pr.name, pr.period, pr.company, pr.summary, ...pr.stack, pr.deploy, ...pr.aliases, ...pr.category].join(' '), section: '#projects', ref: pr });
        for (const s of KB.skills) docs.push({ id: 'skill:' + s.id, type: 'skill', title: s.name, text: [s.name, s.note, ...s.aliases, s.cat].join(' '), section: '#skills', ref: s });
        return docs;
    }

    function buildIndex(docs) {
        const df = new Map();
        let totalLen = 0;
        for (const d of docs) {
            d.tokens = tokenize(d.text).map(stem);
            d.tf = new Map();
            for (const t of d.tokens) d.tf.set(t, (d.tf.get(t) || 0) + 1);
            for (const t of d.tf.keys()) df.set(t, (df.get(t) || 0) + 1);
            totalLen += d.tokens.length;
        }
        const avgLen = totalLen / docs.length;
        const N = docs.length, k1 = 1.4, b = 0.75;
        function search(query, limit) {
            const qTokens = tokenize(query).filter(t => !STOP.has(t)).map(stem);
            const results = [];
            for (const d of docs) {
                let score = 0;
                for (const q of qTokens) {
                    const tf = d.tf.get(q); if (!tf) continue;
                    const idf = Math.log(1 + (N - df.get(q) + 0.5) / (df.get(q) + 0.5));
                    score += idf * (tf * (k1 + 1)) / (tf + k1 * (1 - b + b * d.tokens.length / avgLen));
                }
                if (score > 0) results.push({ doc: d, score: +score.toFixed(2) });
            }
            results.sort((a, b2) => b2.score - a.score);
            return results.slice(0, limit || 5);
        }
        return { search };
    }

    /* ---------------------------------------------------------
     * 5. Vocabulary + spell corrector
     * ------------------------------------------------------- */
    function buildVocab(docs) {
        const vocab = new Map();
        const add = (w, weight) => { w = w.toLowerCase(); if (w.length < 3) return; vocab.set(w, (vocab.get(w) || 0) + (weight || 1)); };
        for (const d of docs) for (const t of tokenize(d.text)) add(t, 2);
        for (const s of KB.skills) for (const a of s.aliases) for (const t of tokenize(a)) add(t, 5);
        for (const e of KB.experience) for (const a of e.aliases) for (const t of tokenize(a)) add(t, 5);
        for (const p of KB.projects) for (const a of p.aliases) for (const t of tokenize(a)) add(t, 5);
        for (const w of COMMON) add(w, 8);
        for (const w of STOP) add(w, 8);
        return vocab;
    }

    function makeCorrector(vocab) {
        const words = [...vocab.keys()];
        return function correct(text) {
            const corrections = [];
            const out = text.replace(/[a-z][a-z'-]*/gi, (tok) => {
                const low = tok.toLowerCase();
                if (low.length < 5 || vocab.has(low) || vocab.has(low.replace(/s$/, '')) || /\d/.test(low)) return tok;
                const maxD = low.length <= 6 ? 1 : 2;
                let best = null, bestD = maxD + 1, bestW = 0;
                for (const w of words) {
                    if (Math.abs(w.length - low.length) > maxD) continue;
                    if (w[0] !== low[0] && w[1] !== low[1]) continue; // cheap prune
                    const d = levenshtein(low, w);
                    if (d <= maxD && (d < bestD || (d === bestD && vocab.get(w) > bestW))) { best = w; bestD = d; bestW = vocab.get(w); }
                }
                if (best && best !== low) { corrections.push({ from: low, to: best }); return best; }
                return tok;
            });
            return { text: out, corrections };
        };
    }

    /* ---------------------------------------------------------
     * 6. Entity extraction
     * ------------------------------------------------------- */
    function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
    function aliasRegex(alias) {
        // word boundary aware; allow "." "/" "+" inside
        return new RegExp('(^|[^a-z0-9])' + escapeRe(alias).replace(/\\\./g, '\\.?').replace(/ /g, '[\\s-]?') + '(?=$|[^a-z0-9])', 'i');
    }
    const ENTITY_INDEX = (() => {
        const list = [];
        for (const s of KB.skills) for (const a of s.aliases) list.push({ kind: 'skill', ref: s, alias: a, re: aliasRegex(a) });
        for (const e of KB.experience) for (const a of e.aliases) list.push({ kind: 'company', ref: e, alias: a, re: aliasRegex(a) });
        for (const p of KB.projects) for (const a of p.aliases) list.push({ kind: 'project', ref: p, alias: a, re: aliasRegex(a) });
        // longer aliases first so "react native" beats "react"
        list.sort((a, b) => b.alias.length - a.alias.length);
        return list;
    })();

    // aliases that are too generic to count as a "strong" mention on their own
    const WEAK_ALIASES = new Set(['ai', 'api', 'apis', 'cloud', 'database', 'databases', 'db', 'mobile', 'design', 'ui', 'ux', 'server', 'servers', 'deploy', 'deployment', 'deployments', 'automation', 'prompt', 'prompts', 'models', 'graph', 'cache', 'performance', 'architecture', 'backend', 'frontend', 'css', 'html', 'json', 'rest', 'streaming', 'pipeline', 'pipelines', 'infrastructure', 'sprint', 'agile', 'code review', 'code reviews', 'app store', 'play store', 'apple', 'animation', 'animations', 'responsive', 'scripting', 'optimization', 'optimisation', 'algorithms', 'data structures', 'mobile apps', 'mobile app development', 'mobile development', 'dashboard', 'dashboards', 'campaign', 'campaigns', 'fees', 'vault', 'connect', 'insights', 'pwa', 'lms', 'mobile app', 'bank', 'banking', 'singapore', 'healthcare', 'edtech', 'first job', 'this page', 'jquery', 'copilot', 'learning platform']);

    function extractEntities(text) {
        let work = ' ' + text + ' ';
        const found = { skill: [], company: [], project: [] };
        const seen = new Set();
        for (const ent of ENTITY_INDEX) {
            const m = ent.re.exec(work);
            if (!m) continue;
            const key = ent.kind + ':' + ent.ref.id;
            if (!seen.has(key)) {
                seen.add(key);
                found[ent.kind].push({ ref: ent.ref, alias: ent.alias, weak: WEAK_ALIASES.has(ent.alias), index: m.index });
            }
            // blank out the match so shorter aliases don't re-match inside it
            work = work.slice(0, m.index + m[1].length) + ' '.repeat(m[0].length - m[1].length) + work.slice(m.index + m[0].length);
        }
        for (const k of Object.keys(found)) found[k].sort((a, b) => a.index - b.index);
        return found;
    }

    /* ---------------------------------------------------------
     * 7. Intent classifier
     * ------------------------------------------------------- */
    const INTENTS = [
        { id: 'help', re: [/^\/?help\b/, /what can (you|i) (do|ask)/, /how (do|can) i use (you|this)/, /what (do|can) you know/, /commands?$/], kw: { help: 3, commands: 3 } },
        { id: 'greeting', re: [/^(hi|hello|hey|hiya|yo|hola|namaste|good (morning|afternoon|evening|day)|greetings|sup|what'?s up)\b/], kw: { hi: 2, hello: 3, hey: 2, greetings: 3, morning: 1, evening: 1, afternoon: 1 } },
        { id: 'thanks', re: [/\b(thanks?|thank you|thx|ty|cheers|appreciate)\b/], kw: { thanks: 3, thank: 3, cheers: 2, appreciate: 2 } },
        { id: 'bye', re: [/\b(bye|goodbye|see you|later|take care|cya|good night)\b/], kw: { bye: 3, goodbye: 3 } },
        { id: 'identity_bot', re: [/\b(who|what) are you\b/, /\bare you (a |an )?(bot|ai|human|real|llm|chatgpt|gpt|claude)\b/, /\bhow (do|does) (you|this|it) work/, /\bwhat model\b/, /\b(built|made|created|powered) (with|by|on)\b/, /\byour (name|engine|model|architecture)\b/, /\bwhich (llm|model)\b/, /\bhow (are|were) you (built|made|trained)/, /\bthis (chatbot|assistant|bot)\b/], kw: { you: 0.4, bot: 2, chatbot: 3, assistant: 1.5, llm: 1, model: 1, engine: 1.5, offline: 2, browser: 1.5, local: 1.5, trained: 2 } },
        { id: 'identity_person', re: [/\bwho is ajith\b/, /\bwho'?s ajith\b/, /\babout ajith\b/, /\btell me about (him|ajith)\b/, /\b(introduce|introduction|overview|summar(y|ise|ize)|profile|bio|background)\b/, /\bwhat does (he|ajith) do\b/, /\bwhat is (he|ajith)\b/, /\belevator pitch\b/], kw: { about: 1.5, summary: 3, overview: 3, introduce: 3, introduction: 3, background: 2.5, profile: 2, bio: 3, who: 1, pitch: 2 } },
        { id: 'experience_total', boost: 1, re: [/\b(total|overall|how (many|much)) (years?|experience)\b/, /\bhow long (has|have) (he|ajith) (been|worked)/, /\byears? of (total |overall |professional |industry )?experience\b/, /\bhow experienced\b/, /\bhow senior\b/, /\bseniority\b/, /\bhow many years\b/], kw: { total: 2, overall: 2, years: 1.5, experience: 1, senior: 1.5, seniority: 3, long: 1 } },
        { id: 'experience', re: [/\b(work|professional|job|career|employment) (history|experience|background|path|journey)\b/, /\bwhere (has|did) (he|ajith) work/, /\b(companies|employers?) (he|ajith)\b/, /\bwork experience\b/, /\bresume\b/, /\bpast (jobs|roles|companies)\b/, /\bprevious (jobs?|roles?|companies|employers?)\b/, /\bemployment\b/], kw: { experience: 2, career: 2.5, job: 1.5, jobs: 2, work: 1, worked: 1.5, history: 2, employer: 2, employers: 2, companies: 2, company: 1, roles: 1.5, timeline: 2, employment: 3 } },
        { id: 'current_role', boost: 1, re: [/\b(current|present|now|currently|latest|today)\b.*\b(job|role|company|position|work|working|employer)\b/, /\bwhere (is|does) (he|ajith) (work|working) (now|currently|today)\b/, /\bwhat (is|does) (he|ajith) (doing|do) (now|currently)\b/, /\bwhere does (he|ajith) work\b/, /\bcurrent (job|role|company|position|employer)\b/], kw: { current: 2.5, currently: 2.5, now: 1, present: 1.5, latest: 1.5, today: 1 } },
        { id: 'skills', re: [/\b(tech(nical)? )?(skills?|stack|technologies|tools|toolset|tool set|proficienc(y|ies)|competenc(y|ies)|expertise)\b/, /\bwhat (does|can) (he|ajith) (use|code|program|develop|work with)\b/, /\bprogramming languages?\b/, /\b(languages?|frameworks?) (does|he|ajith)\b/, /\bwhat (is|are) (he|ajith) (good|best) at\b/, /\bstrongest (skill|area|tech)/], kw: { skills: 3, skill: 3, stack: 3, technologies: 3, technology: 2, tools: 2, toolset: 3, frameworks: 2, framework: 1.5, languages: 1.5, language: 1, proficient: 2, expertise: 2, competencies: 2, tech: 2, know: 0.5, use: 0.5, uses: 0.5, code: 0.5 } },
        { id: 'skills_category', re: [/\b(frontend|front-end|front end|backend|back-end|back end|mobile|cloud|devops|database|databases|ai|ml|data)\b.*\b(skills?|stack|tech|technologies|tools|experience|expertise)\b/], kw: {} },
        { id: 'projects', re: [/\b(projects?|portfolio|work samples?|case stud(y|ies)|things (he|ajith) (has )?(built|made)|what has (he|ajith) built|showcase|apps? (he|ajith) (built|made|developed))\b/, /\bwhat (did|has|does) (he|ajith) (build|built|make|made|create|created|develop|developed)\b/, /\bshow me\b.*\b(work|projects?|apps?)\b/], kw: { projects: 3, project: 3, portfolio: 2.5, built: 2, build: 1.5, made: 1, apps: 1.5, showcase: 3, samples: 2 } },
        { id: 'education', re: [/\b(education|degree|university|college|school|studied|study|graduate|graduated|graduation|academic|academics|cgpa|gpa|bca|bachelor|qualification|qualifications)\b/], kw: { education: 3, degree: 3, university: 3, college: 3, studied: 3, study: 2, graduate: 2, graduated: 3, academic: 2, cgpa: 3, gpa: 3, bachelor: 3, qualification: 3, qualifications: 3, school: 2 } },
        { id: 'contact', re: [/\b(contact|email|e-mail|mail|phone|number|call|whatsapp|linkedin|github|reach (him|out|ajith)|get in touch|connect with|message|dm|social|socials|handles?|twitter|instagram|youtube|stack ?overflow)\b/], kw: { contact: 3, email: 3, mail: 2, phone: 3, number: 1.5, call: 2, linkedin: 3, github: 2.5, reach: 2, touch: 2, message: 2, social: 2, socials: 3, twitter: 2, instagram: 2, youtube: 2, whatsapp: 3, connect: 1.5, handles: 2 } },
        { id: 'hire', re: [/\b(hire|hiring|available|availability|open to|looking for|job offer|opportunit(y|ies)|recruit|recruiter|interview|join (our|my|the) (team|company)|freelance|contract|part[- ]time|full[- ]time|notice period|when can (he|ajith) (start|join)|start date|visa|work (permit|authori[sz]ation)|sponsorship)\b/], kw: { hire: 3, hiring: 3, available: 3, availability: 3, opportunity: 2, opportunities: 2, recruit: 2.5, recruiter: 2, interview: 2, freelance: 3, contract: 2.5, notice: 3, visa: 3, sponsorship: 3, join: 1.5, offer: 1.5, open: 1, looking: 1 } },
        { id: 'salary', re: [/\b(salary|salaries|compensation|pay|paid|rate|rates|ctc|package|budget|cost|charge|charges|expected pay|expectation|how much (do|does|would) (he|ajith) (charge|cost|earn|want|expect))\b/], kw: { salary: 3, compensation: 3, pay: 2.5, rate: 2, rates: 2.5, ctc: 3, package: 2, budget: 2, cost: 1.5, charge: 2.5, earn: 2.5, expectation: 1.5 } },
        { id: 'location', re: [/\b(where (is|does) (he|ajith) (live|based|located|from|stay)|location|located|based|live|lives|living|city|country|hometown|native|from where|where is he|which country|which city|address|time ?zone|timezone)\b/], kw: { where: 1.5, location: 3, located: 3, based: 3, live: 2.5, lives: 3, living: 2, city: 2.5, country: 2.5, hometown: 3, native: 2, address: 2, timezone: 3, dubai: 2, uae: 2, india: 1.5, kerala: 2 } },
        { id: 'remote', boost: 1, re: [/\b(remote|remotely|work from home|wfh|relocat(e|ion|ing)|willing to move|move to|hybrid|on-?site|onsite|travel)\b/, /\b(work|working|move|moving|relocate|relocating|based) (in|to) (the )?(us|usa|uk|europe|eu|canada|india|singapore|germany|australia|london|berlin|new york|bangalore|kerala|uae|dubai|abu dhabi|qatar|saudi|riyadh)\b/], kw: { remote: 3, remotely: 3, wfh: 3, relocate: 3, relocation: 3, relocating: 3, hybrid: 3, onsite: 2, move: 1, travel: 1.5 } },
        { id: 'leadership', boost: 1, re: [/\b(lead|leader|leadership|led|manage|managed|management|manager|mentor|mentored|mentoring|team size|team lead|people management|managed a team)\b/], kw: { lead: 2.5, leader: 3, leadership: 3, led: 2.5, manage: 2, managed: 2.5, management: 2, manager: 2, mentor: 3, mentored: 3, mentoring: 3, team: 1.5 } },
        { id: 'strengths', boost: 1.5, re: [/\b(strengths?|why (should|would) (i|we|anyone|someone) (hire|choose|pick|consider)|what makes (him|ajith)|stand ?out|unique|best (quality|qualities|thing)|superpower|good at|selling points?|advantages?|value)\b/], kw: { strengths: 3, strength: 3, hire: 1, unique: 2.5, special: 2, standout: 3, superpower: 3, qualities: 2.5, advantages: 2.5, value: 1.5 } },
        { id: 'weakness', re: [/\b(weakness|weaknesses|flaws?|bad at|worst|struggles?|improve on|areas? (of|for) improvement|not good at|limitations?)\b/], kw: { weakness: 3, weaknesses: 3, flaws: 3, worst: 2, struggle: 2, limitations: 3 } },
        { id: 'ai_expertise', re: [/\b(ai|artificial intelligence|llm|llms|rag|machine learning|ml|generative|genai|agents?|agentic|prompt|langchain|openai|claude|ollama|gpt|chatgpt|nlp|deep learning|neural)\b.*\b(experience|expertise|work|skills?|projects?|know|familiar|done|background|do|does|use|used|built)\b/, /\bhow (does|is) (he|ajith) (use|using|working with) ai\b/, /\bai (expertise|experience|work|skills|background|projects)\b/], kw: {} },
        { id: 'knows_tech', re: [/\b(does|do|is|has) (he|ajith|you)? ?(know|knows|use|uses|familiar|experienced|worked|work|comfortable|proficient|good|skilled|expert|have experience|has experience|done)\b/, /\bcan (he|ajith) (do|use|code|write|build|develop|work)\b/, /\b(any|some) experience (with|in|on)\b/, /\bexperience (with|in|on|using)\b/, /\bworked (with|on|in)\b/, /\bfamiliar with\b/, /\bknowledge of\b/, /\bhow (good|strong|proficient|comfortable|skilled|experienced) (is|with)\b/, /\bhas (he|ajith) (used|worked|done|built)\b/], kw: { know: 1.5, knows: 2, familiar: 2.5, proficient: 2, experienced: 1.5, comfortable: 2, skilled: 2, expert: 1.5 } },
        { id: 'tech_years', re: [/\bhow (many|much) (years?|experience|time|long)\b/, /\bhow long\b/, /\byears? (of|with|in|on|using)\b/, /\bsince when\b/, /\b(experience|years) (with|in|on|using)\b/], kw: { years: 2, year: 1.5, long: 1.5, since: 1 } },
        { id: 'compare', re: [/\b(vs\.?|versus|compared? (to|with)|or|better|prefer|preference|difference between|rather)\b/], kw: { vs: 3, versus: 3, compare: 3, compared: 3, prefer: 2.5, preference: 2.5, better: 1.5, difference: 2, rather: 1.5, or: 0.5 } },
        { id: 'languages_spoken', boost: 1, re: [/\b(spoken|speak|speaks|speaking|fluent|fluency|native|mother tongue|human languages?|languages? (does|he|ajith) (speak|know))\b/, /\b(english|malayalam|hindi|arabic|tamil)\b/], kw: { speak: 3, speaks: 3, spoken: 3, fluent: 3, fluency: 3, english: 2.5, malayalam: 3, hindi: 3, arabic: 3, tongue: 2 } },
        { id: 'hobbies', re: [/\b(hobb(y|ies)|interests?|free time|spare time|outside (of )?work|fun|passion|passionate|music|musician|instrument|guitar|piano|sing|singer|band|youtube|videos?|games?|gaming|sports?|travel|read|reading|weekend|personal life|for fun)\b/], kw: { hobby: 3, hobbies: 3, interests: 2.5, interest: 1.5, music: 3, musician: 3, instrument: 3, guitar: 3, piano: 3, youtube: 2, fun: 2, passion: 2, passionate: 2, weekend: 2, sports: 2, gaming: 2, travel: 1 } },
        { id: 'personal', re: [/\b(age|old|birthday|born|married|marriage|wife|husband|girlfriend|boyfriend|single|relationship|religion|religious|caste|family|kids|children|salary history|political|politics|nationality|passport|height|weight|health)\b/], kw: { age: 3, old: 2, birthday: 3, born: 2.5, married: 3, marriage: 3, wife: 3, husband: 3, girlfriend: 3, boyfriend: 3, single: 2, religion: 3, religious: 3, family: 2, kids: 2.5, children: 2.5, nationality: 3, passport: 3, politics: 3, political: 3 } },
        { id: 'cv', re: [/\b(cv|resume|résumé|download|pdf|print|copy of)\b/], kw: { cv: 3, resume: 3, download: 3, pdf: 3, print: 2 } },
        { id: 'certifications', re: [/\b(certif(y|ied|ication|ications|icate|icates)|credential|credentials|badge|badges|licen[cs]e|accredit)/], kw: { certification: 3, certifications: 3, certified: 3, certificate: 3, credentials: 3, badges: 2 } },
        { id: 'achievements', re: [/\b(achievements?|accomplishments?|awards?|recognition|proud|biggest|highlights?|impact|results?|milestones?|success(es)?)\b/], kw: { achievements: 3, achievement: 3, accomplishments: 3, awards: 3, award: 3, proud: 2.5, biggest: 1.5, highlights: 2, impact: 2, milestones: 3 } },
        { id: 'joke', re: [/\b(joke|funny|laugh|humou?r|pun|riddle|entertain me|make me laugh)\b/], kw: { joke: 3, funny: 3, laugh: 3, humor: 3, humour: 3, pun: 3, riddle: 3 } },
        { id: 'site_meta', re: [/\b(this (site|website|page|portfolio)|how (was|is) (this|the) (site|website|page|portfolio) (built|made|hosted|deployed)|hosted|hosting|github pages|source code|animation|animations|background|design of this)\b/], kw: { site: 2, website: 2, hosted: 3, hosting: 3, pages: 1, animation: 1.5, animations: 1.5 } },
        { id: 'howmany_projects', boost: 2.5, re: [/\bhow many (projects?|apps?|applications?|companies|jobs|employers?|clients?)\b/, /\bnumber of (projects?|companies|jobs)\b/], kw: {} },
        { id: 'industry', boost: 1.5, re: [/\b(fintech|finance|financial|bank|banking|healthcare|health|medical|edtech|education sector|e-?learning|e-?commerce|ecommerce|retail|saas|startups?|enterprise|gaming|games industry|iot|insurance|insurtech|logistics|telecom|media|government|govtech|energy|crypto|blockchain|trading|stock|stocks|market|markets|domain|domains|industry|industries|sector|sectors|vertical)\b/], kw: { fintech: 3, finance: 3, banking: 2.5, healthcare: 3, edtech: 3, ecommerce: 3, industry: 3, industries: 3, domain: 3, domains: 3, sector: 3, sectors: 3, startup: 2.5, enterprise: 1.5, iot: 3, insurance: 3, logistics: 3, crypto: 3, blockchain: 3, trading: 3 } },
        { id: 'role_query', boost: 2, re: [/\b(longest|shortest|most recent|first|earliest|last|latest|previous|before that|prior) (job|role|company|employer|stint|position|gig)\b/, /\bwhere did (he|ajith) (start|begin)\b/, /\bfirst job\b/, /\bbefore (emirates|enbd|reach52|tutorhow|that|this)\b/], kw: {} },
        { id: 'affirm', re: [/^(yes|yeah|yep|yup|sure|ok|okay|please|absolutely|definitely|of course|go ahead|do it|why not|alright|sounds good|yes please|y)\b[.!]*$/], kw: {} },
        { id: 'deny', re: [/^(no|nope|nah|not now|no thanks|never mind|nevermind|not really|n|stop|cancel)\b[.!]*$/], kw: {} },
        { id: 'more', re: [/^(more|tell me more|more details?|elaborate|go on|continue|expand|and\??|details?|explain|deeper|in depth|can you elaborate|what else|anything else)\b[.!?]*$/, /\b(tell me more|more (details?|info|information|about (it|that|this))|elaborate|expand on (that|it|this)|go deeper|in more detail)\b/], kw: {} },
        { id: 'followup_and', re: [/^(and|what about|how about|also|plus|then)\b/], kw: {} }
    ];

    function classify(text, entities, memory) {
        const tokens = tokenize(text);
        const scores = {};
        for (const it of INTENTS) {
            let s = 0;
            let hits = 0; for (const re of it.re) if (re.test(text)) hits++;
            if (hits) s += 3.2 + (it.boost || 0) + (hits - 1) * 0.4;
            for (const t of tokens) if (it.kw[t]) s += it.kw[t];
            if (s > 0) scores[it.id] = +s.toFixed(2);
        }
        // entity-driven boosts
        const strongSkill = entities.skill.filter(e => !e.weak);
        if (strongSkill.length && !scores.knows_tech && !scores.tech_years && !scores.compare && !scores.projects) scores.tech_general = 2.5 + strongSkill.length * 0.5;
        if (strongSkill.length && scores.tech_years) scores.tech_years += 2;
        if (strongSkill.length && scores.knows_tech) scores.knows_tech += 2;
        if (strongSkill.length >= 2 && scores.compare) scores.compare += 2.5;
        if (entities.company.length && !entities.company.every(c => c.weak)) { scores.company = (scores.company || 0) + 4 + (scores.experience ? 2 : 0); }
        if (entities.project.length && !entities.project.every(p => p.weak)) { scores.project = (scores.project || 0) + 4.5; }
        // "languages" ambiguity: spoken vs programming
        if (/\blanguages?\b/.test(text) && !/\b(spoken|speak|speaks|fluent|native|human|tongue|english|malayalam|hindi|arabic)\b/.test(text)) { scores.languages_spoken = 0; scores.skills = (scores.skills || 0) + 2; }
        // ai expertise strong pattern
        if (scores.ai_expertise) scores.ai_expertise += 2.5;
        // short affirmations only count when a question is pending
        if (!memory.pending) { delete scores.affirm; delete scores.deny; }
        const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
        const top = ranked[0], second = ranked[1];
        const confidence = top ? Math.min(0.99, top[1] / (top[1] + (second ? second[1] * 0.6 : 0) + 1.5)) : 0;
        return { intent: top ? top[0] : 'unknown', score: top ? top[1] : 0, confidence: +confidence.toFixed(2), ranked: ranked.slice(0, 4) };
    }

    /* ---------------------------------------------------------
     * 8. Answer composers
     * ------------------------------------------------------- */
    const P = KB.profile;
    const link = (t, u) => `[${t}](${u})`;
    const ACT = {
        projects: { label: 'See projects', icon: 'fa-cubes', href: '#projects' },
        skills: { label: 'Skill matrix', icon: 'fa-laptop-code', href: '#skills' },
        experience: { label: 'Career timeline', icon: 'fa-briefcase', href: '#experience' },
        contact: { label: 'Contact section', icon: 'fa-paper-plane', href: '#contact' },
        email: { label: 'Email Ajith', icon: 'fa-envelope', href: 'mailto:' + P.email },
        linkedin: { label: 'LinkedIn', icon: 'fa-linkedin', brand: true, href: P.socials.linkedin },
        github: { label: 'GitHub', icon: 'fa-github', brand: true, href: P.socials.github },
        cv: { label: 'Download CV', icon: 'fa-file-pdf', href: P.cv, download: true },
        aihub: { label: 'AI engineering', icon: 'fa-magic', href: '#ai-hub' }
    };

    function mentions(textStr, skill) { const t = ' ' + String(textStr).toLowerCase() + ' '; return skill.aliases.filter(a => !WEAK_ALIASES.has(a)).concat([skill.name.toLowerCase()]).some(a => aliasRegex(a).test(t)); }
    function shortCo(e) { return e.short || e.company; }
    const PAIR = { react: 'angular', angular: 'react', vue: 'react', nextjs: 'react', node: 'php', php: 'node', python: 'javascript', javascript: 'typescript', typescript: 'javascript', aws: 'cloud-other', 'cloud-other': 'aws', mongodb: 'postgresql', postgresql: 'mongodb', sql: 'mongodb', docker: 'kubernetes', kubernetes: 'docker', swift: 'reactnative', reactnative: 'swift', kotlin: 'swift', flutter: 'reactnative', redis: 'mongodb', ai: 'ml', ml: 'ai', golang: 'node', neo4j: 'mongodb', dynamodb: 'mongodb', oracledb: 'postgresql', tailwind: 'react', api: 'node', linux: 'docker', git: 'cicd', cicd: 'docker', architecture: 'api', servicenow: 'python' };
    function pairFor(s) { return KB.skills.find(x => x.id === PAIR[s.id]) || KB.skills.find(x => x.cat === s.cat && x.id !== s.id) || KB.skills[0]; }
    function shortName(s) { return s.name.split(' (')[0].split(' /')[0].split(':')[0]; }

    function skillLine(s) { return `**${s.name}** — ${s.years}+ years · ${levelWord(s.level)}\n::bar ${s.level}\n${s.note}`; }
    function levelWord(l) { return l >= 90 ? 'expert' : l >= 80 ? 'advanced' : l >= 65 ? 'proficient' : l >= 50 ? 'working knowledge' : 'familiar'; }
    function skillsByCat(cat) { return KB.skills.filter(s => s.cat === cat).sort((a, b) => b.level - a.level); }
    function topSkills(n) { return [...KB.skills].sort((a, b) => b.level - a.level).slice(0, n); }
    function projectsUsing(skill) { return KB.projects.filter(p => p.id !== 'site' && p.stack.some(st => mentions(st, skill))); }
    function rolesUsing(skill) { return KB.experience.filter(e => e.stack.some(st => mentions(st, skill))); }
    function expLine(e) {
        const dur = fmtDuration(yearsBetween(e.start, e.end));
        return `**${e.role}** · ${e.company}${e.via ? ' (via ' + e.via + ')' : ''} — ${e.location}\n${fmtYm(e.start)} → ${fmtYm(e.end)} (${dur}). ${e.summary}`;
    }
    function projLine(p) { return `**${p.name}** (${p.period}) — ${p.summary} *Stack:* ${p.stack.join(', ')}.`; }
    function timeGreeting() { const h = new Date().getHours(); return h < 5 ? 'Hello night owl' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; }

    const FOLLOW = {
        experience: ['How many years of experience does he have?', 'What does he do at Emirates NBD?', 'Tell me about reach52'],
        skills: ['How strong is he in React?', 'What are his AI skills?', 'Which databases does he use?'],
        projects: ['Tell me about reach52 Insights', 'What is Gold Vault Tracker?', 'Which projects used Next.js?'],
        contact: ['Is he open to new roles?', 'Where is he based?', 'Download his CV'],
        ai: ['Has he built RAG pipelines?', 'What AI models does he work with?', 'Which projects involve AI?'],
        general: ['Summarise his experience', 'What is his tech stack?', 'How do I contact him?', 'Why should I hire him?']
    };

    function compose(ctx) {
        const { intent, entities, text, memory, retrieval } = ctx;
        const skills = entities.skill.filter(e => !e.weak).map(e => e.ref);
        const weakSkills = entities.skill.filter(e => e.weak).map(e => e.ref);
        const companies = entities.company.map(e => e.ref);
        const projects = entities.project.map(e => e.ref);
        const first = P.first;
        let md = '', followups = [], actions = [], pending = null, topic = null;

        switch (intent) {
            case 'help':
                md = `Here's what I can help with — I know ${first}'s CV inside out:\n\n- **Experience** — roles, companies, durations, what he did (e.g. *"What did he do at reach52?"*)\n- **Skills** — depth in any technology (e.g. *"How many years of Node.js?"*, *"React vs Angular?"*)\n- **AI work** — RAG pipelines, LLM integrations, agentic automation\n- **Projects** — enterprise platforms, PWAs, native iOS apps\n- **Hiring** — availability, location, remote work, how to contact him\n\nSlash commands: \`/skills\`, \`/projects\`, \`/experience\`, \`/contact\`, \`/cv\`, \`/clear\`. Press **/** anywhere on the page to focus this box.`;
                followups = FOLLOW.general; actions = [ACT.skills, ACT.projects]; break;

            case 'greeting':
                md = `${timeGreeting()}! 👋 I'm ${first}'s AI assistant — running entirely in your browser. Ask me about his **experience**, **skills**, **AI work** or **projects**, or type \`/help\`.`;
                followups = FOLLOW.general; break;

            case 'thanks':
                md = pick([`You're welcome! Anything else you'd like to know about ${first}?`, `Happy to help. Want a quick summary of ${first}'s experience, or his contact details?`, `Glad that helped! 🙌 I can also pull up his CV or projects if useful.`]);
                pending = { id: 'offer_general' }; followups = ['Summarise his experience', 'Show contact details', 'Download his CV']; break;

            case 'bye':
                md = `Take care! 👋 If you'd like to follow up with ${first} directly, his email is ${link(P.email, 'mailto:' + P.email)}.`; actions = [ACT.email, ACT.linkedin]; break;

            case 'identity_bot':
                md = `I'm **${first}'s AI assistant** — a small reasoning engine that ${first} built to run **100% client-side** on this static site.\n\n- **No server, no API keys** — nothing you type leaves your browser\n- Pipeline: spell-correction → intent classification → entity extraction → **BM25 retrieval** over his CV → templated answer composition\n- Conversation memory lets you ask follow-ups like *"and Node?"*\n- Optional engines (top-right menu): run a real LLM **in your browser via WebGPU** (WebLLM), or point me at a **local Ollama** — both use my retrieval as RAG context\n\nIn other words: I'm a demo of the kind of retrieval-first assistant ${first} builds for clients.`;
                followups = ['What AI work has Ajith done?', 'How was this site built?', 'Show me his projects']; actions = [ACT.aihub]; topic = 'ai'; break;

            case 'identity_person': {
                const cur = KB.experience[0];
                md = `**${P.name}** is a ${P.title} based in ${P.location.short}, with ${totalYearsLabel()} of professional experience.\n\n${P.headline}\n\n- Currently **${cur.role}** at **${cur.company}** (via ${cur.via})\n- Previously full-stack at **reach52** (Singapore, remote) and lead developer at **Tutorhow** (India)\n- Focus areas: React/Next.js, Node.js microservices, MongoDB/SQL, AWS, and **AI/LLM integrations** (RAG, agents, Claude/OpenAI/Ollama)\n- ${P.education.degree}, ${P.education.school} (${P.education.grade})`;
                followups = FOLLOW.experience; actions = [ACT.experience, ACT.cv]; topic = 'experience'; break;
            }

            case 'experience_total': {
                const yrs = totalYears();
                md = `${first} has **${fmtDuration(yrs)}** of professional software-engineering experience (since ${fmtYm(P.careerStart)}), across ${KB.experience.length} organisations:\n\n${KB.experience.map(e => `- **${e.company}** — ${e.role} (${fmtDuration(yearsBetween(e.start, e.end))})`).join('\n')}\n\nRoughly ${Math.round(yrs)} years full-stack, of which the last ~3 have leaned heavily into AI/LLM integration.`;
                followups = FOLLOW.experience; actions = [ACT.experience]; topic = 'experience'; break;
            }

            case 'current_role': {
                const e = KB.experience[0];
                md = `Right now ${first} is a **${e.role}** at **${e.company}**, via ${e.via}, in ${e.location} (since ${fmtYm(e.start)}).\n\n${e.highlights.map(h => '- ' + h).join('\n')}\n\n*Stack:* ${e.stack.join(', ')}.`;
                followups = ['What did he do before that?', 'How long has he been there?', 'Is he open to new roles?']; actions = [ACT.experience]; topic = 'experience'; memory.lastCompany = e; break;
            }

            case 'experience':
                md = `Here's ${first}'s career at a glance — **${totalYearsLabel()}** across banking, healthcare data and edtech:\n\n${KB.experience.map(e => `- ${expLine(e).replace(/\n/g, ' — ')}`).join('\n')}`;
                followups = FOLLOW.experience; actions = [ACT.experience, ACT.cv]; topic = 'experience'; break;

            case 'company': {
                const e = companies[0];
                if (companies.length > 1) {
                    md = companies.map(c => expLine(c)).join('\n\n');
                    followups = ['Compare his time at each company', 'What tech did he use there?']; topic = 'experience'; actions = [ACT.experience]; break;
                }
                const tech = skills[0];
                if (tech) {
                    const used = e.stack.some(st => mentions(st, tech)) || e.highlights.some(h => mentions(h, tech));
                    md = used
                        ? `Yes — at **${e.company}** ${first} used **${tech.name}**. ${e.summary}\n\n${e.highlights.filter(h => mentions(h, tech)).map(h => '- ' + h).join('\n') || '- ' + e.highlights[0]}\n\n*Full stack there:* ${e.stack.join(', ')}.`
                        : `**${tech.name}** wasn't part of the core stack at **${e.company}** — that role centred on ${e.stack.slice(0, 4).join(', ')}. ${first}'s ${tech.name} experience (${tech.years}+ years) comes mainly from ${rolesUsing(tech).map(shortCo).join(', ') || 'other projects'}.`;
                } else {
                    md = `${expLine(e)}\n\n**What he did there:**\n${e.highlights.map(h => '- ' + h).join('\n')}\n\n*Stack:* ${e.stack.join(', ')}.`;
                }
                memory.lastCompany = e;
                followups = [`Which projects did he build at ${shortCo(e)}?`, e.id === 'infosys' ? 'What came after that?' : 'What did he do before that?', 'What is his total experience?']; actions = [ACT.experience]; topic = 'experience'; break;
            }

            case 'project': {
                const p = projects[0];
                if (projects.length > 1) { md = projects.map(projLine).join('\n\n'); }
                else {
                    md = `**${p.name}** (${p.period}${p.company !== 'Personal' ? ', ' + p.company : ''})\n\n${p.summary}\n\n- *Stack:* ${p.stack.join(', ')}\n- *Deployment:* ${p.deploy}`;
                    if (p.id === 'site') md += `\n\nThe assistant you're talking to is part of it — ask *"who are you?"* for the internals.`;
                }
                memory.lastProject = p;
                followups = ['What other projects has he built?', `What did he do at ${p.company === 'Personal' ? 'Emirates NBD' : p.company}?`, 'Which projects used AI?']; actions = [ACT.projects]; topic = 'projects'; break;
            }

            case 'projects': {
                if (skills[0]) {
                    const s = skills[0]; const list = projectsUsing(s);
                    md = list.length
                        ? `Projects where ${first} used **${s.name}**:\n\n${list.map(projLine).join('\n\n')}`
                        : `None of the featured projects list **${s.name}** directly, but ${first} has ${s.years}+ years with it: ${s.note}`;
                    followups = [`How many years of ${shortName(s)}?`, 'Show all projects', 'What is his tech stack?'];
                } else if (/\b(ai|analytics|data|ml)\b/.test(text)) {
                    const list = KB.projects.filter(p => p.category.includes('ai') && p.id !== 'site');
                    md = `AI & analytics-flavoured projects:\n\n${list.map(projLine).join('\n\n')}\n\nPlus this very assistant — a client-side RAG demo.`;
                    followups = FOLLOW.ai;
                } else if (/\b(mobile|ios|android|app|apps)\b/.test(text) && !/\bweb\b/.test(text)) {
                    const list = KB.projects.filter(p => p.category.includes('mobile'));
                    md = `Mobile projects:\n\n${list.map(projLine).join('\n\n')}`;
                    followups = ['Tell me about Gold Vault Tracker', 'Does he know Swift?', 'What about React Native?'];
                } else {
                    const feat = KB.projects.filter(p => p.id !== 'site');
                    md = `${first}'s featured work — ${feat.length} production projects across enterprise analytics, edtech and native mobile:\n\n${feat.map(p => `- **${p.name}** (${p.period}) — ${p.summary.split('. ')[0]}. *${p.stack.slice(0, 3).join(', ')}*`).join('\n')}\n\nAsk about any of them by name for the full breakdown.`;
                    followups = FOLLOW.projects;
                }
                actions = [ACT.projects]; topic = 'projects'; break;
            }

            case 'howmany_projects':
                if (/\b(compan|job|employ)/.test(text)) { md = `${first} has worked at **${KB.experience.length} companies**: ${KB.experience.map(shortCo).join(', ')} — ${totalYearsLabel()} in total.`; topic = 'experience'; actions = [ACT.experience]; followups = FOLLOW.experience; break; }
                else { md = `This portfolio features **${KB.projects.length - 1} flagship projects** (plus this site), but across his career ${first} has shipped **30+ projects** — enterprise platforms, PWAs, mobile apps, dashboards and internal tools.`; topic = 'projects'; actions = [ACT.projects]; }
                followups = FOLLOW.projects; break;

            case 'education':
                md = `🎓 **${P.education.degree}**\n${P.education.school}, ${P.education.place} · ${P.education.years} · **${P.education.grade}**\n\nHe went straight from graduation into Infosys (${fmtYm('2019-06')}) and has been building software professionally ever since.`;
                followups = ['Does he have certifications?', 'What was his first job?', 'Summarise his experience']; actions = [ACT.experience]; topic = 'education'; break;

            case 'certifications':
                md = `${first}'s CV doesn't list formal certifications — his profile is built on **${totalYearsLabel()} of shipped production work** (corporate banking, healthcare analytics, edtech) rather than badges. If a specific certification matters for a role, it's best to ask him directly.`;
                followups = ['What is his education?', 'What are his strengths?', 'How do I contact him?']; actions = [ACT.email]; break;

            case 'contact':
                md = `📬 Here's how to reach ${first}:\n\n- **Email:** ${link(P.email, 'mailto:' + P.email)} (or ${link(P.email2, 'mailto:' + P.email2)})\n- **Phone:** ${P.phone} — Dubai, ${P.location.tz}\n- **LinkedIn:** ${link('linkedin.com/in/ahgopi', P.socials.linkedin)}\n- **GitHub:** ${link('github.com/ajithgopi', P.socials.github)}\n- **Stack Overflow:** ${link('ajith-gopi', P.socials.stackoverflow)}\n- **YouTube:** ${link('Distro Studios', P.socials.youtube)} · **Instagram:** ${link('@ajith_gp', P.socials.instagram)}`;
                followups = FOLLOW.contact; actions = [ACT.email, ACT.linkedin, ACT.github]; topic = 'contact'; break;

            case 'hire':
                if (/\bwhy\b/.test(text)) return compose({ ...ctx, intent: 'strengths' });
                if (/\b(notice|start|join|when)\b/.test(text)) md = `Notice period and start dates aren't on the public CV — that's a conversation for ${first} directly. He's ${P.openTo}. ${link('Email him', 'mailto:' + P.email)} and he'll come back quickly.`;
                else if (/\b(visa|permit|authori|sponsor)\b/.test(text)) md = `${first} is currently employed in **Dubai, UAE** (via Synechron for Emirates NBD). For work-authorisation or sponsorship specifics in another country, please ${link('reach out to him directly', 'mailto:' + P.email)}.`;
                else if (/\b(freelance|contract|part)\b/.test(text)) md = `${first} is primarily open to ${P.openTo}. For contract or freelance engagements, the best route is a direct message — ${link(P.email, 'mailto:' + P.email)}.`;
                else md = `Yes — ${first} is open to **${P.openTo}**.\n\n- **Currently:** ${KB.experience[0].role} at ${KB.experience[0].company}, Dubai\n- **Sweet spot:** React/Next.js + Node.js platforms, cloud microservices on AWS, and AI/LLM integrations\n- **Remote-ready:** ~3 years fully remote with reach52 (Singapore)\n\nDrop him a line at ${link(P.email, 'mailto:' + P.email)} or on ${link('LinkedIn', P.socials.linkedin)}.`;
                followups = ['Why should I hire him?', 'Is he open to remote work?', 'Download his CV']; actions = [ACT.email, ACT.linkedin, ACT.cv]; topic = 'contact'; break;

            case 'salary':
                md = `I don't have compensation details — and ${first} would rather discuss that in context of the role. Please ${link('email him', 'mailto:' + P.email)} with the opportunity and he'll respond promptly. 💬`;
                followups = ['Is he open to new roles?', 'How do I contact him?', 'Where is he based?']; actions = [ACT.email]; break;

            case 'location':
                if (/\b(time ?zone)\b/.test(text)) md = `${first} is in **${P.location.short}** — timezone **${P.location.tz}**, which overlaps nicely with both European and South/South-East Asian working hours.`;
                else md = `📍 ${first} is based in **${P.location.city}, ${P.location.country}** (${P.location.tz}). He's originally from **${P.location.origin}**, and has worked with teams in Singapore, India and the UAE — including ~3 years fully remote.`;
                followups = ['Is he open to relocation?', 'Is he open to remote work?', 'What is his current role?']; topic = 'location'; break;

            case 'remote':
                md = /\brelocat|move\b/.test(text)
                    ? `${first} is open to **relocation for the right opportunity**, and equally comfortable **remote** — he spent ~3 years (2022–2024) working fully remotely for reach52 in Singapore from India and Dubai. Best to confirm specifics with him directly.`
                    : `Absolutely — ${first} has a strong remote track record: **~3 years fully remote** as a Full Stack Engineer for reach52 (Singapore), collaborating across time zones with product, design and QA. He's open to remote, hybrid or on-site roles.`;
                followups = ['Where is he based?', 'Is he open to new roles?', 'Tell me about reach52']; actions = [ACT.email]; break;

            case 'leadership': {
                const t = KB.experience.find(e => e.id === 'tutorhow');
                md = `Yes — at **${t.company}** (${fmtYm(t.start)} → ${fmtYm(t.end)}) ${first} was **Lead Developer**, leading a team of **3 developers and 2 QA engineers**:\n\n- Owned delivery and quality standards across Next.js, Laravel and React Native products\n- Ran code reviews, mentored the team and managed deployment processes\n- Worked with stakeholders to define goals and ship on time\n\nSince then he's continued as a senior IC — code reviews and cross-team architecture discussions at reach52 and Emirates NBD.`;
                followups = ['What are his strengths?', 'Tell me about Tutorhow', 'Is he open to lead roles?']; topic = 'experience'; break;
            }

            case 'strengths':
                md = `A few things that make ${first} stand out:\n\n- **Full-stack depth** — ${totalYearsLabel()} across React/Next.js, Node.js, MongoDB/SQL and AWS, in banking, healthcare and edtech\n- **AI-native workflow** — ships with Claude/OpenAI/Ollama in the loop: RAG pipelines, agentic automation and in-sprint AI tooling (he built the assistant you're using)\n- **Ownership** — led a 5-person team, managed deployments and CI/CD end-to-end\n- **Adaptable** — ${P.competencies[2].toLowerCase()}; comfortable remote and cross-time-zone\n- **Product sense** — UI/UX-minded, builds high-fidelity interfaces, not just APIs`;
                followups = ['Any weaknesses?', 'What AI work has he done?', 'How do I contact him?']; actions = [ACT.cv, ACT.email]; break;

            case 'weakness':
                md = `Honest answer: his CV doesn't advertise weaknesses 😄 — but a fair read is that ${first}'s depth is in the **JavaScript/TypeScript + Node + React** ecosystem and AWS; tools like Azure/GCP, Golang or Kubernetes are working-knowledge rather than expert level. He's known for picking up new stacks fast, so treat those as growth areas rather than gaps.`;
                followups = ['What are his strengths?', 'What is his tech stack?']; break;

            case 'ai_expertise': {
                const ai = KB.skills.find(s => s.id === 'ai'), ml = KB.skills.find(s => s.id === 'ml');
                md = `🤖 AI is a core part of how ${first} works, not a side project:\n\n${skillLine(ai)}\n\n${skillLine(ml)}\n\n**In practice:**\n- In-sprint AI automation and Claude-assisted development at **Emirates NBD** (corporate banking)\n- Custom **RAG pipelines** with vector search (Chroma/FAISS) and context-aware document retrieval\n- Agentic workflows that write, audit and optimise code and process unstructured business data\n- This assistant — a retrieval-first engine with optional WebGPU/Ollama LLM backends`;
                followups = FOLLOW.ai; actions = [ACT.aihub]; topic = 'ai'; break;
            }

            case 'skills_category': {
                const m = text.match(/\b(frontend|front-end|front end|backend|back-end|back end|mobile|cloud|devops|database|databases|ai|ml|data)\b/);
                const cat = m ? m[1] : '';
                const map = { frontend: 'web', 'front-end': 'web', 'front end': 'web', backend: 'web', 'back-end': 'web', 'back end': 'web', mobile: 'mobile', cloud: 'database', devops: 'tools', database: 'database', databases: 'database', ai: 'ai', ml: 'ai', data: 'ai' };
                let list = skillsByCat(map[cat] || 'web');
                if (/back/.test(cat)) list = list.filter(s => ['node', 'php', 'api', 'python', 'golang', 'javascript', 'typescript'].includes(s.id));
                if (/front/.test(cat)) list = list.filter(s => ['react', 'nextjs', 'angular', 'vue', 'tailwind', 'javascript', 'typescript'].includes(s.id));
                if (/cloud/.test(cat)) list = KB.skills.filter(s => ['aws', 'cloud-other', 'docker', 'kubernetes', 'cicd', 'linux'].includes(s.id));
                md = `${first}'s **${cat}** skills:\n\n${list.map(s => `- **${s.name}** — ${s.years}+ yrs · ${levelWord(s.level)}`).join('\n')}`;
                followups = ['Show the full stack', 'Which is his strongest skill?', 'Show related projects']; actions = [ACT.skills]; topic = 'skills'; break;
            }

            case 'skills': {
                if (/\b(strongest|best|top|main|primary|core|favou?rite|go-to|preferred)\b/.test(text)) {
                    const top = topSkills(6);
                    md = `${first}'s strongest skills, ranked by depth:\n\n${top.map((s, i) => `${i + 1}. **${s.name}** — ${s.years}+ yrs · ${levelWord(s.level)}`).join('\n')}\n\nHis go-to stack for a new product: **TypeScript + React/Next.js + Node.js + MongoDB on AWS**, with Claude/OpenAI in the loop.`;
                    followups = ['How strong is he in React?', 'What are his AI skills?', 'React vs Angular']; actions = [ACT.skills]; topic = 'skills'; break;
                }
                const cats = { web: 'Web & Backend', ai: 'AI & Data', database: 'Databases & Cloud', mobile: 'Mobile', tools: 'DevOps & Tools' };
                md = `🛠️ ${first}'s stack — ${KB.skills.length} technologies, strongest first:\n\n${Object.entries(cats).map(([c, label]) => `**${label}:** ${skillsByCat(c).map(s => s.name.split(' (')[0].split(' /')[0]).join(', ')}`).join('\n\n')}\n\nAsk about any one for years and context — e.g. *"how strong is he in MongoDB?"*`;
                followups = FOLLOW.skills; actions = [ACT.skills]; topic = 'skills'; break;
            }

            case 'compare': {
                const [a, b] = skills;
                if (a && b) {
                    const stronger = a.level >= b.level ? a : b, other = stronger === a ? b : a;
                    md = `**${a.name}** vs **${b.name}**\n\n${skillLine(a)}\n\n${skillLine(b)}\n\n**Verdict:** ${first} is stronger in **${stronger.name}** (${stronger.years}+ yrs, ${levelWord(stronger.level)}) but comfortably productive in ${other.name} too${stronger.level - other.level < 10 ? ' — it\'s close' : ''}.`;
                    followups = [`Which projects used ${shortName(a)}?`, `Which projects used ${shortName(b)}?`, 'What is his strongest skill?'];
                } else if (a) {
                    md = `I can compare two technologies — I only spotted **${a.name}** in your question. Try *"${shortName(a)} vs ${shortName(pairFor(a))}"*.\n\n${skillLine(a)}`;
                    followups = FOLLOW.skills;
                } else {
                    md = `Tell me which two technologies to compare — e.g. *"React vs Angular"* or *"MongoDB or PostgreSQL?"* — and I'll line up ${first}'s experience with each.`;
                    followups = ['React vs Angular', 'MongoDB vs PostgreSQL', 'Swift vs React Native'];
                }
                actions = [ACT.skills]; topic = 'skills'; break;
            }

            case 'tech_years':
            case 'knows_tech':
            case 'tech_general': {
                if (!skills.length) {
                    // unknown tech: try to name it
                    const unknown = guessUnknownTech(text);
                    if (weakSkills.length) {
                        const s = weakSkills[0];
                        const wa = entities.skill.find(e => e.weak).alias;
                        if (['database', 'databases', 'db'].includes(wa)) return compose({ ...ctx, intent: 'skills_category', text: 'database ' + text });
                        if (['mobile', 'mobile apps', 'mobile app development', 'mobile development'].includes(wa)) return compose({ ...ctx, intent: 'skills_category', text: 'mobile ' + text });
                        if (['cloud', 'infrastructure'].includes(wa)) return compose({ ...ctx, intent: 'skills_category', text: 'cloud ' + text });
                        if (['frontend', 'backend'].includes(wa)) return compose({ ...ctx, intent: 'skills_category', text: wa + ' ' + text });
                        if (['ai', 'automation', 'prompt', 'prompts', 'models'].includes(wa)) return compose({ ...ctx, intent: 'ai_expertise' });
                        md = `${skillLine(s)}\n\n*Used at:* ${rolesUsing(s).map(shortCo).join(', ') || 'multiple projects'}.`;
                        followups = [`Which projects used ${shortName(s)}?`, 'What is his full stack?']; topic = 'skills'; actions = [ACT.skills];
                        memory.lastSkills = [s]; break;
                    }
                    const near = retrieval.filter(r => r.doc.type === 'skill').slice(0, 3).map(r => r.doc.ref);
                    md = `**${unknown ? cap(unknown) : 'That technology'}** isn't listed on ${first}'s CV, so I won't claim experience he hasn't documented.\n\nHis core stack is **JavaScript/TypeScript, React/Next.js, Node.js, MongoDB/SQL, AWS and AI/LLM tooling** — and he has a track record of picking up adjacent tools quickly.${near.length ? `\n\n*Closest listed skills:* ${near.map(s => s.name).join(', ')}.` : ''}\n\nIf it's critical for a role, ${link('ask him directly', 'mailto:' + P.email)}.`;
                    followups = ['What is his full tech stack?', 'How quickly does he learn new tools?', 'What are his strengths?']; actions = [ACT.skills, ACT.email]; topic = 'skills'; break;
                }
                if (skills.length > 1) {
                    md = skills.slice(0, 4).map(s => skillLine(s)).join('\n\n');
                    if (skills.length > 4) md += `\n\n…and ${skills.length - 4} more. Ask about them individually for detail.`;
                    followups = [shortName(skills[0]) + ' vs ' + shortName(skills[1]), 'Show related projects', 'What is his full stack?'];
                } else {
                    const s = skills[0];
                    const roles = rolesUsing(s), projs = projectsUsing(s);
                    const yesNo = intent === 'knows_tech' ? `**Yes** — ${first} has **${s.years}+ years** with ${s.name} (${levelWord(s.level)}).\n\n` : '';
                    md = `${yesNo}${skillLine(s)}` + (roles.length ? `\n\n*Used at:* ${roles.map(shortCo).join(', ')}.` : '') + (projs.length ? `\n*Projects:* ${projs.map(p => p.name).join(', ')}.` : '');
                    if (intent === 'tech_years') md = `${first} has **${s.years}+ years** of hands-on experience with **${s.name}** (${levelWord(s.level)} level).\n\n::bar ${s.level}\n${s.note}` + (roles.length ? `\n\n*Used at:* ${roles.map(shortCo).join(', ')}.` : '');
                    followups = [`Which projects used ${shortName(s)}?`, `${shortName(s)} vs ${shortName(pairFor(s))}`, 'What is his full stack?'];
                }
                memory.lastSkills = skills.slice();
                actions = [ACT.skills]; topic = 'skills'; break;
            }

            case 'languages_spoken':
                md = `${first} is **fluent in English** — it's been his working language across teams in Singapore, India and the UAE. (If you meant *programming* languages: JavaScript/TypeScript, Python, Swift, Kotlin, PHP, Go and SQL.)`;
                followups = ['What programming languages does he know?', 'Where is he based?']; break;

            case 'hobbies':
                md = `Outside of code, ${first} is a **passionate musician** 🎸 and runs the YouTube channel ${link('Distro Studios', P.socials.youtube)}. He also tinkers with **IoT and multimedia automation** and has built game-server control panels for fun — the kind of side projects that keep his engineering curiosity sharp.`;
                followups = ['What is his YouTube channel?', 'Tell me about his projects', 'How do I contact him?']; actions = [{ label: 'YouTube', icon: 'fa-youtube', brand: true, href: P.socials.youtube }]; break;

            case 'personal':
                md = `I keep to ${first}'s **professional** profile, so I don't share personal details like that. Happy to cover his experience, skills, projects or how to get in touch.`;
                followups = FOLLOW.general; break;

            case 'cv':
                md = `📄 You can ${link('download Ajith\'s CV (PDF)', P.cv)} directly. For a 30-second version: ${totalYearsLabel()} full-stack + AI engineer, React/Next.js · Node.js · MongoDB/SQL · AWS, currently at Emirates NBD in Dubai.`;
                followups = ['Summarise his experience', 'What is his tech stack?', 'How do I contact him?']; actions = [ACT.cv, ACT.linkedin]; break;

            case 'achievements':
                md = `Some highlights from ${first}'s career:\n\n- Building **corporate banking** deal and RM-management platforms at Emirates NBD with AI-assisted, in-sprint automation\n- Shipped **reach52 Insights**, an analytics platform used by global healthcare clients, on AWS EKS with full CI/CD\n- **Led a 5-person team** at Tutorhow, delivering a PWA lead system, an online-class platform and a white-labelled mobile app\n- Published **Gold Vault Tracker**, a native iOS app with WidgetKit and biometric auth\n- ${totalYearsLabel()} without missing a delivery — ${P.competencies[3].toLowerCase()}`;
                followups = FOLLOW.projects; actions = [ACT.projects]; topic = 'projects'; break;

            case 'joke':
                md = pick(KB.jokes) + `\n\nOkay, back to business — what would you like to know about ${first}?`;
                followups = FOLLOW.general; break;

            case 'site_meta':
                md = `This site is a **static build on GitHub Pages** — no frameworks, no build step:\n\n- Vanilla JS + Bootstrap 5 grid, custom design system with glass surfaces and animated gradient borders\n- The hero background is a **3D neural constellation** rendered on a 2D canvas (perspective projection, k-nearest edges, signal pulses that react when I'm thinking)\n- This assistant is fully client-side; optional WebGPU/Ollama engines are loaded on demand\n\nSource lives at ${link('github.com/ajithgopi/ajithgopi.github.io', 'https://github.com/ajithgopi/ajithgopi.github.io')}.`;
                followups = ['Who are you?', 'What AI work has Ajith done?']; actions = [ACT.github]; break;

            case 'industry': {
                const DOM = [
                    { re: /\b(fintech|finance|financial|bank|banking|trading|stock|stocks|market|markets|insurance|insurtech|crypto)\b/, name: 'FinTech & Banking', text: `**Yes** — ${first} is currently building **corporate-banking** platforms at **Emirates NBD** (deal management and Relationship-Manager workflows, via Synechron), in a security-conscious, multi-team banking environment. On the side he built **Gold Vault Tracker**, an iOS precious-metals tracking app with real-time market APIs, and has worked on statistical prediction models for financial-market data.` },
                    { re: /\b(healthcare|health|medical|pharma|clinical)\b/, name: 'Healthcare', text: `**Yes** — for almost three years at **reach52** (Singapore) ${first} built data-management and analytics platforms for a global healthcare organisation, including **reach52 Insights** (client-facing project monitoring) and **reach52 Connect** (campaign and operations automation).` },
                    { re: /\b(edtech|education sector|e-?learning|learning|teaching|school|training)\b/, name: 'EdTech', text: `**Yes** — as Lead Developer at **Tutorhow** ${first} shipped an online-class and fee-collection platform (**ETO**), a lead-management PWA (**Virtual Front Desk**) and a white-labelled **training-institute mobile app**.` },
                    { re: /\b(iot|embedded|hardware|multimedia|automation)\b/, name: 'IoT & Automation', text: `${first} has delivered **IoT and multimedia automation** systems and game-server control panels as full-cycle projects, alongside his enterprise work.` },
                    { re: /\b(enterprise|saas|b2b|it services|consulting)\b/, name: 'Enterprise / IT services', text: `**Yes** — ${first} started at **Infosys** (enterprise IT services, ServiceNow) and has since built enterprise-grade B2B platforms for reach52 and Emirates NBD.` },
                    { re: /\b(startup|startups)\b/, name: 'Startups', text: `**Yes** — Tutorhow was an early-stage edtech startup where ${first} led a 5-person team and wore every hat from architecture to deployments; reach52 was a lean, remote-first social enterprise.` }
                ];
                const hit = DOM.find(d => d.re.test(text));
                if (hit) { md = `${hit.text}\n\n*Other domains:* ${DOM.filter(d => d !== hit).map(d => d.name).join(', ')}.`; }
                else { md = `${first}'s industry experience spans:\n\n- **FinTech & corporate banking** — Emirates NBD (current)\n- **Healthcare data & analytics** — reach52\n- **EdTech** — Tutorhow (lead developer)\n- **Enterprise IT services** — Infosys\n- **IoT / multimedia automation** — personal projects\n\nIf you're asking about a sector not listed here, it's not on his CV — but his platform and data skills transfer well.`; }
                followups = ['What did he do at Emirates NBD?', 'Tell me about reach52', 'Is he open to new roles?']; actions = [ACT.experience]; topic = 'experience'; break;
            }

            case 'role_query': {
                const byLen = [...KB.experience].sort((a, b) => yearsBetween(b.start, b.end) - yearsBetween(a.start, a.end));
                let e;
                if (/\blongest\b/.test(text)) e = byLen[0];
                else if (/\bshortest\b/.test(text)) e = byLen[byLen.length - 1];
                else if (/\b(first|earliest|start|begin)\b/.test(text)) e = KB.experience[KB.experience.length - 1];
                else if (/\b(before|previous|prior|last|earlier)\b/.test(text)) {
                    const named = companies[0] || memory.lastCompany || KB.experience[0]; const i = KB.experience.findIndex(x => x.id === named.id);
                    if (i >= KB.experience.length - 1) { md = `**${shortCo(named)}** was ${first}'s first job out of university (${fmtYm(named.start)}) — nothing before that except his BCA at ${P.education.school}.`; followups = ['What is his education?', 'What is his current role?']; topic = 'experience'; break; }
                    e = KB.experience[i + 1];
                }
                else e = KB.experience[0];
                md = `${/\blongest\b/.test(text) ? 'His longest stint: ' : /\bshortest\b/.test(text) ? 'His shortest stint: ' : /\b(first|earliest|start|begin)\b/.test(text) ? 'His first job: ' : /\b(before|previous|prior|last|earlier)\b/.test(text) ? 'Before that: ' : ''}${expLine(e)}\n\n${e.highlights.slice(0, 3).map(h => '- ' + h).join('\n')}`;
                memory.lastCompany = e; topic = 'experience'; actions = [ACT.experience];
                followups = ['What is his total experience?', `Tell me more about ${shortCo(e)}`, 'What is his current role?']; break;
            }

            case 'affirm': {
                const pend = memory.pending;
                if (pend && pend.id === 'offer_general') { md = `Sure — here's the quick summary:\n\n${KB.experience.map(e => '- ' + expLine(e).split('\n')[0]).join('\n')}\n\nAnd you can reach him at ${link(P.email, 'mailto:' + P.email)}.`; followups = FOLLOW.general; actions = [ACT.experience, ACT.email]; }
                else if (pend && pend.intent) { return compose({ ...ctx, intent: pend.intent, entities: pend.entities || entities, memory: { ...memory, pending: null } }); }
                else { md = `👍 What would you like to explore — experience, skills, projects or contact details?`; followups = FOLLOW.general; }
                break;
            }
            case 'deny':
                md = `No problem. I'm here if anything else comes up about ${first}.`; followups = FOLLOW.general; break;

            case 'more': {
                const s = memory.lastSkills && memory.lastSkills[0];
                if (memory.lastTopic === 'skills' && s) {
                    const roles = rolesUsing(s), projs = projectsUsing(s);
                    md = `More on **${s.name}**:\n\n- ${s.note}\n${roles.map(r => `- **${shortCo(r)}** (${fmtYm(r.start)} → ${fmtYm(r.end)}): ${r.highlights.find(h => mentions(h, s)) || r.summary}`).join('\n')}${projs.length ? `\n\n*Projects:* ${projs.map(p => `**${p.name}** — ${p.stack.join(', ')}`).join('; ')}.` : ''}`;
                    followups = [`${shortName(s)} vs ${shortName(pairFor(s))}`, 'Show related projects'];
                } else if (memory.lastCompany) {
                    const e = memory.lastCompany;
                    md = `More about **${e.company}**:\n\n${e.highlights.map(h => '- ' + h).join('\n')}\n\n*Stack:* ${e.stack.join(', ')}.` + (KB.projects.filter(p => p.company === e.company.split(' ')[0]).length ? `\n*Projects there:* ${KB.projects.filter(p => p.company === e.company.split(' ')[0]).map(p => p.name).join(', ')}.` : '');
                    followups = ['What came next?', 'What is his total experience?'];
                } else if (memory.lastProject) {
                    const p = memory.lastProject;
                    md = `**${p.name}** in more depth:\n\n- ${p.summary}\n- *Stack:* ${p.stack.join(', ')}\n- *Deployment:* ${p.deploy}\n- *Period:* ${p.period}`;
                    followups = ['Show other projects', 'Which technologies did it use?'];
                } else if (memory.lastTopic === 'experience') { return compose({ ...ctx, intent: 'experience' }); }
                else if (memory.lastTopic === 'projects') { return compose({ ...ctx, intent: 'projects' }); }
                else if (memory.lastTopic === 'ai') { return compose({ ...ctx, intent: 'ai_expertise' }); }
                else { md = `Happy to go deeper — on what? His **experience**, a **technology**, a **project**, or his **AI work**?`; followups = FOLLOW.general; }
                break;
            }

            default: {
                // retrieval fallback
                const top = retrieval[0];
                if (top && top.score >= 2.2) {
                    const d = top.doc;
                    if (d.type === 'skill') return compose({ ...ctx, intent: 'tech_general', entities: { ...entities, skill: [{ ref: d.ref, weak: false }] } });
                    if (d.type === 'experience') return compose({ ...ctx, intent: 'company', entities: { ...entities, company: [{ ref: d.ref, weak: false }] } });
                    if (d.type === 'project') return compose({ ...ctx, intent: 'project', entities: { ...entities, project: [{ ref: d.ref, weak: false }] } });
                    const map = { profile: 'identity_person', education: 'education', contact: 'contact', interests: 'hobbies' };
                    if (map[d.type]) return compose({ ...ctx, intent: map[d.type] });
                }
                md = pick([
                    `I'm not sure I caught that — I specialise in ${first}'s professional profile. Try asking about his **experience**, a **technology**, a **project**, or **how to contact him**. Type \`/help\` for ideas.`,
                    `That one's outside what I know. I can tell you about ${first}'s **skills**, **AI work**, **projects** or **career** — what would help?`,
                    `Hmm, I don't have an answer for that. I'm strongest on ${first}'s **tech stack**, **work history** and **projects** — ask away, or type \`/help\`.`
                ]);
                followups = FOLLOW.general; ctx.fallback = true;
            }
        }
        return { md, followups, actions, pending, topic };
    }

    function guessUnknownTech(text) {
        const skip = new Set([...STOP, ...COMMON, 'ajith', 'he', 'does', 'know', 'use', 'work', 'with', 'in', 'any', 'have', 'has', 'experience', 'familiar', 'good', 'strong', 'skilled', 'used', 'worked', 'ever', 'also', 'much', 'well', 'comfortable', 'proficient', 'expert', 'years', 'year', 'long', 'many', 'us', 'uk', 'eu', 'the', 'for', 'ever', 'his', 'him']);
        const toks = tokenize(text).filter(t => !skip.has(t) && t.length > 1);
        return toks.length ? toks[toks.length - 1] : null;
    }

    /* ---------------------------------------------------------
     * 9. Engine
     * ------------------------------------------------------- */
    function createEngine() {
        const docs = buildDocs();
        const index = buildIndex(docs);
        const vocab = buildVocab(docs);
        const correct = makeCorrector(vocab);
        const memory = { pending: null, lastTopic: null, lastSkills: [], lastCompany: null, lastProject: null, turns: 0, lastIntent: null };

        function handleCommand(cmd) {
            const map = { '/skills': 'skills', '/projects': 'projects', '/experience': 'experience', '/contact': 'contact', '/cv': 'cv', '/help': 'help', '/about': 'identity_person', '/ai': 'ai_expertise', '/joke': 'joke' };
            return map[cmd] || null;
        }

        function ask(raw) {
            const t0 = performance.now();
            const reasoning = [];
            const original = String(raw || '').trim();
            let text = normalize(original);
            const { text: corrected, corrections } = correct(text);
            if (corrections.length) { text = corrected; reasoning.push({ icon: 'fa-spell-check', text: `Spell-check: ${corrections.map(c => `“${c.from}” → “${c.to}”`).join(', ')}` }); }
            reasoning.push({ icon: 'fa-cut', text: `Tokenised ${tokenize(text).length} tokens · normalised query “${text.length > 48 ? text.slice(0, 48) + '…' : text}”` });

            let forcedIntent = null;
            if (/^\/[a-z]+$/.test(text)) { forcedIntent = handleCommand(text); reasoning.push({ icon: 'fa-terminal', text: `Slash command → ${forcedIntent || 'unknown command'}` }); if (!forcedIntent) forcedIntent = 'help'; }

            let entities = extractEntities(text);
            const strongCount = entities.skill.filter(e => !e.weak).length + entities.company.length + entities.project.length;
            if (strongCount) reasoning.push({ icon: 'fa-tags', text: `Entities: ${[...entities.skill.filter(e => !e.weak).map(e => e.ref.name), ...entities.company.map(e => e.ref.company), ...entities.project.map(e => e.ref.name)].slice(0, 5).join(' · ')}` });

            let cls = forcedIntent ? { intent: forcedIntent, confidence: 1, ranked: [[forcedIntent, 99]] } : classify(text, entities, memory);
            let intent = cls.intent;

            // follow-up resolution
            const isFollowAnd = /^(and|what about|how about|also|plus|then)\b/.test(text);
            if (!forcedIntent && isFollowAnd && memory.lastIntent) {
                const inherit = ['tech_years', 'knows_tech', 'tech_general', 'company', 'project', 'projects'].includes(memory.lastIntent) ? memory.lastIntent : null;
                if (inherit && (entities.skill.length || entities.company.length || entities.project.length)) {
                    intent = entities.company.length && inherit.startsWith('tech') ? 'company' : entities.project.length && inherit.startsWith('tech') ? 'project' : inherit;
                    reasoning.push({ icon: 'fa-link', text: `Follow-up detected → inheriting intent “${intent}” from previous turn` });
                }
            }
            // pronoun / topic carry-over: "how many years?" with no entity
            if (!forcedIntent && ['tech_years', 'knows_tech', 'tech_general', 'compare', 'projects'].includes(intent) && !entities.skill.length && memory.lastSkills.length && /\b(it|that|this|those|them|there)\b/.test(text) || (intent === 'tech_years' && !entities.skill.length && memory.lastSkills.length && tokenize(text).length <= 5)) {
                entities = { ...entities, skill: memory.lastSkills.map(s => ({ ref: s, weak: false, index: 0 })) };
                reasoning.push({ icon: 'fa-brain', text: `Resolved reference to previous topic: ${memory.lastSkills.map(s => s.name).join(', ')}` });
            }
            if (!forcedIntent) reasoning.push({ icon: 'fa-bullseye', text: `Intent: ${intent} (${Math.round(cls.confidence * 100)}%)${cls.ranked[1] ? ` · runner-up: ${cls.ranked[1][0]}` : ''}` });

            const retrieval = index.search(text, 5);
            if (retrieval.length) reasoning.push({ icon: 'fa-database', text: `BM25 retrieval: ${retrieval.slice(0, 3).map(r => `${r.doc.title} <span class="score">(${r.score})</span>`).join(', ')}` });
            else reasoning.push({ icon: 'fa-database', text: 'BM25 retrieval: no matching CV passages' });

            const ctx = { intent, entities, text, memory, retrieval, original };
            const out = compose(ctx);
            reasoning.push({ icon: 'fa-pen-nib', text: `${ctx.fallback ? 'No confident match — composing guided fallback' : 'Composing answer from ' + (intent.replace(/_/g, ' ')) + ' template'} · ${(performance.now() - t0).toFixed(1)} ms` });

            // update memory
            memory.turns++;
            memory.lastIntent = ctx.fallback ? memory.lastIntent : intent;
            memory.pending = out.pending || null;
            if (out.topic) memory.lastTopic = out.topic;
            if (entities.skill.filter(e => !e.weak).length) memory.lastSkills = entities.skill.filter(e => !e.weak).map(e => e.ref);

            return {
                text: out.md,
                html: mdToHtml(out.md),
                reasoning,
                followups: (out.followups || []).slice(0, 4),
                actions: out.actions || [],
                intent, confidence: cls.confidence,
                entities: { skills: entities.skill.map(e => e.ref.name), companies: entities.company.map(e => e.ref.company), projects: entities.project.map(e => e.ref.name) },
                sources: retrieval.slice(0, 3).map(r => ({ title: r.doc.title, score: r.score, section: r.doc.section })),
                corrections,
                elapsedMs: performance.now() - t0,
                fallback: !!ctx.fallback
            };
        }

        function reset() { memory.pending = null; memory.lastTopic = null; memory.lastSkills = []; memory.lastCompany = null; memory.lastProject = null; memory.turns = 0; memory.lastIntent = null; }

        /* Compact, LLM-friendly context for the optional WebGPU / Ollama engines */
        function buildSystemPrompt(query) {
            const p = KB.profile;
            const top = index.search(query || '', 6).map(r => r.doc);
            const facts = [
                `You are "${p.first}'s AI Assistant" on ${p.name}'s portfolio website. Answer questions about ${p.name} (he/him) for recruiters and visitors. Be concise, friendly and factual. Use short markdown (bold, bullet lists). Never invent facts; if something is not in the profile, say so and suggest emailing ${p.email}. Do not share personal details beyond the professional profile. Today is ${new Date().toDateString()}.`,
                `PROFILE: ${p.name}, ${p.title}, based in ${p.location.short} (from ${p.location.origin}). Total experience ${totalYearsLabel()} since ${fmtYm(p.careerStart)}. Email ${p.email}, phone ${p.phone}, LinkedIn ${p.socials.linkedin}, GitHub ${p.socials.github}. CV: ${p.website}/${encodeURI(p.cv)}. Education: ${p.education.degree}, ${p.education.school}, ${p.education.years}, ${p.education.grade}. Open to: ${p.openTo}. Interests: ${p.interests.join('; ')}.`,
                `SUMMARY: ${p.summary.join(' ')}`,
                `EXPERIENCE: ` + KB.experience.map(e => `${e.role} at ${e.company}${e.via ? ' via ' + e.via : ''}, ${e.location}, ${fmtYm(e.start)}–${fmtYm(e.end)}: ${e.highlights.join('; ')}. Stack: ${e.stack.join(', ')}.`).join(' | '),
                `PROJECTS: ` + KB.projects.map(pr => `${pr.name} (${pr.period}): ${pr.summary} Stack: ${pr.stack.join(', ')}. Deployed: ${pr.deploy}.`).join(' | '),
                `SKILLS (name: years, level/100): ` + KB.skills.map(s => `${s.name}: ${s.years}+ yrs, ${s.level}`).join('; '),
                top.length ? `MOST RELEVANT PASSAGES FOR THIS QUESTION: ` + top.map(d => `[${d.title}] ${d.text.slice(0, 400)}`).join(' || ') : ''
            ];
            return facts.filter(Boolean).join('\n\n');
        }

        return { ask, reset, buildSystemPrompt, memory, kb: KB, search: index.search, mdToHtml, totalYears, totalYearsLabel };
    }

    global.AjithAI = { createEngine, KB, mdToHtml, normalize, tokenize, totalYears, totalYearsLabel, yearsBetween };
})(window);
