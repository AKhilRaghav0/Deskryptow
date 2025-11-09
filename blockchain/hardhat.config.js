require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config({ path: "../.env" });

const POLYGON_AMOY_RPC_URL = process.env.POLYGON_AMOY_RPC_URL || process.env.POLYGON_RPC_URL || "https://rpc-amoy.polygon.technology";
const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000000";
const POLYGON_SCAN_API_KEY = process.env.POLYGON_SCAN_API_KEY || "";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    amoy: {
      url: POLYGON_AMOY_RPC_URL,
      accounts: DEPLOYER_PRIVATE_KEY !== "0x0000000000000000000000000000000000000000000000000000000000000000" ? [DEPLOYER_PRIVATE_KEY] : [],
      chainId: 80002,
      // Let Hardhat auto-calculate gas price (removed fixed gasPrice to use network defaults)
    },
    // Keep Mumbai for backward compatibility (deprecated)
    mumbai: {
      url: process.env.MUMBAI_RPC_URL || "https://rpc-mumbai.maticvigil.com",
      accounts: DEPLOYER_PRIVATE_KEY !== "0x0000000000000000000000000000000000000000000000000000000000000000" ? [DEPLOYER_PRIVATE_KEY] : [],
      chainId: 80001,
      gasPrice: 20000000000,
    },
  },
  etherscan: {
    apiKey: {
      polygonAmoy: POLYGON_SCAN_API_KEY,
      polygonMumbai: POLYGON_SCAN_API_KEY, // Keep for backward compatibility
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
    outputFile: "gas-report.txt",
    noColors: true,
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};
