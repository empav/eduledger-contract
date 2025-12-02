// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract EduLedger is ERC721URIStorage, ReentrancyGuard {
    uint256 private _tokenIdCounter;

    mapping(uint256 => uint256) private _ownedTokensIndex;
    mapping(address => uint256[]) private _ownedTokens;
    mapping(uint256 => uint256) public tokenPrice;
    mapping(uint256 => address) public tokenSeller;
    mapping(uint256 => mapping(address => bool)) public hasPurchased;

    event FileMinted(
        uint256 indexed tokenId,
        address indexed seller,
        string cid,
        uint256 price
    );

    event FilePurchased(
        uint256 indexed tokenId,
        address indexed seller,
        address indexed buyer,
        uint256 price
    );

    constructor() ERC721("EduLedger", "EDL") {}

    function mintFile(string memory cid, uint256 price) external {
        uint256 tokenId = _tokenIdCounter;
        unchecked {
            _tokenIdCounter += 1;
        }

        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, cid);

        // Se price > 0, registriamo la vendita
        if (price > 0) {
            tokenPrice[tokenId] = price;
            tokenSeller[tokenId] = msg.sender;
        }

        emit FileMinted(tokenId, msg.sender, cid, price);
    }

    // Get total number of minted NFTs
    function totalMinted() external view returns (uint256) {
        return _tokenIdCounter;
    }

    // Get all token IDs owned by a specific address
    function tokensOfOwner(
        address owner
    ) external view returns (uint256[] memory) {
        return _ownedTokens[owner];
    }

    function hasUserPurchased(
        uint256 tokenId,
        address user
    ) external view returns (bool) {
        return hasPurchased[tokenId][user];
    }

    function buyAccess(uint256 tokenId) external payable nonReentrant {
        uint256 price = tokenPrice[tokenId];
        address seller = tokenSeller[tokenId];

        require(seller != address(0), "Invalid seller");
        require(seller != msg.sender, "Cannot buy your own file");

        // Se price > 0 ci deve essere il valore esatto
        if (price > 0) {
            require(msg.value == price, "Incorrect price");

            (bool success, ) = seller.call{value: msg.value}("");
            require(success, "Payment failed");
        } else {
            // Se price == 0, assicurati che l'utente NON invii ETH
            require(msg.value == 0, "This file is free. Do not send ETH.");
        }

        // registra accesso (anche se file è gratuito)
        hasPurchased[tokenId][msg.sender] = true;

        emit FilePurchased(tokenId, seller, msg.sender, price);
    }

    // Override to clean up ownership tracking when transferring
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override returns (address) {
        address from = super._update(to, tokenId, auth);

        // RIMOZIONE dal vecchio owner
        if (from != address(0)) {
            uint256[] storage fromTokens = _ownedTokens[from];
            uint256 tokenIndex = _ownedTokensIndex[tokenId];
            uint256 lastTokenIndex;
            unchecked {
                lastTokenIndex = fromTokens.length - 1;
            }

            if (tokenIndex != lastTokenIndex) {
                uint256 lastTokenId = fromTokens[lastTokenIndex];

                // swap tra ultimo token e token da rimuovere
                fromTokens[tokenIndex] = lastTokenId;

                // aggiorno l'indice del token spostato
                _ownedTokensIndex[lastTokenId] = tokenIndex;
            }

            // rimuovo l'ultimo
            fromTokens.pop();
            delete _ownedTokensIndex[tokenId];
        }

        // AGGIUNTA al nuovo owner
        if (to != address(0)) {
            uint256[] storage toTokens = _ownedTokens[to];
            _ownedTokensIndex[tokenId] = toTokens.length;
            toTokens.push(tokenId);
        }

        return from;
    }
}
