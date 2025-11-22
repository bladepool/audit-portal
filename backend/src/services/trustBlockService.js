const https = require('https');

/**
 * TrustBlock API Integration
 * Docs: https://docs.trustblock.run/technical/publish#web-report
 * 
 * API Key: zM5ndrJoKeYs8donGFD6hc130l4fBANM4sLBxYDsl6WslH3M
 */

class TrustBlockAPI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.trustblock.run';
  }

  /**
   * Publish an audit report to TrustBlock
   * @param {Object} reportData - The audit report data
   * @returns {Promise<Object>} - API response
   */
  async publishReport(reportData) {
    const data = JSON.stringify(reportData);
    
    const options = {
      hostname: 'api.trustblock.run',
      port: 443,
      path: '/v1/audit',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'Authorization': `Bearer ${this.apiKey}`,
        'User-Agent': 'CFG-Ninja-Audit-Portal/1.0'
      }
    };

    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          try {
            const parsed = JSON.parse(responseData);
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(parsed);
            } else {
              reject(new Error(`API Error ${res.statusCode}: ${JSON.stringify(parsed)}`));
            }
          } catch (e) {
            reject(new Error(`Parse error: ${e.message}, Response: ${responseData}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.write(data);
      req.end();
    });
  }

  /**
   * Format project data for TrustBlock API
   * @param {Object} project - Project from database
   * @returns {Object} - Formatted data for TrustBlock
   */
  formatProjectForTrustBlock(project) {
    // Map platform to TrustBlock chain format (exact format from their API)
    const chainMap = {
      'Binance Smart Chain': 'bnbchain',
      'BSC': 'bnbchain',
      'BNB Chain': 'bnbchain',
      'BNBCHAIN': 'bnbchain',
      'Ethereum': 'ethereum',
      'Solana': 'solana',
      'Polygon': 'polygon',
      'Avalanche': 'avalanche',
      'Base': 'base',
      'Arbitrum': 'arbitrum',
      'Optimism': 'optimism'
    };
    
    const chain = chainMap[project.platform] || 'bnbchain';
    
    // Convert findings to TrustBlock issues format
    const issues = [];
    
    const addIssues = (severityName, tbSeverity, findings) => {
      if (findings && findings.found > 0) {
        const resolvedCount = findings.resolved || 0;
        const pendingCount = findings.pending || 0;
        const foundCount = findings.found || 0;
        
        for (let i = 0; i < foundCount; i++) {
          let status = 'not_fixed';
          if (i < resolvedCount) {
            status = 'fixed';
          } else if (i < (resolvedCount + pendingCount)) {
            status = 'acknowledged';
          }
          
          issues.push({
            name: `${severityName} Finding ${i + 1}`,
            description: `${severityName} severity issue identified during CFG Ninja security audit`,
            status: status,
            severity: tbSeverity
          });
        }
      }
    };
    
    // Add all findings
    if (project.issues) {
      addIssues('Critical', 'critical', project.issues.critical);
      addIssues('High', 'high', project.issues.major);
      addIssues('Medium', 'medium', project.issues.medium);
      addIssues('Low', 'low', project.issues.minor);
      addIssues('Informational', 'informational', project.issues.informational);
    }
    
    // Get contract address from various possible locations
    const contractAddress = project.contract_address || 
                          project.contractAddress || 
                          project.address ||
                          project.contract_info?.contract_address ||
                          '';
    
    // Skip publishing if no contract address (TrustBlock requires at least one contract)
    if (!contractAddress || contractAddress.length === 0) {
      throw new Error('No contract address available - skipping TrustBlock publish');
    }
    
    // Get social links
    let website = project.website || project.socials?.website || '';
    let twitter = project.twitter || project.socials?.twitter || '';
    let telegram = project.telegram || project.socials?.telegram || '';
    
    // Clean and validate URLs for TrustBlock requirements
    
    // Website: Extract root domain only (no subpaths)
    if (website) {
      try {
        const url = new URL(website.startsWith('http') ? website : `https://${website}`);
        website = `${url.protocol}//${url.hostname}`;
      } catch (e) {
        website = ''; // Invalid URL, clear it
      }
    }
    
    // Use default website if missing (required by TrustBlock)
    if (!website) {
      website = 'https://audit.cfg.ninja';
    }
    
    // Twitter: Must be full URL format
    if (twitter) {
      if (!twitter.startsWith('http')) {
        // Handle formats: @username, username, twitter.com/username, x.com/username
        const username = twitter.replace(/^@/, '').split('/').pop();
        twitter = `https://x.com/${username}`;
      } else if (twitter.includes('twitter.com')) {
        // Convert twitter.com to x.com
        twitter = twitter.replace('twitter.com', 'x.com');
      }
      // Validate it's a proper x.com URL
      if (!twitter.match(/^https:\/\/(www\.)?(x\.com|twitter\.com)\/[a-zA-Z0-9_]+$/)) {
        twitter = ''; // Invalid format
      }
    }
    
    // Telegram: Must be full URL format
    if (telegram) {
      if (!telegram.startsWith('http')) {
        // Handle formats: @username, username, t.me/username
        const username = telegram.replace(/^@/, '').split('/').pop();
        telegram = `https://t.me/${username}`;
      }
      // Validate it's a proper t.me URL
      if (!telegram.match(/^https:\/\/t\.me\/[a-zA-Z0-9_]+$/)) {
        telegram = ''; // Invalid format
      }
    }
    
    // Convert audit date to timestamp (use project dates or default to creation date)
    let conductedAt = Date.now();
    if (project.timeline?.audit_release) {
      const auditDate = new Date(project.timeline.audit_release);
      if (!isNaN(auditDate.getTime())) {
        conductedAt = auditDate.getTime();
      }
    } else if (project.createdAt) {
      conductedAt = new Date(project.createdAt).getTime();
    } else if (project.contract_info?.contract_created) {
      conductedAt = new Date(project.contract_info.contract_created).getTime();
    }

    // Use web report with PDF URL from GitHub or audit.cfg.ninja URL
    const reportUrl = project.audit_pdf || `https://audit.cfg.ninja/${project.slug}`;

    // Build links object - website is required, others optional
    const links = {
      website: website // Always include website (defaults to audit.cfg.ninja if missing)
    };
    if (twitter) links.twitter = twitter;
    if (telegram) links.telegram = telegram;

    // Build contracts array - always include the contract (we already validated it exists)
    const contracts = [
      {
        type: 'onChain',
        chain: chain,
        address: contractAddress
      }
    ];

    return {
      name: project.name,
      description: project.description || `Smart contract audit for ${project.name} (${project.symbol || ''})`,
      conductedAt: conductedAt,
      reportUrl: reportUrl, // Use web URL instead of CID
      reportType: 'web',
      issues: issues,
      contracts: contracts, // Empty array if no contract address
      project: {
        name: project.name,
        email: 'audit@cfg.ninja', // Required by TrustBlock API
        tags: ['finance', 'security'],
        chains: [chain],
        links: links // Website required, twitter/telegram optional
      }
    };
  }

  /**
   * Batch publish multiple projects
   * @param {Array} projects - Array of projects to publish
   * @returns {Promise<Array>} - Results of each publish
   */
  async batchPublish(projects) {
    const results = [];
    
    for (const project of projects) {
      try {
        const formattedData = this.formatProjectForTrustBlock(project);
        console.log(`Publishing: ${project.name}...`);
        
        const result = await this.publishReport(formattedData);
        results.push({ 
          project: project.name, 
          success: true, 
          data: result 
        });
        
        console.log(`  ✓ Published successfully`);
        
        // Rate limiting - wait 1 second between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`  ✗ Failed: ${error.message}`);
        results.push({ 
          project: project.name, 
          success: false, 
          error: error.message 
        });
      }
    }
    
    return results;
  }

  /**
   * Get report status from TrustBlock
   * @param {string} reportId - Report ID from TrustBlock
   * @returns {Promise<Object>} - Report status
   */
  async getReportStatus(reportId) {
    const options = {
      hostname: 'api.trustblock.run',
      port: 443,
      path: `/v1/reports/${reportId}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'User-Agent': 'CFG-Ninja-Audit-Portal/1.0'
      }
    };

    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          try {
            const parsed = JSON.parse(responseData);
            resolve(parsed);
          } catch (e) {
            reject(new Error(`Parse error: ${e.message}`));
          }
        });
      });

      req.on('error', reject);
      req.end();
    });
  }
}

// Example usage
async function testTrustBlockAPI() {
  const apiKey = 'zM5ndrJoKeYs8donGFD6hc130l4fBANM4sLBxYDsl6WslH3M';
  const api = new TrustBlockAPI(apiKey);
  
  // Test with sample project data
  const sampleProject = {
    name: 'Test Project',
    symbol: 'TEST',
    slug: 'test-project',
    contract_address: '0x1234567890123456789012345678901234567890',
    platform: 'Binance Smart Chain',
    audit_score: '95',
    audit_pdf: 'https://github.com/CFG-NINJA/audits/blob/main/test.pdf',
    issues: {
      critical: { found: 0 },
      major: { found: 1 },
      medium: { found: 2 },
      minor: { found: 3 },
      informational: { found: 5 }
    }
  };
  
  try {
    console.log('Testing TrustBlock API...\n');
    const result = await api.publishReport(api.formatProjectForTrustBlock(sampleProject));
    console.log('Success:', result);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

module.exports = { TrustBlockAPI };

// Uncomment to test
// testTrustBlockAPI();
