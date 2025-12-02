async function main() {
  const EduLedger = await ethers.getContractFactory("EduLedger");
  console.log("Deploying contract...");

  const eduLedger = await EduLedger.deploy();
  await eduLedger.waitForDeployment(); // ✅ nuovo metodo

  const address = await eduLedger.getAddress();

  console.log("EduLedger deployed at:", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
