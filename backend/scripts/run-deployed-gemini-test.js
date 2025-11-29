#!/usr/bin/env node
/**
 * Simple helper to call deployed /api/debug/gemini-test endpoint.
 * Usage (PowerShell):
 *   $env:DEPLOY_URL='https://your-deploy-url'; $env:ADMIN_TOKEN='token'; node backend/scripts/run-deployed-gemini-test.js
 * Or pass as args: node backend/scripts/run-deployed-gemini-test.js https://your-deploy-url your_admin_token
 */
const fs = require('fs');
const path = require('path');
const axios = require('axios');

async function main() {
  const argv = process.argv.slice(2);
  let baseUrl = process.env.DEPLOY_URL || argv[0];
  let adminToken = process.env.ADMIN_TOKEN || argv[1];

  if (!baseUrl || !adminToken) {
    console.error('Usage: set DEPLOY_URL and ADMIN_TOKEN env vars, or pass them as args.');
    console.error('Example: DEPLOY_URL=https://your-app.up.railway.app ADMIN_TOKEN=xxx node run-deployed-gemini-test.js');
    process.exit(2);
  }

  const url = `${baseUrl.replace(/\/$/, '')}/api/debug/gemini-test`;
  const body = { prompt: 'Short test: reply with a friendly greeting and signature' };
  const headers = { 'x-admin-token': adminToken };

  try {
    console.log('Calling', url);
    const res = await axios.post(url, body, { headers, timeout: 20000 });
    const out = res.data;
    const outFile = path.join(__dirname, '..', 'logs', 'deployed-gemini-response.json');
    await fs.promises.mkdir(path.dirname(outFile), { recursive: true });
    await fs.promises.writeFile(outFile, JSON.stringify(out, null, 2));
    console.log('Saved response to', outFile);
    console.log('Response summary:');
    console.log(JSON.stringify({ ai: out.ai ? out.ai.slice(0, 500) : null, logsCount: (out.logs || []).length }, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Request failed:', err?.response?.status, err?.response?.data || err.message || err);
    process.exit(3);
  }
}

main();
