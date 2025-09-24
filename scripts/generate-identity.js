import { Ed25519KeyIdentity } from '@icp-sdk/core/identity';

// Using to generate backend identity
// Run this script with: node scripts/generate-identity.js
// It will output a new private key to be used in your .env file
async function generateIdentity() {
  try {
    const identity = Ed25519KeyIdentity.generate();
    const keyPair = identity.getKeyPair();
    const privateKeyHex = Buffer.from(keyPair.secretKey).toString('hex');
    const publicKeyHex = Buffer.from(keyPair.publicKey.toRaw()).toString('hex');

    console.log('=== Backend Identity Generated ===');
    console.log('Principal:', identity.getPrincipal().toString());
    console.log('');
    console.log('Add this to your .env file:');
    console.log(`BACKEND_PRIVATE_KEY=${privateKeyHex}`);
    console.log('');
    console.log('Public Key (for reference):');
    console.log(`${publicKeyHex}`);
    console.log('');
    console.log('⚠️  Keep the private key secure and never commit it to version control!');
  } catch (error) {
    console.error('Failed to generate identity:', error);
    process.exit(1);
  }
}

generateIdentity();
