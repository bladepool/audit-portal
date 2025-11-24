# Old Portal Data Migration Guide

This guide explains how to migrate data from the old `audit.cfg.ninja` portal to the new database.

## Prerequisites

1. Backend dependencies installed: `npm install`
2. Environment variables configured (`.env` with `MONGODB_URI`)
3. Additional packages needed:
   ```bash
   npm install axios cheerio
   ```

## Migration Script

The `migrate-from-old-portal.js` script extracts data from the old portal including:
- **Description** - Full project descriptions
- **Social Media Links** - Twitter, Telegram, Discord, GitHub
- **Findings** - CFG findings with severity and descriptions

## Usage

### Migrate All Projects

```bash
cd backend
node migrate-from-old-portal.js
```

This will:
1. Fetch all projects from database
2. Check each project for missing data
3. Scrape the old portal page (e.g., `https://audit.cfg.ninja/slerf-cat`)
4. Update database with missing information
5. Show summary of migrated/skipped/error counts

### Migrate Single Project

```bash
cd backend
node migrate-from-old-portal.js slerf-cat
```

Replace `slerf-cat` with any project slug.

## What Gets Updated

The script only updates fields that are missing or incomplete:

- **Description**: Updates if missing or < 50 characters
- **Social Links**: Adds missing links (won't overwrite existing)
- **Findings**: Adds findings if none exist

## Rate Limiting

The script includes a 1-second delay between requests to avoid overwhelming the old portal server.

## Output Example

```
🚀 Starting migration from old portal...

📊 Found 150 projects in database

🔄 Migrating: Slerf Cat (slerf-cat)
📡 Fetching: https://audit.cfg.ninja/slerf-cat
✅ Scraped data from slerf-cat: { hasDescription: true, socialLinksCount: 3, findingsCount: 5 }
  ✓ Updated description
  ✓ Added twitter link
  ✓ Added telegram link
  ✓ Added 5 findings
  💾 Saved updates to database

============================================================
📈 Migration Summary:
  ✅ Migrated: 87
  ⏭️  Skipped: 58
  ❌ Errors: 5
============================================================
```

## Troubleshooting

### Connection Issues
- Ensure MongoDB is running
- Check `MONGODB_URI` in `.env`

### Scraping Errors
- Old portal page may have different HTML structure
- Check if the old portal is accessible
- Some projects may not exist on old portal

### Missing Data
- Not all data may be available on old portal pages
- Manual review may be needed for some projects

## Next Steps After Migration

1. Review migrated projects in admin dashboard
2. Verify data accuracy
3. Generate PDFs for migrated projects
4. Publish projects to TrustBlock if needed

## Notes

- The script is idempotent - safe to run multiple times
- Existing data won't be overwritten
- Failed scrapes are logged but don't stop the process
