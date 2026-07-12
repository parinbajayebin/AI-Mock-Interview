# How to Get Free & Open-Source API Keys

This guide outlines how to generate API keys for the AI models supported by this platform. 

All keys are stored **exclusively in your browser's local storage (`localStorage`)** and are never saved to our database. They are sent directly to the AI endpoints transiently in-memory during active requests.

---

## 🌟 100% Free Options (Highly Recommended)

### 1. Google AI Studio (Gemini Free Tier)
Google offers a 100% free tier for developers with high limits (up to 15 requests per minute). Perfect for running mock interviews with Google's flagship Gemini models.

* **Supported Models**: `Gemini 1.5 Flash` (default, fast), `Gemini 1.5 Pro` (deep reasoning).
* **Cost**: $0.00 (Fully Free)
* **Setup Instructions**:
  1. Go to **[Google AI Studio](https://aistudio.google.com/)**.
  2. Sign in using any standard Google Account (Gmail).
  3. Click the **"Get API Key"** button in the top-left sidebar.
  4. Click **"Create API Key"**.
  5. Select a Google Cloud project (or create a new default one) and click **"Create API Key in Existing Project"**.
  6. Copy the generated key (it starts with `AIzaSy...`).
  7. Paste it into the **Gemini API Key** field in the settings.

---

### 2. OpenRouter (Access Free Open-Source Models)
OpenRouter aggregates multiple LLM providers and offers a list of **completely free open-source models** (like Meta's Llama 3, Google's Gemma 2, and Mistral).

* **Supported Models**: `Llama 3 8B (Free)`, `Gemma 2 9B (Free)`, `Mistral 7B (Free)`.
* **Cost**: $0.00 (Fully Free)
* **Setup Instructions**:
  1. Go to **[OpenRouter](https://openrouter.ai/)**.
  2. Create a free account or sign in with Google or GitHub.
  3. Go to the **Keys** tab in the dashboard (or navigate to `openrouter.ai/keys`).
  4. Click **"Create Key"**, name it (e.g. "Mock Interview"), and click **"Create"**.
  5. Copy your key (starts with `sk-or-v1-...`).
  6. Paste it into the **OpenRouter API Key** field. Select any of the free open-source models from the settings dropdown.

---

### 3. Groq Developer Console (Ultra-Fast Free Tier)
Groq provides developer keys with free rate limits for high-speed open-source models like Llama 3 and Mixtral.

* **Supported Models**: `Llama-3-8b-8192`, `Llama-3-70b-8192`.
* **Cost**: $0.00 (Free with rate limits)
* **Setup Instructions**:
  1. Go to **[Groq Console](https://console.groq.com/)**.
  2. Sign up or sign in.
  3. Click on the **"API Keys"** section in the left sidebar menu.
  4. Click the **"Create API Key"** button.
  5. Enter a label (e.g., "Mock Platform") and click **"Generate"**.
  6. Copy the key (starts with `gsk_...`).
  7. Paste it into the **Groq API Key** field in the settings.

---

## 💼 Paid / Developer Options

### 4. OpenAI Developer Platform
OpenAI keys require a developer account with a small pre-funded deposit ($5 minimum balance is enough for thousands of mock interviews).

* **Supported Models**: `GPT-4o mini` (highly recommended, cheap), `GPT-4o` (advanced).
* **Cost**: Paid (pay-as-you-go, very low cost per session).
* **Setup Instructions**:
  1. Go to the **[OpenAI Platform](https://platform.openai.com/)**.
  2. Sign up or log in.
  3. Navigate to **"Settings" > "Billing"** and add a minimum credit balance ($5).
  4. In the left navigation bar, click on **"API Keys"**.
  5. Click **"+ Create new secret key"**.
  6. Copy the key (starts with `sk-...`). *Note: Copy it immediately; it will not be displayed again.*
  7. Paste it into the **OpenAI API Key** field.
