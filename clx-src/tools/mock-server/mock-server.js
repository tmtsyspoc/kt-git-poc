#!/usr/bin/env node
/**
 * mock-server.js - eXBuilder6 개발 서버 앞에 두는 동적 Mock 프록시 (의존성 없음, Node 14+)
 *
 *   브라우저 → mock-server(:3000) ─ 일반 요청 ──────────→ 개발 서버(:8080)  (그대로 통과)
 *                                  └ submission 의 action URL → 자동 생성한 JSON 응답
 *
 *   node clx-src/tools/mock-server/mock-server.js            (mock-config.json 사용)
 *   node clx-src/tools/mock-server/mock-server.js --help
 *
 * 동작 방식
 *  1) 설정한 .clx 에서 <cl:submission action> 과 <cl:responsedata dataid/alias> 를 읽어 라우트 표를 만든다.
 *     (화면 .js 의 getResponseData("X").alias = "Y" 지정도 읽어 Y 키를 응답에 포함한다.)
 *  2) 해당 URL 로 요청이 오면 dataset 정의(컬럼 comment 포함)와 tools/gen-mock 규칙으로 응답 JSON 을 만든다.
 *     응답 형식은 기존 정적 JSON 과 같다: { "DS_ID": [ {row}, ... ] }
 *  3) 그 URL 에 기존 정적 파일(fixture)이 있으면 mode=fixture 로 그 값을 그대로 쓰고,
 *     .clx 에는 있는데 파일 행에 없는 컬럼은 생성해서 채운다.
 *  4) 그 밖의 모든 요청은 개발 서버로 그대로 전달한다.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const http = require('http');
const net = require('net');
const { URL } = require('url');
const gen = require('../gen-mock/gen-mock.js');

const HELP = `사용법: node mock-server.js [옵션]

  --config FILE     설정 파일 (기본: 같은 폴더의 mock-config.json)
  --port N          mock 서버 포트 (기본 3000)
  --target URL      통과시킬 개발 서버 (기본 http://localhost:8080)
  --screens A,B     mock 대상 화면(.clx, 웹 루트 기준 경로). 예) app/sce/A14/A14-2-2.clx
  --all             웹 루트 아래 모든 .clx 를 대상으로 함
  --root DIR        웹 루트 (기본: clx-src)
  --mode M          generate(기본) | fixture  - 기존 정적 JSON 이 있으면 그 값을 쓸지 여부
  --rows N          데이터셋당 행 수 (기본 10)
  --seed S          stable(기본: 같은 요청은 같은 응답) | random(매번 다름) | 숫자
  --delay MS        응답 지연. 300 또는 200-800
  --verbose         통과시킨 요청도 로그에 출력
  -h, --help        도움말

실행 중 제어(관리 API)
  GET    /__mock/routes      라우트 표
  GET    /__mock/scenario    현재 시나리오
  POST   /__mock/scenario    {"delay":"200-800","status":500,"empty":true,"edge":true,"mode":"fixture","rows":50,"seed":"random"}
  DELETE /__mock/scenario    시나리오 초기화
  POST   /__mock/reload      .clx / 설정 / 규칙 다시 읽기
요청 URL 에 ?__mock_delay=&__mock_status=&__mock_empty=1&__mock_edge=1&__mock_mode=&__mock_rows=&__mock_seed= 를 붙여 한 번만 바꿀 수도 있다.`;

function die(msg) { console.error(`[mock-server] ${msg}`); process.exit(1); }

// ---------------------------------------------------------------- 설정
const DEFAULTS = {
  port: 3000, target: 'http://localhost:8080', screens: [], all: false, mode: 'generate', rows: 10,
  seed: 'stable', delay: 0, verbose: false, includeFixtureExtras: true, keys: {},
  root: path.resolve(__dirname, '..', '..'),
};

function parseArgs(argv) {
  const o = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => { if (i + 1 >= argv.length) die(`${a} 에 값이 없습니다`); return argv[++i]; };
    switch (a) {
      case '-h': case '--help': console.log(HELP); process.exit(0); break;
      case '--config': o.config = next(); break;
      case '--port': o.port = Number(next()); break;
      case '--target': o.target = next(); break;
      case '--screens': o.screens = next().split(',').map((s) => s.trim()).filter(Boolean); break;
      case '--all': o.all = true; break;
      case '--root': o.root = path.resolve(next()); break;
      case '--mode': o.mode = next(); break;
      case '--rows': o.rows = Number(next()); break;
      case '--seed': o.seed = next(); break;
      case '--delay': o.delay = next(); break;
      case '--verbose': o.verbose = true; break;
      default: die(`알 수 없는 옵션: ${a}  (--help 참고)`);
    }
  }
  return o;
}

const cli = parseArgs(process.argv.slice(2));

function loadConfig() {
  const file = path.resolve(cli.config || path.join(__dirname, 'mock-config.json'));
  let fileCfg = {};
  if (fs.existsSync(file)) {
    try { fileCfg = JSON.parse(fs.readFileSync(file, 'utf8').replace(/^﻿/, '')); }
    catch (e) { die(`설정 파일을 읽을 수 없습니다: ${file} (${e.message})`); }
  } else if (cli.config) die(`설정 파일이 없습니다: ${file}`);
  const cfg = { ...DEFAULTS, ...fileCfg, ...cli };
  if (typeof cfg.seed === 'string' && /^\d+$/.test(cfg.seed)) cfg.seed = Number(cfg.seed);
  if (!['generate', 'fixture'].includes(cfg.mode)) die(`mode 는 generate 또는 fixture 여야 합니다: ${cfg.mode}`);
  if (!Number.isInteger(cfg.port) || cfg.port < 1) die(`port 값이 올바르지 않습니다: ${cfg.port}`);
  cfg.root = path.resolve(cfg.root);
  return cfg;
}

// ---------------------------------------------------------------- 라우트 표
function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['thirdparty', 'tools', 'node_modules', '.git', '.svn'].includes(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out); else if (e.name.endsWith('.clx')) out.push(p);
  }
  return out;
}

function parseSubmissions(text) {
  text = text.replace(/<!--[\s\S]*?-->/g, '');
  const re = new RegExp(`<cl:submission\\b${gen.ATTR_BODY}>`, 'g');
  const subs = [];
  let m;
  while ((m = re.exec(text))) {
    const a = gen.attrs(m[1]);
    let body = '';
    if (!/\/\s*$/.test(m[1])) {
      const end = text.indexOf('</cl:submission>', re.lastIndex);
      if (end >= 0) { body = text.slice(re.lastIndex, end); re.lastIndex = end; }
    }
    const res = [];
    const dre = new RegExp(`<cl:responsedata\\b${gen.ATTR_BODY}>`, 'g');
    let d;
    while ((d = dre.exec(body))) {
      const da = gen.attrs(d[1]);
      if (da.dataid) res.push({ dataid: da.dataid, alias: da.alias || null });
    }
    subs.push({ id: a.id || '', action: a.action || '', responsetype: (a.responsetype || '').toLowerCase(), res });
  }
  return subs;
}

/** 화면 .js 에서 getResponseData("DS_X").alias = "DS_Y" 지정을 찾는다. → { DS_X: Set(DS_Y) } */
function jsAliases(jsPath) {
  const out = {};
  if (!fs.existsSync(jsPath)) return out;
  const re = /getResponseData\(\s*["'](\w+)["']\s*\)\s*\.alias\s*=\s*["'](\w+)["']/g;
  const text = fs.readFileSync(jsPath, 'utf8');
  let m;
  while ((m = re.exec(text))) (out[m[1]] = out[m[1]] || new Set()).add(m[2]);
  return out;
}

function normalizeAction(action) {
  if (!action || /^[a-z]+:\/\//i.test(action)) return null;
  const u = action.split(/[?#]/)[0].replace(/^(\.\/|\/)+/, '');
  return !u || u.includes('..') ? null : u;
}

function buildRoutes(cfg) {
  const screens = cfg.all
    ? walk(cfg.root).map((f) => path.relative(cfg.root, f).split(path.sep).join('/'))
    : cfg.screens;
  if (!screens.length) die('mock 대상 화면이 없습니다. --screens 또는 mock-config.json 의 screens 를 지정하세요. (--all 로 전체 가능)');

  const routes = new Map();
  const skipped = [];
  const warnings = [];
  for (const rel of screens) {
    const file = path.resolve(cfg.root, rel);
    if (!fs.existsSync(file)) { warnings.push(`화면 파일 없음: ${rel}`); continue; }
    const text = fs.readFileSync(file, 'utf8');
    const byId = new Map(gen.parseClx(text).map((b) => [b.id, b]));
    const extra = jsAliases(file.replace(/\.clx$/, '.js'));
    const baseDir = path.dirname(file);
    for (const s of parseSubmissions(text)) {
      const url = normalizeAction(s.action);
      if (!url) continue;
      const tag = `${path.basename(rel)}#${s.id}`;
      if (['text', 'blob', 'filedownload'].includes(s.responsetype)) { skipped.push({ url, sub: tag, reason: `responsetype=${s.responsetype} (JSON 아님)` }); continue; }
      if (!s.res.length) { skipped.push({ url, sub: tag, reason: 'responsedata 없음' }); continue; }
      let r = routes.get(url);
      if (!r) { r = { url, subs: [], keys: new Map() }; routes.set(url, r); }
      r.subs.push(tag);
      for (const rd of s.res) {
        const ds = byId.get(rd.dataid) || null;
        const base = rd.alias || rd.dataid;
        const names = [[base, rd.alias ? 'clx alias' : 'clx']];
        for (const x of (extra[rd.dataid] || [])) if (x !== base) names.push([x, 'js alias']);
        for (const [key, via] of names) {
          const cur = r.keys.get(key);
          if (!cur) { r.keys.set(key, { key, ds, via, dataid: rd.dataid, baseDir }); continue; }
          if (!cur.ds) cur.ds = ds;
          else if (ds) for (const c of ds.columns) if (!cur.ds.columns.some((x) => x.name === c.name)) cur.ds.columns.push(c);
        }
        if (!ds) warnings.push(`${tag}: responsedata '${rd.dataid}' 의 dataset 정의를 찾지 못함 (정적 파일 값이 있을 때만 응답)`);
      }
    }
  }
  return { routes: [...routes.values()].sort((a, b) => b.url.length - a.url.length), skipped, warnings };
}

// ---------------------------------------------------------------- 응답 생성
const fixCache = new Map();
function fixtureFor(root, url) {
  const f = path.join(root, url);
  try {
    const st = fs.statSync(f);
    const c = fixCache.get(f);
    if (c && c.mtime === st.mtimeMs) return c.data;
    const data = JSON.parse(fs.readFileSync(f, 'utf8').replace(/^﻿/, ''));
    const ok = data && typeof data === 'object' && !Array.isArray(data) ? data : null;
    fixCache.set(f, { mtime: st.mtimeMs, data: ok });
    return ok;
  } catch (e) { return null; }
}

function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

let counter = 0;
function buildBody(ctx, route, sc, req, bodyStr) {
  const { cfg, rules } = ctx;
  const fixture = fixtureFor(cfg.root, route.url);
  const seed = sc.seed === 'random' ? ((Date.now() ^ (++counter * 2654435761)) >>> 0)
    : typeof sc.seed === 'number' ? sc.seed : hashStr(`${req.method} ${route.url} ${bodyStr}`);
  const out = {};
  const info = [];
  for (const [key, ent] of route.keys) {
    const kc = cfg.keys[key] || {};
    const mode = sc.mode || kc.mode || cfg.mode;
    const rows = kc.rows ?? sc.rows ?? cfg.rows;
    const o = { seed, rows, dsRows: {}, empty: !!sc.empty, edge: !!sc.edge, colSpecs: kc.columns };
    const ds = ent.ds ? { ...ent.ds, id: key } : null;

    if (mode === 'fixture' && fixture && fixture[key] !== undefined) {
      let data = fixture[key];
      if (Array.isArray(data) && ds && data.length) {
        const have = new Set(Object.keys(data[0]));
        const missing = ds.columns.filter((c) => c.datatype !== 'expression' && !have.has(c.name));
        if (missing.length) { // 정적 파일에 없는 컬럼만 생성해서 채운다
          const g = gen.generateBlock({ ...ds, columns: missing }, { ...o, rows: data.length, edge: false, empty: false }, rules, ent.baseDir);
          data = data.map((r, i) => ({ ...r, ...g.data[i] }));
        }
      }
      out[key] = sc.empty && Array.isArray(data) ? [] : data;
      info.push(`${key}:${Array.isArray(out[key]) ? out[key].length : 1}(fixture)`);
    } else if (ds) {
      const { data } = gen.generateBlock(ds, o, rules, ent.baseDir);
      out[key] = data;
      info.push(`${key}:${Array.isArray(data) ? data.length : 1}(generate)`);
    } else if (fixture && fixture[key] !== undefined) {
      out[key] = fixture[key];
      info.push(`${key}(fixture)`);
    }
  }
  if (cfg.includeFixtureExtras && fixture) { // 정적 파일에만 있는 키는 그대로 유지 (다른 화면이 같은 URL 을 쓰는 경우)
    for (const k of Object.keys(fixture)) if (!(k in out)) out[k] = sc.empty && Array.isArray(fixture[k]) ? [] : fixture[k];
  }
  return { body: out, info, seed };
}

// ---------------------------------------------------------------- 시나리오
const state = { scenario: {} };

function parseDelay(v) {
  if (v === undefined || v === null || v === '' || v === 0) return 0;
  const m = /^(\d+)(?:-(\d+))?$/.exec(String(v));
  if (!m) return 0;
  const a = Number(m[1]), b = m[2] !== undefined ? Number(m[2]) : a;
  return a + Math.floor(Math.random() * (Math.max(a, b) - a + 1));
}

const truthy = (v) => v === true || v === 1 || /^(1|true|yes|on)$/i.test(String(v));

function normalizeScenario(raw) {
  const s = {};
  if (raw.delay !== undefined) s.delay = raw.delay;
  if (raw.status !== undefined && raw.status !== '') s.status = Number(raw.status);
  if (raw.empty !== undefined) s.empty = truthy(raw.empty);
  if (raw.edge !== undefined) s.edge = truthy(raw.edge);
  if (raw.mode) s.mode = String(raw.mode);
  if (raw.rows !== undefined && raw.rows !== '') s.rows = Number(raw.rows);
  if (raw.seed !== undefined && raw.seed !== '') s.seed = /^\d+$/.test(String(raw.seed)) ? Number(raw.seed) : String(raw.seed);
  if (s.mode && !['generate', 'fixture'].includes(s.mode)) throw new Error(`mode 는 generate|fixture: ${s.mode}`);
  if (s.status !== undefined && !(s.status >= 100 && s.status <= 599)) throw new Error(`status 범위 오류: ${s.status}`);
  if (s.rows !== undefined && !(s.rows >= 0)) throw new Error(`rows 값 오류: ${s.rows}`);
  return s;
}

// ---------------------------------------------------------------- HTTP
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const readBody = (req) => new Promise((resolve) => {
  const chunks = [];
  req.on('data', (c) => chunks.push(c));
  req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  req.on('error', () => resolve(''));
});

function sendJson(res, status, obj, extra = {}) {
  const body = JSON.stringify(obj);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=UTF-8', 'Cache-Control': 'no-store', ...extra });
  res.end(body);
}

function start() {
  const ctx = { cfg: null, rules: null, routes: [], skipped: [], warnings: [] };

  function init(first) {
    ctx.cfg = loadConfig();
    ctx.rules = gen.loadRules(null);
    fixCache.clear();
    const r = buildRoutes(ctx.cfg);
    Object.assign(ctx, { routes: r.routes, skipped: r.skipped, warnings: r.warnings });
    if (first || ctx.cfg.verbose) printRoutes(ctx);
  }

  function printRoutes(c) {
    console.log(`[mock-server] 대상 서버: ${c.cfg.target}   mode=${c.cfg.mode} rows=${c.cfg.rows} seed=${c.cfg.seed}`);
    console.log(`[mock-server] mock 라우트 ${c.routes.length}개`);
    for (const r of c.routes) {
      console.log(`  /${r.url}`);
      console.log(`    ← ${r.subs.join(', ')}`);
      console.log(`    키: ${[...r.keys.values()].map((k) => `${k.key}${k.via.includes('js') ? '[js alias]' : ''}`).join(', ')}`);
    }
    for (const s of c.skipped) console.log(`  (통과) /${s.url}  ${s.sub}  ${s.reason}`);
    for (const w of c.warnings) console.log(`  [경고] ${w}`);
  }

  const matchRoute = (p) => ctx.routes.find((r) => p === `/${r.url}` || p.endsWith(`/${r.url}`));

  function proxy(req, res) {
    const t = new URL(ctx.cfg.target);
    const pr = http.request({ hostname: t.hostname, port: t.port || 80, path: req.url, method: req.method, headers: { ...req.headers, host: t.host } }, (r) => {
      const h = { ...r.headers };
      if (h.location) h.location = h.location.replace(t.origin, `http://${req.headers.host}`);
      res.writeHead(r.statusCode, h);
      r.pipe(res);
      if (ctx.cfg.verbose) console.log(`[pass] ${req.method} ${req.url} → ${r.statusCode}`);
    });
    pr.on('error', (e) => {
      res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(`[mock-server] 대상 서버에 연결할 수 없습니다: ${ctx.cfg.target} (${e.code || e.message})`);
    });
    req.pipe(pr);
  }

  async function admin(req, res, u, p) {
    try {
      if (p === '/__mock/routes' && req.method === 'GET') {
        return sendJson(res, 200, {
          routes: ctx.routes.map((r) => ({
            url: `/${r.url}`, submissions: r.subs,
            keys: [...r.keys.values()].map((k) => ({ key: k.key, dataset: k.dataid, via: k.via, columns: k.ds ? k.ds.columns.map((c) => c.name) : null, config: ctx.cfg.keys[k.key] || null })),
            fixture: !!fixtureFor(ctx.cfg.root, r.url),
          })),
          passthrough: ctx.skipped, warnings: ctx.warnings,
        });
      }
      if (p === '/__mock/scenario') {
        if (req.method === 'GET') return sendJson(res, 200, state.scenario);
        if (req.method === 'DELETE') { state.scenario = {}; return sendJson(res, 200, state.scenario); }
        if (req.method === 'POST') {
          const raw = JSON.parse((await readBody(req)) || '{}');
          state.scenario = { ...state.scenario, ...normalizeScenario(raw) };
          return sendJson(res, 200, state.scenario);
        }
      }
      if (p === '/__mock/reload' && req.method === 'POST') { init(false); return sendJson(res, 200, { routes: ctx.routes.length, warnings: ctx.warnings }); }
      if (p === '/__mock' || p === '/__mock/') { res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end(HELP); }
      return sendJson(res, 404, { error: 'unknown mock admin endpoint', path: p });
    } catch (e) { return sendJson(res, 400, { error: e.message }); }
  }

  const server = http.createServer(async (req, res) => {
    let u, p;
    try { u = new URL(req.url, 'http://x'); p = decodeURIComponent(u.pathname); } catch (e) { return proxy(req, res); }
    if (p === '/__mock' || p.startsWith('/__mock/')) return admin(req, res, u, p);
    const route = matchRoute(p);
    if (!route) return proxy(req, res);

    const bodyStr = await readBody(req);
    const q = {};
    for (const [k, v] of u.searchParams) if (k.startsWith('__mock_')) q[k.slice(7)] = v;
    let sc;
    try { sc = { ...state.scenario, ...normalizeScenario(q) }; } catch (e) { return sendJson(res, 400, { error: e.message }); }
    const delay = parseDelay(sc.delay ?? ctx.cfg.delay);
    if (delay) await sleep(delay);

    if (sc.status && sc.status >= 400) {
      console.log(`[mock] ${req.method} ${p} → ${sc.status} (시나리오)${delay ? ` +${delay}ms` : ''}`);
      return sendJson(res, sc.status, { error: 'mock error', status: sc.status, message: `[mock-server] 시나리오로 지정한 ${sc.status} 응답` }, { 'X-Mock': '1' });
    }
    const { body, info, seed } = buildBody(ctx, route, sc, req, bodyStr);
    console.log(`[mock] ${req.method} ${p} → ${info.join(' ')}${delay ? ` +${delay}ms` : ''}${sc.empty ? ' [empty]' : ''}${sc.edge ? ' [edge]' : ''}`);
    return sendJson(res, sc.status && sc.status < 400 ? sc.status : 200, body, { 'X-Mock': '1', 'X-Mock-Seed': String(seed) });
  });

  server.on('upgrade', (req, socket, head) => { // WebSocket 등은 그대로 통과
    const t = new URL(ctx.cfg.target);
    const up = net.connect(Number(t.port || 80), t.hostname, () => {
      const lines = Object.entries({ ...req.headers, host: t.host }).map(([k, v]) => `${k}: ${v}`);
      up.write(`${req.method} ${req.url} HTTP/${req.httpVersion}\r\n${lines.join('\r\n')}\r\n\r\n`);
      if (head && head.length) up.write(head);
      socket.pipe(up).pipe(socket);
    });
    up.on('error', () => socket.destroy());
    socket.on('error', () => up.destroy());
  });

  init(true);
  server.on('error', (e) => die(e.code === 'EADDRINUSE' ? `포트 ${ctx.cfg.port} 이(가) 이미 사용 중입니다. --port 로 다른 포트를 지정하세요.` : e.message));
  server.listen(ctx.cfg.port, () => {
    console.log(`[mock-server] 실행 중: http://localhost:${ctx.cfg.port}/   (개발 서버와 같은 주소 구조. /ui/ 는 리소스 경로라 직접 열면 404)`);
    console.log(`[mock-server] 관리: http://localhost:${ctx.cfg.port}/__mock/routes`);
  });
}

start();
