import { describe, expect, it } from "vitest";
import {
  describeOrcaDepositNote,
  describeOrcaWithdrawNote,
  describeRaydiumDepositNote,
  describeRaydiumWithdrawNote,
} from "./index.js";

describe("lp describe helpers", () => {
  it("includes pool address in deposit/withdraw notes", () => {
    const addr = "Pool111111111111111111111111111111111111111";
    expect(describeOrcaDepositNote(addr)).toContain(addr);
    expect(describeOrcaWithdrawNote(addr)).toContain(addr);
    expect(describeRaydiumDepositNote(addr)).toContain(addr);
    expect(describeRaydiumWithdrawNote(addr)).toContain(addr);
  });
});
