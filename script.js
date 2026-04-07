// ══════════════════════════════════
//  DATABASE  (students + attendance records)
//  records = [ { roll, name, dept, date, time } ]
// ══════════════════════════════════
const KEY = 'attendx-simple-v1';
function loadDB() {
  try { return JSON.parse(localStorage.getItem(KEY)) || defDB(); }
  catch(e) { return defDB(); }
}
function defDB() { return { pass: 'teacher123', students: [], records: [] }; }
function save() { localStorage.setItem(KEY, JSON.stringify(DB)); }
let DB = loadDB();

// ══════════════════════════════════
//  NAVIGATION
// ══════════════════════════════════
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('on'));
  document.getElementById(id).classList.add('on');
}

function goTab(id, btn) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('on'));
  document.querySelectorAll('.tnav-btn').forEach(b => b.classList.remove('on'));
  document.getElementById(id).classList.add('on');
  if (btn) btn.classList.add('on');
  if (id === 'tab-dash')     renderDash();
  if (id === 'tab-students') renderStudents();
  if (id === 'tab-scan')     initScanTab();
  if (id === 'tab-records')  initRecords();
}

function goTabByName(id) {
  const btn = [...document.querySelectorAll('.tnav-btn')].find(b => b.getAttribute('onclick').includes(id));
  goTab(id, btn);
}

// ══════════════════════════════════
//  TOAST
// ══════════════════════════════════
function toast(msg, type) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast show' + (type ? ' ' + type : '');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.className = 'toast', 3200);
}

// ══════════════════════════════════
//  AUTH
// ══════════════════════════════════
function openTeacherModal() {
  document.getElementById('teacher-modal').classList.add('on');
  document.getElementById('t-pass').value = '';
  document.getElementById('pass-err').style.display = 'none';
  setTimeout(() => document.getElementById('t-pass').focus(), 120);
}
function closeModal() { document.getElementById('teacher-modal').classList.remove('on'); }

function teacherLogin() {
  const p = document.getElementById('t-pass').value;
  if (p === DB.pass) {
    closeModal();
    showPage('pg-teacher');
    renderDash();
  } else {
    document.getElementById('pass-err').style.display = 'block';
    document.getElementById('t-pass').value = '';
    document.getElementById('t-pass').focus();
  }
}

function logout() {
  stopScan();
  showPage('pg-login');
}

// ══════════════════════════════════
//  DASHBOARD
// ══════════════════════════════════
function renderDash() {
  const todayStr = today();
  document.getElementById('dash-date').textContent = new Date().toLocaleDateString('en-IN', {
    weekday:'long', year:'numeric', month:'long', day:'numeric'
  });
  g('today-label').textContent = todayStr;

  const todayRecs = DB.records.filter(r => r.date === todayStr);
  const presentRolls = new Set(todayRecs.map(r => r.roll));

  g('st-students').textContent = DB.students.length;
  g('st-today').textContent = presentRolls.size;
  g('st-total').textContent = DB.records.length;

  // Today present list
  const dashToday = g('dash-today');
  if (!todayRecs.length) {
    dashToday.innerHTML = '<div class="empty"><span class="ei">📭</span><div class="et">Aaj abhi koi attendance nahi — Scan tab mein jao</div></div>';
  } else {
    const uniqueToday = [...presentRolls].map(roll => {
      const rec = todayRecs.find(r => r.roll === roll);
      return rec;
    });
    dashToday.innerHTML = `<div class="table-wrap"><table>
      <thead><tr><th>#</th><th>ID</th><th>Name</th><th>Time</th></tr></thead>
      <tbody>${uniqueToday.map((r,i) => `
        <tr>
          <td class="td-n">${i+1}</td>
          <td class="td-m">${esc(r.roll)}</td>
          <td style="font-weight:600">${esc(r.name)}</td>
          <td style="color:var(--green)">${r.time}</td>
        </tr>`).join('')}
      </tbody>
    </table></div>`;
  }

  // Absent today
  const dashAbsent = g('dash-absent');
  const absentStudents = DB.students.filter(s => !presentRolls.has(s.roll));
  if (!absentStudents.length && DB.students.length > 0) {
    dashAbsent.innerHTML = '<div class="alert a-ok">✅ Aaj sabhi members present hain!</div>';
  } else if (!DB.students.length) {
    dashAbsent.innerHTML = '<div class="empty"><span class="ei">👥</span><div class="et">Pehle Members tab mein members add karo</div></div>';
  } else {
    dashAbsent.innerHTML = `<div class="table-wrap"><table>
      <thead><tr><th>#</th><th>ID</th><th>Name</th><th>Dept</th></tr></thead>
      <tbody>${absentStudents.map((s,i) => `
        <tr>
          <td class="td-n">${i+1}</td>
          <td class="td-m" style="color:var(--red)">${esc(s.roll)}</td>
          <td style="font-weight:600">${esc(s.name)}</td>
          <td style="color:var(--muted);font-size:0.82rem">${esc(s.dept||'—')}</td>
        </tr>`).join('')}
      </tbody>
    </table></div>`;
  }
}

