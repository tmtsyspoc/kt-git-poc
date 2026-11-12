#!/usr/bin/env node
/**
 * gen-mock.js - eXBuilder6 .clx 의 dataset/datamap 정의로 mock JSON 을 자동 생성한다.
 * 외부 의존성 없음 (Node 14+).
 *
 *   node tools/gen-mock/gen-mock.js <화면.clx ...> [옵션]
 *   node tools/gen-mock/gen-mock.js --help
 *
 * 출력 형식은 기존 data/*.json 과 같다:  { "DS_ID": [ {row}, ... ], "dmId": {row} }
 * 값은 tools/gen-mock/mock-rules.json 의 규칙(컬럼명/설명 패턴)으로 정하고,
 * 규칙이 없으면 datatype 별 기본값을 쓴다. --seed 가 같으면 결과도 같다.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const HELP = `사용법: node gen-mock.js <화면.clx ...> [옵션]

  --rows N            데이터셋당 행 수 (기본 10)
  --ds-rows A=5,B=20  데이터셋별 행 수 지정 (--rows 보다 우선)
  --seed N            난수 시드 (기본 1, 같으면 결과 동일)
  --only A,B          지정한 dataset/datamap 만 생성
  --exclude A,B       지정한 dataset/datamap 은 생성하지 않음 (예: 안내용 dsProcess)
  --maps              datamap(객체 1건)도 생성 (--only 로 지정하면 자동 포함)
  --edge              경계값 행 4건 추가 (빈값/긴 문자열/특수문자/최소·최대값)
  --empty             모든 데이터셋을 빈 배열로 생성 (엠티뷰 확인용)
  --rules FILE        추가 규칙 파일 (기본 규칙보다 우선 적용)
  --out DIR           출력 폴더 (기본: 화면.clx 옆의 data/)
  --file NAME         출력 파일명 (기본: <화면명>.mock.json, 단일 .clx 입력일 때만)
  --force             --file 로 지정한 기존 파일을 덮어씀
  --stdout            파일 대신 표준출력으로 JSON 만 출력
  --explain           컬럼별로 어떤 규칙이 적용됐는지 출력
  -h, --help          도움말

기본 출력 파일(<화면명>.mock.json)은 다시 실행하면 덮어쓴다.
손으로 만든 기존 data/*.json 은 --file 과 --force 를 함께 줘야만 덮어쓴다.`;

function die(msg) { console.error(`[gen-mock] ${msg}`); process.exit(1); }

// ---------------------------------------------------------------- 인자
function toInt(v, name) {
  const n = Number(v);
  if (!Number.isInteger(n) || n < 0) die(`${name} 값이 올바르지 않습니다: ${v}`);
  return n;
}

function parseArgs(argv) {
  const o = { files: [], rows: 10, seed: 1, dsRows: {}, only: null, exclude: [], maps: false, edge: false,
    empty: false, rules: null, out: null, file: null, force: false, stdout: false, explain: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => { if (i + 1 >= argv.length) die(`${a} 에 값이 없습니다`); return argv[++i]; };
    switch (a) {
      case '-h': case '--help': console.log(HELP); process.exit(0); break;
      case '--rows': o.rows = toInt(next(), a); break;
      case '--seed': o.seed = toInt(next(), a); break;
      case '--ds-rows':
        for (const kv of next().split(',')) {
          const [k, v] = kv.split('=');
          if (!k || v === undefined) die(`--ds-rows 형식 오류: ${kv} (예: DS_A=5,DS_B=20)`);
          o.dsRows[k.trim()] = toInt(v, '--ds-rows');
        }
        break;
      case '--only': o.only = next().split(',').map((s) => s.trim()).filter(Boolean); break;
      case '--exclude': o.exclude = next().split(',').map((s) => s.trim()).filter(Boolean); break;
      case '--maps': o.maps = true; break;
      case '--edge': o.edge = true; break;
      case '--empty': o.empty = true; break;
      case '--rules': o.rules = next(); break;
      case '--out': o.out = next(); break;
      case '--file': o.file = next(); break;
      case '--force': o.force = true; break;
      case '--stdout': o.stdout = true; break;
      case '--explain': o.explain = true; break;
      default:
        if (a.startsWith('-')) die(`알 수 없는 옵션: ${a}  (--help 참고)`);
        o.files.push(a);
    }
  }
  return o;
}

// ---------------------------------------------------------------- .clx 파싱
const ATTR_BODY = '((?:[^>"\']|"[^"]*"|\'[^\']*\')*)'; // 따옴표 안의 '>' 허용

function decode(s) {
  return s.replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&amp;/g, '&');
}

function attrs(str) {
  const r = {};
  const re = /([\w:.-]+)\s*=\s*"([^"]*)"/g;
  let m;
  while ((m = re.exec(str))) r[m[1]] = decode(m[2]);
  return r;
}

/** .clx 텍스트에서 dataset / datamap 블록과 컬럼 정의를 뽑는다. */
function parseClx(text) {
  text = text.replace(/^﻿/, '').replace(/<!--[\s\S]*?-->/g, '');
  const blockRe = new RegExp(`<cl:(dataset|datamap)\\b${ATTR_BODY}>`, 'g');
  const colRe = new RegExp(`<cl:datacolumn\\b${ATTR_BODY}>`, 'g');
  const blocks = [];
  let m;
  while ((m = blockRe.exec(text))) {
    const kind = m[1];
    if (/\/\s*$/.test(m[2])) continue; // 자기닫힘 태그: 컬럼 없음
    const end = text.indexOf(`</cl:${kind}>`, blockRe.lastIndex);
    if (end < 0) continue;
    const body = text.slice(blockRe.lastIndex, end);
    const a = attrs(m[2]);
    blockRe.lastIndex = end;
    if (!a.id) continue;
    const columns = [];
    const list = /<cl:datacolumnlist>([\s\S]*?)<\/cl:datacolumnlist>/.exec(body);
    if (list) {
      colRe.lastIndex = 0;
      let c;
      while ((c = colRe.exec(list[1]))) {
        const ca = attrs(c[1]);
        if (!ca.name) continue;
        columns.push({
          name: ca.name,
          datatype: (ca.datatype || 'string').toLowerCase(),
          comment: ca.comment || '',
          commentCore: coreOf(ca.comment || ''),
        });
      }
    }
    blocks.push({ kind, id: a.id, comment: a.comment || '', columns });
  }
  return blocks;
}

