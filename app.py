"""
AstroBot - Space & Cosmology AI Chatbot Backend
Built with Flask (Async), OpenRouter API, and httpx.
"""

import os
import datetime
import logging
from typing import List, Dict
from flask import Flask, render_template, request, jsonify
import httpx
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Logging configuration
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("AstroBot")

# Initialize Flask app
app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "cosmic-default-key")

# OpenRouter configuration
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "").strip()
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "nvidia/nemotron-3.5-lightning:free")
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

# Space domain system prompt with strict guardrails
SPACE_SYSTEM_PROMPT = """You are AstroBot, an elite AI Astrophysicist, Cosmologist, and Space Exploration Specialist. 
Your mission is to enlighten, inspire, and educate humans about the wonders of the cosmos with scientific accuracy, clarity, and excitement.

### CORE IDENTITY & DOMAIN EXPERTISE:
1. You specialize EXCLUSIVELY in topics related to:
   - Astronomy (Stars, Constellations, Nebulae, Galaxies, Exoplanets, Supernovae)
   - Astrophysics & Cosmology (Big Bang, Black Holes, Dark Matter, Dark Energy, Spacetime Relativity, Cosmic Microwave Background)
   - Planetary Science (Solar System planets, Moons, Asteroids, Comets, Kuiper Belt, Oort Cloud)
   - Space Exploration & Missions (NASA, ESA, ISRO, SpaceX, JAXA, James Webb Space Telescope, Hubble, Voyager, Artemis, Apollo, Mars Rovers)
   - Rocket Science & Space Tech (Orbital Mechanics, Propulsion, Satellites, Space Stations, Spacesuits, Telescopes)
   - Astrobiology & Search for Extraterrestrial Intelligence (SETI, Habitable Zones, Extremophiles)

### STRICT DOMAIN BOUNDARY POLICY:
- If the user asks about an UNRELATED non-space topic (e.g., cooking recipes, stock trading, celebrity gossip, software coding unrelated to space, gardening, political opinions, general life advice, etc.):
  - Politely and warmly decline by stating that you are an AI dedicated solely to Space and Cosmology.
  - Provide a brief, fascinating space analogy or suggest 2-3 exciting space topics they can ask about instead (e.g., "Would you like to know how stars fuse elements, how black holes warp time, or the latest discoveries by the James Webb Space Telescope?").

### RESPONSE GUIDELINES:
- **Tone:** Inspiring, scientifically precise, friendly, approachable, and cosmic in wonder.
- **Formatting:** Use clean Markdown with bold keywords, bullet points, headers (###), and analogies when explaining complex concepts.
- **Depth:** Match the user's level with intuitive analogies while maintaining astronomical accuracy.
"""

# Fallback models in case the primary free model is busy
FALLBACK_MODELS = [
    "nvidia/nemotron-3.5-lightning:free",
    "nvidia/nemotron-3-super-120b-a12b:free",
    "google/gemma-4-31b-it:free",
    "google/gemma-4-26b-a4b-it:free",
    "qwen/qwen3.8-27b:free",
    "liquid/lfm-2.5-2.6b:free",
    "openrouter/auto"
]


@app.route("/")
def index():
    """Renders the main AstroBot Space Chatbot web application."""
    return render_template("index.html")


@app.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint to verify backend status."""
    return jsonify({
        "status": "online",
        "domain": "Space & Cosmology",
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
        "api_configured": bool(OPENROUTER_API_KEY)
    })


@app.route("/chat", methods=["POST"])
async def chat():
    """
    Asynchronous POST endpoint to process user chat messages via OpenRouter API.
    """
    try:
        data = request.get_json(silent=True)
        if not data:
            return jsonify({
                "success": False,
                "error": "Invalid request payload. JSON body expected."
            }), 400

        user_message = data.get("message", "").strip()
        if not user_message:
            return jsonify({
                "success": False,
                "error": "The message field cannot be empty."
            }), 400

        if len(user_message) > 4000:
            return jsonify({
                "success": False,
                "error": "Message length exceeds maximum limit of 4000 characters."
            }), 400

        if not OPENROUTER_API_KEY:
            logger.error("OpenRouter API key is missing from environment variables.")
            return jsonify({
                "success": False,
                "error": "OpenRouter API key is not configured. Please check your .env file."
            }), 500

        # Build conversation history
        raw_history: List[Dict[str, str]] = data.get("history", [])
        messages = [{"role": "system", "content": SPACE_SYSTEM_PROMPT}]

        for turn in raw_history[-10:]:
            role = turn.get("role")
            content = turn.get("content", "").strip()
            if role in ["user", "assistant"] and content:
                messages.append({"role": role, "content": content})

        if not messages or messages[-1]["content"] != user_message:
            messages.append({"role": "user", "content": user_message})

        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://astro-space-bot.local",
            "X-Title": "AstroBot Space AI"
        }

        models_to_try = [OPENROUTER_MODEL]
        for m in FALLBACK_MODELS:
            if m not in models_to_try:
                models_to_try.append(m)

        assistant_reply = None
        model_used = None
        last_error = None

        async with httpx.AsyncClient(timeout=45.0) as client:
            for model_name in models_to_try:
                payload = {
                    "model": model_name,
                    "messages": messages,
                    "temperature": 0.7,
                    "max_tokens": 1200
                }

                try:
                    logger.info(f"Dispatching query to OpenRouter using model: {model_name}")
                    response = await client.post(
                        OPENROUTER_API_URL,
                        headers=headers,
                        json=payload
                    )

                    if response.status_code == 200:
                        res_json = response.json()
                        choices = res_json.get("choices", [])
                        if choices and len(choices) > 0:
                            assistant_reply = choices[0].get("message", {}).get("content", "").strip()
                            model_used = model_name
                            break
                    elif response.status_code == 429:
                        logger.warning(f"Rate limited on model {model_name}, trying next model...")
                        last_error = "Rate limit reached."
                        continue
                    else:
                        logger.warning(f"Model {model_name} returned status {response.status_code}")
                        last_error = f"API error ({response.status_code})"
                        continue

                except httpx.TimeoutException:
                    logger.warning(f"Timeout on model {model_name}, trying next model...")
                    last_error = "Request timed out."
                    continue
                except httpx.RequestError as exc:
                    logger.error(f"Network error on model {model_name}: {exc}")
                    last_error = f"Network connection error: {str(exc)}"
                    continue

        if not assistant_reply:
            logger.error(f"All model attempts exhausted. Last error: {last_error}")
            return jsonify({
                "success": False,
                "error": "Deep space communication interrupted. Please try again in a moment."
            }), 502

        now = datetime.datetime.now()
        timestamp_str = now.strftime("%I:%M %p")

        return jsonify({
            "success": True,
            "response": assistant_reply,
            "model": model_used,
            "timestamp": timestamp_str
        })

    except Exception as e:
        logger.exception(f"Unexpected server error during /chat request: {e}")
        return jsonify({
            "success": False,
            "error": "Cosmic telemetry anomaly: An unexpected server error occurred."
        }), 500


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    debug_mode = os.getenv("FLASK_ENV") == "development"
    print("\n=======================================================")
    print(" [*] ASTROBOT COSMIC AI SERVER INITIALIZED")
    print(" [*] Domain: Space, Cosmology & Astrophysics")
    print(f" [*] Local URL: http://127.0.0.1:{port}")
    print("=======================================================\n")
    app.run(host="0.0.0.0", port=port, debug=debug_mode)
