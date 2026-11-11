# Changelog

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
