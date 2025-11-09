const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  const balanceEth = parseFloat(hre.ethers.formatEther(balance));
  
  console.log(`💰 Account: ${deployer.address}`);
  console.log(`💰 Balance: ${balanceEth} MATIC`);
  
  if (balanceEth < 0.08) {
    console.log("\n⚠️  Insufficient balance! Need at least 0.08 MATIC");
    console.log("🔗 Get more from: https://faucet.polygon.technology/");
    process.exit(1);
  }
  
  console.log("✅ Balance sufficient for deployment!");
  process.exit(0);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });

