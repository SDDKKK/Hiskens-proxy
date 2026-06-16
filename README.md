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