// ---------------------------------------------------------------- 난수 / 유틸
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

const pad = (n, w) => String(n).padStart(w, '0');

function fmtDate(ms, format) {
  const d = new Date(ms);
  const t = {
    yyyy: pad(d.getUTCFullYear(), 4), MM: pad(d.getUTCMonth() + 1, 2), dd: pad(d.getUTCDate(), 2),
    HH: pad(d.getUTCHours(), 2), mm: pad(d.getUTCMinutes(), 2), ss: pad(d.getUTCSeconds(), 2),
  };
  return format.replace(/yyyy|MM|dd|HH|mm|ss/g, (k) => t[k]);
}

function parseDate(s) {
  const ms = Date.parse(/^\d{4}-\d{2}-\d{2}$/.test(s) ? `${s}T00:00:00Z` : s);
  if (Number.isNaN(ms)) die(`날짜 형식 오류: ${s} (예: 2023-01-01)`);
  return ms;
}

// ---------------------------------------------------------------- comment 해석
/** comment 에서 괄호 부분을 뺀 핵심 문구. "가입일(YYYYMMDD)" → "가입일". 전부 괄호면 원문. */
function coreOf(comment) {
  const core = comment.replace(/[(（\[{][^)）\]}]*[)）\]}]/g, '').replace(/\s+/g, ' ').trim();
  return core || comment.trim();
}

