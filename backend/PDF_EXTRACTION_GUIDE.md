# PDF Data Extraction & Import Guide

## 📊 Discovery Summary

Based on analysis of the `Audits_Temporal` folder and `data.json` file:

- **960 PDFs** in Audits_Temporal folder
- **683 unique projects** identified from PDF filenames
- **312 projects** NOT in MongoDB (missing from database)
- **127 projects** have multiple audit versions (revisions over time)

## 🗂️ Data Structure in PDFs

### Available from PDF Filenames
✅ **Project Name** - Extracted from: `YYYYMMDD_CFGNINJA_ProjectName_SYMBOL_Audit.pdf`
✅ **Symbol** - Token symbol from filename
✅ **Audit Date** - Date from filename (YYYYMMDD format)
✅ **Version History** - Multiple PDFs = multiple audits
✅ **Latest Audit Date** - Most recent PDF for each project

### Available in data.json (Current Project Only)
The `data.json` file contains comprehensive data for **ONE project at a time** (currently Pecunity):

✅ **Basic Info**: name, symbol, decimals, supply, description
✅ **Contract Details**: address, platform, compiler, language, owner, deployer
✅ **Social Media**: website, telegram, twitter, github, etc.
✅ **Security Flags**: honeypot, mint, blacklist, whitelist, taxes, etc.
✅ **KYC Info**: status, URL, score, notes
✅ **Findings**: All severity levels (Critical, High, Medium, Low, Info)
  - Found count
  - Pending count
  - Resolved count
✅ **CFG Findings**: 26 custom test cases with full details
  - CFG01-CFG26: Each with title, description, severity, location, recommendation
✅ **Scores**: Security, Auditor, Owner, Social
✅ **Audit Metadata**: Edition, dates, status, confidence level
✅ **Token Distribution**: Liquidity locks, allocations
✅ **SWC Checks**: Full Smart Contract Weakness Registry results

### NOT Available (Would Need PDF Parsing)
❌ Contract addresses for historical projects
❌ Detailed findings for historical projects
❌ Social media links for historical projects
❌ Security scores for historical projects

## 🔧 Scripts Created

### 1. `analyze-json-data.js`
**Purpose**: Analyze data.json and compare with MongoDB
**Output**: `json-data-analysis.json`
```bash
node analyze-json-data.js
```
**Results**:
- Shows what data is available in data.json
- Identifies missing projects in MongoDB
- Compares PDF projects vs database projects

### 2. `extract-pdf-data.js`
**Purpose**: Extract project info from PDF filenames
**Output**: `extracted-projects-from-pdfs.json`
```bash
node extract-pdf-data.js
```
**Results**:
- Extracts: name, symbol, audit dates, versions
- Groups multiple audits per project
- Identifies latest PDF for each project
- Creates importable project objects

### 3. `import-pdf-projects.js`
**Purpose**: Import extracted projects into MongoDB
**Output**: `import-summary.json`
```bash
node import-pdf-projects.js
```
**Features**:
- Checks for existing projects (no duplicates)
- Imports in batches of 50
- Sets reasonable defaults for missing fields
- Preserves metadata (audit dates, PDF paths)
- 5-second confirmation delay

## 📈 Import Strategy

### What Gets Imported
```javascript
{
  name: "Project Name",
  symbol: "SYMBOL",
  slug: "project-name",
  platform: "Binance Smart Chain",  // Default
  decimals: 18,                      // Default
  published: false,                  // Needs review
  
  contract: {
    address: "",                     // Empty (needs update)
    language: "Solidity",
    verified: true
  },
  
  overview: {
    honeypot: false,                 // Default values
    mint: false,
    // ... all security flags default to false
  },
  
  critical: { found: 0, pending: 0, resolved: 0 },  // All empty
  major: { found: 0, pending: 0, resolved: 0 },
  medium: { found: 0, pending: 0, resolved: 0 },
  minor: { found: 0, pending: 0, resolved: 0 },
  informational: { found: 0, pending: 0, resolved: 0 },
  
  pdf: {
    generated: true,
    path: "Audits_Temporal/20251120_CFGNINJA_ProjectName_SYMBOL_Audit.pdf",
    generated_at: "2025-11-20",
    github_hosted: false
  },
  
  metadata: {
    audit_versions: 1,
    first_audit: "2025-11-20",
    latest_audit: "2025-11-20",
    all_pdfs: ["20251120_CFGNINJA_..."],
    imported_from: "PDF extraction"
  }
}
```

