// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/FileStorageNFT.sol";

contract DeployFileStorage is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        FileStorageNFT fileStorage = new FileStorageNFT();

        vm.stopBroadcast();
    }
}