/** 규칙의 comment 패턴은 괄호를 뺀 문구와 원문 둘 중 하나에 맞으면 일치로 본다. */
function testComment(rx, col) { return rx.test(col.commentCore) || rx.test(col.comment); }

const UNIT_TOKENS = new Set(['원', '월', '년', '일', '건', '명', '개', '%', '시', '분', '초', '회', '만원', '천원', '억']);

/**
 * comment 의 첫 괄호 안에 값 목록이 있으면 뽑는다.
 *   "사용여부(Y/N)" → ['Y','N'],  "구분(1:개인, 2:법인)" → ['1','2'] (코드 쪽을 사용)
 * 금액(원/월) 처럼 단위 표기이거나, 숫자·날짜 컬럼의 단순 나열은 힌트로 보지 않는다.
 */
function enumHint(col) {
  const m = /[(（\[{]([^)）\]}]+)[)）\]}]/.exec(col.comment);
  if (!m) return null;
  const body = m[1];
  const hasPair = /[:=]/.test(body);
  const tokens = body.split(hasPair ? /[\s,\/|·]+/ : /\s*[\/,|·]\s*/).map((t) => t.trim()).filter(Boolean);
  if (tokens.length < 2 || tokens.length > 12 || tokens.some((t) => t.length > 20)) return null;
  if (hasPair) {
    if (!tokens.every((t) => /^.+?[:=].+$/.test(t))) return null;
    return tokens.map((t) => t.split(/[:=]/)[0].trim());
  }
  if (['number', 'decimal', 'date'].includes(col.datatype)) return null;
  if (tokens.some((t) => UNIT_TOKENS.has(t.toLowerCase()))) return null;
  return tokens;
}

// ---------------------------------------------------------------- 값 생성기
const SURNAMES = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '한', '오', '서', '신', '권', '황', '안', '송', '류', '홍'];
const GIVEN = ['민준', '서연', '지훈', '하윤', '도윤', '지우', '예준', '서현', '주원', '수빈', '건우', '유진', '현우', '지민', '승현', '나연', '태양', '소율', '시우', '다은'];
const ENG_FIRST = ['Minjun', 'Seoyeon', 'Jihoon', 'Hayun', 'Doyun', 'Jiwoo', 'Yejun', 'Seohyun'];
const ENG_LAST = ['Kim', 'Lee', 'Park', 'Choi', 'Jung', 'Kang', 'Cho', 'Yoon'];
const AREAS = ['서울특별시 강남구', '서울특별시 마포구', '경기도 성남시 분당구', '부산광역시 해운대구', '대구광역시 수성구', '인천광역시 연수구'];
const ROADS = ['중앙로', '행복로', '샘터로', '한빛로', '푸른길', '새봄로'];
const SUBJECTS = ['계약 내용', '결제일', '연락처', '납입 금액', '고객 정보', '보험금 청구', '증명서 발급', '자동이체'];
const ACTIONS = ['문의', '변경 요청', '확인 요청', '절차 안내', '접수', '처리 결과 안내'];
const fileCache = new Map();
const warned = new Set();

function loadRows(baseDir, spec) {
  const file = path.resolve(baseDir, spec.file);
  const key = `${file}::${spec.path}`;
  if (!fileCache.has(key)) {
    let rows = [];
    try {
      const j = JSON.parse(fs.readFileSync(file, 'utf8').replace(/^﻿/, ''));
      rows = Array.isArray(j[spec.path]) ? j[spec.path] : [];
    } catch (e) { /* 아래에서 경고 */ }
    if (!rows.length && !warned.has(key)) {
      warned.add(key);
      console.error(`[gen-mock] 경고: ${spec.file} 의 '${spec.path}' 를 읽지 못해 fallback 값을 사용합니다.`);
    }
    fileCache.set(key, rows);
  }
  return fileCache.get(key);
}

