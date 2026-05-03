// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";

import {RawSwapToken} from "../src/RawSwapToken.sol";

contract RawSwapTokenTest is Test {
    RawSwapToken internal token;
    address internal minter = address(0xBEEF);
    address internal user = address(0xCAFE);

    function setUp() public {
        token = new RawSwapToken(minter);
    }

    function testMetadata() public view {
        assertEq(token.name(), "RawSwap");
        assertEq(token.symbol(), "RAWSWAP");
        assertEq(token.decimals(), uint8(9));
        assertEq(token.minter(), minter);
    }

    function testConstructorRejectsZeroMinter() public {
        vm.expectRevert(RawSwapToken.ZeroAddress.selector);
        new RawSwapToken(address(0));
    }

    function testMintBurnFlow() public {
        vm.prank(minter);
        token.mint(user, 1_000);

        assertEq(token.balanceOf(user), 1_000);
        assertEq(token.totalSupply(), 1_000);

        vm.prank(minter);
        token.burn(user, 400);

        assertEq(token.balanceOf(user), 600);
        assertEq(token.totalSupply(), 600);
    }

    function testMintTransfersFromZeroEmit() public {
        vm.expectEmit(true, true, true, true, address(token));
        emit RawSwapToken.Transfer(address(0), user, 100);

        vm.prank(minter);
        token.mint(user, 100);
    }

    function testBurnTransfersToZeroEmit() public {
        vm.prank(minter);
        token.mint(user, 500);

        vm.expectEmit(true, true, true, true, address(token));
        emit RawSwapToken.Transfer(user, address(0), 200);

        vm.prank(minter);
        token.burn(user, 200);
    }

    function testNonMinterMintReverts() public {
        vm.prank(user);
        vm.expectRevert(RawSwapToken.Unauthorized.selector);
        token.mint(user, 1);
    }

    function testNonMinterSetMinterReverts() public {
        vm.prank(user);
        vm.expectRevert(RawSwapToken.Unauthorized.selector);
        token.setMinter(address(0x111));
    }

    function testConstructorEmitsMinterTransferred() public {
        vm.expectEmit(true, true, true, true);
        emit RawSwapToken.MinterTransferred(address(0), minter);
        new RawSwapToken(minter);
    }

    function testSetMinterEmitsMinterTransferred() public {
        address successor = address(0xAAA);

        vm.expectEmit(true, true, true, true, address(token));
        emit RawSwapToken.MinterTransferred(minter, successor);

        vm.prank(minter);
        token.setMinter(successor);
    }

    function testNonMinterBurnReverts() public {
        vm.prank(minter);
        token.mint(user, 10);

        vm.prank(address(0xBAD));
        vm.expectRevert(RawSwapToken.Unauthorized.selector);
        token.burn(user, 5);
    }

    function testMintToZeroReverts() public {
        vm.prank(minter);
        vm.expectRevert(RawSwapToken.ZeroAddress.selector);
        token.mint(address(0), 1);
    }

    function testBurnFromZeroReverts() public {
        vm.prank(minter);
        vm.expectRevert(RawSwapToken.ZeroAddress.selector);
        token.burn(address(0), 1);
    }

    function testBurnExceedsBalanceReverts() public {
        vm.prank(minter);
        token.mint(user, 5);

        vm.prank(minter);
        vm.expectRevert(RawSwapToken.BurnExceedsBalance.selector);
        token.burn(user, 100);
    }

    function testSetMinterRotatesPrivileges() public {
        address successor = address(0xAAA);

        vm.prank(minter);
        token.setMinter(successor);
        assertEq(token.minter(), successor);

        vm.prank(minter);
        vm.expectRevert(RawSwapToken.Unauthorized.selector);
        token.mint(user, 1);

        vm.prank(successor);
        token.mint(user, 1);
        assertEq(token.balanceOf(user), 1);
    }

    function testRenounceMinterLocksMintingForeverOnThisImplementation() public {
        vm.prank(minter);
        token.setMinter(address(0));
        assertEq(token.minter(), address(0));

        vm.expectRevert(RawSwapToken.Unauthorized.selector);
        token.mint(address(this), 1);
    }
}
