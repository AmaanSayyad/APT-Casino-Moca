const { ethers } = require('ethers');

// Let's try to decode the error 0xdf51c431
// This might be a custom error from Pyth Entropy contract

async function decodePythError() {
  // Common Pyth Entropy errors based on their documentation
  const pythErrors = [
    'InvalidProvider()',
    'InsufficientFee()',
    'InvalidRandomNumber()',
    'ProviderNotRegistered()',
    'ProviderNotActive()',
    'InvalidCommitment()',
    'CommitmentTooOld()',
    'CommitmentTooNew()',
    'RequestNotFound()',
    'RequestAlreadyFulfilled()',
    'UnauthorizedProvider()',
    'InvalidSequenceNumber()',
    'CallbackFailed()',
    'InvalidCallback()',
    'InsufficientBalance()',
    'TransferFailed()',
    'InvalidAddress()',
    'ZeroAddress()',
    'InvalidFee()',
    'FeeNotPaid()',
    'InvalidRequest()',
    'RequestExpired()',
    'ProviderRevealPeriodExpired()',
    'ProviderRevealPeriodNotExpired()',
    'ProviderCommitmentNotFound()',
    'ProviderCommitmentAlreadyRevealed()',
    'ProviderInvalidReveal()',
    'ProviderInsufficientFee()',
    'ProviderNotAuthorized()',
    'ProviderAlreadyRegistered()',
    'ProviderNotRegistered()',
    'ProviderInactive()',
    'ProviderActive()',
    'ProviderInvalidCommitment()',
    'ProviderCommitmentTooOld()',
    'ProviderCommitmentTooNew()',
    'ProviderInvalidSequenceNumber()',
    'ProviderCallbackFailed()',
    'ProviderInvalidCallback()',
    'ProviderInsufficientBalance()',
    'ProviderTransferFailed()',
    'ProviderInvalidAddress()',
    'ProviderZeroAddress()',
    'ProviderInvalidFee()',
    'ProviderFeeNotPaid()',
    'ProviderInvalidRequest()',
    'ProviderRequestExpired()'
  ];

  const targetError = '0xdf51c431';
  console.log('Looking for error signature:', targetError);
  console.log('');

  for (const error of pythErrors) {
    const signature = ethers.id(error).slice(0, 10);
    if (signature === targetError) {
      console.log(`*** MATCH FOUND: ${error} ***`);
      return;
    }
  }

  // If not found, let's try some other possibilities
  console.log('Error not found in common Pyth errors.');
  console.log('This might be a custom error specific to the provider or contract state.');
  
  // Let's check if it could be related to provider issues
  console.log('\nPossible causes based on our analysis:');
  console.log('1. Invalid provider address (we found this issue!)');
  console.log('2. Provider not registered with Pyth Entropy');
  console.log('3. Provider not active');
  console.log('4. Insufficient fee for the specific provider');
  console.log('5. Provider-specific validation failure');
}

decodePythError();