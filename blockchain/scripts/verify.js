const hre = require("hardhat");
require("dotenv").config({ path: "../.env" });

async function main() {
  const contractAddress = process.env.ESCROW_CONTRACT_ADDRESS;
  const platformWallet = process.env.PLATFORM_WALLET_ADDRESS;

  if (!contractAddress) {
    console.error("❌ Please set ESCROW_CONTRACT_ADDRESS in .env file");
    process.exit(1);
  }

  if (!platformWallet) {
    console.error("❌ Please set PLATFORM_WALLET_ADDRESS in .env file");
    process.exit(1);
  }

  console.log("🔍 Verifying contract on PolygonScan...");
  console.log("📍 Contract address:", contractAddress);
  console.log("🏦 Constructor arg (platform wallet):", platformWallet);

  try {
    await hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: [platformWallet],
    });

    console.log("✅ Contract verified successfully!");
    console.log(`🔗 View on PolygonScan: https://mumbai.polygonscan.com/address/${contractAddress}#code`);
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("✅ Contract already verified!");
    } else {
      console.error("❌ Verification failed:", error.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
