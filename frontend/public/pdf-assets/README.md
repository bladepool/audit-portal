# PDF Assets

This directory contains the assets required for generating professional audit PDFs that match the CFG Ninja production format.

## Directory Structure

```
pdf-assets/
├── logos/
│   ├── front9.png              # Main CFG Ninja branded front page background
│   ├── CFG-Logo-red-black-FULL.png  # CFG Ninja header logo
│   ├── verified-badge-CFG.png   # Verification badge
│   └── Shield.png               # Security shield icon
└── fonts/
    ├── MONTSERRAT-SEMIBOLD.OTF  # Headers and titles
    ├── MONTSERRAT-MEDIUM.OTF    # Body text
    ├── Montserrat-Bold.ttf      # Bold emphasis
    ├── RedHatDisplay-Bold.ttf   # Section titles
    └── RedHatDisplay-Regular.ttf # Regular text
```

## Usage

The enhanced PDF generator (`enhancedPdfGenerator.ts`) automatically:

1. **Loads CFG Ninja branding** - Uses front9.png as the cover page background
2. **Fetches project logos** - Automatically retrieves project logos from `/img/projects/{slug}.{ext}`
3. **Applies professional styling** - Uses Montserrat and RedHat Display fonts
4. **Generates multi-page reports** - Includes:
   - Front page with project logo
   - Risk analysis summary
   - Audit score with color coding
   - Findings summary table
   - Detailed CFG findings (CFG01-CFG26)
   - Contract overview
   - Social links
   - Footer with generation date

## Project Logo Requirements

Project logos should be placed in `/public/img/projects/` with the following naming:
- `{slug}.png`
- `{slug}.jpg`
- `{slug}.jpeg`
- `{slug}.webp`
- `{slug}.svg` (converted to PNG for PDF)

The generator automatically tries all formats and uses the first one found.

## Font Loading

Custom fonts are embedded in the PDF for consistent rendering. The generator uses:
- **Montserrat Semibold** - Project names, main headings
- **Montserrat Medium** - Dates, metadata
- **RedHat Display Bold** - Section titles
- **RedHat Display Regular** - Body text

## Color Scheme

- **Primary Red**: #EF4444 (RGB: 239, 68, 68) - CFG Ninja brand color
- **Dark Gray**: #1E1E1E (RGB: 30, 30, 30) - Headers
- **Light Gray**: #D6DDE0 (RGB: 214, 221, 224) - Secondary text
- **White**: #FFFFFF - Primary text on dark backgrounds

### Severity Colors
- **Critical**: #DC2626 (RGB: 220, 38, 38)
- **High**: #F97316 (RGB: 249, 115, 22)
- **Medium**: #EAB308 (RGB: 234, 179, 8)
- **Low**: #22C55E (RGB: 34, 197, 94)
- **Informational**: #9CA3AF (RGB: 156, 163, 175)

### Score Colors
- **High (≥75)**: #22C55E (Green)
- **Medium (≥50)**: #EAB308 (Yellow)
- **Low (<50)**: #EF4444 (Red)

## Generation

PDFs are generated client-side using jsPDF and jspdf-autotable. The filename format is:
```
YYYYMMDD_CFGNINJA_{slug}_Audit.pdf
```

Example: `20231210_CFGNINJA_xelliott_Audit.pdf`

## Source Files

Original assets copied from:
```
E:\Desktop\Old Desktop November 2023\audits\PDFscript\CFGNinjaScripts\Custom Contract\
├── logos/
└── fonts/
```

## Maintenance

To update assets:
1. Place new logo files in the respective directories
2. Ensure file names match those referenced in `enhancedPdfGenerator.ts`
3. For fonts, update font loading code if changing font families
4. Test PDF generation after any asset changes
