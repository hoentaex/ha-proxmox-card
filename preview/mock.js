// Mock Home Assistant for the preview page: registries and states shaped like the Proxmox VE integration
// (dougiteixeira/proxmoxve) creates them, modelled on a two-node cluster.
const ENTRY = "01MOCKENTRY";
const devices = {};
const entities = {};
const states = {};

const device = (id, name, model, kind, ref, via = null) => {
  devices[id] = {
    id,
    name,
    name_by_user: null,
    model,
    via_device_id: via,
    config_entries: [ENTRY],
    configuration_url: `https://192.168.1.150:8006/#v1:0:=${kind.toLowerCase()}/${ref}`,
    identifiers: [["proxmoxve", kind === "cluster" ? `${ENTRY}_cluster` : `${ENTRY}_${kind}_${ref}`]],
  };
};

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
const add = (dev, domain, key, state, attrs = {}) => {
  const id = `${domain}.${slug(devices[dev].name)}_${key}`;
  entities[id] = { entity_id: id, device_id: dev, platform: "proxmoxve", translation_key: key };
  states[id] = { entity_id: id, state: String(state), attributes: { friendly_name: `${devices[dev].name} ${key}`, ...attrs } };
};
const GB = { unit_of_measurement: "GB" };
const PCT = { unit_of_measurement: "%" };
const ago = (h) => new Date(Date.now() - h * 36e5).toISOString();

device("cluster", "Proxmox Cluster", "Cluster", "cluster", "");
add("cluster", "sensor", "cluster_nodes_online", 2);
add("cluster", "sensor", "cluster_qemu_running", 2);
add("cluster", "sensor", "cluster_lxc_running", 5);

const node = (name, o) => {
  const id = `node_${name}`;
  device(id, `Node ${name}`, o.cpuModel, "NODE", name);
  add(id, "sensor", "node_status", o.status ?? "online");
  add(id, "binary_sensor", "status", o.status === "offline" ? "off" : "on");
  add(id, "sensor", "cpu_used", o.cpu, PCT);
  add(id, "sensor", "memory_used_perc", o.mem, PCT);
  add(id, "sensor", "memory_used", o.used, GB);
  add(id, "sensor", "memory_free", o.free, GB);
  add(id, "sensor", "disk_used_perc", o.disk, PCT);
  add(id, "sensor", "qemu_on", o.vms);
  add(id, "sensor", "lxc_on", o.lxcs);
  add(id, "sensor", "io_wait", o.io, PCT);
  add(id, "sensor", "load_1m", o.load);
  add(id, "sensor", "version", o.version);
  add(id, "sensor", "uptime", ago(o.up), { device_class: "timestamp" });
  add(id, "sensor", "failed_tasks_count", o.failed ?? 0);
  add(id, "sensor", "updates_total", o.updates);
  add(id, "binary_sensor", "update_avail", o.updates ? "on" : "off");
  add(id, "binary_sensor", "backup_running", o.backup ? "on" : "off");
  add(id, "update", "node_update", o.updates ? "on" : "off", { installed_version: o.version });
  return id;
};

const guest = (type, vmid, name, nodeId, o) => {
  const id = `${type}_${vmid}`;
  device(id, `${type.toUpperCase()} ${name} (${vmid})`, type.toUpperCase(), type.toUpperCase(), vmid, nodeId);
  const running = (o.status ?? "running") === "running";
  add(id, "sensor", "status_raw", o.status ?? "running");
  add(id, "binary_sensor", "status", running ? "on" : "off");
  add(id, "sensor", "node", nodeId.replace("node_", ""));
  add(id, "sensor", "cpu_used", running ? o.cpu : 0, PCT);
  add(id, "sensor", "memory_used_perc", running ? o.mem : 0, PCT);
  add(id, "sensor", "disk_used_perc", o.disk, PCT);
  add(id, "sensor", "ip_address", running ? o.ip : "unknown");
  add(id, "sensor", "uptime", running ? ago(o.up) : "unknown", { device_class: "timestamp" });
  add(id, "binary_sensor", "locked", o.locked ? "on" : "off");
  if (type === "qemu") add(id, "binary_sensor", "health", "off");
  if (o.buttons !== false) for (const b of ["start", "shutdown", "stop", "reboot"]) add(id, "button", b, "unknown");
};

const zfs = (nodeName, pool, o) => {
  const id = `zfs_${nodeName}_${pool}`;
  device(id, `ZFS ${nodeName}: ZFS Pool ${pool}`, "ZFS", "ZFS", `${nodeName}_ZFS Pool ${pool}`, `node_${nodeName}`);
  add(id, "sensor", "zfs_health", o.health ?? "ONLINE");
  add(id, "sensor", "zfs_used_perc", o.pct, PCT);
  add(id, "sensor", "zfs_used", o.used, GB);
  add(id, "sensor", "zfs_total", o.total, GB);
};

