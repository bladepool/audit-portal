# Test Pecunity Project Setup

This guide will help you create a test project with Pecunity data to test the PDF generator.

## Prerequisites

1. Backend server running on `http://localhost:5001`
2. Frontend server running on `http://localhost:3000`
3. MongoDB running locally

## Option 1: Using the HTML Test Page (Easiest)

1. Open `test-create-pecunity.html` in your browser
2. Click "Create Pecunity Project"
3. Copy the Admin URL from the success message
4. Open the Admin URL in your browser
5. Click "Generate PDF Report" to test the PDF generator

## Option 2: Using the Seed Script

1. Make sure MongoDB is running
2. Run the seed script:
   ```bash
   cd g:\auditportal\backend
   node scripts/seedPecunity.js
   ```
3. Copy the Project ID from the output
4. Open `http://localhost:3000/admin/projects/[PROJECT_ID]` in your browser
5. Click "Generate PDF Report" to test the PDF generator

## Option 3: Manual Creation via Admin

1. Go to `http://localhost:3000/admin/dashboard`
2. Click "Create New Project"
3. Fill in the basic fields:
   - Name: Pecunity
   - Symbol: PEC
   - Decimals: 18
   - Supply: 25,000,000
   - Description: Controlled ERC20 Token with Launch & Transfer Management
   - Slug: pecunity
4. Add the CFG findings manually
5. Generate the PDF

## Testing the PDF Generator

Once the project is created:

1. Navigate to the admin edit page for Pecunity
2. Scroll down to the "CFG Findings (Detailed)" section
3. Click the "Generate PDF Report" button
4. The PDF should download with all sections populated:
   - Front page with project name and logo
   - Risk Analysis
   - Project Information
   - Timeline
   - KYC Information
   - Token Distribution
   - SWC Checks
   - Advanced Metadata
   - Score History
   - Findings Summary
   - Detailed CFG Findings
   - Contract Overview
   - Social Links

## Expected PDF Output

The PDF should be named: `YYYYMMDD_CFGNINJA_pecunity_Audit.pdf`

It should include:
- Professional CFG Ninja branding
- All project details from data.json
- Risk assessment visualization
- Complete findings breakdown
- Timeline with dates
- KYC verification status
- Token distribution charts/tables
- All SWC security checks
- Advanced metadata flags
- Audit confidence stars
- Social links and contact info

## Troubleshooting

### "Backend not running"
- Start the backend: `cd g:\auditportal\backend && npm run dev`

### "MongoDB connection failed"
- Start MongoDB service
- Or use MongoDB Atlas connection string in backend .env

### "Project already exists"
- Use Option 2 (seed script) - it will update the existing project
- Or delete the existing Pecunity project from admin and create new

### "PDF missing sections"
- Check that all fields are populated in the admin form
- Check browser console for errors
- Verify PDF assets exist in `public/pdf-assets/`

## What's New in the PDF Generator

The refactored PDF generator now includes:

1. **Timeline Section** - Shows audit workflow dates
2. **KYC Section** - Displays verification status and score
3. **Token Distribution** - Visual breakdown of token allocation
4. **SWC Checks Table** - All 37 security checks with status
5. **Advanced Metadata** - Flags for contract type, platform, etc.
6. **Score History** - Historical audit scores
7. **Audit Confidence** - Visual star rating
8. **File a Report Link** - Call to action for issues
9. **Enhanced Findings** - All 26 CFG findings with full details
10. **Better Typography** - Professional fonts and spacing

Enjoy testing! 🚀
