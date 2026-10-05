/* =========================================================
 * 바로테이블 화면 설계 확인용 - 하드코딩 데이터
 * 실제 서비스에서는 Spring Boot REST API / Thymeleaf 모델로 대체된다.
 *   GET /api/stores/{slug}            -> STORE
 *   GET /api/stores/{slug}/layout     -> STORE.floors
 *   GET /api/owner/reservations?date= -> OWNER_RESERVATIONS
 * 좌표계: 층마다 1000 x 600 캔버스 단위
 * ========================================================= */
window.BT_DATA = (function () {
  const STORE = {
    slug: 'baro-kitchen-seongsu',
    name: '바로키친 성수점',
    category: '이탈리안 다이닝',
    area: '성수',
    address: '서울 성동구 성수이로 00, 1–2층',
    phone: '02-000-0000',
    hours: { open: '11:30', close: '22:00', breakStart: '15:00', breakEnd: '17:00' },
    slotMinutes: 30,
    dineMinutes: 90,
    minParty: 1,
    maxParty: 8,
    slotLimit: 8,
    allowSeatChoice: true,
    noShowWarn: 2,
    ai: 'openai', // openai | local | off
    notify: { confirm: true, dayBefore: true }
  };

  const FLOORS = [
    {
      id: 'F1', name: '1층',
      zones: [
        { id: 'z-window', name: '창가 구역', x: 30,  y: 36,  w: 570, h: 150, color: 'teal',   minParty: 2, maxParty: null },
        { id: 'z-hall',   name: '홀 중앙',   x: 30,  y: 214, w: 570, h: 256, color: 'slate',  minParty: null, maxParty: null },
        { id: 'z-bar',    name: '바 카운터', x: 630, y: 214, w: 200, h: 256, color: 'amber',  minParty: null, maxParty: 2 }
      ],
      fixtures: [
        { id: 'fx1', type: 'window',   label: '창문',        x: 30,  y: 12,  w: 570, h: 14 },
        { id: 'fx2', type: 'kitchen',  label: '주방',        x: 630, y: 36,  w: 340, h: 150 },
        { id: 'fx3', type: 'entrance', label: '입구',        x: 400, y: 556, w: 160, h: 30 },
        { id: 'fx4', type: 'stairs',   label: '계단 · 2층',  x: 860, y: 214, w: 110, h: 120 },
        { id: 'fx5', type: 'restroom', label: '화장실',      x: 860, y: 360, w: 110, h: 110 }
      ],
      tables: [
        { id: 'T01', seats: 2, shape: 'round', x: 66,  y: 66,  w: 90,  h: 90, zone: 'z-window', tags: ['창가'], combinable: false },
        { id: 'T02', seats: 2, shape: 'round', x: 200, y: 66,  w: 90,  h: 90, zone: 'z-window', tags: ['창가'], combinable: false },
        { id: 'T03', seats: 4, shape: 'rect',  x: 350, y: 72,  w: 160, h: 80, zone: 'z-window', tags: ['창가', '조용함'], combinable: false },
        { id: 'T04', seats: 4, shape: 'rect',  x: 66,  y: 244, w: 150, h: 80, zone: 'z-hall',   tags: ['중앙'], combinable: true },
        { id: 'T05', seats: 2, shape: 'round', x: 262, y: 240, w: 90,  h: 90, zone: 'z-hall',   tags: ['중앙'], combinable: false },
        { id: 'T07', seats: 4, shape: 'rect',  x: 404, y: 244, w: 150, h: 80, zone: 'z-hall',   tags: ['중앙'], combinable: true },
        { id: 'T08', seats: 6, shape: 'rect',  x: 96,  y: 364, w: 230, h: 80, zone: 'z-hall',   tags: ['단체'], combinable: true },
        { id: 'T09', seats: 2, shape: 'round', x: 420, y: 360, w: 90,  h: 90, zone: 'z-hall',   tags: ['입구 근처'], combinable: false },
        { id: 'T06', seats: 2, shape: 'bar',   x: 660, y: 238, w: 140, h: 54, zone: 'z-bar',    tags: ['바', '오픈 키친 뷰'], combinable: false },
        { id: 'T10', seats: 2, shape: 'bar',   x: 660, y: 314, w: 140, h: 54, zone: 'z-bar',    tags: ['바'], combinable: false },
        { id: 'T11', seats: 2, shape: 'bar',   x: 660, y: 390, w: 140, h: 54, zone: 'z-bar',    tags: ['바'], combinable: false }
      ]
    },
    {
      id: 'F2', name: '2층',
      zones: [
        { id: 'z-terrace', name: '테라스',  x: 30,  y: 36,  w: 430, h: 200, color: 'teal',   minParty: null, maxParty: 4 },
        { id: 'z-lounge',  name: '라운지',  x: 30,  y: 264, w: 430, h: 300, color: 'slate',  minParty: null, maxParty: null },
        { id: 'z-room',    name: '단체룸',  x: 490, y: 36,  w: 340, h: 528, color: 'indigo', minParty: 5, maxParty: null }
      ],
      fixtures: [
        { id: 'fx6', type: 'window',   label: '테라스 유리문', x: 30,  y: 242, w: 430, h: 12 },
        { id: 'fx7', type: 'wall',     label: '',             x: 490, y: 294, w: 340, h: 10 },
        { id: 'fx8', type: 'stairs',   label: '계단 · 1층',    x: 860, y: 36,  w: 110, h: 120 },
        { id: 'fx9', type: 'restroom', label: '화장실',        x: 860, y: 454, w: 110, h: 110 }
      ],
      tables: [
        { id: 'T21', seats: 2, shape: 'round', x: 60,  y: 84,  w: 90,  h: 90,  zone: 'z-terrace', tags: ['야외'], combinable: false },
        { id: 'T22', seats: 2, shape: 'round', x: 190, y: 84,  w: 90,  h: 90,  zone: 'z-terrace', tags: ['야외'], combinable: false },
        { id: 'T23', seats: 4, shape: 'rect',  x: 310, y: 90,  w: 130, h: 80,  zone: 'z-terrace', tags: ['야외', '전망'], combinable: false },
        { id: 'T24', seats: 4, shape: 'rect',  x: 60,  y: 300, w: 160, h: 80,  zone: 'z-lounge',  tags: ['소파'], combinable: true },
        { id: 'T25', seats: 4, shape: 'rect',  x: 264, y: 300, w: 160, h: 80,  zone: 'z-lounge',  tags: ['소파'], combinable: true },
        { id: 'T26', seats: 2, shape: 'round', x: 84,  y: 434, w: 90,  h: 90,  zone: 'z-lounge',  tags: ['조용함'], combinable: false },
        { id: 'T27', seats: 2, shape: 'round', x: 230, y: 434, w: 90,  h: 90,  zone: 'z-lounge',  tags: ['조용함'], combinable: false },
        { id: 'R01', seats: 8, shape: 'room',  x: 524, y: 64,  w: 272, h: 200, zone: 'z-room',    tags: ['프라이빗', '모니터'], combinable: false },
        { id: 'R02', seats: 6, shape: 'room',  x: 524, y: 334, w: 272, h: 200, zone: 'z-room',    tags: ['프라이빗'], combinable: false }
      ]
    }
  ];

  /* 점주 대시보드용 오늘(2026-10-05) 예약 */
  const OWNER_TODAY = '2026-10-05';
  const OWNER_NOW = '19:00';
  const OWNER_RESERVATIONS = [
    { no: 'BT-20261005-0008', time: '12:00', name: '김민지', phone: '010-2345-1111', email: 'minji@example.com', party: 2, table: 'T01', status: 'visited',  request: '' },
    { no: 'BT-20261005-0009', time: '12:30', name: '박준호', phone: '010-3456-2222', email: 'junho@example.com', party: 4, table: 'T04', status: 'visited',  request: '' },
    { no: 'BT-20261005-0010', time: '13:00', name: '이서연', phone: '010-4567-3333', email: 'seoyeon@example.com', party: 6, table: 'T08', status: 'visited', request: '유아 의자 1개' },
    { no: 'BT-20261005-0014', time: '17:30', name: '정하늘', phone: '010-1111-4444', email: 'sky@example.com', party: 2, table: 'T05', status: 'visited',  request: '' },
    { no: 'BT-20261005-0016', time: '18:00', name: '최도윤', phone: '010-2222-5555', email: 'doyun@example.com', party: 4, table: 'T07', status: 'visited',  request: '' },
    { no: 'BT-20261005-0018', time: '18:30', name: '한지우', phone: '010-5555-1212', email: 'jiwoo@example.com', party: 2, table: 'T09', status: 'booked',   request: '' },
    { no: 'BT-20261005-0021', time: '19:00', name: '홍길동', phone: '010-0000-0000', email: 'hello@example.com', party: 4, table: 'T03', status: 'booked',   request: '아이 의자' },
    { no: 'BT-20261005-0022', time: '19:00', name: '윤채원', phone: '010-7777-8888', email: 'chaewon@example.com', party: 8, table: 'R01', status: 'booked', request: '생일 케이크 보관 부탁드려요' },
    { no: 'BT-20261005-0025', time: '19:30', name: '강태민', phone: '010-8888-9999', email: 'taemin@example.com', party: 2, table: 'T02', status: 'booked',   request: '' },
    { no: 'BT-20261005-0027', time: '20:00', name: '오수아', phone: '010-1212-3434', email: 'sua@example.com', party: 4, table: 'T23', status: 'booked',   request: '테라스 담요' },
    { no: 'BT-20261005-0028', time: '20:00', name: '서예준', phone: '010-5656-7878', email: 'yejun@example.com', party: 2, table: 'T06', status: 'booked',   request: '' },
    { no: 'BT-20261005-0030', time: '20:30', name: '문가은', phone: '010-9090-1010', email: 'gaeun@example.com', party: 6, table: 'R02', status: 'booked',   request: '' },
    /* 손님 화면 시연용 다른 날짜 예약 (date가 있는 항목은 점주 대시보드의 오늘 목록에 안 나옴) */
    { no: 'BT-20261010-0011', date: '2026-10-10', time: '12:00', name: '조하린', phone: '010-3131-2020', email: 'harin@example.com', party: 2, table: 'T01', status: 'booked', request: '' },
    { no: 'BT-20261010-0024', date: '2026-10-10', time: '18:00', name: '배도현', phone: '010-4242-3030', email: 'dohyun@example.com', party: 2, table: 'T05', status: 'booked', request: '' },
    { no: 'BT-20261010-0026', date: '2026-10-10', time: '18:30', name: '신유나', phone: '010-5353-4040', email: 'yuna@example.com', party: 6, table: 'R02', status: 'booked', request: '' },
    { no: 'BT-20261010-0029', date: '2026-10-10', time: '19:00', name: '임서진', phone: '010-6464-5050', email: 'seojin@example.com', party: 2, table: 'T06', status: 'booked', request: '' },
    { no: 'BT-20261010-0033', date: '2026-10-10', time: '19:30', name: '권나래', phone: '010-7575-6060', email: 'narae@example.com', party: 2, table: 'T22', status: 'booked', request: '야외 자리' },
    { no: 'BT-20261010-0035', date: '2026-10-10', time: '20:00', name: '남궁현', phone: '010-8686-7070', email: 'hyun@example.com', party: 2, table: 'T09', status: 'booked', request: '' }
  ];
  /* 연락처별 누적 노쇼 횟수 */
  const NOSHOW_HISTORY = { '010-5555-1212': 2, '010-9090-1010': 1 };


  /* (손님 좌석도는 이제 날짜·시간별로 계산하므로 이 목록을 쓰지 않는다. 좌석도 편집기의 삭제 잠금에서만 참고) */
  const CUSTOMER_RESERVED = ['T05', 'T06', 'T10', 'T22', 'R02'];

  return { STORE, FLOORS, OWNER_TODAY, OWNER_NOW, OWNER_RESERVATIONS, NOSHOW_HISTORY, CUSTOMER_RESERVED };
})();
