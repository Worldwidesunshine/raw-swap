import { describe, expect, it } from "vitest";
import { ExtensionType } from "@solana/spl-token";
import { blockedToken2022Extensions, token2022ExtensionNames } from "./token-risk.js";

describe("token risk helpers", () => {
  it("maps supported Token-2022 extensions to config names", () => {
    expect(
      token2022ExtensionNames([
        ExtensionType.TransferFeeConfig,
        ExtensionType.TransferHook,
        ExtensionType.PermanentDelegate,
      ]),
    ).toEqual(["transferFee", "transferHook", "permanentDelegate"]);
  });

  it("filters extensions against the blocked policy list", () => {
    expect(
      blockedToken2022Extensions(
        [
          ExtensionType.TransferFeeConfig,
          ExtensionType.PermanentDelegate,
          ExtensionType.MetadataPointer,
        ],
        ["transferFee", "transferHook"],
      ),
    ).toEqual(["transferFee"]);
  });
});
