// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract LotwiseCore is
    ERC721,
    ERC721Enumerable,
    AccessControl,
    ReentrancyGuard
{
    using Counters for Counters.Counter;

    bytes32 public constant OWNER_ROLE = keccak256("OWNER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    struct Property {
        string propertyId;
        uint256 totalValue;
        uint256 tokenPrice;
        uint256 totalTokens;
        uint256 mintedTokens;
        bool isActive;
        string metadataURI;
    }

    Counters.Counter private _tokenIdCounter;
    Counters.Counter private _propertyIdCounter;

    mapping(uint256 => Property) public properties;
    mapping(uint256 => uint256) public tokenToProperty;
    mapping(uint256 => bool) public propertyExists;

    bool public emergencyPaused;

    event PropertyCreated(
        uint256 indexed propertyId,
        string propertyIdStr,
        uint256 totalValue
    );
    event PropertyTokenMinted(
        uint256 indexed propertyId,
        uint256 indexed tokenId,
        address indexed to
    );

    constructor() ERC721("Lotwise Property Token", "LPT") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(OWNER_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
    }

    modifier notPaused() {
        require(!emergencyPaused, "Contract is paused");
        _;
    }

    modifier onlyMinter() {
        require(hasRole(MINTER_ROLE, msg.sender), "Caller is not a minter");
        _;
    }

    function createProperty(
        string memory _propertyIdStr,
        uint256 _totalValueUSD,
        string memory _metadataURI
    ) external onlyRole(OWNER_ROLE) returns (uint256 propertyId) {
        require(_totalValueUSD > 0, "Invalid property value");
        require(bytes(_propertyIdStr).length > 0, "Property ID required");

        _propertyIdCounter.increment();
        propertyId = _propertyIdCounter.current();

        uint256 tokenPrice = _totalValueUSD / 1000; // 1,000 tokens per property

        properties[propertyId] = Property({
            propertyId: _propertyIdStr,
            totalValue: _totalValueUSD,
            tokenPrice: tokenPrice,
            totalTokens: 1000,
            mintedTokens: 0,
            isActive: true,
            metadataURI: _metadataURI
        });

        propertyExists[propertyId] = true;
        emit PropertyCreated(propertyId, _propertyIdStr, _totalValueUSD);
    }

    function mintPropertyToken(
        uint256 propertyId,
        address to
    ) external onlyMinter notPaused {
        require(propertyExists[propertyId], "Property does not exist");
        Property storage prop = properties[propertyId];
        require(prop.isActive, "Property not active");
        require(prop.mintedTokens < prop.totalTokens, "All tokens minted");

        _tokenIdCounter.increment();
        uint256 tokenId = _tokenIdCounter.current();

        _mint(to, tokenId);
        tokenToProperty[tokenId] = propertyId;
        prop.mintedTokens++;

        emit PropertyTokenMinted(propertyId, tokenId, to);
    }

    function getProperty(
        uint256 propertyId
    ) external view returns (Property memory) {
        require(propertyExists[propertyId], "Property does not exist");
        return properties[propertyId];
    }

    function setEmergencyPause(bool paused) external onlyRole(OWNER_ROLE) {
        emergencyPaused = paused;
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721) returns (string memory) {
        require(_exists(tokenId), "Token does not exist");
        uint256 propertyId = tokenToProperty[tokenId];
        return properties[propertyId].metadataURI;
    }

    function supportsInterface(
        bytes4 interfaceId
    )
        public
        view
        override(ERC721, ERC721Enumerable, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
