# GitHub PDF Hosting Setup Guide

## Step 1: Create GitHub Repository (if not exists)

The repository already exists at: https://github.com/cfg-ninja/audits

If you need to create it:
1. Go to https://github.com/new
2. Repository name: `audits`
3. Organization: `cfg-ninja`
4. Description: "Smart contract audit reports"
5. Visibility: **Public** (required for raw file access)
6. Click "Create repository"

## Step 2: Initialize Local Repository

```powershell
# Create repository directory structure
cd g:\auditportal\backend
mkdir github-pdfs-repo
cd github-pdfs-repo

# Initialize git
git init
git branch -M main

# Copy README
Copy-Item ..\GITHUB_PDF_REPO_README.md .\README.md

# Copy all PDFs directly to root (no pdfs subfolder)
Copy-Item ..\generated-pdfs\*.pdf .\

# Check total size
Get-ChildItem .\pdfs\*.pdf | Measure-Object -Property Length -Sum | Select-Object Count, @{Name="TotalMB";Expression={[math]::Round($_.Sum/1MB, 2)}}
```

## Step 3: Commit and Push

```powershell
# Add remote
git remote add origin https://github.com/cfg-ninja/audits.git

# Stage all files
git add .

# Commit
git commit -m "Initial commit: Add 376+ audit PDF reports"

# Push to GitHub
git push -u origin main
```

**Note**: Pushing 440 MB may take 5-10 minutes depending on your internet speed.

## Step 4: Enable Git LFS (Optional, for better performance)

If GitHub warns about large files:

```powershell
# Install Git LFS if not already installed
git lfs install

# Track PDF files with LFS
git lfs track "*.pdf"
git add .gitattributes
git commit -m "Add Git LFS tracking for PDFs"

# Migrate existing PDFs to LFS
git lfs migrate import --include="*.pdf" --everything

# Push with LFS
git push origin main --force
```

## Step 5: Verify PDF Access

Test that PDFs are accessible:

```powershell
# Test a single PDF (replace 'pecunity' with actual slug)
$testUrl = "https://raw.githubusercontent.com/cfg-ninja/audits/main/pecunity.pdf"
Invoke-WebRequest -Uri $testUrl -OutFile "test-download.pdf"

# Check file size
Get-Item test-download.pdf | Select-Object Name, @{Name="SizeMB";Expression={[math]::Round($_.Length/1MB, 2)}}
```

Expected: ~1.15 MB file should download successfully.

## Step 6: Update MongoDB with GitHub URLs

```powershell
cd g:\auditportal\backend

# Edit update-github-pdf-urls.js if needed to change repo owner/name
# Then run:
node update-github-pdf-urls.js
```

This will update all 376+ project records with:
```javascript
{
  pdf: {
    url: "https://raw.githubusercontent.com/cfg-ninja/audits/main/{slug}.pdf",
    github_hosted: true,
    updated_at: "2025-11-20T..."
  }
}
```

## Step 7: Update Frontend to Use GitHub URLs

In your frontend code, use the `pdf.url` field:

```typescript
// Example: Project page
const pdfUrl = project.pdf?.url || `/api/projects/${project.slug}/generate-pdf`;

<a href={pdfUrl} target="_blank" className="download-pdf-btn">
  Download Audit Report (PDF)
</a>
```

## Repository Structure

```
audits/
├── README.md
├── pecunity.pdf          (1.15 MB)
├── mars-coin.pdf         (1.15 MB)
├── anonymous-dao.pdf     (1.15 MB)
├── ... (376+ files)
└── .gitattributes        (if using Git LFS)
```

## Benefits of GitHub Hosting

1. **Free CDN**: GitHub serves files via CDN globally
2. **Reliable**: 99.9% uptime
3. **Version Control**: Track PDF changes over time
4. **No Bandwidth Costs**: GitHub handles all traffic
5. **Easy Updates**: Just commit new PDFs and push

## Updating PDFs Later

To update existing PDFs or add new ones:

```powershell
cd g:\auditportal\backend\github-pdfs-repo

# Copy updated PDFs (directly to root)
Copy-Item ..\generated-pdfs\*.pdf .\ -Force

# Commit changes
git add *.pdf
git commit -m "Update PDFs: $(Get-Date -Format 'yyyy-MM-dd')"
git push origin main

# Update MongoDB URLs if needed
cd ..
node update-github-pdf-urls.js
```

## Alternative: GitHub Releases

If repository size becomes too large (>1 GB), consider using GitHub Releases:

1. Create a release: https://github.com/cfg-ninja/audits/releases/new
2. Tag: `v1.0.0`
3. Upload PDFs as release assets
4. Update URLs to point to release assets

## Troubleshooting

**Issue**: "File too large" error
**Solution**: Use Git LFS (see Step 4)

**Issue**: PDFs not downloading in browser
**Solution**: Use `raw.githubusercontent.com` URLs, not regular GitHub URLs

**Issue**: Slow push
**Solution**: Normal for 440 MB. Can split into multiple commits if needed.

## Security Note

The repository is **public** to enable raw file access. PDFs contain only audit information already published on your portal, so this is acceptable.

---

**Next Steps After Setup:**
1. ✅ Repository created and PDFs uploaded
2. ✅ MongoDB updated with GitHub URLs  
3. ✅ Frontend updated to use GitHub links
4. 🎉 PDFs now served from GitHub CDN!
