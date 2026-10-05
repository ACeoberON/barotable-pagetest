/* O-02 점주 대시보드 - 고정 화면 (19:00 기준 하드코딩), 층 탭 전환만 동작 */
(function () {
  const $ = s => document.querySelector(s);
  const D = BT_DATA, fl = BT.floors();
  const NOW = BT.toMin(D.OWNER_NOW), DINE = 90;
  const RES = D.OWNER_RESERVATIONS;
  let floor = fl[0].id;

  const view = r => r.status === 'visited' ? 'visited' : (BT.toMin(r.time) <= NOW ? 'booked' : 'waiting');
  const LABEL = { booked: ['확정', 'badge-teal'], visited: ['방문 완료', 'badge-blue'], waiting: ['대기', 'badge-amber'] };
  const pill = r => { const v = view(r); return `<span class="badge ${LABEL[v][1]}">${LABEL[v][0]}</span>`; };
  function tableState(id) {
    const cur = RES.find(r => r.table === id && BT.toMin(r.time) <= NOW && NOW < BT.toMin(r.time) + DINE);
    if (cur) return { cls: cur.status === 'visited' ? 'visited' : 'booked', sub: `${cur.time} · ${cur.party}명` };
    const next = RES.find(r => r.table === id && BT.toMin(r.time) > NOW && BT.toMin(r.time) - NOW <= 60);
    if (next) return { cls: 'waiting', sub: `${next.time} 도착 예정` };
    return { cls: 'empty' };
  }

  $('#today-label').textContent = BT.fmtDate(D.OWNER_TODAY);
  const c = { booked: 0, visited: 0, waiting: 0 };
  RES.forEach(r => c[view(r)]++);
  const tile = (k, label, desc, n) => `<div class="stat"><span class="k"><span class="dot c-${k}"></span>${label}</span><span class="v">${n}</span><span class="d">${desc}</span></div>`;
  $('#stats').innerHTML = tile('booked', '확정', '도착 시간이 된 예약', c.booked) + tile('visited', '방문 완료', '입장 처리된 테이블', c.visited) +
    tile('waiting', '대기', '시간이 남은 예약', c.waiting) + tile('noshow', '노쇼', '빈자리로 돌린 예약', 0);

  function renderFloor() {
    $('#floor-tabs').innerHTML = fl.map(f => `<button type="button" role="tab" class="tab ${f.id === floor ? 'on' : ''}" data-f="${f.id}" aria-selected="${f.id === floor}">${BT.esc(f.name)}</button>`).join('');
    document.querySelectorAll('#floor-tabs .tab').forEach(b => b.addEventListener('click', () => { floor = b.dataset.f; renderFloor(); }));
    SeatMap.render($('#map'), fl.find(f => f.id === floor), { selected: 'T03', statusOf: t => tableState(t.id) });
  }
  renderFloor();

  $('#res-rows').innerHTML = RES.map(r => {
    const n = D.NOSHOW_HISTORY[r.phone] || 0;
    return `<tr class="${r.table === 'T03' ? 'on' : ''}" style="cursor:default"><td class="mono">${r.time}</td><td>${BT.esc(r.name)} ${n >= 2 ? `<span class="badge badge-coral">노쇼 ${n}회</span>` : ''}</td>
      <td>${r.party}명</td><td class="mono">${r.table}</td><td>${pill(r)}</td><td class="muted">${BT.esc(r.request || '-')}</td></tr>`;
  }).join('');

  const r = RES.find(x => x.table === 'T03');
  $('#detail').innerHTML = `
    <div class="row" style="justify-content:space-between"><span class="eyebrow">선택 테이블 예약</span>${pill(r)}</div>
    <div class="row" style="align-items:baseline;gap:12px"><span class="sel-id">${r.table}</span><b>${r.time} · ${r.party}명</b></div>
    <dl class="kv">
      <dt>예약자</dt><dd>${BT.esc(r.name)}</dd>
      <dt>연락처</dt><dd class="mono">${r.phone}</dd>
      <dt>예약번호</dt><dd class="mono" style="font-size:12.5px">${r.no}</dd>
      <dt>위치</dt><dd>1층 · 창가 구역 · 4인석</dd>
      <dt>요청사항</dt><dd>${BT.esc(r.request)}</dd>
    </dl>
    <div class="form-row"><button class="btn btn-primary btn-sm" type="button">방문 완료</button><button class="btn btn-danger btn-sm" type="button">노쇼 처리</button></div>
    <hr class="divider">
    <label class="field-label" for="move-sel">다른 테이블로 옮기기</label>
    <div class="row" style="flex-wrap:nowrap"><select class="select" id="move-sel" style="min-height:38px"><option>T01 · 2인 · 1층</option><option>T04 · 4인 · 1층</option></select><button class="btn btn-ghost btn-sm" type="button">옮기기</button></div>`;
})();
