---
title: 深入了解 Smart Contract ABI
publishDate: 2021/09/24
excerpt: 深入了解智能合约中 ABI 在 EVM 执行代码时所扮演的重要角色。
tags:
  - web3
author: You
---

## ABI 是什么

> The Contract Application Binary Interface (ABI) is the standard way to interact with contracts in the Ethereum ecosystem, both from outside the blockchain and for contract-to-contract interaction.

ABI 是与链下应用与合约交互，或者合约与合约之间进行交互时的通信协议，类似于 RPC，如果我们想要调用合约的某个方法，那么调用的过程必然有 ABI 进行参与。

## Function Selector

顾名思义，function selector 指在合约调用时，决定具体调用哪个方法的标识符。它的值是一个 sha3 hash 的截取值，具体公式如下：

> sha3(function signature).slice(4 bytes)

举个例子，假设方法签名是 `function baz(uint32 x, bool y)`，首先可以通过 sha3 计算出完成的 hash，如图：<br />![simple-sha3-calculation](/images/depth-in-smart-contract-abi/img1.png)

由于这里是 16 进制的数字，1 个 byte 有 8 bits，因此 1 个 byte 可以表示两个 16 进制数位，取前 8 位即可得到该函数签名的 selector，即 `e0563626`。

## Binary ABI

binary 格式的 ABI 包含在创建合约以及调用合约的 tx 的 tx data 字段中，它用于描述当前合约所包含的合约实现逻辑以及调用逻辑。为了节省存储空间，虽然这里是 binary 格式的数据，tx data 中所存储数据的格式是 16 进制的。

Solidity 中的最小存储单位是 byte，因此每个 16 进制数位就对应 1 个 byte，这是一种比较方便的计算合约存储空间的方式。

binary ABI 常用于合约与合约之间的调用，因为它们的编码方式更偏向于底层，因此可以得到更好的调用性能。

### 举个例子

以 TodoMVC 为例，假设通过 binary ABI 的方式来调用 `function add(string calldata topic, uint256 reward)` 方法来添加一个 topic 为 `todo`，reward 为 `1` 的 task，函数调用的代码如下：

> add("todo", 1)

最终调用方法的 ABI 编码是：

```
0x36555b85000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000004746f646f00000000000000000000000000000000000000000000000000000000
```

我们将它分为四部分，并分别作出说明：

```
0x36555b85
```

对应 add(string, uint256) 的 function selector

```
0000000000000000000000000000000000000000000000000000000000000040
```

对应 string 类型参数的偏移量，因为它是动态类型

```
0000000000000000000000000000000000000000000000000000000000000001
```

对应 uint256 类型参数的值，这里是 1

```
0000000000000000000000000000000000000000000000000000000000000004
```

对应 string 类型参数的长度，这里是 4

```
746f646f00000000000000000000000000000000000000000000000000000000
```

对应 string 类型参数的值，这里是 todo

## JSON ABI

JSON 格式的 ABI 同时是在合约编译时由 compiler 生成的，它的格式是 `.json`，为什么要生成它呢？这是因为对于合约的调用，还会从链下的应用发起，这些应用可能是服务端应用，也可能是客户端应用，但不管怎么说，这些高级语言对于处理 binary 数据总是需要花费额外的工作量的，而 JSON 作为当前普遍使用的数据交互格式，无非更具有优势。

JSON ABI 对于 function 的描述对象通常包含以下几个字段：

- `type`: 对应 Solidity 中的四种方法类型，分别是 `function`, `constructor`, `receive` 和 `fallback`
- `name`: 对应方法名称
- `inputs`: 方法参数描述对象的数组
  - `name`: 参数名称
  - `type`: 参数类型，这里的类型是规范化后的类型，比如：在大部分编程语言中，没有 `address` 这种类型，它的规范化类型是 `string`
  - `components`: 用于描述 `tuple` 类型，它是 Solidity 中 `struct` 类型的规范化类型
- `outputs`: 和 `inputs` 类型，但是用于描述方法返回值，Solidity 可以返回多个值，因此它也是数组
- `stateMutability`: 用于描述方法关于合约状态的使用级别，分别是 `pure`, `view`, `nonpayable` 和 `payable`

### 举个例子

同样以 TodoMVC 中的 `function add(string calldata topic, uint256 reward)` 方法为例，所生成的 JSON ABI 如下：

```json
{
  "inputs": [
    {
      "internalType": "string",
      "name": "topic",
      "type": "string"
    },
    {
      "internalType": "uint256",
      "name": "reward",
      "type": "uint256"
    }
  ],
  "name": "add",
  "outputs": [
    {
      "internalType": "bytes32",
      "name": "",
      "type": "bytes32"
    }
  ],
  "stateMutability": "nonpayable",
  "type": "function"
}
```

这里就不具体解释每个字段的含义了，可以参照上面的描述来理解它与函数签名各部分之间的对应关系。

## 参考

- [Solidity 官方 Contract API Spec 文档](https://docs.soliditylang.org/en/v0.8.7/abi-spec.html#contract-abi-specification)
