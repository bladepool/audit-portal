const axios = require('axios');

async function generateTextViaSdk(prompt, opts = {}) {
  try {
    // Try to use official SDK if available. This code will attempt to require
    // the SDK and call a typical v1beta2 generate API. If the SDK is not
    // available or the call shape differs, fall back to HTTP implementation.
    const genai = require('@google/generative-ai');
    if (!genai) throw new Error('SDK not available');

    // The exact SDK surface may differ depending on package version.
    // Attempt common patterns.
    if (genai?.v1beta2?.TextServiceClient) {
      const { v1beta2 } = genai;
      const client = new v1beta2.TextServiceClient({});
      const model = opts.model || process.env.DEFAULT_GEMINI_MODEL || 'models/text-bison-001';
      const request = {
        model,
        prompt: { text: prompt },
        temperature: opts.temperature || 0.2,
        maxOutputTokens: opts.maxTokens || 512,
      };
      const [response] = await client.generateText(request);
      return response;
    }

    if (typeof genai.generateText === 'function') {
      // Some SDK versions expose a direct generateText method
      const model = opts.model || process.env.DEFAULT_GEMINI_MODEL || 'models/text-bison-001';
      const response = await genai.generateText({ model, prompt, ...opts });
      return response;
    }

    throw new Error('Unsupported SDK surface');
  } catch (err) {
    // Signal to caller that SDK path failed so they can fallback to HTTP.
    throw err;
  }
}

async function generateTextHttp(prompt, opts = {}) {
  const model = opts.model || process.env.DEFAULT_GEMINI_MODEL || 'models/text-bison-001';
  const host = process.env.GENAI_HOST || 'https://generativelanguage.googleapis.com';
  const apiVersion = process.env.GENAI_API_VERSION || 'v1beta2';
  const url = `${host}/${apiVersion}/${model}:generateText`;
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
  const headers = { 'Content-Type': 'application/json' };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  const body = { prompt: { text: prompt }, temperature: opts.temperature || 0.2, maxOutputTokens: opts.maxTokens || 512 };
  // Try header-based auth first
  try {
    const res = await axios.post(url, body, { headers, timeout: 20000 });
    return res.data;
  } catch (err) {
    // Try ?key= fallback
    try {
      const res2 = await axios.post(`${url}?key=${encodeURIComponent(apiKey)}`, body, { timeout: 20000 });
      return res2.data;
    } catch (err2) {
      throw err2 || err;
    }
  }
}

async function generateText(prompt, opts = {}) {
  // Prefer SDK, but fall back to HTTP implementation for robustness.
  try {
    const sdkRes = await generateTextViaSdk(prompt, opts);
    // Normalize SDK response if necessary
    if (sdkRes?.candidates || sdkRes?.output_text || sdkRes?.response) return sdkRes;
    // If SDK returned a complex object, return it directly
    return sdkRes;
  } catch (e) {
    // SDK path failed — fall back
    return await generateTextHttp(prompt, opts);
  }
}

module.exports = { generateText };