// ══════════════════════════════════
//  STUDENTS / MEMBERS
// ══════════════════════════════════
function addStudent() {
  const name  = g('s-name').value.trim();
  const roll  = g('s-roll').value.trim().toUpperCase();
  const dept  = g('s-dept').value.trim();
  const phone = g('s-email').value.trim();
  const msg   = g('stu-msg');

  if (!name || !roll) { msg.innerHTML = '<div class="alert a-er">❌ Name aur ID dono required hain</div>'; return; }
  if (DB.students.find(s => s.roll === roll)) { msg.innerHTML = '<div class="alert a-er">⚠️ Yeh ID pehle se registered hai</div>'; return; }

  DB.students.push({ roll, name, dept, phone });
  save();
  msg.innerHTML = `<div class="alert a-ok">✅ ${esc(name)} (${esc(roll)}) successfully registered!</div>`;
  ['s-name','s-roll','s-dept','s-email'].forEach(id => g(id).value = '');
  toast('✅ ' + name + ' added!', 'ok');
  renderStudents();
  renderDash();
}

function renderStudents() {
  const q = (g('stu-srch')?.value || '').toLowerCase();
  const list = DB.students.filter(s =>
    s.roll.toLowerCase().includes(q) ||
    s.name.toLowerCase().includes(q) ||
    (s.dept||'').toLowerCase().includes(q)
  );
  g('stu-c-title').textContent = `All Members (${DB.students.length})`;
  const tb = g('stu-tbody');
  if (!list.length) {
    tb.innerHTML = `<tr><td colspan="6"><div class="empty"><span class="ei">👥</span><div class="et">${DB.students.length ? 'Koi match nahi mila' : 'Abhi koi member registered nahi'}</div></div></td></tr>`;
    return;
  }
  tb.innerHTML = list.map((s, i) => `
    <tr>
      <td class="td-n">${i+1}</td>
      <td class="td-m">${esc(s.roll)}</td>
      <td style="font-weight:600">${esc(s.name)}</td>
      <td style="color:var(--muted);font-size:0.82rem">${esc(s.dept||'—')}</td>
      <td><button class="btn btn-c btn-sm" onclick="showQRModal('${s.roll}')">📱 QR</button></td>
      <td><button class="btn btn-r btn-sm" onclick="removeStu('${s.roll}')">✕</button></td>
    </tr>`).join('');
}

function removeStu(roll) {
  if (!confirm(`Remove ${roll}? Unke attendance records bhi delete honge.`)) return;
  DB.students = DB.students.filter(s => s.roll !== roll);
  DB.records  = DB.records.filter(r => r.roll !== roll);
  save(); renderStudents(); renderDash();
  toast('Member removed', 'er');
}

