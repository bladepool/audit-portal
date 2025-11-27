import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');

    // Require client to be authenticated in the admin UI
    if (!authHeader) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const ADMIN_TOKEN = process.env.TELEGRAM_ADMIN_TOKEN;
    if (!ADMIN_TOKEN) {
      return NextResponse.json({ success: false, error: 'Server admin token not configured' }, { status: 500 });
    }

    const response = await fetch(`${BACKEND_URL}/api/telegram/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ success: false, error: data.error || 'Failed to start webhook' }, { status: response.status });
    }

    return NextResponse.json({ success: true, message: data.message || 'Webhook started' });
  } catch (error: any) {
    console.error('Telegram start proxy error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}
