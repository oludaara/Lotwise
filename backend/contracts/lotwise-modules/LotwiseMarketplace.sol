// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./LotwiseCore.sol";

contract LotwiseMarketplace is Ownable, ReentrancyGuard {
    LotwiseCore public lotwiseCore;

    struct TokenListing {
        uint256 tokenId;
        uint256 price;
        address seller;
        bool isActive;
        uint256 listedAt;
    }

    mapping(uint256 => TokenListing) public marketplace;
    mapping(uint256 => bool) public isTokenListed;

    uint256 public tradingFeeBps = 100; // 1%
    uint256 public constant BASIS_POINTS = 10000;

    event TokenListed(
        uint256 indexed tokenId,
        uint256 price,
        address indexed seller
    );
    event TokenSold(
        uint256 indexed tokenId,
        uint256 price,
        address indexed seller,
        address indexed buyer
    );
    event ListingCancelled(uint256 indexed tokenId, address indexed seller);

    constructor(address _lotwiseCore) {
        lotwiseCore = LotwiseCore(_lotwiseCore);
    }

    modifier onlyTokenOwner(uint256 tokenId) {
        require(lotwiseCore.ownerOf(tokenId) == msg.sender, "Not token owner");
        _;
    }

    function listToken(
        uint256 tokenId,
        uint256 price
    ) external onlyTokenOwner(tokenId) nonReentrant {
        require(price > 0, "Invalid price");
        require(!isTokenListed[tokenId], "Token already listed");
        require(!lotwiseCore.emergencyPaused(), "Core contract is paused");

        marketplace[tokenId] = TokenListing({
            tokenId: tokenId,
            price: price,
            seller: msg.sender,
            isActive: true,
            listedAt: block.timestamp
        });

        isTokenListed[tokenId] = true;
        emit TokenListed(tokenId, price, msg.sender);
    }

    function buyToken(uint256 tokenId) external payable nonReentrant {
        TokenListing storage listing = marketplace[tokenId];
        require(listing.isActive, "Token not listed");
        require(msg.value >= listing.price, "Insufficient payment");
        require(!lotwiseCore.emergencyPaused(), "Core contract is paused");

        address seller = listing.seller;
        uint256 price = listing.price;

        // Transfer token
        lotwiseCore.transferFrom(seller, msg.sender, tokenId);

        // Calculate fees
        uint256 fee = (price * tradingFeeBps) / BASIS_POINTS;
        uint256 sellerAmount = price - fee;

        // Transfer funds
        payable(seller).transfer(sellerAmount);
        payable(owner()).transfer(fee);

        // Update listing
        listing.isActive = false;
        isTokenListed[tokenId] = false;

        emit TokenSold(tokenId, price, seller, msg.sender);
    }

    function cancelListing(
        uint256 tokenId
    ) external onlyTokenOwner(tokenId) nonReentrant {
        TokenListing storage listing = marketplace[tokenId];
        require(listing.seller == msg.sender, "Not the seller");
        require(listing.isActive, "Listing not active");

        listing.isActive = false;
        isTokenListed[tokenId] = false;

        emit ListingCancelled(tokenId, msg.sender);
    }

    function getTokenListing(
        uint256 tokenId
    ) external view returns (TokenListing memory) {
        return marketplace[tokenId];
    }

    function updateTradingFee(uint256 newFeeBps) external onlyOwner {
        require(newFeeBps <= 1000, "Fee too high"); // Max 10%
        tradingFeeBps = newFeeBps;
    }
}
