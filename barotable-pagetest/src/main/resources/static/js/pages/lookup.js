/* C-07 비회원 예약 조회 · 취소
 * 예약번호 + 연락처가 모두 맞아야 보여 준다. 취소는 방문 시간 전, 확정 상태일 때만.
 * 기준 시각: BT.TODAY + BT.NOW (하드코딩)
 */
(function () {
  const $ = s => document.querySelector(s);
  const box = $('#lk-result');
  const digits = s => String(s || '').replace(/\D/g, '');
  const STATUS = { booked: ['예약 확정', 'badge-teal'], visited: ['방문 완료', 'badge-blue'], noshow: ['노쇼 처리됨', 'badge-coral'], cancelled: ['취소됨', 'badge-gray'] };
  let current = null, asking = false;

  function find(no, phone) {
    return BT.reservations().find(r => r.no.toUpperCase() === no.trim().toUpperCase() && r.phone && digits(r.phone) === digits(phone)) || null;
  }
  /* 취소할 수 없으면 이유, 할 수 있으면 null */
  function cancelBlock(r) {
    if (r.status === 'cancelled') return null;
    if (r.status !== 'booked') return '이미 방문 처리된 예약이라 취소할 수 없어요.';
    if (r.date < BT.TODAY || (r.date === BT.TODAY && BT.toMin(r.time) <= BT.toMin(BT.NOW))) return '예약 시간이 지나 온라인으로 취소할 수 없어요. 매장으로 연락해 주세요.';
    return null;
  }

  function render() {
    box.hidden = false;
    if (!current) {
      box.innerHTML = `<hr class="divider"><p class="notice bad">예약번호와 연락처가 맞는 예약이 없어요. 다시 확인해 주세요.</p>`;
      return;
    }
    const r = current, t = BT.findTable(r.table), z = t ? BT.zoneOf(t) : null, s = STATUS[r.status] || STATUS.booked;
    const block = cancelBlock(r);
    box.innerHTML = `<hr class="divider">
      <div class="row" style="justify-content:space-between"><b class="mono">${BT.esc(r.no)}</b><span class="badge ${s[1]}">${s[0]}</span></div>
      <dl class="kv">
        <dt>예약자</dt><dd>${BT.esc(r.name)}</dd>
        <dt>일시</dt><dd>${BT.fmtDate(r.date)} ${r.time}</dd>
        <dt>인원</dt><dd>${r.party}명</dd>
        <dt>테이블</dt><dd>${t ? `${t.id} · ${t.seats}인석 · ${BT.esc(t.floorName)} ${BT.esc(z ? z.name : '')}` : '-'}</dd>
        <dt>요청사항</dt><dd>${BT.esc(r.request || '없음')}</dd>
      </dl>
      ${r.status === 'cancelled' ? '<p class="notice">취소된 예약입니다. 같은 자리는 다른 손님이 예약할 수 있어요.</p>'
        : block ? `<p class="notice warn">${block}</p>`
        : asking ? `<p class="notice bad">취소하면 되돌릴 수 없어요. 정말 취소할까요?</p>
            <div class="form-row"><button type="button" class="btn btn-danger" data-act="yes">예약 취소 확정</button><button type="button" class="btn btn-ghost" data-act="no">돌아가기</button></div>`
        : '<button type="button" class="btn btn-danger btn-block" data-act="ask">예약 취소</button>'}`;
    const on = (act, fn) => { const b = box.querySelector(`[data-act="${act}"]`); if (b) b.addEventListener('click', fn); };
    on('ask', () => { asking = true; render(); box.querySelector('[data-act="no"]').focus(); });
    on('no', () => { asking = false; render(); });
    on('yes', () => {
      // 저장 직전 재검사
      const fresh = find(r.no, r.phone);
      if (!fresh || cancelBlock(fresh)) { current = fresh; asking = false; render(); return; }
      BT.updateReservation(r.no, { status: 'cancelled' });
      current = find(r.no, r.phone); asking = false; render();
      BT.toast('예약을 취소했어요');
    });
  }

  $('#lk-form').addEventListener('submit', e => {
    e.preventDefault();
    current = find($('#lk-no').value, $('#lk-phone').value); asking = false;
    render();
  });

  /* 예약 완료 화면에서 넘어온 값이 있으면 바로 조회 */
  const pre = BT.sget('bt.lookup', null);
  if (pre) {
    try { sessionStorage.removeItem('bt.lookup'); } catch (e) {}
    $('#lk-no').value = pre.no; $('#lk-phone').value = pre.phone;
    current = find(pre.no, pre.phone); render();
  }
})();
