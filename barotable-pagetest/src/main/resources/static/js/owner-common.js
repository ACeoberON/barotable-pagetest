/* 점주 화면 공통: 사이드바 (화면 이동만) */
(function () {
  const side = document.getElementById('owner-side');
  if (!side) return;
  const cur = document.body.dataset.screen;
  const items = [['owner-dashboard', '대시보드'], ['owner-editor', '좌석도 관리'], ['owner-settings', '운영 조건']];
  side.innerHTML = `
    <a class="brand" href="${BT.url('index')}">바로테이블</a>
    <div class="store">${BT.esc(BT.store().name)} · 점주</div>
    ${items.map(i => `<a href="${BT.url(i[0])}" class="${i[0] === cur ? 'on' : ''}" ${i[0] === cur ? 'aria-current="page"' : ''}>${i[1]}</a>`).join('')}
    <span class="grow"></span>
    <a href="${BT.url('index')}">손님 화면 보기</a>
    <div class="who">owner@example.com<br>점주 · <a href="${BT.url('owner-login')}" style="display:inline;padding:0;color:inherit;text-decoration:underline">로그아웃</a></div>`;
})();
