// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console2} from "forge-std/Test.sol";
import {FileStorageNFT} from "../src/FileStorageNFT.sol";

contract FileStorageNFTTest is Test {
    FileStorageNFT public nft;
    address public user1 = address(0x1);
    address public user2 = address(0x2);

    function setUp() public {
        nft = new FileStorageNFT();
    }

    function test_UploadFile() public {
        vm.startPrank(user1);
        string memory cid = "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco";
        string memory fileName = "test.txt";
        
        uint256 tokenId = nft.uploadFile(cid, fileName);
        
        assertEq(tokenId, 0);
        assertEq(nft.tokenCounter(), 1);
        assertEq(nft.ownerOf(tokenId), user1);
        
        FileStorageNFT.FileData memory data = nft.getFile(tokenId);
        assertEq(data.cid, cid);
        assertEq(data.fileName, fileName);
        assertEq(data.uploader, user1);
        assertEq(data.timestamp, block.timestamp);
        
        assertTrue(nft.isOwner(tokenId, user1));
        assertFalse(nft.isOwner(tokenId, user2));
        vm.stopPrank();
    }

    function test_MultipleUploads() public {
        vm.startPrank(user1);
        nft.uploadFile("cid1", "file1.txt");
        nft.uploadFile("cid2", "file2.txt");
        vm.stopPrank();

        vm.startPrank(user2);
        nft.uploadFile("cid3", "file3.txt");
        vm.stopPrank();

        assertEq(nft.tokenCounter(), 3);
        assertEq(nft.ownerOf(0), user1);
        assertEq(nft.ownerOf(1), user1);
        assertEq(nft.ownerOf(2), user2);
    }
}
