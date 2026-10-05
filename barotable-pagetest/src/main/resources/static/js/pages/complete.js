/* C-06 예약 완료 (좌석 화면에서 고른 값을 표시만 함) */
(function () {
  const d = BT.draft(), t = BT.findTable(d.table) || BT.findTable('T03'), z = BT.zoneOf(t);
  document.querySelector('#d-no').textContent = 'BT-' + d.date.replace(/-/g, '') + '-0031';
  document.querySelector('#d-info').innerHTML = `
    <dt>매장</dt><dd>${BT.esc(BT.store().name)}</dd>
    <dt>일시</dt><dd>${BT.fmtDate(d.date, 'long')} ${d.time}</dd>
    <dt>인원</dt><dd>${d.party}명</dd>
    <dt>테이블</dt><dd>${t.id} · ${t.seats}인석 · ${BT.esc(t.floorName)} ${BT.esc(z ? z.name : '')}</dd>
    ${d.request ? `<dt>요청사항</dt><dd>${BT.esc(d.request)}</dd>` : ''}`;
})();
