#!/usr/bin/env python3
"""Ensure Clash/Mihomo YAML has dynamic 线路 / 家宽 proxy groups.

The script adds or updates two proxy-groups that match node names by regex:

- 线路: matches names containing "线路|" or "线路 |"
- 家宽: matches names containing "家宽|" or "家宽 |"

It can be used on a MiaoMiaoWu v3 template YAML (recommended) or on a
rendered Clash/Mihomo subscription YAML. By default it writes a timestamped
backup next to the original file before modifying it.

Examples:
  python3 scripts/ensure_line_home_groups.py /opt/miaomiaowu/rule_templates/fake_ip__v3.yaml
  python3 scripts/ensure_line_home_groups.py /tmp/Hiskens-自用.yaml --dry-run
"""
from __future__ import annotations

import argparse
import shutil
from datetime import datetime
from pathlib import Path
from typing import Any

import yaml

EXCLUDE_FILTER = r"(?i)(到期|剩余|流量|订阅|时间|expire|traffic|reset|test|测试)"

GROUPS: list[dict[str, Any]] = [
    {
        "name": "线路",
        "type": "select",
        "include-all": True,
        "include-all-proxies": True,
        "include-all-providers": True,
        "filter": r"(?i)线路\s*\|",
        "exclude-filter": EXCLUDE_FILTER,
    },
    {
        "name": "家宽",
        "type": "select",
        "include-all": True,
        "include-all-proxies": True,
        "include-all-providers": True,
        "filter": r"(?i)家宽\s*\|",
        "exclude-filter": EXCLUDE_FILTER,
    },
]


def load_yaml(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as fh:
        data = yaml.safe_load(fh)
    if not isinstance(data, dict):
        raise ValueError(f"{path} does not contain a YAML mapping")
    groups = data.setdefault("proxy-groups", [])
    if groups is None:
        data["proxy-groups"] = []
    if not isinstance(data["proxy-groups"], list):
        raise ValueError("proxy-groups must be a list")
    return data


def group_index(groups: list[dict[str, Any]], name: str) -> int | None:
    for idx, group in enumerate(groups):
        if isinstance(group, dict) and group.get("name") == name:
            return idx
    return None


def insert_position(groups: list[dict[str, Any]]) -> int:
    """Place utility groups near the top, after auto/manual selector groups."""
    preferred_after = {"♻️ 自动选择", "⚡ 自动选择", "🚀 节点选择", "🚀 手动选择"}
    pos = 0
    for idx, group in enumerate(groups):
        if isinstance(group, dict) and group.get("name") in preferred_after:
            pos = idx + 1
    return pos


def ensure_groups(data: dict[str, Any]) -> tuple[bool, list[str]]:
    groups: list[dict[str, Any]] = data["proxy-groups"]
    changed = False
    messages: list[str] = []

    pos = insert_position(groups)
    for desired in GROUPS:
        name = desired["name"]
        idx = group_index(groups, name)
        if idx is None:
            groups.insert(pos, dict(desired))
            pos += 1
            changed = True
            messages.append(f"added {name}")
            continue

        current = groups[idx]
        updated = dict(current)
        # Keep display order stable but replace matching behavior with dynamic filters.
        updated.update(desired)
        # Dynamic include/filter groups should not keep a stale explicit node list.
        updated.pop("proxies", None)
        updated.pop("use", None)
        if updated != current:
            groups[idx] = updated
            changed = True
            messages.append(f"updated {name}")
        else:
            messages.append(f"unchanged {name}")

    return changed, messages


def dump_yaml(data: dict[str, Any]) -> str:
    return yaml.safe_dump(data, allow_unicode=True, sort_keys=False, width=120)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("yaml_path", type=Path, help="Clash/Mihomo YAML or MiaoMiaoWu v3 template to patch")
    parser.add_argument("--dry-run", action="store_true", help="print the updated YAML to stdout without writing")
    parser.add_argument("--no-backup", action="store_true", help="do not create a .bak timestamp backup before writing")
    args = parser.parse_args()

    data = load_yaml(args.yaml_path)
    changed, messages = ensure_groups(data)
    output = dump_yaml(data)

    print("; ".join(messages))
    if args.dry_run:
        print(output)
        return 0
    if not changed:
        return 0

    if not args.no_backup:
        stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        backup = args.yaml_path.with_name(args.yaml_path.name + f".bak-line-home-{stamp}")
        shutil.copy2(args.yaml_path, backup)
        print(f"backup: {backup}")

    args.yaml_path.write_text(output, encoding="utf-8")
    print(f"wrote: {args.yaml_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