// ══════════════════════════════════
//  SCAN TAB
// ══════════════════════════════════
let stream = null, loop = null;

function initScanTab() {
  const dateEl = g('scan-date');
  if (!dateEl.value) dateEl.value = today();
  onDateChange();
}

function onDateChange() {
  const d = g('scan-date').value || today();
  g('scan-date-label').textContent = '📅 Date: ' + d;
  renderScanProgress(d);
}

function renderScanProgress(dateStr) {
  const d = dateStr || g('scan-date').value || today();
  const recs = DB.records.filter(r => r.date === d);
  const presentRolls = new Set(recs.map(r => r.roll));
  const absent = DB.students.filter(s => !presentRolls.has(s.roll));
  const ct = g('progress-content');

  if (!DB.students.length) {
    ct.innerHTML = '<div class="empty"><span class="ei">👥</span><div class="et">Pehle Members tab mein members add karo</div></div>';
    return;
  }

  ct.innerHTML = `
    <div style="display:flex;gap:10px;margin-bottom:14px">
      <div class="stat-box sg" style="flex:1;padding:12px;text-align:center">
        <span class="sn" style="font-size:1.5rem">${presentRolls.size}</span>
        <span class="sl">Present</span>
      </div>
      <div class="stat-box" style="flex:1;padding:12px;text-align:center;border-color:rgba(239,68,68,0.2)">
        <span class="sn" style="font-size:1.5rem;color:var(--red)">${absent.length}</span>
        <span class="sl">Absent</span>
      </div>
      <div class="stat-box sc" style="flex:1;padding:12px;text-align:center">
        <span class="sn" style="font-size:1.5rem">${DB.students.length}</span>
        <span class="sl">Total</span>
      </div>
    </div>
    ${absent.length ? `<div style="color:var(--muted);font-size:0.78rem;margin-bottom:6px">❌ Abhi tak absent:</div>
    <div style="display:flex;flex-wrap:wrap;gap:6px">
      ${absent.map(s => `<span class="chip cr">${esc(s.name)}</span>`).join('')}
    </div>` : '<div class="alert a-ok">✅ Sabhi members present mark ho gaye!</div>'}
  `;
}

function startScan() {
  const box = g('scan-box');
  box.style.display = 'block';
  g('scan-start').style.display = 'none';
  g('scan-stop').style.display  = 'inline-flex';
  g('scan-status').textContent  = '🔍 Camera active — QR saamne rakho...';

  navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
    .then(s => {
      stream = s;
      const vid = g('sv');
      vid.srcObject = s;
      vid.play();
      const cv = g('sc');
      loop = setInterval(() => {
        if (vid.readyState < 2) return;
        cv.width  = vid.videoWidth;
        cv.height = vid.videoHeight;
        const ctx = cv.getContext('2d');
        ctx.drawImage(vid, 0, 0);
        const data = ctx.getImageData(0, 0, cv.width, cv.height);
        if (typeof jsQR !== 'undefined') {
          const code = jsQR(data.data, data.width, data.height, { inversionAttempts: 'dontInvert' });
          if (code) {
            processScan(code.data);
            stopScan();
          }
        }
      }, 350);
    })
    .catch(e => {
      g('scan-status').innerHTML = `<span style="color:var(--red)">❌ Camera access nahi mila: ${e.message}</span>`;
      stopScan();
    });
}

function stopScan() {
  clearInterval(loop); loop = null;
  if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
  const box = g('scan-box');
  if (box) box.style.display = 'none';
  const start = g('scan-start'), stop = g('scan-stop');
  if (start) start.style.display = 'inline-flex';
  if (stop)  stop.style.display  = 'none';
}

function scanUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  const res    = g('scan-result');
  const imgURL = URL.createObjectURL(file);
  res.innerHTML = '<div class="alert a-in">⏳ QR dhundh raha hoon...</div>';

  const img = new Image();
  img.onload = () => {
    const c = document.createElement('canvas');
    const scale = Math.max(1, 600 / Math.max(img.width, img.height));
    c.width  = img.width  * scale;
    c.height = img.height * scale;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0, c.width, c.height);
    const data = ctx.getImageData(0, 0, c.width, c.height);
    try {
      if (typeof jsQR !== 'undefined') {
        const code = jsQR(data.data, data.width, data.height, { inversionAttempts: 'attemptBoth' });
        if (code) { processScan(code.data); event.target.value = ''; return; }
      }
    } catch(e) {}
    res.innerHTML = `<div class="alert a-er">❌ <strong>QR detect nahi hua!</strong><br/>
      <div style="font-size:0.78rem;margin-top:8px;line-height:1.9;opacity:.85">
        ✅ Check karo:<br/>
        • QR image clear ho, blur nahi<br/>
        • Poora QR frame capture hua ho<br/>
        • Dobara try karo
      </div></div>`;
  };
  img.onerror = () => { res.innerHTML = '<div class="alert a-er">❌ Image load nahi hui</div>'; };
  img.src = imgURL;
  event.target.value = '';
}

function processScan(raw) {
  const res     = g('scan-result');
  const dateStr = g('scan-date').value || today();

  // Parse QR — format: ATTENDX|ROLL|NAME
  if (!raw.startsWith('ATTENDX|')) {
    res.innerHTML = '<div class="alert a-er">❌ Yeh AttendX ka QR nahi hai</div>';
    return;
  }
  const parts = raw.split('|');
  const roll  = parts[1] || '';
  const name  = parts[2] || '';

  // Check registered
  const stu = DB.students.find(s => s.roll === roll);
  if (!stu) {
    res.innerHTML = `<div class="alert a-er">❌ <strong>${esc(roll)}</strong> registered nahi hai — pehle Members tab mein add karo</div>`;
    toast('❌ Member not found: ' + roll, 'er');
    return;
  }

  // Check duplicate for same date
  const alreadyMarked = DB.records.find(r => r.roll === roll && r.date === dateStr);
  if (alreadyMarked) {
    res.innerHTML = `<div class="alert a-wa">⚠️ <strong>${esc(stu.name)}</strong> ki attendance ${dateStr} ke liye pehle se mark hai (${alreadyMarked.time})</div>`;
    toast('⚠️ Already marked: ' + stu.name, '');
    return;
  }

  // Mark attendance
  const now  = new Date();
  const time = now.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', hour12:true });
  DB.records.push({ roll: stu.roll, name: stu.name, dept: stu.dept || '', date: dateStr, time });
  save();

  res.innerHTML = `<div class="alert a-ok" style="font-size:1rem">
    ✅ <strong>${esc(stu.name)}</strong> — Attendance marked!<br/>
    <span style="font-size:0.8rem;opacity:.8">🎫 ${esc(stu.roll)} &nbsp;·&nbsp; 📅 ${dateStr} &nbsp;·&nbsp; 🕐 ${time}</span>
  </div>`;
  toast('✅ Present: ' + stu.name, 'ok');

  renderScanProgress(dateStr);
  renderDash();
}

// ══════════════════════════════════
//  RECORDS
// ══════════════════════════════════
function initRecords() {
  // Populate member dropdown
  const sel = g('rec-member'), cur = sel.value;
  sel.innerHTML = '<option value="">— Sabhi Members —</option>' +
    DB.students.map(s => `<option value="${s.roll}">${esc(s.name)} (${esc(s.roll)})</option>`).join('');
  if (cur) sel.value = cur;

  // Set date to today if empty
  if (!g('rec-date').value) g('rec-date').value = today();
  renderRecords();
}

