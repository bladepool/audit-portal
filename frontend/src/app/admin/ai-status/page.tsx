"use server";
import React from 'react';

export default async function Page(): Promise<JSX.Element> {
  const adminToken = process.env.ADMIN_TOKEN || '';
  let data: any = { success: false, error: 'fetch not attempted' };

  try {
    // Server-side fetch to the next API route. Use relative path so it targets the running app.
    const res = await fetch('/api/debug/ai-status', {
      method: 'GET',
      headers: { 'x-admin-token': adminToken },
      cache: 'no-store',
    });
    data = await res.json();
  } catch (err) {
    data = { success: false, error: String(err) };
  }

  return (
    <div style={{ padding: 20, fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif' }}>
      <h1>AI Diagnostic</h1>
      <p><strong>Admin token:</strong> {adminToken ? 'Present (server-side)' : 'Not set'}</p>
      <p>This page calls <code>/api/debug/ai-status</code> server-side using the server's admin token and shows the JSON response.</p>
      <section style={{ marginTop: 12 }}>
        <h2>Result</h2>
        <pre style={{ background: '#f6f8fa', padding: 12, borderRadius: 6, overflowX: 'auto' }}>{JSON.stringify(data, null, 2)}</pre>
      </section>
    </div>
  );
}
