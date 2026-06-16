function main(config) {
  // Hiskens 妙妙屋“脚本覆写”：
  // - 节点名称包含 “线路|” 或 “线路 |” -> 自动进入 “线路” 代理组
  // - 节点名称包含 “家宽|” 或 “家宽 |” -> 自动进入 “家宽” 代理组
  //
  // 这个脚本在每次生成订阅时根据当前 config.proxies 动态重建组内节点，
  // 避免后续新增/删除节点时手工维护代理组列表。

  if (!config) config = {};
  if (!config['proxy-groups']) config['proxy-groups'] = [];
  if (!config.proxies) config.proxies = [];

  var EXCLUDE_RE = /(到期|剩余|流量|订阅|时间|expire|traffic|reset|test|测试)/i;
  var LINE_RE = /线路\s*\|/i;
  var HOME_RE = /家宽\s*\|/i;

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

  upsertSelectGroup('线路', collectNames(LINE_RE));
  upsertSelectGroup('家宽', collectNames(HOME_RE));

  return config;
}
