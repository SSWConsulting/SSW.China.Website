# 部署配置：在服务器上装 GitHub runner

一次性操作。装好之后 main 每次更新都会自动构建并发布，不用再手动拷贝。

设计说明见 `docs/superpowers/specs/2026-09-22-ci-cd-design.md`。

## 它是怎么工作的

构建在 GitHub 托管的 `ubuntu-latest` 上完成，产物（dist）上传为 artifact。
服务器上跑一个 GitHub runner 服务，**主动外连** GitHub 拉取发布任务：只下载产物、拷贝到站点目录。
所以不需要 SSH、不需要密钥、安全组不用开任何入站端口，服务器上也**不需要装依赖、不构建**
（原因见 DECISIONS §110）。

```
你合并 PR 到 main
  ├─> GitHub 托管的 runner（build）
  │    ├─ 拉代码 → npm ci → 格式 + 对比度 + 类型检查 + 编辑后台 + 构建 + SEO
  │    ├─ 校验失败 → 停止（线上保持原样）
  │    └─ 校验通过 → 上传 dist 为 artifact
  └─> 服务器上的 runner（publish）
       └─ 下载 artifact → 拷贝到 C:\SSW\Nginx\html\sswchina
```

服务器需要能访问 github.com（拉任务、下载 artifact）。

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

## 编辑后台（TinaCMS）的凭据

`/admin/` 编辑后台需要两个 GitHub secret：`PUBLIC_TINA_CLIENT_ID` 与 `TINA_TOKEN`。
取得与配置方法见 [`TINACMS.md`](TINACMS.md)。没配置时部署照常进行，只是产物里不含 `/admin/`。配置后 `/admin/` 是跳转到预览站后台的页面，表单编辑的后台在 `/admin/forms/`（DECISIONS §113）。

编辑在后台保存后，TinaCloud 会把改动提交到 main，从而触发这里的部署流程，不需要另外配置。

## 首次发布

合并任意一个 PR 到 main，或在 GitHub 的 **Actions** 页面手动点
**构建并发布** → **Run workflow**。

**第一次建议在旁边看着跑**，确认站点目录结果正常之后就可以完全放手了。

## ssw.cn/admin 反代到预览站（可视化编辑）

让 `https://ssw.cn/admin` 直接是「左表单、右预览」，地址栏不变（DECISIONS §116）。
配置在 [`deploy/nginx-admin-proxy.conf`](../deploy/nginx-admin-proxy.conf)，要在服务器上手工加一次 ——
nginx 配置不在发布流程里。下面的命令都在服务器的 PowerShell 里执行。

**1. 先确认服务器连得上预览站**（不通就停在这一步，别改 nginx）：

```powershell
curl.exe -s -o NUL -w "%{http_code} %{time_total}s`n" https://ssw-china-preview.vercel.app/admin/index.html
curl.exe -s -o NUL -w "%{http_code} %{time_total}s`n" https://ssw-china-preview.vercel.app/admin/preview/
```

两条都应是 `200`，耗时最好在 1 秒左右；多跑几次，若经常超时或几秒以上，编辑时预览会很卡。

**2. 找到 ssw.cn 的 server 块并备份**：

```powershell
cd C:\SSW\Nginx
Select-String -Path conf\*.conf, conf\*\*.conf -Pattern "server_name.*ssw\.cn"
Copy-Item <上一步找到的文件> <同名文件>.bak-admin-proxy
```

**3. 把 `deploy/nginx-admin-proxy.conf` 的内容粘进那个 `server { }` 块**（和已有的 `location` 并列），然后检查并重载：

```powershell
.\nginx.exe -t
.\nginx.exe -s reload
```

`-t` 报错就不要 reload，先把错误发出来。

**4. 验证**：浏览器打开 `https://ssw.cn/admin/`，地址栏不跳走，登录 TinaCloud 后打开任意「页面：…」，
应是左表单、右预览，输入时右侧实时更新。`https://ssw.cn/admin/forms/` 仍是表单编辑。

**撤回**：用备份文件替换回去，`nginx -t` 后 `nginx -s reload`。`/admin/` 回到站点目录里的跳转页（§113），
编辑者照样能用（地址栏会变成预览站域名）。

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

**校验失败（build job）**
→ 代码本身有问题（格式、类型错误、对比度或 SEO 不达标）。
线上没有被改动，修完再合一次即可。
本地跑 `npm run verify` 能复现同样的错误。

**下载产物失败（publish job）**
→ 服务器到 GitHub 的网络不通或很慢。build 成功的产物保留 7 天，
网络恢复后在 Actions 页面对该次运行点 **Re-run failed jobs** 即可，不用重新构建。

**服务没起来**
→ 检查服务状态：

```powershell
Get-Service actions.runner.*
```
