// SPDX-License-Identifier:MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IWhitelist.sol";

contract CryptoDevs is ERC721Enumerable, Ownable {
    //_baseTokenURI为了计算tokenURI 如果设置了，由此产生的tokenURI会连接baseURI和tokenId
    string _baseTokenURI;

    // 每个Crypto Dev NFT的价格
    uint256 public _price = 0.01 ether;

    // 如果紧急事件发生就停止合约
    bool public _paused;
    // CryptoDevs的总数
    uint256 public maxTokenIds = 20;

    // 已经被mint的tokenId的总数
    uint256 public tokenIds;

    // 白名单合约实例
    IWhitelist whitelist;

    // 跟踪预售开始了吗
    bool public presaleStarted;

    // 预售结束的时间戳
    uint256 public presaleEnded;

    modifier onlyWhenNotPaused() {
        require(!_paused, "Contract currently paused");
        _;
    }

    // ERC721结构需要给代币集合一个名字和符号
    // 在本例中 名字Crypto Devs 符号CD
    constructor(string memory baseURI, address whitelistContract)
        ERC721("Crypto Devs", "CD")
    {
        _baseTokenURI = baseURI;
        whitelist = IWhitelist(whitelistContract);
    }

    // startPresale开始给白名单地址预售
    function startPresale() public onlyOwner {
        presaleStarted = true;
        // 设置预售结束时间是现在的时间加5min
        // solidity里时间戳的语法是seconds, minutes, hours, days, years
        presaleEnded = block.timestamp + 5 minutes;
    }

    //presaleMint 允许用户在预售期间每笔交易mint一个NFT
    function presaleMint() public payable onlyWhenNotPaused {
        require(
            presaleStarted && block.timestamp < presaleEnded,
            "Presale is not running"
        );
        require(
            whitelist.whitelistedAddresses(msg.sender),
            "You're not whitelisted"
        );
        require(tokenIds < maxTokenIds, "Exceeded maximum Crypto Devs supply");
        require(msg.value >= _price, "Ether send is not correct");
        tokenIds += 1;
        //_safeMint 是一个_mint函数的安全版本因为它确保了
        // 如果mint地址是合约 它知道怎么处理ERC721token
        //如果mint地址不是合约 它就像_mint函数一样工作
        _safeMint(msg.sender, tokenIds);
    }

    // _baseURI 覆盖了ERC721里面默认返回的baseURI(返回的是一个空的字符串)
    function _baseURI() internal view virtual override returns (string memory) {
        return _baseTokenURI;
    }

    // 设置合约暂停或继续
    function setPaused(bool val) public onlyOwner {
        _paused = val;
    }

    // withdraw发送合约中所有的ether给合约的拥有者
    function withdraw() public onlyOwner {
        address _owner = owner();
        uint256 amount = address(this).balance;
        (bool sent, ) = _owner.call{value: amount}("");
        require(sent, "Failed to send Ether");
    }

    // 接收Ether. msg.data的函数一定要是空的
    receive() external payable {}

    // 当msg.data不为空时 fallback函数会被调用
    fallback() external payable {}
}
