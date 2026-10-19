/*
  TMTK v2.0 — DEMO SHELL
  ---------------------------------------------------------------------------
  This file renders a mock-up. It contains:
    • DOM rendering and tab/panel navigation
    • a scripted state machine driven by timers
    • log lines and toast messages

  It deliberately contains NONE of the following, and must never gain them:
    ✗ WebSerial / WebUSB / navigator.serial / navigator.usb
    ✗ serial, USB, ADB, fastboot or META frame handling
    ✗ protocol bytes, checksums, exec addresses, handshakes
    ✗ key material, signatures, certificates
    ✗ fetch / XHR / WebSocket / any network request
    ✗ file writing of any kind

  Every "action" either animates fixture data or shows an inert notice.
*/
(function () {
  'use strict';

  var D = window.TMTK_DEMO;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  // ── State ────────────────────────────────────────────────────────────────
  var state = {
    ws: 'mtk',
    panel: { mtk: 'Log', spd: 'Log' },
    port: 'COM8 · META',
    baud: '921600',
    connected: false,
    busy: false,
    model: null,
    mode: 'auto',
    selToken: null,
    engineView: 'lkPatch',
    catalogueFilter: 'all',
    openMethod: null,
    selected: {},
    log: [],
    lk: { stage: 'idle', pct: 0, level: 0 },
    spdKit: null,
    pacOpen: false,
    fdlInspecting: false
  };

  var PANELS = {
    mtk: ['Log', 'Partitions', 'Bootloader', 'Support', 'Models'],
    spd: ['Log', 'Verdicts', 'Partitions', 'Catalogue', 'Models', 'Transport']
  };

  var ENGINE_LABEL = {
    lkPatch:   { name: 'MtkLkFilePatch',        human: 'LK file patch',        ws: 'MTK' },
    readyBl:   { name: 'MtkReadyBootloader',    human: 'ready bootloader',     ws: 'MTK' },
    autobl:    { name: 'UnisocAutoBl',          human: 'AUTO BL + vbmeta',     ws: 'SPD' },
    fdl:       { name: 'UnisocSpdFdlUnlock',    human: 'FDL / EDL unlock',     ws: 'SPD' },
    partition: { name: 'UnisocSpdPartitionManager', human: 'partition manager / PAC', ws: 'SPD' }
  };

  // ── Utilities ────────────────────────────────────────────────────────────
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function stamp() {
    var d = new Date();
    return [d.getHours(), d.getMinutes(), d.getSeconds()]
      .map(function (n) { return String(n).padStart(2, '0'); }).join(':');
  }

  function log(level, message) {
    state.log.push({ t: stamp(), level: level, msg: message });
    if (state.log.length > 320) state.log.shift();
    if (state.panel[state.ws] === 'Log') renderLogList();
  }

  var toastTimer = null;
  function toast(msg) {
    var el = $('#toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, 3000);
  }

  function inert(what) {
    toast('DEMO — ' + what + ' is not wired in this mock-up.');
    log('DEMO', 'Inert click: ' + what + ' (no command sent, no device access).');
  }

  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  function fmtClock(totalSeconds) {
    var m = Math.floor(totalSeconds / 60);
    var s = Math.round(totalSeconds % 60);
    return m + ':' + String(s).padStart(2, '0');
  }

  // ── Left column ──────────────────────────────────────────────────────────
  function renderLeft() {
    $('#left').innerHTML = state.ws === 'mtk' ? leftMtk() : leftSpd();
  }

  function leftMtk() {
    var readyCls = state.connected ? 'ok' : '';
    var status = state.connected
      ? 'Connected on ' + state.port + ' — META session up. Reads are ~1.25 KB/s.'
      : 'Ready — plug the phone in, then press Connect.';

    return '' +
      card('Connection — MediaTek', 'MTK',
        '<div class="row">' +
          select('port', ['COM8 · META', 'COM14 · META', 'COM3 · DIAG'], state.port, 'sel-port') +
          select('baud', ['921600', '460800', '115200'], state.baud, 'sel-baud') +
          '<button class="btn small" data-act="inert" data-msg="Port enumeration">Ports</button>' +
        '</div>' +
        '<div class="row"><button class="btn tall primary grow" data-act="connect" ' +
          (state.connected || state.busy ? 'disabled' : '') + '>' +
          (state.busy ? 'Connecting…' : 'Connect (wait for device)') + '</button></div>' +
        '<div class="row">' +
          '<button class="btn half" data-act="openport">Open port</button>' +
          '<button class="btn half" data-act="disconnect" ' + (state.connected ? '' : 'disabled') + '>Disconnect</button>' +
        '</div>' +
        '<label class="check"><input type="checkbox" checked> Save technical detail</label>' +
        '<div class="status-line ' + readyCls + '">' + esc(status) + '</div>'
      ) +
      card('Model — MediaTek', 'MTK',
        '<div class="field"><label>Mode</label>' +
          select('mode', ['Auto (from device)', 'Manual'], state.mode === 'auto' ? 'Auto (from device)' : 'Manual', 'sel-mode') +
        '</div>' +
        '<div class="field"><label>Model</label>' +
          '<select class="select" id="sel-model" ' + (state.mode === 'auto' ? 'disabled' : '') + '>' +
            '<option>' + (state.model ? esc(state.model) : 'pick a model') + '</option>' +
          '</select>' +
        '</div>' +
        '<div class="note-box">' +
          '<b>Auto — ' + (state.model ? 'identity read' : 'waiting for an MTK device identity') + '.</b><br>' +
          (state.model
            ? 'The panel now names the engine that serves this token. Nothing is assumed beyond the read identity.'
            : 'Connect a device and read its identity; this panel then names the engine that serves it. Nothing is assumed in the meantime.') +
          '<br><span style="color:#5a5a5a">Demo host: no device identity available.</span>' +
        '</div>' +
        '<div class="row" style="margin-top:9px">' +
          '<button class="btn grow" data-act="readmodel">Read model from device</button>' +
        '</div>'
      ) +
      card('Safety — back up before every write', '',
        '<label class="check" style="float:right"><input type="checkbox" checked></label>' +
        '<div class="row" style="margin-top:4px">' +
          '<input class="input" value="C:\\TMTK\\backups" aria-label="Backup folder">' +
          '<button class="btn small" data-act="inert" data-msg="Folder picker">Browse</button>' +
          '<button class="btn small" data-act="inert" data-msg="Opening the folder">Open</button>' +
        '</div>' +
        '<div class="hint" style="margin-top:8px">A SHA-256 manifest of every target partition is written before the first byte, and the write path fails closed if the manifest cannot be produced.</div>'
      ) +
      card('Meta — Transsion', '',
        '<div class="row">' +
          metaBtn('FRP (Transsion)') + metaBtn('Read GPT') +
        '</div><div class="row">' +
          metaBtn('ADB enable') + metaBtn('ADB disable') +
        '</div><div class="row">' +
          metaBtn('PayJoy off') + metaBtn('Security plugin off') +
        '</div><div class="row">' +
          metaBtn('Storage info') + metaBtn('Reboot') +
        '</div><div class="row">' +
          metaBtn('Factory reset') + metaBtn('ADB extra (setprop)') +
        '</div>' +
        '<button class="btn tall grow" style="width:100%;margin-top:2px" data-act="inert" data-msg="Preloader SLA authorization">Authorize from preloader</button>'
      );
  }

  function metaBtn(label) {
    return '<button class="btn half" data-act="metacmd" data-cmd="' + esc(label) + '">' + esc(label) + '</button>';
  }

  function leftSpd() {
    return '' +
      card('Connection — Unisoc (SPD)', '',
        '<div class="row" style="margin-top:2px">' +
          select('sport', ['SPD · download', 'SPD · diag'], 'SPD · download', 'sel-sport') +
          select('sbaud', ['115200', '460800'], '115200', 'sel-sbaud') +
          '<button class="btn small" data-act="inert" data-msg="Port enumeration">Ports</button>' +
        '</div>' +
        '<div class="row"><button class="btn tall grow inert" data-act="inert" data-msg="Unisoc connection">Connect (wait for device)</button></div>' +
        '<div class="row">' +
          '<button class="btn half inert" data-act="inert" data-msg="Opening a port">Open port</button>' +
          '<button class="btn half" disabled>Disconnect</button>' +
        '</div>' +
        '<div class="hint" style="margin-top:8px;color:#c99a8c">In development. There is no BROM/FDL transport in this build yet, so there is nothing to connect to. Offline work (PAC, FDL kit, partition planning) runs today.</div>',
        '<span style="display:flex;gap:5px;flex-wrap:wrap"><span class="badge warn">IN DEVELOPMENT</span>' +
          '<span class="badge bad">NO TRANSPORT</span></span>'
      ) +
      card('Safety — back up before every write', '',
        '<label class="check" style="float:right"><input type="checkbox" checked></label>' +
        '<div class="row" style="margin-top:4px">' +
          '<input class="input" value="C:\\TMTK\\backups" aria-label="Backup folder">' +
          '<button class="btn small" data-act="inert" data-msg="Folder picker">Browse</button>' +
          '<button class="btn small" data-act="inert" data-msg="Opening the folder">Open</button>' +
        '</div>'
      ) +
      card('Prerequisites', '',
        '<div class="hint">A write path would need all of the following. None are present:</div>' +
        '<ul class="hint" style="margin:7px 0 0 16px;padding:0">' +
          '<li>BROM handshake bytes, per SoC</li>' +
          '<li>tunnel + activate sequence</li>' +
          '<li>FDL1/FDL2 loader pair for the SoC</li>' +
          '<li>read / write / erase command templates</li>' +
          '<li>per-SoC exec addresses</li>' +
        '</ul>' +
        '<div class="field" style="margin-top:10px"><label style="min-width:52px">Result</label>' +
          '<span class="badge warn">5 of 5 missing</span></div>'
      ) +
      card('FDL kit — loaders on disk', '',
        '<div class="row" style="margin-top:2px">' +
          '<input class="input" value="C:\\TMTK\\fdl" aria-label="FDL kit folder">' +
          '<button class="btn small" data-act="spd-fdl">Inspect</button>' +
        '</div>' +
        '<div class="hint" style="margin-top:8px">Identifies an FDL1/FDL2 pair by name and size and prints a SHA-256 per file. Nothing is parsed, no chip id is checked, nothing is executed.</div>' +
        (state.spdKit ? spdKitResult() : ''),
        '<span class="badge dim">NAME-ONLY</span>'
      ) +
      card('Excluded by policy', '',
        '<div class="hint">BootROM <span class="mono">exec_addr</span> stubs and the CVE-2022-38694 class are recorded as <b>Excluded</b>. They stay excluded even when every prerequisite is supplied.</div>' +
        '<div class="row" style="margin-top:9px"><button class="btn small" data-act="inert" data-msg="Excluded technique">Why?</button></div>'
      );
  }

  function spdKitResult() {
    var k = state.spdKit;
    if (k.state === 'missing') {
      return '<div class="refusal" style="margin-top:9px"><b>Kit incomplete.</b> No FDL2 candidate in that folder. ' +
             'A pair is required; one loader is not a kit.</div>';
    }
    return '<div class="note-box" style="margin-top:9px">' +
      '<b>Pair detected</b> — name-based only.<br>' +
      '<span class="mono" style="font-size:10.5px">fdl1-sign.bin · 32,768 B · ' + k.h1 + '</span><br>' +
      '<span class="mono" style="font-size:10.5px">fdl2.bin · 65,536 B · ' + k.h2 + '</span><br>' +
      '<span style="color:#5a5a5a">No chip id checked. No signature verified. Nothing executed.</span></div>';
  }

  function card(title, aside, body, asideHtml) {
    return '<div class="card">' +
      '<div class="card-head">' +
        '<span class="card-title">' + esc(title) + '</span>' +
        (asideHtml || (aside ? '<span class="card-aside">' + esc(aside) + '</span>' : '')) +
      '</div>' + body + '</div>';
  }

  function select(id, options, current, cls) {
    return '<select class="select ' + (cls || '') + '" id="' + id + '">' +
      options.map(function (o) {
        return '<option' + (o === current ? ' selected' : '') + '>' + esc(o) + '</option>';
      }).join('') + '</select>';
  }

  // ── Panel tabs ───────────────────────────────────────────────────────────
  function renderPanelTabs() {
    var list = PANELS[state.ws];
    $('#panels').innerHTML = list.map(function (p) {
      var on = state.panel[state.ws] === p;
      return '<button class="p-tab' + (on ? ' is-on' : '') + '" role="tab" aria-selected="' + on +
        '" data-act="panel" data-p="' + esc(p) + '">' + esc(p) + '</button>';
    }).join('');
  }

  // ── Panel body ───────────────────────────────────────────────────────────
  function renderPanel() {
    var body = $('#panelBody');
    var p = state.panel[state.ws];
    var fn = {
      Log: panelLog, Partitions: panelPartitions, Bootloader: panelBootloader,
      Support: panelSupport, Models: panelModels, Verdicts: panelVerdicts,
      Catalogue: panelCatalogue, Transport: panelTransport
    }[p];
    body.innerHTML = fn ? fn() : '';
    if (p === 'Log') renderLogList();
  }

  // Log ──────────────────────────────────────────────────────────────────────
  function panelLog() {
    return '' +
      '<div class="panel-head"><h2>Log</h2><span class="sub">' +
        state.log.length + ' shown · this session only</span></div>' +
      '<div class="log-tools">' +
        '<button class="btn" data-act="inert" data-msg="Diagnostics dump">Diag</button>' +
        '<button class="btn" data-act="inert" data-msg="Saving a log file">Save log</button>' +
        '<button class="btn" data-act="log-clear">Clear</button>' +
      '</div>' +
      '<div class="log" id="logList"></div>' +
      '<div class="hint" style="margin-top:9px">Shows what happened, step by step. The real build writes technical detail to the saved log; this mock-up only keeps it in memory.</div>';
  }

  function renderLogList() {
    var el = $('#logList');
    if (!el) return;
    if (!state.log.length) {
      el.innerHTML = '<div class="ln"><span class="t">--:--:--</span>' +
        '<span class="lv INFO">INFO</span><span class="m">Nothing yet. Press Connect.</span></div>';
      return;
    }
    el.innerHTML = state.log.map(function (e) {
      return '<div class="ln' + (e.level === 'ERR' ? ' err' : '') + '">' +
        '<span class="t">' + e.t + '</span>' +
        '<span class="lv ' + e.level + '">' + e.level + '</span>' +
        '<span class="m">' + esc(e.msg) + '</span></div>';
    }).join('');
    el.scrollTop = el.scrollHeight;
  }

  // Partitions (MTK) ────────────────────────────────────────────────────────
  function panelPartitions() {
    if (state.ws === 'spd') return panelSpdPartitions();

    if (!state.connected) {
      return '<div class="panel-head"><h2>Partitions</h2></div>' +
        emptyState('No GPT yet', 'Connect a phone to read the partition table. Nothing is assumed before the table is read.');
    }

    var sel = Object.keys(state.selected).filter(function (k) { return state.selected[k]; });
    var rows = D.partitions.map(function (p) {
      var on = !!state.selected[p.name];
      return '<tr class="' + (on ? 'is-sel' : '') + '">' +
        '<td><input type="checkbox" data-act="part-toggle" data-name="' + esc(p.name) + '"' +
          (on ? ' checked' : '') + ' aria-label="Select ' + esc(p.name) + '"></td>' +
        '<td class="mono">' + esc(p.name) + '</td>' +
        '<td class="num">' + esc(p.size) + '</td>' +
        '<td class="mono">' + esc(p.kind) + '</td>' +
        '<td class="num">0x' + p.start.toString(16).toUpperCase() + '</td>' +
      '</tr>';
    }).join('');

    return '' +
      '<div class="panel-head"><h2>Partitions</h2><span class="sub">' +
        D.partitions.length + ' slots · synthetic layout for the demo</span></div>' +
      '<div class="row" style="margin-bottom:9px">' +
        '<input class="input" placeholder="Find a partition…" data-act="filter" aria-label="Find a partition">' +
      '</div>' +
      '<div class="table-wrap"><table class="table">' +
        '<thead><tr><th style="width:28px"></th><th>NAME</th><th class="num">SIZE</th>' +
        '<th>KIND</th><th class="num">START</th></tr></thead>' +
        '<tbody>' + rows + '</tbody></table></div>' +
      '<div class="field" style="margin-top:10px"><label style="min-width:54px">Save to</label>' +
        '<input class="input" value="C:\\TMTK\\images" aria-label="Folder for images">' +
        '<button class="btn small" data-act="inert" data-msg="Folder picker">Browse</button>' +
      '</div>' +
      '<div class="row">' +
        '<button class="btn grow inert" data-act="part-read" ' + (sel.length ? '' : 'disabled') + '>' +
          'Read selected (' + sel.length + ')</button>' +
        '<button class="btn grow inert" data-act="inert" data-msg="Exporting an image">Export</button>' +
        '<button class="btn grow inert" data-act="inert" data-msg="Restoring an image">Restore</button>' +
        '<button class="btn grow inert" data-act="inert" data-msg="Erasing a partition">Erase</button>' +
      '</div>' +
      '<div class="hint" style="margin-top:9px">Write paths are inert in this mock-up. In the real build every write is preceded by a backup manifest with SHA-256 hashes and followed by a byte-for-byte read-back.</div>';
  }

  function panelSpdPartitions() {
    var enc = state.pacOpen ? D.partitions.slice(0, 4) : [];
    return '' +
      '<div class="panel-head"><h2>Partition manager</h2><span class="sub">PAC container · plan only</span></div>' +
      '<div class="banner"><span class="ico">▲</span><div><strong>PLAN ONLY — NO TRANSPORT.</strong> ' +
        'The tool can read a PAC archive and produce a flash plan. It cannot reach a device.</div></div>' +
      '<div class="row">' +
        '<button class="btn grow" data-act="spd-pac">' + (state.pacOpen ? 'Reload sample.pac' : 'Load a .pac') + '</button>' +
        '<button class="btn grow inert" data-act="inert" data-msg="Extracting payloads">Extract</button>' +
        '<button class="btn grow inert" data-act="inert" data-msg="Flashing a PAC">Flash</button>' +
      '</div>' +
      (state.pacOpen
        ? '<div class="panel-head" style="margin-top:12px"><h2>Flash plan</h2><span class="sub">BP_R2.0 · 4 entries · sample container</span></div>' +
          '<div class="table-wrap"><table class="table">' +
          '<thead><tr><th>NAME</th><th>FILE</th><th class="num">SIZE</th><th class="num">OFFSET</th></tr></thead><tbody>' +
          [['fdl1', 'fdl1-sign.bin', '32,768 B', '0x400'],
           ['fdl2', 'fdl2.bin', '65,536 B', '0x8400'],
           ['boot', 'boot.img', '32 MB', '0x18400'],
           ['nvdata', 'nvdata.img', '4 MB', '0x2018400']].map(function (r) {
            return '<tr><td class="mono">' + r[0] + '</td><td class="mono">' + r[1] +
              '</td><td class="num">' + r[2] + '</td><td class="num">' + r[3] + '</td></tr>';
          }).join('') +
          '</tbody></table></div>' +
          '<div class="hint" style="margin-top:9px">Header size 0x60, entry table at 0x60, stride 0x100. Field meaning beyond name, file, offset and size is an inferred layout, not a vendor specification.</div>'
        : emptyState('No PAC loaded', 'Load a container to see its entries. The demo shows the sample container shape; no payload is read from disk.'));
  }

  // Bootloader (MTK) ────────────────────────────────────────────────────────
  function panelBootloader() {
    var lk = state.lk;
    var head = '' +
      '<div class="panel-head"><h2>Bootloader (LK)</h2><span class="sub">offline analysis of the slot image</span></div>' +
      '<div class="field"><label>Slot</label>' +
        select('slot', ['lk_a', 'lk_b', 'lk'], 'lk_a', 'sel-slot') +
        '<span class="badge ' + (lk.stage === 'idle' ? 'dim' : 'info') + '">' +
          (lk.stage === 'idle' ? 'NOT READ' : lk.stage === 'reading' ? 'READING' : 'ANALYSED') + '</span>' +
      '</div>';

    if (!state.connected) {
      return head + emptyState('No session', 'Connect a phone first. Reading a 2 MB slot takes about 26 minutes over META.');
    }

    var buttons = '<div class="row">' +
      '<button class="btn grow" data-act="lk-find">Find slots</button>' +
      '<button class="btn grow" data-act="lk-check" ' + (lk.level < 1 ? 'disabled' : '') + '>Check phone</button>' +
      '<button class="btn grow" data-act="lk-read" ' + (lk.level < 2 || lk.stage === 'reading' ? 'disabled' : '') + '>Read &amp; analyse</button>' +
      '</div>' +
      '<div class="row">' +
      '<button class="btn grow" data-act="lk-scan" ' + (lk.stage !== 'done' ? 'disabled' : '') + '>Scan methods</button>' +
      '<button class="btn grow inert" data-act="inert" data-msg="Patching the bootloader">Patch bootloader</button>' +
      '</div>';

    var progress = '';
    if (lk.stage === 'reading') {
      var realLeft = 1565 * (1 - lk.pct / 100);
      progress = '<div class="progress">' +
        '<div class="pbar"><i style="width:' + lk.pct + '%"></i></div>' +
        '<div class="plabel"><span>reading lk_a · 2 MB</span>' +
          '<span><span class="pct">' + lk.pct + '</span>% · ' + fmtClock(realLeft) + ' remaining on hardware</span></div>' +
        '<div class="plabel"><span>compressed ×174 for this demo</span><span>1.25 KB/s</span></div>' +
        '</div>';
    }

    var result = '';
    if (lk.stage === 'done') {
      var a = D.lkAnalysis;
      result = '' +
        '<div class="panel-head" style="margin-top:14px"><h2>Analysis</h2>' +
          '<span class="sub">' + a.slot + ' · ' + (a.bytes / 1024 / 1024) + ' MB read in ' + a.readSeconds + ' s</span></div>' +
        '<div class="note-box">' +
          '<b>Architecture</b> ' + a.architecture + ' · <b>Container</b> ' + a.container + '<br>' +
          '<b>Identity</b> ' + a.identity + ' · ' + a.confidence + '% confidence<br>' +
          '<b>Lock-state stores found</b> ' + a.lockStores +
        '</div>' +
        '<div class="refusal" style="margin-top:10px">' +
          '<b>Cannot patch this image.</b> The recovered recipe edits an AArch64 ' +
          '<span class="mono">MOVZ W8,#imm ; STR W8,[Xn]</span> pair. This bootloader is 32-bit ARM, ' +
          'so the patch engine refuses rather than editing the wrong bytes.' +
        '</div>' +
        '<div class="panel-head" style="margin-top:14px"><h2>Unlock methods</h2></div>' +
        a.methods.map(function (m) {
          var cls = m.state === 'USABLE' ? 'usable' :
                    m.state === 'ALREADY DONE' ? 'done' :
                    m.state === 'BLOCKED' ? 'blocked' : 'notfor';
          return '<div class="m-item"><div class="m-top">' +
            '<span class="m-name">' + esc(m.name) + '</span>' +
            '<span class="state ' + cls + '">' + esc(m.state) + '</span></div>' +
            '<div class="m-sum">' + esc(m.why) + '</div>' +
            '<div class="m-det"><span class="lbl">Next:</span> <span class="need">' + esc(m.next) + '</span></div>' +
            '</div>';
        }).join('') +
        '<div class="panel-head" style="margin-top:14px"><h2>ARM32 candidates</h2>' +
          '<span class="sub">ranked by marker proximity · alternatives, not a set</span></div>' +
        '<div class="table-wrap" style="max-height:220px"><table class="table">' +
          '<thead><tr><th>OFFSET</th><th>BYTES</th><th>NOTE</th></tr></thead><tbody>' +
          a.candidates.map(function (c, i) {
            return '<tr' + (i === 0 ? ' class="is-sel"' : '') + '><td class="mono">' + c.offset +
              '</td><td class="mono">' + c.hex + '</td><td style="color:#9a9a9a">' + esc(c.note) + '</td></tr>';
          }).join('') +
        '</tbody></table></div>' +
        '<div class="hint" style="margin-top:9px">616 encoding matches collapsed to 4 survivors. ' +
          'Only the selected site is ever written — there is no batch apply on ARM32.</div>';
    }

    return head + buttons + progress + result;
  }

  // Support ─────────────────────────────────────────────────────────────────
  function panelSupport() {
    return '' +
      '<div class="panel-head"><h2>Proven support</h2><span class="sub">what is measured, and what is not</span></div>' +
      '<div class="note-box" style="margin-top:0">' +
        '<b>14 verified operations</b> on MediaTek and Unisoc offline work, plus one measured device ' +
        '(Infinix X6728 · MT6769 · eMMC). Everything else is stated as unsupported rather than implied.' +
      '</div>' +
      '<div class="panel-head" style="margin-top:14px"><h2>Verified</h2>' +
        '<span class="badge ok">' + D.verified.length + '</span></div>' +
      '<div class="table-wrap" style="max-height:250px"><table class="table"><tbody>' +
        D.verified.map(function (v) {
          return '<tr><td style="width:70%">' + esc(v[0]) + '</td><td class="mono">' + esc(v[1]) + '</td></tr>';
        }).join('') +
      '</tbody></table></div>' +
      '<div class="panel-head" style="margin-top:14px"><h2>Not supported</h2>' +
        '<span class="badge bad">' + D.unsupported.length + '</span></div>' +
      '<div class="table-wrap" style="max-height:210px"><table class="table"><tbody>' +
        D.unsupported.map(function (v) {
          return '<tr><td style="width:52%">' + esc(v[0]) + '</td>' +
            '<td style="color:#9a9a9a">' + esc(v[1]) + '</td></tr>';
        }).join('') +
      '</tbody></table></div>';
  }

  // Models ──────────────────────────────────────────────────────────────────
  function panelModels() {
    var isSpd = state.ws === 'spd';
    var engines = isSpd
      ? [['autobl', 'AUTO BL'], ['fdl', 'FDL unlock'], ['partition', 'Partition / PAC']]
      : [['lkPatch', 'LK patch'], ['readyBl', 'Ready bootloader']];

    var active = engines.some(function (e) { return e[0] === state.engineView; })
      ? state.engineView : engines[0][0];
    state.engineView = active;

    var list = D.models[active] || [];
    var engineTabs = '<div class="row" style="margin-bottom:10px">' +
      engines.map(function (e) {
        return '<button class="btn small grow' + (e[0] === active ? ' primary' : '') +
          '" data-act="engine" data-engine="' + e[0] + '">' + esc(e[1]) + '</button>';
      }).join('') + '</div>';

    var grid = '<div class="token-grid">' + list.map(function (m) {
      var claims = claimsFor(m.token);
      var shared = claims.length > 1;
      return '<button class="token' + (state.selToken === m.token ? ' is-sel' : '') +
        '" data-act="model-pick" data-token="' + esc(m.token) + '">' +
        '<span class="tk">' + esc(m.token) + '</span>' +
        (m.name ? '<span class="nm">' + esc(m.name) + '</span>' : '<span class="nm">&nbsp;</span>') +
        (m.keying !== 'token' ? '<span class="key-chip">' + esc(keyingLabel(m)) + '</span>' : '') +
        (shared ? '<span class="key-chip" style="color:#c4553d;border-color:rgba(196,85,61,.4)">SHARED</span>' : '') +
        '</button>';
    }).join('') + '</div>';

    return '' +
      '<div class="panel-head"><h2>' + (isSpd ? 'SPD' : 'MTK') + ' model matrix</h2>' +
        '<span class="sub">' + list.length + ' tokens in this list</span></div>' +
      engineTabs +
      (isSpd
        ? '<div class="banner"><span class="ico">▲</span><div><strong>The SPD lists are data.</strong> ' +
          'They describe coverage, not a working transport. The offline side is in active development; ' +
          'no BROM/FDL path is implemented yet.</div></div>'
        : '') +
      grid +
      '<div class="resolver" id="resolver">' + (state.selToken ? resolverHtml(state.selToken) : '') + '</div>' +
      '<div class="hint" style="margin-top:12px">' +
        'A token never implies an engine on its own. Click one to see every list that claims it.</div>';
  }

  function keyingLabel(m) {
    if (m.keying === 'patch') return 'MODEL + PATCH';
    if (m.keying === 'soc+storage') return 'SoC + STORAGE';
    if (m.keying === 'soc+dram') return 'SoC + DRAM';
    return 'TOKEN';
  }

  function claimsFor(token) {
    var out = [];
    Object.keys(D.models).forEach(function (listKey) {
      var hit = (D.models[listKey] || []).filter(function (e) {
        return e.token.toUpperCase() === token.toUpperCase();
      })[0];
      if (hit) out.push({ list: listKey, entry: hit });
    });
    return out;
  }

  function resolverHtml(token) {
    var claims = claimsFor(token);
    var entry = claims.length ? claims[0].entry : null;

    if (!claims.length) {
      return '<div class="refusal"><b>Unknown token.</b> ' + esc(token) +
        ' is in none of the lists. That is the honest answer — there is no nearest-match guess.</div>';
    }

    var rows = claims.map(function (c) {
      var e = ENGINE_LABEL[c.list];
      return '<div class="claim' + (claims.length === 1 ? ' primary' : '') + '">' +
        '<span class="eng">' + esc(e.name) + '</span>' +
        '<span class="why">' + esc(e.human) + ' · ' + esc(e.ws) + '</span></div>';
    }).join('');

    var keyNote = entry && entry.keying !== 'token'
      ? '<div class="hint" style="margin-top:7px">Keyed to <b>' + esc(keyingLabel(entry)) + '</b>' +
        (entry.storage ? ' — ' + esc(entry.storage) : '') + '. A sibling token is a different target.</div>'
      : '';

    if (claims.length > 1) {
      return '<div class="panel-head" style="margin-top:4px"><h2>' + esc(token) + '</h2>' +
        '<span class="sub">' + claims.length + ' engines claim this token</span></div>' +
        rows + keyNote +
        '<div class="refusal"><b>The tool will not pick.</b> Every engine above is shown; ' +
          'a wrong pick is what kills a phone. Choose the path you are on in the real build — ' +
          'this mock-up only records the choice.</div>';
    }

    return '<div class="panel-head" style="margin-top:4px"><h2>' + esc(token) + '</h2>' +
      '<span class="sub">single claimant</span></div>' + rows + keyNote +
      '<div class="answer">Only one engine claims this token, so there is no ambiguity to resolve.</div>';
  }

  // Verdicts ────────────────────────────────────────────────────────────────
  function panelVerdicts() {
    var works = (D.spdWorks || []).map(function (w) {
      var cls = w.status === 'Tested' ? 'info' : 'violet';
      return '<div class="m-item" style="border-left:3px solid rgba(76,175,125,.5)">' +
        '<div class="m-top"><span class="m-id">' + esc(w.id) + '</span>' +
        '<span class="m-name">' + esc(w.name) + '</span>' +
        '<span class="badge ' + cls + '">' + esc(w.status) + '</span></div>' +
        '<div class="m-sum">' + esc(w.detail) + '</div></div>';
    }).join('');

    return '' +
      '<div class="panel-head"><h2>Unisoc method verdicts</h2>' +
        '<span class="sub">' + D.verdicts.length + ' evaluated · offline only</span></div>' +
      '<div class="banner"><span class="ico">▲</span><div><strong>SPD is in active development.</strong> ' +
        'Offline, file-side features work today. More is being added; the transport is not there yet.</div></div>' +
      '<div class="panel-head"><h2>Working today — offline</h2>' +
        '<span class="badge ok">' + (D.spdWorks || []).length + '</span></div>' +
      works +
      '<div class="panel-head" style="margin-top:16px"><h2>Evaluated against a PAC or a folder</h2>' +
        '<span class="sub">no device is contacted, because there is no way to contact one</span></div>' +
      D.verdicts.map(function (v) {
        return '<div class="v-card ' + v.state + '">' +
          '<div class="v-top"><span class="v-id">' + esc(v.id) + '</span>' +
          '<span class="v-state">' + esc(v.state) + '</span></div>' +
          '<div class="v-why">' + esc(v.why) + '</div></div>';
      }).join('') +
      '<div class="hint" style="margin-top:11px">Ten further methods are <b>NotImplemented</b> ' +
        'because their prerequisites are missing. The catalogue names the artifact each one needs.</div>';
  }

  // Catalogue ───────────────────────────────────────────────────────────────
  function panelCatalogue() {
    var all = state.ws === 'spd' ? D.methods.spd : D.methods.meta;
    var counts = {};
    all.forEach(function (m) { counts[m.status] = (counts[m.status] || 0) + 1; });

    var filtered = state.catalogueFilter === 'all'
      ? all : all.filter(function (m) { return m.status === state.catalogueFilter; });

    var filters = ['all', 'Verified', 'Tested', 'Reconstructed', 'Claimed', 'Placeholder', 'Hypothesis', 'Excluded']
      .filter(function (f) { return f === 'all' || counts[f]; });

    return '' +
      '<div class="panel-head"><h2>' + (state.ws === 'spd' ? 'Unisoc' : 'MediaTek') + ' method catalogue</h2>' +
        '<span class="sub">' + all.length + ' of ' + all.length + ' · status is enforced by tests</span></div>' +
      '<div class="row" style="margin-bottom:10px;flex-wrap:wrap">' +
        filters.map(function (f) {
          var n = f === 'all' ? all.length : counts[f];
          return '<button class="btn small' + (state.catalogueFilter === f ? ' primary' : '') +
            '" data-act="cat-filter" data-f="' + f + '">' + esc(f === 'all' ? 'All' : f) + ' ' + n + '</button>';
        }).join('') +
      '</div>' +
      filtered.map(function (m) { return methodRow(m); }).join('');
  }

  function methodRow(m) {
    var cls = { Verified: 'ok', Tested: 'info', Reconstructed: 'violet', Claimed: 'teal',
                Placeholder: 'warn', Hypothesis: 'dim', Excluded: 'bad' }[m.status] || 'dim';
    var open = state.openMethod === m.id;
    var detail = '';
    if (open) {
      detail = '<div class="m-det">' +
        (m.blocker ? '<div><span class="lbl">Blocker:</span> <span class="blk">' + esc(m.blocker) + '</span></div>' : '') +
        (m.needed ? '<div style="margin-top:5px"><span class="lbl">Evidence needed:</span> ' +
          '<span class="need">' + esc(m.needed) + '</span></div>' : '') +
        '<div style="margin-top:5px"><span class="lbl">Evidence:</span> ' + esc(m.evidence) + '</div>' +
        '<div style="margin-top:5px"><span class="lbl">Changes device:</span> ' +
          (m.changes ? 'yes' : 'no') + ' · <span class="lbl">Adopted:</span> ' + (m.adopted ? 'yes' : 'no') + '</div>' +
        '</div>';
    }
    return '<div class="m-item">' +
      '<div class="m-top">' +
        '<span class="m-id">' + esc(m.id) + '</span>' +
        '<span class="m-name">' + esc(m.name) + '</span>' +
        '<span class="badge ' + cls + '">' + esc(m.status) + '</span>' +
        '<button class="btn small" data-act="m-open" data-id="' + esc(m.id) + '">' +
          (open ? 'Hide' : 'Details') + '</button>' +
      '</div>' +
      '<div class="m-sum">' + esc(m.summary) + '</div>' + detail +
      '</div>';
  }

  // Transport ───────────────────────────────────────────────────────────────
  function panelTransport() {
    var groups = [];
    D.transport.forEach(function (k) {
      if (groups.indexOf(k.group) < 0) groups.push(k.group);
    });
    return '' +
      '<div class="panel-head"><h2>Recovered Unisoc transport schema</h2>' +
        '<span class="sub">' + D.transport.length + ' keys · 0 values</span></div>' +
      '<div class="banner bad"><span class="ico">▲</span><div><strong>This is a schema, not a protocol.</strong> ' +
        'The key names were recovered; none of their values were.</div></div>' +
      groups.map(function (g) {
        return '<div class="group-title">' + esc(g) + '</div>' +
          D.transport.filter(function (k) { return k.group === g; }).map(function (k) {
            return '<div class="k-row"><span class="k-name">' + esc(k.key) + '</span>' +
              '<span class="k-mean">' + esc(k.meaning) + '</span>' +
              '<span class="k-val">value not recovered</span></div>';
          }).join('');
      }).join('') +
      '<div class="panel-head" style="margin-top:16px"><h2>Still missing before a transport can be written</h2></div>' +
      '<ul class="hint" style="margin:6px 0 0 16px;padding:0">' +
        '<li>Per-SoC exec addresses</li>' +
        '<li>The baud-switch sequence</li>' +
        '<li>Handshake and tunnel command bytes</li>' +
        '<li>Read / write / erase templates with framing and checksum</li>' +
      '</ul>' +
      '<div class="refusal" style="margin-top:11px"><b>Anything built from this list alone would be invention.</b> ' +
        'The honest use of it is planning: it names the fields a future descriptor must define.</div>';
  }

  function emptyState(title, body) {
    return '<div class="note-box" style="text-align:center;padding:34px 18px;margin-top:6px">' +
      '<div style="font-size:13px;font-weight:600;color:#c8c8c8;margin-bottom:7px">' + esc(title) + '</div>' +
      '<div class="hint" style="max-width:430px;margin:0 auto">' + esc(body) + '</div></div>';
  }

  // ── Simulated actions ────────────────────────────────────────────────────
  function doConnect() {
    if (state.busy) return;
    state.busy = true;
    renderLeft();
    log('INFO', 'Opening ' + state.port + ' at ' + state.baud + ' baud.');
    setTimeout(function () {
      log('INFO', 'Port open. Waiting for a device — no response yet.');
      setTimeout(function () {
        log('OK', 'META handshake accepted (simulated). 55 00 0C 66 … in the real build.');
        setTimeout(function () {
          state.busy = false;
          state.connected = true;
          state.lk = { stage: 'idle', pct: 0, level: 0 };
          renderLeft();
          renderPanel();
          log('OK', 'Session up. Reads run at about 1.25 KB/s.');
          toast('Connected (simulated). Nothing was opened.');
        }, 700);
      }, 900);
    }, 700);
  }

  function doDisconnect() {
    state.connected = false;
    state.busy = false;
    state.selected = {};
    state.lk = { stage: 'idle', pct: 0, level: 0 };
    state.model = null;
    renderLeft();
    renderPanel();
    log('WARN', 'Session closed. No device was ever opened.');
  }

  function doReadModel() {
    if (!state.connected) {
      toast('Connect first — the demo has no device identity to read.');
      log('WARN', 'Read model refused: no session.');
      return;
    }
    log('INFO', 'Reading identity properties (simulated).');
    setTimeout(function () {
      state.model = 'X6728B · MTK · arm32';
      renderLeft();
      log('OK', 'Identity: X6728B · MTK6769 · ARM32 · eMMC.');
      log('INFO', 'Resolved to MtkLkFilePatch (LK file patch). Shared with 1 other engine — operator confirms.');
    }, 1100);
  }

  function doReadGpt() {
    if (!state.connected) {
      toast('Connect first — the GPT cannot be read from nothing.');
      log('WARN', 'Read GPT refused: no session.');
      return;
    }
    state.panel.mtk = 'Partitions';
    renderPanelTabs();
    renderPanel();
    log('OK', 'GPT parsed: ' + D.partitions.length + ' entries (synthetic layout).');
  }

  function doLkFind() {
    state.lk.level = Math.max(state.lk.level, 1);
    renderPanel();
    log('OK', 'Slots found: lk_a, lk_b — 2048 KB each.');
  }

  function doLkCheck() {
    state.lk.level = Math.max(state.lk.level, 2);
    renderPanel();
    log('INFO', 'Probing the first 128 KB of lk_a (~2 min on hardware, instant here).');
    setTimeout(function () {
      log('OK', 'Architecture ARM32 / Thumb · container raw · lock stores 0.');
    }, 900);
  }

  function doLkRead() {
    if (state.lk.stage === 'reading') return;
    state.lk.stage = 'reading';
    state.lk.pct = 0;
    renderPanel();
    log('INFO', 'Reading lk_a: 2 MB at ~1.25 KB/s. Estimate 26 minutes on hardware.');

    var t0 = Date.now(), dur = 9000;
    var iv = setInterval(function () {
      var p = Math.min(1, (Date.now() - t0) / dur);
      state.lk.pct = Math.round(p * 100);
      var bar = $('.pbar > i');
      var pct = $('.pct');
      var lab = $('.plabel span:last-child');
      if (bar) bar.style.width = state.lk.pct + '%';
      if (pct) pct.textContent = state.lk.pct;
      if (lab) lab.textContent = state.lk.pct + '% · ' + fmtClock(1565 * (1 - p)) + ' remaining on hardware';
      if (p >= 1) {
        clearInterval(iv);
        state.lk.stage = 'done';
        state.lk.pct = 100;
        renderPanel();
        log('OK', 'Full read complete. Analysing offline.');
        log('WARN', 'Verdict: UnsupportedArchitecture — the ARM64 recipe does not apply to 32-bit ARM.');
        log('ERR', 'Patch refused. Nothing written.');
      }
    }, 100);
  }

  function doLkScan() {
    log('INFO', 'Rescanning the image already in memory — no phone traffic.');
    setTimeout(function () {
      log('OK', '3 methods evaluated · 0 usable · 1 blocked · 2 not for this phone.');
      toast('Rescan complete — the verdict did not change.');
    }, 650);
  }

  function doSpdFdl() {
    if (state.fdlInspecting) return;
    state.fdlInspecting = true;
    log('INFO', 'Inspecting the folder for an FDL1/FDL2 pair (name-based only).');
    setTimeout(function () {
      state.fdlInspecting = false;
      state.spdKit = {
        state: 'pair',
        h1: 'a1f4' + Math.random().toString(16).slice(2, 10) + '…',
        h2: '7b02' + Math.random().toString(16).slice(2, 10) + '…'
      };
      renderLeft();
      log('OK', 'Pair detected: fdl1-sign.bin 32,768 B + fdl2.bin 65,536 B.');
      log('WARN', 'Name-based identification only. This does not move SPD-03 or SPD-04.');
    }, 800);
  }

  function doPac() {
    state.pacOpen = true;
    renderPanel();
    log('OK', 'sample.pac — BP_R2.0 header, 4 entries, byte-exact extraction available.');
    log('WARN', 'Plan only: there is no transport to flash through.');
  }

  // ── Event wiring ─────────────────────────────────────────────────────────
  document.addEventListener('click', function (ev) {
    var el = ev.target.closest('[data-act]');
    if (!el) return;
    var act = el.getAttribute('data-act');

    switch (act) {
      case 'ws':
        if (state.ws === el.getAttribute('data-ws')) return;
        state.ws = el.getAttribute('data-ws');
        $$('.ws-tab').forEach(function (b) {
          var on = b.getAttribute('data-ws') === state.ws;
          b.classList.toggle('is-on', on);
          b.setAttribute('aria-selected', on);
        });
        state.selToken = null;
        state.engineView = state.ws === 'spd' ? 'autobl' : 'lkPatch';
        renderLeft();
        renderPanelTabs();
        renderPanel();
        break;

      case 'panel':
        state.panel[state.ws] = el.getAttribute('data-p');
        renderPanelTabs();
        renderPanel();
        break;

      case 'connect':     doConnect(); break;
      case 'disconnect':  doDisconnect(); break;
      case 'openport':
        toast('Port already opened by Connect (simulated).');
        log('INFO', 'Open port requested — session already up.');
        break;

      case 'readmodel':   doReadModel(); break;

      case 'metacmd':
        var cmd = el.getAttribute('data-cmd');
        if (cmd === 'Read GPT') { doReadGpt(); break; }
        inert(cmd);
        break;

      case 'lk-find':  doLkFind(); break;
      case 'lk-check': doLkCheck(); break;
      case 'lk-read':  doLkRead(); break;
      case 'lk-scan':  doLkScan(); break;

      case 'engine':
        state.engineView = el.getAttribute('data-engine');
        state.selToken = null;
        renderPanel();
        break;

      case 'model-pick':
        var tok = el.getAttribute('data-token');
        state.selToken = (state.selToken === tok) ? null : tok;
        renderPanel();
        break;

      case 'part-toggle':
        var name = el.getAttribute('data-name');
        state.selected[name] = !state.selected[name];
        renderPanel();
        break;

      case 'part-read':
        inert('Reading a partition');
        break;

      case 'cat-filter':
        state.catalogueFilter = el.getAttribute('data-f');
        renderPanel();
        break;

      case 'm-open':
        var id = el.getAttribute('data-id');
        state.openMethod = state.openMethod === id ? null : id;
        renderPanel();
        break;

      case 'spd-fdl': doSpdFdl(); break;
      case 'spd-pac': doPac(); break;

      case 'log-clear':
        state.log = [];
        renderLogList();
        log('INFO', 'Log cleared.');
        break;

      case 'inert':
        inert(el.getAttribute('data-msg') || 'that action');
        break;
    }
  });

  document.addEventListener('change', function (ev) {
    var el = ev.target;
    if (el.id === 'sel-port') state.port = el.value;
    if (el.id === 'sel-baud') state.baud = el.value;
    if (el.id === 'sel-mode') {
      state.mode = el.value.indexOf('Auto') === 0 ? 'auto' : 'manual';
      renderLeft();
      log('INFO', 'Model mode: ' + state.mode + '.');
    }
  });

  // Filter input (client-side, cosmetic)
  document.addEventListener('input', function (ev) {
    if (ev.target.getAttribute('data-act') === 'filter') {
      var q = ev.target.value.toLowerCase();
      $$('#panelBody tbody tr').forEach(function (tr) {
        tr.style.display = tr.textContent.toLowerCase().indexOf(q) >= 0 ? '' : 'none';
      });
    }
  });

  // ── Boot ─────────────────────────────────────────────────────────────────
  function boot() {
    log('INFO', 'Technical detail is on; this session is being kept in memory only.');
    log('DEMO', 'Mock-up build — no device access, no network requests.');
    renderLeft();
    renderPanelTabs();
    renderPanel();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
