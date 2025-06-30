// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@chainlink/contracts/src/v0.8/dev/vrf/VRFConsumerBaseV2Plus.sol";
import "@chainlink/contracts/src/v0.8/dev/vrf/libraries/VRFV2PlusClient.sol";
import "./LotwiseCore.sol";

contract LotwiseVRF is VRFConsumerBaseV2Plus {
    enum Network {
        SEPOLIA,
        FUJI,
        MUMBAI
    }

    struct VRFConfig {
        address coordinator;
        bytes32 keyHash;
        uint256 subscriptionId;
    }

    mapping(Network => VRFConfig) public vrfConfigs;
    Network public activeNetwork;
    LotwiseCore public lotwiseCore;

    uint32 public vrfCallbackGasLimit = 100000;
    uint16 public vrfRequestConfirmations = 3;
    uint32 public vrfNumWords = 1;

    struct VRFRequest {
        uint256 requestId;
        uint256 propertyId;
        uint256 timestamp;
        bool fulfilled;
        uint256 randomValue;
    }

    mapping(uint256 => VRFRequest) public vrfRequests;
    mapping(uint256 => uint256) public propertyVRFRequestId;

    event VRFRequestSubmitted(
        uint256 indexed requestId,
        uint256 indexed propertyId
    );
    event VRFRequestFulfilled(
        uint256 indexed requestId,
        uint256 indexed propertyId,
        uint256 randomValue
    );
    event VRFConfigUpdated(
        Network indexed network,
        address coordinator,
        bytes32 keyHash,
        uint256 subscriptionId
    );
    event ActiveNetworkChanged(Network indexed newNetwork);

    constructor(
        address _lotwiseCore,
        address _sepoliaCoordinator,
        bytes32 _sepoliaKeyHash,
        uint256 _sepoliaSubId,
        address _fujiCoordinator,
        bytes32 _fujiKeyHash,
        uint256 _fujiSubId,
        address _mumbaiCoordinator,
        bytes32 _mumbaiKeyHash,
        uint256 _mumbaiSubId
    ) VRFConsumerBaseV2Plus(_sepoliaCoordinator) {
        lotwiseCore = LotwiseCore(_lotwiseCore);
        vrfConfigs[Network.SEPOLIA] = VRFConfig(
            _sepoliaCoordinator,
            _sepoliaKeyHash,
            _sepoliaSubId
        );
        vrfConfigs[Network.FUJI] = VRFConfig(
            _fujiCoordinator,
            _fujiKeyHash,
            _fujiSubId
        );
        vrfConfigs[Network.MUMBAI] = VRFConfig(
            _mumbaiCoordinator,
            _mumbaiKeyHash,
            _mumbaiSubId
        );
        activeNetwork = Network.SEPOLIA;
    }

    function setVRFConfig(
        Network network,
        address coordinator,
        bytes32 keyHash,
        uint256 subscriptionId
    ) external onlyOwner {
        vrfConfigs[network] = VRFConfig(coordinator, keyHash, subscriptionId);
        emit VRFConfigUpdated(network, coordinator, keyHash, subscriptionId);
    }

    function setActiveNetwork(Network network) external onlyOwner {
        activeNetwork = network;
        emit ActiveNetworkChanged(network);
    }

    function requestRandomValue(uint256 propertyId) external onlyOwner {
        require(
            lotwiseCore.propertyExists(propertyId),
            "Property does not exist"
        );
        LotwiseCore.Property memory prop = lotwiseCore.getProperty(propertyId);
        require(prop.mintedTokens > 0, "No tokens minted");

        VRFConfig memory config = vrfConfigs[activeNetwork];

        // Create VRF request using VRFV2PlusClient
        VRFV2PlusClient.RandomWordsRequest memory req = VRFV2PlusClient
            .RandomWordsRequest({
                keyHash: config.keyHash,
                subId: uint64(config.subscriptionId),
                requestConfirmations: vrfRequestConfirmations,
                callbackGasLimit: vrfCallbackGasLimit,
                numWords: vrfNumWords,
                extraArgs: VRFV2PlusClient._argsToBytes(
                    VRFV2PlusClient.ExtraArgsV1({nativePayment: true})
                )
            });

        uint256 requestId = s_vrfCoordinator.requestRandomWords(req);

        vrfRequests[requestId] = VRFRequest({
            requestId: requestId,
            propertyId: propertyId,
            timestamp: block.timestamp,
            fulfilled: false,
            randomValue: 0
        });
        propertyVRFRequestId[propertyId] = requestId;
        emit VRFRequestSubmitted(requestId, propertyId);
    }

    function fulfillRandomWords(
        uint256 requestId,
        uint256[] memory randomWords
    ) internal override {
        VRFRequest storage request = vrfRequests[requestId];
        require(!request.fulfilled, "Request already fulfilled");
        request.fulfilled = true;
        request.randomValue = randomWords[0];
        emit VRFRequestFulfilled(
            requestId,
            request.propertyId,
            request.randomValue
        );
    }

    function getVRFRequest(
        uint256 requestId
    ) external view returns (VRFRequest memory) {
        return vrfRequests[requestId];
    }

    // Configuration functions
    function setCallbackGasLimit(uint32 _gasLimit) external onlyOwner {
        vrfCallbackGasLimit = _gasLimit;
    }

    function setRequestConfirmations(uint16 _confirmations) external onlyOwner {
        vrfRequestConfirmations = _confirmations;
    }

    function setNumWords(uint32 _numWords) external onlyOwner {
        vrfNumWords = _numWords;
    }
}
