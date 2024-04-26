---
title: 你不知道的 Git
publishDate: 2021/08/02
excerpt: 介绍版本控制工具 Git 中最基本的概念以及最佳实践。
tags: 
  - git
author: You
---

## commit 是什么

把暂存区的代码写入历史，进行一次提交，提交的过程就会生成一条新的 commit，所以我们可以定义 commit 为**记录项目代码的一个快照**。

一个 commit 快照通常包含如下信息：

- **tree sha**: 可通过 `git cat-file` 展开本次 commit 的整个目录树以及每个文件对象的 hash
- **commit sha**: 快照的标识符，是一个很长的 hash
- **commit message**: 快照的描述信息，通常和代码变动有关
- **author**: 作者
- **committer**: 提交者
- **commit date**: 提交日期
- **diffs notes**: 代码变动元数据
- **parent commit sha**: 快照的父节点的 hash

这里比较重要的信息是 `commit sha`，我们可以通过它来唯一标识一个快照，而一个快照对应若干代码的变动，从而达到版本控制的目的。

`commit sha` 的生成规则，简单来说就是使用 commit 中的字段经过多次哈希计算出来的一个 hash，如下图：<br />![](/images/you-do-not-know-git/img1.png)<br />可以发现它具有链式的特点，如果某个节点的 commit 的字段发生改变，则它本身以及后续的 commit 的 sha 都会发生改变。有没有觉得 git 的设计和 block chain 有异曲同工之处呢？只不过，git commit 的哈希链是一个**有向无环图（多对多）**，而 block chain 的哈希链是一个由随机抢答产生的哈希数连接起来的**链表（一对多）**。

## ref 是什么

> A ref is **an indirect way of referring to a commit**. You can think of it as a user-friendly alias for a commit hash.

ref 和 git sha 的关系好比**域名**和 **ip 地址**，同时它具有不同的种类：

- 特殊 ref：
  - HEAD，指向当前工作区的顶端（最新） commit
  - **-**，执行切换 ref 之前的那个 HEAD
- local ref: branch 和 tag，如 `feature-xxx` 和 `v1.0.0`
- remote ref: 以 remote name 为前缀的 branch 和 tag，如 `upstream/feature-xxx` 和 `origin/v1.0.0`
- upstream ref: local ref 在 remote repo 中的 remote ref 的指向

remote ref 和 local ref 的区别在于，remote ref 是只读的，因此当使用 `git checkout` 直接以 remote ref 作为 codebase 切换分支时，`HEAD` 不会自动跳转到 remote ref 的顶端 commit，如下图：<br />![](/images/you-do-not-know-git/img2.png)<br />正如图中所示，你需要使用 `git checkout -b` 的方式来创建一个 local ref，它是 remote ref 的副本。

## graph 是什么

通常在 git 中谈及 history，是指**提交历史**，而 graph 则指提交历史的**图形化展示**，如下：<br />![](/images/you-do-not-know-git/img3.png)<br />terminal 展示的 graph<br />![](/images/you-do-not-know-git/img4.png)<br />gitlab 生成的 graph

### 为什么需要 graph

我们知道，git 的提交历史，实际上是一个由 commit 形成的有向无环图，因此，当最新版本的代码发生 bug 时，我们可能讨论的话题会涉及

- 到底是哪个 commit 导致 bug 的发生？
- 这段代码的影响范围是什么？是否影响最新的 release 分支？
- 如果做回滚操作，它的影响范围又是什么？又会影响哪些分支？
- ...

如果导致 bug 的代码变动，包含在最近一段时间的 commit 中还比较好做 root cause，因为我们对于最新的 commit 以及代码变动都比较熟悉，往往可以很快定位问题。

如果 bug 是一个 regression 或者 incident 性质的 bug ，则它可能潜伏在若干历史 commit 中，这就比较棘手了，因为距离提交代码的时间点已经很久了，当时代码变动的影响范围，以及上下文需求早已被忘记，定位问题的效率就会被大大降低。

想要应对第二种情况，快速地找到到底哪条 commit 导致了 bug，比较建议的做法是，**在当前 commit 和任意不产生 bug 的 history commit（称作 stable commit） 之间，使用二分法来筛选和过滤 commit**，从而节约时间。

因此是否能够**快速找到一个 stable commit，以及能够梳理 branch 之间的关系，就显得尤为重要，**因此我们需要 graph 这种图形化的展示方式来帮我们完成这项工作。

