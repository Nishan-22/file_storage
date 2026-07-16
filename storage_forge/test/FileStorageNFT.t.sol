// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/FileStorageNFT.sol";

contract FileStorageNFTTest is Test {
    FileStorageNFT nft;
    address user = makeAddr("user");

    function setUp() public {
        nft = new FileStorageNFT();
    }

    function testDeployment() public {
        assertEq(nft.tokenCounter(), 0);
    }

    function testUploadFile() public {
        vm.prank(user);
        uint256 tokenId = nft.uploadFile("Qm123", "file.pdf");

        assertEq(tokenId, 0);
        assertEq(nft.ownerOf(0), user);
        assertEq(nft.tokenCounter(), 1);
    }

    function testUploadFileIncrementsTokenId() public {
        vm.startPrank(user);
        nft.uploadFile("Qm1", "a.txt");
        nft.uploadFile("Qm2", "b.txt");
        nft.uploadFile("Qm3", "c.txt");
        vm.stopPrank();
        assertEq(nft.tokenCounter(), 3);
    }

    function testUploadFileEmitsEvent() public {
        vm.expectEmit(true, true, false, true);
        emit FileStorageNFT.FileUploaded(0, user, "Qm123", "file.pdf", block.timestamp);
        vm.prank(user);
        nft.uploadFile("Qm123", "file.pdf");
    }

    function testUploadFileRevertsForZeroAddress() public {
        vm.prank(address(0));
        vm.expectRevert();
        nft.uploadFile("Qm123", "file.pdf");
    }
}
