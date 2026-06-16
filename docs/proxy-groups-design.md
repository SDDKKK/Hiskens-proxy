# Hiskens proxy_groups.json 设计草案

> 目标：为 MiaoMiaoWu 的“预设代理组配置”维护一份属于 Hiskens 自己的大而全服务分类 / rule-provider 目录。妙妙屋可以在程序里选择想要的分类，因此本 JSON 的目标不是极简，而是“分类充分、命名稳定、可选择、可维护”。

## 0. 纠正后的设计原则

之前“首版保守、控制在少量分类”的思路不符合 Hiskens 的目标。新的原则是：

1. **大而全**：尽量覆盖常见服务、地区、媒体、开发、AI、社交、金融、教育、云服务、游戏平台、下载、隐私、网络测试等类别。
2. **可选择**：不是每个分类都必须启用；MiaoMiaoWu UI/程序侧可以选择需要的分类。
3. **目录化**：`proxy_groups.json` 是服务分类目录，不是完整 Mihomo `proxy-groups:` 模板。
4. **稳定命名**：`name` 用英文 kebab/短横或纯小写，长期不轻易改；`label/group_label` 可以优化中文展示。
5. **规则来源优先 MetaCubeX `.mrs`**：能用 `meta-rules-dat` 的 geosite/geoip key 就优先用简洁 `{ "key": "xxx" }`，让 MiaoMiaoWu 自动 normalize。
6. **避免重复但允许重叠**：比如 `youtube` 可以既属于单独分类，也被 `streaming` 大类覆盖；因为用户可以选择。
7. **按用途而不是按模板组来设计**：JSON 只回答“哪些服务应该归到哪个分类”，不回答“这个分类最终走哪个节点组”。

## 1. 当前部署事实

- 当前系统配置的 `proxy_groups_source_url`：
  `https://gh-proxy.com/https://raw.githubusercontent.com/iluobei/miaomiaowu/refs/heads/main/proxy_groups/proxy_groups.json`
- 当前用户设置：`template_version = v3`，`enable_proxy_provider = 1`，`sync_scope = saved_only`，`keep_node_name = 1`。
- 当前生成订阅：29 个 proxy-groups、26 个 rule-providers、27 条 rules、199 个 proxies。
- 已创建仓库：`https://github.com/SDDKKK/Hiskens-proxy`
- 本地仓库：`/home/Hiskens/projects/Hiskens-proxy`

## 2. JSON 字段约定

每个分类建议完整写出：

```json
{
  "name": "ai",
  "label": "AI 服务",
  "emoji": "🤖",
  "rule_name": "ai",
  "group_label": "🤖 AI 服务",
  "presets": ["balanced", "comprehensive"],
  "site_rules": [
    { "key": "category-ai-!cn" },
    { "key": "openai" }
  ],
  "ip_rules": []
}
```

### presets 语义

虽然我们做大而全目录，但 `presets` 仍然有价值：

- `minimal`：基础网络生存集，私有网络、国内、广告、漏网。
- `balanced`：Hiskens 日常高频，AI、GitHub、Telegram、Google、YouTube、流媒体、游戏、社交等。
- `comprehensive`：完整目录里的长尾分类，教育、金融、云服务、开发生态、下载、动漫、PT、区域媒体等。
- `experimental`：规则名不稳定、容易误伤或需要观察的分类。

## 3. 顶层分类蓝图

### A. 基础与安全

1. `private` / 🏠 私有网络
   - `ip_rules`: `private`
   - 用途：局域网、内网、保留地址。
   - presets: `minimal`, `balanced`, `comprehensive`

2. `ads` / 🛑 广告拦截
   - `site_rules`: `category-ads-all`
   - presets: `minimal`, `balanced`, `comprehensive`

3. `malware` / 🛡️ 恶意网站
   - 候选：`category-malware` / 需要验证。
   - presets: `comprehensive`, `experimental`

4. `privacy` / 🕵️ 隐私追踪
   - 候选：隐私/跟踪相关规则，需验证 MetaCubeX key。
   - presets: `comprehensive`, `experimental`

### B. 国内与直连

5. `domestic` / 🔒 国内服务
   - `site_rules`: `geolocation-cn`, `cn-domains`
   - `ip_rules`: `cn`
   - presets: `minimal`, `balanced`, `comprehensive`

6. `apple-cn` / 🍎 苹果中国
   - 候选：`apple-cn` 或 `apple` 拆分策略需验证。
   - 用途：App Store/CDN/Apple 中国可直连部分。

7. `microsoft-cn` / 🪟 微软中国
   - 候选：`microsoft-cn` 或 `microsoft` 拆分策略需验证。

8. `bilibili` / 📺 哔哩哔哩
   - `site_rules`: `bilibili`, `biliintl`
   - 可选：如果海外看 B 站，需要独立策略。

### C. AI 与知识工作

