const fs = require('fs');
const path = require('path');

/**
 * Test Script: Moca Chain Migration
 * Tests if the migration from Monad to Moca Chain was successful
 */

class MocaMigrationTester {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  test(description, testFn) {
    this.tests.push({ description, testFn });
  }

  async run() {
    console.log('🧪 Testing Moca Chain Migration...\n');

    for (const { description, testFn } of this.tests) {
      try {
        await testFn();
        console.log(`✅ ${description}`);
        this.passed++;
      } catch (error) {
        console.log(`❌ ${description}`);
        console.log(`   Error: ${error.message}`);
        this.failed++;
      }
    }

    console.log(`\n📊 Test Results:`);
    console.log(`   Passed: ${this.passed}`);
    console.log(`   Failed: ${this.failed}`);
    console.log(`   Total: ${this.tests.length}`);

    if (this.failed === 0) {
      console.log('\n🎉 All tests passed! Migration successful!');
    } else {
      console.log('\n⚠️ Some tests failed. Please review the errors above.');
    }
  }

  readFile(filePath) {
    try {
      return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
      throw new Error(`Could not read file ${filePath}: ${error.message}`);
    }
  }

  checkFileContains(filePath, content, shouldContain = true) {
    const fileContent = this.readFile(filePath);
    const contains = fileContent.includes(content);
    
    if (shouldContain && !contains) {
      throw new Error(`File ${filePath} should contain "${content}" but doesn't`);
    }
    
    if (!shouldContain && contains) {
      throw new Error(`File ${filePath} should not contain "${content}" but does`);
    }
  }

  checkEnvVariable(varName, expectedValue = null) {
    const envContent = this.readFile('.env');
    const regex = new RegExp(`^${varName}=(.*)$`, 'm');
    const match = envContent.match(regex);
    
    if (!match) {
      throw new Error(`Environment variable ${varName} not found in .env`);
    }
    
    if (expectedValue && match[1] !== expectedValue) {
      throw new Error(`Environment variable ${varName} has value "${match[1]}" but expected "${expectedValue}"`);
    }
  }
}

// Create test instance
const tester = new MocaMigrationTester();

// Test 1: Check chain configuration
tester.test('Moca Chain configuration is correct', () => {
  tester.checkFileContains('src/config/chains.js', 'Moca Chain Testnet');
  tester.checkFileContains('src/config/chains.js', 'id: 222888');
  tester.checkFileContains('src/config/chains.js', 'symbol: \'MOCA\'');
  tester.checkFileContains('src/config/chains.js', 'https://testnet-rpc.mocachain.org/');
});

// Test 2: Check treasury configuration
tester.test('Treasury configuration updated for Moca Chain', () => {
  tester.checkFileContains('src/config/treasury.js', 'Moca Chain Testnet');
  tester.checkFileContains('src/config/treasury.js', 'MOCA_TREASURY_ADDRESS');
  tester.checkFileContains('src/config/treasury.js', 'ARBITRUM_TREASURY_ADDRESS');
  tester.checkFileContains('src/config/treasury.js', '0x36668'); // Moca Chain ID in hex
});

// Test 3: Check environment variables
tester.test('Environment variables configured correctly', () => {
  tester.checkEnvVariable('NEXT_PUBLIC_CHAIN_ID', '222888');
  tester.checkEnvVariable('NEXT_PUBLIC_NETWORK', 'moca-testnet');
  tester.checkEnvVariable('NEXT_PUBLIC_MOCA_TESTNET_RPC');
  tester.checkEnvVariable('ARBITRUM_TREASURY_ADDRESS');
});

// Test 4: Check API endpoints
tester.test('Deposit API updated for Moca Chain', () => {
  tester.checkFileContains('src/app/api/deposit/route.js', 'MOCA_TREASURY_ADDRESS');
  tester.checkFileContains('src/app/api/deposit/route.js', 'MOCA from');
  tester.checkFileContains('src/app/api/deposit/route.js', 'Moca Treasury');
});

