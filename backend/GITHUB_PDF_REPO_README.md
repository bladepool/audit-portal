# Audit Portal - PDF Reports Repository

This repository hosts the complete audit PDF reports for all projects on the Audit Portal.

## Structure

```
/
  ├── {slug}.pdf       # Individual project audit reports (directly in root)
```

## Coverage

- **Total Projects**: 376+
- **PDF Size**: ~1.1-1.2 MB per report
- **Total Size**: ~440 MB
- **Generated**: November 2025

## Usage

### Direct Links
Access PDFs directly via GitHub raw URLs:
```
https://raw.githubusercontent.com/cfg-ninja/audits/main/{slug}.pdf
```

### API Integration
The main Audit Portal automatically links to these PDFs:
```javascript
const pdfUrl = `https://raw.githubusercontent.com/cfg-ninja/audits/main/${project.slug}.pdf`;
```

## PDF Contents

Each audit report includes:
- Smart Contract Analysis
- Security Score & Auditor Rating
- SWC (Smart Contract Weakness Classification) Findings
- CFG (Custom Finding Guidelines) Analysis
- Token Distribution & Economics
- Social Media & Community Information
- Contract Source Code
- Detailed Recommendations

## Generation

PDFs are generated using the offline CFG Ninja audit system with:
- PDFKit-table library
- Custom branding and fonts
- Professional 50+ page reports
- MongoDB data integration

## Updates

PDFs are regenerated when:
- Project data is updated
- Admin notes are added/modified
- Security findings change
- Contract information is updated

## License

All audit reports are property of CFG Ninja / Audit Portal.

---

**Repository**: [audit-portal](https://github.com/bladepool/audit-portal)  
**Website**: https://auditportal.com (or your domain)
