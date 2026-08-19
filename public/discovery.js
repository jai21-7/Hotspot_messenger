// LAN server discovery: recent servers + network scan
(function () {
  const COMMON_HOSTS = [
    "192.168.43.1",
    "192.168.137.1",
    "192.168.1.1",
    "192.168.0.1",
    "10.0.0.1",
  ];
  const DEFAULT_PORT = 3000;
  const PROBE_TIMEOUT_MS = 2000;

  function collectScanHosts() {
    const hosts = new Set(COMMON_HOSTS);

    const saved = HMConnection.getSavedServerUrl();
    if (saved) {
      addSubnetHosts(hosts, saved);
    }

    for (const entry of HMConnection.getRecentServers()) {
      addSubnetHosts(hosts, entry.url);
    }

    return Array.from(hosts);
  }

  function addSubnetHosts(set, url) {
    try {
      const parsed = new URL(HMConnection.normalizeBase(url));
      set.add(parsed.hostname);

      const parts = parsed.hostname.split(".");
      if (parts.length !== 4) {
        return;
      }

      const prefix = parts.slice(0, 3).join(".");
      const lastOctet = Number(parts[3]);
      const start = Math.max(1, lastOctet - 8);
      const end = Math.min(254, lastOctet + 8);

      for (let i = start; i <= end; i++) {
        set.add(prefix + "." + i);
      }
    } catch (error) {
      // ignore invalid URLs
    }
  }

  async function probeHost(host, port) {
    const base = "http://" + host + ":" + port;
    try {
      const response = await fetch(base + "/api/discover", {
        signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
      });
      if (!response.ok) {
        return null;
      }
      const data = await response.json();
      if (data && data.service === "hotspot-messenger") {
        const url = data.urls && data.urls[0] ? data.urls[0] : base;
        return {
          name: data.name || "Hotspot Messenger",
          url: HMConnection.normalizeBase(url),
          port: data.port || port,
        };
      }
    } catch (error) {
      // host unreachable or not our server
    }
    return null;
  }

  async function findServersOnNetwork(options) {
    const onFound = options && typeof options.onFound === "function" ? options.onFound : null;
    const port = (options && options.port) || DEFAULT_PORT;
    const hosts = collectScanHosts();
    const found = [];
    const seen = new Set();
    const batchSize = 8;

    for (let i = 0; i < hosts.length; i += batchSize) {
      const batch = hosts.slice(i, i + batchSize);
      const results = await Promise.all(
        batch.map(function (host) {
          return probeHost(host, port);
        })
      );

      for (const result of results) {
        if (!result || seen.has(result.url)) {
          continue;
        }
        seen.add(result.url);
        found.push(result);
        if (onFound) {
          onFound(result);
        }
      }
    }

    return found;
  }

  function formatServerLabel(url) {
    try {
      const parsed = new URL(url);
      return parsed.host;
    } catch (error) {
      return url;
    }
  }

  function renderServerButton(entry, onSelect) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "recent-server-btn";
    btn.innerHTML =
      '<span class="recent-server-name">' +
      (entry.name || "Hotspot Messenger") +
      '</span><span class="recent-server-url">' +
      formatServerLabel(entry.url) +
      "</span>";

    btn.addEventListener("click", function () {
      onSelect(entry.url);
    });
    return btn;
  }

  function renderRecentServers(container, onSelect) {
    if (!container) {
      return;
    }

    const recent = HMConnection.getRecentServers();
    container.innerHTML = "";

    if (recent.length === 0) {
      container.hidden = true;
      return;
    }

    container.hidden = false;
    for (const entry of recent) {
      const row = document.createElement("div");
      row.className = "recent-server-row";

      const selectBtn = renderServerButton({ name: "Recent server", url: entry.url }, onSelect);

      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "recent-server-remove";
      removeBtn.setAttribute("aria-label", "Remove from recent");
      removeBtn.textContent = "✕";
      removeBtn.addEventListener("click", function (event) {
        event.stopPropagation();
        HMConnection.removeRecentServer(entry.url);
        renderRecentServers(container, onSelect);
      });

      row.appendChild(selectBtn);
      row.appendChild(removeBtn);
      container.appendChild(row);
    }
  }

  function renderFoundServers(container, servers, onSelect) {
    if (!container) {
      return;
    }

    container.innerHTML = "";

    if (!servers || servers.length === 0) {
      container.hidden = true;
      return;
    }

    container.hidden = false;
    for (const server of servers) {
      container.appendChild(renderServerButton(server, onSelect));
    }
  }

  window.HMDiscovery = {
    findServersOnNetwork,
    renderRecentServers,
    renderFoundServers,
    formatServerLabel,
  };
})();
