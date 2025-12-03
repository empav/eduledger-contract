require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const {
  SEPOLIA_RPC_URL,
  SEPOLIA_PRIVATE_KEY,
  MAINNET_RPC_URL,
  MAINNET_PRIVATE_KEY,
  ETHERSCAN_API_KEY,
} = process.env;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  defaultNetwork: "hardhat",
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  mocha: {
    timeout: 40000,
  },
  networks: {
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: [SEPOLIA_PRIVATE_KEY],
    },
    mainnet: {
      url: MAINNET_RPC_URL,
      accounts: [MAINNET_PRIVATE_KEY],
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
  sourcify: {
    enabled: false,
  },
};
