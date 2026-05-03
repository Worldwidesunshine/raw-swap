// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";

import {FeeSplitter, FeeVault} from "../src/FeeVault.sol";

contract FeeVaultContractsTest is Test {
    address internal asset = address(0xAAA1);
    address internal vaultSink = address(0xBBB2);

    function testFeeVaultStoresAsset() public {
        FeeVault fv = new FeeVault(asset);
        assertEq(fv.asset(), asset);
    }

    function testFeeVaultRejectsZeroAsset() public {
        vm.expectRevert(FeeVault.ZeroAddress.selector);
        new FeeVault(address(0));
    }

    function testFeeSplitterStoresBuybackVault() public {
        FeeSplitter fs = new FeeSplitter(vaultSink);
        assertEq(fs.buybackVault(), vaultSink);
    }

    function testFeeSplitterRejectsZeroVault() public {
        vm.expectRevert(FeeSplitter.ZeroAddress.selector);
        new FeeSplitter(address(0));
    }
}