function renderRecords() {
  const dateFilter   = g('rec-date').value;
  const memberFilter = g('rec-member').value;

  let all = [...DB.records];
  if (dateFilter)   all = all.filter(r => r.date === dateFilter);
  if (memberFilter) all = all.filter(r => r.roll === memberFilter);
  all.reverse();

  g('rec-stats').textContent = all.length + ' records' + (dateFilter ? ' on ' + dateFilter : '');

  const tb = g('rec-tbody');
  if (!all.length) {
    tb.innerHTML = `<tr><td colspan="6"><div class="empty"><span class="ei">📋</span><div class="et">Is filter ke liye koi record nahi</div></div></td></tr>`;
    g('summary-card').style.display = 'none';
    return;
  }
  tb.innerHTML = all.map((r, i) => `
    <tr>
      <td class="td-n">${i+1}</td>
      <td class="td-m">${esc(r.roll)}</td>
      <td style="font-weight:500">${esc(r.name)}</td>
      <td style="color:var(--muted);font-size:0.82rem">${esc(r.dept||'—')}</td>
      <td style="color:var(--muted)">${r.date}</td>
      <td style="color:var(--muted)">${r.time}</td>
    </tr>`).join('');

  // Summary when date is selected
  if (dateFilter && !memberFilter) {
    const presentRolls = new Set(all.map(r => r.roll));
    const absent = DB.students.filter(s => !presentRolls.has(s.roll));
    const card = g('summary-card');
    card.style.display = 'block';
    g('summary-content').innerHTML = `
      <div style="display:flex;gap:10px;margin-bottom:14px;flex-wrap:wrap">
        <div class="chip cg" style="padding:7px 14px;font-size:0.82rem">✅ Present: ${presentRolls.size}</div>
        <div class="chip cr" style="padding:7px 14px;font-size:0.82rem">❌ Absent: ${absent.length}</div>
        <div class="chip cc" style="padding:7px 14px;font-size:0.82rem">👥 Total: ${DB.students.length}</div>
      </div>
      ${absent.length ? `<div style="color:var(--muted);font-size:0.78rem;margin-bottom:8px">Absent members:</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px">
        ${absent.map(s => `<span class="chip cr">${esc(s.name)}</span>`).join('')}
      </div>` : '<div class="alert a-ok">✅ Is din sabhi members present the!</div>'}
    `;
  } else {
    g('summary-card').style.display = 'none';
  }
}

function exportCSV() {
  const dateFilter   = g('rec-date').value;
  const memberFilter = g('rec-member').value;

  let all = [...DB.records];
  if (dateFilter)   all = all.filter(r => r.date === dateFilter);
  if (memberFilter) all = all.filter(r => r.roll === memberFilter);

  if (!all.length) { toast('No data to export', 'er'); return; }

  const rows = [['Sr','ID/Roll','Name','Department','Date','Time']];
  all.forEach((r,i) => rows.push([i+1, r.roll, r.name, r.dept||'', r.date, r.time]));
  const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(csv);
  a.download = 'attendance_' + (dateFilter || today()) + '.csv';
  a.click();
  toast('📥 CSV exported!', 'ok');
}

// ══════════════════════════════════
//  STUDENT / MEMBER VIEW
// ══════════════════════════════════
function lookupStu() {
  const roll = g('s-roll-inp').value.trim().toUpperCase();
  const err  = g('s-err');
  if (!roll) { err.innerHTML = '<div class="alert a-er">❌ ID / Roll number daalo</div>'; return; }
  const stu = DB.students.find(s => s.roll === roll);
  if (!stu) {
    err.innerHTML = '<div class="alert a-er">❌ Yeh ID registered nahi. Admin se contact karo.</div>';
    return;
  }
  err.innerHTML = '';
  showStudentQR(stu);
}

function showStudentQR(stu) {
  g('sd-name').textContent = stu.name;
  g('sd-roll').textContent = '🎫 ' + stu.roll;
  g('sd-dept').textContent = stu.dept || '';
  const data = 'ATTENDX|' + stu.roll + '|' + stu.name;
  g('s-input').style.display = 'none';
  g('s-qr').style.display    = 'block';
  setTimeout(() => makeQR('sd-canvas', data, 175), 80);
}

