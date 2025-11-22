import { NextResponse } from 'next/server';

/**
 * PDF Generation API Route
 * 
 * Note: PDF generation requires local environment with access to offline pdf.js
 * This feature is intentionally disabled in production deployments.
 */
export async function POST(request: Request) {
  // Check if we're in production
  const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
  
  if (isProd) {
    return NextResponse.json({
      success: false,
      error: 'PDF generation is only available in local development environment',
      message: 'PDF generation requires local file system access and offline pdf.js. PDFs should be generated locally and uploaded to GitHub.',
      available: false
    }, { status: 503 });
  }
  
  // In development, proxy to backend
  try {
    const body = await request.json();
    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:5000';
    
    const response = await fetch(`${backendUrl}/api/admin/generate-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to connect to backend',
      message: error instanceof Error ? error.message : 'Unknown error',
      available: false
    }, { status: 500 });
  }
}
