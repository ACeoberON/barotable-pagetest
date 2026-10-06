/* C-03 좌석도 선택
 * 구현: 10월 날짜 선택, 영업시간 안 30분 단위 시간 선택(브레이크 제외), 층 탭 · 구역 필터, AI 채팅 조건 적용
 * 운영 조건(BT.store())의 영업시간 · 인원 범위 · 이용 시간 · 자리 직접 고르기 허용 여부를 따른다.
 * 막힌 자리: 고른 날짜·시간과 이용 시간(dineMinutes)이 겹치는 예약이 있는 테이블.
 *   예약 목록은 BT.reservations()라서 점주의 전화 예약 · 테이블 이동 · 손님 취소가 그대로 반영된다.
 * 오늘은 기준 시각(BT.NOW) 이후 시간만 고를 수 있다.
 * 추천: AI가 아니라 아래 규칙 엔진이 고른다. 최종 선택은 손님.
 */
(function () {
  const $ = s => document.querySelector(s);
  const fl = BT.floors();
  const d0 = BT.draft();
  const days = BT.octoberDays();
  const st = BT.store(), DINE = st.dineMinutes;
  /* 매장 전체 예약. 지금 고르고 있는 내 예약(임시 저장분)은 내 자리를 막지 않도록 뺀다 */
  const bookings = () => { const mine = BT.guestNo(BT.draft()); return BT.reservations().filter(r => r.no !== mine); };
  const isPast = time => S.date === BT.TODAY && BT.toMin(time) <= BT.toMin(BT.NOW);

  /* ---------- 규칙 엔진 ----------
   * 1) 이미 예약(같은 날, 이용 시간 겹침) · 좌석 부족 · 구역 인원 조건 위반을 뺀다.
   * 2) 남은 후보 중 채팅 요청(창가 · 바 등)과 맞는 테이블을 먼저, 그 안에서 좌석 수가 가장 작은 테이블.
   * 점주 화면과 같은 공통 규칙(BT.tableClash, BT.seatRule)을 쓴다. */
  const clash = t => BT.tableClash(t.id, S.date, S.time, bookings());
  function violation(t, party) {
    if (isPast(S.time)) return `${BT.NOW} 이전 시간은 예약할 수 없어요`;
    const tc = BT.timeCheck(S.time);
    if (!tc.ok) return tc.reason;
    const c = clash(t);
    if (c) return `${c.time}에 예약이 있어 ${BT.toHHMM(BT.toMin(c.time) + DINE)}까지 쓸 수 없어요`;
    return BT.seatRule(t, party, fl);
  }
  /* 고른 시간이 지났거나 영업시간 · 브레이크에 걸리면 다음 예약 가능 시간으로 옮긴다 */
  function fixTime() {
    if (!isPast(S.time) && BT.slots().some(x => x.time === S.time && !x.break)) return false;
    const next = BT.slots().find(x => !x.break && !isPast(x.time));
    if (next) { S.time = next.time; return true; }
    return false;
  }
  /* 채팅 요청(ai-chat.js의 prefs)과 테이블이 몇 개나 맞는지 */
  function prefScore(t) {
    return S.prefs.filter(p => p === '룸' ? t.shape === 'room' : /^\d층$/.test(p) ? t.floorName === p : t.tags.includes(p)).length;
  }
  function recommend(party) {
    const ok = BT.allTables(fl).filter(t => !violation(t, party));
    const best = Math.max(0, ...ok.map(prefScore));
    const pool = best > 0 ? ok.filter(t => prefScore(t) === best) : ok;
    const t = pool.sort((a, b) => a.seats - b.seats)[0] || null;
    return t && { t, matched: best > 0 };
  }

  const S = { date: d0.date, time: d0.time, party: Math.min(st.maxParty, Math.max(st.minParty, d0.party)), floor: fl[0].id, zone: 'all', selected: null, request: '', prefs: [] };

  /* ---------- 날짜: 10월 ---------- */
  function renderDates() {
    const box = $('#date-strip');
    box.innerHTML = days.map(x => `
      <button type="button" role="option" class="date-chip ${x.dow === 0 ? 'sun' : ''} ${x.dow === 6 ? 'sat' : ''} ${x.today ? 'today' : ''} ${x.iso === S.date ? 'on' : ''}"
        data-date="${x.iso}" ${x.past ? 'disabled' : ''} aria-selected="${x.iso === S.date}" aria-label="10월 ${x.day}일 ${x.week}요일">
        <span class="w">${x.today ? '오늘' : x.week}</span><span class="d">${x.day}</span>
      </button>`).join('');
    box.querySelectorAll('.date-chip:not([disabled])').forEach(b => b.addEventListener('click', () => { S.date = b.dataset.date; if (fixTime()) BT.toast(`오늘은 ${BT.NOW} 이후만 예약돼요. ${S.time}로 바꿨어요`); renderDates(); renderTimes(); renderMap(); renderPanel(); }));
    const on = box.querySelector('.on');
    if (on) box.scrollLeft = Math.max(0, on.offsetLeft - box.offsetLeft - 60);
  }
  /* ---------- 시간: 운영 조건의 영업시간, 브레이크는 선택 불가 ---------- */
  function renderTimes() {
    const sl = BT.slots(), h = BT.store().hours;
    const g = p => sl.filter(x => x.period === p);
    const chip = x => `<button type="button" class="chip ${x.time === S.time ? 'on' : ''}" data-time="${x.time}" ${x.break ? 'disabled title="브레이크 타임"' : isPast(x.time) ? 'disabled title="지난 시간"' : ''} aria-pressed="${x.time === S.time}">${x.time}</button>`;
    const lunch = g('lunch'), brk = g('break'), dinner = g('dinner');
    const range = a => a.length ? `${a[0].time}–${a[a.length - 1].time}` : '';
    const hs = $('#hours-small'); if (hs) hs.textContent = `${h.open}–${h.close}`;
    $('#time-groups').innerHTML =
      (lunch.length ? `<div class="time-group"><div class="time-group-label"><b>점심</b>${range(lunch)}</div><div class="chips">${lunch.map(chip).join('')}</div></div>` : '') +
      (brk.length ? `<div class="time-group"><div class="time-group-label"><b>브레이크</b>예약 불가</div><div class="chips">${brk.map(chip).join('')}<span class="break-note">${h.breakStart}–${h.breakEnd} 준비 시간</span></div></div>` : '') +
      (dinner.length ? `<div class="time-group"><div class="time-group-label"><b>${lunch.length ? '저녁' : '예약 시간'}</b>${range(dinner)}</div><div class="chips">${dinner.map(chip).join('')}<span class="hint" style="align-self:center">${h.close} 영업 종료</span></div></div>` : '');
    document.querySelectorAll('#time-groups .chip:not([disabled])').forEach(b => b.addEventListener('click', () => { S.time = b.dataset.time; renderTimes(); renderMap(); renderPanel(); }));
  }
  /* ---------- 인원 ---------- */
  function renderParty() {
    $('#p-val').textContent = S.party + '명';
    $('#p-minus').disabled = S.party <= st.minParty;
    $('#p-plus').disabled = S.party >= st.maxParty;
    const ph = $('#p-hint'); if (ph) ph.textContent = `${st.minParty}–${st.maxParty}명 · 그 이상은 매장으로 문의`;
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
      recommended: S.selected ? null : ((recommend(S.party) || {}).t || {}).id,
      zoneFilter: S.zone,
      statusOf: t => clash(t) ? { cls: 'reserved', sub: '예약됨' } : { cls: 'available' },
      onSelect: t => {
        if (!st.allowSeatChoice) { BT.toast('이 매장은 자리를 자동으로 배정해요. 오른쪽 추천 자리로 예약됩니다'); return; }
        if (clash(t)) return;
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
      const r = recommend(S.party), rec = r && r.t;
      const want = S.prefs.join(' · ');
      const why = !want ? `${S.party}명이 앉을 수 있는 빈 테이블 중 가장 작은 자리예요`
        : r && r.matched ? `요청하신 ${BT.esc(want)} 자리 중 가장 작은 자리예요`
        : `요청하신 ${BT.esc(want)} 자리는 비어 있지 않아요. 대신 ${S.party}명이 앉을 수 있는 가장 작은 자리를 추천해요`;
      if (!st.allowSeatChoice) {
        /* 점주가 직접 고르기를 꺼 두면 규칙 엔진이 고른 자리로 바로 예약한다 */
        p.innerHTML = `<span class="badge badge-indigo" style="align-self:flex-start">자동 배정</span>
          <div><h2>${rec ? `${rec.id} · ${rec.seats}인 테이블` : '배정할 자리가 없어요'}</h2><p class="card-sub" style="margin-top:4px">${cond}</p></div>
          ${rec ? `<p class="notice">${BT.esc(rec.floorName)} ${BT.esc((BT.zoneOf(rec, fl) || {}).name || '')} · ${why}</p><button class="btn btn-primary btn-block" id="go-auto">이 자리로 예약</button>`
            : `<div class="notice bad">${S.party}명이 앉을 수 있는 빈 테이블이 없어요. 시간이나 인원을 바꿔 주세요.</div>`}`;
        const ga = $('#go-auto');
        if (ga) ga.addEventListener('click', () => {
          if (violation(rec, S.party)) { renderMap(); renderPanel(); return; } // 저장 직전 재검사
          BT.saveDraft({ date: S.date, time: S.time, party: S.party, table: rec.id, request: S.request });
          BT.go('confirm');
        });
        return;
      }
      p.innerHTML = `<span class="badge badge-gray" style="align-self:flex-start">현재 선택 없음</span>
        <div><h2>테이블을 골라 주세요</h2><p class="card-sub" style="margin-top:4px">${cond}</p></div>
        ${rec ? `<div class="notice warn"><b>추천 ${rec.id}</b> · ${rec.seats}인 · ${BT.esc(rec.floorName)} ${BT.esc((BT.zoneOf(rec, fl) || {}).name || '')}<br><span style="font-size:12px">${why}</span></div>`
          : `<div class="notice bad">${S.party}명이 앉을 수 있는 빈 테이블이 없어요. 인원을 바꾸거나 매장에 문의해 주세요.</div>`}`;
    }
  }

  /* AI 채팅에서 확인한 조건 적용 */
  window.ReservePage = {
    apply(patch) {
      Object.assign(S, { date: patch.date, time: patch.time, party: patch.party, request: patch.request || '', prefs: patch.prefs || [], selected: null });
      fixTime();
      renderDates(); renderTimes(); renderParty(); renderMap(); renderPanel();
    }
  };

  fixTime();
  renderDates(); renderTimes(); renderParty(); renderFloors(); renderMap(); renderPanel();
})();
