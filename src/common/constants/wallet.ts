export const WALLET_RESPONSE_MESSAGE = {
  CREATE_WALLET_SUCCESS: 'Wallet created successfully',
  DELETE_WALLET_SUCCESS: (canisterId: string) =>
    `Wallet ${canisterId} deleted successfully`,
};
