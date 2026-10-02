import { env } from 'cloudflare:workers';
function db(){if(!env.DB)throw new Error('Database unavailable');return env.DB;}
const json=(data:unknown,status=200,headers:Record<string,string>={})=>Response.json(data,{status,headers:{'Cache-Control':'no-store',...headers}});
function identity(req:Request){return req.headers.get('cookie')?.match(/(?:^|; )frog_player=([a-f0-9-]{36})(?:;|$)/)?.[1];}
async function existing(req:Request){const id=identity(req);return id?await db().prepare('SELECT id,name FROM players WHERE id=?').bind(id).first<{id:string;name:string}>():null;}
export async function GET(req:Request){try{
 if(new URL(req.url).searchParams.get('action')==='board'){const rows=await db().prepare('SELECT p.name, MAX(r.score) AS score FROM runs r JOIN players p ON p.id=r.player WHERE r.score IS NOT NULL GROUP BY p.id ORDER BY score DESC, p.created ASC LIMIT 20').all();return json({rows:rows.results});}
 let player=await existing(req);let cookie:Record<string,string>={};
 if(!player){const id=crypto.randomUUID();player={id,name:'奶家人'+id.slice(0,4)};await db().prepare('INSERT INTO players(id,name,created) VALUES (?,?,?)').bind(id,player.name,Date.now()).run();cookie={'Set-Cookie':`frog_player=${id}; HttpOnly; SameSite=Lax; Path=/; Max-Age=31536000${new URL(req.url).protocol==='https:'?'; Secure':''}`};}
 const history=await db().prepare('SELECT id,score,started,duration FROM runs WHERE player=? AND score IS NOT NULL ORDER BY started DESC LIMIT 30').bind(player.id).all();
 const best=await db().prepare('SELECT COALESCE(MAX(score),0) AS best FROM runs WHERE player=?').bind(player.id).first<{best:number}>();return json({name:player.name,history:history.results,best:best?.best||0},200,cookie);
 }catch(e){console.error('Game read failed',e);return json({error:'成绩服务暂时不可用，可以继续练习，稍后重试。'},503);}}
export async function POST(req:Request){try{
 if(req.headers.get('origin')!==new URL(req.url).origin)return json({error:'不允许跨站提交'},403);
 if(Number(req.headers.get('content-length')||0)>2048)return json({error:'请求过大'},413);
 const raw=await req.text();if(raw.length>2048)return json({error:'请求过大'},413);
 let body;try{body=JSON.parse(raw);}catch{return json({error:'请求格式不正确'},400);}if(!body||typeof body!=='object')return json({error:'请求格式不正确'},400);
 const p=await existing(req);if(!p)return json({error:'请刷新页面恢复玩家身份'},401);
 if(body.action==='name'){if(typeof body.name!=='string'||!body.name.trim()||Array.from(body.name.trim()).length>16||/[\x00-\x1f\x7f]/.test(body.name))return json({error:'昵称需要 1–16 个字符'},400);await db().prepare('UPDATE players SET name=? WHERE id=?').bind(body.name.trim(),p.id).run();return json({name:body.name.trim()});}
 if(body.action==='start'){const recent=await db().prepare('SELECT started FROM runs WHERE player=? ORDER BY started DESC LIMIT 1').bind(p.id).first<{started:number}>();if(recent&&Date.now()-recent.started<1500)return json({error:'歇一秒，再来一局'},429);const id=crypto.randomUUID();await db().batch([db().prepare('DELETE FROM runs WHERE player=? AND score IS NULL AND started<?').bind(p.id,Date.now()-86400000),db().prepare('INSERT INTO runs(id,player,started) VALUES (?,?,?)').bind(id,p.id,Date.now())]);return json({id});}
 if(body.action==='finish'){if(typeof body.id!=='string'||body.id.length!==36||!Number.isInteger(body.duration)||body.duration<0||body.duration>900000)return json({error:'成绩格式不正确'},400);const run=await db().prepare('SELECT started,score FROM runs WHERE id=? AND player=?').bind(body.id,p.id).first<{started:number;score:number|null}>();if(!run)return json({error:'本局不存在'},404);if(run.score!==null)return json({score:run.score});if(body.duration>Date.now()-run.started+1500)return json({error:'本局时间校验未通过'},400);
 // ponytail: casual leaderboard checks elapsed time and single use; competitive play needs server simulation.
 const score=Math.floor(body.duration/100);await db().prepare('UPDATE runs SET score=?,duration=? WHERE id=? AND player=? AND score IS NULL').bind(score,body.duration,body.id,p.id).run();return json({score});}
 return json({error:'未知操作'},400);
 }catch(e){console.error('Game write failed',e);return json({error:'成绩未保存，请稍后重试'},503);}}
