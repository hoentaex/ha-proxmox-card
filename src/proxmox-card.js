/*
 * Proxmox Card for Home Assistant
 * https://github.com/hoentaex/ha-proxmox-card
 *
 * Lovelace cards for the Proxmox VE integration (https://github.com/dougiteixeira/proxmoxve):
 * nodes, virtual machines, LXC containers, storages, ZFS pools and disks of a cluster at a glance.
 *
 * Entities are resolved through the entity and device registries (platform, translation_key, device
 * identifiers, model and hierarchy), so the cards work whatever the Home Assistant language or entity ids.
 *
 * Based on the design and much of the rendering code of ha-docker-card by juju35
 * (https://github.com/juju35/ha-docker-card, MIT).
 */

const VERSION = "__VERSION__";
// The integration's domain: "proxmoxve_custom" since it no longer overrides the core integration, "proxmoxve" before.
const PLATFORMS = new Set(["proxmoxve_custom", "proxmoxve"]);
const SITE = "https://www.proxmox.com";

const ICONS = {
  server:
    "M4,1H20A1,1 0 0,1 21,2V6A1,1 0 0,1 20,7H4A1,1 0 0,1 3,6V2A1,1 0 0,1 4,1M4,9H20A1,1 0 0,1 21,10V14A1,1 0 0,1 20,15H4A1,1 0 0,1 3,14V10A1,1 0 0,1 4,9M4,17H20A1,1 0 0,1 21,18V22A1,1 0 0,1 20,23H4A1,1 0 0,1 3,22V18A1,1 0 0,1 4,17M9,5H10V3H9V5M9,13H10V11H9V13M9,21H10V19H9V21M5,3V5H7V3H5M5,11V13H7V11H5M5,19V21H7V19H5Z",
  chevron: "M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z",
  cpu: "M6,4H18V5H21V7H18V9H21V11H18V13H21V15H18V17H21V19H18V20H6V19H3V17H6V15H3V13H6V11H3V9H6V7H3V5H6V4M11,15V18H12V15H11M13,15V18H14V15H13M15,15V18H16V15H15Z",
  ram: "M17,17H7V7H17M21,11V9H19V7C19,5.89 18.1,5 17,5H15V3H13V5H11V3H9V5H7C5.89,5 5,5.89 5,7V9H3V11H5V13H3V15H5V17A2,2 0 0,0 7,19H9V21H11V19H13V21H15V19H17A2,2 0 0,0 19,17V15H21V13H19V11M13,13H11V11H13M15,9H9V15H15V9Z",
  vm: "M21,16H3V4H21M21,2H3C1.89,2 1,2.89 1,4V16A2,2 0 0,0 3,18H10V20H8V22H16V20H14V18H21A2,2 0 0,0 23,16V4C23,2.89 22.1,2 21,2Z",
  lxc: "M21,16.5C21,16.88 20.79,17.21 20.47,17.38L12.57,21.82C12.41,21.94 12.21,22 12,22C11.79,22 11.59,21.94 11.43,21.82L3.53,17.38C3.21,17.21 3,16.88 3,16.5V7.5C3,7.12 3.21,6.79 3.53,6.62L11.43,2.18C11.59,2.06 11.79,2 12,2C12.21,2 12.41,2.06 12.57,2.18L20.47,6.62C20.79,6.79 21,7.12 21,7.5V16.5M12,4.15L6.04,7.5L12,10.85L17.96,7.5L12,4.15M5,15.91L11,19.29V12.58L5,9.21V15.91M19,15.91V9.21L13,12.58V19.29L19,15.91Z",
  storage:
    "M12,3C7.58,3 4,4.79 4,7C4,9.21 7.58,11 12,11C16.42,11 20,9.21 20,7C20,4.79 16.42,3 12,3M4,9V12C4,14.21 7.58,16 12,16C16.42,16 20,14.21 20,12V9C20,11.21 16.42,13 12,13C7.58,13 4,11.21 4,9M4,14V17C4,19.21 7.58,21 12,21C16.42,21 20,19.21 20,17V14C20,16.21 16.42,18 12,18C7.58,18 4,16.21 4,14Z",
  disk: "M6,2H18A2,2 0 0,1 20,4V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V4A2,2 0 0,1 6,2M12,4A6,6 0 0,0 6,10C6,13.31 8.69,16 12.1,16L11.22,13.77C10.95,13.29 11.11,12.68 11.59,12.4L12.45,11.9C12.93,11.63 13.54,11.79 13.82,12.27L15.74,14.69C17.12,13.59 18,11.9 18,10A6,6 0 0,0 12,4M12,9A1,1 0 0,1 13,10A1,1 0 0,1 12,11A1,1 0 0,1 11,10A1,1 0 0,1 12,9M7,18A1,1 0 0,0 6,19A1,1 0 0,0 7,20A1,1 0 0,0 8,19A1,1 0 0,0 7,18M12.09,13.27L14.58,19.58L17.17,18.08L12.95,12.77L12.09,13.27Z",
  update: "M12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22M12,7L7,12H10V16H14V12H17L12,7Z",
  restart:
    "M12,4C14.1,4 16.1,4.8 17.6,6.3C20.7,9.4 20.7,14.5 17.6,17.6C15.8,19.5 13.3,20.2 10.9,19.9L11.4,17.9C13.1,18.1 14.9,17.5 16.2,16.2C18.5,13.9 18.5,10.1 16.2,7.7C15.1,6.6 13.5,6 12,6V10.6L7,5.6L12,0.6V4M6.3,17.6C3.7,15 3.3,11 5.1,7.9L6.6,9.4C5.5,11.6 5.9,14.4 7.8,16.2C8.3,16.7 8.9,17.1 9.6,17.4L9,19.4C8,19 7.1,18.4 6.3,17.6Z",
  power: "M16.56,5.44L15.11,6.89C16.84,7.94 18,9.83 18,12A6,6 0 0,1 12,18A6,6 0 0,1 6,12C6,9.83 7.16,7.94 8.88,6.88L7.44,5.44C5.36,6.88 4,9.28 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12C20,9.28 18.64,6.88 16.56,5.44M13,3H11V13H13",
  play: "M8,5.14V19.14L19,12.14L8,5.14Z",
  lock: "M12,17A2,2 0 0,0 14,15C14,13.89 13.1,13 12,13A2,2 0 0,0 10,15A2,2 0 0,0 12,17M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V10C4,8.89 4.9,8 6,8H7V6A5,5 0 0,1 12,1A5,5 0 0,1 17,6V8H18M12,3A3,3 0 0,0 9,6V8H15V6A3,3 0 0,0 12,3Z",
  backup: "M12,3A9,9 0 0,0 3,12H0L4,16L8,12H5A7,7 0 0,1 12,5A7,7 0 0,1 19,12A7,7 0 0,1 12,19C10.5,19 9.09,18.5 7.94,17.7L6.5,19.14C8.04,20.3 9.94,21 12,21A9,9 0 0,0 21,12A9,9 0 0,0 12,3M14,12A2,2 0 0,0 12,10A2,2 0 0,0 10,12A2,2 0 0,0 12,14A2,2 0 0,0 14,12Z",
  alert: "M13 14H11V9H13M13 18H11V16H13M1 21H23L12 2L1 21Z",
  search:
    "M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z",
  expand: "M10,21V19H6.41L10.91,14.5L9.5,13.09L5,17.59V14H3V21H10M14.5,10.91L19,6.41V10H21V3H14V5H17.59L13.09,9.5L14.5,10.91Z",
  collapse: "M19.5,3.09L15,7.59V4H13V11H20V9H16.41L20.91,4.5L19.5,3.09M4,13V15H7.59L3.09,19.5L4.5,20.91L9,16.41V20H11V13H4Z",
};

