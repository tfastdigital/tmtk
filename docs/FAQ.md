# FAQ

### Is the source code in this repository?

No. This repository is documentation only — no source files, no binaries, no key material, no loaders,
no PAC files. It exists so technicians can see what the tool does and which devices are covered before
they ask for access.

### Is this a free tool?

TMTK is a service tool from **TFAST Digital Agency**. Access is arranged directly — see the contact
details in the main README. Nothing in this repository is an offer, a license or a download link.

### Do I need the phone to be rooted?

No. The MediaTek path exists because META mode runs *instead of* the normal boot chain, so the
bootloader's own lock check never executes. That is what makes a locked, non-rooted device readable.

### Why does reading one partition take 26 minutes?

Because that is the physical cost of the channel. A META shell command costs roughly 280 ms and a reply
frame carries roughly 500 bytes, which works out to about **1.3 KB/s**. A 2 MB bootloader slot therefore
takes about 26 minutes to read and a similar time to write. TMTK states the estimate before the operation
starts, saves the image to disk, and lets you re-analyse offline so you do not pay that cost twice.

### The tool says `BLOCKED`. Is that a bug?

No. `BLOCKED` means the method applies to your device but a prerequisite outside the current build is
missing — a certificate patcher, a verified instruction recipe, a transport. The tool prints *which*
artifact would unblock it. `NOT FOR THIS PHONE` is different: the method's signature is not present in
the image you loaded.

### Why won't it just pick the right engine for my model?

Because 11 tokens in the matrix are claimed by more than one engine. `KM4`, `X6725`, `X6725B`, `X6880`,
`X6886`, `CM5`, `CM6`, `CLA5`, `KL5`, `KM6`, `KM7`. Auto-picking is a coin flip, and a wrong pick is what
kills a phone. The tool shows you every claimant and asks you to choose.

### My model is not in the list. Can I still use it?

You can still read partitions and analyse a bootloader image — those operations are driven by the device
data, not by a name list. But unlock and patch recipes are keyed to a specific token, patch month, storage
kind or DRAM type, so an unlisted device has no recipe. Use the model-request issue template with the
token, SoC and security patch.

### `UMS9230` and `UMS9230-UFS` look like the same phone.

They are not the same target. eMMC uses 512-byte logical sectors; UFS uses 4096. The partition layout
differs. Same for `UMS9620-DRAMTYPE1` vs `DRAMTYPE2`. Treating them as interchangeable is how a partition
write lands in the wrong place.

### `KN3_AUG` vs `KN3_FEB` — why two entries for the same model?

The recipe is keyed to a **build**, not just a model name. A Pop 20 on the August security patch and one
on the February patch do not necessarily share the same lock layout, so they are separate tokens.

### Does the SPD side work?

The engine is **in active development**. The offline half is done and tested; the device side is being
built now. The tool says which half you are in.

* ✅ PAC container handling — inspect, plan, extract, byte-exact
* ✅ FDL kit identification by name and size, with SHA-256
* ✅ Vendor / mode classification, storage-type split
* 🟡 Transport vocabulary — 18 key names recovered, zero values
* ❌ BROM → FDL1 → FDL2 transport — **still being built**

The SPD model lists are **data**. They describe coverage, not a working transport. If you have a captured
FDL session or a vendor FDL kit for a named SoC, that is the artifact that moves the transport forward.

### When will the SPD transport be finished?

Not on a date. It needs one of: a captured BROM→FDL1→FDL2 session with the SoC and BootROM version named,
a vendor-supplied FDL kit, or the N.bin / Na.bin pairing table. Without one of those, any transport would
be guesswork — and a guessed transport bricks phones. Dates are not published because the blocker is
missing evidence, not missing effort.

### Will you add BootROM `exec_addr` stubs / CVE-2022-38694 techniques?

No. That class is recorded as `Excluded` for completeness and stays excluded even when every prerequisite
is supplied.

### Is my data sent anywhere?

The tool works against the phone in front of you and the files you load. There is no cloud round-trip in
the read/analyse path described here. Screenshots in this repository must be redacted — see
[`../screenshots/README.md`](../screenshots/README.md).

### Can I redistribute the screenshots or documentation?

Contact TFAST Digital Agency before republishing. Model lists and screenshots showing real device
identity should be treated as customer data and redacted first.

### Something went wrong on a device.

Stop, do not write again, and keep the log. The log panel records every command, response and refusal,
and the backup manifest records SHA-256 hashes of the slots taken before the first write — those two
files are what make recovery possible.
