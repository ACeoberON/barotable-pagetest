/* O-03 좌석도 편집 - 층마다 테이블 구역 나누기
 * 구현: 층 추가 · 이름 변경 · 삭제, 구역 추가 · 이동 · 크기 조절 · 이름/색 변경 · 삭제
 * 고정: 테이블과 시설 배치 (하드코딩)
 */
(function () {
  const $ = s => document.querySelector(s);
  const W = 1000, H = 600, GRID = 10;
  let FL = BT.floors();
  const S = { floor: FL[0].id, zone: null };
  const COLORS = ['teal', 'slate', 'amber', 'indigo', 'coral'];
  let delArm = false;

  const floor = () => FL.find(f => f.id === S.floor);
  const snap = v => Math.round(v / GRID) * GRID;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const pct = (v, b) => (v / b * 100) + '%';
  const place = (el, o) => { el.style.left = pct(o.x, W); el.style.top = pct(o.y, H); el.style.width = pct(o.w, W); el.style.height = pct(o.h, H); };
  const uid = p => p + Math.random().toString(36).slice(2, 7);
  function zoneAt(f, t) {
    const cx = t.x + t.w / 2, cy = t.y + t.h / 2;
    const z = f.zones.slice().reverse().find(z => cx >= z.x && cx <= z.x + z.w && cy >= z.y && cy <= z.y + z.h);
    return z ? z.id : null;
  }
  const regroup = f => f.tables.forEach(t => { t.zone = zoneAt(f, t); });

  /* ---------- 층 ---------- */
  function renderFloors() {
    $('#floor-tabs').innerHTML = FL.map(f => `<button type="button" role="tab" class="tab ${f.id === S.floor ? 'on' : ''}" data-f="${f.id}" aria-selected="${f.id === S.floor}">${BT.esc(f.name)}<span class="count">${f.zones.length}구역</span></button>`).join('');
    document.querySelectorAll('#floor-tabs .tab').forEach(b => b.addEventListener('click', () => { S.floor = b.dataset.f; S.zone = null; delArm = false; render(); }));
    if (document.activeElement !== $('#floor-name')) $('#floor-name').value = floor().name;
    $('#del-floor').disabled = FL.length <= 1;
    $('#del-floor').textContent = delArm ? '한 번 더 누르면 삭제' : '이 층 삭제';
    $('#canvas-title').textContent = floor().name + ' 캔버스';
  }
  $('#floor-name').addEventListener('input', e => { floor().name = e.target.value; renderFloors(); });
  $('#add-floor').addEventListener('click', () => {
    const f = { id: uid('F'), name: (FL.length + 1) + '층', zones: [{ id: uid('z-'), name: '홀', x: 30, y: 36, w: 800, h: 520, color: 'slate' }], fixtures: [{ id: uid('fx'), type: 'stairs', label: '계단', x: 860, y: 36, w: 110, h: 120 }], tables: [] };
    FL.push(f); S.floor = f.id; S.zone = f.zones[0].id; render();
    BT.toast(`${f.name}을 추가했어요. 구역을 나눠 보세요`);
  });
  $('#del-floor').addEventListener('click', () => {
    if (FL.length <= 1) return;
    if (!delArm) { delArm = true; renderFloors(); setTimeout(() => { delArm = false; renderFloors(); }, 3000); return; }
    FL = FL.filter(f => f.id !== S.floor); S.floor = FL[0].id; S.zone = null; delArm = false; render();
  });

  /* ---------- 구역 추가 ---------- */
  $('#add-zone').addEventListener('click', () => {
    const f = floor(), n = f.zones.length;
    const z = { id: uid('z-'), name: '새 구역 ' + (n + 1), x: 300 + (n % 4) * 30, y: 200 + (n % 4) * 30, w: 260, h: 180, color: COLORS[n % COLORS.length] };
    f.zones.push(z); S.zone = z.id; regroup(f); render();
  });

  /* ---------- 캔버스 ---------- */
  function renderCanvas() {
    const f = floor(), host = $('#canvas'); host.innerHTML = '';
    const cv = document.createElement('div'); cv.className = 'map-canvas'; cv.setAttribute('aria-label', f.name + ' 편집 캔버스');
    f.zones.forEach(z => {
      const sel = S.zone === z.id;
      const el = document.createElement('div'); el.className = `map-zone zone-${z.color} ed-item ${sel ? 'ed-sel' : ''}`; place(el, z);
      const rule = [z.minParty ? z.minParty + '인 이상' : '', z.maxParty ? z.maxParty + '인 이하' : ''].filter(Boolean).join(' · ');
      el.innerHTML = `<span class="zone-label">${BT.esc(z.name)}${rule ? ' <em>' + rule + '</em>' : ''}</span>${sel ? '<span class="ed-handle" data-resize="1"></span>' : ''}`;
      bindDrag(el, z); cv.appendChild(el);
    });
    f.fixtures.forEach(x => {
      const el = document.createElement('div'); el.className = `map-fixture fx-${x.type}`; place(el, x);
      el.style.pointerEvents = 'none';
      if (x.label) el.innerHTML = `<span>${BT.esc(x.label)}</span>`;
      cv.appendChild(el);
    });
    f.tables.forEach(t => {
      const el = document.createElement('div'); el.className = `map-table shape-${t.shape} st-available`; place(el, t);
      el.style.pointerEvents = 'none';
      el.innerHTML = `<strong>${BT.esc(t.id)}</strong><span>${t.seats}인</span>`;
      cv.appendChild(el);
    });
    cv.addEventListener('pointerdown', e => { if (e.target === cv) { S.zone = null; render(); } });
    host.appendChild(cv);
  }
  function bindDrag(el, z) {
    el.addEventListener('pointerdown', e => {
      e.stopPropagation();
      const resize = !!e.target.dataset.resize;
      if (S.zone !== z.id) { S.zone = z.id; render(); return; }
      const rect = el.parentElement.getBoundingClientRect();
      const sx = e.clientX, sy = e.clientY, o = { x: z.x, y: z.y, w: z.w, h: z.h };
      el.setPointerCapture(e.pointerId);
      const move = ev => {
        const dx = (ev.clientX - sx) / rect.width * W, dy = (ev.clientY - sy) / rect.height * H;
        if (resize) { z.w = clamp(snap(o.w + dx), 40, W - z.x); z.h = clamp(snap(o.h + dy), 40, H - z.y); }
        else { z.x = clamp(snap(o.x + dx), 0, W - z.w); z.y = clamp(snap(o.y + dy), 0, H - z.h); }
        place(el, z);
      };
      const up = () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); regroup(floor()); render(); };
      el.addEventListener('pointermove', move); el.addEventListener('pointerup', up);
    });
  }

  /* ---------- 구역 목록 / 속성 ---------- */
  function renderSide() {
    const f = floor(), p = $('#props');
    $('#zone-chips').innerHTML = f.zones.map(z => `<button type="button" class="chip ${S.zone === z.id ? 'on' : ''}" data-z="${z.id}"><span class="zone-swatch sw-${z.color}"></span>${BT.esc(z.name)} <span class="faint">${f.tables.filter(t => t.zone === z.id).length}</span></button>`).join('');
    document.querySelectorAll('#zone-chips [data-z]').forEach(b => b.addEventListener('click', () => { S.zone = b.dataset.z; render(); }));
    const z = f.zones.find(x => x.id === S.zone);
    if (!z) {
      p.innerHTML = `<h2 style="font-size:16px">${BT.esc(f.name)} 구역</h2>
        <div class="zone-list">${f.zones.map(z => `<div class="zone-item" data-z="${z.id}" tabindex="0"><span class="zone-swatch sw-${z.color}"></span>${BT.esc(z.name)}<span class="cnt">테이블 ${f.tables.filter(t => t.zone === z.id).length}</span></div>`).join('') || '<p class="muted">아직 구역이 없어요. 왼쪽에서 구역을 추가하세요.</p>'}</div>
        <p class="hint">구역을 클릭해 선택한 뒤 끌어서 옮기고, 오른쪽 아래 모서리로 크기를 바꿉니다. 테이블은 놓인 구역에 자동으로 묶입니다.</p>`;
      p.querySelectorAll('[data-z]').forEach(el => el.addEventListener('click', () => { S.zone = el.dataset.z; render(); }));
      return;
    }
    const inside = f.tables.filter(t => t.zone === z.id);
    p.innerHTML = `<div class="row" style="justify-content:space-between"><h2 style="font-size:16px">구역 속성</h2><span class="badge badge-indigo">${BT.esc(f.name)}</span></div>
      <div class="field"><label for="pz-name">구역 이름</label><input class="input" id="pz-name" value="${BT.esc(z.name)}" maxlength="12"></div>
      <div class="field"><span class="field-label">색상</span><div class="color-pick">${COLORS.map(c => `<button type="button" class="sw-${c} ${z.color === c ? 'on' : ''}" data-c="${c}" aria-label="${c}"></button>`).join('')}</div></div>
      <div class="field"><span class="field-label">포함된 테이블 ${inside.length}개</span><div class="tags">${inside.map(t => `<span class="badge badge-gray">${BT.esc(t.id)} · ${t.seats}인</span>`).join('') || '<span class="faint">없음</span>'}</div></div>
      <button class="btn btn-danger btn-sm" id="pz-del" type="button">구역 삭제</button>`;
    $('#pz-name').addEventListener('input', e => { z.name = e.target.value; renderCanvas(); $('#zone-chips').querySelector(`[data-z="${z.id}"]`).childNodes[1].textContent = z.name + ' '; });
    p.querySelectorAll('[data-c]').forEach(b => b.addEventListener('click', () => { z.color = b.dataset.c; render(); }));
    $('#pz-del').addEventListener('click', () => { f.zones = f.zones.filter(x => x.id !== z.id); regroup(f); S.zone = null; render(); });
  }

  function render() { renderFloors(); renderCanvas(); renderSide(); }
  render();
})();
