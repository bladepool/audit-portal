import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/**
 * Publish project to TrustBlock
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Forward request to backend
    const response = await fetch(`${BACKEND_URL}/api/trustblock/publish/${params.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.error || 'Failed to publish to TrustBlock' },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      trustblock_url: data.trustblock_url,
      message: data.message || 'Successfully published to TrustBlock',
    });
  } catch (error: any) {
    console.error('TrustBlock publish error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
