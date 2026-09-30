/**
 * AstroBot - Cosmic Space AI Chatbot Engine
 * Frontend Controller with Starfield Canvas, Audio Synthesizer, Markdown Renderer & Chat Pipeline.
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const chatMessages = document.getElementById('chat-messages');
    const chatForm = document.getElementById('chat-form');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const charCounter = document.getElementById('char-counter');
    const typingIndicator = document.getElementById('typing-indicator');
    const scrollBottomBtn = document.getElementById('scroll-bottom-btn');
    const clearChatBtn = document.getElementById('clear-chat-nav-btn');
    const exportChatBtn = document.getElementById('export-chat-btn');
    const soundToggleBtn = document.getElementById('sound-toggle-btn');
    const soundIcon = document.getElementById('sound-icon');
    const voiceBtn = document.getElementById('voice-btn');
    const voiceIcon = document.getElementById('voice-icon');
    const toast = document.getElementById('toast-notification');
    const promptChips = document.querySelectorAll('.chip-btn');
    const welcomeTime = document.getElementById('welcome-time');

    // --- State Variables ---
    let soundEnabled = localStorage.getItem('astro_sound_enabled') !== 'false';
    let conversationHistory = [];
    let isTransmitting = false;
    let recognition = null;
    let isRecording = false;

    // Set current time for welcome message
    if (welcomeTime) {
        welcomeTime.textContent = formatTimestamp(new Date());
    }

    // Configure marked.js options
    if (window.marked) {
        marked.setOptions({
            breaks: true,
            gfm: true,
            highlight: function (code, lang) {
                if (window.hljs) {
                    const validLang = hljs.getLanguage(lang) ? lang : 'plaintext';
                    return hljs.highlight(code, { language: validLang }).value;
                }
                return code;
            }
        });
    }

    // =========================================================================
    // 1. Interactive Cosmic Starfield Canvas Engine
    // =========================================================================
    const canvas = document.getElementById('starfield-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let stars = [];
        let meteors = [];
        const STAR_COUNT = 160;
        let width = (canvas.width = window.innerWidth);
        let height = (canvas.height = window.innerHeight);

        let mouseX = width / 2;
        let mouseY = height / 2;

        window.addEventListener('resize', () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
            initStars();
        });

        window.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });

        class Star {
            constructor() {
                this.reset();
            }

            reset() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.size = Math.random() * 1.8 + 0.3;
                this.baseAlpha = Math.random() * 0.7 + 0.3;
                this.alpha = this.baseAlpha;
                this.twinkleSpeed = Math.random() * 0.02 + 0.005;
                this.twinkleDir = Math.random() > 0.5 ? 1 : -1;
                const colors = ['#ffffff', '#38bdf8', '#00f2fe', '#ffd166', '#c084fc'];
                this.color = colors[Math.floor(Math.random() * colors.length)];
            }

            update() {
                this.alpha += this.twinkleSpeed * this.twinkleDir;
                if (this.alpha >= 1) {
                    this.alpha = 1;
                    this.twinkleDir = -1;
                } else if (this.alpha <= 0.2) {
                    this.alpha = 0.2;
                    this.twinkleDir = 1;
                }
            }

            draw() {
                const offsetX = (mouseX - width / 2) * (this.size * 0.008);
                const offsetY = (mouseY - height / 2) * (this.size * 0.008);

                ctx.save();
                ctx.globalAlpha = this.alpha;
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x + offsetX, this.y + offsetY, this.size, 0, Math.PI * 2);
                ctx.fill();

                if (this.size > 1.4) {
                    ctx.shadowBlur = 8;
                    ctx.shadowColor = this.color;
                    ctx.fill();
                }
                ctx.restore();
            }
        }

        class Meteor {
            constructor() {
                this.reset();
            }

            reset() {
                this.x = Math.random() * width * 1.2 - width * 0.2;
                this.y = Math.random() * (height * 0.4);
                this.length = Math.random() * 80 + 50;
                this.speed = Math.random() * 10 + 12;
                this.angle = Math.PI / 4 + (Math.random() * 0.2 - 0.1);
                this.alpha = 1;
                this.active = true;
            }

            update() {
                this.x += Math.cos(this.angle) * this.speed;
                this.y += Math.sin(this.angle) * this.speed;
                this.alpha -= 0.015;
                if (this.alpha <= 0 || this.x > width + 100 || this.y > height + 100) {
                    this.active = false;
                }
            }

            draw() {
                if (!this.active) return;
                ctx.save();
                ctx.globalAlpha = this.alpha;
                const endX = this.x - Math.cos(this.angle) * this.length;
                const endY = this.y - Math.sin(this.angle) * this.length;

                const grad = ctx.createLinearGradient(this.x, this.y, endX, endY);
                grad.addColorStop(0, '#ffffff');
                grad.addColorStop(0.3, '#38bdf8');
                grad.addColorStop(1, 'rgba(56, 189, 248, 0)');

                ctx.strokeStyle = grad;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(this.x, this.y);
                ctx.lineTo(endX, endY);
                ctx.stroke();
                ctx.restore();
            }
        }

        function initStars() {
            stars = [];
            for (let i = 0; i < STAR_COUNT; i++) {
                stars.push(new Star());
            }
        }

        function animateStarfield() {
            ctx.clearRect(0, 0, width, height);

            stars.forEach((star) => {
                star.update();
                star.draw();
            });

            if (Math.random() < 0.008 && meteors.length < 3) {
                meteors.push(new Meteor());
            }

            meteors = meteors.filter((m) => m.active);
            meteors.forEach((meteor) => {
                meteor.update();
                meteor.draw();
            });

            requestAnimationFrame(animateStarfield);
        }

        initStars();
        animateStarfield();
    }

    // =========================================================================
    // 2. Procedural Web Audio Synthesizer
    // =========================================================================
    let audioCtx = null;

    function getAudioContext() {
        if (!audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                audioCtx = new AudioContext();
            }
        }
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        return audioCtx;
    }

    function playCosmicTone(type) {
        if (!soundEnabled) return;
        try {
            const ctx = getAudioContext();
            if (!ctx) return;

            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(ctx.destination);

            if (type === 'transmit') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(440, now);
                osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
                gain.gain.setValueAtTime(0.08, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
                osc.start(now);
                osc.stop(now + 0.15);
            } else if (type === 'receive') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(784, now);
                osc.frequency.exponentialRampToValueAtTime(1046, now + 0.18);
                gain.gain.setValueAtTime(0.09, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
                osc.start(now);
                osc.stop(now + 0.25);
            } else if (type === 'click') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(1200, now);
                gain.gain.setValueAtTime(0.04, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
                osc.start(now);
                osc.stop(now + 0.05);
            } else if (type === 'clear') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(400, now);
                osc.frequency.exponentialRampToValueAtTime(100, now + 0.2);
                gain.gain.setValueAtTime(0.07, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
                osc.start(now);
                osc.stop(now + 0.22);
            }
        } catch (e) {
            console.warn('Audio synthesis warning:', e);
        }
    }

    function updateSoundIcon() {
        if (soundEnabled) {
            soundIcon.className = 'fa-solid fa-volume-high';
            soundToggleBtn.querySelector('.btn-tooltip').textContent = 'Sound: On';
        } else {
            soundIcon.className = 'fa-solid fa-volume-xmark';
            soundToggleBtn.querySelector('.btn-tooltip').textContent = 'Sound: Off';
        }
    }
    updateSoundIcon();

    soundToggleBtn.addEventListener('click', () => {
        soundEnabled = !soundEnabled;
        localStorage.setItem('astro_sound_enabled', soundEnabled);
        updateSoundIcon();
        if (soundEnabled) {
            playCosmicTone('click');
            showToast('Audio feedback activated', 'success');
        } else {
            showToast('Audio feedback muted', 'info');
        }
    });

    // =========================================================================
    // 3. UI Helpers
    // =========================================================================
    function formatTimestamp(date) {
        let hours = date.getHours();
        let minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        minutes = minutes < 10 ? '0' + minutes : minutes;
        return `${hours}:${minutes} ${ampm}`;
    }

    function showToast(message, type = 'info') {
        const toastMsg = document.getElementById('toast-message');
        const toastIcon = document.getElementById('toast-icon');

        toastMsg.textContent = message;
        toast.className = 'toast';

        if (type === 'error') {
            toast.classList.add('toast-error');
            toastIcon.className = 'fa-solid fa-circle-exclamation';
        } else if (type === 'success') {
            toast.classList.add('toast-success');
            toastIcon.className = 'fa-solid fa-circle-check';
        } else {
            toastIcon.className = 'fa-solid fa-circle-info';
        }

        toast.classList.remove('hidden');

        setTimeout(() => {
            toast.classList.add('hidden');
        }, 3200);
    }

    function scrollToBottom(smooth = true) {
        chatMessages.scrollTo({
            top: chatMessages.scrollHeight,
            behavior: smooth ? 'smooth' : 'auto'
        });
    }

    chatMessages.addEventListener('scroll', () => {
        const isNearBottom =
            chatMessages.scrollHeight - chatMessages.scrollTop - chatMessages.clientHeight < 120;
        if (isNearBottom) {
            scrollBottomBtn.classList.add('hidden');
        } else {
            scrollBottomBtn.classList.remove('hidden');
        }
    });

    scrollBottomBtn.addEventListener('click', () => {
        playCosmicTone('click');
        scrollToBottom(true);
    });

    function handleTextareaInput() {
        userInput.style.height = 'auto';
        userInput.style.height = Math.min(userInput.scrollHeight, 140) + 'px';

        const len = userInput.value.length;
        charCounter.textContent = `${len}/4000`;
        sendBtn.disabled = len === 0 || isTransmitting;
    }

    userInput.addEventListener('input', handleTextareaInput);

    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!sendBtn.disabled && !isTransmitting) {
                chatForm.dispatchEvent(new Event('submit'));
            }
        }
    });

    // =========================================================================
    // 4. Message Rendering Pipeline
    // =========================================================================
    function appendUserMessage(text, timeStr) {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'message user-message';
        msgDiv.innerHTML = `
            <div class="message-avatar user-avatar">
                <i class="fa-solid fa-user-astronaut"></i>
            </div>
            <div class="message-body">
                <div class="message-meta">
                    <span class="sender-name">Commander (You)</span>
                    <span class="message-time">${timeStr}</span>
                </div>
                <div class="message-content">
                    ${escapeHTML(text).replace(/\n/g, '<br>')}
                </div>
            </div>
        `;
        chatMessages.appendChild(msgDiv);
        scrollToBottom(true);
    }

    function appendBotMessage(text, timeStr, modelUsed = 'OpenRouter Space AI') {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'message bot-message';

        const parsedContent = window.marked ? marked.parse(text) : escapeHTML(text);

        msgDiv.innerHTML = `
            <div class="message-avatar bot-avatar">
                <div class="avatar-glow"></div>
                <i class="fa-solid fa-robot"></i>
            </div>
            <div class="message-body">
                <div class="message-meta">
                    <span class="sender-name">AstroBot AI</span>
                    <span class="badge-role">Astrophysicist</span>
                    <span class="message-time">${timeStr}</span>
                </div>
                <div class="message-content markdown-body">
                    ${parsedContent}
                </div>
                <div class="message-actions">
                    <button class="msg-action-btn copy-btn" title="Copy response to clipboard">
                        <i class="fa-regular fa-copy"></i> Copy
                    </button>
                    <button class="msg-action-btn speak-btn" title="Listen to response (TTS)">
                        <i class="fa-solid fa-volume-high"></i> Speak
                    </button>
                </div>
            </div>
        `;

        const copyBtn = msgDiv.querySelector('.copy-btn');
        copyBtn.addEventListener('click', () => copyToClipboard(text, copyBtn));

        const speakBtn = msgDiv.querySelector('.speak-btn');
        speakBtn.addEventListener('click', () => toggleTextToSpeech(text, speakBtn));

        chatMessages.appendChild(msgDiv);

        if (window.hljs) {
            msgDiv.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightElement(block);
            });
        }

        scrollToBottom(true);
    }

    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g, (tag) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag));
    }

    function copyToClipboard(text, btnElement) {
        playCosmicTone('click');
        navigator.clipboard.writeText(text).then(() => {
            btnElement.classList.add('copied');
            btnElement.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
            showToast('Transmission copied to clipboard', 'success');

            setTimeout(() => {
                btnElement.classList.remove('copied');
                btnElement.innerHTML = '<i class="fa-regular fa-copy"></i> Copy';
            }, 2500);
        }).catch(() => {
            showToast('Failed to copy to clipboard', 'error');
        });
    }

    let currentUtterance = null;
    function toggleTextToSpeech(rawText, btnElement) {
        if (!('speechSynthesis' in window)) {
            showToast('Text-to-speech not supported on this browser', 'error');
            return;
        }

        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
            btnElement.innerHTML = '<i class="fa-solid fa-volume-high"></i> Speak';
            return;
        }

        const plainText = rawText.replace(/[#*_`>\[\]]/g, '').trim();

        currentUtterance = new SpeechSynthesisUtterance(plainText);
        currentUtterance.rate = 1.0;
        currentUtterance.pitch = 1.0;

        btnElement.innerHTML = '<i class="fa-solid fa-stop"></i> Stop';

        currentUtterance.onend = () => {
            btnElement.innerHTML = '<i class="fa-solid fa-volume-high"></i> Speak';
        };

        currentUtterance.onerror = () => {
            btnElement.innerHTML = '<i class="fa-solid fa-volume-high"></i> Speak';
        };

        window.speechSynthesis.speak(currentUtterance);
    }

    // =========================================================================
    // 5. Speech-to-Text Voice Recognition
    // =========================================================================
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            isRecording = true;
            voiceBtn.classList.add('recording');
            voiceIcon.className = 'fa-solid fa-microphone-lines';
            showToast('Listening to orbital voice transmission...', 'info');
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            userInput.value = transcript;
            handleTextareaInput();
            showToast('Voice synthesized into query', 'success');
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            showToast(`Voice transmission error: ${event.error}`, 'error');
        };

        recognition.onend = () => {
            isRecording = false;
            voiceBtn.classList.remove('recording');
            voiceIcon.className = 'fa-solid fa-microphone';
        };

        voiceBtn.addEventListener('click', () => {
            playCosmicTone('click');
            if (isRecording) {
                recognition.stop();
            } else {
                recognition.start();
            }
        });
    } else {
        voiceBtn.title = 'Voice input not supported in this browser';
        voiceBtn.style.opacity = '0.4';
        voiceBtn.addEventListener('click', () => {
            showToast('Speech recognition not supported on this browser', 'error');
        });
    }

    // =========================================================================
    // 6. Transmit Message Pipeline (Async Backend POST)
    // =========================================================================
    async function handleSendMessage(messageText) {
        const query = messageText || userInput.value.trim();
        if (!query || isTransmitting) return;

        isTransmitting = true;
        sendBtn.disabled = true;
        const sendTimestamp = formatTimestamp(new Date());

        appendUserMessage(query, sendTimestamp);
        playCosmicTone('transmit');

        userInput.value = '';
        handleTextareaInput();

        typingIndicator.classList.remove('hidden');
        scrollToBottom(true);

        try {
            const response = await fetch('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: query,
                    history: conversationHistory
                })
            });

            const data = await response.json();

            typingIndicator.classList.add('hidden');

            if (data.success && data.response) {
                playCosmicTone('receive');
                const replyTime = data.timestamp || formatTimestamp(new Date());
                appendBotMessage(data.response, replyTime, data.model);

                conversationHistory.push({ role: 'user', content: query });
                conversationHistory.push({ role: 'assistant', content: data.response });

                if (conversationHistory.length > 10) {
                    conversationHistory = conversationHistory.slice(-10);
                }
            } else {
                playCosmicTone('clear');
                const errorMsg = data.error || 'Deep space telemetry failure. Communication link dropped.';
                appendBotMessage(`⚠️ **Transmission Interrupted:** ${errorMsg}`, formatTimestamp(new Date()));
                showToast(errorMsg, 'error');
            }
        } catch (err) {
            typingIndicator.classList.add('hidden');
            console.error('Fetch error:', err);
            appendBotMessage(
                '🛰️ **Cosmic Anomaly:** Unable to reach Mission Control server. Please check your backend connection.',
                formatTimestamp(new Date())
            );
            showToast('Cosmic connection error', 'error');
        } finally {
            isTransmitting = false;
            sendBtn.disabled = userInput.value.trim().length === 0;
            userInput.focus();
        }
    }

    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        handleSendMessage();
    });

    promptChips.forEach((chip) => {
        chip.addEventListener('click', () => {
            const prompt = chip.getAttribute('data-prompt');
            if (prompt && !isTransmitting) {
                playCosmicTone('click');
                userInput.value = prompt;
                handleTextareaInput();
                handleSendMessage(prompt);
            }
        });
    });

    // =========================================================================
    // 7. Clear Chat & Export Chat Handlers
    // =========================================================================
    clearChatBtn.addEventListener('click', () => {
        playCosmicTone('clear');
        if (confirm('Are you sure you want to purge all orbital communication logs?')) {
            const welcomeMsg = chatMessages.querySelector('.entrance-animation');
            chatMessages.innerHTML = '';
            if (welcomeMsg) {
                chatMessages.appendChild(welcomeMsg);
            }
            conversationHistory = [];
            showToast('Orbital communication log purged', 'info');
        }
    });

    exportChatBtn.addEventListener('click', () => {
        playCosmicTone('click');
        if (conversationHistory.length === 0) {
            showToast('No transmission history to export', 'info');
            return;
        }

        let markdownContent = `# 🌌 AstroBot Cosmic Chat Log\n`;
        markdownContent += `**Generated:** ${new Date().toLocaleString()}\n`;
        markdownContent += `**Domain:** Space, Cosmology & Astrophysics\n\n---\n\n`;

        conversationHistory.forEach((item) => {
            const speaker = item.role === 'user' ? '🧑‍🚀 Commander (You)' : '🤖 AstroBot AI';
            markdownContent += `### ${speaker}\n${item.content}\n\n`;
        });

        const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `AstroBot_Log_${Date.now()}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showToast('Mission log downloaded', 'success');
    });

    userInput.focus();
});
