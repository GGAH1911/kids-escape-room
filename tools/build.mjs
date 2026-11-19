// 사용법: node tools/build.mjs  -> rooms/*.json 을 검사하고 rooms/index.json 을 만든다.
import fs from 'node:fs';
import crypto from 'node:crypto';
const dir = new URL('../rooms/', import.meta.url);
const files = fs.readdirSync(dir).filter(f => /^\d+\.json$/.test(f)).sort();
const list = []; let bad = 0;
const codes = new Map(); const usedImgs = new Set();
const cdir = new URL('../assets/img/', import.meta.url);
const credits = JSON.parse(fs.readFileSync(new URL('credits.json', cdir)));
for (const [n, c] of Object.entries(credits)) {
  for (const k of ['file', 'title', 'author', 'source', 'license', 'licenseUrl']) if (!String(c[k] ?? '').trim()) { console.error('credits.json', n, k, '칸이 비었어요'); bad++; }
  if (c.file && !fs.existsSync(new URL('../' + c.file, import.meta.url))) { console.error('credits.json', n, '파일 없음', c.file); bad++; }
}
for (const f of files) {
  const r = JSON.parse(fs.readFileSync(new URL(f, dir)));
  for (const n of [r.img, ...r.problems.map(p => p.img), r.lock.img].filter(Boolean)) if (!credits[n]) { console.error(f, '그림', n, '이 credits.json 에 없어요'); bad++; }
  for (const n of [r.img, ...r.problems.map(p => p.img), r.lock.img].filter(Boolean)) usedImgs.add(n);
  if (codes.has(r.lock.code)) { console.error(f, '비밀번호', r.lock.code, '가', codes.get(r.lock.code), '와 겹쳐요'); bad++; }
  codes.set(r.lock.code, f);
  for (const p of r.problems) {
    if (!p.symbols) continue;
    const m = p.question.match(/^(.+?)\s*=\s*\?$/); if (!m) continue;
    const val = Object.fromEntries(p.symbols.map(s => [s.name, s.value]));
    const toks = m[1].split(/\s+/); let acc = val[toks[0]];
    for (let i = 1; i < toks.length; i += 2) { const b = val[toks[i + 1]]; acc = toks[i] === '×' ? acc * b : toks[i] === '+' ? acc + b : acc - b; }
    const ok = String(acc) === p.answer;
    console.log(f, '문제 4 왼쪽부터 계산:', p.question, '=', acc, ok ? 'OK' : 'ERROR(정답 ' + p.answer + ')');
    if (!ok) bad++;
  }
  const digits = r.problems.map(p => p.digit).join('');
  if (digits !== r.lock.code || digits.length !== r.lock.digits) { console.error(f, '비밀번호 불일치', digits, r.lock.code); bad++; }
  for (const p of r.problems) {
    if (!p.logic) continue;
    const L = p.logic, sols = [];
    for (let k = 1; k <= L.boxes; k++) {
      const liars = L.statements.filter(s => (s.type === 'is' ? s.box === k : s.box !== k) === false).length;
      if (liars === L.liars) sols.push(k);
    }
    console.log(f, p.title, '해 목록:', sols.join(','), sols.length === 1 && String(sols[0]) === p.answer ? 'OK(해 1개, 정답 일치)' : 'ERROR');
    if (!(sols.length === 1 && String(sols[0]) === p.answer)) bad++;
  }
  list.push({ id: r.id, title: r.title, level: r.level, minutes: r.minutes, problems: r.problems.length });
}
fs.writeFileSync(new URL('index.json', dir), JSON.stringify(list, null, 2) + '\n');
console.log('회차', list.length, '개, 오류', bad);

// 캐시 방지: render.js·style.css 내용 해시를 HTML 의 ?v= 에 적는다 (파일이 바뀌면 주소도 바뀜).
const h = crypto.createHash('sha1');
for (const f of ['assets/render.js', 'assets/style.css']) h.update(fs.readFileSync(new URL('../' + f, import.meta.url)));
for (const n of Object.keys(credits)) if (!usedImgs.has(n)) { console.error('credits.json 항목', n, '을 어떤 회차도 쓰지 않아요'); bad++; }
const v = h.digest('hex').slice(0, 8);
for (const n of ['index', 'sheet', 'answer']) {
  const u = new URL(`../${n}.html`, import.meta.url);
  fs.writeFileSync(u, fs.readFileSync(u, 'utf8').replace(/(assets\/(?:style\.css|render\.js))\?v=\w+/g, `$1?v=${v}`));
}
console.log('빌드 버전', v);
process.exit(bad ? 1 : 0);
