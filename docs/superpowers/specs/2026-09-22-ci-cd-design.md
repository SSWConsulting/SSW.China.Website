# SSW.cn 部署流水线设计

日期：2026-09-22

## 目标

main 分支有更新时自动构建，构建通过则发布到阿里云服务器的站点目录。
构建失败时线上保持上一个可用版本。

## 环境事实（已在服务器上验证）

| 项目                  | 值                                                |
| --------------------- | ------------------------------------------------- |
| 服务器系统            | Windows，Nginx for Windows（装在 `C:\SSW\Nginx`） |
| 站点目录              | `C:\SSW\Nginx\html\sswchina`                      |
| Node / npm            | v24.11.1 / 11.6.2（与本地 v24 一致）              |
| git                   | 2.35.1.windows.2                                  |
| 出站 443 → github.com | 通（`TcpTestSucceeded: True`）                    |
| 出网方式              | NAT（内网地址 172.31.190.109）                    |
| 仓库                  | `ZPREHZ/ssw.cn`，**私有**，默认分支 `main`        |
| 站点目录现有内容      | 16 项，全部为构建产物，无额外文件                 |
| 同机其他项目          | `C:\SSW\Nginx\html\` 下有其他项目的部署目录       |

## 方案：self-hosted runner + 本机拷贝

在服务器上运行 GitHub runner 服务，由它**主动外连** GitHub 拉取任务。
构建与发布都发生在服务器本机，因此"上传"退化为本地目录拷贝。

### 为什么不用 SSH 推送

- 服务器走 NAT 出网，开入站需要改安全组 + 配端口转发
- 需要把私钥存进 GitHub Secrets
- 公网暴露 SSH 端口会被持续扫描
- GitHub Actions 官方 IP 段很大且会变，白名单维护成本高

self-hosted runner 只需出站连接，安全组无需任何入站规则，
GitHub 上不存储任何服务器凭据。

### 流程

```
push 到 main（含 PR 合并）
  └─> GitHub 通知服务器上的 runner
       └─> runner 在服务器本机执行：
            1. checkout main 最新代码
            2. npm ci
            3. npm run typecheck / npm run contrast / npx vite build
            4. 失败 → 终止，站点目录不动
            5. 通过 → robocopy dist → C:\SSW\Nginx\html\sswchina /MIR
```

**发布门禁**：第 3 步通过才执行第 5 步。构建失败时线上保持上一个可用版本。

### 校验层级选择

跑 `typecheck` + `contrast` + `vite build`，不跑完整的 `npm run verify`。

原因：`verify` 里的 `format:check` 和 `seo:check` 在 Windows 上会全量报错。
仓库中存储的是 LF 行尾，而 Windows 的 git（`core.autocrlf=true`）检出时
转成 CRLF，prettier 和 SEO 脚本都按 LF 比对，于是判定"不一致"。
已逐字节验证：忽略行尾后内容完全相同，属于误报而非真实问题。

runner 跑在同样的 Windows 服务器上，会遇到同一问题，因此这两项若纳入
门禁会导致每次部署必然失败。它们属于代码风格守卫，不影响站点功能，
留给本地开发和 code review 把关。

保留的三项都已验证在当前代码上通过：
- `typecheck` —— 类型错误会导致页面行为异常，必须拦
- `contrast` —— 可访问性守卫，通过
- `vite build` —— 构建本身，产物是发布内容

### 拷贝方式：robocopy /MIR

Windows 自带，镜像同步：新增的加上、删除的删掉、未变动的跳过。
36MB 产物中大部分是极少变动的 media，增量特性使实际传输量很小。

`/MIR` 会删除目标目录中源目录不存在的文件。已验证站点目录当前 16 项
全部为构建产物，无备案文件、证书或用户上传内容，故可安全使用。

**此前提若变化**（例如将来往站点目录手工放置验证文件），
必须改用非镜像模式或添加排除规则，否则该文件会被静默删除。

### 多项目共存

同机 `html\` 下有其他项目部署。`/MIR` 作用范围严格限于指定的单个目录，
不影响同级目录。runner 打专属标签，工作目录限定在独立路径。

## 变更范围

新增 `.github/workflows/deploy.yml`（约 40 行）。不修改任何现有代码。

## 回滚

在 GitHub 上 revert 相应提交并合回 main，流水线自动重新发布上一版本。
无需登录服务器。

## 安全考量

- 仓库为私有，仅团队成员可提交，self-hosted runner 执行仓库代码的风险可接受
- workflow 只监听 main 分支 push，不对 PR 触发，避免未合并代码在服务器上执行
- 服务器仅需出站连接，无入站端口暴露
- GitHub 端不存储服务器凭据

## 一次性准备

由人工在服务器上完成：下载 GitHub runner、注册到仓库、安装为 Windows 服务
（开机自启）。具体命令见 `docs/DEPLOY-SETUP.md`。

## 首次发布建议

第一次自动发布时人工在旁观察，确认 `/MIR` 结果符合预期后转为全自动。
