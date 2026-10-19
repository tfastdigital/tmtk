/*
  TMTK v2.0 — DEMO DATA
  ---------------------------------------------------------------------------
  Hand-written fixture data for the interactive mock-up. Nothing here is read
  from the product, and nothing here can reach a device.

  Sources used to keep the demo honest:
    • model tokens / marketing names / keying  -> README supported-model matrix
    • SPD + META method ids, status, blockers  -> MethodCatalog (already public)
    • the 18 transport key names               -> SpdTransportVocabulary
  Everything else (partition rows, timings, log lines) is synthetic and
  labelled as such in the UI.
*/
window.TMTK_DEMO = (function () {
  'use strict';

  // ── Model matrix ──────────────────────────────────────────────────────────
  // keying: token | patch | soc+storage | soc+dram
  const lkPatch = [
    ['CM5', 'Camon 40'], ['CM6', 'Camon 40 Pro'], ['X6880', 'Infinix'],
    ['X6886', 'Hot 60 Pro Plus'], ['KL5', 'Spark 30 C'], ['KM5', ''],
    ['KM6', 'Spark 40 Pro'], ['KM7', 'Spark 40 Pro Plus'], ['CK6', ''],
    ['CK7', ''], ['CL6', ''], ['CLA5', 'Camon 30s'], ['KL7', ''],
    ['X6728B', ''], ['KM4', 'Pop 10'], ['A100', ''],
    ['X6725', ''], ['X6725B', '']
  ].map(([token, name]) => ({ token, name, keying: 'token', storage: null }));

  const autobl = [
    ['X6725B', ''], ['X6526D_V2506', 'X6525D V2506'], ['X6725', ''],
    ['X6525', 'Smart 8'], ['A6610L', 'itel A90'], ['A666L', 'itel A70'],
    ['BG6', 'Pop 8'], ['BG6M', ''], ['KM4', 'Pop 10'], ['KL4', 'Pop 9'],
    ['KN3_AUG', 'Pop 20 — Aug patch', 'patch'], ['KN3_FEB', 'Pop 20 — Feb patch', 'patch']
  ].map(([token, name, keying]) => ({ token, name, keying: keying || 'token', storage: null }));

  const fdl = [
    ['KM6', 'Spark 40 Pro'], ['KM7', 'Spark 40 Pro Plus'], ['CM5', 'Camon 40'],
    ['CM6', 'Camon 40 Pro'], ['CLA5', 'Camon 30s'], ['X6886', 'Hot 60 Pro Plus'],
    ['X6885', 'Hot 60 Pro'], ['KL5', 'Spark 30 C'], ['X6880', ''],
    ['X6853', ''], ['X6850', ''], ['X6851', '']
  ].map(([token, name]) => ({ token, name, keying: 'token', storage: null }));

  const partition = [
    ['SC9863A', '', 'token', null],
    ['SC9863A_64', '', 'token', null],
    ['TIGER_T615', '', 'token', null],
    ['TIGER_T616', '', 'token', null],
    ['M-KOPA S34', '', 'token', null],
    ['SC9863A-ITEL-VISION3', '', 'token', null],
    ['SC9863A-ZTE-BLADE-A31', '', 'token', null],
    ['UMS9230', '', 'soc+storage', 'eMMC'],
    ['UMS9230-UFS', '', 'soc+storage', 'UFS'],
    ['UMS9620-DRAMTYPE1', '', 'soc+dram', 'DRAM type 1'],
    ['UMS9620-DRAMTYPE2', '', 'soc+dram', 'DRAM type 2']
  ].map(([token, name, keying, storage]) => ({ token, name, keying, storage }));

  // ── Method catalogue ──────────────────────────────────────────────────────
  // status: Verified | Tested | Reconstructed | Claimed | Placeholder | Hypothesis | Excluded
  const spdMethods = [
    { id: 'SPD-01', stage: 'DeviceDetection', name: 'Vendor / mode classification',
      summary: 'Spreadtrum VID 0x1782; separate spd-diag from spd-download.',
      status: 'Tested', changes: false, adopted: true,
      evidence: 'TFAST Device SDK/docs/VERIFICATION.md', blocker: null, needed: null },

    { id: 'SPD-02', stage: 'OfflineFile', name: 'PAC archive inspect / plan / extract',
      summary: 'BP_R1/BP_R2 magic, entry table validation, byte-exact payload extraction, flash plan.',
      status: 'Tested', changes: false, adopted: true,
      evidence: 'PacReader, PacExtractor, SpdFlashPlanner',
      blocker: 'Entry field offsets are an inferred layout, not a vendor spec. Confirmed against one real BP_R2.0 container (0x60 header, table at 0x60, 0x100 stride); the sample payloads are synthetic, so field meaning beyond name, file, offset and size is unproven.',
      needed: null },

    { id: 'SPD-03', stage: 'SpdFdl', name: 'FDL download protocol',
      summary: 'Write a .pac to a device through FDL1/FDL2.',
      status: 'Placeholder', changes: true, adopted: false,
      evidence: 'TFAST Device SDK/docs/VERIFICATION.md',
      blocker: 'No write transport exists in any project here.',
      needed: 'A capture of one FDL session: the bytes exchanged from BROM entry to the first successful read, with the SoC and BootROM version named.' },

    { id: 'SPD-04', stage: 'SpdBrom', name: 'BROM to FDL1 to FDL2 bring-up',
      summary: 'Baud/exec negotiation, then stage _fdl1.bin and _fdl2.bin.',
      status: 'Reconstructed', changes: true, adopted: false,
      evidence: 'CROSS-REF-OUR-RESEARCH.md §3.1',
      blocker: 'Per-SoC and BootROM-version sensitive; cannot be guessed.',
      needed: 'Per-SoC exec addresses and the baud-switch sequence, taken from a vendor-supplied FDL kit rather than recovered from a competitor binary.' },

    { id: 'SPD-05', stage: 'SpdPartition', name: 'Partition map read',
      summary: 'Read partition.xml / partition_~; report active slot and capacity.',
      status: 'Reconstructed', changes: false, adopted: false,
      evidence: 'CROSS-REF-OUR-RESEARCH.md §3.1',
      blocker: 'No SPD transport exists here; recovered from third-party strings only.',
      needed: 'A real partition.xml or partition_~ dump from a Unisoc device, plus a working FDL session to read it through.' },

    { id: 'SPD-06', stage: 'SpdPartition', name: 'Partition read',
      summary: 'Read named partitions, sector-addressed, after FDL2 is running.',
      status: 'Reconstructed', changes: false, adopted: false,
      evidence: 'CROSS-REF-OUR-RESEARCH.md §3.1',
      blocker: 'Needs FDL2, which needs SPD-04; neither is implemented here.',
      needed: 'The read command template, including its framing and checksum.' },

    { id: 'SPD-07', stage: 'SpdPartition', name: 'Partition write',
      summary: 'Bulk write one or more images to live flash.',
      status: 'Reconstructed', changes: true, adopted: false,
      evidence: 'CROSS-REF-OUR-RESEARCH.md §3.1',
      blocker: 'No SPD write transport; would also need a backup gate of its own.',
      needed: 'The write command template plus a proven read-back path to verify it.' },

    { id: 'SPD-08', stage: 'SpdPartition', name: 'Partition erase',
      summary: 'Erase one or more partitions.',
      status: 'Reconstructed', changes: true, adopted: false,
      evidence: 'CROSS-REF-OUR-RESEARCH.md §3.1',
      blocker: 'No SPD write transport; recovered from third-party strings only.',
      needed: 'The erase command template and its success/failure response codes.' },

    { id: 'SPD-09', stage: 'SpdPatch', name: 'SPD bootloader patch bundle',
      summary: 'SPDBLPATCH / KnoxSpdBlPatch; signature-checked; pairs uboot_a with vbmeta_a.',
      status: 'Reconstructed', changes: true, adopted: false,
      evidence: 'CROSS-REF-OUR-RESEARCH.md §4.2',
      blocker: 'Recipe is server-delivered and signature-gated; only the vocabulary is known.',
      needed: 'The bundle rule schema and a signed sample bundle for one model.' },

    { id: 'SPD-10', stage: 'SpdPatch', name: 'AUTO BL engine',
      summary: 'uboot_a/b plus vbmeta_a/b, model-keyed, refuses non-matching images.',
      status: 'Reconstructed', changes: true, adopted: false,
      evidence: 'CROSS-REF-OUR-RESEARCH.md §4.2, §8.4',
      blocker: 'Refuses a model mismatch; no recipe content recovered.',
      needed: 'One uboot image plus the vbmeta that pairs with it, for a single named model.' },

    { id: 'SPD-11', stage: 'SpdPatch', name: 'kw_spd_fdl_unlock payloads',
      summary: 'Per-model N.bin / Na.bin pairs used by the FDL unlock path.',
      status: 'Reconstructed', changes: true, adopted: false,
      evidence: 'CROSS-REF-OUR-RESEARCH.md §9.4',
      blocker: 'Label-to-payload pairing is unresolved (12 labels, 10 pairs).',
      needed: 'The UI table that maps each model label to its N.bin / Na.bin pair, or two payloads whose contents identify the model they belong to.' },

    { id: 'SPD-12', stage: 'SpdBrom', name: 'Custom unsigned exec with exec_addr stubs',
      summary: 'Runs custom_exec_no_verify_* and selects a per-BootROM stub (CVE-2022-38694 class).',
      status: 'Excluded', changes: true, adopted: false,
      evidence: 'CROSS-REF-OUR-RESEARCH.md §3.2; ROADMAP.md §4',
      blocker: 'Exploit distribution; per-address fragility; bricks on a wrong guess.',
      needed: 'None. This is refused by policy, not blocked on information.' },

    { id: 'SPD-13', stage: 'SpdPartition', name: 'SPD transport vocabulary',
      summary: 'usb_vid, handshake_cmd, tunnel_cmd, cmd_read/write/erase, gpt_devices and related keys.',
      status: 'Reconstructed', changes: false, adopted: true,
      evidence: 'CROSS-REF-OUR-RESEARCH.md §4.3; SpdTransportVocabulary',
      blocker: 'Key names only; values and engine ownership are unknown, so it is a planning checklist rather than a protocol.',
      needed: 'Values for the 18 recovered keys, taken from a real device or from the engine that consumes them.' },

    { id: 'SPD-14', stage: 'DeviceDetection', name: 'Storage-type split',
      summary: 'ums9230 (eMMC) and ums9230-ufs (UFS) are distinct identities; ums9620 splits by DRAM type.',
      status: 'Reconstructed', changes: false, adopted: true,
      evidence: 'CROSS-REF-OUR-RESEARCH.md §8.3, §9.5',
      blocker: 'Recovered from a third-party binary; our device map is not cross-checked against it.',
      needed: 'The storage-type and DRAM-type of one real ums9230 / ums9620 unit, read back from the device rather than inferred from its marketing name.' },

    { id: 'SPD-15', stage: 'ProcessLaunch', name: 'Server engine delivery / local fallback',
      summary: 'Fetch .kw_rtspd_bundle.zip, or use a local payload kit / SPD_TOOL_DIR.',
      status: 'Reconstructed', changes: false, adopted: false,
      evidence: 'PROTECTIONS.md §3.4',
      blocker: 'We have no engine distribution story.',
      needed: 'Either a bundle we may redistribute, or a confirmed local payload kit path for one model.' },

    { id: 'SPD-16', stage: 'SpdPartition', name: 'Third-party SPD capability claim',
      summary: 'BROM/preloader connect, DA download, patch DA, crash preloader, NV/RPMB/key, SLA/DAA.',
      status: 'Claimed', changes: true, adopted: false,
      evidence: 'CHANGELOG.md v4.0',
      blocker: 'Implementation not inspected; claim only.',
      needed: 'The engine itself, or an independent log of one of these operations succeeding on a real Unisoc device.' }
  ];

  const metaMethods = [
    { id: 'META-01', stage: 'PreloaderToMeta', name: 'Preloader to META transition',
      summary: 'METAMETA to ATEM0001/0002 to ATEMATEX; SLA challenge for vendor-signed preloaders.',
      status: 'Verified', changes: false, adopted: true, evidence: 'MetaModeFull/META-SPEED.md', blocker: null, needed: null },
    { id: 'META-02', stage: 'PreloaderToMeta', name: 'Post-SLA re-enumeration',
      summary: 'Device returns as PID 0x202D with two COM ports; frames answer on MI_01.',
      status: 'Verified', changes: false, adopted: true, evidence: 'CROSS-REF-OUR-RESEARCH.md §2.1', blocker: null, needed: null },
    { id: 'META-03', stage: 'MetaSession', name: 'Handshake frame',
      summary: '55 00 0C 66 …; five attempts, 2500 ms on the first.',
      status: 'Verified', changes: false, adopted: true, evidence: 'META-PROTOCOL.md §2.1', blocker: null, needed: null },
    { id: 'META-04', stage: 'MetaSession', name: 'Shell command wrapper',
      summary: '<cmd> ; echo EXIT:$?  Reply ends on the marker or 200 ms of idle line.',
      status: 'Verified', changes: false, adopted: true, evidence: 'META-PROTOCOL.md §2.2', blocker: null, needed: null },
    { id: 'META-05', stage: 'MetaRead', name: 'Chunked partition read (hex)',
      summary: 'dd bs=384 skip=<sector> count=1 | xxd -p; ~1.25 KB/s.',
      status: 'Verified', changes: false, adopted: true, evidence: 'META-PROTOCOL.md §2.3; META-SPEED.md', blocker: null, needed: null },
    { id: 'META-06', stage: 'MetaRead', name: 'Chunked read (base64)',
      summary: 'Measured 1.97x faster and byte-inexact; kept behind a default-off switch.',
      status: 'Verified', changes: false, adopted: false, evidence: 'META-SPEED.md',
      blocker: 'Rejected: padding loss, 1052-byte reply vs 1054-byte ceiling, silent shell-noise corruption.',
      needed: 'None. This was measured, failed, and is rejected on evidence.' },
    { id: 'META-07', stage: 'MetaRead', name: 'GPT read and parse',
      summary: 'LBA 1 EFI PART, header-driven entry count (57 on the reference unit).',
      status: 'Verified', changes: false, adopted: true, evidence: 'META-PROTOCOL.md §5', blocker: null, needed: null },
    { id: 'META-08', stage: 'MetaWrite', name: 'Partition write with read-back',
      summary: 'Chunked, acknowledged per frame, compared byte-for-byte afterwards.',
      status: 'Verified', changes: true, adopted: true, evidence: 'META-PROTOCOL.md §6', blocker: null, needed: null },
    { id: 'META-09', stage: 'MetaWrite', name: 'Partition erase',
      summary: 'Zero fill; FRP uses the safe sector path rather than wiping the partition.',
      status: 'Verified', changes: true, adopted: true, evidence: 'META-PROTOCOL.md §6', blocker: null, needed: null },
    { id: 'META-10', stage: 'MetaWrite', name: 'Backup-before-write gate',
      summary: 'Capture target partitions and a SHA-256 manifest first; fail closed.',
      status: 'Verified', changes: false, adopted: true, evidence: 'BACKUP-AND-SAFETY.md', blocker: null, needed: null },
    { id: 'META-11', stage: 'MetaSession', name: 'Identity read (getprop)',
      summary: 'ro.build.*, ro.board.platform, ro.hardware, ro.boot.flash.locked and related.',
      status: 'Verified', changes: false, adopted: true, evidence: 'LK-WORKFLOW.md', blocker: null, needed: null },
    { id: 'META-12', stage: 'MetaSession', name: 'Extended identity set',
      summary: 'Adds ro.frp.pst, sys.usb.state, gsm.sim.state (competitor superset).',
      status: 'Reconstructed', changes: false, adopted: true, evidence: 'CROSS-REF-OUR-RESEARCH.md §2.3',
      blocker: 'Fields recovered from a third-party binary; each needs its own device check.',
      needed: "Each property's value read from our own unit, so the recovered field list is confirmed rather than assumed." },
    { id: 'META-13', stage: 'DeviceDetection', name: 'Port / VID detection',
      summary: 'VID_(04E8|1782|0E8D|05C6); SetupAPI ports class equivalent.',
      status: 'Verified', changes: false, adopted: true, evidence: 'CROSS-REF-OUR-RESEARCH.md §1', blocker: null, needed: null },
    { id: 'META-14', stage: 'MetaRead', name: 'LK read and analyse',
      summary: 'Find lk* in GPT, read the slot, analyse container, architecture and lock stores.',
      status: 'Verified', changes: false, adopted: true, evidence: 'BOOTLOADER-LK.md', blocker: null, needed: null },
    { id: 'META-14B', stage: 'MetaWrite', name: 'LK lock-state patch',
      summary: 'Write a patched LK slot after backup and verify by read-back.',
      status: 'Placeholder', changes: true, adopted: false, evidence: 'UNLOCK-METHODS.md',
      blocker: 'No verified ARM32 recipe; AVB pairing with vbmeta unanswered.',
      needed: 'A verified LK unlock patch for one ARM32 MTK model, together with the vbmeta that must be updated alongside it.' },
    { id: 'META-15', stage: 'MetaWrite', name: 'FRP and identity-partition operations',
      summary: 'FRP zeroing and related service writes, each behind the backup gate.',
      status: 'Verified', changes: true, adopted: true, evidence: 'BACKUP-AND-SAFETY.md', blocker: null, needed: null },
    { id: 'META-16', stage: 'ProcessLaunch', name: 'External META engine (bsmeta.exe)',
      summary: 'Fetch meta_bundle.zip, run the engine, parse PROGRESS|RESULT| lines.',
      status: 'Reconstructed', changes: true, adopted: false, evidence: 'REVERSE_ENGINEERING.md',
      blocker: 'Engine not embedded; frame codec, timeouts and retries unobservable.',
      needed: 'The engine bundle, or a capture of its console protocol including the timeout and retry behaviour.' },
    { id: 'META-17', stage: 'MetaRead', name: 'Speed levers',
      summary: 'Batch ranges, on-device gzip, fixed-cost investigation, baud sweep, targeted reads.',
      status: 'Hypothesis', changes: false, adopted: false, evidence: 'META-SPEED.md',
      blocker: 'None implemented; the 232 ms fixed cost is unexplained.',
      needed: 'Timings for the same read at two baud rates and two chunk sizes, so the fixed cost can be attributed to transport or to the device.' }
  ];

  // ── Transport vocabulary (names only, zero values) ────────────────────────
  const transport = [
    ['usb_vid', 'Identification', 'USB vendor id the engine listens for'],
    ['handshake_cmd', 'Bring-up', 'Command that begins the BootROM exchange'],
    ['handshake_sub', 'Bring-up', 'Sub-command of the handshake'],
    ['tunnel_cmd', 'Bring-up', 'Command that leaves the BootROM for the download agent'],
    ['activate', 'Bring-up', 'Activation step after the tunnel'],
    ['at_shell_fmt', 'Diagnostics', 'AT command template used on the DIAG path'],
    ['liveness_cmd', 'Diagnostics', 'Command used to confirm the session is alive'],
    ['cmd_list', 'Partition', 'Template for listing partitions'],
    ['cmd_info', 'Partition', 'Template for querying partition information'],
    ['cmd_read', 'Partition', 'Template for reading a range'],
    ['cmd_write', 'Partition', 'Template for writing a range'],
    ['cmd_erase', 'Partition', 'Template for erasing a range'],
    ['cmd_reboot', 'Control', 'Template for rebooting'],
    ['cmd_reboot_fastboot', 'Control', 'Template for rebooting into fastboot'],
    ['gpt_devices', 'Partition', 'Block devices that carry a partition table'],
    ['dev', 'Partition', 'Device node the operation targets'],
    ['start_lba', 'Partition', 'First LBA of a range'],
    ['sectors', 'Partition', 'Length of a range in sectors']
  ].map(([key, group, meaning]) => ({ key, group, meaning, known: false }));

  // ── Synthetic partition layout for the demo tables ────────────────────────
  const partitions = [
    { name: 'proinfo', size: '3 MB', kind: 'raw', start: 0x0000800 },
    { name: 'nvram', size: '64 MB', kind: 'raw', start: 0x000A000 },
    { name: 'protect1', size: '8 MB', kind: 'raw', start: 0x004A000 },
    { name: 'protect2', size: '8 MB', kind: 'raw', start: 0x0052000 },
    { name: 'seccfg', size: '8 MB', kind: 'raw', start: 0x005A000 },
    { name: 'lk_a', size: '2 MB', kind: 'raw', start: 0x0062000 },
    { name: 'lk_b', size: '2 MB', kind: 'raw', start: 0x0064000 },
    { name: 'boot_a', size: '64 MB', kind: 'raw', start: 0x0066000 },
    { name: 'boot_b', size: '64 MB', kind: 'raw', start: 0x00A6000 },
    { name: 'dtbo_a', size: '8 MB', kind: 'raw', start: 0x00E6000 },
    { name: 'vbmeta_a', size: '8 MB', kind: 'raw', start: 0x00EE000 },
    { name: 'vbmeta_b', size: '8 MB', kind: 'raw', start: 0x00F6000 },
    { name: 'super', size: '4096 MB', kind: 'ext4', start: 0x00FE000 },
    { name: 'userdata', size: '22528 MB', kind: 'f2fs', start: 0x10FE000 },
    { name: 'metadata', size: '16 MB', kind: 'raw', start: 0x68FE000 },
    { name: 'frp', size: '512 KB', kind: 'raw', start: 0x690E000 },
    { name: 'persist', size: '32 MB', kind: 'raw', start: 0x6916000 }
  ];

  // ── Bootloader analysis result (the honest refusal) ───────────────────────
  const lkAnalysis = {
    slot: 'lk_a',
    bytes: 2048 * 1024,
    readSeconds: 1565,
    architecture: 'ARM32 / Thumb',
    container: 'raw',
    identity: 'mtk-arm32-autonomous-rev3',
    confidence: 100,
    lockStores: 0,
    methods: [
      { name: 'Key patch (own signing key)', state: 'NOT FOR THIS PHONE',
        why: 'vendor.pem is not present, so the reference modulus cannot be located.',
        next: 'Drop vendor.pem and signing.pem (same modulus length) beside the executable.' },
      { name: 'Lock-state patch — ARM64', state: 'NOT FOR THIS PHONE',
        why: 'No AArch64 RET evidence (C0 03 5F D6) in this image; it is 32-bit ARM.',
        next: 'Nothing — this method does not apply to this bootloader.' },
      { name: 'Lock-state patch — ARM32', state: 'BLOCKED',
        why: 'Candidate scan found 616 encoding matches; 4 survived the anchor and radius gate. Not hardware-validated.',
        next: 'A device test on this exact build before any write is enabled.' }
    ],
    candidates: [
      { offset: '+0x063CD4', hex: '04 23 03 60', note: 'movs r3,#4 ; str r3,[r0] ; returns — LKS_LOCK setter' },
      { offset: '+0x06C728', hex: '01 23 02 20 23 60', note: 'movs r3,#1 ; str r3,[r4] ; returns' },
      { offset: '+0x06C7F8', hex: '00 23 02 20 23 60', note: 'movs r3,#0 ; str r3,[r4] ; returns' },
      { offset: '+0x06C89A', hex: '01 22 7B 44 1A 60', note: 'movs r2,#1 ; str r2,[r3] ; returns' }
    ]
  };

  // ── Verified support list ─────────────────────────────────────────────────
  const verified = [
    ['META connection + handshake', 'META-01..04'],
    ['GPT read and parse', 'META-07'],
    ['Partition read (hex, chunked)', 'META-05'],
    ['Partition write with read-back', 'META-08'],
    ['Partition erase', 'META-09'],
    ['Backup + SHA-256 manifest gate', 'META-10'],
    ['Identity read (getprop)', 'META-11'],
    ['Port / VID detection', 'META-13'],
    ['LK read and analyse', 'META-14'],
    ['FRP / identity partitions', 'META-15'],
    ['PAC archive inspect / plan / extract', 'SPD-02'],
    ['Vendor / mode classification', 'SPD-01'],
    ['SPD transport vocabulary (names)', 'SPD-13'],
    ['Storage-type split', 'SPD-14']
  ];

  const unsupported = [
    ['Unisoc BROM / FDL transport', 'No handshake, no tunnel, no read/write path'],
    ['Unisoc partition map read/write', 'Blocked behind the transport'],
    ['Unisoc FDL unlock payloads', 'Label-to-payload pairing unresolved'],
    ['LK lock-state patch on ARM32', 'Recipe not hardware-validated'],
    ['BootROM exec_addr stubs', 'Excluded by policy'],
    ['LK key patch write', 'Certificate chain re-encode not implemented']
  ];

  // ── Scripted verdicts (SPD) ───────────────────────────────────────────────
  const verdicts = [
    { id: 'SPD-02', state: 'Available', why: 'Offline PAC container handling is implemented and byte-exact.' },
    { id: 'SPD-13', state: 'NotReady', why: 'Key names recovered; zero values, so it is a checklist, not a protocol.' },
    { id: 'SPD-03', state: 'NotImplemented', why: 'No write transport exists.' },
    { id: 'SPD-04', state: 'NotImplemented', why: 'Per-SoC exec addresses and baud sequence unknown.' },
    { id: 'SPD-05', state: 'NotImplemented', why: 'Needs an FDL session to read through.' },
    { id: 'SPD-06', state: 'NotImplemented', why: 'Needs FDL2, which needs SPD-04.' }
  ];

  // ── What actually runs in the SPD lane today ──────────────────────────────
  // Offline, file-side work only. Every entry maps to a method whose status is
  // Tested (implemented + covered by automated tests) or an adopted
  // Reconstructed entry. None of these touch a device.
  const spdWorks = [
    { id: 'SPD-02', status: 'Tested', name: 'PAC archive inspect / plan / extract',
      detail: 'BP_R1 and BP_R2 containers: magic, header size, entry table, per-entry name/file/offset/size, byte-exact extraction and a flash plan.' },
    { id: 'SPD-01', status: 'Tested', name: 'Vendor / mode classification',
      detail: 'Spreadtrum VID 0x1782 recognised, and spd-diag kept separate from spd-download.' },
    { id: 'SPD-14', status: 'Reconstructed', name: 'Storage-type split',
      detail: 'ums9230 (eMMC) and ums9230-ufs (UFS) are treated as different identities, not one model with two names.' },
    { id: 'SPD-13', status: 'Reconstructed', name: 'Transport vocabulary as a checklist',
      detail: '18 recovered key names used to check that a design defines every field — explicitly not a protocol.' }
  ];

  return {
    models: { lkPatch, readyBl: lkPatch, autobl, fdl, partition },
    methods: { spd: spdMethods, meta: metaMethods },
    transport,
    partitions,
    lkAnalysis,
    verified,
    unsupported,
    verdicts,
    spdWorks,
    meta: {
      version: 'TMTK v2.0',
      tokens: 53,
      lists: 4,
      ambiguous: ['CM5', 'CM6', 'KM4', 'KM6', 'KM7', 'KL5', 'CLA5', 'X6880', 'X6886', 'X6725', 'X6725B'],
      throughputKbs: 1.25,
      perCommandMs: 280,
      replyBytes: 500
    }
  };
})();
