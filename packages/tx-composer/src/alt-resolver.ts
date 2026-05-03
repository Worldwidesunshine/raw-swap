import { AddressLookupTableAccount, PublicKey } from "@solana/web3.js";

/**
 * Jupiter V2 `/build` returns `addressesByLookupTableAddress` as map: lutPubkey -> ordered address pubkeys.
 */
export function lookupTablesFromJupiterMap(
  map: Record<string, string[]> | undefined,
): AddressLookupTableAccount[] {
  if (!map) return [];
  return Object.entries(map).map(
    ([lutKey, addresses]) =>
      new AddressLookupTableAccount({
        key: new PublicKey(lutKey),
        state: {
          deactivationSlot: BigInt("18446744073709551615"),
          lastExtendedSlot: 0,
          lastExtendedSlotStartIndex: 0,
          authority: undefined,
          addresses: addresses.map((a) => new PublicKey(a)),
        },
      }),
  );
}
