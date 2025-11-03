const fs = require('fs');
const path = require('path');

/**
 * Migration Script: MOCA to MOCAA
* This script replaces all instances of MOCA currency with MOCACA
 * across the entire codebase
 */

// File extensions to process
const EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx', '.json', '.md', '.sol', '.env'];

// Directories to exclude from processing
const EXCLUDE_DIRS = ['node_modules', '.git', '.next', 'build', 'dist', 'cache', 'artifacts'];

// Replacement patterns
const REPLACEMENTS = [
  // Currency symbols and names
  { from: /\bMON\b/g, to: 'MOCA', description: 'Currency symbol MOCA -> MOCA' },
  { from: /\bMon\b/g, to: 'Moca', description: 'Currency naMocaMon -> Moca' },
  { from: /\bmon\b/g, to: 'moca', description: 'Currency lowercmoca mon -> moca' },
  
  // Monad references (keep network names but change currency)
  { frMOCA TokenToken/g, to: 'MOCA Token', descriptiMOCA TokenToken -> MOCA Token' },
  { fromMOCA tokenoken/g, to: 'MOCA token', descriptioMOCA tokentoken -> MOCA token' },
  { MOCA tokensen tokens/g, to: 'MOCA tokens', descrMOCA tokenskenA tokens -> MOCA tokens' },
  
  // Comments and descriptionsGet MOCA tokensensokenCA tokens/g, to: 'Get MOCA tokens'Get MOCA tokenskenstokenOCA tokens -> Get MOCA toDeposit MOCA { from: /Deposit MOCA/g, to: 'DepositDeposit MOCAcription: 'Deposit MOCA -> DepoMOCA balance,
  { from: /MOCA balance/g, to: 'MOCMOCA balance description: 'MOCA balance -> in MOCAalance' },
  { from: /in MOCA/g,in MOCAin MOCA', description: 'inMOCA minimum MOCA' },
  { from: /MOCA minimum/g, MOCA minimuminimum', description: 'MOCA minMOCA maximumA minimum' },
  { from: /MOCA maximumMOCA maximumCA maximum', description: 'MOCA maximum -> MOCA maximum' },
 "MOCA"// Configuration values
  { from: /"MO"MOCA", to: '"MOCA"', descripti'MOCA'String "MOCA" -> "MOCA"' },
  { from: 'MOCA'A'/g, to: "'MOCA'", descrsymbol: "MOCA"MOCA"MOCA' -> 'MOCA'" },
  { from: /symsymbol: "MOCA""MOCA" 'symbol: "MOCA"', descriptsymbol: 'MOCA'MOCA'CA" -> symbol: "MOCA"' },
  { fromsymbol: 'MOCA''MOCA'g, to: "symbol: 'MOCA'", decurrencySymbol: "MOCA"MOCA' -"MOCA"bol: 'MOCA'" },
  { from: /currenccurrencySymbol: "MOCA": 'curre"MOCA"mbol: "MOCA"', description:currencySymbol: 'MOCA'CA" -'MOCA'rencySymbol: "MOCA"' },
  { from: /ccurrencySymbol: 'MOCA'/g, to'MOCA'rrencySymbol: 'MOCA'", description: "currencySymbol: 'MOCA' -> currencySymbol: 'MOCA'" },
  
  // EnvironCURRENCY_SYMBOL=MOCAs (but not the variable names themselves)
  {CURRENCY_SYMBOL=MOCAMBOL=MOCA/g, to: 'CURRENCY_SYMBOL=MOCA'CURRENCY=MOCAn: 'CURRENCY_SYMBOL=MOCA -> CURRENCY_SYCURRENCY=MOCA,
  { from: /CURRENCY=MOCA/g, to: 'CURRENCY=MOCA', description: 'CURRENCY=MOCA -> CURRENCY=MOCA' },
  
  // Code comments
  { from: /\/\/ .*MOCA.*/g, to: (match) => match.re* .*MOCA.*\*\//g, to: (match) => match.replace(/MOCA/g, 'MOCA'), description: 'Block comments with MOCA -> MOCA' },) => match.replace(/MOCA/g, 'MOCA'), description: '* .*MOCA.*/g, to: (match) => match.replace(/MOCA/g, 'MOCA'), description: 'Solidity comments with MOCA -> MOCA' },) => match.replace(/MOCA/g, 'MOCA'), description: 'Solidity comments with MOCA -> MOCA' },
  
  // README and documentation
  { from: /Native currency for Monad Testnet/g,MOCA Tokenive currency for Moca Chain Testnet'MOCA Tokention: 'Documentation update' },
  { from: /MOCA Token/g, to: 'MOCA Token', description: 'MOCA Token -> MOCA Token' },
  
  // Specific patterns to avoid breaking Monad network references
  // We want to keep "Monad Testnet" as network name but change currency
];

// Patterns to exclude (don't replace these)
const EXCLUDE_PATTERNS = [
  /MONAD_/,  // Environment variable prefixes
  /monad-/,  // Network identifiers
  /Monad Testnet/,  // Network names (keep as is)
  /Monad Network/,  // Network names (keep as is)
  /monadexplorer/,  // Explorer URLs
  /testnet-rpc\.monad\.xyz/,  // RPC URLs
];

class MonToMocaMigrator {
  constructor() {
    this.processedFiles = 0;
    this.totalReplacements = 0;
    this.errors = [];
    this.summary = {};
  }

  shouldProcessFile(filePath) {
    // Check if file has valid extension
    const ext = path.extname(filePath);
    if (!EXTENSIONS.includes(ext)) {
      return false;
    }

    // Check if file is in excluded directory
    const relativePath = path.relative(process.cwd(), filePath);
    for (const excludeDir of EXCLUDE_DIRS) {
      if (relativePath.startsWith(excludeDir)) {
        return false;
      }
    }

    return true;
  }

  shouldExcludeReplacement(content, match, index) {
    // Check if this match should be excluded
    for (const excludePattern of EXCLUDE_PATTERNS) {
      // Check surrounding context
      const start = Math.max(0, index - 50);
      const end = Math.min(content.length, index + match.length + 50);
      const context = content.substring(start, end);
      
      if (excludePattern.test(context)) {
        return true;
      }
    }
    return false;
  }

  processFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      let newContent = content;
      let fileReplacements = 0;

      for (const replacement of REPLACEMENTS) {
        const { from, to, description } = replacement;
        
        if (typeof from === 'string') {
          // Simple string replacement
          const matches = (newContent.match(new RegExp(from, 'g')) || []).length;
          if (matches > 0) {
            newContent = newContent.replace(new RegExp(from, 'g'), to);
            fileReplacements += matches;
            
            if (!this.summary[description]) {
              this.summary[description] = 0;
            }
            this.summary[description] += matches;
          }
        } else if (from instanceof RegExp) {
          // Regex replacement with exclusion check
          let match;
          const regex = new RegExp(from.source, from.flags);
          const matches = [];
          
          while ((match = regex.exec(content)) !== null) {
            if (!this.shouldExcludeReplacement(content, match[0], match.index)) {
              matches.push(match);
            }
          }
          
          if (matches.length > 0) {
            // Apply replacements in reverse order to maintain indices
            matches.reverse().forEach(match => {
              const replacement = typeof to === 'function' ? to(match[0]) : to;
              newContent = newContent.substring(0, match.index) + 
                          replacement + 
                          newContent.substring(match.index + match[0].length);
            });
            
            fileReplacements += matches.length;
            
            if (!this.summary[description]) {
              this.summary[description] = 0;
            }
            this.summary[description] += matches.length;
          }
        }
      }

      if (fileReplacements > 0) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`✅ ${filePath}: ${fileReplacements} replacements`);
        this.totalReplacements += fileReplacements;
      }

      this.processedFiles++;
    } catch (error) {
      this.errors.push({ file: filePath, error: error.message });
      console.error(`❌ Error processing ${filePath}:`, error.message);
    }
  }

  walkDirectory(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        // Skip excluded directories
        if (!EXCLUDE_DIRS.includes(file)) {
          this.walkDirectory(filePath);
        }
      } else if (stat.isFile()) {
        if (this.shouldProcessFile(filePath)) {
          this.processFile(filePath);
        }
      }
    }
  }

  run() {
    console.log('🚀 Starting MOCA to MOCA migration...');
    console.log('📁 Processing files in:', process.cwd());
    console.log('🔍 File extensions:', EXTENSIONS.join(', '));
    console.log('🚫 Excluding directories:', EXCLUDE_DIRS.join(', '));
    console.log('');

    const startTime = Date.now();
    
    this.walkDirectory(process.cwd());
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    console.log('\n🎉 Migration completed!');
    console.log(`📊 Summary:`);
    console.log(`   - Files processed: ${this.processedFiles}`);
    console.log(`   - Total replacements: ${this.totalReplacements}`);
    console.log(`   - Duration: ${duration.toFixed(2)}s`);
    
    if (Object.keys(this.summary).length > 0) {
      console.log('\n📋 Replacement breakdown:');
      for (const [description, count] of Object.entries(this.summary)) {
        console.log(`   - ${description}: ${count}`);
      }
    }

    if (this.errors.length > 0) {
      console.log('\n❌ Errors:');
      for (const error of this.errors) {
        console.log(`   - ${error.file}: ${error.error}`);
      }
    }

    console.log('\n✅ All MOCA references have been migrated to MOCA!');
    console.log('🔍 Please review the changes and test the application.');
  }
}

// Run migration if called directly
if (require.main === module) {
  const migrator = new MonToMocaMigrator();
  migrator.run();
}

module.exports = MonToMocaMigrator;