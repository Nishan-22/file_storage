// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "lib/openzeppelin-contracts/contracts/token/ERC721/ERC721.sol";
import "lib/openzeppelin-contracts/contracts/access/Ownable.sol";

contract FileStorageNFT is ERC721, Ownable {

    uint256 public tokenCounter;

    constructor() ERC721("FileStorageNFT", "FSNFT") Ownable(msg.sender) {}

    struct FileData {
        string cid;        // IPFS hash
        string fileName;   // original file name
        address uploader;  // owner
        uint256 timestamp;
    }



    mapping(uint256 => FileData) public files;

    event FileUploaded(
        uint256 indexed tokenId,
        address indexed uploader,
        string cid,
        string fileName
    );

    // Mint NFT + store file metadata
    function uploadFile(string memory _cid, string memory _fileName) public returns (uint256) {

        uint256 tokenId = tokenCounter;

        _safeMint(msg.sender, tokenId);

        files[tokenId] = FileData({
            cid: _cid,
            fileName: _fileName,
            uploader: msg.sender,
            timestamp: block.timestamp
        });

        emit FileUploaded(tokenId, msg.sender, _cid, _fileName);

        tokenCounter++;

        return tokenId;
    }

    // Get file details
    function getFile(uint256 tokenId) public view returns (FileData memory) {
        return files[tokenId];
    }

    // Check if user owns file NFT
    function isOwner(uint256 tokenId, address user) public view returns (bool) {
        return ownerOf(tokenId) == user;
    }
}