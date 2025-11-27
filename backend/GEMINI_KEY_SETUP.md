Gemini API Key Setup

This project supports storing the Gemini API key in the `Settings` collection (preferred) or as an environment variable (fallback).

Recommended: store in Settings so you can update it from the admin interface or via the API without redeploying.

1) Store key via HTTP API

- PUT /api/settings/gemini_api_key
  - Body: { "value": "<YOUR_GEMINI_API_KEY>", "description": "Gemini API key for AI generation" }
  - Example (curl):

    curl -X PUT "${BASE_URL}/api/settings/gemini_api_key" \
      -H 'Content-Type: application/json' \
      -d '{"value":"YOUR_KEY_HERE","description":"Gemini key"}'

- You can also update multiple settings using POST /api/settings/bulk.

2) Test the key

- POST /api/settings/test/gemini
  - Body: { "apiKey": "<YOUR_GEMINI_API_KEY>" }
  - Example (curl):

    curl -X POST "${BASE_URL}/api/settings/test/gemini" \
      -H 'Content-Type: application/json' \
      -d '{"apiKey":"YOUR_KEY_HERE"}'

The endpoint will attempt a minimal `generateText` request and return JSON indicating success or failure.

3) Environment variable fallback (not recommended)

- If `gemini_api_key` is not present in Settings, the bot will fall back to environment variables in this order:
  - `GEMINI_API_KEY`
  - `NEXT_PUBLIC_GEMINI_API_KEY`

4) Security

- Do not commit API keys to the repository. Use Settings (DB) or your deployment platform's secret store.
- If you accidentally exposed a key (e.g., pasted it in chat), rotate it immediately.

5) Notes

- After updating `gemini_api_key` via the Settings API, the server triggers a settings reload for the Telegram helper. No redeploy required.
