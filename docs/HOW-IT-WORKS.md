# How TMTK works

This page explains the architecture and the decision logic of **TMTK v2.0** without publishing source
code. It is written for technicians who want to understand *why* the tool behaves the way it does, and
for anyone evaluating whether the tool is trustworthy with their phone.

---

## 1 · One shell, two engines

```
┌──────────────────────────────────────────────────────────────┐
│                     TMTK desktop shell                       │
│  Windows · .NET 10 · Avalonia (Fluent theme) · Inter UI font  │
│                                                              │
│   event log  ·  device picker  ·  backup manifests  ·  CLI   │
└───────────────┬──────────────────────────┬───────────────────┘
                │                          │
     ┌──────────▼──────────┐    ┌──────────▼──────────┐
     │    META engine      │    │     SPD engine      │
     │    (MediaTek)       │    │     (Unisoc)        │
     │                     │    │                     │
     │ transport · GPT     │    │ detection · PAC     │
     │ partition I/O       │    │ FDL kit · partition │
     │ LK analysis         │    │ planning            │
     │ patch + verify      │    │ (no transport yet)  │
     └─────────────────────┘    └─────────────────────┘
```

The two engines are **deliberately isolated**. They do not share types, they do not call each other, and
adding work to one cannot change the behaviour of the other. That isolation is a safety property: an SPD
change can never silently alter a META write path.

A third, **read-only** layer sits above both: the *method catalogue*. It is pure data — every known
method, its status, its evidence and, if blocked, the artifact that would unblock it. It performs no
device work and has no write path at all. Its only job is to let the tool state what is proven and what
is not.

---

## 2 · The META lane

### 2.1 Why META at all

META mode is a service/diagnostic environment that runs **instead of** the normal boot chain. Because
the boot chain never starts, the bootloader's own lock check never executes. That single fact is what
makes bootloader read-and-write possible on a locked, non-rooted handset.

### 2.2 Transport characteristics

The channel is simple and slow:

| Property | Value |
|---|---|
| Cost per shell command | ~280 ms flat |
| Payload per reply frame | ~500 bytes |
| Effective throughput | ~1.3 KB/s |
| Full read of a 2 MB bootloader slot | ~26 minutes |

Everything in the design flows from that. Long operations are chunked, resumable in the sense that the
image is written to disk and re-analysed offline, and the UI states the estimate **before** starting.
Re-reading a phone for every experiment is not affordable, so analysis is fully repeatable on the saved
image.

### 2.3 Partition work

1. Read the GPT and enumerate slots (`lk`, `lk_a`, `lk_b`, `seccfg`, …).
2. Read partitions through the same primitive that was verified byte-exact.
3. Write through the same primitive, then read back and compare.

The tool does not use a `dd | base64` shell pipeline for bulk data: on this transport it cannot work at a
usable speed, and it gives no per-chunk verification.

### 2.4 Bootloader analysis pipeline

```
read slot bytes
      │
      ├─▶ size / truncation guard ──── truncated? ──▶ REFUSE (never patchable)
      │
      ├─▶ architecture detection ──── ARM32 / AArch64 / Thumb
      │
      ├─▶ identity fingerprint ────── marker match, confidence %
      │
      ├─▶ lock-store discovery ────── count of known lock stores
      │
      └─▶ method evaluation ───────── one report per method
```

**Truncation guard.** A partial read is never patchable. Writing a truncated image destroys the
bootloader, so this is a hard stop, not a warning.

**Identity.** The tool carries name-based fingerprints (family, SoC, revision) plus a generic
architecture fingerprint. When a specific profile's marker list was never recovered, the tool says so and
reports a low confidence instead of claiming a match it cannot support.

**Method evaluation.** Each method is reported as exactly one of:

| State | Meaning |
|---|---|
| `USABLE` | Applicable, all prerequisites present, sites verified in *this* image |
| `ALREADY DONE` | Applicable, but the image already reads as unlocked |
| `BLOCKED` | Applicable, but a prerequisite outside this build is missing |
| `NOT FOR THIS PHONE` | The method's signature is not present in this image |

The first `USABLE` method is preselected. Nothing is written until the write action is confirmed
**twice**.

