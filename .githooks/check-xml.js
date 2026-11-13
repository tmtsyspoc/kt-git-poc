#!/usr/bin/env node
// .clx(XML) well-formedness 검사 - 외부 의존성 없음.
// 사용: git diff --cached --name-only -z -- '*.clx' | node .githooks/check-xml.js
// stdin 으로 NUL 구분 경로 목록을 받아, 각 파일의 "스테이징된 내용"을 검사한다.
// (eXBuilder6 .clx 는 XML 1.0 / 1.1 이 섞여 있어 버전 선언은 검사하지 않는다.)
'use strict';
const { execFileSync } = require('child_process');

function check(src) {
  src = src.replace(/^﻿/, '');
  const stack = [];
  const lineOf = (pos) => src.slice(0, pos).split('\n').length;
  const fail = (msg, pos) => { throw new Error(`${msg} (line ${lineOf(pos)})`); };
  const nameRe = /[^\s\/>=<"']+/y;
  let i = 0, roots = 0;

  while (i < src.length) {
    const lt = src.indexOf('<', i);
    if (lt < 0) break;
    if (stack.length === 0 && src.slice(i, lt).trim() !== '') fail('루트 밖에 텍스트가 있음', i);

    if (src.startsWith('<!--', lt)) {
      const e = src.indexOf('-->', lt + 4);
      if (e < 0) fail('닫히지 않은 주석', lt);
      i = e + 3;
    } else if (src.startsWith('<![CDATA[', lt)) {
      const e = src.indexOf(']]>', lt + 9);
      if (e < 0) fail('닫히지 않은 CDATA', lt);
      i = e + 3;
    } else if (src.startsWith('<?', lt)) {
      const e = src.indexOf('?>', lt + 2);
      if (e < 0) fail('닫히지 않은 처리 명령(<?...?>)', lt);
      i = e + 2;
    } else if (src.startsWith('<!', lt)) {
      let e = src.indexOf('>', lt);
      const br = src.indexOf('[', lt);
      if (br >= 0 && br < e) { const c = src.indexOf(']', br); e = c < 0 ? -1 : src.indexOf('>', c); }
      if (e < 0) fail('닫히지 않은 선언(<!...>)', lt);
      i = e + 1;
    } else if (src.startsWith('</', lt)) {
      const e = src.indexOf('>', lt);
      if (e < 0) fail('닫히지 않은 종료 태그', lt);
      const name = src.slice(lt + 2, e).trim();
      const open = stack.pop();
      if (open === undefined) fail(`짝 없는 종료 태그 </${name}>`, lt);
      if (open !== name) fail(`태그 불일치: <${open}> 를 </${name}> 로 닫음`, lt);
      i = e + 1;
    } else {
      nameRe.lastIndex = lt + 1;
      const m = nameRe.exec(src);
      if (!m) fail("'<' 뒤에 태그 이름이 없음", lt);
      const tag = m[0];
      let p = nameRe.lastIndex;
      const seen = new Set();
      for (;;) {
        while (p < src.length && /\s/.test(src[p])) p++;
        if (p >= src.length) fail(`닫히지 않은 시작 태그 <${tag}>`, lt);
        if (src[p] === '>') { stack.push(tag); if (stack.length === 1) roots++; p++; break; }
        if (src.startsWith('/>', p)) { if (stack.length === 0) roots++; p += 2; break; }
        nameRe.lastIndex = p;
        const a = nameRe.exec(src);
        if (!a) fail(`<${tag}> 의 속성 구문 오류`, p);
        p = nameRe.lastIndex;
        while (p < src.length && /\s/.test(src[p])) p++;
        if (src[p] !== '=') fail(`속성 '${a[0]}' 에 '=' 없음 (<${tag}>)`, p);
        p++;
        while (p < src.length && /\s/.test(src[p])) p++;
        const q = src[p];
        if (q !== '"' && q !== "'") fail(`속성 '${a[0]}' 값에 따옴표 없음 (<${tag}>)`, p);
        const qe = src.indexOf(q, p + 1);
        if (qe < 0) fail(`속성 '${a[0]}' 값의 따옴표가 닫히지 않음 (<${tag}>)`, p);
        if (src.slice(p + 1, qe).includes('<')) fail(`속성 '${a[0]}' 값에 '<' 포함 (<${tag}>)`, p);
        if (seen.has(a[0])) fail(`속성 '${a[0]}' 중복 (<${tag}>)`, p);
        seen.add(a[0]);
        p = qe + 1;
      }
      i = p;
    }
  }
  if (stack.length) fail(`닫히지 않은 태그 <${stack[stack.length - 1]}>`, src.length);
  if (roots !== 1) throw new Error(`루트 요소가 ${roots}개 (1개여야 함)`);
}

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (d) => { input += d; });
process.stdin.on('end', () => {
  const files = input.split('\0').filter(Boolean);
  let bad = 0;
  for (const f of files) {
    try {
      const buf = execFileSync('git', ['show', ':' + f], { maxBuffer: 512 * 1024 * 1024 });
      check(buf.toString('utf8'));
    } catch (e) {
      bad++;
      console.log(`  [CLX XML 오류] ${f}\n      ${String(e.message).split('\n')[0]}`);
    }
  }
  process.exit(bad ? 1 : 0);
});
