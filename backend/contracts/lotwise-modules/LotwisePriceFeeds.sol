// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract LotwisePriceFeeds is Ownable {
    enum Network {
        SEPOLIA,
        FUJI,
        MUMBAI
    }
    mapping(Network => AggregatorV3Interface) public ethUsdPriceFeeds;
    Network public activeNetwork;

    event PriceFeedUpdated(
        Network indexed network,
        address oldFeed,
        address newFeed
    );
    event ActiveNetworkChanged(Network indexed newNetwork);

    constructor(address _sepoliaFeed, address _fujiFeed, address _mumbaiFeed) {
        ethUsdPriceFeeds[Network.SEPOLIA] = AggregatorV3Interface(_sepoliaFeed);
        ethUsdPriceFeeds[Network.FUJI] = AggregatorV3Interface(_fujiFeed);
        ethUsdPriceFeeds[Network.MUMBAI] = AggregatorV3Interface(_mumbaiFeed);
        activeNetwork = Network.SEPOLIA;
    }

    function setPriceFeed(Network network, address newFeed) external onlyOwner {
        address oldFeed = address(ethUsdPriceFeeds[network]);
        ethUsdPriceFeeds[network] = AggregatorV3Interface(newFeed);
        emit PriceFeedUpdated(network, oldFeed, newFeed);
    }

    function setActiveNetwork(Network network) external onlyOwner {
        activeNetwork = network;
        emit ActiveNetworkChanged(network);
    }

    function getLatestEthPrice() external view returns (int256) {
        (, int256 price, , , ) = ethUsdPriceFeeds[activeNetwork]
            .latestRoundData();
        return price;
    }

    function getEthPriceWithDecimals() external view returns (int256, uint8) {
        (, int256 price, , , ) = ethUsdPriceFeeds[activeNetwork]
            .latestRoundData();
        uint8 decimals = ethUsdPriceFeeds[activeNetwork].decimals();
        return (price, decimals);
    }

    function getPriceFeedAddresses()
        external
        view
        returns (address sepoliaFeed, address fujiFeed, address mumbaiFeed)
    {
        return (
            address(ethUsdPriceFeeds[Network.SEPOLIA]),
            address(ethUsdPriceFeeds[Network.FUJI]),
            address(ethUsdPriceFeeds[Network.MUMBAI])
        );
    }
}
