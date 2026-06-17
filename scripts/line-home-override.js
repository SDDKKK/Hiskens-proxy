function main(config) {
  // Hiskens 妙妙屋“脚本覆写”：
  // - 节点名称包含 “线路|” 或 “线路 |” -> 自动进入 “线路” 代理组
  // - 节点名称包含 “家宽|” 或 “家宽 |” -> 自动进入 “家宽” 代理组
  // - 其他代理组不再直接列出这些原始节点，而是统一通过 “线路” / “家宽” 两个代理组调用。
  //
  // 这个脚本应在最终订阅配置生成后运行（建议 hook: post_fetch，sort_order 靠后），
  // 因为它需要同时看到最终 config.proxies 和 config['proxy-groups']。

  if (!config) config = {};
  if (!Array.isArray(config['proxy-groups'])) config['proxy-groups'] = [];
  if (!Array.isArray(config.proxies)) config.proxies = [];

  var LINE_GROUP = '线路';
  var HOME_GROUP = '家宽';
  var EXCLUDE_RE = /(到期|剩余|流量|订阅|时间|expire|traffic|reset|test|测试)/i;
  var LINE_RE = /线路\s*\|/i;
  var HOME_RE = /家宽\s*\|/i;
  var CONTROL_PROXIES = {
    '🚀 节点选择': true,
    '🚀 手动选择': true,
    'DIRECT': true,
    'REJECT': true,
    '♻️ 自动选择': true,
    '⚡ 自动选择': true
  };

  function proxyName(proxy) {
    if (!proxy) return '';
    if (typeof proxy === 'string') return proxy;
    return proxy.name || '';
  }

  function collectNames(matchRe) {
    var names = [];
    var seen = {};

    config.proxies.forEach(function(proxy) {
      var name = proxyName(proxy);
      if (!name) return;
      if (EXCLUDE_RE.test(name)) return;
      if (!matchRe.test(name)) return;
      if (seen[name]) return;
      seen[name] = true;
      names.push(name);
    });

    return names;
  }

  function makeSet(names) {
    var set = {};
    names.forEach(function(name) {
      set[name] = true;
    });
    return set;
  }

  function findGroupIndex(name) {
    for (var i = 0; i < config['proxy-groups'].length; i++) {
      var group = config['proxy-groups'][i];
      if (group && group.name === name) return i;
    }
    return -1;
  }

  function preferredInsertIndex() {
    var afterNames = {
      '🚀 节点选择': true,
      '🚀 手动选择': true,
      '♻️ 自动选择': true,
      '⚡ 自动选择': true
    };
    var pos = 0;
    for (var i = 0; i < config['proxy-groups'].length; i++) {
      var group = config['proxy-groups'][i];
      if (group && afterNames[group.name]) pos = i + 1;
    }
    return pos;
  }

  function upsertSelectGroup(name, names) {
    // Mihomo 不喜欢空 select 组；极端情况下没有匹配节点时保留 DIRECT 兜底。
    var proxies = names.length > 0 ? names : ['DIRECT'];
    var desired = {
      name: name,
      type: 'select',
      proxies: proxies
    };

    var idx = findGroupIndex(name);
    if (idx >= 0) {
      config['proxy-groups'][idx] = desired;
    } else {
      config['proxy-groups'].splice(preferredInsertIndex(), 0, desired);
    }
  }

  function isLineOrHomeNode(name, lineSet, homeSet) {
    return !!(lineSet[name] || homeSet[name] || LINE_RE.test(name) || HOME_RE.test(name));
  }

  function dedupe(names) {
    var out = [];
    var seen = {};
    names.forEach(function(name) {
      if (!name) return;
      if (seen[name]) return;
      seen[name] = true;
      out.push(name);
    });
    return out;
  }

  function insertLineHomeRefs(proxies, hasLineNodes, hasHomeNodes, includeHomeGroup) {
    var cleaned = [];
    proxies.forEach(function(name) {
      if (name === LINE_GROUP || name === HOME_GROUP) return;
      cleaned.push(name);
    });

    var insertAt = 0;
    for (var i = 0; i < cleaned.length; i++) {
      if (CONTROL_PROXIES[cleaned[i]]) insertAt = i + 1;
    }

    var refs = [];
    if (hasLineNodes) refs.push(LINE_GROUP);
    if (includeHomeGroup && hasHomeNodes) refs.push(HOME_GROUP);

    return dedupe(cleaned.slice(0, insertAt).concat(refs).concat(cleaned.slice(insertAt)));
  }

  var lineNames = collectNames(LINE_RE);
  var homeNames = collectNames(HOME_RE);
  var lineSet = makeSet(lineNames);
  var homeSet = makeSet(homeNames);

  // 先插入“家宽”，再插入“线路”：二者首次创建时会稳定显示为 “线路” -> “家宽”。
  upsertSelectGroup(HOME_GROUP, homeNames);
  upsertSelectGroup(LINE_GROUP, lineNames);

  config['proxy-groups'].forEach(function(group) {
    if (!group || !Array.isArray(group.proxies)) return;

    if (group.name === LINE_GROUP) {
      group.type = 'select';
      group.proxies = lineNames.length > 0 ? lineNames.slice() : ['DIRECT'];
      return;
    }

    if (group.name === HOME_GROUP) {
      group.type = 'select';
      group.proxies = homeNames.length > 0 ? homeNames.slice() : ['DIRECT'];
      return;
    }

    // 其他代理组里删掉原始 “线路|...” / “家宽|...” 节点，只保留两个聚合组引用。
    var withoutRawLineHome = group.proxies.filter(function(name) {
      if (typeof name !== 'string') return true;
      return !isLineOrHomeNode(name, lineSet, homeSet);
    });

    // “自动选择”不要包含“家宽”聚合组，避免住宅/家宽节点参与自动测速选择；其他组仍统一通过“线路”/“家宽”调用。
    var includeHomeGroup = group.name !== '♻️ 自动选择' && group.name !== '⚡ 自动选择';
    group.proxies = insertLineHomeRefs(withoutRawLineHome, lineNames.length > 0, homeNames.length > 0, includeHomeGroup);
  });

  return config;
}
