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

        (string memory cid, string memory fileName, address uploader, uint256 timestamp) = nft.files(0);
        assertEq(cid, "Qm123");
        assertEq(fileName, "file.pdf");
        assertEq(uploader, user);
        assertTrue(timestamp > 0);
    }

    function testUploadFileIncrementsTokenId() public {
        vm.startPrank(user);
        nft.uploadFile("Qm1", "a.txt");
        nft.uploadFile("Qm2", "b.txt");
        nft.uploadFile("Qm3", "c.txt");
        vm.stopPrank();
        assertEq(nft.tokenCounter(), 3);
    }

    function testGetFile() public {
        vm.prank(user);
        nft.uploadFile("Qm123", "file.pdf");
        FileStorageNFT.FileData memory f = nft.getFile(0);
        assertEq(f.cid, "Qm123");
        assertEq(f.fileName, "file.pdf");
        assertEq(f.uploader, user);
        assertTrue(f.timestamp > 0);
    }

    function testIsOwner() public {
        vm.prank(user);
        nft.uploadFile("Qm123", "file.pdf");
        assertTrue(nft.isOwner(0, user));
        assertFalse(nft.isOwner(0, address(0x123)));
    }

    function testUploadFileEmitsEvent() public {
        vm.expectEmit(true, true, false, true);
        emit FileStorageNFT.FileUploaded(0, user, "Qm123", "file.pdf");
        vm.prank(user);
        nft.uploadFile("Qm123", "file.pdf");
    }

    function testUploadFileRevertsForZeroAddress() public {
        vm.prank(address(0));
        vm.expectRevert();
        nft.uploadFile("Qm123", "file.pdf");
    }
}
