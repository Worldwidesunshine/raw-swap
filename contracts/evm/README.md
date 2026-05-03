# Foundry (Waves 11–12, 16–17)

## Toolchain

Install the Foundry CLI (`forge`, `cast`, …) so `forge` is on your `PATH`:

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

If you use Docker and prefer not to install locally:

```bash
docker run --rm -v "$(pwd)":/workspace -w /workspace ghcr.io/foundry-rs/foundry:stable "forge build"
docker run --rm -v "$(pwd)":/workspace -w /workspace ghcr.io/foundry-rs/foundry:stable "forge test -vv"
```

Run these from `contracts/evm` (adjust `-v` / `-w` to mount that directory).

## Dependencies

Clone this repo fresh, then from `contracts/evm`:

```bash
forge install foundry-rs/forge-std --no-commit
forge install OpenZeppelin/openzeppelin-contracts@v5.0.2 --no-commit
```

That creates `lib/forge-std` and `lib/openzeppelin-contracts` and matches `remappings.txt`. If you prefer submodules, use the same paths under `lib/`.

**Exact versions (reproducible builds):**

- `forge-std`: any recent tag works with this project; `forge install` pins the latest compatible checkout.
- `openzeppelin-contracts`: **v5.0.2** (declared here for future ERC-4626 integration on `FeeVault`).

If `forge install` fails with a missing dependency tree, run `forge install` from `contracts/evm` only (same paths as above).

## Build & test

```bash
cd contracts/evm
forge build
forge test -vv
```

`foundry.toml` sets `deny_warnings = true` for the compiler. `forge build` may still print **forge-lint** notes; ERC-20-style `name` / `symbol` / `decimals` and ERC-4626-style `asset` intentionally keep lowercase ABI names—with inline `forge-lint: disable-next-line(...)` comments in source where applicable.

`cache/`, `out/`, and `broadcast/` are listed in `.gitignore`. Core sources stay under `src/`; dependency sources live under `lib/` (normally not vendored—install per above).

Deploy scripts: add `script/DeployToken.s.sol` after installing `forge-std`.

## Contracts overview

| Contract        | Risk note |
|----------------|-----------|
| `RawSwapToken` | Single-address `minter` has full monetary policy; renounce (`setMinter(address(0))`) is irreversible. Mint/burn only—no ERC-20 `transfer`/`approve`; use separate adapter contracts if routers need allowances. |
| `FeeVault`     | Skeleton only—not a custodial ERC-4626 until upgraded with OpenZeppelin. |
| `FeeSplitter` | Stores routing destination only; no fund-moving logic yet; `buybackVault` is set in the constructor only in this stub. |

### Access control (summary)

- **`RawSwapToken`**: `minter` may `mint`, `burn`, and `setMinter`. No other roles. After renounce to `address(0)`, no account can call `mint` / `burn` / `setMinter` on this deployment.
- **`FeeVault` / `FeeSplitter`**: No privileged functions in these stubs; only constructor validation (non-zero addresses).

## Mainnet readiness (still missing)

Treat this folder as **pre-production** until at least:

1. **Independent audit** of token economics, minter compromise paths, and any future bridge/manager code.
2. **`minter` governance**: operational policy for multisig, timelock, key rotation, and emergency procedures (this repo does not implement multisig/timelock on-chain).
3. **Product decision on ERC-20**: either document “mint-only” integrations clearly or ship an ERC-20 wrapper/upgrade path for DEX/router compatibility.
4. **Fee stack**: replace `FeeVault` / `FeeSplitter` stubs with audited vault + routing (e.g. OpenZeppelin ERC-4626 and explicit fee pull/push).
5. **Deployment runhooks**: verified bytecode, constructor args, monitoring, and incident playbooks.

Before mainnet: complete items above, plus legal/compliance review appropriate to your jurisdiction.