const STRINGS = {
  en: {
    cpu: "CPU",
    memory: "RAM",
    disk: "Disk",
    nodes: "Nodes",
    node: "Node",
    guests: "VMs & containers",
    vms: "VMs",
    lxcs: "LXC",
    vm: "VM",
    storage: "Storage",
    updates: "Updates",
    k_of_running: "/ {n} running",
    k_stopped: "{n} stopped",
    k_of_ok: "/ {n} fine",
    k_problems: "{n} with a problem",
    k_of_nodes: "/ {n} nodes",
    k_pve_available: "PVE {v} available",
    k_updates_pending: "Updates available",
    k_up_to_date: "Up to date",
    problems: "Problems",
    problems_one: "Problem",
    cores: "cores",
    cores_one: "core",
    vms_lc: "VMs",
    vms_lc_one: "VM",
    lxcs_lc: "containers",
    lxcs_lc_one: "container",
    nodes_lc: "nodes",
    nodes_lc_one: "node",
    online: "Online",
    offline: "Offline",
    nodes_online: "{n}/{total} online",
    load: "Load",
    io_delay: "IO delay",
    uptime: "up {d}",
    locked: "Locked",
    unhealthy: "Problem",
    backup_running: "Backup",
    failed_tasks: "{n} failed tasks",
    update_available: "Updates available",
    packages: "packages",
    smart_failed: "SMART",
    wearout: "Wearout {v}",
    pool: "Pool",
    shared: "shared",
    start: "Start",
    shutdown: "Shut down",
    stop: "Stop",
    reboot: "Reboot",
    resume: "Resume",
    cancel: "Cancel",
    confirm_shutdown: "Shut down {name}?",
    confirm_stop: "Stop {name} immediately (like pulling the plug)?",
    confirm_reboot: "Reboot {name}?",
    all_ok: "Nothing to report",
    no_env: "No Proxmox VE found. Is the Proxmox VE integration installed?",
    unknown_env: "Proxmox VE not found",
    no_registry: "This card needs Home Assistant 2024.8 or later.",
    state_running: "Running",
    state_stopped: "Stopped",
    state_paused: "Paused",
    state_suspended: "Suspended",
    state_prelaunch: "Starting",
    state_online: "Online",
    state_offline: "Offline",
    state_unavailable: "Unavailable",
    state_unknown: "Unknown",
    zoom_in: "Show the full card",
    zoom_out: "Back to the compact view",
    search: "Search VMs and containers",
    sort_by: "Sort by",
    sort_name: "Name",
    sort_id: "ID",
    no_match: "No matching guest",
    // Editor
    environment: "Proxmox VE",
    title: "Title (optional)",
    url: "URL opened by the logo (optional, defaults to the Proxmox web interface)",
    node_filter: "Nodes (empty: all)",
    show_nodes: "Show nodes",
    show_history: "Show the 24 h CPU and memory history",
    show_counts: "Show counters",
    show_guests: "Show VMs and containers",
    show_storage: "Show storage, ZFS pools and disks",
    show_controls: "Show start / shutdown / reboot buttons",
    show_stop: "Also show the hard stop button",
    only_problems: "Only list items needing attention",
    group_by_node: "Group VMs and containers by node",
    expand_guests: "VMs and containers expanded by default",
    expand_storage: "Storage expanded by default",
    show_footer: "Show the footer (guests, updates)",
    threshold_warning: "orange from",
    threshold_critical: "red from",
    zoom: "Detail button",
    zoom_helper: "Switches the mini card to the full card and back",
    illustration: "Illustrated header",
    illustration_theme: "Header picture",
    theme_auto: "Follow the theme",
    theme_day: "Day",
    theme_night: "Night",
    language: "Language",
    lang_auto: "Automatic",
  },
  de: {
    cpu: "CPU",
    memory: "RAM",
    disk: "Disk",
    nodes: "Nodes",
    node: "Node",
    guests: "VMs & Container",
    vms: "VMs",
    lxcs: "LXC",
    vm: "VM",
    storage: "Speicher",
    updates: "Updates",
    k_of_running: "/ {n} laufen",
    k_stopped: "{n} gestoppt",
    k_of_ok: "/ {n} in Ordnung",
    k_problems: "{n} mit Problem",
    k_of_nodes: "/ {n} Nodes",
    k_pve_available: "PVE {v} verfügbar",
    k_updates_pending: "Updates verfügbar",
    k_up_to_date: "Aktuell",
    problems: "Probleme",
    problems_one: "Problem",
    cores: "Kerne",
    cores_one: "Kern",
    vms_lc: "VMs",
    vms_lc_one: "VM",
    lxcs_lc: "Container",
    lxcs_lc_one: "Container",
    nodes_lc: "Nodes",
    nodes_lc_one: "Node",
    online: "Online",
    offline: "Offline",
    nodes_online: "{n}/{total} online",
    load: "Last",
    io_delay: "IO-Delay",
    uptime: "seit {d}",
    locked: "Gesperrt",
    unhealthy: "Problem",
    backup_running: "Backup",
    failed_tasks: "{n} fehlgeschlagene Tasks",
    update_available: "Updates verfügbar",
    packages: "Pakete",
    smart_failed: "SMART",
    wearout: "Verschleiß {v}",
    pool: "Pool",
    shared: "geteilt",
    start: "Starten",
    shutdown: "Herunterfahren",
    stop: "Stoppen",
    reboot: "Neu starten",
    resume: "Fortsetzen",
    cancel: "Abbrechen",
    confirm_shutdown: "{name} herunterfahren?",
    confirm_stop: "{name} sofort stoppen (wie Stecker ziehen)?",
    confirm_reboot: "{name} neu starten?",
    all_ok: "Alles in Ordnung",
    no_env: "Kein Proxmox VE gefunden. Ist die Proxmox-VE-Integration installiert?",
    unknown_env: "Proxmox VE nicht gefunden",
    no_registry: "Diese Karte benötigt Home Assistant 2024.8 oder neuer.",
    state_running: "Läuft",
    state_stopped: "Gestoppt",
    state_paused: "Pausiert",
    state_suspended: "Angehalten",
    state_prelaunch: "Startet",
    state_online: "Online",
    state_offline: "Offline",
    state_unavailable: "Nicht verfügbar",
    state_unknown: "Unbekannt",
    zoom_in: "Ganze Karte anzeigen",
    zoom_out: "Zurück zur kompakten Ansicht",
    search: "VMs und Container suchen",
    sort_by: "Sortieren nach",
    sort_name: "Name",
    sort_id: "ID",
    no_match: "Kein passender Gast",
    // Editor
    environment: "Proxmox VE",
    title: "Titel (optional)",
    url: "URL, die das Logo öffnet (optional, Standard: Proxmox-Weboberfläche)",
    node_filter: "Nodes (leer: alle)",
    show_nodes: "Nodes anzeigen",
    show_history: "24-h-Verlauf von CPU und RAM anzeigen",
    show_counts: "Zähler anzeigen",
    show_guests: "VMs und Container anzeigen",
    show_storage: "Speicher, ZFS-Pools und Disks anzeigen",
    show_controls: "Buttons Starten / Herunterfahren / Neu starten anzeigen",
    show_stop: "Auch den harten Stopp-Button anzeigen",
    only_problems: "Nur Einträge auflisten, die Aufmerksamkeit brauchen",
    group_by_node: "VMs und Container nach Node gruppieren",
    expand_guests: "VMs und Container standardmäßig aufgeklappt",
    expand_storage: "Speicher standardmäßig aufgeklappt",
    show_footer: "Fußzeile anzeigen (Gäste, Updates)",
    threshold_warning: "orange ab",
    threshold_critical: "rot ab",
    zoom: "Detail-Button",
    zoom_helper: "Schaltet die Mini-Karte auf die ganze Karte um und zurück",
    illustration: "Illustrierter Kopf",
    illustration_theme: "Bild im Kopf",
    theme_auto: "Wie das Theme",
    theme_day: "Tag",
    theme_night: "Nacht",
    language: "Sprache",
    lang_auto: "Automatisch",
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const esc = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const lang = (hass, config) => {
  const l = config?.language || (hass && (hass.locale?.language || hass.language)) || "en";
  return STRINGS[l] ? l : STRINGS[l.split("-")[0]] ? l.split("-")[0] : "en";
};

const t = (hass, config, key, vars = {}) =>
  String(STRINGS[lang(hass, config)][key] ?? STRINGS.en[key] ?? key).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");

// Locale of the numbers: Home Assistant's own language when its base matches the card's (keeps the region).
const fmtLang = (hass, config) => {
  const l = lang(hass, config);
  const ha = hass && (hass.locale?.language || hass.language);
  return ha && ha.split("-")[0] === l ? ha : l;
};

// Counted noun ("4 cores"): the key_<plural form> when the dictionary has it, else the key.
const tn = (hass, config, key, n) => {
  const code = lang(hass, config);
  const v = Number(n);
  if (n !== null && n !== undefined && n !== "" && Number.isFinite(v)) {
    const form = STRINGS[code][`${key}_${new Intl.PluralRules(code).select(v)}`];
    if (form) return form;
  }
  return t(hass, config, key);
};

const known = (s) => !!s && s.state !== "unknown" && s.state !== "unavailable";

const num = (s) => {
  if (!known(s)) return null;
  const v = parseFloat(s.state);
  return Number.isFinite(v) ? v : null;
};

const _numFormats = new Map();
const fmtNum = (v, locale, max, fixed = false) => {
  const key = `${locale}|${max}|${fixed}`;
  let f = _numFormats.get(key);
  if (!f) {
    f = new Intl.NumberFormat(locale, { maximumFractionDigits: max, minimumFractionDigits: fixed ? max : 0 });
    _numFormats.set(key, f);
  }
  return f.format(v);
};

// Usage percentage: one decimal under 10 %, whole numbers above.
const fmtPct = (v, locale = "en") => `${v < 10 ? fmtNum(v, locale, 1, true) : fmtNum(Math.round(v), locale, 0)}%`;

// Data size as [value, unit]: 2 decimals under 10, 1 under 100, none above.
const bytesParts = (b, locale = "en") => {
  if (b === null || b === undefined || !Number.isFinite(Number(b))) return null;
  b = Number(b);
  const units = ["B", "KiB", "MiB", "GiB", "TiB", "PiB"];
  let i = 0;
  while (b >= 1024 && i < units.length - 1) {
    b /= 1024;
    i++;
  }
  return [fmtNum(b, locale, b >= 100 || i === 0 ? 0 : b >= 10 ? 1 : 2), units[i]];
};
const fmtBytes = (b, locale) => bytesParts(b, locale)?.join(" ") ?? "—";
const fmtBytesPair = (used, total, locale) => {
  const u = bytesParts(used, locale);
  const tt = bytesParts(total, locale);
  if (!u || !tt) return `${fmtBytes(used, locale)} / ${fmtBytes(total, locale)}`;
  return `${u[1] === tt[1] ? u[0] : u.join(" ")} / ${tt.join(" ")}`;
};

// A data size state in bytes, whatever unit Home Assistant displays it in (the integration suggests GB).
const UNIT_BYTES = { B: 1, kB: 1e3, KB: 1e3, MB: 1e6, GB: 1e9, TB: 1e12, KiB: 1024, MiB: 1048576, GiB: 1073741824, TiB: 1099511627776 };
const bytesOf = (s) => {
  const v = num(s);
  const k = UNIT_BYTES[s?.attributes?.unit_of_measurement ?? "B"];
  return v === null || !k ? null : v * k;
};

// Duration since a timestamp state, in its largest unit: "3 d" / "3 T", "5 h" / "5 Std.", "12 min".
const fmtSince = (s, locale) => {
  if (!known(s)) return null;
  const ms = Date.now() - Date.parse(s.state);
  if (!Number.isFinite(ms) || ms < 0) return null;
  const [unit, v] = ms >= 864e5 ? ["day", ms / 864e5] : ms >= 36e5 ? ["hour", ms / 36e5] : ["minute", Math.max(1, ms / 6e4)];
  try {
    return new Intl.NumberFormat(locale, { style: "unit", unit, unitDisplay: "narrow", maximumFractionDigits: 0 }).format(Math.floor(v));
  } catch (_e) {
    return `${Math.floor(v)} ${unit[0]}`;
  }
};

const level = (v, warn, crit) => (v === null ? "" : v >= crit ? "crit" : v >= warn ? "warn" : "ok");

// Default orange (warning) and red (critical) levels, in %.
const THRESHOLDS = { cpu_warning: 70, cpu_critical: 90, ram_warning: 80, ram_critical: 95, disk_warning: 80, disk_critical: 90 };
const thresholds = (config, metric) =>
  ["warning", "critical"].map((lvl) => {
    const key = `${metric}_${lvl}`;
    const v = config?.[key];
    return v !== undefined && v !== null && v !== "" && Number.isFinite(Number(v)) ? Number(v) : THRESHOLDS[key];
  });

// Guest or node state → colour class.
const stateClass = (state) => {
  switch (String(state || "").toLowerCase()) {
    case "running":
    case "online":
      return "ok";
    case "paused":
    case "suspended":
    case "prelaunch":
      return "warn";
    case "offline":
    case "internal-error":
    case "io-error":
      return "crit";
    default:
      return "idle";
  }
};

const sameSig = (a, b) => !!a && !!b && a.length === b.length && a.every((v, i) => v === b[i]);

// Patch the shadow DOM in place from the new HTML (keeps focus, hover and transitions); rows with a data-key are
// matched by it wherever they moved. From ha-docker-card.
const patchAttrs = (cur, next) => {
  for (const { name } of [...cur.attributes]) if (!next.hasAttribute(name)) cur.removeAttribute(name);
  for (const { name, value } of next.attributes) if (cur.getAttribute(name) !== value) cur.setAttribute(name, value);
};
const keyOf = (n) => (n.nodeType === 1 ? n.getAttribute("data-key") : null);
const sameNode = (a, b) => !!a && a.nodeType === b.nodeType && a.nodeName === b.nodeName;
const place = (parent, node, ref) => {
  if (node === ref) return;
  try {
    if (parent.moveBefore && node.parentNode === parent) return parent.moveBefore(node, ref);
  } catch (_e) {
    /* fall back to insertBefore */
  }
  parent.insertBefore(node, ref);
};
const patchChildren = (cur, next) => {
  const old = [...cur.childNodes];
  const fresh = [...next.childNodes];
  const byKey = new Map();
  for (const o of old) {
    const k = keyOf(o);
    if (k !== null && !byKey.has(k)) byKey.set(k, o);
  }
  const used = new Set();
  fresh.forEach((n, i) => {
    const k = keyOf(n);
    let o = k !== null ? byKey.get(k) : old[i];
    if (!sameNode(o, n) || used.has(o) || (k === null && keyOf(o) !== null)) o = null;
    const ref = cur.childNodes[i] ?? null;
    if (!o) {
      cur.insertBefore(n, ref);
      return;
    }
    used.add(o);
    place(cur, o, ref);
    if (n.nodeType === 1) {
      patchAttrs(o, n);
      patchChildren(o, n);
    } else if (o.nodeValue !== n.nodeValue) o.nodeValue = n.nodeValue;
  });
  while (cur.childNodes.length > fresh.length) cur.removeChild(cur.lastChild);
};
const morph = (root, html) => {
  const tpl = document.createElement("template");
  tpl.innerHTML = html;
  patchChildren(root, tpl.content);
};

const svgIcon = (path, cls = "") => `<svg class="icon ${cls}" viewBox="0 0 24 24"><path d="${path}"/></svg>`;

// ---------------------------------------------------------------------------
// Registry-based resolution
// ---------------------------------------------------------------------------

/*
 * Model:
 * { envs: [{ id, name, cluster, nodes: [node], guests: [guest], storages: [item], zfs: [item], disks: [item] }] }
 * node:  { id, name, entities }
 * guest: { id, type: "qemu" | "lxc", vmid, name, nodeId, entities }
 * item:  { id, kind, name, nodeId, entities }
 *
 * An entity is keyed on its device by its translation key, prefixed with its domain unless it is a sensor
 * ("cpu_used", "binary_sensor.status", "button.reboot", "update.node_update").
 */

const entityKey = (e) => {
  if (!e.translation_key) return null;
  const domain = e.entity_id.split(".")[0];
  return domain === "sensor" ? e.translation_key : `${domain}.${e.translation_key}`;
};

// Kind of a device of the integration, from its identifier "<entry>_<KIND>_<rest>" (Proxmox VE 3.x+), else its
// model and name. Returns { kind, ref } (ref: the node name, vmid, storage id…).
const KINDS = { cluster: "cluster", NODE: "node", QEMU: "qemu", LXC: "lxc", STORAGE: "storage", DISK: "disk", ZFS: "zfs" };
const deviceKind = (d) => {
  for (const [domain, ident] of d.identifiers || []) {
    if (!PLATFORMS.has(domain) || typeof ident !== "string") continue;
    const m = /^[^_]+_(cluster|NODE|QEMU|LXC|STORAGE|DISK|ZFS)(?:_(.*))?$/.exec(ident);
    if (m) return { kind: KINDS[m[1]], ref: m[2] ?? "" };
  }
  const model = d.model || "";
  const name = d.name || "";
  if (model === "Cluster") return { kind: "cluster", ref: "" };
  if (model === "QEMU" || model === "LXC") return { kind: model.toLowerCase(), ref: /\((\d+)\)$/.exec(name)?.[1] ?? "" };
  if (model === "Storage" || model === "Shared storage") return { kind: "storage", ref: name.replace(/^Storage /, "") };
  if (model === "ZFS") return { kind: "zfs", ref: "" };
  if (/^Node /.test(name)) return { kind: "node", ref: name.slice(5) };
  if (/^Disk /.test(name)) return { kind: "disk", ref: "" };
  return null;
};

const devName = (d) => d.name_by_user || d.name || "";

// "QEMU homeassistant (177)" → "homeassistant"; "ZFS athene: ZFS Pool SSD1" → "SSD1"; "Disk athene: CT1000" → "CT1000".
const shortName = (d, kind) => {
  const n = devName(d);
  if (d.name_by_user) return n;
  if (kind === "qemu" || kind === "lxc") return n.replace(/^(QEMU|LXC) /, "").replace(/ \(\d+\)$/, "");
  if (kind === "node") return n.replace(/^Node /, "");
  if (kind === "storage") return n.replace(/^Storage /, "");
  if (kind === "zfs") return n.replace(/^ZFS [^:]*: /, "").replace(/^ZFS Pool /, "");
  if (kind === "disk") return n.replace(/^Disk [^:]*: /, "");
  return n;
};

const _cache = new WeakMap();

const resolve = (hass) => {
  if (!hass?.entities || !hass.devices) return null;
  const cached = _cache.get(hass.entities);
  if (cached && cached.devices === hass.devices) return cached.model;

  const byDevice = new Map();
  for (const e of Object.values(hass.entities)) {
    if (!PLATFORMS.has(e.platform) || !e.device_id) continue;
    const key = entityKey(e);
    if (!key) continue;
    const ents = byDevice.get(e.device_id) || {};
    if (!(key in ents)) ents[key] = e.entity_id;
    byDevice.set(e.device_id, ents);
  }

  const envs = new Map();
  const envOf = (d) => {
    const id = d.config_entries?.[0] || "proxmoxve";
    if (!envs.has(id)) envs.set(id, { id, name: "Proxmox VE", cluster: null, nodes: [], guests: [], storages: [], zfs: [], disks: [] });
    return envs.get(id);
  };

  const items = [];
  for (const [id, entities] of byDevice) {
    const d = hass.devices[id];
    if (!d) continue;
    const k = deviceKind(d);
    if (!k) continue;
    items.push({ d, id, entities, ...k });
  }
  for (const { d, id, entities, kind, ref } of items) {
    const env = envOf(d);
    const name = shortName(d, kind);
    if (kind === "cluster") env.cluster = { id, entities };
    else if (kind === "node") env.nodes.push({ id, name: ref || name, label: name, entities });
    else if (kind === "qemu" || kind === "lxc")
      env.guests.push({ id, type: kind, vmid: Number(ref) || ref, name, nodeId: d.via_device_id || null, entities });
    else {
      const via = d.via_device_id ? hass.devices[d.via_device_id] : null;
      const shared = !!via && deviceKind(via)?.kind === "cluster";
      env[{ storage: "storages", zfs: "zfs", disk: "disks" }[kind]].push({ id, kind, name, nodeId: shared ? null : d.via_device_id || null, shared, entities });
    }
  }

  const byName = (a, b) => a.name.localeCompare(b.name, undefined, { numeric: true });
  const model = { envs: [...envs.values()] };
  for (const env of model.envs) {
    for (const list of [env.nodes, env.guests, env.storages, env.zfs, env.disks]) list.sort(byName);
    env.name = env.nodes.length ? `Proxmox VE (${env.nodes.map((n) => n.name).join(", ")})` : "Proxmox VE";
  }
  _cache.set(hass.entities, { devices: hass.devices, model });
  return model;
};

const listEnvs = (hass) => {
  const m = hass && resolve(hass);
  return m ? m.envs.map((e) => ({ value: e.id, label: e.name })) : [];
};

const findEnv = (hass, config) => {
  const m = resolve(hass);
  if (!m) return { error: "no_registry" };
  if (!m.envs.length) return { error: "no_env" };
  const env = config.environment ? m.envs.find((e) => e.id === config.environment || e.name === config.environment) : m.envs[0];
  return env ? { env } : { error: "unknown_env" };
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const BASE_STYLE = `
  :host { --px-accent: #e57000; --px-ok: var(--success-color, #43a047); --px-warn: var(--warning-color, #ffa600);
          --px-crit: var(--error-color, #db4437); --px-idle: var(--disabled-text-color, #9e9e9e); }
  :host { display: block; }
  ha-card { overflow: hidden; container-type: inline-size; }
  :host::before { content: ""; display: grid; grid-template-columns: minmax(0, 300px); height: 0; }
  .icon { width: 18px; height: 18px; fill: currentColor; flex: none; }
  .muted { color: var(--secondary-text-color); }
  .clickable { cursor: pointer; }
  [role="button"]:focus-visible { outline: 2px solid var(--primary-color, #03a9f4); outline-offset: 2px; }
  .ok { --c: var(--px-ok); } .warn { --c: var(--px-warn); } .crit { --c: var(--px-crit); } .idle { --c: var(--px-idle); }
  .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--c, var(--px-ok)); flex: none; display: inline-block; }
  .chip { display: inline-flex; align-items: center; gap: 4px; padding: 1px 8px; border-radius: 12px; font-size: 11px; font-weight: 500;
          background: color-mix(in srgb, var(--c, var(--px-ok)) 15%, transparent); color: var(--c, var(--px-ok)); }
  .bar { height: 4px; border-radius: 3px; background: var(--divider-color, rgba(127,127,127,.25)); overflow: hidden; }
  .bar > div { height: 100%; border-radius: 3px; background: var(--c, var(--px-accent)); transition: width .6s ease; }
  .header { display: flex; align-items: center; gap: 12px; padding: 16px 16px 12px; }
  .logo { height: 40px; width: 40px; flex: none; border-radius: 50%; display: grid; place-items: center;
          color: var(--c, var(--px-ok)); background: color-mix(in srgb, var(--c, var(--px-ok)) 16%, transparent); }
  .logo .icon { width: 22px; height: 22px; fill: currentColor; }
  .titles { flex: 1 1 0; min-width: 5ch; }
  .header .chip { flex: 0 1 auto; min-width: 0; overflow: hidden; line-height: 16px; box-sizing: border-box; }
  .header .chip.idle { color: var(--primary-text-color); }
  .chip-label { min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .header:has(.sub) .titles { align-self: flex-start; }
  .header:has(.sub) .chip { align-self: flex-start; margin-top: 1px; }
  @container (max-width: 239px) {
    .header { gap: 6px; }
    :host(:not([mini])) .header .logo { height: 32px; width: 32px; }
    :host(:not([mini])) .header .logo .icon { width: 18px; height: 18px; }
    .header .chip { flex: none; padding: 6px; }
    .header .chip .chip-label { display: none; }
  }
  .name { font-size: 16px; font-weight: 500; line-height: 1.25; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .sub { font-size: 12px; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .warning { padding: 16px; color: var(--px-warn); }
  .zoom { all: unset; flex: none; cursor: pointer; width: 24px; height: 24px; margin: -4px;
          border-radius: 50%; display: grid; place-items: center; color: var(--secondary-text-color); }
  .zoom .icon { width: 16px; height: 16px; }
  .zoom:hover { background: color-mix(in srgb, var(--secondary-text-color) 16%, transparent); color: var(--primary-text-color); }
  .zoom:focus-visible { outline: 2px solid var(--primary-color, #03a9f4); outline-offset: 1px; }
  .spark-a { fill: color-mix(in srgb, var(--c, var(--px-ok)) 12%, transparent); }
  .spark-l { fill: none; stroke: color-mix(in srgb, var(--c, var(--px-ok)) 50%, transparent); stroke-width: 1.2; vector-effect: non-scaling-stroke; }
  .tag { font-size: 11px; padding: 1px 6px; border-radius: 6px; background: var(--secondary-background-color, rgba(127,127,127,.12));
         color: var(--secondary-text-color); flex: 0 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
         display: inline-flex; align-items: center; gap: 3px; }
  .tag .icon { width: 12px; height: 12px; }
  .tag.alert { background: color-mix(in srgb, var(--c) 15%, transparent); color: var(--c); }
  .tag.upd { background: color-mix(in srgb, var(--px-accent) 15%, transparent); color: var(--px-accent); }
`;

// ---------------------------------------------------------------------------
// Illustrated header ("banner"), in the style of juju35's cards: the nodes in a small rack in a technical room
// ---------------------------------------------------------------------------

// Night picture: forced by illustration_theme, else Home Assistant's dark theme alone.
const isNight = (hass, config) => {
  if (config.illustration_theme === "night") return true;
  if (config.illustration_theme === "day") return false;
  return !!hass?.themes?.darkMode;
};

const BRAND_ICON = "https://brands.home-assistant.io/_/proxmoxve/icon.png";

// The rack, 200 × 80 at the right of the banner (preserveAspectRatio xMaxYMax), standing on the 10 px ground strip:
// a technical room wall with a cable tray, one server per node (up to three; a fourth and more share the last slot's
// label "+n"), each with its state LED, an activity LED and its CPU and memory as two bars, and a switch at the bottom.
// slots: [{ name, cls, cpu, mem, cpuCls }]
const rackScene = (slots, more) => {
  const n = Math.max(1, slots.length);
  const top = 19;
  const avail = 45;
  const gap = 3;
  const h = Math.min(24, (avail - gap * (n - 1)) / n);
  const bar = (x, y, hh, pct, cls) => {
    const v = pct === null || pct === undefined ? 0 : Math.max(0, Math.min(100, pct));
    const fh = ((hh * v) / 100).toFixed(2);
    return `<rect class="px-bar-bg" x="${x}" y="${y}" width="5" height="${hh}" rx="1"/>` +
      `<rect class="px-bar ${cls}" x="${x}" y="${(y + hh - fh).toFixed(2)}" width="5" height="${fh}" rx="1"/>`;
  };
  const servers = slots
    .map((sl, i) => {
      const y = top + i * (h + gap);
      const bh = Math.max(6, h - 8);
      const by = y + (h - bh) / 2;
      const label = i === slots.length - 1 && more ? `${sl.name} +${more}` : sl.name;
      const vents = h >= 18 ? [0, 1, 2].map((k) => `<line class="px-vent" x1="126" y1="${(y + 12 + k * 2.6).toFixed(1)}" x2="160" y2="${(y + 12 + k * 2.6).toFixed(1)}"/>`).join("") : "";
      const ly = h >= 18 ? y + 8 : y + h / 2 + 2;
      return `<g class="px-srv ${sl.cls}">
        <rect class="px-case" x="115" y="${y.toFixed(1)}" width="72" height="${h.toFixed(1)}" rx="2"/>
        <circle class="px-led" cx="120.5" cy="${(y + Math.min(6, h / 2 - 2)).toFixed(1)}" r="1.7"/>
        ${h >= 12 ? `<circle class="px-act" style="animation-duration:${(0.35 + i * 0.2).toFixed(2)}s" cx="120.5" cy="${(y + h - Math.min(6, h / 2 - 2)).toFixed(1)}" r="1.7"/>` : ""}
        <text class="px-lbl" x="126" y="${ly.toFixed(1)}">${esc(label)}</text>
        ${vents}
        ${bar(168, by, bh, sl.cpu, sl.cpuCls)}${bar(176, by, bh, sl.mem, "mem")}
      </g>`;
    })
    .join("");
  return `<svg class="scene" viewBox="0 0 200 80" preserveAspectRatio="xMaxYMax meet" aria-hidden="true">
    <g class="px-wall"><line x1="0" y1="20" x2="200" y2="20"/><line x1="0" y1="40" x2="200" y2="40"/><line x1="0" y1="60" x2="200" y2="60"/></g>
    <path class="px-tray" d="M0 8H200"/>
    <path class="px-wire" d="M150 8V14"/>
    <ellipse class="px-shadow" cx="151" cy="79.6" rx="44" ry="2.2"/>
    <rect class="px-rack" x="110" y="14" width="82" height="66" rx="3"/>
    ${servers}
    <rect class="px-case" x="115" y="67" width="72" height="9" rx="1.5"/>
    ${[0, 1, 2, 3, 4, 5, 6, 7].map((k) => `<rect class="px-port${k % 3 ? "" : " b"}" style="animation-delay:${(k * 0.13).toFixed(2)}s" x="${121 + k * 7}" y="70" width="4" height="3" rx=".6"/>`).join("")}
  </svg>`;
};

const BANNER_STYLE = `
  .banner { position: relative; overflow: hidden; height: 90px; --g: 10px; --sw: min(200px, 54cqw);
            background: #e7eaee; color: #0d2a45; --sky-muted: #3b5b78; }
  .banner.night { background: #232a36; color: #fff; --sky-muted: rgba(255,255,255,.78); }
  .banner .scene { position: absolute; right: 0; bottom: var(--g); height: calc(100% - var(--g)); width: var(--sw); overflow: visible;
                   -webkit-mask-image: linear-gradient(90deg, rgba(0,0,0,.35) 0, rgba(0,0,0,.35) 12%, #000 42%);
                   mask-image: linear-gradient(90deg, rgba(0,0,0,.35) 0, rgba(0,0,0,.35) 12%, #000 42%); }
  .banner .ground { position: absolute; left: 0; right: 0; bottom: 0; height: var(--g); --t: rgba(255,255,255,.55); }
  .banner.night .ground { --t: rgba(255,255,255,.22); }
  .ground.ok { background-image: repeating-linear-gradient(90deg, var(--t) 0 1px, transparent 1px 12px), linear-gradient(90deg, #8fd47a, #43a047); box-shadow: inset 0 2px 0 #b5e3a5; }
  .night .ground.ok { background-image: repeating-linear-gradient(90deg, var(--t) 0 1px, transparent 1px 12px), linear-gradient(90deg, #2a5a2c, #1c4220); box-shadow: inset 0 2px 0 #356a38; }
  .ground.warn { background-image: repeating-linear-gradient(90deg, var(--t) 0 1px, transparent 1px 12px), linear-gradient(90deg, #ffd27a, #f29d16); box-shadow: inset 0 2px 0 #ffe3a8; }
  .night .ground.warn { background-image: repeating-linear-gradient(90deg, var(--t) 0 1px, transparent 1px 12px), linear-gradient(90deg, #6b4f1a, #4f3810); box-shadow: inset 0 2px 0 #7d6026; }
  .ground.crit { background-image: repeating-linear-gradient(90deg, var(--t) 0 1px, transparent 1px 12px), linear-gradient(90deg, #f29185, #db4437); box-shadow: inset 0 2px 0 #f7b7ae; }
  .night .ground.crit { background-image: repeating-linear-gradient(90deg, var(--t) 0 1px, transparent 1px 12px), linear-gradient(90deg, #6a2620, #4c1914); box-shadow: inset 0 2px 0 #7d332b; }
  .ground.idle { background-image: repeating-linear-gradient(90deg, var(--t) 0 1px, transparent 1px 12px), linear-gradient(90deg, #d3d8de, #aab2bb); box-shadow: inset 0 2px 0 #e6e9ed; }
  .night .ground.idle { background-image: repeating-linear-gradient(90deg, var(--t) 0 1px, transparent 1px 12px), linear-gradient(90deg, #3a414b, #2b3139); box-shadow: inset 0 2px 0 #4a525d; }
  .banner .head { position: absolute; z-index: 1; left: 0; top: 0; bottom: var(--g); right: calc(var(--sw) - 60px); display: flex; align-items: center;
                  gap: 10px; padding: 8px 8px 8px 14px; min-width: 0; }
  .banner .logo { position: relative; background: rgba(255,255,255,.62); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--c) 28%, transparent);
                  color: color-mix(in srgb, var(--c) 82%, #0d2a45); }
  .banner .logo .icon { width: 24px; height: 24px; }
  .banner.night .logo { background: rgba(255,255,255,.12); box-shadow: inset 0 0 0 1px rgba(255,255,255,.14); color: color-mix(in srgb, var(--c) 75%, #fff); }
  .banner .brand { position: absolute; right: -4px; bottom: -4px; width: 18px; height: 18px; border-radius: 5px; padding: 2px; box-sizing: border-box;
                   background: #fff; object-fit: contain; box-shadow: 0 0 0 1px rgba(13,42,69,.16), 0 1px 3px rgba(13,42,69,.18); }
  .banner .titles { flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; justify-content: center; align-self: stretch; }
  .banner .trow { display: flex; align-items: center; gap: 8px; min-width: 0; }
  .banner .name { flex: 0 1 auto; min-width: 0; }
  .banner .sub { font-size: 13px; color: var(--sky-muted); }
  .banner .chip { flex: none; margin: 0; padding: 1px 8px; line-height: 16px; white-space: nowrap; max-width: 100%; box-sizing: border-box; overflow: hidden;
                  background: color-mix(in srgb, var(--c) 18%, rgba(255,255,255,.78)); color: color-mix(in srgb, var(--c) 45%, #0d2a45); }
  .banner.night .chip { background: color-mix(in srgb, var(--c) 30%, rgba(8,18,38,.55)); color: color-mix(in srgb, var(--c) 35%, #fff); }
  .banner .chip .dot { width: 7px; height: 7px; }
  .banner .titles.below .trow { display: contents; }
  .banner .titles.below .chip { order: 9; align-self: flex-start; margin-top: 3px; }
  .banner .titles.dotonly .chip { padding: 4px; } .banner .titles.dotonly .chip-label { display: none; }
  .banner .zoom { position: absolute; z-index: 2; top: 5px; right: 5px; margin: 0; width: 24px; height: 24px; color: #33506b;
                  background: rgba(255,255,255,.55); box-shadow: inset 0 0 0 1px rgba(255,255,255,.7); -webkit-backdrop-filter: blur(4px); backdrop-filter: blur(4px); }
  .banner .zoom:hover { background: rgba(255,255,255,.75); color: #33506b; }
  .banner.night .zoom { color: #fff; background: rgba(255,255,255,.12); box-shadow: inset 0 0 0 1px rgba(255,255,255,.2); }
  .banner.night .zoom:hover { background: rgba(255,255,255,.22); color: #fff; }
  .banner:has(> .zoom) .scene { right: 34px; }
  .banner:has(> .zoom) .head { right: calc(var(--sw) - 24px); }
  .banner + .content { padding-top: 12px; }
  @container (max-width: 280px) { .banner .scene { display: none; } .banner .head, .banner:has(> .zoom) .head { right: 30px; } }
  @container (max-width: 200px) { .banner .chip { padding: 4px; } .banner .chip-label { display: none; } }
  /* The rack */
  .px-wall line { stroke: #d6dbe1; stroke-width: .8; } .night .px-wall line { stroke: #2e3746; }
  .px-tray { stroke: #c4cbd3; stroke-width: 3; } .night .px-tray { stroke: #3a4456; }
  .px-wire { fill: none; stroke: #2f80ed; stroke-width: 1.6; stroke-dasharray: 3 4; animation: px-wire 1s linear infinite; }
  .px-shadow { fill: #000; opacity: .14; } .night .px-shadow { opacity: .35; }
  .px-rack { fill: #4a5361; } .night .px-rack { fill: #141920; }
  .px-case { fill: #f4f6f8; stroke: #c4cbd3; } .night .px-case { fill: #27303d; stroke: #455066; }
  .px-vent { stroke: #cfd5dc; stroke-width: 1; } .night .px-vent { stroke: #3b4657; }
  .px-lbl { font: 600 5.6px var(--paper-font-body1_-_font-family, Roboto, sans-serif); fill: #50607a; } .night .px-lbl { fill: #a9b6c8; }
  .px-led { fill: var(--px-ok); animation: px-blink 1.2s steps(2) infinite; }
  .px-act { fill: #2f9bff; animation: px-blink .45s steps(2) infinite; }
  .px-srv.crit .px-led { fill: var(--px-crit); animation: none; } .px-srv.crit .px-act { display: none; } .px-srv.crit .px-case { opacity: .7; }
  .px-srv.warn .px-led { fill: var(--px-warn); } .px-srv.idle .px-led { fill: var(--px-idle); animation: none; } .px-srv.idle .px-act { display: none; }
  .px-bar-bg { fill: #e3e7ec; } .night .px-bar-bg { fill: #1b2230; }
  .px-bar { fill: var(--px-ok); transition: y .6s ease, height .6s ease; } .px-bar.warn { fill: var(--px-warn); } .px-bar.crit { fill: var(--px-crit); } .px-bar.mem { fill: #2f9bff; }
  .px-port { fill: var(--px-ok); animation: px-blink 1.2s steps(2) infinite; } .px-port.b { fill: #2f9bff; }
  @keyframes px-wire { to { stroke-dashoffset: -14; } }
  @keyframes px-blink { 50% { opacity: .25; } }
`;

const MOTION_STYLE = `
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { transition: none !important; animation: none !important; }
  }
`;

const DIALOG_STYLE = `
  ha-card.dialog-open { position: relative; min-height: 150px; }
  .backdrop { position: absolute; inset: 0; background: rgba(0,0,0,.45); display: flex; align-items: flex-start; justify-content: center;
              padding-top: 12px; box-sizing: border-box; z-index: 9; border-radius: inherit; }
  .modal { background: var(--card-background-color, #1c1c1c); color: var(--primary-text-color); width: min(92%, 340px); max-height: calc(100% - 24px);
           box-sizing: border-box; border-radius: 14px; padding: 16px; box-shadow: 0 8px 30px rgba(0,0,0,.4); display: flex; flex-direction: column; gap: 12px; }
  .modal .msg { font-size: 14px; line-height: 1.4; }
  .modal-actions { display: flex; justify-content: flex-end; gap: 8px; }
  .modal-actions .btn { border: none; border-radius: 8px; padding: 8px 14px; font: inherit; font-size: 13px; font-weight: 500; cursor: pointer;
                        background: var(--secondary-background-color, rgba(127,127,127,.12)); color: var(--primary-text-color); }
  .modal-actions .btn.primary { background: color-mix(in srgb, var(--primary-color, #03a9f4) 15%, transparent); color: var(--primary-color, #03a9f4); }
  .modal-actions .btn.danger { background: color-mix(in srgb, var(--px-crit) 15%, transparent); color: var(--px-crit); }
  .modal-actions .btn:focus-visible { outline: 2px solid var(--primary-color, #03a9f4); outline-offset: 2px; }
`;

const CONFIRM_GUARD_MS = 400;
const inDialog = (ev) => ev.composedPath().some((n) => ["ha-more-info-dialog", "ha-dialog", "dialog"].includes(n.localName));

// 24 h sparkline on a real time axis; gaps where data is missing. From ha-docker-card.
const HIST_PERIOD = 5 * 60000;
const HIST_REFRESH = HIST_PERIOD;
const HIST_WINDOW = 864e5;
function rangeText(points, loc) {
  if (!points || points.length < 2) return "";
  const vs = points.map((p) => p.v);
  return ` · 24 h ${fmtPct(Math.min(...vs), loc)} – ${fmtPct(Math.max(...vs), loc)}`;
}
function spark(points, end, max) {
  if (!points || points.length < 2) return "";
  const peak = max || Math.max(...points.map((p) => p.v)) || 1;
  const x = (tm) => Math.max(0, Math.min(100, (100 * (tm - (end - HIST_WINDOW))) / HIST_WINDOW)).toFixed(2);
  const y = (v) => (30 - (Math.min(Math.max(0, v), peak) / peak) * 28).toFixed(2);
  const segs = [];
  for (const [i, p] of points.entries()) {
    if (!i || p.t - points[i - 1].t > 2 * HIST_PERIOD) segs.push([]);
    segs.at(-1).push(p);
  }
  const line = segs.map((g) => `M${g.map((p) => `${x(p.t)},${y(p.v)}`).join("L")}${g.length === 1 ? "h0.4" : ""}`).join("");
  const area = segs.map((g) => `M${x(g[0].t)},30L${g.map((p) => `${x(p.t)},${y(p.v)}`).join("L")}L${x(g.at(-1).t)},30Z`).join("");
  return `<svg class="spark" viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true"><path class="spark-a" d="${area}"/><path class="spark-l" d="${line}"/></svg>`;
}

/**
 * Open arc gauge (270°, gap at the bottom) as in the gauge tile of ha-cards-kit: grey track, the share in the tile
 * colour. Drawn as stroke dashes on a circle turned so the arc starts bottom left.
 */
const arc = (pct, size = 36, width = 3) => {
  const c = size / 2;
  const r = (size - width) / 2 - 0.5;
  const C = 2 * Math.PI * r;
  const L = 0.75 * C;
  const p = pct === null ? 0 : Math.max(0, Math.min(100, pct));
  const rot = `rotate(135 ${c} ${c})`;
  return `<svg class="arcsvg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true">
    <circle class="track" cx="${c}" cy="${c}" r="${r}" stroke-width="${width}" stroke-dasharray="${L.toFixed(2)} ${C.toFixed(2)}" transform="${rot}"/>${
      p > 0
        ? `<circle class="value" cx="${c}" cy="${c}" r="${r}" stroke-width="${width}" stroke-dasharray="${((L * p) / 100).toFixed(2)} ${C.toFixed(2)}" transform="${rot}"/>`
        : ""
    }</svg>`;
};

// ---------------------------------------------------------------------------
// Base: data access, history, confirmation popup, header
// ---------------------------------------------------------------------------

class ProxmoxBase extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._html = "";
    this.shadowRoot.addEventListener("click", (ev) => this._onClick(ev));
    this.shadowRoot.addEventListener("keydown", (ev) => {
      if ((ev.key === "Enter" || ev.key === " ") && ev.target.getAttribute?.("role") === "button") {
        ev.preventDefault();
        ev.target.click();
      }
    });
    this._onKey = (ev) => {
      if (!this._confirm) return;
      if (ev.key === "Tab") {
        const btns = [...(this.shadowRoot.querySelectorAll?.(".modal .btn") || [])];
        if (!btns.length) return;
        ev.preventDefault();
        const i = btns.indexOf(this.shadowRoot.activeElement);
        btns[(i + (ev.shiftKey ? -1 : 1) + btns.length) % btns.length].focus({ preventScroll: true });
        return;
      }
      if (ev.key !== "Escape") return;
      ev.stopPropagation();
      this._closeConfirm();
    };
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._config) return;
    const sig = this._signature();
    if (sameSig(sig, this._sig)) return;
    this._update(sig);
  }

  get hass() {
    return this._hass;
  }

  connectedCallback() {
    this._onOutside ??= (ev) => {
      const foldsOpen = this._folds && Object.keys(this._folds).length;
      if ((!foldsOpen && !this._confirm) || ev.composedPath().includes(this) || inDialog(ev)) return;
      if (this._confirm) this._closeConfirm(false);
      if (foldsOpen) {
        this._folds = {};
        this._update();
      }
    };
    document.addEventListener("click", this._onOutside, true);
    if (this._confirm) window.addEventListener("keydown", this._onKey);
    // Uptimes are relative: refresh them every minute even when no state changes.
    this._tick ??= setInterval(() => this._update(), 60000);
  }

  disconnectedCallback() {
    document.removeEventListener("click", this._onOutside, true);
    window.removeEventListener("keydown", this._onKey);
    clearInterval(this._tick);
    this._tick = null;
    this._ro?.disconnect();
    this._ro = null;
  }

  setConfig(config) {
    if (!config) throw new Error("Invalid configuration");
    this._config = { ...config };
    this._folds = {};
    this._html = "";
    this._update();
  }

  _t(key, vars) {
    return t(this._hass, this._config, key, vars);
  }

  _tn(key, n) {
    return tn(this._hass, this._config, key, n);
  }

  _loc() {
    return fmtLang(this._hass, this._config);
  }

  _level(metric, v) {
    return level(v, ...thresholds(this._config, metric));
  }

  _s(id) {
    return id ? this._hass.states[id] : undefined;
  }

  // The environment as configured: nodes filtered by the `nodes` option, guests, storages, pools and disks of
  // the nodes kept (shared storages always). Each guest gets its current node from its node sensor (it follows
  // a migration), else from its device.
  _view() {
    const { env, error } = findEnv(this._hass, this._config);
    if (error) return { error };
    const filter = [].concat(this._config.nodes ?? []).filter(Boolean);
    const nodes = filter.length ? env.nodes.filter((n) => filter.includes(n.name)) : env.nodes;
    const nodeById = new Map(env.nodes.map((n) => [n.id, n]));
    const nodeName = (it) => {
      const s = this._s(it.entities.node);
      return known(s) ? s.state : (nodeById.get(it.nodeId)?.name ?? null);
    };
    const keep = (it) => !filter.length || it.shared || filter.includes(nodeName(it));
    const tag = (it) => ({ ...it, node: nodeName(it) });
    return {
      env: {
        ...env,
        nodes,
        guests: env.guests.map(tag).filter(keep),
        storages: env.storages.map(tag).filter(keep),
        zfs: env.zfs.map(tag).filter(keep),
        disks: env.disks.map(tag).filter(keep),
      },
    };
  }

  _signature() {
    const h = this._hass;
    const sig = [h.entities, h.devices, h.language, h.locale?.language, h.themes?.darkMode];
    const { env } = findEnv(h, this._config);
    if (!env) return sig;
    for (const group of [env.cluster, ...env.nodes, ...env.guests, ...env.storages, ...env.zfs, ...env.disks])
      if (group) for (const id of Object.values(group.entities)) sig.push(h.states[id]);
    return sig;
  }

  _update(sig) {
    if (!this._hass || !this._config) return;
    this._sig = sig ?? this._signature();
    let html = this._render();
    if (this._confirm)
      html = html.replace(/<ha-card>([\s\S]*)<\/ha-card>\s*$/, (_, inner) => `<ha-card class="dialog-open">${inner}${this._confirmHtml()}</ha-card>`);
    if (html !== this._html) {
      this._html = html;
      morph(this.shadowRoot, html);
    }
    this._fitPill();
  }

  // The status pill in the banner: right after the title when the title and the whole pill fit on that row, else on
  // its own line under the subtitle; when even that runs into the ground strip, its dot alone. Measured, so that
  // every language and width gets it right; refitted when the card is resized.
  _fitPill() {
    const t = this.shadowRoot?.querySelector?.(".banner .titles");
    if (!t || !t.isConnected) return;
    if (!this._ro && typeof ResizeObserver !== "undefined") {
      this._ro = new ResizeObserver(() => this._fitPill());
      this._ro.observe(this);
    }
    t.classList.remove("below", "dotonly");
    const name = t.querySelector(".name");
    const chip = t.querySelector(".chip");
    if (!name || !chip || !t.clientWidth) return;
    if (name.scrollWidth + 8 + chip.scrollWidth <= t.clientWidth + 0.5) return;
    t.classList.add("below");
    const banner = t.closest(".banner");
    const floor = banner.getBoundingClientRect().bottom - 10 + 0.5;
    if (chip.getBoundingClientRect().bottom > floor) t.classList.add("dotonly");
  }

  _call(domain, service, data) {
    return Promise.resolve()
      .then(() => this._hass.callService(domain, service, data))
      .catch((err) => console.error(`proxmox-card: ${domain}.${service} failed`, err));
  }

  _onClick(ev) {
    const path = ev.composedPath();
    const el = path.find((n) => n.dataset && (n.dataset.entity || n.dataset.action));
    if (!this._confirm && Date.now() - (this._confirmClosedAt ?? 0) < CONFIRM_GUARD_MS) {
      ev.stopPropagation();
      return;
    }
    if (this._confirm) {
      ev.stopPropagation();
      const action = el?.dataset.action;
      if (action === "confirm_ok") {
        const { run } = this._confirm;
        this._closeConfirm();
        run();
      } else if (action === "confirm_cancel" || (action === "confirm_backdrop" && path[0] === el)) {
        this._closeConfirm();
      }
      return;
    }
    if (!el) return;
    ev.stopPropagation();
    const { action, entity, label } = el.dataset;
    if (action === "fold") {
      this._folds = { ...this._folds, [el.dataset.section]: !this._isOpen(el.dataset.section) };
      this._update();
    } else if (action === "press") {
      // A button entity is "unknown" until first pressed; only "unavailable" blocks it.
      if (!this._s(entity) || this._s(entity).state === "unavailable") return;
      const cmd = el.dataset.cmd;
      const run = () => this._call("button", "press", { entity_id: entity });
      if (cmd === "start" || cmd === "resume") run();
      else
        this._openConfirm(
          { text: this._t(`confirm_${cmd}`, { name: label }), ok: this._t(cmd), danger: cmd === "stop", run },
          { action, entity }
        );
    } else if (entity) {
      this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: entity }, bubbles: true, composed: true }));
    }
  }

  _openConfirm(confirm, from) {
    this._confirm = { ...confirm, from };
    window.addEventListener("keydown", this._onKey);
    this._update();
    this.shadowRoot.querySelector?.(".modal .primary, .modal .danger")?.focus({ preventScroll: true });
  }

  _closeConfirm(restoreFocus = true) {
    const from = this._confirm?.from;
    this._confirm = null;
    this._confirmClosedAt = Date.now();
    window.removeEventListener("keydown", this._onKey);
    this._update();
    if (restoreFocus && from)
      this.shadowRoot.querySelector?.(`[data-action="${from.action}"][data-entity="${from.entity}"]`)?.focus({ preventScroll: true });
  }

  _confirmHtml() {
    const c = this._confirm;
    return `<div class="backdrop" data-action="confirm_backdrop">
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="confirm-msg">
        <div class="msg" id="confirm-msg">${esc(c.text)}</div>
        <div class="modal-actions">
          <button type="button" class="btn" data-action="confirm_cancel">${esc(this._t("cancel"))}</button>
          <button type="button" class="btn ${c.danger ? "danger" : "primary"}" data-action="confirm_ok">${esc(c.ok)}</button>
        </div>
      </div>
    </div>`;
  }

  // Logo target: the url option, else the Proxmox web interface the integration knows (a node's or the
  // cluster's configuration_url, without its deep link), else proxmox.com.
  _logoUrl(env) {
    const url = this._config.url;
    if (/^https?:\/\//i.test(url || "")) return url;
    const dev = this._hass.devices?.[env.nodes[0]?.id ?? env.cluster?.id];
    const conf = dev?.configuration_url;
    if (/^https?:\/\//i.test(conf || "")) return conf.replace(/#.*$/, "");
    return SITE;
  }

  // Node state: its status sensor ("online"), else its running binary sensor.
  _nodeState(n) {
    const s = this._s(n.entities.node_status);
    if (known(s)) return { id: s.entity_id, state: s.state };
    const b = this._s(n.entities["binary_sensor.status"]);
    if (known(b)) return { id: b.entity_id, state: b.state === "on" ? "online" : "offline" };
    return { id: s?.entity_id ?? b?.entity_id, state: s?.state ?? b?.state ?? "unknown" };
  }

  // Guest state: its status sensor (running, stopped, paused…), else its running binary sensor.
  _guestState(g) {
    const s = this._s(g.entities.status_raw);
    if (known(s)) return { id: s.entity_id, state: s.state };
    const b = this._s(g.entities["binary_sensor.status"]);
    if (known(b)) return { id: b.entity_id, state: b.state === "on" ? "running" : "stopped" };
    return { id: s?.entity_id ?? b?.entity_id, state: s?.state ?? b?.state ?? "unknown" };
  }

  _stateLabel(state) {
    const k = `state_${String(state || "").toLowerCase()}`;
    const l = this._t(k);
    return l === k ? state : l;
  }

  // CPU, memory and disk of a node or guest: % and bytes; memory total is used + free when its own sensor is off.
  _usage(e) {
    const used = bytesOf(this._s(e.memory_used));
    const free = bytesOf(this._s(e.memory_free));
    const total = bytesOf(this._s(e.memory_total)) ?? (used !== null && free !== null ? used + free : null);
    let mem = num(this._s(e.memory_used_perc));
    if (mem === null && used !== null && total) mem = (100 * used) / total;
    return {
      cpu: num(this._s(e.cpu_used)),
      mem,
      disk: num(this._s(e.disk_used_perc)),
      used,
      total,
      cores: num(this._s(e.cpus)),
      cpuId: e.cpu_used,
      memId: e.memory_used_perc ?? e.memory_used,
      diskId: e.disk_used_perc,
    };
  }

  // Updates of a node: whether any package update is pending (null when the node has no update entity), and the
  // new Proxmox VE version when there is one. The package count (hundreds of Debian packages) is not shown: only
  // in the tooltip. The update entity's latest version is "9.2.26-p92-d177" (pve-manager, then the Proxmox and
  // other package counts); without it, pve-manager in the count sensor's package list.
  _nodeUpdates(n) {
    const e = n.entities;
    const total = this._s(e.updates_total);
    const avail = this._s(e["binary_sensor.update_avail"]);
    const upd = this._s(e["update.node_update"]);
    const id = e["update.node_update"] ?? e.updates_total ?? e["binary_sensor.update_avail"];
    if (![total, avail, upd].some(known)) return { pending: null, pve: null, packages: null, id };
    const packages = num(total);
    const pending = packages > 0 || avail?.state === "on" || upd?.state === "on";
    const installed = upd?.attributes?.installed_version || this._s(e.version)?.state;
    let pve = String(upd?.attributes?.latest_version || "").split("-")[0] || null;
    if (!pve) {
      const list = total?.attributes?.updates_list;
      const m = Array.isArray(list) && list.map((x) => /^pve-manager - (\S+)/.exec(String(x))).find(Boolean);
      pve = m ? m[1] : null;
    }
    if (!pending || (pve && pve === installed)) pve = null;
    return { pending, pve, packages, id };
  }

  // Tooltip of an update badge: the new Proxmox VE version and the number of packages.
  _updTitle(u) {
    return [u.pve ? `Proxmox VE ${u.pve}` : this._t("update_available"), u.packages ? `${u.packages} ${this._t("packages")}` : ""].filter(Boolean).join(" · ");
  }

  _guestProblem(g) {
    const e = g.entities;
    return (
      stateClass(this._guestState(g).state) !== "ok" ||
      this._s(e["binary_sensor.locked"])?.state === "on" ||
      this._s(e["binary_sensor.health"])?.state === "on"
    );
  }

  _nodeProblem(n) {
    return stateClass(this._nodeState(n).state) !== "ok" || (num(this._s(n.entities.failed_tasks_count)) ?? 0) > 0;
  }

  // Storage, pool or disk: { pct, cls, problem, detail[] }.
  _itemInfo(it) {
    const e = it.entities;
    const loc = this._loc();
    if (it.kind === "disk") {
      const bad = this._s(e["binary_sensor.health"])?.state === "on";
      const wear = num(this._s(e.disk_wearout)) ?? (num(this._s(e.life_left)) !== null ? 100 - num(this._s(e.life_left)) : null);
      const temp = this._s(e.temperature);
      const wearCls = this._level("disk", wear);
      const cls = bad ? "crit" : wearCls || "ok";
      const detail = [
        fmtBytes(bytesOf(this._s(e.disk_size)), loc) !== "—" ? fmtBytes(bytesOf(this._s(e.disk_size)), loc) : null,
        known(temp) ? `${fmtNum(Number(temp.state), loc, 0)} °C` : null,
        wear !== null ? this._t("wearout", { v: fmtPct(wear, loc) }) : null,
      ];
      return { pct: wear, cls, problem: bad || (wearCls && wearCls !== "ok"), bad, detail, id: e["binary_sensor.health"] ?? e.disk_wearout };
    }
    if (it.kind === "zfs") {
      const health = this._s(e.zfs_health);
      const pct = num(this._s(e.zfs_used_perc)) ?? (num(this._s(e.zfs_free_perc)) !== null ? 100 - num(this._s(e.zfs_free_perc)) : null);
      const bad = known(health) && health.state !== "ONLINE";
      const lvl = this._level("disk", pct);
      const used = bytesOf(this._s(e.zfs_used));
      const total = bytesOf(this._s(e.zfs_total));
      return {
        pct,
        cls: bad ? "crit" : lvl || "ok",
        problem: bad || (lvl && lvl !== "ok"),
        bad,
        detail: [known(health) ? health.state : null, used !== null && total ? fmtBytesPair(used, total, loc) : null],
        id: e.zfs_health ?? e.zfs_used_perc,
      };
    }
    // Storage
    const active = this._s(e["binary_sensor.storage_active"]);
    const pct = num(this._s(e.disk_used_perc));
    const bad = active?.state === "off";
    const lvl = this._level("disk", pct);
    const used = bytesOf(this._s(e.disk_used));
    const total = bytesOf(this._s(e.disk_total));
    return {
      pct,
      cls: bad ? "crit" : lvl || "ok",
      problem: bad || (lvl && lvl !== "ok"),
      bad,
      detail: [it.shared ? this._t("shared") : null, used !== null && total ? fmtBytesPair(used, total, loc) : null],
      id: e.disk_used_perc ?? e["binary_sensor.storage_active"],
    };
  }

  // 24 h of 5-minute means from the recorder statistics, refreshed every 5 minutes, as { [id]: [{ t, v }] }.
  _history(ids) {
    if (this._config.show_history === false) return null;
    ids = ids.filter(Boolean);
    const key = ids.join(",");
    if (key && this._hass.callWS && (this._histKey !== key || Date.now() - this._histAt > HIST_REFRESH)) {
      const end = Date.now();
      this._histKey = key;
      this._histAt = end;
      this._hass
        .callWS({
          type: "recorder/statistics_during_period",
          start_time: new Date(end - HIST_WINDOW).toISOString(),
          statistic_ids: ids,
          period: "5minute",
          types: ["mean"],
        })
        .then((r) => {
          if (this._histKey !== key) return;
          const point = (p) => ({ t: typeof p.start === "number" ? p.start : Date.parse(p.start), v: p.mean });
          this._hist = Object.fromEntries(ids.map((id) => [id, (r?.[id] || []).map(point).filter((p) => Number.isFinite(p.t) && Number.isFinite(p.v))]));
          this._histEnd = end;
          this._update();
        })
        .catch(() => {
          this._histAt = Date.now() - HIST_REFRESH + 60000;
        });
    }
    return this._histKey === key ? this._hist : null;
  }

  // Header: logo, title, Proxmox version and node count, and the online chip.
  _header(env) {
    const c = this._config;
    const states = env.nodes.map((n) => this._nodeState(n).state);
    const online = states.filter((s) => s === "online").length;
    const total = env.nodes.length;
    const unknownAll = total > 0 && states.every((s) => s !== "online" && s !== "offline");
    const [chipCls, chipText] = !total
      ? ["idle", this._t("state_unknown")]
      : unknownAll
        ? ["idle", this._t("state_unavailable")]
        : total === 1
          ? online
            ? ["ok", this._t("online")]
            : ["crit", this._t("offline")]
          : [online === total ? "ok" : online ? "warn" : "crit", this._t("nodes_online", { n: online, total })];
    const versions = [...new Set(env.nodes.map((n) => this._s(n.entities.version)).filter(known).map((s) => s.state))];
    const sub = [
      versions.length ? `PVE ${versions.join(" / ")}` : null,
      total > 1 || !c.title ? `${total} ${this._tn("nodes_lc", total)}` : null,
    ].filter(Boolean);
    if (total === 1 && !c.title) sub[sub.length - 1] = env.nodes[0].name;
    const chipEntity = env.cluster?.entities.cluster_nodes_online ?? (total === 1 ? this._nodeState(env.nodes[0]).id : null);
    if (c.illustration !== false) return this._banner(env, chipCls, chipText, chipEntity, sub);
    return `
      <div class="header">
        <a class="logo ${chipCls}" href="${esc(this._logoUrl(env))}" target="_blank" rel="noopener noreferrer" title="Proxmox VE" aria-label="Proxmox VE">${svgIcon(ICONS.server)}</a>
        <div class="titles">
          <div class="name">${esc(c.title || "Proxmox")}</div>
          ${sub.length ? `<div class="sub">${esc(sub.join(" · "))}</div>` : ""}
        </div>
        <span class="chip ${chipEntity ? "clickable" : ""} ${chipCls}" ${chipEntity ? `role="button" tabindex="0" data-entity="${esc(chipEntity)}"` : ""} title="${esc(chipText)}" aria-label="${esc(chipText)}"><span class="dot"></span><span class="chip-label">${esc(chipText)}</span></span>
        ${this._zoomButton()}
      </div>`;
  }

  // The illustrated header: the logo, the title with the status pill and the subtitle on the wall, the nodes in a rack
  // at the right, and the ground strip in the state colour: red when a node is offline, amber when a node has a
  // problem (failed tasks) or a pending update, else the pill's colour.
  _banner(env, chipCls, chipText, chipEntity, sub) {
    const c = this._config;
    const slots = env.nodes.slice(0, 3).map((n) => {
      const u = this._usage(n.entities);
      const cls = stateClass(this._nodeState(n).state);
      return { name: n.name, cls, cpu: cls === "ok" ? u.cpu : 0, mem: cls === "ok" ? u.mem : 0, cpuCls: this._level("cpu", u.cpu) };
    });
    const more = Math.max(0, env.nodes.length - 3);
    const offline = env.nodes.some((n) => stateClass(this._nodeState(n).state) === "crit");
    const attention = env.nodes.some((n) => this._nodeProblem(n) || this._nodeUpdates(n).pending);
    const ground = offline ? "crit" : chipCls === "ok" && attention ? "warn" : chipCls;
    const name = c.title || "Proxmox";
    return `
      <div class="banner${isNight(this._hass, c) ? " night" : ""}">
        ${rackScene(slots, more)}
        <div class="head">
          <a class="logo ${chipCls}" href="${esc(this._logoUrl(env))}" target="_blank" rel="noopener noreferrer" title="Proxmox VE" aria-label="Proxmox VE">${svgIcon(ICONS.server)}<img class="brand" src="${BRAND_ICON}" alt="" loading="lazy" referrerpolicy="no-referrer"></a>
          <div class="titles">
            <div class="trow">
              <div class="name" title="${esc(name)}">${esc(name)}</div>
              <span class="chip ${chipEntity ? "clickable" : ""} ${chipCls}" ${chipEntity ? `role="button" tabindex="0" data-entity="${esc(chipEntity)}"` : ""} title="${esc(chipText)}" aria-label="${esc(chipText)}"><span class="dot"></span><span class="chip-label">${esc(chipText)}</span></span>
            </div>
            ${sub.length ? `<div class="sub">${esc(sub.join(" · "))}</div>` : ""}
          </div>
        </div>
        <div class="ground ${ground}"></div>
        ${this._zoomButton()}
      </div>`;
  }

  _zoomButton() {
    return "";
  }

  _error(key) {
    return `<style>${BASE_STYLE}${MOTION_STYLE}</style><ha-card><div class="warning">${esc(
      key === "unknown_env" ? `${this._t(key)}: ${this._config.environment}` : this._t(key)
    )}</div></ha-card>`;
  }

  // Guests running / total by type.
  _guestCounts(env) {
    const count = (type) => {
      const list = env.guests.filter((g) => g.type === type);
      return { total: list.length, running: list.filter((g) => this._guestState(g).state === "running").length };
    };
    return { qemu: count("qemu"), lxc: count("lxc") };
  }

  _isOpen(key) {
    return this._folds?.[key] ?? this._config[`expand_${key}`] === true;
  }
}


// ---------------------------------------------------------------------------
// KPI tiles, as in the energy, oil, heating and Tibber cards: a round icon, the label, the value large with a small
// unit, a sub line and a thin bar. Tiles without a value are left out, and rows never show a gap: a tile that does not
// fit the rest of its row and the last tile of a short row widen until the row is full.
// ---------------------------------------------------------------------------

const fillRows = (spans, cols) => {
  const out = spans.map((s) => Math.max(1, Math.min(cols, s)));
  let used = 0;
  for (let i = 0; i < out.length; i++) {
    if (used + out[i] > cols) {
      out[i - 1] += cols - used;
      used = 0;
    }
    used = (used + out[i]) % cols;
  }
  if (used > 0 && out.length) out[out.length - 1] += cols - used;
  return out;
};

const kpiGrid = (list, cols = 2) => {
  const tiles = list.filter((x) => x && x.v !== null && x.v !== undefined && x.v !== "");
  if (!tiles.length) return "";
  const spans = fillRows(
    tiles.map((x) => (x.wide ? 2 : 1)),
    cols
  );
  const pct = (v) => Math.max(0, Math.min(100, v));
  return `<div class="kpis" style="--cols:${cols}">${tiles
    .map((x, i) => {
      const click = x.entity ? ` clickable" role="button" tabindex="0" data-entity="${esc(x.entity)}` : "";
      return `<div class="kpi${x.st ? ` ${x.st}` : ""}${click}" data-key="${esc(x.key)}" style="--kc:${x.c};grid-column:span ${spans[i]}">
        <span class="ki">${svgIcon(x.icon)}</span>
        <span class="kk">${esc(x.k)}</span>
        <span class="kv">${esc(x.v)}${x.u ? `<small>${esc(x.u)}</small>` : ""}</span>
        ${x.s ? `<span class="ks">${esc(x.s)}</span>` : ""}
        ${Number.isFinite(x.p) ? `<span class="kb"><i style="width:${pct(x.p).toFixed(1)}%"></i></span>` : ""}
      </div>`;
    })
    .join("")}</div>`;
};

const KPI_STYLE = `
  .kpis { display: grid; grid-template-columns: repeat(var(--cols), minmax(0, 1fr)); gap: 8px; }
  .kpi { position: relative; display: flex; flex-direction: column; align-items: flex-start; gap: 4px; min-width: 0; padding: 11px 12px 12px;
         border-radius: 12px; background: var(--secondary-background-color, rgba(127,127,127,.08)); }
  .kpi.clickable:hover { filter: brightness(1.04); }
  .kpi .ki { width: 32px; height: 32px; flex: none; border-radius: 50%; display: grid; place-items: center; margin-bottom: 2px;
             color: color-mix(in srgb, var(--kc) 82%, var(--primary-text-color)); background: color-mix(in srgb, var(--kc) 18%, var(--ha-card-background, var(--card-background-color, #fff))); }
  .kpi .ki .icon { width: 18px; height: 18px; }
  .kpi .kk { font-size: 12.5px; line-height: 1.3; color: var(--secondary-text-color); }
  .kpi .kv { font-size: 22px; font-weight: 500; line-height: 1.15; overflow-wrap: anywhere; font-variant-numeric: tabular-nums; }
  .kpi .kv small { display: inline-block; white-space: nowrap; font-size: 12px; font-weight: 400; color: var(--secondary-text-color); margin-left: 4px; }
  .kpi .ks { font-size: 11.5px; line-height: 1.35; color: var(--secondary-text-color); }
  .kpi .kb { position: relative; align-self: stretch; height: 4px; margin-top: auto; border-radius: 2px; background: color-mix(in srgb, var(--secondary-text-color) 25%, transparent); }
  .kpi .ks + .kb, .kpi .kv + .kb { margin-top: 6px; }
  .kpi .kb i { position: absolute; left: 0; top: 0; bottom: 0; border-radius: 2px; background: var(--kc); }
  .kpi.warn, .kpi.bad { box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--kc) 45%, transparent); background: color-mix(in srgb, var(--kc) 8%, var(--secondary-background-color, rgba(127,127,127,.08))); }
  .kpi.warn .kv, .kpi.bad .kv { color: color-mix(in srgb, var(--kc) 70%, var(--primary-text-color)); }
`;

// ---------------------------------------------------------------------------
// Full card
// ---------------------------------------------------------------------------

const FULL_STYLE = `
  .content { padding: 4px 16px 16px; display: flex; flex-direction: column; gap: 24px; }
  .section-title { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 500; text-transform: uppercase;
                   letter-spacing: .04em; color: var(--secondary-text-color); margin-bottom: 10px; }
  .section-title .icon { width: 16px; height: 16px; }
  .section-title .count { margin-left: auto; text-transform: none; letter-spacing: 0; font-weight: 400; }
  .section-title.fold { cursor: pointer; user-select: none; }
  .section-title .chevron { transition: transform .2s ease; }
  .section-title.closed { margin-bottom: 0; }
  .section-title.closed .chevron { transform: rotate(-90deg); }
  /* A node: its name line, then CPU, RAM and disk as compact arc tiles (small arc with the icon left, name and value
     beside it), as the compact gauge tile of ha-cards-kit. Colour per metric, orange/red from the thresholds. */
  .nodes { display: flex; flex-direction: column; gap: 8px; }
  .node { border-radius: 12px; padding: 10px 12px; background: var(--secondary-background-color, rgba(127,127,127,.06)); min-width: 0;
          display: flex; flex-direction: column; gap: 8px; }
  .node-head { display: flex; align-items: center; gap: 8px; min-width: 0; }
  .node-head .dot { width: 8px; height: 8px; }
  .node-head .nname { flex: 1 1 auto; font-size: 14px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .node-head .tags { display: flex; gap: 4px; margin-left: auto; min-width: 0; flex-wrap: nowrap; overflow: hidden; }
  .node .detail { font-size: 12px; color: var(--secondary-text-color); line-height: 1.4; }
  .arcs { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; }
  .arct { --mc: var(--px-accent); --c: var(--mc); display: flex; align-items: center; gap: 8px; min-width: 0; padding: 7px 9px; border-radius: 10px;
          background: var(--ha-card-background, var(--card-background-color, #fff)); }
  .arct.cpu { --mc: var(--indigo-color, #5c6bc0); } .arct.ram { --mc: var(--purple-color, #8e44ad); } .arct.disk { --mc: var(--blue-color, #039be5); }
  .arct.ok, .arct.idle { --c: var(--mc); } .arct.warn { --c: var(--px-warn); } .arct.crit { --c: var(--px-crit); }
  .arct.warn, .arct.crit { box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--c) 45%, transparent);
                           background: color-mix(in srgb, var(--c) 8%, var(--ha-card-background, var(--card-background-color, #fff))); }
  .arct.clickable:hover { filter: brightness(1.04); }
  .arct .arc { position: relative; flex: none; width: 36px; height: 36px; display: grid; place-items: center; }
  .arct .arcsvg { position: absolute; inset: 0; }
  .arcsvg circle { fill: none; stroke-linecap: round; }
  .arcsvg .track { stroke: color-mix(in srgb, var(--secondary-text-color) 22%, transparent); }
  .arcsvg .value { stroke: var(--c); transition: stroke-dasharray .6s ease; }
  .arct .gi { width: 20px; height: 20px; border-radius: 50%; display: grid; place-items: center;
              color: color-mix(in srgb, var(--c) 85%, var(--primary-text-color)); background: color-mix(in srgb, var(--c) 18%, var(--ha-card-background, var(--card-background-color, #fff))); }
  .arct .gi .icon { width: 12px; height: 12px; }
  .arct .t { display: flex; flex-direction: column; min-width: 0; }
  .arct .gk { font-size: 11.5px; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .arct .gv { font-size: 16px; font-weight: 500; line-height: 1.2; white-space: nowrap; font-variant-numeric: tabular-nums; }
  .arct .gv small { font-size: 11px; font-weight: 400; color: var(--secondary-text-color); margin-left: 2px; }
  .arct.warn .gv, .arct.crit .gv { color: color-mix(in srgb, var(--c) 70%, var(--primary-text-color)); }
  .arct.idle .arc, .arct.idle .gv { opacity: .6; }
  @container (max-width: 339px) {
    .arcs { grid-template-columns: minmax(0, 1fr); }
  }
  .counts { display: grid; grid-template-columns: repeat(auto-fit, minmax(68px, 1fr)); gap: 10px; }
  .count-tile { display: flex; flex-direction: column; align-items: center; padding: 10px 6px; border-radius: 10px;
                background: var(--secondary-background-color, rgba(127,127,127,.08)); min-width: 0; text-align: center; }
  .count-tile .top { display: flex; align-items: center; gap: 6px; }
  .count-tile .icon { color: var(--c, var(--secondary-text-color)); }
  .count-tile .k { font-size: 11px; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
  .count-tile .v { font-size: 14px; font-weight: 500; }
  .count-tile.hot { --c: var(--px-accent); }
  .count-tile.hot .v { color: var(--px-accent); }
  .count-tile.bad { --c: var(--px-crit); }
  .count-tile.bad .v { color: var(--px-crit); }
  .list { display: flex; flex-direction: column; }
  .group { font-size: 11px; font-weight: 500; color: var(--secondary-text-color); padding: 14px 0 4px; display: flex; align-items: center; gap: 6px; }
  .group .n { margin-left: auto; font-weight: 400; }
  /* One row per guest, storage or disk, separated by a hairline drawn over its chart. */
  .item { display: flex; align-items: center; gap: 12px; padding: 14px 0; min-height: 40px; min-width: 0; position: relative; }
  .item::after { content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 1px; background: var(--divider-color, rgba(127,127,127,.2)); }
  .item > :not(.spark) { position: relative; }
  .item > .spark { position: absolute; left: 0; bottom: 4px; width: 100%; height: 36%; pointer-events: none; --c: var(--primary-color, #03a9f4); opacity: .4; }
  .item:last-child::after { display: none; }
  .item .ticon { width: 20px; height: 20px; color: var(--c, var(--secondary-text-color)); }
  .item .main { flex: 1; min-width: 0; }
  .item .title { font-size: 15px; line-height: 1.35; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: flex; align-items: center; gap: 6px; }
  .item .title > span:first-child { overflow: hidden; text-overflow: ellipsis; }
  .item .detail { font-size: 13px; line-height: 1.4; margin-top: 2px; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .item .ubar { width: 64px; flex: none; }
  .item .uval { font-size: 12px; min-width: 38px; text-align: right; flex: none; }
  @container (max-width: 299px) { .item .ubar { width: 36px; } }
  .ct-tools { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
  .ct-search { flex: 1; min-width: 0; display: flex; align-items: center; gap: 6px; padding: 0 8px; height: 30px; box-sizing: border-box;
               border: 1px solid var(--divider-color, rgba(127,127,127,.25)); border-radius: 8px; color: var(--secondary-text-color); }
  .ct-search .icon { width: 16px; height: 16px; }
  .ct-search:focus-within { border-color: var(--primary-color, #03a9f4); }
  .ct-search input { all: unset; flex: 1; min-width: 0; font-size: 13px; color: var(--primary-text-color); }
  .ct-search input::placeholder { color: var(--secondary-text-color); }
  .ct-sort { flex: none; max-width: 45%; height: 30px; padding: 0 6px; font: inherit; font-size: 13px; border-radius: 8px; cursor: pointer;
             border: 1px solid var(--divider-color, rgba(127,127,127,.25)); background: transparent; color: var(--primary-text-color); }
  .ct-sort option { background: var(--card-background-color, #fff); color: var(--primary-text-color); }
  .ctrl { display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 50%; border: none;
          background: transparent; color: var(--secondary-text-color); cursor: pointer; flex: none; padding: 0; }
  .ctrl:hover:not(:disabled) { background: var(--secondary-background-color, rgba(127,127,127,.12)); }
  .ctrl:disabled { opacity: .4; cursor: default; }
  .ctrl.go { color: var(--px-ok); }
  .ctrl.danger { color: var(--px-crit); }
  .ctrl .icon { width: 22px; height: 22px; }
  .empty { font-size: 13px; color: var(--secondary-text-color); padding: 4px 0; }
`;

// Button commands of a guest, in display order, and when they are offered.
const GUEST_CMDS = [
  { cmd: "resume", icon: ICONS.play, when: (st) => st === "paused" || st === "suspended", cls: "go" },
  { cmd: "start", icon: ICONS.play, when: (st) => st === "stopped", cls: "go" },
  { cmd: "reboot", icon: ICONS.restart, when: (st) => st === "running" },
  { cmd: "shutdown", icon: ICONS.power, when: (st) => st === "running" },
  { cmd: "stop", icon: ICONS.power, when: (st) => st === "running" || st === "paused", cls: "danger", opt: "show_stop" },
];

class ProxmoxCard extends ProxmoxBase {
  constructor() {
    super();
    this.shadowRoot.addEventListener("input", (ev) => {
      if (ev.target?.dataset?.ctl !== "search") return;
      this._query = ev.target.value;
      this._update();
    });
    this.shadowRoot.addEventListener("change", (ev) => {
      if (ev.target?.dataset?.ctl !== "sort") return;
      this._sort = ev.target.value;
      this._update();
    });
  }

  static getConfigElement() {
    return document.createElement("proxmox-card-editor");
  }

  static getStubConfig(hass) {
    const env = listEnvs(hass)[0];
    return env ? { environment: env.value } : {};
  }

  getCardSize() {
    const c = this._config || {};
    const { env } = this._hass && this._config ? this._view() : {};
    let size = 1;
    if (c.show_nodes !== false) size += 3 * Math.max(1, Math.ceil((env?.nodes.length ?? 1) / 2));
    if (c.show_counts !== false) size += 1;
    if (c.show_guests !== false) size += 1 + (this._isOpen("guests") ? (env?.guests.length ?? 0) : 0);
    if (c.show_storage !== false) size += 1 + (this._isOpen("storage") ? (env ? env.storages.length + env.zfs.length + env.disks.length : 0) : 0);
    return size;
  }

  getGridOptions() {
    return { columns: 12, min_columns: 6 };
  }

  _isOpen(key) {
    // VMs and containers are open by default: the list is what this card is for.
    if (key === "guests") return this._folds?.guests ?? this._config.expand_guests !== false;
    return super._isOpen(key);
  }

  _render() {
    const { env, error } = this._view();
    if (error) return this._error(error);
    const c = this._config;
    const parts = [];
    if (c.show_counts !== false) parts.push(this._counts(env));
    if (c.show_nodes !== false && env.nodes.length) parts.push(this._nodes(env));
    if (c.show_guests !== false) parts.push(this._guests(env));
    if (c.show_storage !== false) parts.push(this._storage(env));
    return `<style>${BASE_STYLE}${DIALOG_STYLE}${FULL_STYLE}${KPI_STYLE}${BANNER_STYLE}${MOTION_STYLE}</style>
      <ha-card>
        ${this._header(env)}
        <div class="content">${parts.filter(Boolean).join("")}</div>
      </ha-card>`;
  }

  // Ids whose 24 h statistics are drawn: the nodes' CPU and memory, and the guests' CPU while their list is open.
  _histIds(env) {
    const ids = [];
    if (this._config.show_nodes !== false) for (const n of env.nodes) ids.push(n.entities.cpu_used, n.entities.memory_used_perc);
    if (this._config.show_guests !== false && this._isOpen("guests")) for (const g of env.guests) ids.push(g.entities.cpu_used);
    return ids;
  }

  /** One metric of a node as a compact arc tile: small arc with the icon, name and value beside it. */
  _arcTile(id, label, icon, pct, cls, metric, hist) {
    const range = rangeText(hist, this._loc());
    const value = pct === null ? "—" : `${fmtNum(Math.round(pct), this._loc(), 0)}<small>%</small>`;
    const state = pct === null ? "idle" : cls;
    return `<div class="arct clickable ${metric} ${state}" role="button" tabindex="0" data-entity="${esc(id || "")}"${range ? ` title="${esc(label + range)}"` : ""}>
      <span class="arc">${arc(pct)}<span class="gi">${svgIcon(icon)}</span></span>
      <span class="t"><span class="gk">${esc(label)}</span><span class="gv">${value}</span></span>
    </div>`;
  }

  _nodes(env) {
    const hist = this._history(this._histIds(env));
    const loc = this._loc();
    const blocks = env.nodes.map((n) => {
      const e = n.entities;
      const st = this._nodeState(n);
      const u = this._usage(e);
      const upd = this._nodeUpdates(n);
      const failed = num(this._s(e.failed_tasks_count)) ?? 0;
      const backup = this._s(e["binary_sensor.backup_running"])?.state === "on";
      const guests = env.guests.filter((g) => g.node === n.name);
      const run = (type) => guests.filter((g) => g.type === type && this._guestState(g).state === "running").length;
      const of = (type) => guests.filter((g) => g.type === type).length;
      const vms = num(this._s(e.qemu_on)) ?? run("qemu");
      const lxcs = num(this._s(e.lxc_on)) ?? run("lxc");
      const load = this._s(e.load_1m);
      const io = num(this._s(e.io_wait));
      const since = fmtSince(this._s(e.uptime), loc);
      const ratio = (r, type) => (of(type) && of(type) !== r ? `${r}/${of(type)}` : `${r}`);
      const detail = [
        `${ratio(vms, "qemu")} ${this._tn("vms_lc", vms)}`,
        `${ratio(lxcs, "lxc")} ${this._tn("lxcs_lc", lxcs)}`,
        known(load) ? `${this._t("load")} ${fmtNum(Number(load.state), loc, 2)}` : null,
        io !== null ? `${this._t("io_delay")} ${fmtPct(io, loc)}` : null,
        since && st.state === "online" ? this._t("uptime", { d: since }) : null,
      ].filter(Boolean);
      const tags = [
        backup ? `<span class="tag">${svgIcon(ICONS.backup)}${esc(this._t("backup_running"))}</span>` : "",
        failed > 0
          ? `<span class="tag alert crit clickable" role="button" tabindex="0" data-entity="${esc(e.failed_tasks_count)}" title="${esc(this._t("failed_tasks", { n: failed }))}">${svgIcon(ICONS.alert)}${failed}</span>`
          : "",
        upd.pending
          ? `<span class="tag upd clickable" role="button" tabindex="0" data-entity="${esc(upd.id)}" title="${esc(this._updTitle(upd))}" aria-label="${esc(this._updTitle(upd))}">${svgIcon(ICONS.update)}${esc(upd.pve ? `PVE ${upd.pve}` : this._t("updates"))}</span>`
          : "",
      ].join("");
      // Cores and memory used go into the detail line under the arc tiles.
      if (u.cores) detail.splice(2, 0, `${fmtNum(u.cores, loc, 0)} ${this._tn("cores", u.cores)}`);
      if (u.used !== null && u.total) detail.splice(u.cores ? 3 : 2, 0, `${this._t("memory")} ${fmtBytesPair(u.used, u.total, loc)}`);
      return `<div class="node" data-key="${esc(n.id)}">
        <div class="node-head">
          <span class="dot ${stateClass(st.state)}"></span>
          <span class="nname clickable" role="button" tabindex="0" data-entity="${esc(st.id || "")}" title="${esc(this._stateLabel(st.state))}">${esc(n.name)}</span>
          <span class="tags">${tags}</span>
        </div>
        <div class="arcs">
          ${this._arcTile(u.cpuId, this._t("cpu"), ICONS.cpu, u.cpu, this._level("cpu", u.cpu), "cpu", hist?.[u.cpuId])}
          ${this._arcTile(u.memId, this._t("memory"), ICONS.ram, u.mem, this._level("ram", u.mem), "ram", hist?.[e.memory_used_perc])}
          ${this._arcTile(u.diskId, this._t("disk"), ICONS.disk, u.disk, this._level("disk", u.disk), "disk", null)}
        </div>
        <div class="detail">${esc(detail.join(" · "))}</div>
      </div>`;
    });
    return `<div class="nodes">${blocks.join("")}</div>`;
  }

  /** VMs, containers, storage and updates as KPI tiles, the bar showing how much of each is running or fine. */
  _counts(env) {
    const gc = this._guestCounts(env);
    const loc = this._loc();
    // Updates: the nodes with pending updates, out of the nodes that report them.
    const updates = env.nodes.map((n) => this._nodeUpdates(n)).filter((u) => u.pending !== null);
    const pending = updates.filter((u) => u.pending);
    const stores = [...env.storages, ...env.zfs];
    const problems = [...stores, ...env.disks].filter((it) => this._itemInfo(it).bad).length;
    const guests = (type, key, icon, label, entity) => {
      const g = gc[type];
      if (!g.total) return null;
      const stopped = g.total - g.running;
      return {
        key,
        k: label,
        v: fmtNum(g.running, loc, 0),
        u: this._t("k_of_running", { n: fmtNum(g.total, loc, 0) }),
        icon,
        c: stopped ? "var(--px-warn)" : "var(--px-ok)",
        p: (g.running / g.total) * 100,
        s: stopped ? this._t("k_stopped", { n: stopped }) : "",
        entity,
      };
    };
    const pve = pending.map((u) => u.pve).find(Boolean);
    return kpiGrid([
      guests("qemu", "vms", ICONS.vm, this._t("vms"), env.cluster?.entities.cluster_qemu_running),
      guests("lxc", "lxcs", ICONS.lxc, this._t("lxcs"), env.cluster?.entities.cluster_lxc_running),
      stores.length && {
        key: "storage",
        k: this._t("storage"),
        v: fmtNum(stores.length - problems, loc, 0),
        u: this._t("k_of_ok", { n: fmtNum(stores.length, loc, 0) }),
        icon: ICONS.storage,
        c: problems ? "var(--px-crit)" : "var(--info-color, #039be5)",
        st: problems ? "bad" : "",
        p: ((stores.length - problems) / stores.length) * 100,
        s: problems ? this._t("k_problems", { n: problems }) : "",
      },
      updates.length && {
        key: "updates",
        k: this._t("updates"),
        v: fmtNum(pending.length, loc, 0),
        u: this._t("k_of_nodes", { n: fmtNum(updates.length, loc, 0) }),
        icon: ICONS.update,
        c: pending.length ? "var(--px-accent)" : "var(--px-ok)",
        st: pending.length ? "warn" : "",
        s: pending.length ? (pve ? this._t("k_pve_available", { v: pve }) : this._t("k_updates_pending")) : this._t("k_up_to_date"),
        entity: updates.length === 1 ? updates[0].id : pending.length === 1 ? pending[0].id : "",
      },
    ]);
  }

  _controls(g, state) {
    const c = this._config;
    if (c.show_controls === false) return "";
    return GUEST_CMDS.filter(({ cmd, when, opt }) => when(state) && (!opt || c[opt] === true) && g.entities[`button.${cmd}`])
      .map(({ cmd, icon, cls = "" }) => {
        const id = g.entities[`button.${cmd}`];
        const s = this._s(id);
        if (!s) return "";
        return `<button type="button" class="ctrl ${cls}" title="${esc(this._t(cmd))}" aria-label="${esc(`${this._t(cmd)} ${g.name}`)}" data-key="${cmd}" data-action="press" data-cmd="${cmd}" data-entity="${esc(id)}" data-label="${esc(g.name)}"${s.state === "unavailable" ? " disabled" : ""}>${svgIcon(icon)}</button>`;
      })
      .join("");
  }

  _guests(env) {
    if (!env.guests.length) return "";
    const loc = this._loc();
    const sort = this._sort ?? "name";
    const query = (this._query ?? "").trim().toLowerCase();
    const hist = this._isOpen("guests") ? this._history(this._histIds(env)) : null;
    const rows = env.guests.map((g) => {
      const e = g.entities;
      const st = this._guestState(g);
      const u = this._usage(e);
      const locked = this._s(e["binary_sensor.locked"])?.state === "on";
      const unhealthy = this._s(e["binary_sensor.health"])?.state === "on" && st.state === "running";
      const cls = unhealthy ? "crit" : stateClass(st.state);
      const ip = this._s(e.ip_address);
      const since = fmtSince(this._s(e.uptime), loc);
      const running = st.state === "running";
      const detail = [
        running ? null : this._stateLabel(st.state),
        running && u.cpu !== null ? `${this._t("cpu")} ${fmtPct(u.cpu, loc)}` : null,
        running && u.mem !== null ? `${this._t("memory")} ${fmtPct(u.mem, loc)}` : null,
        known(ip) && ip.state !== "" ? ip.state : null,
        running && since ? this._t("uptime", { d: since }) : null,
      ].filter(Boolean);
      const typeLabel = g.type === "qemu" ? this._t("vm") : "LXC";
      const cpuHist = hist && e.cpu_used ? hist[e.cpu_used] : null;
      const range = rangeText(cpuHist, loc);
      return {
        g,
        problem: this._guestProblem(g),
        u,
        match: !query || g.name.toLowerCase().includes(query) || String(g.vmid).includes(query),
        html: `<div class="item ${cls}" data-key="${esc(g.id)}">${running && cpuHist ? spark(cpuHist, this._histEnd) : ""}
          ${svgIcon(g.type === "qemu" ? ICONS.vm : ICONS.lxc, "ticon")}
          <div class="main clickable" role="button" tabindex="0" data-entity="${esc(st.id || "")}"${range ? ` title="${esc(`${g.name} · CPU${range}`)}"` : ""}>
            <div class="title"><span>${esc(g.name)}</span><span class="tag">${esc(typeLabel)} ${esc(g.vmid)}</span>
              ${locked ? `<span class="tag alert warn">${svgIcon(ICONS.lock)}${esc(this._t("locked"))}</span>` : ""}
              ${unhealthy ? `<span class="tag alert crit">${esc(this._t("unhealthy"))}</span>` : ""}
            </div>
            <div class="detail">${esc(detail.join(" · "))}</div>
          </div>
          ${this._controls(g, st.state)}
        </div>`,
      };
    });
    const has = { cpu: rows.some((r) => r.u.cpu !== null), memory: rows.some((r) => r.u.mem !== null) };
    const by = sort === "id" || has[sort] ? sort : "name";
    const cmp = {
      name: (a, b) => Number(b.problem) - Number(a.problem) || a.g.name.localeCompare(b.g.name, undefined, { numeric: true }),
      id: (a, b) => Number(a.g.vmid) - Number(b.g.vmid),
      cpu: (a, b) => (b.u.cpu ?? -1) - (a.u.cpu ?? -1),
      memory: (a, b) => (b.u.mem ?? -1) - (a.u.mem ?? -1),
    }[by];
    rows.sort(cmp);
    const opts = [
      ["name", "sort_name"],
      ["id", "sort_id"],
      ["cpu", "cpu"],
      ["memory", "memory"],
    ].filter(([k]) => k === "name" || k === "id" || has[k]);
    const tools = `<div class="ct-tools">
        <label class="ct-search">${svgIcon(ICONS.search)}<input type="search" data-ctl="search" placeholder="${esc(this._t("search"))}" aria-label="${esc(this._t("search"))}" value="${esc(this._query ?? "")}" autocomplete="off" spellcheck="false"></label>
        <select class="ct-sort" data-ctl="sort" aria-label="${esc(this._t("sort_by"))}" title="${esc(this._t("sort_by"))}">${opts
          .map(([k, l]) => `<option value="${k}"${k === by ? " selected" : ""}>${esc(this._t(l))}</option>`)
          .join("")}</select>
      </div>`;
    // Grouped by node (several nodes, group_by_node not off): a small heading per node, rows sorted inside.
    const groups = env.nodes.length > 1 && this._config.group_by_node !== false ? [...env.nodes.map((n) => n.name), null] : null;
    return this._section("guests", ICONS.vm, this._t("guests"), rows, { tools, query: !!query, groups, groupOf: (r) => r.g.node });
  }

  _storage(env) {
    const loc = this._loc();
    const multi = env.nodes.length > 1;
    const rows = [...env.storages, ...env.zfs, ...env.disks].map((it) => {
      const info = this._itemInfo(it);
      const icon = it.kind === "disk" ? ICONS.disk : ICONS.storage;
      const kindLabel = it.kind === "zfs" ? "ZFS" : it.kind === "disk" ? this._t("disk") : this._t("storage");
      const detail = [kindLabel, multi && it.node && !it.shared ? it.node : null, ...info.detail].filter(Boolean);
      return {
        problem: !!info.problem,
        html: `<div class="item ${info.cls}" data-key="${esc(it.id)}">
          ${svgIcon(icon, "ticon")}
          <div class="main clickable" role="button" tabindex="0" data-entity="${esc(info.id || "")}">
            <div class="title"><span>${esc(it.name)}</span>
              ${it.kind === "disk" && info.bad ? `<span class="tag alert crit">${svgIcon(ICONS.alert)}${esc(this._t("smart_failed"))}</span>` : ""}
              ${it.kind === "zfs" && info.bad ? `<span class="tag alert crit">${svgIcon(ICONS.alert)}${esc(this._t("pool"))}</span>` : ""}
            </div>
            <div class="detail">${esc(detail.join(" · "))}</div>
          </div>
          ${info.pct !== null ? `<div class="bar ubar"><div style="width:${Math.max(0, Math.min(100, info.pct))}%"></div></div><span class="uval">${esc(fmtPct(info.pct, loc))}</span>` : ""}
        </div>`,
      };
    });
    return this._section("storage", ICONS.storage, this._t("storage"), rows);
  }

  // A foldable list. `groups`: node names in order (null: the rest) with `groupOf` giving a row's group.
  _section(key, icon, title, rows, { tools = "", query = false, groups = null, groupOf = null } = {}) {
    if (!rows.length) return "";
    const shown = rows.filter((r) => r.match !== false && (!this._config.only_problems || r.problem));
    if (key !== "guests") shown.sort((a, b) => Number(b.problem) - Number(a.problem));
    const open = this._isOpen(key);
    const empty = query ? this._t("no_match") : `✓ ${this._t("all_ok")}`;
    let body = shown.map((r) => r.html).join("");
    if (groups && shown.length) {
      const named = new Set(groups.filter(Boolean));
      body = groups
        .map((gname) => {
          const list = shown.filter((r) => (gname === null ? !named.has(groupOf(r)) : groupOf(r) === gname));
          if (!list.length) return "";
          return `<div class="group" data-key="grp-${esc(gname ?? "-")}">${svgIcon(ICONS.server, "")}${esc(gname ?? "—")}<span class="n">${list.length}</span></div>${list.map((r) => r.html).join("")}`;
        })
        .join("");
    }
    return `<div>
      <div class="section-title fold ${open ? "" : "closed"}" role="button" tabindex="0" aria-expanded="${open}" data-action="fold" data-section="${key}">${svgIcon(icon)}${esc(title)}<span class="count">${shown.length}/${rows.length}</span>${svgIcon(ICONS.chevron, "chevron")}</div>
      ${open ? `${tools}<div class="list">${shown.length ? body : `<div class="empty">${esc(empty)}</div>`}</div>` : ""}
    </div>`;
  }
}

// ---------------------------------------------------------------------------
// Mini card
// ---------------------------------------------------------------------------

const MINI_STYLE = `
  .content { padding: 4px 16px 16px; display: flex; flex-direction: column; gap: 12px; }
  .nrow { display: grid; grid-template-columns: minmax(0, 92px) minmax(0, 1fr) minmax(0, 1fr); align-items: center; gap: 10px; font-size: 13px; }
  .nrow .nname { display: flex; align-items: center; gap: 6px; min-width: 0; font-weight: 500; }
  .nrow .nname span:last-child { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .m { position: relative; display: flex; flex-direction: column; gap: 3px; min-width: 0; border-radius: 6px; }
  .m > :not(.spark) { position: relative; }
  .m .spark { position: absolute; inset: -2px 0; width: 100%; height: calc(100% + 4px); pointer-events: none; }
  .m .top { display: flex; justify-content: space-between; gap: 4px; font-size: 11px; color: var(--secondary-text-color); }
  .m .top b { color: var(--primary-text-color); font-weight: 500; }
  @container (max-width: 229px) { .nrow { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); } .nrow .nname { grid-column: 1 / -1; } }
  .foot { display: flex; justify-content: space-between; align-items: center; gap: 8px; font-size: 12px; color: var(--secondary-text-color); margin-top: 2px; flex-wrap: wrap; }
  .foot span { display: inline-flex; align-items: center; gap: 4px; }
  .foot .icon { width: 14px; height: 14px; }
  .foot .hot { color: var(--px-accent); }
  .foot .bad { color: var(--px-crit); }
`;

class ProxmoxMiniCard extends ProxmoxCard {
  static getConfigElement() {
    return document.createElement("proxmox-mini-card-editor");
  }

  static getStubConfig(hass) {
    return ProxmoxCard.getStubConfig(hass);
  }

  constructor() {
    super();
    this._zoomed = false;
    this.shadowRoot.addEventListener("click", (ev) => this._zoomClick(ev));
    this._onUnzoom = (ev) => {
      if (this._zoomed && !ev.composedPath().includes(this) && !inDialog(ev)) this._setZoom(false);
    };
  }

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener("click", this._onUnzoom, true);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener("click", this._onUnzoom, true);
  }

  setConfig(config) {
    this._zoomed = false;
    this.setAttribute("mini", "");
    super.setConfig(config);
  }

  getCardSize() {
    return this._zoomed ? super.getCardSize() : 2 + (this._hass && this._config ? (this._view().env?.nodes.length ?? 1) : 1);
  }

  getGridOptions() {
    return { ...(this._zoomed ? super.getGridOptions() : { columns: 6, min_columns: 6 }), rows: "auto" };
  }

  _setZoom(zoomed) {
    this._zoomed = zoomed;
    this._update();
  }

  _zoomClick(ev) {
    if (!ev.target?.closest?.(".zoom")) return;
    ev.stopPropagation();
    this._setZoom(!this._zoomed);
    if (ev.detail === 0) this.shadowRoot.querySelector(".zoom")?.focus({ preventScroll: true });
  }

  _zoomButton() {
    if (this._config.zoom === false) return "";
    const z = this._zoomed;
    return `<button type="button" class="zoom" title="${esc(this._t(z ? "zoom_out" : "zoom_in"))}">${svgIcon(z ? ICONS.collapse : ICONS.expand)}</button>`;
  }

  _histIds(env) {
    if (this._zoomed) return super._histIds(env);
    return env.nodes.flatMap((n) => [n.entities.cpu_used, n.entities.memory_used_perc]);
  }

  _m(id, label, pct, cls, points) {
    const loc = this._loc();
    const range = rangeText(points, loc);
    const display = pct === null ? "—" : fmtPct(pct, loc);
    return `<div class="m clickable ${cls}" role="button" tabindex="0" data-entity="${esc(id || "")}" aria-label="${esc(`${label} ${display}`)}"${range ? ` title="${esc(label + range)}"` : ""}>
      ${spark(points, this._histEnd, 100)}<div class="top"><span>${esc(label)}</span><b>${esc(display)}</b></div>
      <div class="bar"><div style="width:${pct === null ? 0 : Math.max(0, Math.min(100, pct))}%"></div></div>
    </div>`;
  }

  _render() {
    if (this._zoomed) return super._render();
    const { env, error } = this._view();
    if (error) return this._error(error);
    const hist = this._history(this._histIds(env));
    const rows = env.nodes.map((n) => {
      const st = this._nodeState(n);
      const u = this._usage(n.entities);
      return `<div class="nrow" data-key="${esc(n.id)}">
        <div class="nname clickable ${stateClass(st.state)}" role="button" tabindex="0" data-entity="${esc(st.id || "")}"><span class="dot"></span><span>${esc(n.name)}</span></div>
        ${this._m(u.cpuId, this._t("cpu"), u.cpu, this._level("cpu", u.cpu), hist?.[n.entities.cpu_used])}
        ${this._m(u.memId, this._t("memory"), u.mem, this._level("ram", u.mem), hist?.[n.entities.memory_used_perc])}
      </div>`;
    });
    const foot = [];
    if (this._config.show_footer !== false) {
      const gc = this._guestCounts(env);
      if (gc.qemu.total) foot.push(`<span>${svgIcon(ICONS.vm)}${gc.qemu.running}/${gc.qemu.total} ${esc(this._tn("vms_lc", gc.qemu.total))}</span>`);
      if (gc.lxc.total) foot.push(`<span>${svgIcon(ICONS.lxc)}${gc.lxc.running}/${gc.lxc.total} ${esc(this._tn("lxcs_lc", gc.lxc.total))}</span>`);
      const problems =
        env.guests.filter((g) => this._s(g.entities["binary_sensor.locked"])?.state === "on" || this._s(g.entities["binary_sensor.health"])?.state === "on").length +
        [...env.storages, ...env.zfs, ...env.disks].filter((it) => this._itemInfo(it).bad).length +
        env.nodes.filter((n) => this._nodeProblem(n)).length;
      if (problems) foot.push(`<span class="bad">${svgIcon(ICONS.alert)}${problems} ${esc(this._tn("problems", problems))}</span>`);
      // Updates: the new Proxmox VE version when a node has one, else just "Updates" (no package count).
      const upd = env.nodes.map((n) => this._nodeUpdates(n)).filter((u) => u.pending);
      if (upd.length) {
        const pve = upd.map((u) => u.pve).filter(Boolean).sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))[0];
        foot.push(`<span class="hot">${svgIcon(ICONS.update)}${esc(pve ? `PVE ${pve}` : this._t("updates"))}</span>`);
      }
    }
    return `<style>${BASE_STYLE}${DIALOG_STYLE}${MINI_STYLE}${BANNER_STYLE}${MOTION_STYLE}</style>
      <ha-card>
        ${this._header(env)}
        <div class="content">
          ${rows.join("")}
          ${foot.length ? `<div class="foot">${foot.join("")}</div>` : ""}
        </div>
      </ha-card>`;
  }
}

