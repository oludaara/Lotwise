// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./LotwiseCore.sol";

contract LotwiseCCIP is Ownable, ReentrancyGuard {
    LotwiseCore public lotwiseCore;

    // Supported networks
    mapping(uint64 => bool) public supportedChains;
    mapping(uint64 => address) public destinationContracts;

    // Cross-chain transfer tracking
    struct CrossChainTransfer {
        uint256 propertyId;
        address sender;
        address receiver;
        uint64 sourceChain;
        uint64 destinationChain;
        uint256 timestamp;
        bool completed;
        bytes32 transferId;
    }

    mapping(bytes32 => CrossChainTransfer) public transfers;
    mapping(bytes32 => bool) public processedTransfers;

    event CrossChainTransferInitiated(
        bytes32 indexed transferId,
        uint256 indexed propertyId,
        address indexed sender,
        address receiver,
        uint64 sourceChain,
        uint64 destinationChain
    );

    event CrossChainTransferCompleted(
        bytes32 indexed transferId,
        uint256 indexed propertyId,
        address indexed receiver
    );

    constructor(address _lotwiseCore) {
        require(_lotwiseCore != address(0), "Invalid core address");
        lotwiseCore = LotwiseCore(_lotwiseCore);

        // Initialize supported chains
        _initializeSupportedChains();
    }

    function _initializeSupportedChains() internal {
        supportedChains[11155111] = true; // Sepolia
        supportedChains[43113] = true; // Fuji
        supportedChains[80001] = true; // Mumbai
        supportedChains[1] = true; // Ethereum
        supportedChains[137] = true; // Polygon
        supportedChains[43114] = true; // Avalanche
    }

    function addSupportedChain(
        uint64 chainSelector,
        address destinationContract
    ) external onlyOwner {
        require(
            destinationContract != address(0),
            "Invalid destination contract"
        );
        supportedChains[chainSelector] = true;
        destinationContracts[chainSelector] = destinationContract;
    }

    function removeSupportedChain(uint64 chainSelector) external onlyOwner {
        supportedChains[chainSelector] = false;
        destinationContracts[chainSelector] = address(0);
    }

    function transferPropertyCrossChain(
        uint256 propertyId,
        uint64 destinationChainSelector,
        address receiver
    ) external payable nonReentrant {
        require(
            supportedChains[destinationChainSelector],
            "Unsupported destination chain"
        );
        require(receiver != address(0), "Invalid receiver address");
        require(
            lotwiseCore.ownerOf(propertyId) == msg.sender,
            "Not property owner"
        );
        require(
            destinationChainSelector != uint64(block.chainid),
            "Cannot transfer to same chain"
        );

        // Generate unique transfer ID
        bytes32 transferId = keccak256(
            abi.encodePacked(
                propertyId,
                msg.sender,
                receiver,
                destinationChainSelector,
                block.timestamp,
                block.chainid
            )
        );

        require(!processedTransfers[transferId], "Transfer already processed");

        // Transfer property token to this contract temporarily
        lotwiseCore.transferFrom(msg.sender, address(this), propertyId);

        // Record the transfer
        transfers[transferId] = CrossChainTransfer({
            propertyId: propertyId,
            sender: msg.sender,
            receiver: receiver,
            sourceChain: uint64(block.chainid),
            destinationChain: destinationChainSelector,
            timestamp: block.timestamp,
            completed: false,
            transferId: transferId
        });

        processedTransfers[transferId] = true;

        emit CrossChainTransferInitiated(
            transferId,
            propertyId,
            msg.sender,
            receiver,
            uint64(block.chainid),
            destinationChainSelector
        );
    }

    function completeCrossChainTransfer(
        bytes32 transferId,
        uint256 propertyId,
        address originalOwner,
        address receiver
    ) external onlyOwner {
        require(!transfers[transferId].completed, "Transfer already completed");
        require(receiver != address(0), "Invalid receiver address");

        CrossChainTransfer storage transfer = transfers[transferId];
        transfer.completed = true;

        // Transfer the property token to the receiver
        lotwiseCore.transferFrom(address(this), receiver, propertyId);

        emit CrossChainTransferCompleted(transferId, propertyId, receiver);
    }

    function getTransfer(
        bytes32 transferId
    ) external view returns (CrossChainTransfer memory) {
        return transfers[transferId];
    }

    // Emergency functions
    function emergencyWithdrawToken(
        uint256 propertyId,
        address to
    ) external onlyOwner {
        require(to != address(0), "Invalid recipient address");
        lotwiseCore.transferFrom(address(this), to, propertyId);
    }

    function emergencyWithdrawETH(address to) external onlyOwner {
        require(to != address(0), "Invalid recipient address");
        payable(to).transfer(address(this).balance);
    }

    // View functions
    function getSupportedChains() external view returns (uint64[] memory) {
        uint64[] memory chains = new uint64[](10);
        uint256 count = 0;

        // Check each supported chain individually
        if (supportedChains[11155111]) {
            chains[count++] = 11155111;
        } // Sepolia
        if (supportedChains[43113]) {
            chains[count++] = 43113;
        } // Fuji
        if (supportedChains[80001]) {
            chains[count++] = 80001;
        } // Mumbai
        if (supportedChains[1]) {
            chains[count++] = 1;
        } // Ethereum
        if (supportedChains[137]) {
            chains[count++] = 137;
        } // Polygon
        if (supportedChains[43114]) {
            chains[count++] = 43114;
        } // Avalanche

        // Resize array to actual count
        assembly {
            mstore(chains, count)
        }

        return chains;
    }

    // Simulate cross-chain transfer completion (for testing)
    function simulateCrossChainCompletion(
        bytes32 transferId
    ) external onlyOwner {
        CrossChainTransfer storage transfer = transfers[transferId];
        require(transfer.transferId != bytes32(0), "Transfer not found");
        require(!transfer.completed, "Transfer already completed");

        transfer.completed = true;

        // Transfer the property token to the receiver
        lotwiseCore.transferFrom(
            address(this),
            transfer.receiver,
            transfer.propertyId
        );

        emit CrossChainTransferCompleted(
            transferId,
            transfer.propertyId,
            transfer.receiver
        );
    }
}
