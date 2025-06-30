// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./LotwiseCore.sol";

contract LotwiseFunctions is Ownable {
    LotwiseCore public lotwiseCore;
    
    // Property verification tracking
    struct PropertyVerification {
        uint256 propertyId;
        string propertyAddress;
        bool verified;
        uint256 verificationTimestamp;
        string verificationData;
    }
    
    mapping(uint256 => PropertyVerification) public propertyVerifications;
    
    event PropertyVerificationRequested(
        uint256 indexed propertyId,
        string propertyAddress
    );
    
    event PropertyVerificationCompleted(
        uint256 indexed propertyId,
        bool verified,
        string data
    );
    
    constructor(address _lotwiseCore) {
        lotwiseCore = LotwiseCore(_lotwiseCore);
    }
    
    function verifyPropertyData(
        uint256 propertyId,
        string memory propertyAddress
    ) external onlyOwner {
        require(lotwiseCore.propertyExists(propertyId), "Property does not exist");
        
        // Initialize verification record
        propertyVerifications[propertyId] = PropertyVerification({
            propertyId: propertyId,
            propertyAddress: propertyAddress,
            verified: false,
            verificationTimestamp: 0,
            verificationData: ""
        });
        
        emit PropertyVerificationRequested(propertyId, propertyAddress);
    }
    
    function completeVerification(
        uint256 propertyId,
        bool verified,
        string memory data
    ) external onlyOwner {
        require(propertyVerifications[propertyId].propertyId != 0, "Verification not found");
        
        PropertyVerification storage verification = propertyVerifications[propertyId];
        verification.verified = verified;
        verification.verificationTimestamp = block.timestamp;
        verification.verificationData = data;
        
        emit PropertyVerificationCompleted(propertyId, verified, data);
    }
    
    function getPropertyVerification(uint256 propertyId) 
        external 
        view 
        returns (PropertyVerification memory) 
    {
        return propertyVerifications[propertyId];
    }
}