const disk = (nodeName, model, o) => {
  const id = `disk_${nodeName}_${slug(model)}`;
  device(id, `Disk ${nodeName}: ${model}`, `SSD ${model}`, "DISK", `${nodeName}_${slug(model)}`, `node_${nodeName}`);
  add(id, "binary_sensor", "health", o.bad ? "on" : "off");
  add(id, "sensor", "node", nodeName);
  add(id, "sensor", "disk_size", o.size, GB);
  add(id, "sensor", "temperature", o.temp, { unit_of_measurement: "°C" });
  add(id, "sensor", "disk_wearout", o.wear, PCT);
};

const athene = node("athene", {
  cpuModel: "Intel(R) N100",
  cpu: 13.6,
  mem: 58.6,
  used: 14.66,
  free: 9.82,
  disk: 18.4,
  vms: 2,
  lxcs: 1,
  io: 0.15,
  load: 0.68,
  version: "9.1.11",
  up: 4300,
  updates: 269,
});
const heph = node("hephaistos", {
  cpuModel: "Intel(R) Core(TM) i5-8500T",
  cpu: 0.95,
  mem: 28.1,
  used: 9.38,
  free: 6.28,
  disk: 0.95,
  vms: 0,
  lxcs: 4,
  io: 0.13,
  load: 0.25,
  version: "9.1.11",
  up: 4300,
  updates: 246,
  backup: true,
});

guest("qemu", 177, "homeassistant", athene, { cpu: 20.8, mem: 92.1, disk: 49.5, ip: "192.168.1.177", up: 2690, buttons: false });
guest("qemu", 103, "raspberrymatic", athene, { cpu: 1.4, mem: 32.2, disk: 11.7, ip: "192.168.1.252", up: 50 });
guest("lxc", 106, "adguard", athene, { cpu: 7.7, mem: 56.9, disk: 29.2, ip: "192.168.1.152", up: 4300, buttons: false });
guest("lxc", 105, "docker", heph, { cpu: 1.96, mem: 50.3, disk: 82.3, ip: "192.168.1.244", up: 4300 });
guest("lxc", 109, "alpine-adguard", heph, { cpu: 0.58, mem: 52.3, disk: 43.9, ip: "192.168.1.109", up: 950 });
guest("lxc", 240, "uptimekuma", heph, { cpu: 1.14, mem: 21.2, disk: 56.6, ip: "192.168.1.240", up: 4290 });
guest("lxc", 110, "wireguard-zirndorf", heph, { cpu: 0.002, mem: 2.6, disk: 3.0, ip: "192.168.1.72", up: 5 });
guest("lxc", 120, "testbox", heph, { status: "stopped", cpu: 0, mem: 0, disk: 12, locked: true });

zfs("athene", "SSD1", { pct: 5.7, used: 56.6, total: 996.4 });
zfs("hephaistos", "rpool", { pct: 1.0, used: 4.98, total: 506.8 });
zfs("hephaistos", "SSD1", { pct: 8.2, used: 41.8, total: 511.1 });
disk("athene", "CT1000P3PSSD8", { size: 1000.2, temp: 43, wear: 22 });
disk("athene", "KINGSTON SA400S37240G", { size: 240.1, temp: 30, wear: 14 });
disk("hephaistos", "FANXIANG S501Q 512GB", { size: 512.1, temp: 43, wear: 9 });
disk("hephaistos", "KXG60ZNV512G KIOXIA", { size: 512.1, temp: 37, wear: 13 });

// 24 h statistics: a gentle wave per sensor.
const history = (ids) => {
  const out = {};
  const now = Date.now();
  for (const id of ids) {
    const base = Number(states[id]?.state) || 5;
    out[id] = Array.from({ length: 288 }, (_, i) => ({
      start: now - 864e5 + i * 3e5,
      mean: Math.max(0, base * (0.7 + 0.3 * Math.sin(i / 18 + id.length)) + (i % 50 === 0 ? base * 0.8 : 0)),
    }));
  }
  return out;
};

export const hass = {
  language: "de",
  locale: { language: "de" },
  states,
  entities,
  devices,
  callService: (domain, service, data) => {
    console.log("callService", domain, service, data);
    return Promise.resolve();
  },
  callWS: (msg) => Promise.resolve(msg.type === "recorder/statistics_during_period" ? history(msg.statistic_ids) : null),
};
