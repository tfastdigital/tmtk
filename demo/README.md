# Demo shell — interactive mock-up

An **interactive UI mock-up** of TMTK v2.0. It is a shell: the interface, the states and the feel of the
tool, with **no real engine behind it**.

Open [`index.html`](index.html) in any browser. No build step, no server, no dependencies, no network.

```
demo/
├─ index.html          the whole shell
├─ app.css             palette sampled from the real Avalonia build
├─ app.js              rendering + a scripted state machine
└─ fixtures/
   └─ data.js          hand-written fixture data
```

## What it is not

This folder contains **no product code**. It cannot read, write or unlock anything. Specifically it has
none of the following, and must never gain them:

| Not present | Why it matters |
|---|---|
| `navigator.serial` / `navigator.usb` / WebSerial | No device can be reached from a browser page |
| META or FDL frame handling | The protocol is the product; it is not published |
| Command bytes, checksums, exec addresses | These are the parts that are actually hard |
| Keys, signatures, certificates | Never published, in any form |
| `fetch` / `XHR` / `WebSocket` | The demo works offline and asks nothing of a server |
| File writing | Nothing leaves the page |

The only four requests the page makes are for its own four files. That is verifiable in DevTools.

## What you can click

**MTK workspace**

* **Connect** — plays the scripted session sequence in the log (port open → wait → handshake → session up).
* **Read GPT** — switches to the partition table and logs the parse.
* **Read model from device** — resolves a token and names the engine that serves it.
* **Bootloader** — `Find slots` → `Check phone` → `Read & analyse`. The read shows a progress bar that
  reports the **real** hardware estimate (≈26 min for a 2 MB slot, ~1.25 KB/s) while advancing at ~174×
  so the demo does not make you wait half an hour. It ends in the honest verdict: **the ARM64 recipe
  does not apply to this 32-bit bootloader, so the patch is refused.**
* **Models** — click any token to see **every** engine that claims it. `KM6` shows three claimants and
  the tool refuses to choose.
* **Support** — 14 verified operations and 6 explicitly unsupported ones.

**SPD workspace** — this engine is **in active development**

* A permanent **NO TRANSPORT** badge plus an **IN DEVELOPMENT** badge — both true at the same time.
* **Verdicts** — first lists what works today (offline), then what does not, each with the reason.
* **Catalogue** — all 16 Unisoc methods with status tags; `Details` reveals the blocker and the exact
  artifact that would unblock it.
* **Transport** — the 18 recovered key names, every value shown as `value not recovered`.
* **Partitions** — load the sample PAC to see the container shape; `Flash` is inert.
* **FDL kit** — `Inspect` reports a pair by name and size only, and says so.

Anything that would write to a device is marked with 🔒 and does nothing except say so.

## How the fixture data was derived

Nothing was invented to make the demo look better than the product:

| Data | Source |
|---|---|
| 53 model tokens, marketing names, keying | The supported-model matrix already published in the main README |
| Method ids, names, statuses, blockers, "evidence needed" | The method catalogue already published |
| The 18 transport key names | The recovered vocabulary already published |
| Throughput, read time, 616 candidate matches, 4 survivors | Measurements already published in the bootloader notes |
| Partition rows, log lines, hashes | **Synthetic**, and labelled as such in the UI |

## Deploying

The demo needs no build. On GitHub Pages:

1. Settings → Pages → *Deploy from a branch*.
2. Branch `main`, folder `/ (root)`.
3. The demo is then at `https://<user>.github.io/<repo>/demo/`.

## Rules for changing the demo

1. **Never add a device API.** No WebSerial, WebUSB, no native messaging, no localhost helper.
2. **Never add a network call.** The offline claim is part of the point.
3. **Keep the refusals visible.** `NO TRANSPORT`, `NotImplemented`, `value not recovered`, `BLOCKED`
   and the ambiguity refusal are why the demo is credible. Do not replace them with success theatre.
4. **Do not imply capability.** If a real feature is `Placeholder`, the demo must not show it completing
   successfully.
5. **Keep the DEMO marks.** Title-bar chip, build-info line and the footer bar stay.
6. **Keep fixtures honest.** If you add a row, make sure the real catalogue has it too.
