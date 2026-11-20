# Changelog

## 0.3.0 (2026-11-20)

- **KPI tiles** (as in the energy, oil, heating and Tibber cards) right under the header: VMs and LXC containers
  running with a bar and how many are stopped (amber), storages fine (red with the number of problems), nodes with
  updates with the new Proxmox VE version (amber). A tile without data is left out and the rows close up; the VM and
  LXC tiles open the cluster sensors.
- **Compact nodes:** name line with the badges, three small rings (CPU, RAM, disk) with only their name under them,
  and one detail line with the guests, cores, memory used / total, load, IO delay and uptime. The rings' last 24 hours
  stay in their tooltip.

## 0.2.0 (2026-11-18)

- **Illustrated header** on the full and mini cards, in the style of juju35's cards: 90 px banner with the title and the status pill on a technical room wall, the nodes drawn in a small rack at the right (state LED, activity LED, CPU and memory bars per node, up to three nodes) and a 10 px ground strip in the state colour: green all online, amber when a node has pending updates or failed tasks, red when a node is offline.
- Round logo on frosted glass with the Proxmox logo at its bottom right; the status pill follows the title when it fits, else goes under the subtitle (its dot alone when there is no room left).
- Night picture with Home Assistant's dark theme; `illustration_theme: day | night` forces one, `illustration: false` keeps the classic header. Both options in the visual editor.
- Mini card: frosted round detail button in the banner's top right corner. Below 280 px the rack is left out.

## 0.1.4 (2026-11-11)

- Updates no longer show the number of packages (hundreds of Debian packages): a node badge "Updates", or "PVE 9.2.26" when a new Proxmox VE version is pending, with the package count in its tooltip. The counter shows the nodes with updates, the mini card the new Proxmox VE version.

## 0.1.3 (2026-11-11)

- VMs, containers, storages and disks separated by a hairline, with more room per row, larger names and buttons (as in the Docker card).

## 0.1.2 (2026-11-11)

- Spacing matching the native Home Assistant cards: 16 px card padding, more room between sections, larger section titles, roomier node panels, counters and VM / container rows.

## 0.1.1 (2026-11-11)

- More room: one node per row with larger rings, the same spacing between sections as the Internet Box card, taller VM and container rows.

## 0.1.0 (2026-11-11)

First version.

- **Proxmox Card**: cluster header (Proxmox VE version, nodes online), one panel per node with CPU, RAM and disk rings (24 h history behind CPU and RAM), running VMs and containers, load, IO delay, uptime, pending package updates, running backup and failed tasks.
- Counters: VMs and LXC containers running, storages, package updates.
- VMs and LXC containers list, grouped by node: state, CPU, RAM, IP address, uptime, locked and health flags, search and sort (name, ID, CPU, RAM), each guest's CPU over 24 h behind its row.
- Start, shutdown and reboot buttons (with confirmation), optional hard stop, from the integration's button entities.
- Storage, ZFS pools and disks: usage, pool health, SMART status, temperature and wearout.
- **Proxmox Mini Card**: CPU and RAM of each node with their 24 h curves, guests running, problems and updates; detail button switching to the full card.
- `nodes` option to show only some nodes, thresholds for CPU, RAM and disk, "only items needing attention" mode.
- Visual editor, light and dark mode, English and German.
- Entities found through the registries (translation keys, device identifiers and hierarchy): any language, any entity ids.
