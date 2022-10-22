export default function handler(req, res) {
  // 从请求参数中得到tokenId
  const tokenId = req.query.tokenId;
  //   图片都已上传到github 所以可以从github上面提取
  const image_url =
    "https://raw.githubusercontent.com/LearnWeb3DAO/NFT-Collection/main/my-app/public/cryptodevs/";

  // api返回Crypto Dev的元数据
  //为了使我们的集合与Opensea兼容，我们需要遵循一些元数据标准
  //返回API的响应
  res.status(200).json({
    name: "Naomi_Crypto Dev #" + tokenId,
    description: "Crypto Dev is a collection of developers in crypto",
    image: image_url + tokenId + ".svg",
  });
}
// 在OpenSea上面我们有了一个 API route，可以通过这个 API route取得元数据
// 具体步骤
// OpenSea会先调用智能合约的tokenURI来得到元数据存储的地方，tokenURI会给他们API route，
// OpenSea就可以调用 API route来获得NFT的name, description, and image
