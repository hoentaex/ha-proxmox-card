# Changelog

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
