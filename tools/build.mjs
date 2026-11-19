// 사용법: node tools/build.mjs  -> rooms/*.json 을 검사하고 rooms/index.json 을 만든다.
import fs from 'node:fs';
const dir = new URL('../rooms/', import.meta.url);
const files = fs.readdirSync(dir).filter(f => /^\d+\.json$/.test(f)).sort();
const list = []; let bad = 0;
for (const f of files) {
  const r = JSON.parse(fs.readFileSync(new URL(f, dir)));
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
process.exit(bad ? 1 : 0);
