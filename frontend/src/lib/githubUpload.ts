/**
 * GitHub API Service for PDF Upload
 * Uploads generated PDFs to CFG-NINJA/audits repository
 */

const GITHUB_API = 'https://api.github.com';
const GITHUB_OWNER = 'CFG-NINJA';
const GITHUB_REPO = 'audits';
const GITHUB_BRANCH = 'main';

interface GitHubUploadResult {
  success: boolean;
  url?: string;
  rawUrl?: string;
  error?: string;
  message?: string;
}

/**
 * Convert Blob to base64 string
 */
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      // Remove data URL prefix (data:application/pdf;base64,)
      const base64Data = base64.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Get file SHA if it exists (needed for updates)
 */
async function getFileSHA(
  filename: string,
  token: string
): Promise<string | null> {
  try {
    const response = await fetch(
      `${GITHUB_API}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filename}?ref=${GITHUB_BRANCH}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      return data.sha;
    }
    
    return null; // File doesn't exist
  } catch (error) {
    console.error('Error getting file SHA:', error);
    return null;
  }
}

/**
 * Upload PDF to GitHub repository
 */
export async function uploadPDFToGitHub(
  pdfBlob: Blob,
  filename: string,
  token: string,
  commitMessage?: string
): Promise<GitHubUploadResult> {
  try {
    // Ensure filename ends with .pdf
    if (!filename.endsWith('.pdf')) {
      filename += '.pdf';
    }

    // Convert blob to base64
    const base64Content = await blobToBase64(pdfBlob);

    // Check if file already exists and get its SHA
    const existingSHA = await getFileSHA(filename, token);

    // Prepare the request
    const requestBody: any = {
      message: commitMessage || `Upload audit PDF: ${filename}`,
      content: base64Content,
      branch: GITHUB_BRANCH,
    };

    // If file exists, include SHA for update
    if (existingSHA) {
      requestBody.sha = existingSHA;
    }

    // Upload to GitHub
    const response = await fetch(
      `${GITHUB_API}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filename}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'GitHub API error');
    }

    const data = await response.json();

    return {
      success: true,
      url: data.content.html_url,
      rawUrl: `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${filename}`,
      message: existingSHA ? 'PDF updated successfully' : 'PDF uploaded successfully',
    };
  } catch (error) {
    console.error('GitHub upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to upload PDF to GitHub',
    };
  }
}

/**
 * Validate GitHub token
 */
export async function validateGitHubToken(token: string): Promise<boolean> {
  try {
    const response = await fetch(`${GITHUB_API}/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Get GitHub token from environment or localStorage
 */
export function getGitHubToken(): string | null {
  // First check if running server-side with env variable
  if (typeof window === 'undefined') {
    return process.env.GITHUB_TOKEN || null;
  }

  // Client-side: check localStorage
  return localStorage.getItem('github_token') || null;
}

/**
 * Save GitHub token to localStorage
 */
export function saveGitHubToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('github_token', token);
  }
}

/**
 * Remove GitHub token from localStorage
 */
export function removeGitHubToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('github_token');
  }
}
