const { ethers } = require('ethers');

// Common Pyth Entropy errors
const commonErrors = [
  'InsufficientFee()',
  'InvalidProvider()',
  'InvalidRandomNumber()',
  'RequestNotFound()',
  'RequestAlreadyFulfilled()',
  'UnauthorizedProvider()',
  'InvalidCommitment()',
  'CommitmentTooOld()',
  'CommitmentTooNew()',
  'InvalidSequenceNumber()',
  'InsufficientBalance()',
  'TransferFailed()',
  'InvalidAddress()',
  'ZeroAddress()',
  'InvalidFee()',
  'FeeNotPaid()',
  'InvalidRequest()',
  'RequestExpired()',
  'InvalidCallback()',
  'CallbackFailed()'
];

const targetError = '0xdf51c431';
console.log('Looking for error signature:', targetError);
console.log('');

for (const error of commonErrors) {
  const signature = ethers.id(error).slice(0, 10);
  console.log(`${error}: ${signature}`);
  if (signature === targetError) {
    console.log(`*** MATCH FOUND: ${error} ***`);
  }
}

// Also check if it's a known Solidity panic code
const panicCodes = {
  '0x01': 'Assertion failed',
  '0x11': 'Arithmetic overflow/underflow',
  '0x12': 'Division by zero',
  '0x21': 'Invalid enum value',
  '0x22': 'Invalid storage byte array access',
  '0x31': 'Pop on empty array',
  '0x32': 'Array index out of bounds',
  '0x41': 'Out of memory',
  '0x51': 'Invalid function selector'
};

console.log('\nChecking if it\'s a panic code...');
const errorData = targetError.slice(2);
if (panicCodes[errorData]) {
  console.log(`Panic code found: ${panicCodes[errorData]}`);
}