/**
 * GitHub API Service for PDF Upload
 * Uploads generated PDFs to GitHub repository (settings configurable)
 */

import { settingsAPI } from './api';

const GITHUB_API = 'https://api.github.com';

// Default values (can be overridden by settings)
let GITHUB_OWNER = 'CFG-NINJA';
let GITHUB_REPO = 'audits';
let GITHUB_BRANCH = 'main';

/**
 * Load GitHub settings from backend
 */
async function loadGitHubSettings(): Promise<{owner: string; repo: string; branch: string; token: string | null}> {
  try {
    const response = await settingsAPI.getAll();
    const settings = response.data;
    
    return {
      owner: settings.github_repo_owner?.value || GITHUB_OWNER,
      repo: settings.github_repo_name?.value || GITHUB_REPO,
      branch: settings.github_repo_branch?.value || GITHUB_BRANCH,
      token: settings.github_token?.value || null
    };
  } catch (error) {
    console.error('Error loading GitHub settings:', error);
    return {
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      branch: GITHUB_BRANCH,
      token: null
    };
  }
}

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
  token: string,
  owner: string,
  repo: string,
  branch: string
): Promise<string | null> {
  try {
    const response = await fetch(
      `${GITHUB_API}/repos/${owner}/${repo}/contents/${filename}?ref=${branch}`,
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
 * Token parameter is optional - if not provided, uses global settings
 */
export async function uploadPDFToGitHub(
  pdfBlob: Blob,
  filename: string,
  tokenOverride?: string,
  commitMessage?: string
): Promise<GitHubUploadResult> {
  try {
    // Load GitHub configuration from global settings
    const config = await loadGitHubSettings();
    const token = tokenOverride || config.token;
    
    if (!token) {
      return {
        success: false,
        error: 'GitHub token not configured. Please configure it in Admin Settings.',
        message: 'Missing GitHub token'
      };
    }

    // Ensure filename ends with .pdf
    if (!filename.endsWith('.pdf')) {
      filename += '.pdf';
    }

    // Convert blob to base64
    const base64Content = await blobToBase64(pdfBlob);

    // Check if file already exists and get its SHA
    const existingSHA = await getFileSHA(filename, token, config.owner, config.repo, config.branch);

    // Prepare the request
    const requestBody: any = {
      message: commitMessage || `Upload audit PDF: ${filename}`,
      content: base64Content,
      branch: config.branch,
    };

    // If file exists, include SHA for update
    if (existingSHA) {
      requestBody.sha = existingSHA;
    }

    // Upload to GitHub
    const response = await fetch(
      `${GITHUB_API}/repos/${config.owner}/${config.repo}/contents/${filename}`,
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
      rawUrl: `https://raw.githubusercontent.com/${config.owner}/${config.repo}/${config.branch}/${filename}`,
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
 * Get GitHub token from global settings
 * @deprecated Use loadGitHubSettings() instead - token is managed globally in admin settings
 */
export async function getGitHubToken(): Promise<string | null> {
  const config = await loadGitHubSettings();
  return config.token;
}
