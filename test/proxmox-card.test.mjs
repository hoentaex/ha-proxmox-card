import assert from "node:assert/strict";
import { test } from "node:test";
import { hass } from "../preview/mock.js";
import { load } from "./load.mjs";

// Objects built in the card's vm context have other prototypes: compared as plain JSON.
const same = (a, b, msg) => assert.deepEqual(JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b)), msg);

const { resolve, findEnv, deviceKind, shortName, fmtSince, bytesOf, STRINGS, isNight, rackScene } = load([
  "resolve",
  "findEnv",
  "deviceKind",
  "shortName",
  "fmtSince",
  "bytesOf",
  "STRINGS",
  "isNight",
  "rackScene",
]);

test("one environment per config entry, with its nodes, guests, pools and disks", () => {
  const { envs } = resolve(hass);
  assert.equal(envs.length, 1);
  const env = envs[0];
  same(
    env.nodes.map((n) => n.name),
    ["athene", "hephaistos"]
  );
  assert.equal(env.guests.length, 8);
  assert.equal(env.guests.filter((g) => g.type === "qemu").length, 2);
  assert.equal(env.zfs.length, 3);
  assert.equal(env.disks.length, 4);
  assert.ok(env.cluster);
});

test("entities are keyed by translation key, prefixed with their domain unless sensors", () => {
  const env = resolve(hass).envs[0];
  const docker = env.guests.find((g) => g.name === "docker");
  assert.equal(docker.vmid, 105);
  assert.equal(docker.entities.status_raw, "sensor.lxc_docker_105_status_raw");
  assert.equal(docker.entities["binary_sensor.status"], "binary_sensor.lxc_docker_105_status");
  assert.equal(docker.entities["button.reboot"], "button.lxc_docker_105_reboot");
});

test("both integration domains are read: proxmoxve_custom (current) and proxmoxve (older releases)", () => {
  const as = (platform) => ({
    ...hass,
    entities: Object.fromEntries(Object.entries(hass.entities).map(([k, e]) => [k, { ...e, platform }])),
    devices: Object.fromEntries(
      Object.entries(hass.devices).map(([k, d]) => [k, { ...d, identifiers: d.identifiers.map(([, i]) => [platform, i]) }])
    ),
  });
  for (const platform of ["proxmoxve_custom", "proxmoxve"]) {
    const env = resolve(as(platform)).envs[0];
    assert.ok(env, platform);
    assert.equal(env.nodes.length, 2, platform);
    assert.equal(env.guests.length, 8, platform);
  }
  assert.equal(resolve(as("other")).envs.length, 0);
});

test("device kinds from identifiers, else from model and name", () => {
  same(deviceKind({ identifiers: [["proxmoxve_custom", "01ABC_NODE_pve"]] }), { kind: "node", ref: "pve" });
  same(deviceKind({ identifiers: [["proxmoxve", "01ABC_QEMU_108"]] }), { kind: "qemu", ref: "108" });
  same(deviceKind({ identifiers: [["proxmoxve", "01ABC_cluster"]] }), { kind: "cluster", ref: "" });
  same(deviceKind({ name: "LXC docker (105)", model: "LXC" }), { kind: "lxc", ref: "105" });
  same(deviceKind({ name: "Node athene", model: "Intel(R) N100" }), { kind: "node", ref: "athene" });
  assert.equal(deviceKind({ name: "Disk athene: CT1000", model: "NVME CT1000" }).kind, "disk");
  assert.equal(deviceKind({ name: "Something else", model: "Thing" }), null);
});

test("short names drop the integration's prefixes", () => {
  assert.equal(shortName({ name: "QEMU homeassistant (177)" }, "qemu"), "homeassistant");
  assert.equal(shortName({ name: "ZFS athene: ZFS Pool SSD1" }, "zfs"), "SSD1");
  assert.equal(shortName({ name: "Disk athene: KINGSTON SA400" }, "disk"), "KINGSTON SA400");
  assert.equal(shortName({ name: "LXC docker (105)", name_by_user: "Docker host" }, "lxc"), "Docker host");
});

