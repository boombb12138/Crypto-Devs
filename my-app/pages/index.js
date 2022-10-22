import { Contract, providers, utils } from "ethers";
import Head from "next/head";
import React, { useEffect, useRef, useState } from "react";
import Web3Modal from "web3modal";
import { abi, NFT_CONTRACT_ADDRESS } from "../constants";
import styles from "../styles/Home.module.css";

export default function Home() {
  // 跟蹤用戶錢包是否连接
  const [walletConnected, setWalletConnected] = useState(false);
  // 跟踪预售是否开始
  const [presaleStarted, setPresaleStarted] = useState(false);
  // 跟踪预售是否结束
  const [presaleEnded, setPresaleEnded] = useState(false);
  // 等待交易的时候loading=true
  const [loading, setLoading] = useState(false);
  // 检查现在连接的钱包是不是合约的拥有者
  const [isOwner, setIsOwner] = useState(false);
  // 跟踪已经被mint的tokenID数量
  const [tokenIdsMinted, setTokenIdsMinted] = useState("0");
  //todo  创建一个ref引用
  const web3ModalRef = useRef();

  // 在预售的时候mint NFT
  const presaleMint = async () => {
    try {
      // mint NFT是一个写入操作
      const signer = await getProviderOrSigner(true);
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer);
      // 只有白名单地址才能在预售的时候mint NFT
      const tx = await nftContract.presaleMint({
        value: utils.parseEther("0.01"), //mint一个NFT需要0.01ETH utils是ether里面的一个库
      });
      setLoading(true);
      // 等待交易被minted
      await tx.wait();
      setLoading(false);
      window.alert("You successfully minted a Crypto Dev!");
    } catch (err) {
      console.error(err);
    }
  };

  // 在预售之后mintNFT
  const publicMint = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer);
      const tx = await nftContract.mint({ value: utils.parseEther("0.01") });
      setLoading(true);
      await tx.wait();
      setLoading(false);
      window.alert("You successfully minted a Crypto Dev!");
    } catch (err) {
      console.error(err);
    }
  };

  // 连接钱包
  const connectWallet = async () => {
    try {
      // 通过web3modal得到provider，用户第一次使用会提示连接钱包
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch (err) {
      console.error(err);
    }
  };

  // 开始NFT集合的预售
  const startPresale = async () => {
    try {
      // 预售需要一个写入的合约
      const signer = await getProviderOrSigner(true);
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer);
      const tx = await nftContract.startPresale();
      setLoading(true);
      await tx.wait();
      setLoading(false);
      await checkIfPresaleStarted();
    } catch (err) {
      console.error(err);
    }
  };

  // 通过查询合约的presaleStarted变量检查预售是否开始
  const checkIfPresaleStarted = async () => {
    try {
      // 查询合约的presaleStarted变量只是一个读取的操作
      const provider = await getProviderOrSigner();
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
      const _presaleStarted = await nftContract.presaleStarted();
      if (!_presaleStarted) {
        await getOwner();
      }
      setPresaleStarted(_presaleStarted);
      return _presaleStarted;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  // 通过查询合约的presaleEnded变量检查预售是否结束
  const checkIfPresaleEnded = async () => {
    try {
      const provider = await getProviderOrSigner();
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS.abi, provider);
      const _presaleEnded = await nftContract.presaleEnded();
      // 如果预售时间小于当前时间 就表示预售结束
      // 因为_presaleEnded是一个大数字，所以用lt(less than)
      // Date.now() / 1000是当前时间 以秒为单位
      const hasEnded = _presaleEnded.lt(Math.floor(Date.now() / 1000));
      if (hasEnded) {
        setPresaleEnded(true);
      } else {
        setPresaleEnded(false);
      }
      return hasEnded;
    } catch (err) {
      console.error(err);
      // todo
      return false;
    }
  };

  // 调用合约来检索拥有者
  const getOwner = async () => {
    try {
      const provider = await getProviderOrSigner();
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
      const _owner = await nftContract.owner();
      //todo why can we call the getAddress from signer?
      const signer = await getProviderOrSigner(true);
      const address = await signer.getAddress();
      if (address.toLowerCase() === _owner.toLowerCase()) {
        setIsOwner(true);
      }
    } catch (err) {
      console.error(err.message);
    }
  };

  // 得到已经被mint的tokenId数量
  const getTokenIdsMinted = async () => {
    try {
      const provider = await getProviderOrSigner();
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
      const _tokenIds = await nftContract.tokenIds();
      // 将大数字_tokenIds转为字符串
      setTokenIdsMinted(_tokenIds.toString());
    } catch (err) {
      console.error(err);
    }
  };

  //
  const getProviderOrSigner = async (needSigner = false) => {
    const provider = await web3ModalRef.current.connect();
    // todo 这里的providers是ethers里面的一个类吗
    const web3Provider = new providers.Web3Provider(provider);

    //  检测用户连接的网络
    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 5) {
      window.alert("Change the network to Goerli");
      throw new Error("Change network to Goerli");
    }
    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  };

  // walletConnected改变就会触发useEffect函数
  useEffect(() => {
    if (!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: "goerli",
        providerOptions: {},
        disableInjectedProvider: false,
      });
      connectWallet();
    }

    const _presaleStarted = checkIfPresaleStarted();
    if (_presaleStarted) {
      checkIfPresaleEnded();
    }

    getTokenIdsMinted();

    // 设置间隔，每5秒调用一次，检查预售是否结束
    const presaleEndedInterval = setInterval(async function () {
      const _presaleStarted = await checkIfPresaleStarted();
      if (_presaleStarted) {
        const _presaleEnded = await checkIfPresaleEnded();
        if (_presaleEnded) {
          clearInterval(presaleEndedInterval);
        }
      }
    }, 5 * 1000);

    // 设置间隔，每5秒调用一次，获取已经被mint的tokenId的数量
    setInterval(async function () {
      await getTokenIdsMinted();
    }, 5 * 1000);
  }, [walletConnected]);

  // 返回一个按钮
  const renderButton = () => {
    // 如果钱包还没有连接，返回一个按钮
    if (!walletConnected) {
      return (
        <button onClick={connectWallet} className={styles.button}>
          Connect your wallet
        </button>
      );
    }
    // 如果正在等什么，就返回一个loading
    if (loading) {
      return <button className={styles.button}>Loading</button>;
    }
    // 如果连接的用户是拥有者，然后预售还没有开始，允许他们开始预售
    if (isOwner && !presaleStarted) {
      return (
        <button className={styles.button} onClick={startPresale}>
          Start Presale
        </button>
      );
    }
    // 如果用户不是拥有者，然后预售还没有开始，就告诉他们预售还没有开始
    if (!presaleStarted) {
      return (
        <div>
          <div className={styles.descreiption}>Presale hasnt started</div>
        </div>
      );
    }
    // 如果预售开始了，但是还没有结束，允许mint
    if (presaleStarted && !presaleEnded) {
      return (
        <div>
          <div className={styles.description}>
            Presale has started!!If your address is whitelisted,Mint a Crypto
            Dev
          </div>
          <button className={styles.button} onClick={presaleMint}>
            Presale Mint
          </button>
        </div>
      );
    }
    // 如果预售开始了，已经结束，就开始public mint
    if (presaleStarted && presaleEnded) {
      return (
        <button className={styles.button} onClick={publicMint}>
          Plublic Mint
        </button>
      );
    }
  };

  return (
    <div>
      <Head>
        <title>Crypto Devs</title>
        <meta name="description" content="Whitelist-Dapp" />
        <link rel="icon" href="/favicon.ico"></link>
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to Crypto Devs</h1>
          <div className={styles.description}>
            Its an NFT collection for dev in Crypto.
          </div>
          <div className={styles.description}>
            {tokenIdsMinted}/20 have been minted
          </div>
          {renderButton()}
        </div>
        <div>
          <img className={styles.image} src="./cryptodevs/0.svg" />
        </div>
      </div>
      <footer className={styles.footer}>Made with &#10084; by Naomi</footer>
    </div>
  );
}
