# 部署配置：在服务器上装 GitHub runner

一次性操作。装好之后 main 每次更新都会自动构建并发布，不用再手动拷贝。

设计说明见 `docs/superpowers/specs/2026-09-22-ci-cd-design.md`。

## 它是怎么工作的

服务器上跑一个 GitHub runner 服务，**主动外连** GitHub 拉取任务。
构建和发布都在服务器本机完成，所以不需要 SSH、不需要密钥、
安全组不用开任何入站端口。

```
你合并 PR 到 main
  └─> 服务器上的 runner 收到任务
       ├─ 拉代码 → npm ci → 类型检查 + 对比度 + 构建
       ├─ 校验失败 → 停止（线上保持原样）
       └─ 校验通过 → 拷贝 dist 到 C:\SSW\Nginx\html\sswchina
```

## 准备工作

在服务器上用**管理员** PowerShell 操作。

### 1. 建 runner 目录

```powershell
New-Item -ItemType Directory -Force C:\actions-runner
Set-Location C:\actions-runner
```

### 2. 下载 runner

去 GitHub 拿最新版下载地址：
仓库 → **Settings** → **Actions** → **Runners** → **New self-hosted runner**
→ 选 **Windows** / **x64**。

页面会给出当时最新版本的下载与解压命令，直接照抄执行
（版本号经常更新，这里不写死以免过期）。

### 3. 注册到仓库

同一页面上有一条 `.\config.cmd --url ... --token ...` 命令，
**token 有效期约一小时**，现取现用。

执行时会问几个问题，按下面回答：

| 提问                               | 回答                                                    |
| ---------------------------------- | ------------------------------------------------------- |
| Enter the name of the runner group | 直接回车（用默认）                                      |
| Enter the name of this runner      | 直接回车                                                |
| **Enter any additional labels**    | **`windows,sswcn`** ← 必须填，workflow 靠它找到这台机器 |
| Enter name of work folder          | 直接回车                                                |

标签填错的话任务会一直排队等不到机器。

### 4. 装成 Windows 服务

让它开机自启、后台常驻：

```powershell
.\svc.sh install
.\svc.sh start
```

如果上面两条提示找不到，用这组（不同版本命令不同）：

```powershell
.\config.cmd --runasservice
```

### 5. 确认在线

回到 GitHub 的 **Settings → Actions → Runners**，
应该能看到这台 runner 显示绿色 **Idle**。

## 首次发布

合并任意一个 PR 到 main，或在 GitHub 的 **Actions** 页面手动点
**构建并发布** → **Run workflow**。

**第一次建议在旁边看着跑**，确认站点目录结果正常之后就可以完全放手了。

## 回滚

在 GitHub 上 revert 那个提交并合回 main，流水线会自动重新发布上一版本。
不用登服务器。

## 注意事项

### 别往站点目录手工放文件

发布用的是 `robocopy /MIR` 镜像模式：**站点目录里凡是构建产物中没有的
文件，会被删除**，且不进回收站。

如果将来需要往 `C:\SSW\Nginx\html\sswchina` 放备案验证文件、
第三方平台的校验文件之类的东西，正确做法是**放进仓库的 `public/` 目录**，
它们会被构建带进 dist，从而稳定存在于线上。

直接丢进站点目录的话，下次发布就没了。

### 同机其他项目不受影响

`/MIR` 只作用于 `sswchina` 这一个目录，`html\` 下的其他项目目录不受影响。

## 排查

**任务一直 Queued 不动**
→ runner 掉线了，或标签没填对。检查 GitHub 上 runner 是否 Idle，
以及注册时标签是否为 `windows,sswcn`。

**校验失败**
→ 代码本身有问题（类型错误或对比度不达标）。
线上没有被改动，修完再合一次即可。
本地跑 `npm run typecheck` 和 `npm run contrast` 能复现同样的错误。

**服务没起来**
→ 检查服务状态：

```powershell
Get-Service actions.runner.*
```
