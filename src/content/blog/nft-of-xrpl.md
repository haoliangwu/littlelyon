---
title: NFT of XRP Ledger
publishDate: 2023/05/06
excerpt: 关于 Web3 NFT 的开发通常是在 Ethereum 和 Polygon 来完成的，也许你还可以选择 XRP Ledger。
tags: 
  - web3
author: You
---

<a name="c94Jv"></a>

## 预备知识

<a name="p6qzC"></a>

### XRPL 及共识算法

XRP Ledger 是一种去中心化的数字货币交易系统，拥有高效、快速、安全的特点。其共识算法是 [Consensus](https://xrpl.org/intro-to-consensus.html)，采用扩展的 Byzantine（拜占庭） 协议来确保系统的高度安全性和准确性。
相比于以太坊和比特币等其他区块链系统，XRP Ledger 具有更快的**交易确认速度**和**更低的交易费用**。同时，其链上交易体积也十分可观，使其成为企业级 web3 应用的首选之一。
与以太坊不同的是，XRPL 没有类似 EVM 这样的概念，类似地，它的每一个网络节点被称作 XRP Ledger Server。
XRP Ledger Server 有多种类型，包括验证节点（validator），历史节点（history server）和钱包节点（full client），它们的职能如下：

- 验证节点是 XRP Ledger 网络的核心节点，它们验证交易并生成新的区块，确保分布式账本的一致性和安全性。
- 历史节点则维护 XRP Ledger 的完整历史记录，并为钱包节点提供服务。
- 钱包节点充当轻量级客户端，向用户提供访问 XRP Ledger 的接口和功能。

但通常我们也不用刻意区分这些节点类型，而是直接通过 WebSocket 或 JSON RPC 的方式调用相关接口来与 XRP Ledger 区块链网络进行交互。
<a name="sdWFy"></a>

### Transaction

> [https://xrpl.org/transaction-basics.html](https://xrpl.org/transaction-basics.html)

Transaction（交易）是修改 XRP 分类账的唯一方式。交易只有在签名、提交并经过共识过程接受到验证分类账版本后才是最终的。一些分类账规则也会生成 Pseudo Transaction（伪交易），这些伪交易不需要签名或提交，但仍必须经过共识过程接受。失败的交易也会被纳入分类账中，因为即使它们失败了，但它们也支付了交易花费（[Transaction Cost](https://xrpl.org/transaction-cost.html)）从而导致账户 XRP 余额的变化。
交易不仅限于发送货币，除了支持各种付款类型外，XRP 分类账中的交易也用于轮换加密密钥，管理其他设置，并在 XRP 分类账的去中心化交易所中交易，所有的交易类型可[参考](https://xrpl.org/transaction-types.html)。
发送一笔交易，需要声明若干字段如 Account、TransactionType 以及 Fee 等等，这些字段的语义都十分简单，这里不再赘述，详情可参考[官方文档](https://xrpl.org/transaction-common-fields.html#flags-field)以及所有[全局字段](https://xrpl.org/transaction-common-fields.html#transaction-common-fields)。
除此之外，有几个值得一提的特殊字段，如下：

- Sequence：交易的序列号，一个交易是否合法的校验规则之一是该交易的序列号，是否比同一个账户的上一笔交易大 1，该字段虽然是必填项，但是可以通过`xrpl.autofill`自动填充。
  - Sequence 有一个特殊的值是 0，它的含义代表当前的交易使用了 Ticket 机制。
- TicketSequence: Ticket 的序列号，Ticket 是用于抽象一个还未发生的交易，但 Sequence 需要递增，详见 Best Practice 中的【并发交易请求】章节。
- AccountTxnID：表示该交易是否依赖于上一笔交易，只有声明和 hash 和上一笔交易匹配时，该交易才合法，该字段的逻辑含义是将发生的交易链条化。
- Flags：交易的标识位，根据交易 TransactionType 的不同，会衍生出只应用于该类型的标识位，如 NFTokenMint 交易类型 中的 tfTransferable（`0x00000008`）和 tfBurnable（`0x00000001`）标识位，当要同时声明多个标识位时，将这些标识位的枚举值相加即可，如同时声明 tfTransferable 和 tfBurnable 为 `0x00000009`（`0x00000008`+ `0x00000001`）。
- LastLedgerSequence: 账本块的序列号，每一笔合法交易，最终都会包含在一个账本块中，该字段表示包含该交易的账本块的最大序列号，逻辑含义是一笔交易的最大超时间隔，该字段也是 XRP Ledger 官方文档强烈建议设置的字段。
- Memos: 自定义数据，该字段可用于添加一些用于描述交易额外信息的数据，但数据结构需符合 [MemosField](https://xrpl.org/transaction-common-fields.html#memos-field)，并且其中每个字段都进行编码，之后再转码成 hex 格式，对于每个字段，它的存储空间最大为 1KB，这意味着它的最大长度为 1024 个字符（1 KB => 1024 byte => 1024 utf-8 chars）。
  <a name="Mpw3Q"></a>

### 常见错误代码

发起的交易失败时，会返回错误代码以提示失败原因（关于所有错误代码[详见](https://xrpl.org/transaction-results.html)），最常见的有以下几个：

- temDISABLED：XRP Ledger 网络未启用 Non FungibleTokens 模块。
- temMALFORMED：交易格式无效，请尝试详细阅读不同交易类型的交易的必填字段和参数类型。
- tecNO_PERMISSION：该交易的发起者不具备发起交易的权限，通常是由于之前的交易定制了一些特殊的权限规则，如 NFTokenCreateOffer 中的 Destination 字段。
  <a name="bk3qc"></a>

## NFTs of XRPL

> [https://xrpl.org/non-fungible-tokens.html#nfts-on-the-xrp-ledger](https://xrpl.org/non-fungible-tokens.html#nfts-on-the-xrp-ledger)

在 XRP Ledger 上，非同质化代币被表示为 [NFToken](https://xrpl.org/nftoken.html) 对象。 NFToken 是一种独特的、不可分割的单位，不用于支付。用户可以铸造（创建）、持有、购买、销售和销毁此类代币。
为了节省空间，账户在单个 [NFTokenPage](https://xrpl.org/nftokenpage.html) 对象中存储最多 32 个所拥有的 NFToken 对象。因此，当账户需要新增一页以存储更多的代币时，所有者的储备要求才会增加。
账户还可以指定经纪人或“授权铸造者”，代表其铸造和销售 NFToken 对象。
在代币铸造时，XRPL 定义了一些设置，这些设置在之后不能更改。这些设置包括：

- 各种唯一定义此代币的身份标识数据。
- 发行者是否可以销毁持有人不论如何持有这个代币。
- 持有者是否可以将代币转移给其他人。（NFToken 可以直接发送/接收到发行者账户。）
- 如果允许转移，发行者可以按售价的百分比收取转移费用。
- 持有者是否可以以 [Fungible Token](https://xrpl.org/tokens.html) 数额或仅使用 XRP 出售 NFToken。

NFToken 的流转通过 [NFTokenOffer](https://xrpl.org/nftokenoffer.html) 来抽象，根据 NFTokenOffer 流转方式的不同，NFToken 的交易模式可以分为直接交易和中介人交易两种模式，[详见](https://xrpl.org/non-fungible-token-transfers.html#trading-modes)。
<a name="dGHIE"></a>

## NFToken 的生命周期

> [https://xrpl.org/non-fungible-tokens.html#nftoken-lifecycle](https://xrpl.org/non-fungible-tokens.html#nftoken-lifecycle)

NFToken 的生命周期如下图所示：
![the lifecycle of NFT on XRPL](/images/nft-of-xrpl/img1.png)
其中白色背景的矩形，均是 Transaction 类型，而灰色背景的矩形，均是 Ledger Object 类型。
关于 NFToken 的铸造和销毁，有以下两个交易类型：

- [NFTokenMint](https://xrpl.org/nftokenmint.html)：铸造 NFT
- [NFTokenBurn](https://xrpl.org/nftokenburn.html)：销毁 NFT

关于 NFTokenOffer 的创建和状态流转，有以下三个交易类型：

- [NFTokenCreateOffer](https://xrpl.org/nftokencreateoffer.html)：发起 Offer
- [NFTokenAcceptOffer](https://xrpl.org/nftokenacceptoffer.html)：承认 Offer
- [NFTokenCancelOffer](https://xrpl.org/nftokencanceloffer.html)：取消 Offer
  <a name="CJQ8o"></a>

## NFToken 的铸造与销毁

<a name="QIfEL"></a>

### NFTokenMint

> [https://xrpl.org/nftokenmint.html#nftokenmint](https://xrpl.org/nftokenmint.html#nftokenmint)

NFTokenMint 交易请求在 XRP Ledger 中用于铸造新的非同质化代币。当发行人想要发布新的代币时，可以通过使用该交易请求指定代币的名称、数量、所有者和其他相关信息。这个过程是可逆的，如果交易失败，代币不会被铸造并且不会有任何费用。
该交易类型有几个值得一提的特殊字段（关于全部字段[详见](https://xrpl.org/nftokenmint.html#nftokenmint-fields)），如下：

- NFTokenTaxon: 表示具有关联性的 NFToken 的标识符，在常见的 NFT 交易所中，这个概念通常被称作 Collection（集合）。
- Issuer: 代表 NFToken 的发行者，在业务含义上，它表示铸造类型是**直接铸造**还是**间接铸造**
  - 直接铸造：该字段和发起该交易的账户是一致的，这种情况下，**一定**要**省略**该字段，不然会报错。
  - 间接铸造：该字段和发起该交易的账户是不一致的，意味着铸造过程是代替某个账户完成的（比如交易所代替用户进行铸造），这种情况下，一定要**声明**该字段，不然会报错。
- TransferFee: 代表发生二次交易时的手续费**率**，它的范围是 0 - 50000，注意，这里的单位在逻辑层面表示**费率百分比**，单位是 0.1%，所以换言之，手续费率的范围是 0.00% - 50.00%，且该字段要求 NFToken 是可交易的（tfTransferable）。

该交易类型同时也支持几个特殊的标识位来定制 NFToken 的类型（关于全部标识位[详见](关于全部字段详见)），如下：

- tfBurnable: 是否可以被 Issuer 销毁（比如用于表示一次性使用的票据的 NFToken）。
- tfOnlyXRP: 是否可以用其他 Fungible Token 进行交易，如 USD 稳定币。
- tfTransferable: 是否可二次交易，这里有一个特殊情况，NFToken 始终可以在任何人与 Issuer 之间进行交易。
  <a name="KCoao"></a>

### NFTokenBurn

> [https://xrpl.org/nftokenburn.html#nftokenburn](https://xrpl.org/nftokenburn.html#nftokenburn)

NFTokenBurn 交易请求在 XRP Ledger 中用于销毁非同质化代币。当代币的所有者想要销毁代币时，可以通过使用该交易请求指定代币的数量和所有者，以及任何其他相关信息。销毁代币的数量会减少总代币数量。需要注意的是，一旦代币被销毁，它的所有权和数量都将永久消失，无法恢复。
需要注意的是，当 NFToken 的标识位包含 tfBurnable 时，Issuer（或授权铸造人）可以通过声明 Owner 字段将该账户的某个 NFoken 销毁。
<a name="Pnfwd"></a>

## NFToken 的流转

<a name="z4n32"></a>

### NFTokenCreateOffer

该交易要么创建一个新的出售代币（Sell）Offer，代币是由执行该交易的账户所有，要么创建一个新的购买代币（Buy）Offer，代币是由其他账户所有。如果成功，该交易将创建一个 NFTokenOffer 对象。每个报价都会计入下单者账户的所有者储备金（Owner Reserve）中的一个对象。
该交易类型有几个值得一提的特殊字段（关于全部字段[详见](https://xrpl.org/nftokencreateoffer.html#nftokencreateoffer-fields)），如下：

- Owner: 根据 Offer 的类型，该字段的逻辑含义和声明方式不同
  - 如果是 Buy，则 Owner 字段是**必须声明**，该值指向当前拥有该 NFToken 的账户地址。
  - 如果是 Sell，则 Owner 字段则**必须为空**，在逻辑上，它与当前发起交易的账户地址一致。
- Amount：表示交易该 NFToken 所需要的代币数量，代币不一定是 XRP，也可以是其他的 Fungible Token，同时也允许是 0（代表赠予）。
- Expiration：表示 Offer 的最大过期时间，该值的格式是以**秒**为单位的时间戳，且该时间戳是相对于 Ripple Epoch 的（它比正常的 Unix Epoch 迟 `946684800`秒）。
- Destination：表示该 Offer 仅可被指定的账户流转，常用于中介模式的交易流程中

该交易类型仅支持 tsSellNFToken 一个标识位，它用于声明该 Offer 的类型是 Buy 还是 Sell。
<a name="dlOeV"></a>

### NFTokenAcceptOffer

NFTokenAcceptOffer 交易用于接受购买或销售 NFToken 的 Offer。它可以：

- 允许接受一个报价，这被称为直接模式（direct mode）。
- 允许以原子的方式接受两个不同的报价，一个报价是出售给定的 NFToken，而另一个报价是购买相同的 NFToken，这被称为中介模式（Brokered Mode）。

该交易类型可声明如下字段：

- NFTokenSellOffer：准备接受的 Sell Offer 的标识 hash
- NFTokenBuyOffer：准备接受的 Buy Offer 的标识 hash
- NFTokenBrokerFee：仅在中介模式生效，声明中介在促成交易中所收取的手续费（不是费率，可以是 XRP 也可以是 Fungible Token）

交易 NFToken 方式有以下两种：

- 直接模式：买房和卖方直接交易，仅可以声明 NFTokenSellOffer 或 NFTokenBuyOffer 中的一个字段
- 中介模式：中间人负责对买房和卖方进行交易，需同时声明 NFTokenSellOffer 和 NFTokenBuyOffer 字段

用一张图来表示的话，如下图：
![the transfer mode of NFToken](/images/nft-of-xrpl/img2.png)
发起 NFTokenAcceptOffer 是否成功，XRP Server 会严格按照交易发起人和 Offer 创建人的关系来探测交易模式，之后再检验字段是否正确。
<a name="dJdlE"></a>

### NFTokenCancelOffer

NFTokenCancelOffer 交易可以用来取消使用 NFTokenCreateOffer 创建的 Offer（无论是 Buy 还是 Sell）。
一个 NFToken Offer 仅可通过以下三种方式取消：

- 创建 NFTokenOffer 交易的账户
- NFTokenOffer 交易的 Destination 字段中指定的账户（如果声明了该字段）
- 所发起的 NFTokenOffer 交易已过期（Expiration 字段的时间戳小于包含 NFTokenCancelOffer 交易的账本块的验证时间戳），任何人都可以取消该 Offer
  <a name="KUwEI"></a>

## Best Practice

<a name="O9rKn"></a>

### 交易请求字段尽量不要设置为 undefined

发送任何交易请求的参数字段尽量**不要**设置为`undefined`，因为`xrpl`在使用`sign`对交易请求进行签名时，会进行复杂的校验，其中会使用到`ripple-binary-codec`这个工具中的`[STObject.from](https://github.com/ripple/ripple-binary-codec/blob/e349cb87b236eedf175ae70cf56b143cdac1a1a4/src/types/st-object.ts#L91)`静态方法对参数对象进行序列化，其中有一段逻辑会将参数对象中，值为`undefined`的字段过滤掉。
但在调用`xrpl`库的`sign`时，生成签名之后，它内部会使用`[checkTxSerialization](https://github.com/XRPLF/xrpl.js/blob/0f02e78d106facbdcc7ddf94e9bb0b68594c9d3c/packages/xrpl/src/Wallet/index.ts#L460)`方法对该签名再进行一次校验，但是其中的校验逻辑不会忽略请求参数中哪些值为`undefined`的字段，因此就会抛出校验失败的异常，如下：
![the signature validation error thrown by xrpl sign method](/images/nft-of-xrpl/img3.png)
我认为这是`xrpl`的一个 bug，但考虑到生成签名之前，`xrpl`对请求参数会有一套规范对参数进行校验，同时还会填充一些字段的默认值，因此如果我们自己来封装签名方法还是比较麻烦的，所以我们尽量不要将请求参数字段设置为`undefined`是一个性价比最高的解决方案。
如果有些场景下，仍然需要对参数进行条件控制，可以利用 js 中对象的解构语法来做 workaround，如下：

```javascript
client.autofill({
  // 使用解构语法
  ...(nft.seq
    ? {
        Sequence: REPLACED_BY_TICKET_SEQUENCE,
        TicketSequence: nft.seq
      }
    : {}),
  TransactionType: 'NFTokenMint'
  // ...省略其他字段
});
```

<a name="ApwNk"></a>

### 利用位操作符解析 Flags 字段

由于 Flags 字段本身的数据结构是 [BitMask](<https://en.wikipedia.org/wiki/Mask_(computing)>)，因此可以使用与或操作符来快捷完成编码。
对于需要传递 Flag 标识位的场景，如发送交易，其逻辑为对所有标识位的枚举值求和，其逻辑等价于对这些标识位按位**或**，如下：

```javascript
// 假如 NFTokenMint 交易参数中，传递了 tfBurnable 和 tfTransferable

// 其值为 9，等价于 NFTokenMintFlags.tfBurnable + NFTokenMintFlags.tfTransferable
const Flags = NFTokenMintFlags.tfBurnable | NFTokenMintFlags.tfTransferable;
```

对于需要判定某个交易是否具备某个 Flag 标识位时，其逻辑等价于将 Flags 字段的值和该 Flag 标识位按位**与**，如下：

```javascript
// 假如上述例子中的 NFTokenMint 交易被验证，Flags 在 ledger 中的值为 9

// 这里要转换为 boolean 类型，因为逻辑操作符的返回值是 number 类型
const isTxBurnable = Boolean(Tx.Flags & NFTokenMintFlags.tfBurnable);
const isTxTransferable = Boolean(Tx.Flags & NFTokenMintFlags.tfTransferable);
```

<a name="gJwAS"></a>

### 获取 Account ID

可以直接通过`xrpl`提供的`decodeXAddress`方法从钱包地址解析出相应的 Account ID，如下：

```javascript
export const parseAccountId = (wallet: Wallet) => {
  return decodeXAddress(wallet.getXAddress())
    .accountId.toString('hex')
    .toLocaleUpperCase()
}
```

但要注意几点：

- 参数是 X-Address 格式的地址
- 方法返回类型为 Buffer，且编码格式为 `hex`，因此需要使用 `toString('hex')`来转换
- Account ID 大小写不敏感，转换为大写纯属是为了语义和可读性
  <a name="ObZxV"></a>

### XRP 数量的格式转换

在 XRP Ledger 中，针对 XRP 代币数量的表示，统一使用`drop`这个关键字表示，它与 XRP 的换算是 1 XRP = 1000,000 drops，在代码中，有以下两个工具函数来处理它们之间的换算，如下：

```javascript
import { dropsToXrp, xrpToDrops } from 'xrpl';

dropsToXrp('1000000'); // '1'
xrpToDrops('1'); // '1000000'
```

值得一提的是，它内部的实现使用了 `bignumber.js`，因此对于格式化的需求，可以直接参考`bignumber.js`的文档。
<a name="r3jpu"></a>

### 字符串的 Hex 格式转换

同理，一些字段 XRP Ledger 也要求它们以 Hex 的格式进行传递，这种情况`xrpl`也提供两个工具函数，如下：

```javascript
import { convertHexToString, convertStringToHex } from 'xrpl';

convertHexToString('mimetype'); // '6D696D6574797065'
convertStringToHex('696D6167652F6A706567'); // 'image/jpeg'
```

<a name="Q637d"></a>

### Promise.all 与 `autofill`

由上文可知，Sequence 在交易中必须是递增的（每次+1），因此当我们想要并发发送交易时，可能会想到先将多条交易使用`autofill`自动填充，再使用 `Promise.all`来控制发送交易的并发逻辑，如：

```javascript
const txs = [tx1, tx2];

Promise.all(
  txs.map((tx) =>
    client
      .autofill(tx)
      // 这里会报错，因为没个 prepared 中的 Sequence 都是相同的
      .then((prepared) => client.submitAndWait(prepared))
  )
).then(() => {
  // something...
});
```

当使用上面的代码发送请求时，会发现使用`autofill`方法多次生成交易请求参数的`tx_blob`中的 Sequence 字段是相同的，继而只有 tx1 被视为合法交易，而 tx2 则是非法交易。
这是因为`autofill`在填充 Sequence 字段时，会异步获取当前账户的上一条合法交易的 Sequence，因此在交易提交并被 XRP Ledger 验证之前，多次执行`autofill`方法会获得相同的 Sequence 字段而导致只有第一条交易是合法的，详见[源码](https://github.com/XRPLF/xrpl.js/blob/0f02e78d106facbdcc7ddf94e9bb0b68594c9d3c/packages/xrpl/src/sugar/autofill.ts#L76)，因此 Promise.all 和 autofill 配合使用本身就会产生 bug，且 XRP Ledger 关于 Sequence 字段的设计本意上就**不支持**并发发送交易的需求。
但对于对顺序不敏感的业务场景，比如批量铸造 NFToken，仍然希望并发发送请求该怎么办呢？请看下一个最佳实践。
<a name="AXxx5"></a>

### 并发交易请求

关于并发交易请求的场景，XRP Ledger 在基于 Sequence 字段的设计上，给出的解决方案叫作 [Tickets](https://xrpl.org/tickets.html#tickets)。
在 XRP Ledger 中，Ticket 是一种设置交易序列号而不立即发送的方式。Ticket 允许交易在正常的序列顺序之外发送。其中一种使用情况是允许进行多签名事务，可能需要一段时间来收集必要的签名：使用 Ticket 收集交易签名时，仍可以发送其他交易。
它的运作原理简单描述就是，Ticket 代表一个即将发生的交易，可以把它视作未来某个交易的占位符，在 Sequence 机制下，创建 Ticket 的交易可以声明创建几个 Ticket，这在逻辑上等于将 Sequence 往后递增几次，之后只需要使用 TicketSequence 字段来声明要使用哪个被 Ticket 占位的 Sequence 发送交易即可，如图：
![创建 Ticket 使 Sequence 递增](/images/nft-of-xrpl/img4.png)
![使用 TicketSequence 发送交易](/images/nft-of-xrpl/img5.png)
对于上一个最佳实践中的代码示例，可以改写为：

```javascript
const txs = [tx1, tx2]

client
  // 使用 TicketCreate TX 来创建 2 个 Ticket
  .autofill({
    TransactionType: "TicketCreate",
    Account: wallet.address,
    TicketCount: txs.length,
  })
  .then((prepared) => client.submitAndWait(w.sign(prepared).tx_blob))
  .then((res) =>
    txs.map((tx, idx) => ({
      ...tx,
      // 解析出所创建 Ticket 的 seq 值，后面会用到
      seq: res.result.Sequence! + idx + 1,
    })))
  .then(txs => Promise.all(
    txs.map(
      tx => client.autofill({
        ...tx,
        // 这里必须要填写 0，代表这是一个准备替换 Ticket 的 TX
        Sequence: 0,
        // 显式传递 TicketSequence 字段
        TicketSequence: seq,
      }).then(prepared => client.submitAndWait(prepared))
    )
  ))
  .then(() => {
    // something...
  })
```

<a name="rvL8v"></a>

### 获取 NFToken 详情

获取 NFToken 详情的方法在 XRP Server 中是不存在的，这是因为 NFToken 并不是直接托管在 XRP Ledger 当中，而是以 NFTokenPage 的 ledger_entry 存在，因此 XRP Server 只能通过`[ledger_entry](https://xrpl.org/ledger_entry.html)`方法获取 NFTokenPage 详情。
另外一种方式则可以通过`[account_nfts](https://xrpl.org/account_nfts.html)`方法曲线救国，该方法会返回某个账户下的全部 NFToken，但它要求提供`account`字段作为请求参数，在某些场景下会不适用。
经过研究，我发现在 XRP Cilo Server 有一个叫做`nft_info`的方法，似乎和获取 NFToken 详情有关，但关键是 XRP Cilo Server 又是什么呢？引用官方文档的定义，

> Clio is an XRP Ledger API server optimized for WebSocket or HTTP API calls for validated ledger data.

Clio 服务器是一个不连接 p2p 网络，而是从已连接到 p2p 网络的指定 XRP Ledger 服务器中提取数据的服务器，通过高效地处理 API 调用，Clio 服务器可以帮助减轻运行在 p2p 模式下的 XRP Ledger 服务器的负载。因此可以将它等价看做 XRP Server 的只读版本，但是它本身也支持非常有限的查询方法，[详见](https://xrpl.org/clio-methods.html)。
值得一提的是，通常情况下，我们会用 `xrpl`这个库与 XRP Server 进行交互，由于 Cilo XRP Server 与 XRP Server 完全兼容，所以直接使用 `xrpl`的 Client 构造函数新建一个客户端实例即可。
因此，查询 NFToken 详情的代码实现为：

```javascript
import { Client } from 'xrpl';

const ciloClient = new Client('wss://clio.altnet.rippletest.net:51233');

ciloClient
  .request({
    command: 'nft_info',
    nft_id: id
  })
  .then((res) => {
    console.log(res.uri);
  });
```

使用 Cilo XRP Server 获取数据还有一个好处，就是一些经过 Hex 编码的字段，如 `NFToken.URI`，已经在服务端还原成了原本的字符串，省去了在客户端进行转换的逻辑。
<a name="qj6hZ"></a>

### 获取 NFTokenPage 详情（Not Clarifying）

> Not Clarifying 的原因是因为官方文档对于 NFTokenPage 的描述非常含糊，并且和 XRP Ledger 上的表现形式不太一样
> 详见：[https://github.com/XRPLF/xrpl-dev-portal/issues/1712](https://github.com/XRPLF/xrpl-dev-portal/issues/1712)

由上文可知，NFToken 在 XRP Server 中托管在 NFTokenPage 中，因此，以分页的方式获取 NFToken 集合等价于获取 NFTokenPage 的详情。
获取 NFTokenPage 的详情可以通过调用`ledger_entry`实现，但其中最关键的参数是`ntf_page`参数，它的含义指 NFTokenPage 在 XRP Ledger 中的 Object ID，关于它的格式规范[详见](https://xrpl.org/nftokenpage.html#nftokenpage-id-format)。
<a name="ylM0u"></a>

#### 未分页情形

在 XRP Ledger 中，NFTokenPage 可以存储的 NFToken 个数上限是 32 个，这意味着当 NFToken 的个数小于 32 时，属于**无分页**的状态，该状态下，XRP Ledger 会将所有 NFToken 包含在一个特殊的 NFTokenPage（也可以叫做 "zero" page） 当中，该 NFTokenPage 的 Object ID 是如下格式：

> \<Account ID> + FFFFFFFFFFFFFFFFFFFFFFFF
> 注意：这里的 Account ID 不是账户的地址，是由账户的公钥计算出来的一个 hash

举个[例子](https://xrpl.org/websocket-api-tool.html?server=wss%3A%2F%2Fs.altnet.rippletest.net%3A51233%2F&req=%7B%22command%22%3A%22ledger_entry%22%2C%22index%22%3A%221C3B9953FFB1ED77E4BAB6E892631A0E7D964773FFFFFFFFFFFFFFFFFFFFFFFF%22%2C%22ledger_index%22%3A%22validated%22%7D)：

> 1C3B9953FFB1ED77E4BAB6E892631A0E7D964773FFFFFFFFFFFFFFFFFFFFFFFF

打开例子所指向的 XRP Ledger WebSocket Tool 点击 Send Request 可以发现有若干 NFToken 包含在这个 NFTokenPage 中。
<a name="gXj1t"></a>

#### 分页情形

当 NFToken 的个数超过 32 时，XRP Ledger 会创建一个新的 NFTokenPage 并将一些 NFToken 与它关联，一个 NFToken 是否可以与 NFTokenPage 进行关联，取决于它俩的 Object ID，引用官方文档的描述：

> More specifically, a NFToken with the NFTokenID value A can be included in a page with NFTokenPage ID B if and only if low96(A) >= low96(B).

举个[例子](https://xrpl.org/websocket-api-tool.html?server=wss%3A%2F%2Fs.altnet.rippletest.net%3A51233%2F&req=%7B%22command%22%3A%22ledger_entry%22%2C%22index%22%3A%22692440633423B25858A258E0A5A95E1038D3E2EC38D3E2ECC1A495EB0000001B%22%2C%22ledger_index%22%3A%22validated%22%7D)：
NFToken ID （变量 A）为

> 00080000692440633423B25858A258E0A5A95E1038D3E2EC6E4DD9E70000001F

NFTokenPage ID（变量 B） 为

> 692440633423B25858A258E0A5A95E1038D3E2EC38D3E2ECC1A495EB0000001B

此时`low96(A)`等于`38D3E2EC6E4DD9E70000001F`，而`low96(B)`等于`3E2ECC1A495EB0000001B`，计算可知`low96(A) > low96(B)`，因此该 NFToken 可以被包含在 NFTokenPage 中。
打开例子所指向的 XRP Ledger WebSocket Tool 点击 Send Request 之后根据 `00080000692440633423B25858A258E0A5A95E1038D3E2EC6E4DD9E70000001F`搜索可以验证上述过程是正确的。
值得一提的是，该算法不适用与 zero page，zero page 是一个特殊情况。另外，即使在分页情形下，zero page 也是存在的，这与传统的分页解决方案不一致，具体原因未知，这也是我把该条 Best Practice 标记为 Not Clarifying 的原因。
