/**
 * Automated Solana Contract Finder
 * Searches multiple sources to find missing Solana contract addresses
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');
const axios = require('axios');
const fs = require('fs');

class SolanaContractFinder {
  constructor() {
    this.foundContracts = [];
    this.notFound = [];
  }

  /**
   * Search Jupiter token list
   */
  async searchJupiterTokenList(symbol, name) {
    try {
      const response = await axios.get('https://token.jup.ag/all');
      const tokens = response.data;
      
      // Search by symbol first
      let token = tokens.find(t => 
        t.symbol?.toLowerCase() === symbol?.toLowerCase()
      );
      
      // If not found, search by name
      if (!token && name) {
        token = tokens.find(t => 
          t.name?.toLowerCase().includes(name.toLowerCase())
        );
      }
      
      if (token) {
        return {
          address: token.address,
          source: 'Jupiter Token List',
          verified: true,
          decimals: token.decimals,
          logoURI: token.logoURI
        };
      }
    } catch (error) {
      console.error('Jupiter search error:', error.message);
    }
    return null;
  }

  /**
   * Search Solscan API
   */
  async searchSolscan(symbol, name) {
    try {
      // Search by symbol
      const searchUrl = `https://public-api.solscan.io/token/search?keyword=${encodeURIComponent(symbol)}`;
      const response = await axios.get(searchUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      
      if (response.data?.data?.length > 0) {
        const token = response.data.data[0];
        return {
          address: token.address,
          source: 'Solscan API',
          verified: token.verified || false,
          decimals: token.decimals,
          holders: token.holder
        };
      }
    } catch (error) {
      console.error('Solscan search error:', error.message);
    }
    return null;
  }

  /**
   * Search Raydium token list
   */
  async searchRaydiumTokenList(symbol) {
    try {
      const response = await axios.get('https://api.raydium.io/v2/sdk/token/raydium.mainnet.json');
      const tokens = response.data;
      
      const token = Object.values(tokens).find(t => 
        t.symbol?.toLowerCase() === symbol?.toLowerCase()
      );
      
      if (token) {
        return {
          address: token.address,
          source: 'Raydium Token List',
          verified: true,
          decimals: token.decimals
        };
      }
    } catch (error) {
      console.error('Raydium search error:', error.message);
    }
    return null;
  }

  /**
   * Check Solana Token Registry (GitHub)
   */
  async searchSolanaTokenRegistry(symbol, name) {
    try {
      const response = await axios.get(
        'https://raw.githubusercontent.com/solana-labs/token-list/main/src/tokens/solana.tokenlist.json'
      );
      const tokenList = response.data;
      
      let token = tokenList.tokens.find(t => 
        t.symbol?.toLowerCase() === symbol?.toLowerCase()
      );
      
      if (!token && name) {
        token = tokenList.tokens.find(t => 
          t.name?.toLowerCase().includes(name.toLowerCase())
        );
      }
      
      if (token) {
        return {
          address: token.address,
          source: 'Solana Token Registry',
          verified: true,
          decimals: token.decimals,
          logoURI: token.logoURI
        };
      }
    } catch (error) {
      console.error('Token Registry search error:', error.message);
    }
    return null;
  }

  /**
   * Validate Solana address format
   */
  isValidSolanaAddress(address) {
    // Solana addresses are base58 encoded, 32-44 characters
    const solanaPattern = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    return solanaPattern.test(address) && !address.includes('0x');
  }

  /**
   * Find contract for a single project
   */
  async findContract(project) {
    console.log(`\n🔍 Searching for: ${project.name} (${project.symbol})`);
    
    const sources = [
      () => this.searchJupiterTokenList(project.symbol, project.name),
      () => this.searchSolscan(project.symbol, project.name),
      () => this.searchRaydiumTokenList(project.symbol),
      () => this.searchSolanaTokenRegistry(project.symbol, project.name)
    ];
    
    for (const searchFn of sources) {
      try {
        const result = await searchFn();
        if (result && this.isValidSolanaAddress(result.address)) {
          console.log(`  ✓ Found: ${result.address} (${result.source})`);
          return result;
        }
      } catch (error) {
        // Continue to next source
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`  ✗ Not found in any source`);
    return null;
  }

  /**
   * Main execution
   */
  async run() {
    const client = new MongoClient(process.env.MONGODB_URI);
    
    try {
      await client.connect();
      console.log('Connected to MongoDB\n');
      
      const db = client.db('auditportal');
      
      // Get Solana projects without contracts
      const projects = await db.collection('projects').find({
        published: true,
        platform: 'Solana',
        $or: [
          { 'contract_info.contract_address': { $exists: false } },
          { 'contract_info.contract_address': null },
          { 'contract_info.contract_address': '' }
        ]
      }).toArray();
      
      console.log(`=== Solana Contract Finder ===`);
      console.log(`Found ${projects.length} Solana projects without contracts\n`);
      console.log(`Searching multiple sources:\n- Jupiter Token List\n- Solscan API\n- Raydium Token List\n- Solana Token Registry\n`);
      
      let updated = 0;
      
      for (let i = 0; i < projects.length; i++) {
        const project = projects[i];
        console.log(`[${i + 1}/${projects.length}] ${project.name}`);
        
        const result = await this.findContract(project);
        
        if (result) {
          // Update database
          await db.collection('projects').updateOne(
            { _id: project._id },
            {
              $set: {
                'contract_info.contract_address': result.address,
                'contract_info.source': result.source,
                'contract_info.verified': result.verified,
                'contract_info.found_at': new Date()
              }
            }
          );
          
          this.foundContracts.push({
            name: project.name,
            symbol: project.symbol,
            slug: project.slug,
            address: result.address,
            source: result.source
          });
          
          updated++;
        } else {
          this.notFound.push({
            name: project.name,
            symbol: project.symbol,
            slug: project.slug,
            website: project.socials?.website,
            telegram: project.socials?.telegram
          });
        }
        
        // Rate limiting between projects
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Results
      console.log('\n\n=== Search Complete ===\n');
      console.log(`✓ Found: ${updated} contracts`);
      console.log(`✗ Not Found: ${this.notFound.length} projects`);
      console.log(`Total Searched: ${projects.length}\n`);
      
      if (updated > 0) {
        console.log('=== Found Contracts ===\n');
        this.foundContracts.forEach(c => {
          console.log(`✓ ${c.name} (${c.symbol})`);
          console.log(`  Address: ${c.address}`);
          console.log(`  Source: ${c.source}`);
          console.log(`  Slug: ${c.slug}`);
          console.log('');
        });
      }
      
      // Save results
      const report = {
        timestamp: new Date().toISOString(),
        searched: projects.length,
        found: updated,
        notFound: this.notFound.length,
        successRate: ((updated / projects.length) * 100).toFixed(1) + '%',
        foundContracts: this.foundContracts,
        notFoundProjects: this.notFound
      };
      
      fs.writeFileSync(
        'solana-contract-search-results.json',
        JSON.stringify(report, null, 2)
      );
      console.log('✓ Saved results to solana-contract-search-results.json\n');
      
      // Show updated stats
      const withContracts = await db.collection('projects').countDocuments({
        published: true,
        platform: 'Solana',
        'contract_info.contract_address': { $exists: true, $ne: null, $ne: '' }
      });
      
      const totalSolana = await db.collection('projects').countDocuments({
        published: true,
        platform: 'Solana'
      });
      
      console.log('=== Solana Contract Coverage ===');
      console.log(`Projects with contracts: ${withContracts}/${totalSolana} (${Math.round(withContracts/totalSolana*100)}%)\n`);
      
      if (this.notFound.length > 0) {
        console.log('=== Next Steps for Not Found ===');
        console.log('1. Check project websites manually');
        console.log('2. Contact projects via email/Telegram');
        console.log('3. Check CoinGecko/CMC listings');
        console.log('4. Search Twitter for announcements\n');
        
        console.log('Projects to contact manually:');
        this.notFound.slice(0, 10).forEach(p => {
          console.log(`  - ${p.name} (${p.slug})`);
          if (p.telegram) console.log(`    Telegram: ${p.telegram}`);
          if (p.website) console.log(`    Website: ${p.website}`);
        });
        
        if (this.notFound.length > 10) {
          console.log(`  ... and ${this.notFound.length - 10} more`);
        }
      }
      
    } catch (error) {
      console.error('Error:', error);
    } finally {
      await client.close();
    }
  }
}

// Run if called directly
if (require.main === module) {
  const finder = new SolanaContractFinder();
  finder.run().catch(console.error);
}

module.exports = SolanaContractFinder;
