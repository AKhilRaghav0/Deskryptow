const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying FreelanceEscrow contract...");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);

  // Get account balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "MATIC");

  // Platform wallet (you can change this)
  const platformWallet = process.env.PLATFORM_WALLET_ADDRESS || deployer.address;
  console.log("🏦 Platform wallet:", platformWallet);

  // Deploy contract
  console.log("\n⏳ Deploying contract...");
  const FreelanceEscrow = await hre.ethers.getContractFactory("FreelanceEscrow");
  const escrow = await FreelanceEscrow.deploy(platformWallet);

  await escrow.waitForDeployment();
  const escrowAddress = await escrow.getAddress();

  console.log("✅ FreelanceEscrow deployed to:", escrowAddress);
  console.log("📋 Transaction hash:", escrow.deploymentTransaction().hash);

  // Wait for a few confirmations
  console.log("\n⏳ Waiting for confirmations...");
  await escrow.deploymentTransaction().wait(5);
  console.log("✅ Contract confirmed!");

  // Get contract info
  const platformFee = await escrow.platformFeePercentage();
  console.log("\n📊 Contract Info:");
  console.log("   - Platform Fee:", platformFee.toString(), "%");
  console.log("   - Platform Wallet:", platformWallet);

  console.log("\n🎉 Deployment complete!");
  console.log("\n📝 Next steps:");
  console.log("1. Update .env file with contract address:");
  console.log(`   ESCROW_CONTRACT_ADDRESS=${escrowAddress}`);
  console.log("\n2. Verify contract on PolygonScan:");
  console.log(`   npx hardhat verify --network mumbai ${escrowAddress} ${platformWallet}`);
  console.log("\n3. View on Mumbai PolygonScan:");
  console.log(`   https://mumbai.polygonscan.com/address/${escrowAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
