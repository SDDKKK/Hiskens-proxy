#!/usr/bin/env python3
"""Validate Hiskens MiaoMiaoWu proxy_groups preset keys against MetaCubeX meta-rules-dat.

Usage:
  python3 scripts/validate_proxy_group_keys.py presets/hiskens-comprehensive.json
"""
from __future__ import annotations

import json
import sys
import urllib.parse
import urllib.request
from pathlib import Path
from urllib.error import HTTPError, URLError

RAW_BASE = "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo"
VALID_PRESETS = {"minimal", "balanced", "comprehensive", "experimental"}


def key_exists(kind: str, key: str) -> bool:
    """Check one key by HEAD against the raw .mrs URL.

    GitHub's contents/tree APIs can be paginated or truncated for this repository;
    direct HEAD checks are slower but authoritative for the keys actually used by
    our preset.
    """
    subdir = "geosite" if kind == "site" else "geoip"
    quoted = urllib.parse.quote(key, safe="!@-_+.")
    url = f"{RAW_BASE}/{subdir}/{quoted}.mrs"
    req = urllib.request.Request(url, method="HEAD", headers={"User-Agent": "Hermes-Hiskens-proxy-validator"})
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return 200 <= resp.status < 400
    except HTTPError as exc:
        return 300 <= exc.code < 400
    except URLError:
        return False


def main() -> int:
    if len(sys.argv) != 2:
        print((__doc__ or "").strip(), file=sys.stderr)
        return 2

    preset_path = Path(sys.argv[1])
    data = json.loads(preset_path.read_text(encoding="utf-8"))
    if not isinstance(data, list):
        print("ERROR: top-level JSON must be a list", file=sys.stderr)
        return 1

    names: set[str] = set()
    group_labels: set[str] = set()
    checked: dict[tuple[str, str], bool] = {}
    errors: list[str] = []
    warnings: list[str] = []

    for idx, cat in enumerate(data):
        prefix = f"[{idx}] {cat.get('name', '<missing-name>')}"
        name = cat.get("name")
        if not name:
            errors.append(f"{prefix}: missing name")
        elif name in names:
            errors.append(f"{prefix}: duplicate name")
        else:
            names.add(name)

        group_label = cat.get("group_label")
        if group_label:
            if group_label in group_labels:
                errors.append(f"{prefix}: duplicate group_label {group_label!r}")
            group_labels.add(group_label)

        for preset in cat.get("presets") or []:
            if preset not in VALID_PRESETS:
                errors.append(f"{prefix}: invalid preset {preset!r}")

        for rule in cat.get("site_rules") or []:
            key = rule.get("key")
            if key:
                checked.setdefault(("site", key), key_exists("site", key))
                if not checked[("site", key)]:
                    warnings.append(f"{prefix}: site key not found in MetaCubeX geosite: {key}")
        for rule in cat.get("ip_rules") or []:
            key = rule.get("key")
            if key:
                checked.setdefault(("ip", key), key_exists("ip", key))
                if not checked[("ip", key)]:
                    warnings.append(f"{prefix}: ip key not found in MetaCubeX geoip: {key}")

    for msg in warnings:
        print("WARN:", msg)
    for msg in errors:
        print("ERROR:", msg)

    print(f"checked_categories={len(data)} checked_keys={len(checked)} errors={len(errors)} warnings={len(warnings)}")
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
