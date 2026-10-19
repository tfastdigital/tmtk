# Screenshots

Captured from a clean start of **TMTK v2.0** (Windows, 125% DPI, window pinned to 1200×740 DIP) with
**no phone connected**. These are the genuine empty / read-only states — no mock-ups, no retouching.

| File | View | What it shows |
|---|---|---|
| `01-main-window.png` | MTK workspace | Connection, model picker, backup-before-write, shared log |
| `02-mtk-workspace.png` | MTK → Partitions | Partition table panel with tick / export / restore / erase actions |
| `03-lk-methods.png` | MTK → Bootloader (LK) | Find slots, check phone, read & analyse, scan methods, vbmeta |
| `04-supported-models.png` | MTK → Models | The 18-token MTK list and the shared-engine warning |
| `05-spd-workspace.png` | SPD workspace | The permanent `NO TRANSPORT` banner and what it covers |
| `06-spd-partitions.png` | SPD → Partitions | `PLAN ONLY — NO TRANSPORT`, PAC inspect / plan / extract |
| `07-method-catalogue.png` | SPD → Catalogue | 16 of 16 Unisoc methods with status tags and evidence |
| `08-proven-support.png` | MTK → Support | 14 verified operations + the measured X6532 profile |
| `09-spd-models.png` | SPD → Models | AUTO BL / FDL lists with patch-month keying per row |
| `10-spd-transport.png` | SPD → Transport | 18 recovered key names, zero values, and what is missing |
| `11-spd-verdicts.png` | SPD → Verdicts | Available / NotReady / NotImplemented with reasons |

All images are 1502×964 PNG.

## Re-capturing

The helper scripts used for these are kept in the private development workspace (`.tools/`), **not** in
this repository:

* `grab.ps1` — pins the window to a fixed screen position (40,40 at 1502×964), activates it, optionally
  clicks a window-relative coordinate, then captures. Coordinates are measured directly on a capture.
* `capture-window.ps1` — captures a visible window by title substring, anywhere on screen.

The window **must be pinned first**. Without pinning, window-relative click coordinates drift and clicks
land on whatever is underneath.

Note: if the capture host reaps child processes when a shell command ends, launch the app, click through
the tabs and capture **inside one command**.

## Rules for any new capture

1. **PNG, 1502×964** if you use the same pinning, so the gallery stays consistent.
2. **Redact before committing.** No IMEI, serial number, phone number, IP or MAC address, account name,
   customer name, or file paths containing a real name.
3. **No key material on screen.** Never capture a view showing a `vendor.pem` / `signing.pem` path, key
   contents, or a private key filename.
4. **Show the refusals.** `NO TRANSPORT`, `NotImplemented`, `value not recovered` and `BLOCKED` are the
   honest part of the product — keep them in the set.
5. **No competitor logos or trademarks** in frame (desktop, taskbar, background).
6. Keep the window at its default size so typography and spacing match across the set.

If you add images, also add a row here and a `<td>` in the README gallery.
