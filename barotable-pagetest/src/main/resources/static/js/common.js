/* =========================================================
 * 바로테이블 화면 설계 확인용 - 공통
 * 구현 기능: 화면 이동, 10월 날짜 / 영업시간 슬롯 생성, (AI 채팅용) 시간 확인, 예약 상태 변경 · 좌석 규칙
 * 나머지 데이터는 모두 하드코딩
 * ========================================================= */
window.BT = (function () {
  const D = window.BT_DATA;
  const YEAR = 2026, MONTH = 10;
  const TODAY = '2026-10-05';
  const WEEK = ['일', '월', '화', '수', '목', '금', '토'];

  function sget(key, fallback) { try { const v = sessionStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; } }
  function sset(key, val) { try { sessionStorage.setItem(key, JSON.stringify(val)); } catch (e) {} }

  const store = () => D.STORE;
  const floors = () => JSON.parse(JSON.stringify(D.FLOORS));
  function allTables(fl) {
    const out = [];
    (fl || floors()).forEach(f => f.tables.forEach(t => out.push(Object.assign({ floor: f.id, floorName: f.name }, t))));
    return out;
  }
  const findTable = (id, fl) => allTables(fl).find(t => t.id === id) || null;
  function zoneOf(t, fl) { const f = (fl || floors()).find(x => x.id === t.floor); return f ? f.zones.find(z => z.id === t.zone) || null : null; }

  /* ---------- 화면 이동 ---------- */
  const ROUTES = {
    'index': ['index.html', '/'], 'reserve': ['reserve.html', '/reserve'], 'confirm': ['confirm.html', '/reserve/confirm'],
    'complete': ['complete.html', '/reserve/complete'], 'lookup': ['lookup.html', '/reservations/lookup'],
    'owner-login': ['owner/login.html', '/owner/login'], 'owner-dashboard': ['owner/dashboard.html', '/owner/dashboard'],
    'owner-editor': ['owner/editor.html', '/owner/seat-map'], 'owner-settings': ['owner/settings.html', '/owner/settings'],
    'owner-guests': ['owner/guests.html', '/owner/guests']
  };
  function url(name) {
    const r = ROUTES[name];
    if (document.body.dataset.server === 'true') return r[1];
    const depth = Number(document.body.dataset.depth || 0);
    return '../'.repeat(depth) + r[0];
  }
  const go = name => { location.href = url(name); };

  /* 화면 사이에 고른 날짜·시간·인원·테이블만 넘겨서 표시 */
  const DEFAULT_DRAFT = { date: '2026-10-10', time: '19:00', party: 4, table: 'T03', request: '아이 의자' };
  const draft = () => Object.assign({}, DEFAULT_DRAFT, sget('bt.draft', {}));
  const saveDraft = p => { const d = Object.assign(draft(), p); sset('bt.draft', d); return d; };

  /* ---------- 예약 상태 ----------
   * 원본은 BT_DATA.OWNER_RESERVATIONS + 손님 화면에서 만든 예약(draft) 하나.
   * 취소·노쇼·방문·테이블 이동·워크인처럼 바뀐 부분만 sessionStorage('bt.res')에 쌓는다.
   * 실제 구현: GET/PATCH /api/owner/reservations, POST /api/reservations/lookup */
  const NOW = D.OWNER_NOW;
  const guestNo = d => 'BT-' + d.date.replace(/-/g, '') + '-0031';
  const resLog = () => sget('bt.res', { patch: {}, added: [] });
  function reservations() {
    const log = resLog(), d = draft();
    const base = D.OWNER_RESERVATIONS.map(r => Object.assign({ date: D.OWNER_TODAY }, r));
    const mine = { no: guestNo(d), date: d.date, time: d.time, name: '홍길동', phone: '010-0000-0000', email: 'hello@example.com', party: d.party, table: d.table, status: 'booked', request: d.request || '' };
    if (!base.some(r => r.no === mine.no)) base.push(mine);
    return base.concat(log.added).map(r => Object.assign({}, r, log.patch[r.no]));
  }
  function updateReservation(no, change) { const log = resLog(); log.patch[no] = Object.assign(log.patch[no] || {}, change); sset('bt.res', log); }
  function addReservation(r) { const log = resLog(); log.added.push(r); sset('bt.res', log); }
  /* 점주가 직접 만든 배정(워크인 · 전화 예약)만 지울 수 있다 */
  function removeReservation(no) { const log = resLog(); log.added = log.added.filter(r => r.no !== no); delete log.patch[no]; sset('bt.res', log); }
  function resetReservations() { try { sessionStorage.removeItem('bt.res'); } catch (e) {} }
  const isActive = r => r.status !== 'noshow' && r.status !== 'cancelled';

  /* ---------- 좌석 규칙 (손님 추천 · 워크인 · 테이블 이동 공통) ----------
   * 좌석 수와 구역 인원 조건 위반이면 이유 문자열, 괜찮으면 null */
  function seatRule(t, party, fl) {
    if (t.seats < party) return `${t.seats}인 테이블이라 ${party}명은 앉을 수 없어요`;
    const z = zoneOf(t, fl);
    if (z && z.minParty && party < z.minParty) return `${z.name}은 ${z.minParty}명 이상만 받아요`;
    if (z && z.maxParty && party > z.maxParty) return `${z.name}은 ${z.maxParty}명까지만 받아요`;
    return null;
  }
  /* 같은 날 같은 테이블에서 이용 시간이 겹치는 유효 예약 (except: 자기 자신 예약번호) */
  function tableClash(tableId, date, time, list, except) {
    const dine = store().dineMinutes;
    return list.find(r => r.no !== except && isActive(r) && r.table === tableId && r.date === date && Math.abs(toMin(r.time) - toMin(time)) < dine) || null;
  }

  /* ---------- 날짜 / 시간 ---------- */
  const pad = (n, w) => String(n).padStart(w || 2, '0');
  const toMin = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const toHHMM = m => pad(Math.floor(m / 60)) + ':' + pad(m % 60);
  function parseDate(s) { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); }
  const iso = dt => dt.getFullYear() + '-' + pad(dt.getMonth() + 1) + '-' + pad(dt.getDate());
  function fmtDate(s, opt) {
    const dt = parseDate(s), w = WEEK[dt.getDay()];
    if (opt === 'long') return `${dt.getMonth() + 1}월 ${dt.getDate()}일 ${w}요일`;
    if (opt === 'short') return `${dt.getMonth() + 1}월 ${dt.getDate()}일 (${w})`;
    return `${dt.getFullYear()}.${pad(dt.getMonth() + 1)}.${pad(dt.getDate())} (${w})`;
  }
  /* 2026년 10월 1일 ~ 31일, 오늘(10/5) 이전은 선택 불가 */
  function octoberDays() {
    const out = [], last = new Date(YEAR, MONTH, 0).getDate();
    for (let d = 1; d <= last; d++) {
      const s = `${YEAR}-${pad(MONTH)}-${pad(d)}`, dt = parseDate(s);
      out.push({ iso: s, day: d, dow: dt.getDay(), week: WEEK[dt.getDay()], past: s < TODAY, today: s === TODAY });
    }
    return out;
  }
  /* 11:30 ~ 22:00, 30분 단위, 브레이크 15:00~17:00 선택 불가 (마지막 예약 21:30) */
  function slots() {
    const h = store().hours, out = [];
    for (let m = toMin(h.open); m < toMin(h.close); m += 30) {
      const br = m >= toMin(h.breakStart) && m < toMin(h.breakEnd);
      out.push({ time: toHHMM(m), break: br, period: m < toMin(h.breakStart) ? 'lunch' : (br ? 'break' : 'dinner') });
    }
    return out;
  }
  function timeCheck(time) {
    const h = store().hours, m = toMin(time);
    if (m < toMin(h.open) || m >= toMin(h.close)) return { ok: false, reason: `영업시간(${h.open}–${h.close}) 밖이에요` };
    if (m >= toMin(h.breakStart) && m < toMin(h.breakEnd)) return { ok: false, reason: `${h.breakStart}–${h.breakEnd}은 브레이크 타임이에요` };
    return { ok: true };
  }

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  function toast(msg) {
    let box = document.querySelector('.toast-box');
    if (!box) { box = document.createElement('div'); box.className = 'toast-box'; box.setAttribute('role', 'status'); document.body.appendChild(box); }
    const el = document.createElement('div'); el.className = 'toast'; el.textContent = msg; box.appendChild(el);
    setTimeout(() => el.classList.add('out'), 2400); setTimeout(() => el.remove(), 2800);
  }

  /* ---------- 화면 목록 바 ---------- */
  const SCREENS = [
    ['index', 'C-01', '매장 입장'], ['reserve', 'C-03', '좌석도 선택 · AI 채팅'], ['confirm', 'C-04/05', '정보·확인'],
    ['complete', 'C-06', '예약 완료'], ['lookup', 'C-07', '비회원 조회'], ['owner-login', 'A-01', '점주·관리자 로그인'],
    ['owner-dashboard', 'O-02', '점주 대시보드'], ['owner-guests', 'O-05', '손님 배정'], ['owner-editor', 'O-03', '좌석도 편집'], ['owner-settings', 'O-04', '운영 조건']
  ];
  document.addEventListener('DOMContentLoaded', () => {
    const cur = document.body.dataset.screen;
    const bar = document.createElement('div'); bar.className = 'proto-bar';
    bar.innerHTML = `<span class="proto-tag">PAGE TEST</span><span class="proto-note">화면 설계 확인용 · 하드코딩 데이터</span>
      <label class="proto-jump"><span class="sr-only">화면 이동</span><select id="proto-jump">${SCREENS.map(s => `<option value="${s[0]}" ${s[0] === cur ? 'selected' : ''}>${s[1]}  ${s[2]}</option>`).join('')}</select></label>`;
    document.body.prepend(bar);
    bar.querySelector('#proto-jump').addEventListener('change', e => go(e.target.value));
    document.querySelectorAll('[data-go]').forEach(a => {
      if (a.tagName === 'A') a.setAttribute('href', url(a.dataset.go));
      else a.addEventListener('click', e => { e.preventDefault(); go(a.dataset.go); });
    });
  });

  return { YEAR, MONTH, TODAY, NOW, store, floors, allTables, findTable, zoneOf, url, go, draft, saveDraft,
    guestNo, reservations, updateReservation, addReservation, removeReservation, resetReservations, isActive, seatRule, tableClash, sget, sset, pad, toMin, toHHMM, parseDate, iso, fmtDate, octoberDays, slots, timeCheck, esc, toast };
})();
