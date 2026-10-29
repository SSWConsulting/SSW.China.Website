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
取得与配置方法见 [`TINACMS.md`](TINACMS.md)。没配置时部署照常进行，只是产物里不含 `/admin/`。配置后 `/admin/` 是可视化编辑后台（见下文「可视化编辑的预览服务」），表单编辑的后台在 `/admin/forms/`（DECISIONS §113、§120）。

编辑在后台保存后，TinaCloud 建分支并开 PR（Editorial Workflow，DECISIONS §124）；PR 合并进 main 后触发这里的部署流程，不需要另外配置。

## 首次发布

合并任意一个 PR 到 main，或在 GitHub 的 **Actions** 页面手动点
**构建并发布** → **Run workflow**。

**第一次建议在旁边看着跑**，确认站点目录结果正常之后就可以完全放手了。

## 可视化编辑的预览服务（ssw.cn/admin）

`https://ssw.cn/admin/` 是可视化编辑（左表单、右预览，预览的就是网站页面本身）。后台是静态文件，随网站发布；
右侧预览随输入实时更新，靠服务器本机的一个小 Node 服务（DECISIONS §117、§120）：

```
浏览器 ──> ssw.cn/admin/、网站页面          nginx 直接给静态文件
       └─> ssw.cn/tina-island/…            nginx 转给 127.0.0.1:4330（预览服务）──> TinaCloud 读内容
```

- 服务目录 `C:\SSW\island-server\`：`supervisor.mjs`（守护进程）、`server\`（服务本体）、`island-server.log`（日志）。
- 计划任务「SSW island server」开机以 SYSTEM 启动 supervisor；它负责拉起服务、崩溃后重启、
  发现 `server\` 有更新就重启。发布流程只往 `server\` 里镜像新文件，**不需要**停止或启动服务的权限。
- 服务目录不存在时，发布流程跳过这一步，网站照常发布。
- 预览服务停了：后台仍能打开但右侧不更新、可能只剩「form fields will appear here」，
  这时用 `https://ssw.cn/admin/forms/`（表单编辑，不依赖预览服务）。

### 一次性安装（服务器上，管理员 PowerShell）

**1. 确认 Node 版本**：`node -v` 应为 `v22.18` 或更高。没装或太旧，到 nodejs.org 装 LTS 版本。

**2. 建目录，并让 runner 能写入**：

```powershell
New-Item -ItemType Directory -Force C:\SSW\island-server
Get-CimInstance Win32_Service | Where-Object Name -like 'actions.runner*' | Select-Object Name, StartName
icacls C:\SSW\island-server /grant "<上一条显示的 StartName>:(OI)(CI)M"
```

**3. 让发布流程把服务送上来**：在 GitHub 的 Actions 里手动重跑一次「构建并发布」（或等下一次发布），
完成后 `C:\SSW\island-server\server\entry.mjs` 应已存在。

**4. 注册并启动计划任务**：

```powershell
$node = (Get-Command node).Source
$action = New-ScheduledTaskAction -Execute 'cmd.exe' -WorkingDirectory 'C:\SSW\island-server' `
  -Argument "/c `"`"$node`" C:\SSW\island-server\supervisor.mjs >> C:\SSW\island-server\island-server.log 2>&1`""
