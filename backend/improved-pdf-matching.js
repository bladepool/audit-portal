/**
 * Improved PDF matching with fuzzy/flexible name matching
 * Tries multiple strategies to match more PDFs
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const MONGODB_URI = process.env.MONGODB_URI;
const AUDITS_TEMPORAL_PATH = 'E:\\Desktop\\Old Desktop November 2023\\audits\\PDFscript\\CFGNinjaScripts\\Custom Contract\\Audits_Temporal';
const OUTPUT_PATH = 'g:\\auditportal\\backend\\generated-pdfs';

function normalizeName(name) {
  return name.toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

function extractProjectName(filename) {
  const match = filename.match(/^\d{8}_CFGNINJA_(.+?)_[A-Z0-9]+_Audit\.pdf$/i);
  if (match) {
    return match[1];
  }
  return null;
}

// Additional matching strategies
function generateNameVariants(name) {
  const normalized = normalizeName(name);
  const variants = new Set([normalized]);
  
  // Remove common suffixes
  const withoutToken = normalized.replace(/token$/, '');
  const withoutCoin = normalized.replace(/coin$/, '');
  const withoutInu = normalized.replace(/inu$/, '');
  
  variants.add(withoutToken);
  variants.add(withoutCoin);
  variants.add(withoutInu);
  
  return Array.from(variants);
}

function calculateSimilarity(str1, str2) {
  const len1 = str1.length;
  const len2 = str2.length;
  const maxLen = Math.max(len1, len2);
  
  if (maxLen === 0) return 1.0;
  
  // Levenshtein distance
  const matrix = Array(len2 + 1).fill(null).map(() => Array(len1 + 1).fill(null));
  
  for (let i = 0; i <= len1; i++) matrix[0][i] = i;
  for (let j = 0; j <= len2; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= len2; j++) {
    for (let i = 1; i <= len1; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }
  
  return 1 - (matrix[len2][len1] / maxLen);
}

async function improvedMatching() {
  console.log('=== Improved PDF Matching (Flexible) ===\n');
  
  const client = await MongoClient.connect(MONGODB_URI);
  const db = client.db('auditportal');
  
  try {
    // Get projects without PDFs
    const projects = await db.collection('projects')
      .find({ 
        published: true,
        'pdf.generated': { $ne: true }
      })
      .sort({ name: 1 })
      .toArray();
    
    console.log(`Projects needing PDFs: ${projects.length}\n`);
    
    // Get all PDFs
    const pdfFiles = fs.readdirSync(AUDITS_TEMPORAL_PATH)
      .filter(f => f.endsWith('.pdf'))
      .map(f => {
        const projectName = extractProjectName(f);
        const stats = fs.statSync(path.join(AUDITS_TEMPORAL_PATH, f));
        return {
          filename: f,
          path: path.join(AUDITS_TEMPORAL_PATH, f),
          projectName: projectName,
          normalizedName: projectName ? normalizeName(projectName) : null,
          stats: stats
        };
      })
      .filter(f => f.projectName !== null)
      .sort((a, b) => b.stats.mtime - a.stats.mtime);
    
    console.log(`Total PDFs available: ${pdfFiles.length}\n`);
    
    let exactMatches = 0;
    let fuzzyMatches = 0;
    let variantMatches = 0;
    let notMatched = 0;
    
    const results = [];
    
    for (const project of projects) {
      const projectNormalized = normalizeName(project.name);
      const variants = generateNameVariants(project.name);
      
      // Strategy 1: Exact match
      let matchedPdf = pdfFiles.find(pdf => pdf.normalizedName === projectNormalized);
      let matchType = 'exact';
      
      // Strategy 2: Try variants (without token/coin/inu suffixes)
      if (!matchedPdf) {
        for (const variant of variants) {
          matchedPdf = pdfFiles.find(pdf => pdf.normalizedName === variant);
          if (matchedPdf) {
            matchType = 'variant';
            break;
          }
        }
      }
      
      // Strategy 3: Fuzzy match (similarity > 90%)
      if (!matchedPdf) {
        let bestMatch = null;
        let bestScore = 0;
        
        for (const pdf of pdfFiles) {
          const similarity = calculateSimilarity(projectNormalized, pdf.normalizedName);
          if (similarity > bestScore && similarity > 0.90) {
            bestScore = similarity;
            bestMatch = pdf;
          }
        }
        
        if (bestMatch) {
          matchedPdf = bestMatch;
          matchType = `fuzzy(${(bestScore * 100).toFixed(0)}%)`;
        }
      }
      
      if (matchedPdf) {
        if (matchType === 'exact') exactMatches++;
        else if (matchType === 'variant') variantMatches++;
        else fuzzyMatches++;
        
        const sizeMB = (matchedPdf.stats.size / 1024 / 1024).toFixed(2);
        
        results.push({
          slug: project.slug,
          name: project.name,
          matched: true,
          matchType: matchType,
          pdfName: matchedPdf.projectName,
          filename: matchedPdf.filename,
          sizeMB: sizeMB
        });
        
        console.log(`✓ [${matchType}] ${project.name}`);
        console.log(`  → ${matchedPdf.projectName} (${sizeMB} MB)`);
      } else {
        notMatched++;
        results.push({
          slug: project.slug,
          name: project.name,
          matched: false
        });
        console.log(`✗ ${project.name}`);
      }
    }
    
    console.log('\n=== Matching Summary ===');
    console.log(`Exact matches: ${exactMatches}`);
    console.log(`Variant matches: ${variantMatches}`);
    console.log(`Fuzzy matches: ${fuzzyMatches}`);
    console.log(`Total matched: ${exactMatches + variantMatches + fuzzyMatches}`);
    console.log(`Not matched: ${notMatched}`);
    
    // Save results
    fs.writeFileSync(
      'improved-matching-results.json',
      JSON.stringify(results, null, 2)
    );
    console.log('\n✓ Saved results to: improved-matching-results.json');
    
    // Ask if should copy the newly matched PDFs
    const newMatches = results.filter(r => r.matched && (r.matchType !== 'exact'));
    if (newMatches.length > 0) {
      console.log(`\n📋 Found ${newMatches.length} additional matches!`);
      console.log('Run: node copy-improved-matches.js to copy these PDFs');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

improvedMatching();