const GENS = {
  int: (s, c) => {
    const min = s.min ?? 0, max = s.max ?? 1000, step = s.step ?? 1;
    return min + c.int(0, Math.floor((max - min) / step)) * step;
  },
  decimal: (s, c) => {
    const min = s.min ?? 0, max = s.max ?? 10000;
    return Number((min + c.rnd() * (max - min)).toFixed(s.scale ?? 2));
  },
  sequence: (s, c) => {
    const v = (s.start ?? 1) + c.row * (s.step ?? 1);
    if (!s.prefix && !s.suffix && !s.pad) return v;
    return `${s.prefix || ''}${s.pad ? pad(v, s.pad) : v}${s.suffix || ''}`;
  },
  enum: (s, c) => {
    if (!s.unique) return c.pick(s.values);
    // unique: 행 순서대로 서로 다른 값을 쓴다(값이 소진되면 반복). 시작 위치만 데이터셋·컬럼마다 다르다.
    const n = s.values.length;
    return s.values[(c.row + (hash(`${c.ds ? c.ds.id : ''}.${c.col.name}`) % n)) % n];
  },
  // 값을 순서대로 반복: 행 0,1,2.. → values[0], values[1], .. (행 수가 values 길이와 같으면 각 값이 한 번씩)
  list: (s, c) => s.values[c.row % s.values.length],
  yn: (s, c) => c.pick(['Y', 'N']),
  const: (s) => s.value,
  label: (s, c) => `${c.col.name}_${c.row + 1}`,
  // comment 문구 기반 값: "상담상세내용 1", "상담상세내용 2" ...
  commentLabel: (s, c) => `${c.col.commentCore || c.col.name} ${c.row + 1}`,
  // comment 문구 + 번호 N개 중 하나: "구분1" ~ "구분3"
  commentEnum: (s, c) => `${c.col.commentCore || c.col.name}${c.int(1, s.count ?? 3)}`,
  // 형식 문자열: # = 숫자, A = 대문자, a = 소문자, 나머지는 그대로. 예) "###-##-#####"
  pattern: (s, c) => String(s.pattern || '').replace(/[#Aa]/g, (ch) => (ch === '#' ? String(c.int(0, 9)) : String.fromCharCode((ch === 'A' ? 65 : 97) + c.int(0, 25)))),
  // comment 괄호의 값 목록(Y/N, 1:개인/2:법인 ...). 실제 값은 generateBlock 에서 enum 으로 치환된다.
  commentHint: (s, c) => GENS.commentLabel(s, c),
  digits: (s, c) => {
    let r = String(c.int(1, 9));
    for (let i = 1; i < (s.length || 6); i++) r += c.int(0, 9);
    return r;
  },
  koreanName: (s, c) => c.pick(SURNAMES) + c.pick(GIVEN),
  engName: (s, c) => `${c.pick(ENG_FIRST)} ${c.pick(ENG_LAST)}`,
  phone: (s, c) => {
    const mobile = s.kind === 'mobile' || (s.kind !== 'landline' && c.rnd() < 0.5);
    return mobile
      ? `010-${pad(c.int(0, 9999), 4)}-${pad(c.int(0, 9999), 4)}`
      : `${c.pick(['02', '031', '032', '051', '053', '062', '042'])}-${c.int(200, 9999)}-${pad(c.int(0, 9999), 4)}`;
  },
  // 주민번호 형태(13자리). 체크섬을 일부러 틀리게 만들어 실존 번호와 겹치지 않게 한다.
  jumin: (s, c) => {
    const y = c.int(1950, 2005);
    const front = `${pad(y % 100, 2)}${pad(c.int(1, 12), 2)}${pad(c.int(1, 28), 2)}`;
    const body = front + String(y < 2000 ? c.int(1, 2) : c.int(3, 4)) + pad(c.int(0, 99999), 5);
    const w = [2, 3, 4, 5, 6, 7, 8, 9, 2, 3, 4, 5];
    const sum = body.split('').reduce((a, d, i) => a + Number(d) * w[i], 0);
    const good = (11 - (sum % 11)) % 10;
    return body + ((good + c.int(1, 9)) % 10); // good 와 항상 다름
  },
  email: (s, c) => `${c.pick(['hong', 'kim', 'lee', 'park', 'choi'])}${c.int(1, 9999)}@${c.pick(['example.com', 'example.org', 'example.net'])}`,
  address: (s, c) => `${c.pick(AREAS)} ${c.pick(ROADS)} ${c.int(1, 300)}`,
  text: (s, c) => `${c.pick(SUBJECTS)} ${c.pick(ACTIONS)}`,
  date: (s, c) => {
    const from = parseDate(s.from || '2023-01-01'), to = parseDate(s.to || '2025-12-31');
    return fmtDate(from + Math.floor(c.rnd() * (to - from)), s.format || 'yyyyMMdd');
  },
  fromFile: (s, c) => {
    const rows = loadRows(c.baseDir, s);
    if (rows.length) return c.pick(rows)[s.field];
    return s.fallback ? c.pick(s.fallback) : GENS.label(s, c);
  },
};

// ---------------------------------------------------------------- 규칙
const reCache = new Map();
function re(src) {
  if (!reCache.has(src)) reCache.set(src, new RegExp(src, 'i'));
  return reCache.get(src);
}

function loadRules(extraFile) {
  const files = [];
  if (extraFile) files.push(path.resolve(extraFile));
  files.push(path.join(__dirname, 'mock-rules.json'));
  const rules = [];
  for (const f of files) {
    let j;
    try { j = JSON.parse(fs.readFileSync(f, 'utf8').replace(/^﻿/, '')); }
    catch (e) { die(`규칙 파일을 읽을 수 없습니다: ${f} (${e.message})`); }
    (j.rules || []).forEach((r, i) => {
      const t = r.gen && r.gen.type;
      if (!GENS[t]) die(`${path.basename(f)} 규칙 #${i + 1}(${r.name || ''}): 알 수 없는 gen.type '${t}'`);
      const m = r.match || {};
      for (const k of Object.keys(m)) {
        if (!['dataset', 'column', 'comment', 'columnOrComment'].includes(k)) die(`${path.basename(f)} 규칙 #${i + 1}: 알 수 없는 match 키 '${k}'`);
        try { re(m[k]); } catch (e) { die(`${path.basename(f)} 규칙 #${i + 1}: 정규식 오류 '${m[k]}'`); }
      }
      if (!Object.keys(m).length) die(`${path.basename(f)} 규칙 #${i + 1}(${r.name || ''}): match 가 비어 있습니다`);
      rules.push({ ...r, _src: `${path.basename(f)}#${i + 1}` });
    });
  }
  return rules;
}

function findRule(rules, ds, col) {
  for (const r of rules) {
    const m = r.match;
    if (m.dataset && !re(m.dataset).test(ds.id)) continue;
    if (m.column && !re(m.column).test(col.name)) continue;
    if (m.comment && !testComment(re(m.comment), col)) continue;
    if (m.columnOrComment && !(re(m.columnOrComment).test(col.name) || testComment(re(m.columnOrComment), col))) continue;
    if (r.gen.type === 'commentHint' && !enumHint(col)) continue; // 값 목록을 못 뽑으면 다음 규칙으로
    return r;
  }
  return null;
}

function defaultSpec(col) {
  switch (col.datatype) {
    case 'number': return { type: 'int', min: 0, max: 1000 };
    case 'decimal': return { type: 'decimal', min: 0, max: 10000, scale: 2 };
    case 'date': return { type: 'date', format: 'yyyyMMdd' };
    default: return col.comment ? { type: 'commentLabel' } : { type: 'label' };
  }
}

// ---------------------------------------------------------------- 경계값
const LONG = '가나다라마바사아자차카타파하'.repeat(15);
const SPECIAL = '<script>alert("x")</script> & \' " \\ /';
const EDGE_ROWS = 4;

function edgeValue(col, spec, k) {
  const numeric = spec.type === 'int' || spec.type === 'decimal' || col.datatype === 'number' || col.datatype === 'decimal';
  if (numeric) {
    const dec = spec.type === 'decimal' || col.datatype === 'decimal';
    return (dec ? [0, -0.01, 99999999.99, 0.01] : [0, -1, 2147483647, 1])[k];
  }
  if (spec.type === 'date' || col.datatype === 'date') {
    const f = spec.format || 'yyyyMMdd';
    return ['', fmtDate(Date.UTC(1900, 0, 1), f), fmtDate(Date.UTC(9999, 11, 31, 23, 59, 59), f), fmtDate(Date.UTC(2024, 1, 29), f)][k];
  }
  return ['', LONG, SPECIAL, '  앞뒤 공백  '][k];
}

// ---------------------------------------------------------------- 생성
function coerce(v, col) {
  if (v === null || v === undefined) return null;
  if (col.datatype === 'number' || col.datatype === 'decimal') {
    const n = Number(v);
    return Number.isNaN(n) ? v : n;
  }
  return String(v);
}

function generateBlock(ds, o, rules, baseDir) {
  const cols = ds.columns.filter((c) => c.datatype !== 'expression');
  const skipped = ds.columns.length - cols.length;
  const plan = cols.map((col) => {
    // 호출자가 컬럼별 값 규칙을 직접 지정한 경우(mock-server 설정 등)에는 그것을 최우선으로 쓴다.
    const over = o.colSpecs && o.colSpecs[col.name];
    if (over) {
      if (!GENS[over.type]) die(`컬럼 ${col.name}: 알 수 없는 gen.type '${over.type}'`);
      return { col, spec: over, rule: { name: '설정 지정', gen: over, _src: 'mock-config' }, via: 'rule' };
    }
    const rule = findRule(rules, ds, col);
    if (rule) {
      const spec = rule.gen.type === 'commentHint' ? { type: 'enum', values: enumHint(col) } : rule.gen;
      return { col, spec, rule, via: 'rule' };
    }
    const spec = defaultSpec(col);
    return { col, spec, rule: null, via: spec.type === 'commentLabel' ? 'comment' : 'default' };
  });
  const rnd = mulberry32((o.seed ^ hash(ds.id)) >>> 0);
  const ctxBase = {
    rnd,
    int: (a, b) => a + Math.floor(rnd() * (b - a + 1)),
    pick: (arr) => arr[Math.floor(rnd() * arr.length)],
    baseDir,
  };
  const makeRow = (row, edgeIdx) => {
    const r = {};
    for (const { col, spec } of plan) {
      const v = edgeIdx !== undefined ? edgeValue(col, spec, edgeIdx) : GENS[spec.type](spec, { ...ctxBase, row, col, ds });
      r[col.name] = coerce(v, col);
    }
    return r;
  };

  let data;
  if (ds.kind === 'datamap') {
    data = o.empty ? Object.fromEntries(plan.map(({ col }) => [col.name, ''])) : makeRow(0);
  } else {
    const n = o.empty ? 0 : (o.dsRows[ds.id] ?? o.rows);
    data = [];
    for (let i = 0; i < n; i++) data.push(makeRow(i));
    if (o.edge && !o.empty) for (let k = 0; k < EDGE_ROWS; k++) data.push(makeRow(n + k, k));
  }
  return { data, plan, skipped };
}

function serialize(obj) {
  const parts = Object.entries(obj).map(([k, v]) => {
    if (Array.isArray(v)) {
      const body = v.length ? `\n${v.map((r) => `\t\t${JSON.stringify(r)}`).join(',\n')}\n\t` : '';
      return `\t${JSON.stringify(k)}: [${body}]`;
    }
    return `\t${JSON.stringify(k)}: ${JSON.stringify(v)}`;
  });
  return `{\n${parts.join(',\n')}\n}\n`;
}

// ---------------------------------------------------------------- 실행
function processFile(clxPath, o, rules) {
  const log = o.stdout ? console.error : console.log;
  let text;
  try { text = fs.readFileSync(clxPath, 'utf8'); } catch (e) { die(`읽을 수 없습니다: ${clxPath}`); }
  const baseDir = path.dirname(path.resolve(clxPath));
  let blocks = parseClx(text);
  if (o.only) {
    const missing = o.only.filter((id) => !blocks.some((b) => b.id === id));
    if (missing.length) die(`${path.basename(clxPath)} 에 없는 id: ${missing.join(', ')} (있는 id: ${blocks.map((b) => b.id).join(', ')})`);
    blocks = blocks.filter((b) => o.only.includes(b.id));
  } else if (!o.maps) {
    blocks = blocks.filter((b) => b.kind === 'dataset');
  }
  if (o.exclude.length) blocks = blocks.filter((b) => !o.exclude.includes(b.id));
  if (!blocks.length) { log(`[gen-mock] ${path.basename(clxPath)}: 생성할 dataset 이 없습니다.`); return; }

  const result = {};
  log(`[gen-mock] ${path.basename(clxPath)}  (seed=${o.seed})`);
  for (const ds of blocks) {
    if (result[ds.id] !== undefined) { console.error(`[gen-mock] 경고: id '${ds.id}' 가 중복되어 첫 번째만 사용합니다.`); continue; }
    const { data, plan, skipped } = generateBlock(ds, o, rules, baseDir);
    result[ds.id] = data;
    const byRule = plan.filter((p) => p.via === 'rule').length;
    const byComment = plan.filter((p) => p.via === 'comment').length;
    const fallback = plan.filter((p) => p.via === 'default').map((p) => p.col.name);
    const rowsInfo = Array.isArray(data) ? `${data.length}행` : '객체 1건';
    log(`  - ${ds.id} [${ds.kind}] ${rowsInfo}, 컬럼 ${plan.length}개 (규칙 ${byRule}${byComment ? ` / comment 라벨 ${byComment}` : ''}${fallback.length ? ` / 기본값 ${fallback.length}: ${fallback.join(', ')}` : ''})${skipped ? `, expression ${skipped}개 제외` : ''}`);
    if (o.explain) {
      for (const p of plan) {
        const how = p.via === 'rule'
          ? `${p.rule.name || p.rule.gen.type} (${p.rule._src})${p.rule.gen.type === 'commentHint' ? ` 값=${p.spec.values.join('|')}` : ''}`
          : p.via === 'comment' ? `comment 라벨 '${p.col.commentCore}'` : `기본(${p.spec.type})`;
        log(`      ${p.col.name.padEnd(20)} ${p.col.datatype.padEnd(8)} ${(p.col.comment || '-').padEnd(14)} → ${how}`);
      }
    }
  }

  const json = serialize(result);
  JSON.parse(json); // 자체 검증
  if (o.stdout) { process.stdout.write(json); return; }

  const outDir = o.out ? path.resolve(o.out) : path.join(baseDir, 'data');
  const name = o.file || `${path.basename(clxPath, path.extname(clxPath))}.mock.json`;
  const outPath = path.join(outDir, name);
  if (o.file && fs.existsSync(outPath) && !o.force) die(`이미 존재하는 파일입니다: ${outPath}  (덮어쓰려면 --force)`);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outPath, json, 'utf8');
  log(`[gen-mock] 저장: ${outPath}`);
}

function main() {
  const o = parseArgs(process.argv.slice(2));
  if (!o.files.length) { console.log(HELP); process.exit(1); }
  if (o.file && o.files.length > 1) die('--file 은 .clx 를 하나만 입력할 때 사용할 수 있습니다.');
  const rules = loadRules(o.rules);
  for (const f of o.files) processFile(f, o, rules);
}

if (require.main === module) main();

// mock-server 등에서 라이브러리로 사용
module.exports = { parseClx, loadRules, generateBlock, attrs, ATTR_BODY, GENS };