test("environment lookup by id, unknown environment reported", () => {
  assert.ok(findEnv(hass, {}).env);
  assert.ok(findEnv(hass, { environment: "01MOCKENTRY" }).env);
  assert.equal(findEnv(hass, { environment: "nope" }).error, "unknown_env");
  assert.equal(findEnv({ ...hass, entities: {}, devices: {} }, {}).error, "no_env");
});

test("sizes in bytes whatever their unit, durations in the largest unit", () => {
  assert.equal(bytesOf({ state: "2", attributes: { unit_of_measurement: "GB" } }), 2e9);
  assert.equal(bytesOf({ state: "unavailable", attributes: {} }), null);
  const twoDays = { state: new Date(Date.now() - 2.5 * 864e5).toISOString() };
  assert.match(fmtSince(twoDays, "en"), /^2\s?d/);
  assert.equal(fmtSince({ state: "unknown" }, "en"), null);
});

test("every language has every English key", () => {
  for (const [code, dict] of Object.entries(STRINGS)) {
    const missing = Object.keys(STRINGS.en).filter((k) => !(k in dict));
    same(missing, [], `${code} misses ${missing.join(", ")}`);
  }
});

test("node updates: no package count, the new Proxmox VE version when there is one", () => {
  const { ProxmoxCard } = load(["ProxmoxCard"]);
  const card = new ProxmoxCard();
  card._hass = hass;
  const env = resolve(hass).envs[0];
  const [athene, heph] = env.nodes.map((n) => JSON.parse(JSON.stringify(card._nodeUpdates(n))));
  assert.equal(athene.pending, true);
  assert.equal(athene.pve, "9.2.26");
  assert.equal(athene.packages, 269);
  assert.equal(heph.pending, true);
  assert.equal(heph.pve, null);
  assert.equal(card._updTitle(athene), "Proxmox VE 9.2.26 · 269 Pakete");
});

test("night picture follows the dark theme unless forced", () => {
  assert.equal(isNight({ themes: { darkMode: true } }, {}), true);
  assert.equal(isNight({ themes: { darkMode: false } }, {}), false);
  assert.equal(isNight({ themes: { darkMode: true } }, { illustration_theme: "day" }), false);
  assert.equal(isNight({}, { illustration_theme: "night" }), true);
});

test("the rack draws one server per node, up to three, the last one counting the others", () => {
  const slot = (name) => ({ name, cls: "ok", cpu: 20, mem: 50, cpuCls: "ok" });
  const two = rackScene([slot("athene"), slot("hephaistos")], 0);
  assert.equal((two.match(/class="px-srv /g) || []).length, 2);
  assert.match(two, />athene</);
  const five = rackScene([slot("a"), slot("b"), slot("c")], 2);
  assert.equal((five.match(/class="px-srv /g) || []).length, 3);
  assert.match(five, />c \+2</);
  assert.match(rackScene([{ name: "<x>", cls: "crit", cpu: null, mem: null, cpuCls: "ok" }], 0), /&lt;x&gt;/);
});

test("illustration labels exist in every language", () => {
  for (const lang of Object.keys(STRINGS)) for (const k of ["illustration", "illustration_theme", "theme_auto", "theme_day", "theme_night"]) assert.ok(STRINGS[lang][k], `${lang}.${k}`);
});

test("KPI tiles: rows are always full, tiles without a value are left out", () => {
  const { fillRows, kpiGrid } = load(["fillRows", "kpiGrid"]);
  assert.deepEqual([...fillRows([1, 1, 1, 1], 2)], [1, 1, 1, 1]);
  assert.deepEqual([...fillRows([1, 1, 1], 2)], [1, 1, 2]);
  assert.deepEqual([...fillRows([1, 2, 1], 2)], [2, 2, 2]);
  const html = kpiGrid([
    { key: "a", k: "VMs", v: "2", icon: "M0,0", c: "red" },
    { key: "b", k: "LXC", v: null, icon: "M0,0", c: "red" },
    { key: "c", k: "Speicher", v: "7", icon: "M0,0", c: "red", entity: "sensor.x" },
    { key: "d", k: "Updates", v: "1", icon: "M0,0", c: "red" },
  ]);
  assert.equal((html.match(/class="kpi[ "]/g) || []).length, 3);
  assert.match(html, /data-key="d"[^>]*grid-column:span 2/);
  assert.match(html, /data-entity="sensor.x"/);
  assert.equal(kpiGrid([null, false]), "");
});