// ---------------------------------------------------------------------------
// Visual editors (ha-form)
// ---------------------------------------------------------------------------

class ProxmoxEditorBase extends HTMLElement {
  static get toggles() {
    return [];
  }

  static get thresholds() {
    return Object.keys(THRESHOLDS);
  }

  setConfig(config) {
    this._config = { ...config };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  _schema(envs, nodes) {
    const tr = (k) => t(this._hass, this._config, k);
    const schema = [];
    if (envs.length > 1) schema.push({ name: "environment", selector: { select: { mode: "dropdown", options: envs } } });
    schema.push({ name: "title", selector: { text: {} } });
    if (nodes.length > 1) schema.push({ name: "nodes", selector: { select: { multiple: true, mode: "list", options: nodes } } });
    schema.push(
      { name: "url", selector: { text: { type: "url" } } },
      { type: "grid", name: "", schema: this.constructor.toggles.map(([name]) => ({ name, selector: { boolean: {} } })) },
      {
        type: "grid",
        name: "",
        schema: this.constructor.thresholds.map((name) => ({
          name,
          selector: { number: { min: 0, max: 100, step: 1, mode: "box", unit_of_measurement: "%" } },
        })),
      },
      {
        name: "illustration_theme",
        selector: {
          select: {
            mode: "dropdown",
            options: [
              { value: "", label: tr("theme_auto") },
              { value: "day", label: tr("theme_day") },
              { value: "night", label: tr("theme_night") },
            ],
          },
        },
      },
      {
        name: "language",
        selector: {
          select: {
            mode: "dropdown",
            options: [
              { value: "", label: tr("lang_auto") },
              { value: "en", label: "English" },
              { value: "de", label: "Deutsch" },
            ],
          },
        },
      }
    );
    return schema;
  }

  _render() {
    if (!this._hass || !this._config) return;
    const envs = listEnvs(this._hass);
    const env = findEnv(this._hass, this._config).env;
    const nodes = env ? env.nodes.map((n) => ({ value: n.name, label: n.name })) : [];
    const defaults = { ...Object.fromEntries(this.constructor.toggles), ...THRESHOLDS };
    if (!this._form) {
      this._form = document.createElement("ha-form");
      this._form.computeLabel = (s) => {
        const m = /^(cpu|ram|disk)_(warning|critical)$/.exec(s.name);
        const tr = (k) => t(this._hass, this._config, k);
        if (m) return `${tr(m[1] === "ram" ? "memory" : m[1])}: ${tr(`threshold_${m[2]}`)}`;
        return tr(s.name === "nodes" ? "node_filter" : s.name);
      };
      this._form.computeHelper = (s) => STRINGS[lang(this._hass, this._config)][`${s.name}_helper`];
      this._form.addEventListener("value-changed", (ev) => {
        ev.stopPropagation();
        const config = { ...ev.detail.value };
        for (const [k, v] of Object.entries(config)) {
          // Keep the YAML minimal: drop empty values and options left at their default.
          const empty = v === "" || v === undefined || v === null || (Array.isArray(v) && !v.length);
          if (empty || (k in defaults && v === defaults[k])) delete config[k];
        }
        this._config = config;
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true }));
      });
      this.appendChild(this._form);
    }
    const data = { ...this._config };
    for (const [name, def] of Object.entries(defaults)) if (data[name] === undefined) data[name] = def;
    if (!data.environment && envs.length) data.environment = envs[0].value;
    this._form.hass = this._hass;
    const dataKey = JSON.stringify(data);
    if (dataKey !== this._dataKey) {
      this._dataKey = dataKey;
      this._form.data = data;
    }
    const schemaKey = JSON.stringify([envs, nodes, lang(this._hass, this._config)]);
    if (schemaKey !== this._schemaKey) {
      this._schemaKey = schemaKey;
      this._form.schema = this._schema(envs, nodes);
    }
  }
}

