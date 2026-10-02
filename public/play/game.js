import {GROUND,GRAVITY,JUMP,speedAt,scoreAt,intersects,playerBox,obstacleBox} from './physics.js';
const $=id=>document.getElementById(id), canvas=$('game'),ctx=canvas.getContext('2d');
const images={};let assetsReady=false,assetsFailed=false;
const assetPromise=Promise.all(Object.entries({frog:'naiwa.webp',tiles:'tiles.png',bg:'backgrounds.png',birds:'characters.png'}).map(([k,file])=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>{images[k]=im;resolve();};im.onerror=reject;im.src='./assets/'+file;}))).then(()=>{assetsReady=true;}).catch(()=>{assetsFailed=true;$('save-status').textContent='角色素材加载失败，请刷新页面重试';$('start').disabled=true;});
let W=960, mode='ready', time=0, y=GROUND,vy=0,duck=false,obstacles=[],nextSpawn=2.1,travel=0,last=0,acc=0,runId=null,pending=null,activeTab='board',profile=null,board=[],deadAt=0,toastTimer;
let crouchBlend=0, poseTime=0;
let sound=false;try{sound=localStorage.getItem('frog-sound')==='yes';}catch{}
const sounds={jump:new Audio('./assets/jump.ogg'),hit:new Audio('./assets/hit.ogg')};
function syncSound(){$('sound').textContent='音效 '+(sound?'开':'关');$('sound').setAttribute('aria-pressed',String(sound));}
syncSound();
function playSound(name){if(!sound)return;const a=sounds[name];a.volume=.28;a.currentTime=0;a.play().catch(()=>{});}
function toast(message){$('toast').textContent=message;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),3500);}
async function api(action,body){const response=await fetch('/api/game'+(body?'':'?action='+action),{method:body?'POST':'GET',headers:body?{'Content-Type':'application/json'}:undefined,body:body?JSON.stringify({action,...body}):undefined,signal:AbortSignal.timeout(7000)});let data;try{data=await response.json();}catch{throw new Error('成绩服务暂时不可用');}if(!response.ok)throw new Error(data.error||'成绩服务暂时不可用');return data;}
function fmt(n){return String(n).padStart(5,'0');}
function renderRecords(){const list=$('record-list');list.replaceChildren();$('board-tab').setAttribute('aria-selected',String(activeTab==='board'));$('history-tab').setAttribute('aria-selected',String(activeTab==='history'));list.setAttribute('aria-labelledby',activeTab==='board'?'board-tab':'history-tab');$('board-note').textContent=activeTab==='board'?'每位玩家只展示最高分':'最近 30 局';const rows=activeTab==='board'?board:(profile?.history||[]);if(!rows.length){const p=document.createElement('p');p.className='empty';p.textContent=activeTab==='board'?'还没有纪录。跑一局，当第一位奶家人。':'还没有成绩。你的下一步，就是第一步。';list.append(p);return;}rows.forEach((r,i)=>{const row=document.createElement('div');row.className='row';const rank=document.createElement('span');rank.className='rank';rank.textContent=String(i+1).padStart(2,'0');const name=document.createElement('span');name.textContent=activeTab==='board'?r.name:profile.name;if(activeTab==='history'){const date=document.createElement('small');date.textContent=new Date(r.started).toLocaleString('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'})+' · '+(r.duration/1000).toFixed(1)+' 秒';name.append(date);}const score=document.createElement('strong');score.textContent=fmt(r.score);row.append(rank,name,score);list.append(row);});}
async function refresh(){try{const [p,b]=await Promise.all([api('profile'),api('board')]);profile=p;board=b.rows;if(document.activeElement!==$('nickname'))$('nickname').value=p.name;$('best').textContent=fmt(p.best);$('connection').textContent='云端成绩已连接';renderRecords();return true;}catch(e){$('connection').textContent='练习模式 · 云端暂不可用';$('record-list').replaceChildren();const p=document.createElement('p');p.className='empty';p.textContent='成绩册暂时连不上，点击“刷新”重试。游戏仍可游玩。';$('record-list').append(p);return false;}}
const profileReady=refresh();
function resize(){const r=canvas.parentElement.getBoundingClientRect();W=Math.max(600,Math.round(r.width/r.height*360));canvas.width=W;canvas.height=360;ctx.imageSmoothingEnabled=false;if(mode==='running')pause();}
new ResizeObserver(resize).observe(canvas.parentElement);
function tile(im,c,r,x,y,w,h,unit=18){ctx.drawImage(im,c*unit,r*unit,unit,unit,Math.round(x),Math.round(y),w,h);}
function draw(now){const poseDt=Math.min(.05,(now-poseTime)/1000||0);poseTime=now;
 const crouching=mode==='running'&&duck&&y===GROUND;
 const target=crouching?1:0;
 crouchBlend+=Math.sign(target-crouchBlend)*Math.min(Math.abs(target-crouchBlend),poseDt/(crouching?.085:.12));
 if(y<GROUND||mode==='dead'||mode==='ready')crouchBlend=0;
 ctx.imageSmoothingEnabled=false;ctx.fillStyle='#e4efc8';ctx.fillRect(0,0,W,360);if(!assetsReady)return;
 // Actual licensed tiles are repeated at integer scale, with slow parallax.
 const par=travel*.12;ctx.globalAlpha=.62;for(let i=-1;i<W/192+2;i++){const x=i*192-par%192;tile(images.bg,1,1,x,116,192,164,24);}ctx.globalAlpha=1;
 ctx.fillStyle='#f8e998';ctx.fillRect(W-124,44,36,36);ctx.fillStyle='#edf4d8';ctx.fillRect(W-128,40,8,8);ctx.fillRect(W-92,76,8,8);
 for(let i=-1;i<W/180+2;i++){const x=i*180-(travel*.22)%180;tile(images.tiles,13+(i%3+3)%3,7,x,65+(i%2)*31,72,36);}
 ctx.globalAlpha=.55;for(let i=-1;i<W/140+2;i++){const x=i*140-(travel*.5)%140;tile(images.tiles,4+(i%3+3)%3,6,x,GROUND-28,36,36);}ctx.globalAlpha=1;
 for(let x=-travel%36;x<W;x+=36){tile(images.tiles,1,0,x,GROUND,36,36);tile(images.tiles,1,1,x,GROUND+36,36,36);tile(images.tiles,1,1,x,GROUND+72,36,36);}
 ctx.fillStyle='#374d4220';ctx.fillRect(69,GROUND-3,70,4);
 for(const o of obstacles){if(o.type==='bird'){tile(images.birds,6+Math.floor(now/150)%3,2,o.x,GROUND-61,44,36,24);}else{tile(images.tiles,7,2,o.x,GROUND-o.h,o.w,o.h);}}
 let row=0,frame=Math.floor(now/170)%6;let h=86,w=80,px=68,py=y-h+3;
 if(mode==='running'||mode==='paused'){row=1;frame=Math.floor(time*12)%8;if(y<GROUND){frame=3;}
  if(crouchBlend>0){
   // Use the folded-leg, tucked-head pose; never flatten running legs into the belly.
   row=5;frame=crouchBlend<.45?2:3;
   const ease=crouchBlend*crouchBlend*(3-2*crouchBlend);
   h=86-34*ease;w=80-9*ease;px=68+5*ease;
   py=GROUND-h+3+(crouching&&crouchBlend===1?Math.sin(time*16):0);
  }
 }
 if(mode==='dead'){row=5;frame=Math.min(7,Math.floor((now-deadAt)/110));}
 if(mode==='ready'){row=4;frame=Math.floor(now/170)%5;}
 ctx.drawImage(images.frog,frame*192,row*208,192,208,px,py,w,h);
 if(mode==='running'&&y===GROUND){ctx.fillStyle='#dfc392';for(let i=0;i<3;i++){const d=(time*60+i*15)%42;ctx.fillRect(70-d,GROUND-2-i*3,3,3);}}
}
function setOverlay(title,description,button,overline){$('overlay').hidden=false;$('overlay-title').textContent=title;$('overlay-description').textContent=description;$('start').textContent=button;$('overline').textContent=overline;}
async function start(){if(mode==='loading'||mode==='running')return;if(mode==='paused'){mode='running';$('overlay').hidden=true;$('pause').textContent='Ⅱ';last=performance.now();document.activeElement?.blur();return;}mode='loading';$('start').disabled=true;$('start').textContent='奶蛙热身中…';if(!assetsReady){await assetPromise;if(assetsFailed)return;}if(pending){await save();if(pending)toast('上一局尚未保存，本局先练习，稍后可重试。');}
 await profileReady;
 let ranked=false;try{if(!profile)await refresh();if(profile&&!pending){const r=await api('start',{});runId=r.id;ranked=true;}}catch(e){toast(e.message+'，本局作为练习');}
 if(!ranked)runId=null;time=0;travel=0;y=GROUND;vy=0;duck=false;obstacles=[];nextSpawn=2.1;acc=0;mode='running';last=performance.now();document.activeElement?.blur();$('start').disabled=false;$('overlay').hidden=true;$('pause').textContent='Ⅱ';$('retry-save').hidden=true;$('mood').textContent='大肚子也有大梦想';$('connection').textContent=ranked?'本局成绩将保存到云端':'练习模式 · 本局不计入云端成绩';
}
function jump(){if(mode==='ready'||mode==='dead'){start();return;}if(mode==='paused')return;if(mode==='running'&&y>=GROUND-.1){duck=false;vy=JUMP;playSound('jump');}}
function pause(){duck=false;if(mode==='running'){mode='paused';setOverlay('奶蛙歇口气。','准备好了，就继续向前跑。','继续撒欢','PAUSED');$('save-status').textContent='暂停时间不计入成绩';$('pause').textContent='▶';}else if(mode==='paused'){start();}}
async function save(){if(!pending)return;const submission=pending;$('retry-save').hidden=true;$('save-status').textContent='正在保存成绩…';try{await api('finish',submission);if(pending===submission)pending=null;if(mode==='dead')$('save-status').textContent='成绩已保存 · 喝口水，再来一局';await refresh();}catch(e){if(mode==='dead')$('save-status').textContent=e.message+'，请点击重试';$('retry-save').hidden=false;}}
function die(now){mode='dead';duck=false;deadAt=now;playSound('hit');const score=scoreAt(time);setOverlay(score>(profile?.best??Infinity)?'新纪录！奶蛙笑了。':'肚子先到了。',`本次得分 ${fmt(score)} · 坚持了 ${time.toFixed(1)} 秒`,'再跑亿次','GAME OVER');$('mood').textContent='摔倒没关系，笑着再来';if(runId){pending={id:runId,duration:Math.floor(time*1000)};save();}else{$('save-status').textContent='练习结束 · 本局未保存';$('retry-save').hidden=!pending;}}
function update(dt,now){time+=dt;const speed=speedAt(time)*Math.max(.72,Math.min(1,W/960));travel+=speed*dt;vy+=GRAVITY*dt;y=Math.min(GROUND,y+vy*dt);if(y===GROUND)vy=0;nextSpawn-=dt;
 if(nextSpawn<=0){const bird=time>9&&Math.random()<.35;obstacles.push({type:bird?'bird':'rock',x:W+30,w:bird?44:34+Math.floor(Math.random()*12),h:bird?28:30+Math.floor(Math.random()*14)});nextSpawn=1.35+Math.random()*.65;}
 const box=playerBox(68,y,duck&&y===GROUND);for(const o of obstacles){o.x-=speed*dt;if(intersects(box,obstacleBox(o))){die(now);break;}}obstacles=obstacles.filter(o=>o.x>-100);
 $('score').textContent=fmt(scoreAt(time));$('distance').textContent=Math.floor(time)+' 秒';$('speed').textContent=(speedAt(time)/210).toFixed(1)+'× 速度';if(time>900&&mode==='running')die(now);
}
function loop(now){const dt=Math.min(.1,(now-last)/1000||0);last=now;if(mode==='running'){acc+=dt;while(acc>=1/120&&mode==='running'){update(1/120,now);acc-=1/120;}}else acc=0;draw(now);requestAnimationFrame(loop);}requestAnimationFrame(loop);
$('start').onclick=start;$('pause').onclick=pause;$('retry-save').onclick=save;$('refresh').onclick=refresh;
$('sound').onclick=()=>{sound=!sound;try{localStorage.setItem('frog-sound',sound?'yes':'no');}catch{}syncSound();if(sound)playSound('jump');};
const held=new Set();document.addEventListener('keydown',e=>{if(['INPUT','TEXTAREA','SELECT','BUTTON'].includes(e.target.tagName))return;if(['Space','ArrowUp','KeyW','ArrowDown','KeyS','KeyP','Escape'].includes(e.code)){e.preventDefault();if(e.repeat)return;if(['Space','ArrowUp','KeyW'].includes(e.code))jump();else if(['ArrowDown','KeyS'].includes(e.code)){held.add(e.code);duck=true;}else pause();}});
document.addEventListener('keyup',e=>{if(['ArrowDown','KeyS'].includes(e.code)){held.delete(e.code);duck=held.size>0;}});
for(const [id,press,release]of [['jump',jump,()=>{}],['duck',()=>{if(mode==='running')duck=true;},()=>{duck=false;}]]){const b=$(id);b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);press();});for(const type of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(type,release);b.addEventListener('contextmenu',e=>e.preventDefault());b.addEventListener('keydown',e=>{if(e.code==='Space'||e.code==='Enter'){e.preventDefault();if(!e.repeat)press();}});b.addEventListener('keyup',release);}
canvas.addEventListener('pointerdown',e=>{e.preventDefault();jump();});window.addEventListener('blur',()=>{held.clear();duck=false;if(mode==='running')pause();});document.addEventListener('visibilitychange',()=>{if(document.hidden&&mode==='running')pause();});
for(const name of ['board','history']){$(name+'-tab').onclick=()=>{activeTab=name;renderRecords();};$(name+'-tab').onkeydown=e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){activeTab=name==='board'?'history':'board';renderRecords();$(activeTab+'-tab').focus();}};}
$('name-form').onsubmit=async e=>{e.preventDefault();const button=e.target.querySelector('button');button.disabled=true;try{const p=await api('name',{name:$('nickname').value});toast('好嘞，'+p.name+'！');await refresh();}catch(err){toast(err.message);}finally{button.disabled=false;}};
$('share').onclick=async()=>{const url=location.origin+'/';try{if(navigator.share){await navigator.share({title:'奶蛙快跑 · 再跑亿次',text:'来比比谁的奶蛙跑得更远！',url});}else{await navigator.clipboard.writeText(url);toast('游戏链接已复制，发给奶家人吧！');}}catch(e){if(e.name!=='AbortError')toast('请复制浏览器地址，分享给奶家人');}};
const mc=document.modelContext;if(mc?.registerTool){try{Promise.resolve(mc.registerTool({name:'read_naiwa_game',description:'读取奶蛙游戏当前状态和个人最高分，不改变游戏。',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute(input){if(!input||Object.keys(input).length)throw new Error('不接受参数');return {state:mode,score:scoreAt(time),best:profile?.best??null,connected:!!profile};}})).catch(()=>{});}catch{}}