tester.test('Withdraw API updated for Moca Chain', () => {
  tester.checkFileContains('src/app/api/withdraw/route.js', 'MOCA_TREASURY_PRIVATE_KEY');
  tester.checkFileContains('src/app/api/withdraw/route.js', 'MOCA_TESTNET_RPC');
  tester.checkFileContains('src/app/api/withdraw/route.js', 'Moca Chain Explorer');
});

// Test 5: Check entropy configuration
tester.test('Entropy configuration updated for Arbitrum Sepolia', () => {
  tester.checkFileContains('src/config/pythEntropy.js', 'Arbitrum Sepolia');
  tester.checkFileContains('src/config/pythEntropy.js', 'chainId: 421614');
  tester.checkFileContains('src/config/pythEntropy.js', 'arbitrum-sepolia');
  tester.checkFileContains('src/app/api/generate-entropy/route.js', 'ARBITRUM_SEPOLIA_RPC');
});

// Test 6: Check contract configuration
tester.test('Contract configuration updated', () => {
  tester.checkFileContains('src/config/contracts.js', 'MOCA_TESTNET');
  tester.checkFileContains('src/config/contracts.js', 'ARBITRUM_SEPOLIA');
  tester.checkFileContains('src/config/contracts.js', 'Moca Chain Testnet');
});

// Test 7: Check hardhat configuration
tester.test('Hardhat configuration updated', () => {
  tester.checkFileContains('hardhat.config.js', 'moca-testnet');
  tester.checkFileContains('hardhat.config.js', 'chainId: 222888');
  tester.checkFileContains('hardhat.config.js', 'MOCA_TREASURY_PRIVATE_KEY');
});

// Test 8: Check package.json scripts
tester.test('Package.json scripts updated', () => {
  tester.checkFileContains('package.json', 'deploy:moca');
  tester.checkFileContains('package.json', 'test:moca');
  tester.checkFileContains('package.json', 'deploy:entropy-arb');
});

// Test 9: Check README updates
tester.test('README updated for Moca Chain', () => {
  tester.checkFileContains('README.md', 'Moca Chain Testnet');
  tester.checkFileContains('README.md', 'MOCA Token');
  tester.checkFileContains('README.md', 'Chain ID: 222888');
  tester.checkFileContains('README.md', 'testnet-rpc.mocachain.org');
});

// Test 10: Check that old Monad references are removed (where appropriate)
tester.test('Old Monad references cleaned up', () => {
  // These files should not contain MON currency references anymore
  const filesToCheck = [
    'src/config/chains.js',
    'src/config/treasury.js',
    'src/app/api/deposit/route.js'
  ];
  
  for (const file of filesToCheck) {
    try {
      // Check that MON currency symbol is not present (but Monad network names are OK)
      const content = tester.readFile(file);
      const hasMonCurrency = /symbol:\s*['"]MON['"]/.test(content) || 
                            /currency:\s*['"]MON['"]/.test(content) ||
                            /MON\s+token/i.test(content);
      
      if (hasMonCurrency) {
        throw new Error(`File ${file} still contains MON currency references`);
      }
    } catch (error) {
      if (!error.message.includes('Could not read file')) {
        throw error;
      }
    }
  }
});

// Test 11: Check contract files
tester.test('New Moca Casino contract exists', () => {
  const contractExists = fs.existsSync('contracts/MocaCasinoContract.sol');
  if (!contractExists) {
    throw new Error('MocaCasinoContract.sol not found');
  }
  
  tester.checkFileContains('contracts/MocaCasinoContract.sol', 'MocaCasinoContract');
  tester.checkFileContains('contracts/MocaCasinoContract.sol', 'Moca Chain Testnet');
  tester.checkFileContains('contracts/MocaCasinoContract.sol', 'MOCA tokens');
});

// Test 12: Check deployment scripts
tester.test('Deployment scripts updated', () => {
  const deployScriptExists = fs.existsSync('scripts/deploy-moca-casino.js');
  if (!deployScriptExists) {
    throw new Error('deploy-moca-casino.js not found');
  }
  
  tester.checkFileContains('scripts/deploy-moca-casino.js', 'Moca Chain Testnet');
  tester.checkFileContains('scripts/deploy-moca-casino.js', 'MOCA_TREASURY_ADDRESS');
});

// Run all tests
tester.run().catch(console.error);