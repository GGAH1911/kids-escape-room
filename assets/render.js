// 공용 틀: 모든 회차를 이 파일 하나로 그린다.
const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const SHAPES = {
  circle: '<circle cx="12" cy="12" r="9" fill="none" stroke="#000" stroke-width="2.5"/>',
  square: '<rect x="3.5" y="3.5" width="17" height="17" fill="none" stroke="#000" stroke-width="2.5"/>',
  triangle: '<polygon points="12,3 22,21 2,21" fill="none" stroke="#000" stroke-width="2.5"/>',
  star: '<polygon points="12,2 14.9,8.9 22,9.3 16.5,14 18.2,21 12,17.3 5.8,21 7.5,14 2,9.3 9.1,8.9" fill="none" stroke="#000" stroke-width="2"/>'
};
const svg = k => `<svg viewBox="0 0 24 24" aria-hidden="true">${SHAPES[k]}</svg>`;
export async function loadRoom(id) {
  const r = await fetch(`rooms/${encodeURIComponent(id)}.json`);
  if (!r.ok) throw new Error('회차를 찾을 수 없어요');
  return r.json();
}
let CREDITS = null;
export async function loadCredits() { return CREDITS ??= await (await fetch('assets/img/credits.json')).json(); }
const pic = (name, cls) => name ? `<img class="pic ${cls}" src="assets/img/${esc(name)}.svg" alt="">` : '';
export const roomImgs = r => [r.img, ...r.problems.map(p => p.img), r.lock.img].filter(Boolean);
function creditsHtml(names, cr) {
  const by = new Map();
  for (const n of new Set(names)) { const c = cr[n]; if (!c) continue; if (!by.has(c.author)) by.set(c.author, []); by.get(c.author).push(c); }
  return [...by].map(([a, cs]) => `Icons made by ${esc(a)}. Available on https://game-icons.net (${esc(cs[0].license)}: ${cs.map(c => esc(c.title) + (c.modified ? ', 색을 바꿈' : '')).join(', ')})`).join(' / ');
}
export async function loadIndex() { return (await fetch('rooms/index.json')).json(); }
export function getId() { return new URLSearchParams(location.search).get('id') || '01'; }
function problemSheet(p, i) {
  let h = `<section class="prob"><h2><span class="no">${i + 1}</span><span class="tt">${esc(p.title)}</span>${pic(p.img, 'ps')}</h2><p>${esc(p.text)}</p>`;
  if (p.table) h += `<table class="t"><tr>${p.table.head.map(x => `<th>${esc(x)}</th>`).join('')}</tr>${p.table.rows.map(r => `<tr>${r.map(x => `<td>${esc(x)}</td>`).join('')}</tr>`).join('')}</table>`;
  if (p.statements) h += `<ul class="say">${p.statements.map(s => `<li><b>${esc(s[0])}</b>: "${esc(s[1])}"</li>`).join('')}</ul>`;
  if (p.riddle) h += `<p class="key">${esc(p.riddle)}</p>`;
  if (p.symbols) h += `<div class="syms">${p.symbols.map(s => `<div>${svg(s.shape)}<span>${esc(s.name)} = <b>${s.value}</b></span></div>`).join('')}</div>`;
  h += `<p class="q">${esc(p.question)}</p><div class="ans">${esc(p.answerLabel)}:<span class="blank"></span></div>`;
  return h + `<p class="rule">열쇠 숫자: ${esc(p.digitRule)}</p></section>`;
}
export async function renderSheet(room) {
  const cr = await loadCredits();
  document.title = `${room.title} - 문제지`;
  const cells = Array.from({ length: room.lock.digits }, (_, i) => `<div class="cell"><small style="font-size:10pt;line-height:6mm">${i + 1}번</small></div>`).join('');
  $('#app').innerHTML = `<div class="screen-only bar"><a class="btn" href="index.html">처음으로</a><button class="btn main" onclick="window.print()">인쇄</button><span>A4 용지, 배율 100%로 인쇄하세요.</span></div>
  <main class="page"><h1><span class="ht">${pic(room.img, 'ph')}${esc(room.title)}</span><small>이름: ________ 시간: ____분</small></h1>
  <p class="story">${esc(room.story)}</p>
  <div class="grid">${room.problems.map(problemSheet).join('')}</div>
  <div class="lock">${pic(room.lock.img, 'pl')}<div class="lbl">마지막 자물쇠<br>${esc(room.lock.label)}</div><div class="cells">${cells}</div></div><p class="credit">${creditsHtml(roomImgs(room), cr)}</p></main>`;
}
export async function renderAnswer(room) {
  const cr = await loadCredits();
  document.title = `${room.title} - 정답지`;
  const cells = [...room.lock.code].map(c => `<div class="cell">${c}</div>`).join('');
  $('#app').innerHTML = `<div class="screen-only bar"><a class="btn" href="index.html">처음으로</a><button class="btn main" onclick="window.print()">인쇄</button><span>부모님용 정답지예요.</span></div>
  <main class="page"><h1><span class="ht">${pic(room.img, 'ph')}${esc(room.title)} 정답지</span><small>부모님용</small></h1>
  ${room.problems.map((p, i) => `<section class="sol"><h2><span>${i + 1}. ${esc(p.title)}: 답 <span class="big">${esc(p.answer)}</span> (열쇠 숫자 ${p.digit})</span>${pic(p.img, 'pa')}</h2><p>풀이: ${esc(p.explain)}</p><p>힌트: ${esc(p.hint)}</p></section>`).join('')}
  <div class="lock">${pic(room.lock.img, 'pl')}<div class="lbl">비밀번호<br>${esc(room.lock.success)}</div><div class="cells">${cells}</div></div><p class="credit">${creditsHtml(roomImgs(room), cr)}</p></main>`;
}
export async function renderIndex(list) {
  const cr = await loadCredits();
  $('#app').innerHTML = `<div class="screen-only"><h1>인쇄용 방탈출</h1><p>문제지를 인쇄해서 집에서 방탈출을 해 보세요. 정답지는 부모님이 보관하세요.</p>
  <ul class="list">${list.map(r => `<li><div class="info"><b>${esc(r.id)}. ${esc(r.title)}</b><small>${esc(r.level)} / 약 ${r.minutes}분 / 문제 ${r.problems}개</small></div><span><a class="btn main" href="sheet.html?id=${r.id}">문제지 인쇄</a> <a class="btn" href="answer.html?id=${r.id}">정답지</a></span></li>`).join('')}</ul><p class="credit">그림: game-icons.net의 아이콘을 썼어요 (${[...new Set(Object.values(cr).map(c => esc(c.license)))].join(', ')}). 작가: ${[...new Set(Object.values(cr).map(c => esc(c.author)))].join(', ')}. 아이콘별 출처는 각 문제지 맨 아래와 assets/img/credits.json에 있어요. Available on https://game-icons.net</p></div>`;
}