class ProxmoxCardEditor extends ProxmoxEditorBase {
  static get toggles() {
    return [
      ["show_nodes", true],
      ["show_history", true],
      ["show_counts", true],
      ["show_guests", true],
      ["show_storage", true],
      ["show_controls", true],
      ["show_stop", false],
      ["only_problems", false],
      ["group_by_node", true],
      ["expand_guests", true],
      ["expand_storage", false],
      ["illustration", true],
    ];
  }
}

class ProxmoxMiniCardEditor extends ProxmoxEditorBase {
  static get toggles() {
    return [
      ["show_history", true],
      ["show_footer", true],
      ["zoom", true],
      ["illustration", true],
    ];
  }

  static get thresholds() {
    return ["cpu_warning", "cpu_critical", "ram_warning", "ram_critical"];
  }
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

const define = (name, cls) => {
  if (!customElements.get(name)) customElements.define(name, cls);
};
define("proxmox-card", ProxmoxCard);
define("proxmox-mini-card", ProxmoxMiniCard);
define("proxmox-card-editor", ProxmoxCardEditor);
define("proxmox-mini-card-editor", ProxmoxMiniCardEditor);

window.customCards = window.customCards || [];
for (const card of [
  {
    type: "proxmox-card",
    name: "Proxmox Card",
    description: "Proxmox VE at a glance: nodes, VMs, LXC containers, storage, ZFS pools and disks, with start / shutdown / reboot.",
  },
  {
    type: "proxmox-mini-card",
    name: "Proxmox Mini Card",
    description: "Compact Proxmox VE overview: CPU and memory of each node, guests and updates.",
  },
]) {
  if (!window.customCards.some((c) => c.type === card.type))
    window.customCards.push({ ...card, preview: true, documentationURL: "https://github.com/hoentaex/ha-proxmox-card" });
}

console.info(
  `%c PROXMOX-CARD %c v${VERSION} `,
  "color: white; background: #e57000; font-weight: 700;",
  "color: #e57000; background: white; font-weight: 700;"
);