$trigger = New-ScheduledTaskTrigger -AtStartup
$settings = New-ScheduledTaskSettingsSet -ExecutionTimeLimit ([TimeSpan]::Zero) -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)
Register-ScheduledTask -TaskName 'SSW island server' -Action $action -Trigger $trigger -Settings $settings -User 'SYSTEM' -RunLevel Highest
Start-ScheduledTask -TaskName 'SSW island server'
```

**5. 在服务器上直接测服务**（应输出 `200`）：

```powershell
(Invoke-WebRequest http://127.0.0.1:4330/tina-island/hero -Method Post -ContentType 'application/x-tina-preview+json' -Body '{}' -UseBasicParsing).StatusCode
Get-Content C:\SSW\island-server\island-server.log -Tail 20
```

**6. 配 nginx**：备份 ssw.cn 所在的配置文件，把 [`deploy/nginx-island.conf`](../deploy/nginx-island.conf)
的内容粘进 ssw.cn 的 `server { }` 块，`.\nginx.exe -t` 通过后重新加载（见下文「nginx 的缓存头与重新加载」）。

**7. 验证**：打开 `https://ssw.cn/admin/` 登录，打开任意「页面：…」，在左侧改字，右侧应立即更新。

### 日常与排查

- 改了 `deploy/island-server/supervisor.mjs`：发布会更新文件，但要 `Restart-ScheduledTask`（或重启服务器）才生效。
  服务本体（`server\`）的更新是自动的。
- 右侧预览不更新：看 `island-server.log`；`Get-ScheduledTask 'SSW island server'` 看任务状态。
- 撤回：删掉 nginx 里那一段并 reload，`Disable-ScheduledTask 'SSW island server'`。

## nginx 的缓存头与重新加载

配置文件是 `C:\SSW\Nginx\conf\nginx.conf`（同机多个站点共用一个文件），**不在仓库里**，改之前先备份。

### ssw.cn 的缓存头（2026-10-28 已配置，DECISIONS §124）

ssw.cn 的 `server { }` 块里，HTML 每次都向服务器确认，构建产物长期缓存：

```nginx
    location /assets/ {
        root html/sswchina;
        expires 1y;
        add_header Cache-Control "public, immutable" always;
        add_header Strict-Transport-Security "max-age=15552000; includeSubDomains; preload" always;
    }

    location / {
        root html/sswchina;
        index index.html;
        try_files $uri $uri/index.html $uri/ =404;
        add_header Cache-Control "no-cache" always;
        add_header Strict-Transport-Security "max-age=15552000; includeSubDomains; preload" always;
    }
```

- 没有这条时，浏览器会按启发式缓存继续用旧的 HTML：部署后（包括后台编辑的 PR 合并后）看不到新内容，后台右侧预览也可能还是旧页面。
- `no-cache` 不是不缓存，而是每次先问服务器；没变就返回 304，几乎不耗流量。`/assets/` 的文件名带哈希，内容变了文件名就变，可以缓存一年。
- **location 里一旦写了 `add_header`，server 级的 `add_header` 就不再继承**，所以 HSTS 要在每个这样的 location 里重复写。
- 不要改用 `location ~* \.html$` 来加头：`/`、`/about/` 这类干净 URL 由 `location /` 的 `try_files` 直接返回 `index.html`，
  不会再去匹配那个正则 location，头加不上。

### 重新加载（必须以 SYSTEM 身份）

nginx 由 SYSTEM 启动，**管理员 PowerShell 里的 `.\nginx.exe -s reload` 也会报**
`OpenEvent("Global\ngx_reload_…") failed (5: Access is denied)`，配置并没有生效。先检查语法，再借一个一次性的 SYSTEM 计划任务重新加载（不断线）：

```powershell
cd C:\SSW\Nginx
.\nginx.exe -t
schtasks /create /tn "nginx-reload-once" /tr "C:\SSW\Nginx\nginx.exe -p C:\SSW\Nginx\ -s reload" /sc once /st 23:59 /ru SYSTEM /f
schtasks /run /tn "nginx-reload-once"
Start-Sleep -Seconds 3
schtasks /query /tn "nginx-reload-once" /v /fo list | Select-String "Last Result|上次运行结果"
schtasks /delete /tn "nginx-reload-once" /f
```

- `Last Result` 为 `0` 即成功。`-p` 必须带，计划任务的工作目录不是 nginx 目录。
- `-t` 时出现 `duplicate MIME type "text/html"` 的警告是 aisec 站点 `sub_filter_types` 里多写了默认类型，与 ssw.cn 无关，不影响运行。
- 服务器上没有 `curl.exe`。验证响应头可以在本机用 `curl -sI https://ssw.cn/`，或在浏览器开发者工具的 Network 里看。

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
