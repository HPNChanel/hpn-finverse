const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("StakeVaultModule", (m) => {
  // Deploy StakeVault (no constructor parameters needed)
  const stakeVault = m.contract("StakeVault", []);

  // Return StakeVault contract for external access
  return { stakeVault };
});
