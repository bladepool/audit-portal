# GitHub Automatic PDF Upload Guide

## Overview

The admin portal now supports **automatic PDF uploads** to the CFG-NINJA/audits GitHub repository. When you generate a PDF for any project, it will:

1. ✅ Generate a professional audit report PDF in the browser
2. ✅ Download the PDF to your local computer
3. ✅ Upload the PDF to GitHub (CFG-NINJA/audits repository)
4. ✅ Update the project record with the GitHub raw URL

## Setup Instructions

### 1. Create a GitHub Personal Access Token

1. Go to GitHub Settings: https://github.com/settings/tokens
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Give it a descriptive name: `Audit Portal PDF Upload`
4. Set expiration: Choose duration (recommended: 90 days or No expiration)
5. Select scopes:
   - ✅ **repo** (Full control of private repositories)
     - This includes repo:status, repo_deployment, public_repo, repo:invite, security_events
6. Click **"Generate token"**
7. **IMPORTANT**: Copy the token immediately (starts with `ghp_`)
   - You won't be able to see it again!
   - Store it securely

### 2. Using the Feature in Admin Portal

1. **Navigate to any project**:
   ```
   https://audit-portal-gamma.vercel.app/admin/projects/[project-id]
   ```

2. **Scroll to "PDF Generation" section** (bottom of the page)

3. **Configure options**:
   - Toggle "Upload to GitHub" ON/OFF
   - If ON: PDF will be uploaded to CFG-NINJA/audits
   - If OFF: PDF will only download locally

4. **Click "Generate Audit PDF"**

5. **First time**: You'll be prompted to enter your GitHub token
   - Paste the token you created in step 1
   - The token will be saved in your browser (localStorage)
   - You won't need to enter it again

6. **Wait for completion**:
   ```
   Generating PDF in browser...
   ✅ PDF generated and downloaded successfully!
   📤 Uploading to GitHub...
   ✅ PDF uploaded to GitHub!
   https://raw.githubusercontent.com/CFG-NINJA/audits/main/project-slug.pdf
   ```

## How It Works

### Client-Side PDF Generation

```typescript
// Uses jsPDF library in browser
const pdfBlob = await generateEnhancedAuditPDFBlob(project);
```

Features:
- Professional CFG NINJA branding
- Security scores with visual bars
- Findings summary table
- Detailed findings with severity badges
- Contract overview
- Social links
- Multi-page support with footers

### GitHub Upload Process

```typescript
// Convert Blob to base64
const base64Content = await blobToBase64(pdfBlob);

// Upload to GitHub using REST API
PUT https://api.github.com/repos/CFG-NINJA/audits/contents/{slug}.pdf
{
  message: "Upload audit report for ProjectName",
  content: base64Content,
  branch: "main"
}
```

### File Naming Convention

```
{project-slug}.pdf
```

Examples:
- `pecunity.pdf`
- `baby-doge.pdf`
- `grok-2024.pdf`

### Update Project Record

After successful upload, the project is automatically updated:

```json
{
  "pdf": {
    "url": "https://raw.githubusercontent.com/CFG-NINJA/audits/main/pecunity.pdf",
    "github_hosted": true
  }
}
```

## Troubleshooting

### ⚠️ "GitHub token required for upload"

**Solution**: Enter your personal access token in the input field that appears.

### ❌ "Failed to upload PDF to GitHub"

**Possible causes**:
1. **Invalid token**: Generate a new token with correct scopes
2. **Token expired**: Create a new token
3. **Network issue**: Check internet connection
4. **Repository access**: Ensure you have write access to CFG-NINJA/audits

### ⚠️ "403 Forbidden"

**Cause**: Token doesn't have required permissions

**Solution**: 
1. Delete the old token from GitHub
2. Create a new token with **repo** scope
3. Enter the new token in admin portal

### 🔄 File Already Exists

The system automatically handles updates:
- Checks if file exists in GitHub
- Gets the file's SHA (required for updates)
- Overwrites with new content
- Commit message indicates it's an update

## Token Security

### Browser Storage

The token is stored in localStorage:
```javascript
localStorage.setItem('github_token', 'ghp_xxx');
```

### Security Considerations

✅ **Safe**:
- Token only stored in YOUR browser
- Not sent to backend server
- Only used for GitHub API calls

⚠️ **Important**:
- Don't share your token with anyone
- Don't commit it to git
- Regenerate if compromised
- Use minimal required scopes

### Clearing Stored Token

Open browser console and run:
```javascript
localStorage.removeItem('github_token');
```

Or use the browser's developer tools:
1. F12 → Application tab
2. Storage → Local Storage
3. Find `github_token` key
4. Delete it

## Manual Upload Alternative

If you prefer not to use automatic upload:

1. Toggle "Upload to GitHub" OFF
2. Generate PDF (downloads locally)
3. Manually upload to GitHub:
   ```bash
   cd path/to/CFG-NINJA/audits
   git add project-slug.pdf
   git commit -m "Add audit report for ProjectName"
   git push origin main
   ```

## Benefits

✅ **Automated workflow**: Generate and upload in one click
✅ **Consistent naming**: Automatic slug-based filenames
✅ **Version control**: All PDFs tracked in git
✅ **Public access**: Raw URLs work immediately
✅ **Backup**: PDFs preserved in GitHub
✅ **No server required**: Completely client-side

## API Rate Limits

GitHub API limits:
- **Authenticated**: 5,000 requests/hour
- **File size**: Max 100 MB per file

Typical usage:
- 1 request to check if file exists
- 1 request to upload/update file
- **Total**: 2 requests per PDF generation

You can generate ~2,500 PDFs per hour (well above realistic usage).

## Example Workflow

1. **Edit project** in admin panel
2. **Update findings** using FindingsManager
3. **Calculate scores** using "Calculate from Findings" button
4. **Save project**
5. **Generate PDF** with GitHub upload
6. **Verify upload** - check success message
7. **Test URL** - visit the raw GitHub URL
8. **Publish project** - make it visible on portal

## Frontend Integration

Projects display PDF download button:
```typescript
{project.pdf?.url && (
  <a href={project.pdf.url} target="_blank">
    <DocumentIcon /> Download Audit Report
  </a>
)}
```

## Support

If you encounter issues:

1. Check browser console for errors (F12)
2. Verify token has correct permissions
3. Test token with GitHub API directly:
   ```bash
   curl -H "Authorization: Bearer ghp_xxx" https://api.github.com/user
   ```
4. Regenerate token if needed
5. Clear localStorage and re-enter token

## Future Enhancements

Potential improvements:
- [ ] Bulk PDF generation with progress bar
- [ ] PDF preview before upload
- [ ] GitHub Actions workflow for validation
- [ ] Automatic TrustBlock publishing after PDF upload
- [ ] PDF versioning (keep historical versions)
- [ ] Email notification on upload success
- [ ] Webhook integration for automation

---

**Last Updated**: November 22, 2025
**Version**: 1.0
**Author**: CFG Ninja Development Team