9. `ai` / 🤖 AI 服务
   - `site_rules`: `category-ai-!cn`, `openai`, `anthropic`, `google-gemini`
   - 已验证存在：`category-ai-!cn`, `openai`, `anthropic`, `google-gemini`
   - 不使用：`githubcopilot`（已验证 404，不存在）

10. `openai` / 🧠 OpenAI
    - `site_rules`: `openai`
    - 用途：如果想给 OpenAI 独立节点策略。

11. `anthropic` / 🧩 Anthropic
    - `site_rules`: `anthropic`

12. `gemini` / 💎 Gemini
    - `site_rules`: `google-gemini`

13. `perplexity` / 🔎 Perplexity
    - 候选：需验证 key 是否存在。

14. `notion` / 📝 Notion
    - 候选：`notion`，需验证。

### D. 开发与开源生态

15. `github` / 🐱 GitHub
    - `site_rules`: `github`, `gitlab`

16. `gitlab` / 🦊 GitLab
    - `site_rules`: `gitlab`

17. `developer` / 👨‍💻 开发者服务
    - 候选：`github`, `gitlab`, `stackoverflow`, `docker`, `npmjs`, `python`, `golang`, `rust`, `jetbrains` 等需验证。
    - 用途：大而全开发生态总组。

18. `package-registry` / 📦 包管理仓库
    - 候选：npm, PyPI, RubyGems, crates.io, Docker Hub 等；需确认 MetaCubeX key。

19. `docker` / 🐳 Docker
    - 候选：`docker`，需验证。

20. `cloudflare` / ☁️ Cloudflare
    - 候选：`cloudflare`
    - 注意：Hiskens 自托管服务很多，Cloudflare 单独分类比放进宽泛 cloud 更安全。

### E. Google / Telegram / 社交通讯

21. `google` / 🔍 Google 服务
    - `site_rules`: `google`
    - `ip_rules`: `google-ip`

22. `youtube` / 📹 YouTube
    - `site_rules`: `youtube`

23. `telegram` / 📲 Telegram
    - `site_rules`: `telegram`
    - `ip_rules`: `telegram-ip`

24. `whatsapp` / 💬 WhatsApp
    - 候选：`whatsapp`

25. `discord` / 🎙️ Discord
    - 候选：`discord`

26. `social` / 🌐 社交媒体
    - 候选：`facebook`, `instagram`, `twitter`, `tiktok`, `linkedin`, `reddit`

27. `twitter` / 🐦 X / Twitter
    - 候选：`twitter`

28. `tiktok` / 🎵 TikTok
    - `site_rules`: `tiktok`（上游已有）

29. `reddit` / 👽 Reddit
    - 候选：`reddit`

### F. 流媒体与内容平台

30. `streaming` / 🎬 流媒体
    - `site_rules`: `netflix`, `disney`, `hbo`, `amazon`, `bahamut`, `hulu`
    - 已验证存在：`netflix`, `disney`, `hbo`, `amazon`, `bahamut`, `hulu`

31. `netflix` / 🎞️ Netflix
    - `site_rules`: `netflix`

32. `disney` / 🏰 Disney+
    - `site_rules`: `disney`

33. `hbo` / 🎭 HBO / Max
    - `site_rules`: `hbo`

34. `primevideo` / 📦 Prime Video
    - `site_rules`: `amazon` 或更精确 key 需验证。

35. `spotify` / 🎧 Spotify
    - `site_rules`: `spotify`（上游已有）

36. `twitch` / 🟣 Twitch
    - 候选：`twitch`

37. `anime` / 🌸 动漫番剧
    - 候选：`bahamut`, `abema`, `dmm`, `niconico`, `pixiv`

38. `pixiv` / 🎨 Pixiv
    - `site_rules`: `pixiv`（上游已有）

39. `abema` / 🇯🇵 Abema
    - `site_rules`: `abema`（上游已有）

### G. 游戏

40. `gaming` / 🎮 游戏平台
    - `site_rules`: `steam`, `epicgames`, `ea`, `ubisoft`, `blizzard`

41. `steam` / 🕹️ Steam
    - `site_rules`: `steam`

42. `epicgames` / 🧱 Epic Games
    - `site_rules`: `epicgames`

43. `playstation` / 🎮 PlayStation
    - 候选：`playstation`

44. `xbox` / ❎ Xbox
    - 候选：`xbox`

45. `nintendo` / 🍄 Nintendo
    - 候选：`nintendo`

### H. 云服务、同步盘与生产力

46. `cloud` / ☁️ 云服务
    - 候选：`aws`, `azure`, `digitalocean`, `heroku`, `cloudflare`, `oracle`, `linode`
    - 注意：作为可选大类，不默认强制使用。

47. `aws` / 🟧 AWS
    - 候选：`aws`

48. `azure` / 🟦 Azure
    - 候选：`azure`

49. `google-cloud` / 🌥️ Google Cloud
    - 候选：需验证。

50. `storage` / 🗄️ 网盘与同步
    - 候选：`dropbox`, `onedrive`, `googledrive`, `icloud`

51. `microsoft` / 🪟 Microsoft
    - `site_rules`: `microsoft`