function resetStu() {
  g('s-input').style.display = 'block';
  g('s-qr').style.display    = 'none';
  g('s-roll-inp').value      = '';
  g('sd-canvas').innerHTML   = '';
}

function dlQR() {
  const canvas = g('sd-canvas').querySelector('canvas');
  if (!canvas) { toast('QR load ho raha hai, dobara try karo', ''); return; }
  const a = document.createElement('a');
  a.href     = canvas.toDataURL('image/png');
  a.download = 'my_qr_card.png';
  a.click();
  toast('📥 QR Card downloaded!', 'ok');
}

// ══════════════════════════════════
//  SETTINGS
// ══════════════════════════════════
function changePass() {
  const old = g('cp-old').value, nw = g('cp-new').value.trim(), msg = g('cp-msg');
  if (old !== DB.pass) { msg.innerHTML = '<div class="alert a-er">❌ Current password wrong hai</div>'; return; }
  if (nw.length < 4)   { msg.innerHTML = '<div class="alert a-er">❌ Password min 4 characters ka hona chahiye</div>'; return; }
  DB.pass = nw; save();
  msg.innerHTML = '<div class="alert a-ok">✅ Password update ho gaya!</div>';
  g('cp-old').value = ''; g('cp-new').value = '';
  toast('Password updated!', 'ok');
}

function clearAll() {
  if (!confirm('Sab kuch delete ho jaayega — members + records. Sure?')) return;
  if (!confirm('Last chance! Confirm karo.')) return;
  DB = { pass: DB.pass, students: [], records: [] };
  save(); renderDash(); renderStudents();
  toast('All data cleared', 'er');
}

// ══════════════════════════════════
//  QR MODAL
// ══════════════════════════════════
let _qrModalRoll = null;

function makeQR(containerId, text, size) {
  const el = g(containerId);
  el.innerHTML = '';
  return new QRCode(el, {
    text: text,
    width:  size || 190,
    height: size || 190,
    colorDark:  '#000000',
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.M
  });
}

function showQRModal(roll) {
  const stu = DB.students.find(s => s.roll === roll);
  if (!stu) return;
  _qrModalRoll = roll;
  g('qrm-title').textContent = 'QR Card — ' + stu.name;
  g('qrm-name').textContent  = stu.name;
  g('qrm-roll').textContent  = '🎫 ' + stu.roll + (stu.dept ? '  |  ' + stu.dept : '');
  const data = 'ATTENDX|' + stu.roll + '|' + stu.name;
  g('qr-modal').classList.add('on');
  setTimeout(() => makeQR('qrm-canvas', data, 190), 80);

  const waMsg = encodeURIComponent(
    '📌 AttendX QR Card\n👤 ' + stu.name + '\n🎫 ' + stu.roll +
    '\n\nYeh QR save kar lo — admin ko dikhana hoga attendance ke liye.'
  );
  g('qrm-wa').onclick = () => window.open('https://wa.me/?text=' + waMsg, '_blank');
}

function closeQRModal() {
  g('qr-modal').classList.remove('on');
  _qrModalRoll = null;
}

function dlStudentQR() {
  const canvas = g('qrm-canvas').querySelector('canvas');
  if (!canvas) { toast('QR load ho raha hai, dobara try karo', ''); return; }
  const a = document.createElement('a');
  a.href     = canvas.toDataURL('image/png');
  a.download = 'qr_' + (_qrModalRoll || 'member') + '.png';
  a.click();
  toast('📥 QR downloaded!', 'ok');
}

// ══════════════════════════════════
//  HELPERS
// ══════════════════════════════════
function g(id)  { return document.getElementById(id); }
function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function today(){ return new Date().toISOString().split('T')[0]; }

// ── Init ──
window.addEventListener('DOMContentLoaded', () => {
  renderDash();
});
