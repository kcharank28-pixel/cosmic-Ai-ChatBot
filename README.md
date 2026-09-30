# 🌌 AstroBot — Next-Generation Space & Cosmology AI Chatbot

[![Python 3.10+](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![Flask 3.0](https://img.shields.io/badge/Flask-3.0%2B-lightgrey.svg)](https://flask.palletsprojects.com/)
[![OpenRouter API](https://img.shields.io/badge/OpenRouter-AI-6366f1.svg)](https://openrouter.ai/)
[![Domain](https://img.shields.io/badge/Domain-Space%20%26%20Cosmology-00f2fe.svg)](#)

**AstroBot** is a production-grade, full-stack AI web application specialized exclusively in **Astronomy, Astrophysics, Cosmology, Planetary Science, and Space Exploration**. Powered by Flask (with asynchronous request handling via `httpx`) and the **OpenRouter API**, it provides deep-space intelligence with a futuristic cosmic UI/UX.

---

## 🚀 Key Features

### 🧠 Backend (Python + Flask + OpenRouter)
- **Async Execution:** Asynchronous POST `/chat` pipeline using `httpx.AsyncClient` with non-blocking I/O.
- **Space Domain Guardrails:** System prompt tailored for astrophysics, cosmology, and planetary science. Non-space queries are politely redirected to astronomical topics.
- **Multi-Model Fallback:** Automatic failover across reliable OpenRouter models (`nvidia/nemotron-3.5-lightning:free`, `google/gemma-4-31b-it:free`, `qwen/qwen3.8-27b:free`, `openrouter/auto`) in case of rate limits or timeouts.
- **Multi-Turn Context:** Retains recent conversation history for rich context-aware dialogue.
- **Security & Config:** API keys stored securely in `.env`.

### 🎨 Frontend (Cosmic Glassmorphism UI)
- **Interactive Cosmic Canvas:** Procedural starfield particle system with twinkling stars, shooting meteors, and mouse parallax.
- **Zero-Dependency Audio Synthesizer:** Futuristic Web Audio API sound effects (chirps, pings, warp sounds, clicks) with mute toggle.
- **Markdown & Code Highlighting:** Instant rendering of bold text, bullet points, blockquotes, and highlighted code snippets via `marked.js` and `highlight.js`.
- **Text-to-Speech (TTS):** Have AstroBot read space insights aloud using the Web Speech Synthesis API.
- **Voice Input (STT):** Speech-to-text recognition via Web Speech API.
- **Quick-Starter Chips:** Clickable suggested prompts for James Webb discoveries, black holes, Artemis missions, and alien oceans.
- **Export & Clear:** One-click download of mission chat logs as formatted Markdown (`.md`), with chat purge safeguards.
- **Fully Responsive:** Smooth experience across mobile, tablet, and ultra-wide displays.

---

## 📂 Project Structure

```
d:/SpaceChatBot/
│── app.py                 # Flask server with async /chat endpoint & OpenRouter integration
│── templates/
│     └── index.html       # Modern cosmic HTML5 interface & layout
│── static/
│     ├── style.css        # Space-themed glassmorphism, animations & responsive styles
│     └── script.js        # Starfield canvas, audio synth, TTS/STT, and chat controller
│── .env                   # Environment variables (OpenRouter API key & config)
│── requirements.txt       # Python dependencies
│── package.json           # NPM scripts configuration
└── README.md              # Documentation & setup guide
```

---

## ⚡ Quick Start Guide

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Run the Application
```bash
python app.py
```
*(Or run `npm start`)*

### 3. Access in Browser
Open: **[http://127.0.0.1:5000](http://127.0.0.1:5000)**