### 2.5 The three unlock methods

| Method | Targets | Status in the build |
|---|---|---|
| **Key patch** — splice a same-length RSA reference modulus and sign with your own key | Devices trusting the reference key | Modulus locate + splice implemented and byte-exact; **waits on certificate-chain re-encoding** |
| **Lock-state patch — ARM64** | AArch64 lock stores | Implemented: rewrites only the immediate bits, verifies the span, reads back the unlock constant |
| **Lock-state patch — ARM32 / Thumb** | 32-bit bootloaders | Implemented with an evidence-ranked candidate scan; **not hardware-validated** |

The key patch deliberately does **not** write. A spliced image also has to satisfy the bootloader's
certificate chain; correct DER re-encoding depends on the exact container in the target build, and no
sample was available to verify against. Rather than produce an image that fails verification *after*
flashing, the method reports `BLOCKED` and writes nothing. The moment a validated certificate patcher is
supplied, the same method flips to `USABLE` with no other change.

The ARM32 method is a different problem, and it is handled differently. An encoding match alone is
worthless as evidence — on the reference image the instruction shape matched **616** places, most of them
ordinary initialisation. So candidates are gated and ranked: the scanner resolves the Thumb
`ldr Rd,=delta ; add Rd,pc` idiom against the image, keeps only sites that resolve to real unlock marker
strings (`flashing unlock`, `Start unlock flow`, `SEC_UNLOCK`, `seccfg`, `oem unlock`, …), requires them
within `0x2000` of an anchor, then scores dedicated setters above stores buried in larger routines.

Critically, those candidates are **alternatives, not a set**. Applying all of them would corrupt
unrelated code, so the apply path writes exactly the one site the operator selects — there is no batch
apply on ARM32 — and the method is stated as **not hardware-validated**. The scan narrows the search;
the final choice still needs a device test.

### 2.6 Key material

Key material is **not** in this repository and is never bundled into the public documentation.

| File | Purpose |
|---|---|
| `vendor.pem` | The device vendor's public key (the reference modulus that gets spliced) |
| `signing.pem` | Your RSA private key, **same modulus length** as the vendor key |

The build looks for these next to the executable and in a per-user key directory. Until `vendor.pem`
exists, the method reports `NOT FOR THIS PHONE` together with the exact path to drop it at.

---

## 3 · The SPD lane, honestly

Unisoc work is a solved half and an unsolved half, and TMTK refuses to blur them. The engine is in
**active development**: the offline, file-side half is finished and tested; the device transport is the
part still being built.

### ✅ Solved: the container

A `.pac` file is a container. TMTK can **inspect, plan and extract** `BP_R1` and `BP_R2` archives:

* magic identification,
* header size validation,
* entry-table traversal,
* per-entry name, internal file name, data offset and data size,
* byte-exact payload extraction, cross-checked against an independent implementation.

Field offsets beyond name / file / offset / size are an **inferred layout**, not a vendor specification,
and the tool says so in the entry's blocker text. The container is confirmed; the *meaning* of every byte
is not.

### ✅ Solved: kit identification

Given a folder of candidate files, the tool identifies whether an **FDL1 / FDL2 pair** is present, and
prints each file's size and SHA-256 so two kits can be told apart. This is **name-based identification
only**: nothing is parsed, no chip-id is checked, nothing is executed. It confirms a kit exists — it does
not supply the bytes a handshake needs.

### ❌ Still being built: the transport

There is **no Unisoc BROM/FDL transport** in the build yet. No write path, no read path, no handshake.
This is the active work item, not a descoped feature.

| Blocked step | What it would take |
|---|---|
| BROM → FDL1 → FDL2 bring-up | Per-SoC exec addresses and the baud-switch sequence, from a vendor-supplied kit |
| FDL download of a PAC | One captured session: bytes from BROM entry to first successful read, with SoC + BootROM version named |
| Partition map read | A real `partition.xml` / `partition_~` dump plus a working FDL session |
| Partition read / write | The read command template, including framing and checksum |

These are recorded as `Placeholder` / `Reconstructed` with an explicit "evidence needed" string each. The
purpose is that a blocked feature reads like a **plan**, not like an excuse.

