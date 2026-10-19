# Disclaimer

**Read this before requesting access to TMTK.**

## Authorised devices only

TMTK is a professional service tool. Use it only on devices you **own**, or devices you are **explicitly
authorised** to service on behalf of their owner. Unlocking or modifying a device you do not control may
be unlawful where you operate, may breach a service agreement, and may breach carrier or regional rules.

## Risk

Bootloader unlocking, partition writing and firmware work can **permanently and irreversibly brick** a
device. Recovery may be impossible without vendor-level tooling. Writing the wrong image to the wrong
offset — including a correctly built image for the wrong variant — can destroy the bootloader.

## No warranty

The tool is provided **as is**, without warranty of any kind, express or implied, including fitness for a
particular purpose. TFAST Digital Agency is not liable for data loss, device damage, loss of warranty,
loss of service, or any consequential loss arising from use of the tool or from reliance on this
documentation.

## What is deliberately not provided

* No source code in this repository.
* No binaries, installers or loaders.
* No keys, certificates or key material of any kind.
* No vendor firmware, PAC files or FDL kits.
* No BootROM `exec_addr` stub or CVE-2022-38694 class technique — recorded as `Excluded` by policy and
  refuses to run even when every prerequisite is supplied.

Do not ask for these in issues. Requests for key material, vendor firmware or policy-excluded techniques
will be closed.

## Accuracy of this documentation

Capabilities are described using the tool's own status vocabulary (`Verified`, `Tested`, `Reconstructed`,
`Claimed`, `Placeholder`, `Hypothesis`, `Excluded`). A feature described as `Placeholder` or
`Reconstructed` **does not work on a device**. Do not read the presence of a model token in the matrix as
a guarantee that the operation for that token is implemented — the SPD lane in particular has no transport.

Hardware figures quoted here (throughput, read times) were measured on a specific unit and will vary with
SoC, storage and firmware.

## Trademarks

Tecno, Infinix, itel, MediaTek, Unisoc, Spreadtrum and any other product or company names are trademarks
or registered trademarks of their respective owners. TMTK is **not affiliated with, endorsed by, or
sponsored by** any of them. Model tokens are used descriptively to identify compatibility.

## Privacy

Screenshots, logs and backup manifests can contain device identifiers, IMEI, serial numbers and file paths.
Redact them before publishing anything. You are responsible for the data you share.

## Contact

| Channel | |
|---|---|
| WhatsApp | [+256 751 399 620](https://wa.me/256751399620) |
| Website | [tfastdigital.com](https://tfastdigital.com/) |
| Telegram | [t.me/tfasthub](https://t.me/tfasthub) |
