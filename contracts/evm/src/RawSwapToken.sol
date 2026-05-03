// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title RawSwapToken
/// @notice Spoke-chain mint/burn token with a single privileged `minter`.
/// @dev Holds no bridge/oracle logic itself; the roadmap assumes an N(tt)Manager holds `minter`.
///      This is **not** full ERC-20: there are no `transfer`, `transferFrom`, or `approve`; balances change only via `mint` / `burn` from `minter`. Wallets and aggregators expecting standard ERC-20 **will fail** until you wrap or upgrade.
/// @custom:access-control Anyone can view token state. Only `minter` may `mint`, `burn`, or `setMinter`. There is **no timelock** and **no multi-sig** at the token layer: whatever holds `minter` controls supply. Compromise enables unlimited mint and arbitrary `burn` on holders. Passing `address(0)` to `setMinter` renounces permanently (no successor `minter` can ever be chosen); document sequencing for mainnet.
contract RawSwapToken {
    /// @notice Human-readable ERC-20-style name used by explorers and tooling (`name()` — intentionally lowercamel for ABI compatibility).
    // forge-lint: disable-next-line(screaming-snake-case-const)
    string public constant name = "RawSwap";
    /// @notice ERC-20-style symbol (`symbol()` — intentionally lowercamel for ABI compatibility).
    // forge-lint: disable-next-line(screaming-snake-case-const)
    string public constant symbol = "RAWSWAP";
    /// @notice Fractional subdivision (nine decimals fits typical app precision for this vault model).
    // forge-lint: disable-next-line(screaming-snake-case-const)
    uint8 public constant decimals = 9;

    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;

    /// @notice The sole address authorised to mutate supply and rotate `minter`.
    address public minter;

    error Unauthorized();
    error ZeroAddress();
    error BurnExceedsBalance();

    /// @notice Emitted when `minter` is rotated to `newMinter`.
    event MinterTransferred(address indexed previousMinter, address indexed newMinter);
    /// @notice Mint emits `Transfer` from `address(0)`; burn emits to `address(0)` — mirrors ERC-20 event layout for indexing.
    event Transfer(address indexed from, address indexed to, uint256 value);

    /// @notice Deploys the token and assigns `initialMinter`.
    /// @dev Emits `MinterTransferred(address(0), initialMinter)` so indexers see the same event shape as `setMinter`.
    /// @param initialMinter The first privileged minter — must not be zero.
    constructor(address initialMinter) {
        if (initialMinter == address(0)) revert ZeroAddress();
        emit MinterTransferred(address(0), initialMinter);
        minter = initialMinter;
    }

    /// @notice Rotate minter privileges to `next`, or permanently renounce when `next` is `address(0)` (irreversible here).
    /// @param next New minter, or `address(0)` to renounce mint/burn/setMinter forever on this deployment.
    function setMinter(address next) external {
        if (msg.sender != minter) revert Unauthorized();
        emit MinterTransferred(minter, next);
        minter = next;
    }

    /// @notice Increase `to` balance and total supply by `amount`. Caller must be `minter`.
    /// @param to Recipient; must not be `address(0)`.
    /// @param amount Token amount in raw units (`decimals` fixed at 9).
    function mint(address to, uint256 amount) external {
        if (msg.sender != minter) revert Unauthorized();
        if (to == address(0)) revert ZeroAddress();
        balanceOf[to] += amount;
        totalSupply += amount;
        emit Transfer(address(0), to, amount);
    }

    /// @notice Decrease `from` balance and total supply by `amount`. Caller must be `minter`.
    /// @dev Reverts when `from` holds less than `amount`. Does not mutate allowance (non-ERC20).
    /// @param from Account debited; must not be `address(0)`.
    /// @param amount Token amount in raw units.
    function burn(address from, uint256 amount) external {
        if (msg.sender != minter) revert Unauthorized();
        if (from == address(0)) revert ZeroAddress();
        uint256 b = balanceOf[from];
        if (b < amount) revert BurnExceedsBalance();
        unchecked {
            balanceOf[from] = b - amount;
            totalSupply -= amount;
        }
        emit Transfer(from, address(0), amount);
    }
}