### 🚫 Excluded by policy

BootROM `exec_addr` stubs and CVE-2022-38694 class techniques are recorded for completeness and marked
`Excluded`. They stay excluded even when every prerequisite is supplied.

### About the SPD model lists

The four lists in the matrix are **recovered data** — model tokens, marketing names, which engine serves
them, what each recipe is keyed to, and the file offset in the source binary where each token was found,
so anyone can re-check them. They are a coverage map, not a claim that a transport exists.

---

## 4 · Model resolution rules

| Rule | Behaviour |
|---|---|
| **No silent narrowing** | A token lookup returns *every* match from *every* list |
| **Ambiguity is an error** | More than one engine claiming a token is a hard refusal with exit code 1 |
| **Operator decides** | There is an explicit "resolve within this engine" path for when the operator has already chosen |
| **Unknown is an answer** | A token in no list resolves to "unknown" — no nearest-match guessing |
| **Narrower key wins** | Model + patch month beats model; SoC + storage beats SoC; SoC + DRAM type beats SoC |
| **Storage is identity** | eMMC (`512`-byte logical sectors) and UFS (`4096`) are different devices with different layouts |

The 11 overlapping tokens are the reason this rule exists. A tool that quietly picks the first engine in
the list will, on some phone, pick the wrong one.

---

## 5 · Status and evidence model

| Status | Means |
|---|---|
| `Verified` | Measured on real hardware |
| `Tested` | Implemented and covered by automated tests; no hardware |
| `Reconstructed` | Recovered from a third-party binary; never executed |
| `Claimed` | Asserted by a vendor README/changelog only |
| `Placeholder` | Interface or classifier exists; protocol does not |
| `Hypothesis` | Proposed, unmeasured, unimplemented |
| `Excluded` | Recorded for completeness, excluded by policy |

Invariants that are pinned by automated tests:

1. A method is usable **only** if it is adopted **and** `Verified`/`Tested`.
2. Every unimplemented method carries a reason it is blocked.
3. Every method that is neither usable nor excluded names the exact artifact that would unblock it.
4. A usable method must carry nothing on its "evidence needed" list — a proven method is not waiting.
5. No Unisoc method that *changes* the device is usable.
6. Policy-excluded methods cannot be made usable by supplying prerequisites.

Because these are tests rather than review habits, an optimistic status shows up immediately as a false
"usable" verdict in the suite.

---

## 6 · What happens on screen

| Area | What you get |
|---|---|
| Main window | Engine switch, device picker, live event log |
| MTK workspace | META connect, GPT slots, partition read/write, bootloader panel |
| Bootloader panel | Find slots → Check phone → Read & analyse → Patch bootloader |
| Method selector | Per-method state with the reason and the next required artifact |
| Method catalogue | Every SPD/META method with status and evidence |
| Supported models | The matrix, with the ambiguity warning on every shared token |
| Proven support | The honest list of what is proven and what is still waiting |
| SPD workspace | Detection, PAC inspect/plan/extract, FDL kit inspection |
| Partition manager | Layout chosen by the operator; storage kind shown as part of identity |
| Log panel | Every command, response and refusal, timestamped |

---

## 7 · CLI surface

The same engines are reachable headless, which is how long reads are done:

```
TMTK.exe --lk <port> <report-file> <size-kb> --slot <slot>
```

Analysis of a saved image is repeatable offline without touching the phone again. The read-only method
catalogue also has a small command-line surface: list methods by platform or status, render the
catalogue as Markdown, print the "evidence needed" list, list a model list per engine, resolve a token
(refusing when ambiguous), and evaluate detected SPD capabilities.

Exit codes are meaningful: `0` success, `1` refusal (unknown or ambiguous), `2` usage error.

---

## 8 · Ethics and limits

* TMTK is for devices you own or are authorised to service.
* The tool is designed to refuse. If it refuses, the correct next action is to supply the missing
  evidence — not to force the write.
* No transport, handshake or key material is published in this repository.
* Numbers on this page that describe hardware were measured; everything else is marked as a status, not
  a claim.

See [`DISCLAIMER.md`](DISCLAIMER.md) and [`FAQ.md`](FAQ.md).