### What Needs Manual Update
After import, these fields should be updated when possible:
- ❗ **contract.address** - Extract from blockchain explorers or PDFs
- ❗ **socials** - Website, Telegram, Twitter, etc.
- ❗ **findings** - Severity counts (requires PDF parsing)
- ❗ **overview flags** - Honeypot, mint, blacklist, etc.
- ❗ **published** - Set to `true` when ready to publish

## 🚀 Recommended Workflow

### Phase 1: Import Projects (Immediate)
```bash
cd g:\auditportal\backend
node extract-pdf-data.js      # Extract from PDFs
node import-pdf-projects.js   # Import to MongoDB
```
**Result**: ~683 projects in database with basic info

### Phase 2: Link Existing PDFs (Already Done)
```bash
node link-existing-pdfs.js
```
**Result**: 131 PDFs already linked to projects

### Phase 3: Generate Missing PDFs (Already Done)
```bash
node generate-missing-pdfs.js
```
**Result**: 249 PDFs generated for missing projects

### Phase 4: Upload to GitHub (Already Done)
```bash
cd github-pdfs-repo
git add *.pdf
git commit -m "Add all audit PDFs"
git push origin main
```
**Result**: 377 PDFs on GitHub CDN

### Phase 5: Enhance Project Data (Future)
For each project, progressively add:
1. **Contract addresses** - From blockchain explorers
2. **Social links** - From project websites
3. **Findings** - Parse from PDFs or manually enter
4. **Review & Publish** - Set `published: true`

### Phase 6: Advanced PDF Parsing (Optional)
To extract full data from PDFs:
```javascript
// Install PDF parser
npm install pdf-parse --save-dev

// Create PDF parser script
const pdfParse = require('pdf-parse');
// Extract: contract address, findings, scores, etc.
```

## 📦 Output Files

After running all scripts:
- `json-data-analysis.json` - Analysis of data.json vs MongoDB
- `extracted-projects-from-pdfs.json` - All projects from PDFs
- `import-summary.json` - Import results
- `import-errors.json` - Any errors during import (if applicable)

## 🎯 Expected Results

### Before Import
- MongoDB: ~376 published + 720 unpublished = 1,096 projects
- PDFs: 960 files representing 683 unique projects
- Gap: 312 projects in PDFs not in MongoDB

### After Import
- MongoDB: 1,096 + 312 = **~1,408 total projects**
- Published: Still 376 (new imports are unpublished)
- Unpublished: 720 + 312 = **~1,032 projects**
- With PDFs: 377 + 312 = **~689 projects with PDFs**

### Future Growth
- Review and publish imported projects: ~1,408 potential
- Generate new PDFs: 312 newly imported projects
- Upload to GitHub: Expand from 377 to 689+ PDFs
- **Target: 1,000+ published audit projects** ✨

## ⚠️ Important Notes

1. **No Duplicates**: Import script checks existing projects by name
2. **Defaults Used**: Missing fields have sensible defaults
3. **Unpublished**: All imported projects start as `published: false`
4. **PDF Paths**: Points to Audits_Temporal folder (local)
5. **Need Review**: Each project should be reviewed before publishing
6. **Metadata Preserved**: Import date, source, audit versions tracked

## 🔄 Next Steps

1. **Run the import** (see Phase 1 above)
2. **Review imported projects** in admin panel
3. **Add missing data** progressively (addresses, socials)
4. **Generate PDFs** for newly imported projects
5. **Upload to GitHub** when ready
6. **Publish projects** after review

## 📞 Data Quality

### High Quality (From PDFs)
✅ Project names (683 unique)
✅ Symbols (extracted from filenames)
✅ Audit dates (from filenames)
✅ Version history (multiple audits tracked)

### Medium Quality (Defaults)
⚠️ Platform (defaulted to BSC)
⚠️ Decimals (defaulted to 18)
⚠️ Language (defaulted to Solidity)

### Low Quality (Needs Update)
❌ Contract addresses (empty)
❌ Social links (empty)
❌ Findings counts (zeros)
❌ Security flags (all false)

**Recommendation**: Import now, enhance data progressively over time.
