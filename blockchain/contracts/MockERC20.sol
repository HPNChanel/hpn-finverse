// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockERC20
 * @dev Mock ERC20 token for testing staking functionality
 */
contract MockERC20 is ERC20, Ownable {
    uint8 private _decimals;
    
    /**
     * @dev Constructor that mints initial supply to deployer
     * @param name Token name
     * @param symbol Token symbol
     * @param initialSupply Initial token supply (in wei units)
     * @param decimals_ Number of decimals for the token
     */
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        uint8 decimals_
    ) ERC20(name, symbol) Ownable(msg.sender) {
        _decimals = decimals_;
        _mint(msg.sender, initialSupply);
    }
    
    /**
     * @dev Returns the number of decimals used to get its user representation
     */
    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }
    
    /**
     * @dev Mint tokens to specified address for testing purposes
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint (in wei units)
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
    
    /**
     * @dev Burn tokens from caller's balance for testing purposes
     * @param amount Amount of tokens to burn (in wei units)
     */
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
    
    /**
     * @dev Mint tokens to multiple addresses at once for testing
     * @param recipients Array of addresses to mint tokens to
     * @param amounts Array of amounts corresponding to each recipient
     */
    function batchMint(address[] calldata recipients, uint256[] calldata amounts) external onlyOwner {
        require(recipients.length == amounts.length, "MockERC20: arrays length mismatch");
        
        for (uint256 i = 0; i < recipients.length; i++) {
            _mint(recipients[i], amounts[i]);
        }
    }
    
    /**
     * @dev Convenience function to mint tokens with 18 decimal places
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint (in token units, not wei)
     */
    function mintTokens(address to, uint256 amount) external onlyOwner {
        _mint(to, amount * 10**decimals());
    }
}
