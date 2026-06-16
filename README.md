# Hiskens Proxy

用于存放自维护的妙妙屋（MiaoMiaoWu）“预设代理组配置”JSON 文件。

## 目录约定

- `presets/`：实际给妙妙屋导入/引用的预设 JSON。
- `examples/`：示例或草稿配置。

## 使用方式

当前维护的综合版预设：

```text
presets/hiskens-comprehensive.json
```

GitHub raw 地址：

```text
https://raw.githubusercontent.com/SDDKKK/Hiskens-proxy/main/presets/hiskens-comprehensive.json
```

如妙妙屋服务器访问 GitHub raw 不稳定，可使用 gh-proxy 包装：

```text
https://gh-proxy.com/https://raw.githubusercontent.com/SDDKKK/Hiskens-proxy/main/presets/hiskens-comprehensive.json
```

## 校验

提交前可运行：

```bash
python3 -m json.tool presets/hiskens-comprehensive.json >/dev/null
python3 scripts/validate_proxy_group_keys.py presets/hiskens-comprehensive.json
```

## 妙妙屋脚本覆写：线路 / 家宽自动归类

`scripts/line-home-override.js` 是给妙妙屋“脚本覆写”功能粘贴使用的 JavaScript：

- 节点名称包含 `线路|` 或 `线路 |` → 自动进入 `线路` 代理组；
- 节点名称包含 `家宽|` 或 `家宽 |` → 自动进入 `家宽` 代理组；
- 自动过滤 `到期`、`剩余`、`流量`、`订阅`、`expire`、`traffic` 等订阅信息节点。

每次妙妙屋生成订阅时，脚本会根据当前 `config.proxies` 重建这两个 select 组，避免手工维护组内节点列表。
