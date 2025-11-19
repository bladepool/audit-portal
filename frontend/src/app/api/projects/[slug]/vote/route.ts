import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const body = await request.json();
    const { slug } = params;

    // Get backend API URL from environment (should be the full base URL)
    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:5000';
    const apiUrl = `${backendUrl}/api/projects/${slug}/vote`;

    console.log('Proxying vote request to:', apiUrl);

    // Forward the request to the backend
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to submit vote' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in vote API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
