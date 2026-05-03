// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title FeeVault
/// @notice Placeholder ERC-4626–style vault shell: stores an immutable underlying `asset`.
/// @dev Production should inherit OpenZeppelin ERC4626 (see `contracts/evm/README.md`). There are no deposit/share methods here—integrations must not rely on this for custody until upgraded.
contract FeeVault {
    /// @notice Underlying ERC-20 (or mono-asset accounting address) tracked by future vault logic (`asset()` matches ERC-4626 getter name).
    // forge-lint: disable-next-line(screaming-snake-case-immutable)
    address public immutable asset;

    error ZeroAddress();

    /// @notice Binds this vault shell to underlying `asset_`.
    /// @param asset_ Token accounted as vault asset — must not be zero.
    constructor(address asset_) {
        if (asset_ == address(0)) revert ZeroAddress();
        asset = asset_;
    }
}

/// @title FeeSplitter
/// @notice Routes bridged swap fees toward a nominated buyback vault (WAVES roadmap: treasury split layering).
/// @dev Current implementation only stores destination; payout/oracle orchestration belongs in a later iteration. **`buybackVault` is fixed after deployment** in this stub (no setter); changing the sink requires a new `FeeSplitter` or a future governed upgrade.
/// @custom:access-control Constructors reject zero-address vaults. Anyone can observe `buybackVault`; no privileged functions yet, so privileged fee movement must occur in sibling contracts yet to be added.
contract FeeSplitter {
    /// @notice Primary sink for routed fee assets pending buyback mechanics (immutable for this deployment).
    address public buybackVault;

    error ZeroAddress();

    /// @notice Stores `buybackVault_` as the fee routing destination for this deployment.
    /// @param buybackVault_ Initial fee sink — non-zero buyback treasury or vault backend.
    constructor(address buybackVault_) {
        if (buybackVault_ == address(0)) revert ZeroAddress();
        buybackVault = buybackVault_;
    }
}
