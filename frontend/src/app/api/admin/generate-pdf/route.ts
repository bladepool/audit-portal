import { NextResponse } from 'next/server';

/**
 * PDF Generation API Route
 * 
 * This is now a client-side generation endpoint.
 * The actual PDF generation happens in the browser using jsPDF.
 * This endpoint is used for uploading to GitHub.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { projectId, pdfBlob, uploadToGitHub } = body;
    
    if (!projectId) {
      return NextResponse.json({
        success: false,
        error: 'Project ID is required',
      }, { status: 400 });
    }
    
    // If uploading to GitHub, proxy to backend
    if (uploadToGitHub && pdfBlob) {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 
                         process.env.BACKEND_API_URL || 
                         'http://localhost:5000';
      
      try {
        const response = await fetch(`${backendUrl}/api/admin/upload-pdf`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            projectId,
            pdfBlob,
          }),
        });
        
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
      } catch (error) {
        return NextResponse.json({
          success: false,
          error: 'Failed to upload to GitHub',
          message: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 500 });
      }
    }
    
    // PDF generation happens client-side
    return NextResponse.json({
      success: true,
      message: 'PDF generated successfully (client-side)',
      clientSideGeneration: true,
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'API error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
