/* C-03 좌석도 선택
 * 구현: 10월 날짜 선택, 11:30–22:00(브레이크 제외) 시간 선택, 층 탭 · 구역 필터, AI 채팅 조건 적용
 * 고정: 예약된 테이블(BT_DATA.CUSTOMER_RESERVED)
 * 추천: AI가 아니라 아래 규칙 엔진이 고른다. 최종 선택은 손님.
 */
(function () {
  const $ = s => document.querySelector(s);
  const fl = BT.floors();
  const d0 = BT.draft();
  const days = BT.octoberDays();
  const RESERVED = BT_DATA.CUSTOMER_RESERVED;

  /* ---------- 규칙 엔진 ----------
   * 좌석 부족 · 이미 예약 · 구역 인원 조건 위반을 빼고, 남은 후보 중 좌석 수가 가장 작은 테이블.
   * 실제 구현에서는 날짜·시간별 예약(이용 시간 겹침)으로 RESERVED를 계산한다. */
  function violation(t, party) {
    if (RESERVED.includes(t.id)) return '이미 예약된 자리예요';
    if (t.seats < party) return `${t.seats}인 테이블이라 ${party}명은 앉을 수 없어요`;
    const z = BT.zoneOf(t, fl);
    if (z && z.minParty && party < z.minParty) return `${z.name}은 ${z.minParty}명 이상만 예약돼요`;
    if (z && z.maxParty && party > z.maxParty) return `${z.name}은 ${z.maxParty}명까지만 예약돼요`;
    return null;
  }
  function recommend(party) {
    return BT.allTables(fl).filter(t => !violation(t, party)).sort((a, b) => a.seats - b.seats)[0] || null;
  }

  const S = { date: d0.date, time: d0.time, party: d0.party, floor: fl[0].id, zone: 'all', selected: null, request: '' };

  /* ---------- 날짜: 10월 ---------- */
  function renderDates() {
    const box = $('#date-strip');
    box.innerHTML = days.map(x => `
      <button type="button" role="option" class="date-chip ${x.dow === 0 ? 'sun' : ''} ${x.dow === 6 ? 'sat' : ''} ${x.today ? 'today' : ''} ${x.iso === S.date ? 'on' : ''}"
        data-date="${x.iso}" ${x.past ? 'disabled' : ''} aria-selected="${x.iso === S.date}" aria-label="10월 ${x.day}일 ${x.week}요일">
        <span class="w">${x.today ? '오늘' : x.week}</span><span class="d">${x.day}</span>
      </button>`).join('');
    box.querySelectorAll('.date-chip:not([disabled])').forEach(b => b.addEventListener('click', () => { S.date = b.dataset.date; renderDates(); renderPanel(); }));
    const on = box.querySelector('.on');
    if (on) box.scrollLeft = Math.max(0, on.offsetLeft - box.offsetLeft - 60);
  }
  /* ---------- 시간: 11:30–22:00, 브레이크 15:00–17:00 ---------- */
  function renderTimes() {
    const sl = BT.slots(), h = BT.store().hours;
    const g = p => sl.filter(x => x.period === p);
    const chip = x => `<button type="button" class="chip ${x.time === S.time ? 'on' : ''}" data-time="${x.time}" ${x.break ? 'disabled title="브레이크 타임"' : ''} aria-pressed="${x.time === S.time}">${x.time}</button>`;
    const lunch = g('lunch'), brk = g('break'), dinner = g('dinner');
    $('#time-groups').innerHTML = `
      <div class="time-group"><div class="time-group-label"><b>점심</b>${lunch[0].time}–${lunch[lunch.length - 1].time}</div><div class="chips">${lunch.map(chip).join('')}</div></div>
      <div class="time-group"><div class="time-group-label"><b>브레이크</b>예약 불가</div><div class="chips">${brk.map(chip).join('')}<span class="break-note">${h.breakStart}–${h.breakEnd} 준비 시간</span></div></div>
      <div class="time-group"><div class="time-group-label"><b>저녁</b>${dinner[0].time}–${dinner[dinner.length - 1].time}</div><div class="chips">${dinner.map(chip).join('')}<span class="hint" style="align-self:center">${h.close} 영업 종료</span></div></div>`;
    document.querySelectorAll('#time-groups .chip:not([disabled])').forEach(b => b.addEventListener('click', () => { S.time = b.dataset.time; renderTimes(); renderPanel(); }));
  }
  /* ---------- 인원 ---------- */
  function renderParty() {
    $('#p-val').textContent = S.party + '명';
    $('#p-minus').disabled = S.party <= 1;
    $('#p-plus').disabled = S.party >= 8;
    const rb = $('#req-badge'); rb.hidden = !S.request; rb.textContent = S.request ? '요청사항 · ' + S.request : '';
  }
  $('#p-minus').addEventListener('click', () => { S.party--; renderParty(); renderMap(); renderPanel(); });
  $('#p-plus').addEventListener('click', () => { S.party++; renderParty(); renderMap(); renderPanel(); });

  /* ---------- 층 / 구역 ---------- */
  function renderFloors() {
    $('#floor-tabs').innerHTML = fl.map(f => `<button type="button" role="tab" class="tab ${f.id === S.floor ? 'on' : ''}" data-floor="${f.id}" aria-selected="${f.id === S.floor}">${BT.esc(f.name)}</button>`).join('');
    document.querySelectorAll('#floor-tabs .tab').forEach(b => b.addEventListener('click', () => { S.floor = b.dataset.floor; S.zone = 'all'; renderFloors(); renderMap(); }));
    const f = fl.find(x => x.id === S.floor);
    $('#zone-filter').innerHTML = `<button type="button" class="chip ${S.zone === 'all' ? 'on' : ''}" data-zone="all">${BT.esc(f.name)} 전체</button>` +
      f.zones.map(z => `<button type="button" class="chip ${S.zone === z.id ? 'on' : ''}" data-zone="${z.id}"><span class="zone-swatch sw-${z.color}"></span>${BT.esc(z.name)}</button>`).join('');
    document.querySelectorAll('#zone-filter .chip').forEach(b => b.addEventListener('click', () => { S.zone = b.dataset.zone; renderFloors(); renderMap(); }));
  }
  /* ---------- 좌석도 ---------- */
  function renderMap() {
    const f = fl.find(x => x.id === S.floor);
    SeatMap.render($('#map'), f, {
      selected: S.selected,
      recommended: S.selected ? null : (recommend(S.party) || {}).id,
      zoneFilter: S.zone,
      statusOf: t => RESERVED.includes(t.id) ? { cls: 'reserved', sub: '예약됨' } : { cls: 'available' },
      onSelect: t => {
        if (RESERVED.includes(t.id)) return;
        S.selected = S.selected === t.id ? null : t.id;
        renderMap(); renderPanel();
      }
    });
  }
  /* ---------- 선택 패널 ---------- */
  function renderPanel() {
    const p = $('#sel-panel');
    const t = S.selected ? BT.findTable(S.selected, fl) : null;
    const cond = `${BT.fmtDate(S.date, 'short')} · ${S.time} · ${S.party}명`;
    if (t) {
      const z = BT.zoneOf(t, fl), bad = violation(t, S.party);
      p.innerHTML = `<span class="badge badge-solid" style="align-self:flex-start">현재 선택</span>
        <div><div class="sel-id">${t.id}</div><p style="margin-top:6px;font-weight:700">${t.seats}인 테이블</p></div>
        <dl class="kv">
          <dt>위치</dt><dd>${BT.esc(t.floorName)} · ${BT.esc(z ? z.name : '-')}</dd>
          <dt>특징</dt><dd><div class="tags">${t.tags.map(x => `<span class="badge badge-gray">${BT.esc(x)}</span>`).join('')}</div></dd>
          <dt>예약 조건</dt><dd>${cond}</dd>
          ${S.request ? `<dt>요청사항</dt><dd>${BT.esc(S.request)}</dd>` : ''}
        </dl>
        ${bad ? `<div class="notice bad">${BT.esc(bad)}</div>` : ''}
        <button class="btn btn-primary btn-block" id="go-next" ${bad ? 'disabled' : ''}>이 테이블 선택</button>`;
      $('#go-next').addEventListener('click', () => {
        // 저장 직전 재검사: 화면 상태와 상관없이 코드로 한 번 더 확인
        if (violation(t, S.party)) { renderPanel(); return; }
        BT.saveDraft({ date: S.date, time: S.time, party: S.party, table: t.id, request: S.request });
        BT.go('confirm');
      });
    } else {
      const rec = recommend(S.party);
      p.innerHTML = `<span class="badge badge-gray" style="align-self:flex-start">현재 선택 없음</span>
        <div><h2>테이블을 골라 주세요</h2><p class="card-sub" style="margin-top:4px">${cond}</p></div>
        ${rec ? `<div class="notice warn"><b>추천 ${rec.id}</b> · ${rec.seats}인 · ${BT.esc(rec.floorName)} ${BT.esc((BT.zoneOf(rec, fl) || {}).name || '')}<br><span style="font-size:12px">${S.party}명이 앉을 수 있는 빈 테이블 중 가장 작은 자리예요</span></div>`
          : `<div class="notice bad">${S.party}명이 앉을 수 있는 빈 테이블이 없어요. 인원을 바꾸거나 매장에 문의해 주세요.</div>`}`;
    }
  }

  /* AI 채팅에서 확인한 조건 적용 */
  window.ReservePage = {
    apply(patch) {
      Object.assign(S, { date: patch.date, time: patch.time, party: patch.party, request: patch.request || '', selected: null });
      renderDates(); renderTimes(); renderParty(); renderMap(); renderPanel();
    }
  };

  renderDates(); renderTimes(); renderParty(); renderFloors(); renderMap(); renderPanel();
})();
