import assert from "node:assert/strict";
import { test } from "node:test";
import { hass } from "../preview/mock.js";
import { load } from "./load.mjs";

// Objects built in the card's vm context have other prototypes: compared as plain JSON.
const same = (a, b, msg) => assert.deepEqual(JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b)), msg);

const { resolve, findEnv, deviceKind, shortName, fmtSince, bytesOf, STRINGS } = load([
  "resolve",
  "findEnv",
  "deviceKind",
  "shortName",
  "fmtSince",
  "bytesOf",
  "STRINGS",
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

test("device kinds from identifiers, else from model and name", () => {
  same(deviceKind({ identifiers: [["proxmoxve", "01ABC_NODE_pve"]] }), { kind: "node", ref: "pve" });
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
