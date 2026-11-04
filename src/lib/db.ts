import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';

export type Row = { id: string; createdAt: string; updatedAt: string; version: number; [key: string]: any };
const tables = ['users','agents','departments','projects','tasks','meetings','messages','decisions','approvals','runs','executions','integrations','credentialsMetadata','documents','schedules','usage','audit','jobs','settings','researchSources','researchSearches'] as const;
export type Table = typeof tables[number];
const path = process.env.AI_UNIVERSE_DB===':memory:'?':memory:':resolve(process.env.AI_UNIVERSE_DB || './data/company.sqlite');
if(path!==':memory:')mkdirSync(dirname(path), { recursive: true });
export const db = new DatabaseSync(path);
db.exec('PRAGMA busy_timeout=10000; PRAGMA journal_mode=WAL;');
for (const t of tables) db.exec(`CREATE TABLE IF NOT EXISTS "${t}" (id TEXT PRIMARY KEY, data TEXT NOT NULL);`);
db.exec('CREATE UNIQUE INDEX IF NOT EXISTS run_key ON runs(json_extract(data,\'$.key\')); CREATE UNIQUE INDEX IF NOT EXISTS job_key ON jobs(json_extract(data,\'$.key\'));');
export function all(t: Table): Row[] { return (db.prepare(`SELECT data FROM "${t}"`).all() as {data: string}[]).map(x => JSON.parse(x.data)); }
export function get(t: Table, id: string): Row { const r = db.prepare(`SELECT data FROM "${t}" WHERE id=?`).get(id) as {data: string}|undefined; if (!r) throw new Error(`${t}: 항목을 찾을 수 없습니다`); return JSON.parse(r.data); }
export function insert(t: Table, data: Record<string, any>): Row {
 const now = new Date().toISOString(); const row = {...data, id: data.id || randomUUID(), createdAt: now, updatedAt: now, version: 1} as Row;
 db.prepare(`INSERT INTO "${t}" (id,data) VALUES (?,?)`).run(row.id, JSON.stringify(row)); return row;
}
export function update(t: Table, id: string, patch: Record<string, any>, version?: number): Row {
 return transaction(() => { const old = get(t,id); if (version !== undefined && old.version !== version) throw new Error('문서 버전 충돌: 새로고침 후 다시 저장하세요');
 const row = {...old, ...patch, id, createdAt: old.createdAt, updatedAt: new Date().toISOString(), version: old.version + 1};
 db.prepare(`UPDATE "${t}" SET data=? WHERE id=?`).run(JSON.stringify(row), id); return row; });
}
let depth = 0;
export function transaction<T>(fn: () => T): T {
 if (depth) return fn(); db.exec('BEGIN IMMEDIATE'); depth++;
 try { const r = fn(); db.exec('COMMIT'); return r; } catch(e) { db.exec('ROLLBACK'); throw e; } finally { depth--; }
}
export function audit(action: string, target: string, details: unknown = {}) { insert('audit', {actor:'CEO/server', action, target, details}); }
export function config() { return get('settings','company'); }
export function assertRunning() { if (config().paused) throw new Error('CEO 긴급 중지: 실행이 일시 중지되었습니다'); }
export function safeError(e: unknown) { return String(e instanceof Error ? e.message : e).replace(/(?:sk-|ghp_|github_pat_)[\w-]+/g,'[MASKED]').replace(/Bearer\s+\S+/gi,'Bearer [MASKED]').slice(0,500); }
