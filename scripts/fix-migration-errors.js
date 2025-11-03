const fs = require('fs');
const path = require('path');

/**
 * Fix Migration Errors Script
 * Fixes syntax errors caused by the migration script
 */

const FIXES = [
  // Fix double quotes in strings
  { from: /MOCA/g, to: 'MOCA' },
  { from: /MOCA/g, to: 'MOCA' },
  { from: /'MOCA/g, to: "'MOCA'" },
  { from: /"MOCA"/g, to: '"MOCA"' },
  
  // Fix broken object properties
  { from: /description: "Earn rewards in MOCA/g, to: 'description: "Earn rewards in MOCA' },
  { from: /symbol: "MOCA"/g, to: 'symbol: "MOCA"' },
  { from: /name: "MOCA"/g, to: 'name: "MOCA"' },
  
  // Fix broken template literals
  { from: /\$\{.*MOCA.*\}MOCA/g, to: (match) => match.replace(/MOCA$/, '') },
  
  // Fix console.log statements
  { from: /'MOCA'\s*'/g, to: "'MOCA'" },
  { from: /"MOCA"\s*"/g, to: '"MOCA"' },
];

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    
    for (const fix of FIXES) {
      const originalContent = content;
      content = content.replace(fix.from, fix.to);
      if (content !== originalContent) {
        changed = true;
      }
    }
    
    if (changed) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

function walkDirectory(dir) {
  const files = fs.readdirSync(dir);
  let fixedCount = 0;
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!['node_modules', '.git', '.next', 'build', 'dist'].includes(file)) {
        fixedCount += walkDirectory(filePath);
      }
    } else if (stat.isFile()) {
      const ext = path.extname(filePath);
      if (['.js', '.jsx', '.ts', '.tsx'].includes(ext)) {
        if (fixFile(filePath)) {
          fixedCount++;
        }
      }
    }
  }
  
  return fixedCount;
}

console.log('🔧 Fixing migration errors...');
const fixedCount = walkDirectory(process.cwd());
console.log(`\n✅ Fixed ${fixedCount} files`);

// Also fix the migration script itself
const migrationScriptPath = path.join(__dirname, 'migrate-mon-to-moca.js');
if (fs.existsSync(migrationScriptPath)) {
  console.log('\n🔧 Fixing migration script...');
  let content = fs.readFileSync(migrationScriptPath, 'utf8');
  
  // Fix the broken replacement patterns
  const fixedContent = content.replace(
    /\{ from: .*MOCA.*MOCA.*\}/g,
    '{ from: /MON/g, to: "MOCA", description: "Currency symbol MON -> MOCA" }'
  );
  
  if (content !== fixedContent) {
    fs.writeFileSync(migrationScriptPath, fixedContent, 'utf8');
    console.log('✅ Fixed migration script');
  }
}