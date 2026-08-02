/* -------------------------------------------------------------
 * Interactive AI Assistant Sandbox ("Ajith AI")
 * ------------------------------------------------------------- */
const aiKnowledgeBase = [
    {
        id: "expertise",
        keywords: ["ai", "machine learning", "llm", "rag", "agent", "prompt", "gpt", "claude", "deep learning", "nlp", "artificial intelligence", "ollama", "openai"],
        answer: "🤖 <strong>Ajith's AI & Automation Expertise:</strong><br>Ajith prioritizes AI-based development (Claude/OpenAI/Ollama) with in-sprint automation. He designs custom RAG pipelines, context-aware document search, and LLM integrations across Node.js, Python, React, and AWS microservices!"
    },
    {
        id: "projects",
        keywords: ["project", "portfolio", "built", "apps", "work", "reach52", "tutorhow", "insights", "gold vault", "showcase", "github"],
        answer: "⚡ <strong>Key CV Projects:</strong><br>1. <strong>Emirates NBD Corporate Banking:</strong> RM daily management & deal platforms (React, Node, MongoDB, OracleDB).<br>2. <strong>reach52 insights & connect:</strong> Enterprise analytical monitoring & admin automation.<br>3. <strong>Tutorhow Virtual Front Desk & ETO:</strong> Multi-tenant edtech & PWA applications.<br>4. <strong>Gold Vault Tracker:</strong> Precious metal tracking iOS app."
    },
    {
        id: "skills",
        keywords: ["skill", "stack", "technology", "languages", "tech", "python", "react", "node", "aws", "framework", "database", "sql", "mongodb", "docker", "kubernetes", "swift", "kotlin", "php", "javascript", "typescript"],
        answer: "🛠️ <strong>Core Tech Stack:</strong><br>• <strong>Languages:</strong> JavaScript (ES6+), TypeScript, Python, Swift, Kotlin, PHP, SQL<br>• <strong>Frontend:</strong> React, Next.js, Angular, Redux, Tailwind, Bootstrap<br>• <strong>Backend & Cloud:</strong> Node.js, Express, Laravel, AWS, Docker, K8s<br>• <strong>Databases:</strong> MongoDB, PostgreSQL, MySQL, Redis, DynamoDB, Neo4J, OracleDB"
    },
    {
        id: "experience",
        keywords: ["experience", "background", "career", "job", "emirates", "synechron", "reach52", "tutorhow", "infosys", "history", "resume", "cv"],
        answer: "💼 <strong>Professional Experience:</strong><br>• <strong>Emirates NBD (Synechron)</strong> | Dubai (11/2024 - Present): Corporate Banking & AI-driven dev.<br>• <strong>reach52</strong> | Singapore (01/2022 - 11/2024): Full Stack Engineer & Cloud Microservices.<br>• <strong>Tutorhow</strong> | India (01/2020 - 12/2021): Lead Developer (PWA, Video/Audio streaming, Mobile Apps).<br>• <strong>Infosys</strong> | India (06/2019 - 01/2020): Systems Engineer."
    },
    {
        id: "contact",
        keywords: ["contact", "email", "hire", "reach", "linkedin", "phone", "call", "message", "social", "connect"],
        answer: "📬 <strong>Get in Touch:</strong><br>• Email: <a href='mailto:ajithgopikklm@gmail.com' class='text-info'>ajithgopikklm@gmail.com</a><br>• Phone: <span class='text-info'>(+971) 555-166-278</span> (Dubai)<br>• LinkedIn: <a href='https://www.linkedin.com/in/ahgopi/' target='_blank' class='text-info'>linkedin.com/in/ahgopi</a><br>• GitHub: <a href='https://github.com/ajithgopi' target='_blank' class='text-info'>github.com/ajithgopi</a>"
    },
    {
        id: "education",
        keywords: ["education", "degree", "university", "college", "mg university", "bca", "graduate", "study", "studied", "school"],
        answer: "🎓 <strong>Education:</strong><br>• <strong>Degree:</strong> Bachelor of Computer Application (BCA)<br>• <strong>University:</strong> Mahatma Gandhi University, Kottayam, India (2016 - 2019)<br>• <strong>Grade:</strong> 7.7 CGPA"
    },
    {
        id: "greetings",
        keywords: ["hi", "hello", "hey", "greetings", "morning", "afternoon", "evening", "who are you", "what are you"],
        answer: "👋 Hello! I'm Ajith's AI Assistant. Would you like to see a summary of his <strong>projects</strong> or <strong>experience</strong>?",
        qid: "ask_projects_or_experience"
    },
    {
        id: "thanks",
        keywords: ["thanks", "thank you", "ok", "great", "awesome", "cool", "nice", "good", "perfect"],
        answer: "You're welcome! Would you like to know how to get in touch with Ajith?",
        qid: "ask_contact"
    },
    {
        id: "location",
        keywords: ["location", "where", "live", "based", "city", "country", "dubai", "uae", "india", "relocate"],
        answer: "🌍 <strong>Location:</strong> Ajith is currently based in <strong>Dubai, UAE</strong>. He is open to exciting software engineering and AI architecture roles!"
    },
    {
        id: "salary",
        keywords: ["salary", "pay", "compensation", "rate", "cost", "price"],
        answer: "💰 Regarding compensation or rates, please contact Ajith directly at <a href='mailto:ajithgopikklm@gmail.com' class='text-info'>ajithgopikklm@gmail.com</a> to discuss!"
    }
];

