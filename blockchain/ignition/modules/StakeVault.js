const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("StakeVaultModule", (m) => {
  // Token parameters
  const tokenName = m.getParameter("tokenName", "FinVerse Token");
  const tokenSymbol = m.getParameter("tokenSymbol", "FVT");
  const initialSupply = m.getParameter("initialSupply", "1000000000000000000000000"); // 1M tokens in wei
  const decimals = m.getParameter("decimals", 18);

  // Deploy MockERC20 token first
  const token = m.contract("MockERC20", [
    tokenName,
    tokenSymbol,
    initialSupply,
    decimals
  ]);

  // Deploy StakeVault with the token address
  const stakeVault = m.contract("StakeVault", [token]);

  // Return both contracts for external access
  return { token, stakeVault };
});