52. `apple` / 🍎 Apple
    - `site_rules`: `apple`, `applemusic`

53. `office` / 📄 办公协作
    - 候选：`microsoft`, `notion`, `slack`, `zoom`, `teams`, `atlassian`

### I. 金融、支付与交易

54. `finance` / 💳 金融服务
    - 候选：`paypal`, `visa`, `mastercard`, `stripe`, `wise`
    - 上游已有这些候选。
    - 注意：金融风控敏感，但既然是可选目录，可以收录。

55. `paypal` / 🅿️ PayPal
    - 候选：`paypal`

56. `crypto` / ₿ 加密货币
    - 候选：`binance`, `coinbase`, `okx` 等需验证。

### J. 教育、科研与知识库

57. `education` / 📚 教育资源
    - `site_rules`: `coursera`, `edx`, `udemy`, `khanacademy`, `category-scholar-!cn`

58. `scholar` / 🎓 学术科研
    - `site_rules`: `category-scholar-!cn`

59. `wikipedia` / 📖 Wikipedia
    - 候选：`wikipedia`

### K. 下载、BT、PT 与文件分发

60. `download` / ⬇️ 下载服务
    - 候选：下载站/CDN/软件分发规则需验证。

61. `pttracker` / 🧲 PT Tracker
    - `site_rules`: `pttracker`（上游已有但当前映射需检查）

62. `ptdomain` / 🏴‍☠️ PT 站点
    - `site_rules`: `ptdomain`（上游已有）

### L. 网络测试、代理与兜底

63. `networktest` / 📡 网络测试
    - 候选：`speedtest`, `ookla`, `fast`, `test-ipv6` 等需验证。

64. `proxy` / 🪜 代理服务
    - `site_rules`: `proxy`

65. `proxymedia` / 🎥 代理媒体
    - `site_rules`: `proxymedia`

66. `overseas` / 🌍 非中国
    - `site_rules`: `geolocation-!cn`
    - 这是大而全目录里的通用海外兜底分类。

67. `fallback` / 🐟 漏网之鱼
    - 最终对应 `MATCH`。
    - 可以不配置 rule provider，但要保留稳定 group label。

## 4. MetaCubeX 规则集引用方式

可以直接参考和使用 MetaCubeX `meta-rules-dat` 的规则集。目录入口：

```text
https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo
```

实际在 `proxy_groups.json` 里通常不需要写完整 URL，只要写 key，例如：

```json
{ "key": "github" }
```

MiaoMiaoWu 会 normalize 成类似：

```text
https://gh-proxy.com/https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/github.mrs
```

规则路径分两类：

```text
geo/geosite/<key>.mrs   -> domain 规则，放 site_rules
geo/geoip/<key>.mrs     -> ipcidr 规则，放 ip_rules
```

例如：

```json
{
  "name": "telegram",
  "label": "Telegram",
  "emoji": "📲",
  "rule_name": "telegram",
  "group_label": "📲 Telegram",
  "presets": ["balanced", "comprehensive"],
  "site_rules": [{ "key": "telegram" }],
  "ip_rules": [{ "key": "telegram" }]
}
```

上面两个 `telegram` key 分别对应：

```text
geo/geosite/telegram.mrs
geo/geoip/telegram.mrs
```

注意：同名 key 在 geosite 和 geoip 中不一定都存在，所以每个 key 都要按类型校验。

当前 GitHub API 读取到：

- `geo/geosite`: 333 个 `.mrs` 规则文件
- `geo/geoip`: 260 个 `.mrs` 规则文件

## 5. 初步已验证 key

已用 HTTP HEAD / GitHub API 验证 MetaCubeX `.mrs` 存在：

- `anthropic`
- `google-gemini`
- `disney`
- `hbo`
- `amazon`
- `bahamut`
- `hulu`
- `netflix`
- `openai`
- `category-ai-!cn`
- `geolocation-!cn`

已验证不存在：

- `githubcopilot`

## 6. 下一步工作流

1. 拉取 MetaCubeX `geo/geosite` 和 `geo/geoip` 目录索引，生成可用 key 清单。
2. 把上面的 67 个设计分类拆成：
   - `confirmed`: key 已存在，可直接写 JSON；
   - `needs-mapping`: 概念存在但 key 名需要查；
   - `experimental`: 可能误伤或规则不稳定。
3. 生成第一份正式文件：
   - `presets/hiskens-comprehensive.json`
4. 写校验脚本：
   - JSON syntax；
   - name 唯一；
   - rule key 可访问；
   - group_label 唯一；
   - presets 值合法。
5. 推送 GitHub 后，用 raw URL 在 MiaoMiaoWu 里测试 sync。

## 7. 文件命名建议

首个正式大而全版本：

```text
presets/hiskens-comprehensive.json
```

后续可选：

```text
presets/hiskens-balanced.json
presets/hiskens-minimal.json
presets/hiskens-experimental.json
```

但当前项目目标应以 `hiskens-comprehensive.json` 为主。