另一方面，repo 的 maintainer 可能需要经常关注不同分支之间的代码同步状况，比如 release 分支的代码，要在下次 release 之前，合并回当前的 develop 分支，**graph 也能快速帮我们展示分支之间彼此的包含关系，以防出错**。

## rebase 和 merge

### 合并代码时的图形化演示

假设当前 feature 分支和 master 分支的图形化描述如下：<br />![](/images/you-do-not-know-git/img5.png)

以 **merge** 策略合并代码（gitlab 演示项目的 [graph](https://gitlab.jp.sbibits.com/haoliang.wu/you-dont-know-git/-/network/master?utf8=%E2%9C%93&extended_sha1=b10d286&filter_ref=1)）：<br />![](/images/you-do-not-know-git/img6.png)

以 **rebase** 策略合并代码（gitlab 演示项目的 [graph](https://gitlab.jp.sbibits.com/haoliang.wu/you-dont-know-git/-/network/master-by-rebase)）：<br />![](/images/you-do-not-know-git/img7.png)

### 优缺点对比

#### merge

- 特点：
  - 不会修改 commit 历史
  - 会自动创建一个 [merged commit](https://gitlab.jp.sbibits.com/BITS-X/vct-trade-webapp/-/merge_requests/1484/diffs?commit_id=cf78470157f99d6b5e06ba3e999f6001ae5113e9)（在某些情况下，可以通过 `--fast-forward` 参数省略）
- 优点：
  - commit 是**按真实的提交时间**来排序的
  - 合并代码或解决冲突时，绝对不会遗漏**任何**历史 commit
- 缺点：
  - 解决冲突时，需**一次性**解决**所有**冲突，对跨技术栈项目不友好
    - 不同技术栈的开发者可能需要在同一台电脑上完成解决冲突工作
    - 如果采用多阶段的策略，则必须要提交包含冲突代码的 commit
  - 由于自动创建 merged commit 的缘故，git commit 的 graph 非常混乱
    - 混乱程度与 feature 分支个数成正比，可能是下图这样（别以为它是一张电路图 😂）

![](/images/you-do-not-know-git/img8.png)

#### rebase

- 特点：
  - 可修改 commit 历史（默认是自动的，并可通过 `rebase -i` 来转换为手动交互式）
- 优点：
  - git commit graph 非常整洁
  - 解决冲突时，可多阶段解决冲突，对于跨技术项目更加友好
    - 多阶段解决冲突指，不同技术栈的开发者可以对同一分支多次进行 rebase 操作，只解决自己能够解决的冲突
    - 由于 rebase 操作会重写 git commit 的提交历史，因此不会有新的 commit 产生
- 缺点：
  - 合并代码或解决冲突时，如操作不当，有遗漏 commit 的风险
  - 当合并代码工作完成后发生问题，不容易定位 root cause，因为 commit 历史已被改写（blame 时，可能 commit 的作者不是真凶，而是 rebase 的那个人 😂）

### rebasing 黄金法则

> 永远不要在公共分支上进行 rebase 操作。

假设我们在 master 分支进行 rebase 操作的话，如下图所示：<br />![](/images/you-do-not-know-git/img9.png)<br />可以发现，由于其他协作者可能仍在 rebase 前的 master 上工作，当合并代码时，git 会认为你的 master 的历史 commit 和其他人的历史 commit 存在冲突。可能有人曾遇到这个问题，就是 git 提示代码有冲突，但是文件内容却完全一致，这往往是违反黄金法则而引起的。

### 理想中的代码合并流程

个人项目两种策略均可，大型协作项目建议完全使用 rebase 策略。

### 当前 VC 所采用的代码合并流程

- develop 作为公共分支，master 作为归档分支（指向最新 release 版本），release-xxx 作为发布分支
- 代码变更的发起端始于 feature branch
- feature branch 分为**公共**和**个人**两种
  - 公共 feature branch：通常用来开发新需求或大型优化
  - 个人 feature branch：通过用来做小型优化或 bug 修复
- feature branch 同步 develop 分支代码采用 **rebase **的策略，但根据 feature branch 是公共还是个人略有区别
  - 如果是公共 feature branch，因进行 rebase 操作**违反黄金法则**，所以需要对原分支进行**覆盖操作**
  - 如果是个人 feature branch，则可以随意进行 rebase 操作
- develop 同步 release 分支代码采用 **merge **的策略，虽然也可以使用 rebase 来同步并覆盖 develop 分支，但考虑到提交到 release 分支的代码往往比较敏感，如 hotfix 等，为降低丢失 commit 的风险，所以采用 merge 策略

## git 命令行

### git alias

git 提供 alias 功能以定制开发者使用 git 的方式，如我个人的 git alias 配置如下：

```
[alias]
    st = status
    ci = commit

    me = merge
    meff = merge --ff-only

    co = checkout

    br = branch

    re = rebase
    rei = rebase -i
    rec = rebase --continue
    res = rebase --skip
    rea = rebase --abort

    fb = reset HEAD~1
    fbf = reset HEAD~1 --hard
    ca = commit --amend
    can = commit --amend --no-edit

    lg = log --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr)%Creset' --abbrev-commit --date=relative

    # integrate scripts
    mr = !sh -c 'git fetch $1 merge-requests/$2/head:mr-$1-$2 && git checkout mr-$1-$2' -
    nb = !sh -c 'git stash && git co develop && git pull && git co -b feat-TRA-$1' -
    nbf = !sh -c 'git stash && git co develop && git pull && git co -b fix-TRA-$1' -
    sync = !sh -c 'git stash && git co $1 && git pull && git co -' -

    unstage = reset HEAD --
    last = log -1 HEAD
```

对于别名的命名因人而异，下文会分享几个非常实用的 git 命令行指令。

### 常用 git 命令行

#### 重命名 branch

```
git branch -m <old-name> <new-name>
```

之前见有同事重命名分支时是直接通过 `git checkout` 之后再通过 `git branch -D` 来删除旧分支，其实没有这个必要，可以通过上述命令直接重命名分支。

当 old-name 是当前分支时，可省略。

#### 快速以某个 ref 作为 codebase 切换并创建一个新的 ref

```
git checkout <ref> **-b** <new-ref>
git branch <new-ref> <ref>
```

通常创建分支的命令通过 `git branch` 来完成，但它只会创建而不会切换，我们可以通过上面的命令在切换的过程中，自动创建新的本地分支。

#### 快速切换上一个 ref

```
git checkout -
```

`-` 在 git 中是一个特殊的 commit 标识符，代表上一个分支，因此当在两个分支中来回切换时，可以始终执行这个命令，而不需要输入具体的名称。

#### 暂存/回滚未提交的本地代码变动

```
git stash
git stash pop
```

通过 `git stash` 命令可以方便的暂存和回滚本地工作区的代码变动，尤其是对于配置文件的变动，因为这些变动往往在调试期间需要更改，但却不需要同步到远端分支，因此在切换分支时，使用 git stash 来暂存这些变更，在切换后再回滚可以节省大量重复修改配置文件的工作量和时间。

#### 单条 commit 的粘贴与复制

```
git cherrypick <local-ref>
```

通过 git cherrypick 命令来完成**单条** commit 的粘贴与复制操作，特别适合在管理代码时，只有少量（**单条或不多于 5 条**） commit 需要同步的情况。

与 rebase 相同，git cherrypick 也会更改 git commit 的 commit sha（因为 commit parent 已改变），同时在粘贴复制过程中，不存在冲突会自动提交，如果存在冲突，则提交过程将会中断且会将变更留在暂存区，待开发者解决冲突后重新提交即可。

#### 以其他名称 push 本地分支至远端仓库

```
git push <remote-name> <local-ref>:<remote-ref>
```

默认情况下，`git push origin feature-xxx` 命令会将 `feature-xxx` 作为远端分支名称推送到 `origin` 上，如果要以别的名称，比如 `another-name` 推送该怎么办呢？

一种方法可以是通过 `git checkout` 来切换出一个新分支，在进行 `push`，当然这是笨办法。

另一种方式则是直接通过上述命令的格式来推送，即：

```
git push origin feature-xxx:another-name
```

值得注意的是，这里的 `<local-ref>` 可以是 git 中关于 commit 标识符的任意关键字，如 `head`，则代表当前分支。

#### push 时指定 upstream-ref 信息

```
git push <remote-name> <local-ref>:<remote-ref> -u
```

`-u` 参数代表当前 local-ref 的 upstream-ref 是哪个 remote-ref，指定之后，git 会返回如下信息提示：<br />![](/images/you-do-not-know-git/img10.png)<br />下次再 push 代码时，执行执行 `git push` 即可，后面的参数 git 都可以自动推断。

#### 回滚 N 条 commit 前的所有文件变更

```
git reset HEAD~N
```

这里的 N 可以是任意的数字，如果要丢弃变更，可以再加上 `--hard`（但注意如果是硬模式，代码没有备份的话，无法通过任何途径找回，因此不建议使用 `--hard` 参数）。

#### 编辑当前最新 的 commit

```
git commit --amend
```

可以编辑最新的 commit，包含提交时间、commit message 等，通常使用这条命令的场景时，修改 PR 中的 discussion 但无需提交额外的 commit。

默认情况下，执行该命令会进入一个 vim 交互页面以重新编辑 commit message 等信息，如果 commit message 无需变更的话，可以加上 `--no-edit` 参数，该参数会跳过进入 vim 编辑器的过程，直接使用当前最新的 commit。

#### 直接获取 PR 中，提交分支的 codebase

```
!sh -c 'git fetch $1 merge-requests/$2/head:mr-$1-$2 && git checkout mr-$1-$2' -
```

这里的 $1 代表 remote name，即远端仓库的别名，$2 是 PR 的 id，如 [https://gitlab.jp.sbibits.com/BITS-X/vct-trade-webapp/-/merge_requests/1514](https://gitlab.jp.sbibits.com/BITS-X/vct-trade-webapp/-/merge_requests/1514)，$2 则是 1514。

这个命令常用于 code reviewer，因为 code reviewer 如果想要直接在本地运行 PR 中提交的代码的话，除了先合并 PR 之外，也可以先通过这个命令行创建出一个临时分支来在本地运行。

由于这个命令非常长，建议配合 git alias 使用，如下：

```
git mr origin 1514
```

#### 简易的 git graph log

```
git log --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr)%Creset' --abbrev-commit --date=relative
```

该命令生成一个简易的 git graph log，如下图：<br />![](/images/you-do-not-know-git/img11.png)<br />同理，因命令行较长，建议配合 git alias 使用。

#### 快速同步最新代码，并以其作为 codebase 进行 rebase

```
git pull <remote-name> <remote-ref> --rebase
```

如果 remote ref 的名称和 local ref 一致，则可以直接省略 remote-ref。

如果 local ref 被指定过特殊的 upstream ref，则可以直接省略 remote-name

#### 交互式 rebase

```
git rebase -i <commit-sha>
```

默认情况下，rebase 策略在执行时采用是自动的，除非遇到冲突才会停止，因此诸如 git commit squash 等操作只能通过交互模式来完成，如下：<br />![](/images/you-do-not-know-git/img12.png)<br />里面包含若干 commands，分别对应关于 commit 的增删查改操作，比较常用的是 `edit` 和 `sqaush`。

## git 命名规范

### 关于 remote name 的命名

在工作中，我经常发现有的同时的 remote name 的命名有些奇怪，比如公共 repo 叫作 upstream，而自己的 repo 则叫作 origin，这是不对的。

通常情况下，我们习惯将提交 PR 的 repo 叫作 upstream，即**上游，**因为它是往公共 repo 提交 PR，所以它是公共 repo 的上游，而公共分支作为源代码的主 repo，应该叫做 origin，即**源。**

当然对于有特殊命名要求的开发者，可以使用其他命名规范。

### 关于 branch 的命名

通过简易采用如下格式：

```
<action>-<identifier>-<desc>
```

- action：代表分支修改代码的动作类型，如 fix，imp，misc 等
- identifier: 分支标识符，通常可以和项目管理工具耦合起来，比如 jira，这里可以使用 ticket id 来作为 identifier
- desc: 分支的额外描述，如 poc, test 等

前端当前规范不强制要求 `<desc>`，因此分支名称通常是 `feat-tra-10829` 或 `fix-tra-8293`。

## 实战演练

### 本地开发

#### 1. 远端 develop 已更新，同步代码时，因为本地 develop 分支已包含本地提交而失败了，请问如何最快速的同步远端 develop 的代码？

####

#### 2. 本地 develop 存在大量未提交的代码变更，但突然来了一个紧急的调查任务需切换至 release 分支，请问改如何切换？

#### 3. 提交代码后，PR 中有关于需要修改代码的 discussion，请问如何快速再次提交 PR？

### 代码管理

#### 1. release 分支发布后，代码如何回滚至 develop 分支（develop 分支可能已包含新的提交）？

#### 2. hotfix 分支发布后，其中包含 3 个 commit，但有两个是临时 commit，不需要合并回 develop 分支，请问该如何同步代码？

####

#### 3. 解决冲突时，发现了不属于当前技术栈的冲突，但对应技术栈担当有事不在，请问该如何应对这种情况？