const fallbackAnswers = [
    { text: "🚀 I'm not entirely sure about that, but Ajith is a full-stack engineer and AI developer! Try asking about his <strong>AI expertise</strong>, <strong>core tech stack</strong>, <strong>projects</strong>, or <strong>contact info</strong>.", qid: null },
    { text: "🤔 Interesting question! My knowledge is focused on Ajith's professional portfolio. Would you like me to summarize his <strong>experience</strong>?", qid: "ask_experience" },
    { text: "🤖 I didn't quite catch that. Would you like to see the technologies Ajith uses (like <strong>React, Python, or AWS</strong>)?", qid: "ask_skills" }
];

const positiveWords = ["yes", "yeah", "yep", "sure", "ok", "okay", "please", "absolutely", "definitely", "course"];
const negativeWords = ["no", "nope", "nah", "never", "don't", "stop", "nothing", "none"];

function analyzeSentiment(text) {
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    let posCount = words.filter(w => positiveWords.includes(w)).length;
    let negCount = words.filter(w => negativeWords.includes(w)).length;
    
    if (posCount > negCount) return 'positive';
    if (negCount > posCount) return 'negative';
    return 'neutral';
}

function initAIAssistant() {
    const chatBody = document.getElementById("ai-chat-body");
    const chatInput = document.getElementById("ai-chat-input");
    const sendBtn = document.getElementById("ai-send-btn");
    
    let pendingQuestion = null;

    if (!chatBody || !chatInput || !sendBtn) return;

    window.sendAIPrompt = function(text) {
        appendUserMessage(text);
        processAIResponse(text);
    };

    sendBtn.addEventListener("click", function() {
        const text = chatInput.value.trim();
        if (text) {
            appendUserMessage(text);
            chatInput.value = "";
            processAIResponse(text);
        }
    });

    chatInput.addEventListener("keypress", function(e) {
        if (e.key === "Enter") {
            sendBtn.click();
        }
    });

    function appendUserMessage(text) {
        const userMsgHtml = `
            <div class="chat-msg user">
                <div class="chat-bubble">${escapeHtml(text)}</div>
            </div>
        `;
        chatBody.insertAdjacentHTML("beforeend", userMsgHtml);
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    function processAIResponse(query) {
        // Show typing indicator
        const typingId = "typing-" + Date.now();
        const typingHtml = `
            <div class="chat-msg bot" id="${typingId}">
                <div class="chat-avatar"><i class="fas fa-robot"></i></div>
                <div class="chat-bubble text-muted"><i class="fas fa-ellipsis-h fa-spin"></i> AI is thinking...</div>
            </div>
        `;
        chatBody.insertAdjacentHTML("beforeend", typingHtml);
        chatBody.scrollTop = chatBody.scrollHeight;

        setTimeout(() => {
            const typingEl = document.getElementById(typingId);
            if (typingEl) typingEl.remove();

            const queryLower = query.toLowerCase();
            const words = queryLower.match(/\b\w+\b/g) || [];
            
            let matchedAnswer = null;
            let nextPendingQuestion = null;

            // 1. Check pending context
            if (pendingQuestion) {
                const sentiment = analyzeSentiment(queryLower);
                
                if (sentiment === 'positive') {
                    if (pendingQuestion === 'ask_experience') {
                        matchedAnswer = aiKnowledgeBase.find(item => item.id === 'experience').answer;
                    } else if (pendingQuestion === 'ask_skills') {
                        matchedAnswer = aiKnowledgeBase.find(item => item.id === 'skills').answer;
                    } else if (pendingQuestion === 'ask_contact') {
                        matchedAnswer = aiKnowledgeBase.find(item => item.id === 'contact').answer;
                    } else if (pendingQuestion === 'ask_projects_or_experience') {
                        // If they just say "yes" to an "or" question, default to projects
                        matchedAnswer = aiKnowledgeBase.find(item => item.id === 'projects').answer;
                    }
                } else if (sentiment === 'negative') {
                    matchedAnswer = "No problem! Let me know if there's anything else you'd like to ask.";
                } else {
                    // If neutral, they might have answered an "or" question directly
                    if (pendingQuestion === 'ask_projects_or_experience') {
                        if (queryLower.includes('project')) {
                            matchedAnswer = aiKnowledgeBase.find(item => item.id === 'projects').answer;
                        } else if (queryLower.includes('experience')) {
                            matchedAnswer = aiKnowledgeBase.find(item => item.id === 'experience').answer;
                        }
                    }
                }
                // Reset context after handling
                pendingQuestion = null;
            }

            // 2. If no context match, search knowledge base
            if (!matchedAnswer) {
                let bestMatch = null;
                let highestScore = 0;

                for (const item of aiKnowledgeBase) {
                    let score = 0;
                    
                    // Exact phrase match gives a high score
                    for (const kw of item.keywords) {
                        if (queryLower.includes(kw)) {
                            score += 3; 
                        }
                    }
                    
                    // Word by word matching for fuzzy-ish logic
                    for (const word of words) {
                        if (item.keywords.includes(word)) {
                            score += 1;
                        }
                    }

                    if (score > highestScore && score > 0) {
                        highestScore = score;
                        bestMatch = item;
                    }
                }

                if (bestMatch) {
                    matchedAnswer = bestMatch.answer;
                    nextPendingQuestion = bestMatch.qid || null;
                }
            }

            // 3. Fallback
            if (!matchedAnswer) {
                const fallback = fallbackAnswers[Math.floor(Math.random() * fallbackAnswers.length)];
                matchedAnswer = fallback.text;
                nextPendingQuestion = fallback.qid || null;
            }
            
            pendingQuestion = nextPendingQuestion;

            const botMsgHtml = `
                <div class="chat-msg bot">
                    <div class="chat-avatar"><i class="fas fa-robot"></i></div>
                    <div class="chat-bubble">${matchedAnswer}</div>
                </div>
            `;
            chatBody.insertAdjacentHTML("beforeend", botMsgHtml);
            chatBody.scrollTop = chatBody.scrollHeight;
        }, 600 + Math.random() * 400); // randomize thinking time slightly
    }
}

function escapeHtml(text) {
    const div = document.createElement("div");
    div.innerText = text;
    return div.innerHTML;
}
