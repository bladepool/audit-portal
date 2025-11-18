const https = require('https');
const fs = require('fs');

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }, (res) => {
      let data = '';
      
      if (res.statusCode === 301 || res.statusCode === 302) {
        return httpsGet(res.headers.location).then(resolve).catch(reject);
      }
      
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function fetchGitHubAudits() {
  try {
    console.log('Fetching audit PDFs from GitHub...\n');
    
    // Fetch the GitHub API for the repository contents
    const apiUrl = 'https://api.github.com/repos/CFG-NINJA/audits/contents';
    
    const data = await httpsGet(apiUrl);
    const files = JSON.parse(data);
    
    // Filter only PDF files
    const pdfFiles = files
      .filter(file => file.name.endsWith('.pdf') && file.name !== '20220815_CFGNINJA_TokenName_Audit_sample.pdf')
      .map(file => ({
        name: file.name,
        downloadUrl: file.download_url,
        sha: file.sha,
        // Extract project name from filename: 20220309_CFGNINJA_Crypto IRA_Audit.pdf -> Crypto IRA
        projectName: file.name
          .replace(/^\d{8}_CFGNINJA_/, '')  // Remove date and CFGNINJA prefix
          .replace(/_Audit\.pdf$/, '')      // Remove _Audit.pdf suffix
          .replace(/_/g, ' ')               // Replace underscores with spaces
          .trim()
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
    
    console.log(`Found ${pdfFiles.length} audit PDFs\n`);
    
    // Save to file
    fs.writeFileSync(
      'github-audits.json',
      JSON.stringify(pdfFiles, null, 2)
    );
    
    console.log('Saved audit list to github-audits.json');
    console.log('\nFirst 10 audits:');
    pdfFiles.slice(0, 10).forEach(file => {
      console.log(`  - ${file.projectName} (${file.name})`);
    });
    
    console.log(`\n... and ${pdfFiles.length - 10} more`);
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

fetchGitHubAudits();
