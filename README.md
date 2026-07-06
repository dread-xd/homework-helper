# Homework Helper

> **⚠ Proof of Concept — For educational purposes only.**

A Chrome extension that auto-completes worksheet-style forms and assignments on any webpage. Supports two modes:

- **Canned mode** — Fills fields with plausible-looking placeholder data based on label keyword matching (no external dependencies).
- **Smart mode (AI)** — Scrapes all form fields, sends them to an LLM (OpenAI-compatible API), and fills in real answers based on the questions.

## Features

- **Two fill modes** — Switch between canned placeholders and AI-generated answers.
- **Smart field detection** — Reads labels, placeholders, and names to understand each field's context.
- **Supports all input types** — Text, email, tel, number, date, textarea, select, checkbox, radio.
- **Revert** — Takes a snapshot before filling and restores the original state.
- **Stats** — Shows how many fields were filled/skipped.

## Installation

1. Clone this repo
2. Open `chrome://extensions` in Chrome
3. Enable **Developer mode** (top-right toggle)
4. Click **Load unpacked** and select the `homework-helper` folder
5. Click the extension icon in the toolbar to open the popup

## Usage

1. Navigate to any page with a form or worksheet
2. Click the **Homework Helper** icon
3. **Canned mode** (default) — Click "Auto-Fill This Page" for placeholder data
4. **Smart mode** — Toggle to "Smart (AI)", configure your API key in settings, then click "Auto-Fill This Page"
5. Click **Revert Fill** to undo

## Smart Mode (AI) Setup

### Option 1: Ollama (local, free, no API key)

1. Download & install [Ollama](https://ollama.com)
2. Run `ollama pull qwen2.5:1.5b` (or any model you want)
3. Keep Ollama running in the background
4. The extension defaults already point to `http://localhost:11434/v1/chat/completions`
5. Leave **API Key** blank in Settings — **Smart (AI)** mode will just work

### Option 2: Cloud providers (requires API key)

Supports any OpenAI-compatible API:

| Provider | Endpoint | Model | Free tier? |
|---|---|---|---|
| Groq | `https://api.groq.com/openai/v1/chat/completions` | `mixtral-8x7b-32768` | Yes (rate-limited) |
| Google Gemini | `https://generativelanguage.googleapis.com/v1beta/openai/` | `gemini-2.0-flash` | Yes |
| OpenAI | `https://api.openai.com/v1/chat/completions` | `gpt-4o-mini` | No |
| Anthropic | `https://api.anthropic.com/v1/...` | `claude-3-haiku` | No |

> **🔒 Your API key is safe.** It's stored in `chrome.storage.local` (your browser only), never committed to the repo, and never sent anywhere except directly to the API provider you configure.

1. Click **Settings** in the popup
2. Enter your API key, endpoint, and model
3. Toggle to **Smart (AI)** mode and click **Auto-Fill This Page**

## How it works

### Canned Mode
The content script (`content.js`) scans the DOM for form elements, reads their labels, and matches them against a keyword dictionary to pick random placeholder values.

### Smart Mode (AI)
1. The content script scrapes all fillable fields with their labels, types, and available options
2. Sends the field descriptions to the background service worker (`background.js`)
3. The background worker calls the configured LLM API with a prompt asking for correct answers
4. The AI returns a JSON map of selector → answer
5. The content script applies those answers to the matching fields

## Project Structure

```
homework-helper/
├── manifest.json        # Chrome extension manifest (MV3)
├── background.js        # Service worker — handles AI API calls
├── content.js           # Content script — scrapes fields, fills forms
├── popup.html           # Popup UI with mode toggle & settings
├── popup.js             # Popup logic & settings management
├── test.html            # Local test page for trying the extension
├── icons/               # Extension icons (16, 48, 128px)
└── README.md
```

## Disclaimer

This project is a **proof of concept** created for educational purposes. Do not use it to cheat on actual assignments or violate academic integrity policies.
