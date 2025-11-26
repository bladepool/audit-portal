export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sort = searchParams.get('sort');
    
    // Get backend API URL from environment
    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:5000';
    const apiUrl = `${backendUrl}/api/projects${sort ? `?sort=${sort}` : ''}`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to fetch projects' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in projects API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
