import { ExtensionType } from "@solana/spl-token";

const EXTENSION_NAME_BY_TYPE: Partial<Record<ExtensionType, string>> = {
  [ExtensionType.TransferFeeConfig]: "transferFee",
  [ExtensionType.MintCloseAuthority]: "mintCloseAuthority",
  [ExtensionType.DefaultAccountState]: "defaultAccountState",
  [ExtensionType.MemoTransfer]: "memoTransfer",
  [ExtensionType.NonTransferable]: "nonTransferable",
  [ExtensionType.InterestBearingConfig]: "interestBearingConfig",
  [ExtensionType.TransferHook]: "transferHook",
  [ExtensionType.PermanentDelegate]: "permanentDelegate",
  [ExtensionType.MetadataPointer]: "metadataPointer",
  [ExtensionType.TokenMetadata]: "tokenMetadata",
  [ExtensionType.GroupPointer]: "groupPointer",
  [ExtensionType.TokenGroup]: "tokenGroup",
  [ExtensionType.GroupMemberPointer]: "groupMemberPointer",
  [ExtensionType.TokenGroupMember]: "tokenGroupMember",
  [ExtensionType.ScaledUiAmountConfig]: "scaledUiAmountConfig",
  [ExtensionType.PausableConfig]: "pausableConfig",
  [ExtensionType.ConfidentialTransferMint]: "confidentialTransferMint",
  [ExtensionType.ConfidentialTransferAccount]: "confidentialTransferAccount",
};

export function token2022ExtensionNames(extensionTypes: ExtensionType[]): string[] {
  return [
    ...new Set(
      extensionTypes.flatMap((extension) => {
        const name = EXTENSION_NAME_BY_TYPE[extension];
        return name ? [name] : [];
      }),
    ),
  ];
}

export function blockedToken2022Extensions(
  extensionTypes: ExtensionType[],
  blockedExtensions: string[],
): string[] {
  const blocked = new Set(blockedExtensions);
  return token2022ExtensionNames(extensionTypes).filter((extension) => blocked.has(extension));
}
