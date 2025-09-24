> **⚠️ Important: DFINITY SDK Package Versions**
> 
> This project uses specific pinned versions of DFINITY-related packages due to compatibility issues with newer releases. Do not update these packages without testing thoroughly.

#### Pinned DFINITY Package Versions
The following packages are locked to specific versions to ensure compatibility:

```json
{
  "@dfinity/agent": "3.1.0",
  "@dfinity/candid": "3.1.0", 
  "@dfinity/ic-management": "7.0.1",
  "@dfinity/identity": "3.1.0",
  "@dfinity/identity-secp256k1": "3.1.0",
  "@dfinity/principal": "3.1.0",
  "@dfinity/utils": "3.1.0"
}
```

**Why these versions are pinned:**
- Newer versions may cause certificate delegation errors
- Common error: `The certificate contains a delegation that does not include the canister aaaaa-aa in the canister ranges field`
- These versions have been tested and confirmed to work with the current ICP network configuration

**Reference:** [https://forum.dfinity.org/t/error-the-certificate-contains-a-delegation-that-does-not-include-the-canister-aaaaa-aa-in-the-canister-ranges-field/57766]