const { ethers } = require("hardhat");
require("dotenv").config({ path: ".env" });
const { WHITELIST_CONTRACT_ADDRESS, METADATA_URL } = require("../constants");

async function main() {
  // 之前部署的白名单合约地址
  const whitelistContract = WHITELIST_CONTRACT_ADDRESS;
  // 可以从中提取元数据的URL
  const metadateURL = METADATA_URL;

  //ContractFactory 在ethers中是一个抽象概念，用来部署新的智能合约
  // 这里的 cryptoDevsContract 是CryptoDevs的合约实例
  const cryptoDevsContract = await ethers.getContractFactory("CryptoDevs");

  // 部署合约
  const deployedCryptoDevsContract = await cryptoDevsContract.deploy(
    metadateURL,
    whitelistContract
  );

  // 打印已部署合约的地址
  console.log(
    "Crypto Devs Contract Address:",
    deployedCryptoDevsContract.address
  );
}
// 调用main函数 来部署函数
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
