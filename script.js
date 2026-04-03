// ═══════════════════════════════════════════════════════
//  CANVAS & RESPONSIVE SIZING develope by piyush soni
// ═══════════════════════════════════════════════════════
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let W = 600, H = 520, SC = 1;

function resize() {
  const hud    = document.getElementById('hud');
  const foot   = document.getElementById('footer');
  const touch  = document.getElementById('touchCtrl');
  const isMob  = window.matchMedia('(max-width:900px),(pointer:coarse)').matches;

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const maxW = Math.min(vw, 600);

  const hudH   = hud.offsetHeight   || 44;
  const footH  = foot.offsetHeight  || 28;
  const touchH = isMob ? (touch.offsetHeight || 150) : 0;

  const availH = vh - hudH - footH - touchH - 4;
  const availW = maxW;

  SC = Math.min(availW / 600, availH / 520);
  SC = Math.max(0.3, Math.min(SC, 1.6));

  W = Math.round(600 * SC);
  H = Math.round(520 * SC);

  canvas.width  = W;
  canvas.height = H;

  const gw = maxW + 'px';
  hud.style.width   = gw;
  foot.style.width  = gw;
  touch.style.width = gw;
  document.getElementById('cWrap').style.width = W + 'px';

  if (stars && stars.length) initStars();
}

window.addEventListener('resize', () => { resize(); });
window.addEventListener('orientationchange', () => setTimeout(resize, 250));

// ═══════════════════════════════════════════════════════
//  WEB AUDIO ENGINE
// ═══════════════════════════════════════════════════════
let AC = null;
const getAC = () => {
  if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
  if (AC.state === 'suspended') AC.resume();
  return AC;
};

function sndShoot() {
  try {
    const ac = getAC(), o = ac.createOscillator(), g = ac.createGain();
    o.connect(g); g.connect(ac.destination);
    o.type = 'square';
    o.frequency.setValueAtTime(900, ac.currentTime);
    o.frequency.exponentialRampToValueAtTime(200, ac.currentTime + 0.09);
    g.gain.setValueAtTime(0.15, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.1);
    o.start(); o.stop(ac.currentTime + 0.1);
  } catch(e) {}
}

function sndExplosion(big = false) {
  try {
    const ac = getAC();
    const dur = big ? 0.7 : 0.3;
    const buf = ac.createBuffer(1, Math.round(ac.sampleRate * dur), ac.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random()*2-1) * Math.pow(1 - i/d.length, big?1.5:2.2);
    const src = ac.createBufferSource(), g = ac.createGain();
    const dShape = ac.createWaveShaper();
    const cv = new Float32Array(256);
    for (let i=0;i<256;i++){const x=i*2/255-1; cv[i]=(Math.PI+200)*x/(Math.PI+200*Math.abs(x));}
    dShape.curve = cv;
    src.buffer = buf; src.connect(dShape); dShape.connect(g); g.connect(ac.destination);
    g.gain.setValueAtTime(big ? 0.65 : 0.38, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
    src.start(); src.stop(ac.currentTime + dur);
  } catch(e) {}
}

function sndHit() {
  try {
    const ac = getAC(), o = ac.createOscillator(), g = ac.createGain();
    o.connect(g); g.connect(ac.destination);
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(450, ac.currentTime);
    o.frequency.exponentialRampToValueAtTime(80, ac.currentTime + 0.13);
    g.gain.setValueAtTime(0.22, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.15);
    o.start(); o.stop(ac.currentTime + 0.15);
  } catch(e) {}
}

function sndBomb() {
  try {
    const ac = getAC();
    [120, 60].forEach((f, i) => {
      const o = ac.createOscillator(), g = ac.createGain();
      o.connect(g); g.connect(ac.destination);
      o.type = i === 0 ? 'sawtooth' : 'sine';
      o.frequency.setValueAtTime(f, ac.currentTime);
      o.frequency.exponentialRampToValueAtTime(f*0.25, ac.currentTime + 0.5);
      g.gain.setValueAtTime(0.45, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.55);
      o.start(); o.stop(ac.currentTime + 0.55);
    });
    sndExplosion(true);
  } catch(e) {}
}

function sndLevelUp() {
  try {
    const ac = getAC();
    [523, 659, 784, 1047].forEach((f, i) => {
      const o = ac.createOscillator(), g = ac.createGain();
      o.connect(g); g.connect(ac.destination);
      o.type = 'triangle'; o.frequency.value = f;
      const t = ac.currentTime + i * 0.1;
      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(0.18, t + 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      o.start(t); o.stop(t + 0.22);
    });
  } catch(e) {}
}

function sndDamage() {
  try {
    const ac = getAC(), o = ac.createOscillator(), g = ac.createGain();
    o.connect(g); g.connect(ac.destination);
    o.type = 'square';
    [200, 150, 100].forEach((f, i) => o.frequency.setValueAtTime(f, ac.currentTime + i*0.06));
    g.gain.setValueAtTime(0.4, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.28);
    o.start(); o.stop(ac.currentTime + 0.28);
  } catch(e) {}
}

// ═══════════════════════════════════════════════════════
//  GAME STATE
// ═══════════════════════════════════════════════════════
let state = 'title';
let score = 0, best = parseInt(localStorage.getItem('aa_best') || '0');
let lives = 3, level = 1, bombs = 3;
let fc = 0; // frame count
let player, bullets, enemies, eBullets, parts, stars, exps, floats;
let keys = {};
let sCool = 0, eSpawnT = 0, bossOn = false;
let invinc = 0, bombCool = 0, scoreThr = 1500;
let loopId = null, titleId = null;

const rnd  = (a,b) => Math.random()*(b-a)+a;
const rndI = (a,b) => Math.floor(rnd(a,b));
const clamp = (v,a,b) => Math.max(a,Math.min(b,v));

// ═══════════════════════════════════════════════════════
//  STARS
// ═══════════════════════════════════════════════════════
function initStars() {
  stars = Array.from({length:130}, () => ({
    x:rnd(0,W), y:rnd(0,H), spd:rnd(0.3,2.5)*SC,
    sz:rnd(0.5,2)*SC, br:rnd(0.3,1),
    col: Math.random()<.15?'#ff006e':Math.random()<.2?'#ffe600':'#00f5ff'
  }));
}
const updStars = () => stars.forEach(s => { s.y += s.spd; if(s.y>H){s.y=0;s.x=rnd(0,W);} });
function drawStars() {
  stars.forEach(s => {
    ctx.save(); ctx.globalAlpha=s.br; ctx.fillStyle=s.col;
    if(s.sz>1.2*SC){ctx.shadowBlur=8;ctx.shadowColor=s.col;}
    ctx.beginPath(); ctx.arc(s.x,s.y,s.sz,0,Math.PI*2); ctx.fill(); ctx.restore();
  });
}

// ═══════════════════════════════════════════════════════
//  PLAYER
// ═══════════════════════════════════════════════════════
function mkPlayer() { return {x:W/2, y:H-80*SC, w:32*SC, h:32*SC, spd:5*SC, ta:0}; }

function drawPlayer(p) {
  if (invinc>0 && Math.floor(invinc/4)%2===0) return;
  const {x,y,w,h} = p;
  ctx.save();
  // Thrust
  p.ta=(p.ta+0.2)%(Math.PI*2);
  const tl=(18+Math.sin(p.ta)*7)*SC;
  const tg=ctx.createLinearGradient(x,y+h/2,x,y+h/2+tl);
  tg.addColorStop(0,'rgba(0,245,255,.9)'); tg.addColorStop(.5,'rgba(255,0,110,.6)'); tg.addColorStop(1,'transparent');
  ctx.fillStyle=tg; ctx.shadowBlur=0;
  ctx.beginPath(); ctx.moveTo(x-8*SC,y+h/2-2); ctx.lineTo(x+8*SC,y+h/2-2);
  ctx.lineTo(x+4*SC,y+h/2+tl); ctx.lineTo(x-4*SC,y+h/2+tl); ctx.fill();
  // Hull
  ctx.shadowBlur=20; ctx.shadowColor='#00f5ff';
  ctx.fillStyle='#001a2e'; ctx.strokeStyle='#00f5ff'; ctx.lineWidth=2*SC;
  ctx.beginPath(); ctx.moveTo(x,y-h/2); ctx.lineTo(x+w/2,y+h/2);
  ctx.lineTo(x+w/3,y+h/3); ctx.lineTo(x-w/3,y+h/3); ctx.lineTo(x-w/2,y+h/2);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  // Cockpit
  ctx.fillStyle='rgba(0,245,255,.9)'; ctx.shadowBlur=15;
  ctx.beginPath(); ctx.arc(x,y-2*SC,5*SC,0,Math.PI*2); ctx.fill();
  // Wing lines
  ctx.strokeStyle='#ff006e'; ctx.lineWidth=1.5*SC; ctx.shadowColor='#ff006e'; ctx.shadowBlur=8;
  ctx.beginPath(); ctx.moveTo(x-w/3,y+h/3); ctx.lineTo(x-w/2,y+h/2-4); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x+w/3,y+h/3); ctx.lineTo(x+w/2,y+h/2-4); ctx.stroke();
  ctx.restore();
}

// ═══════════════════════════════════════════════════════
//  SHOOT
// ═══════════════════════════════════════════════════════
function shoot() {
  bullets.push({x:player.x,y:player.y-16*SC,vy:-12*SC,vx:0,w:3*SC,h:14*SC,col:'#00f5ff'});
  if (level>=3) {
    bullets.push({x:player.x-12*SC,y:player.y,vy:-11*SC,vx:-1.5*SC,w:2*SC,h:10*SC,col:'#ffe600'});
    bullets.push({x:player.x+12*SC,y:player.y,vy:-11*SC,vx:1.5*SC,w:2*SC,h:10*SC,col:'#ffe600'});
  }
  if (level>=5) {
    bullets.push({x:player.x-22*SC,y:player.y+4*SC,vy:-10*SC,vx:-.5*SC,w:2*SC,h:8*SC,col:'#ff006e'});
    bullets.push({x:player.x+22*SC,y:player.y+4*SC,vy:-10*SC,vx:.5*SC,w:2*SC,h:8*SC,col:'#ff006e'});
  }
  mkParts(player.x,player.y-16*SC,'#00f5ff',3,1.5*SC);
  sndShoot();
}

// ═══════════════════════════════════════════════════════
//  ENEMIES
// ═══════════════════════════════════════════════════════
const ET = {
  drone:       {w:28,h:22,hp:1, spd:1.5,sc:100, col:'#ff006e',fc:.003},
  cruiser:     {w:36,h:30,hp:3, spd:1.0,sc:250, col:'#ffe600',fc:.008},
  interceptor: {w:22,h:26,hp:2, spd:2.5,sc:200, col:'#39ff14',fc:.005},
  boss:        {w:70,h:50,hp:30,spd:.8, sc:2000,col:'#ff006e',fc:.02}
};

function spawnEnemy() {
  const x=rnd(50*SC,W-50*SC); let tp;
  if (!bossOn&&level%3===0&&enemies.filter(e=>e.tp==='boss').length===0&&enemies.length<2) {tp='boss';bossOn=true;}
  else { const p=level<2?['drone']:level<4?['drone','drone','cruiser']:['drone','cruiser','interceptor']; tp=p[rndI(0,p.length)]; }
  const t=ET[tp];
  enemies.push({x,y:-40*SC,w:t.w*SC,h:t.h*SC,hp:t.hp,mhp:t.hp,
    spd:(t.spd+level*.07)*SC,sc:t.sc,col:t.col,tp,
    vx:rnd(-.6,.6)*SC,vy:(t.spd+level*.07)*SC,
    fc:t.fc+level*.0005,an:0,hf:0});
}

function drawEnemy(e) {
  ctx.save();
  const flash=e.hf>0;
  ctx.shadowBlur=15; ctx.shadowColor=flash?'#fff':e.col;
  ctx.strokeStyle=flash?'#fff':e.col;
  ctx.fillStyle=flash?'rgba(255,255,255,.15)':'rgba(5,0,15,.9)';
  ctx.lineWidth=(e.tp==='boss'?2.5:2)*SC;
  e.an+=.05;
  if (e.tp==='drone') {
    ctx.beginPath(); ctx.moveTo(e.x,e.y+e.h/2); ctx.lineTo(e.x+e.w/2,e.y-e.h/2);
    ctx.lineTo(e.x,e.y-e.h/4); ctx.lineTo(e.x-e.w/2,e.y-e.h/2); ctx.closePath(); ctx.fill(); ctx.stroke();
  } else if (e.tp==='cruiser') {
    ctx.beginPath(); ctx.rect(e.x-e.w/2,e.y-e.h/2,e.w,e.h); ctx.fill(); ctx.stroke();
    ctx.strokeStyle='rgba(255,230,0,.3)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(e.x-e.w/2+4,e.y); ctx.lineTo(e.x+e.w/2-4,e.y); ctx.stroke();
  } else if (e.tp==='interceptor') {
    ctx.beginPath(); ctx.moveTo(e.x,e.y-e.h/2); ctx.lineTo(e.x+e.w/2,e.y+e.h/2);
    ctx.lineTo(e.x+e.w/3,e.y); ctx.lineTo(e.x-e.w/3,e.y); ctx.lineTo(e.x-e.w/2,e.y+e.h/2);
    ctx.closePath(); ctx.fill(); ctx.stroke();
  } else { // boss
    ctx.beginPath(); ctx.moveTo(e.x,e.y-e.h/2); ctx.lineTo(e.x+e.w/2,e.y-e.h/6);
    ctx.lineTo(e.x+e.w/2,e.y+e.h/3); ctx.lineTo(e.x+e.w/3,e.y+e.h/2);
    ctx.lineTo(e.x-e.w/3,e.y+e.h/2); ctx.lineTo(e.x-e.w/2,e.y+e.h/3);
    ctx.lineTo(e.x-e.w/2,e.y-e.h/6); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.globalAlpha=.6+Math.sin(e.an*3)*.3; ctx.shadowBlur=30; ctx.fillStyle='#ff006e';
    ctx.beginPath(); ctx.arc(e.x,e.y,(12+Math.sin(e.an*2)*3)*SC,0,Math.PI*2); ctx.fill();
    ctx.globalAlpha=1; ctx.shadowBlur=0;
    const bw=70*SC, bh=6*SC;
    ctx.fillStyle='#300'; ctx.fillRect(e.x-bw/2,e.y-e.h/2-14*SC,bw,bh);
    ctx.fillStyle='#ff006e'; ctx.fillRect(e.x-bw/2,e.y-e.h/2-14*SC,bw*(e.hp/e.mhp),bh);
    ctx.strokeStyle='#ff006e'; ctx.lineWidth=1; ctx.strokeRect(e.x-bw/2,e.y-e.h/2-14*SC,bw,bh);
  }
  ctx.restore();
}

// ═══════════════════════════════════════════════════════
//  PARTICLES
// ═══════════════════════════════════════════════════════
function mkParts(x,y,col,n,spd) {
  for(let i=0;i<n;i++){
    const a=rnd(0,Math.PI*2),s=rnd(spd*.5,spd*2.5);
    parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:1,dec:rnd(.02,.06),sz:rnd(1,4)*SC,col});
  }
}
function mkExp(x,y,big=false){
  ['#ff006e','#ffe600','#00f5ff','#ff4400','#fff'].forEach(c=>mkParts(x,y,c,big?16:7,big?5*SC:3*SC));
  exps.push({x,y,r:0,life:1,bomb:false});
  sndExplosion(big);
}
function mkFloat(x,y,txt,col='#ffe600'){floats.push({x,y,txt,col,life:1,vy:-1.2*SC});}

// ═══════════════════════════════════════════════════════
//  SCORING
// ═══════════════════════════════════════════════════════
function addScore(e) {
  score+=e.sc; mkFloat(e.x,e.y,'+'+e.sc,e.tp==='boss'?'#ff006e':'#ffe600');
  document.getElementById('scoreD').textContent=score;
  if(score>best){best=score;localStorage.setItem('aa_best',best);document.getElementById('bestD').textContent=best;}
}
function updHUD(){
  document.getElementById('levelD').textContent=level;
  document.getElementById('bestD').textContent=best;
  ['h1','h2','h3'].forEach((id,i)=>document.getElementById(id).classList.toggle('lost',i>=lives));
}
function chkLevel(){
  if(score>=scoreThr){
    level++;scoreThr=Math.floor(scoreThr*1.8);bossOn=false;
    const b=document.getElementById('lvlBanner');
    b.textContent=level%3===0?'⚠ BOSS INCOMING ⚠':'LEVEL '+level;
    b.style.opacity='1'; updHUD();
    if(level%5===0)bombs=Math.min(bombs+1,5);
    sndLevelUp();
    setTimeout(()=>b.style.opacity='0',1800);
  }
}

// ═══════════════════════════════════════════════════════
//  SMART BOMB
// ═══════════════════════════════════════════════════════
function smartBomb(){
  if(bombs<=0||bombCool>0)return;
  bombs--;bombCool=200;
  exps.push({x:W/2,y:H/2,r:0,life:1,bomb:true});
  enemies.forEach(e=>{mkExp(e.x,e.y,e.tp==='boss');addScore(e);if(e.tp==='boss')bossOn=false;});
  enemies=[];eBullets=[];
  sndBomb();
}

// ═══════════════════════════════════════════════════════
//  COLLISION & DAMAGE
// ═══════════════════════════════════════════════════════
const OVL=(ax,ay,aw,ah,bx,by,bw,bh)=>ax-aw/2<bx+bw/2&&ax+aw/2>bx-bw/2&&ay-ah/2<by+bh/2&&ay+ah/2>by-bh/2;

function takeDmg(){
  if(invinc>0)return;
  lives--;invinc=90;
  mkParts(player.x,player.y,'#ff006e',20,4*SC);
  updHUD();sndDamage();
  if(lives<=0){state='dying';mkExp(player.x,player.y,true);setTimeout(gameOver,1100);}
}

// ═══════════════════════════════════════════════════════
//  GAME OVER / START
// ═══════════════════════════════════════════════════════
function gameOver(){
  state='gameover';
  setTimeout(()=>{
    document.getElementById('oTitle').textContent='GAME OVER';
    document.getElementById('oSub').textContent='The void consumed you';
    const os=document.getElementById('oScore');
    os.style.display='block';os.textContent='SCORE: '+score;
    document.getElementById('oBtn').textContent='RETRY MISSION';
    document.getElementById('overlay').classList.remove('hidden');
    if(titleId)cancelAnimationFrame(titleId);
    titleId=requestAnimationFrame(titleLoop);
  },400);
}

function startGame(){
  if(!AC){AC=new(window.AudioContext||window.webkitAudioContext)();}
  else if(AC.state==='suspended')AC.resume();
  state='playing';
  score=0;lives=3;level=1;bombs=3;
  fc=0;bossOn=false;invinc=0;bombCool=0;
  scoreThr=1500;sCool=0;eSpawnT=0;
  player=mkPlayer();
  bullets=[];enemies=[];eBullets=[];parts=[];exps=[];floats=[];
  initStars();
  document.getElementById('scoreD').textContent=0;
  document.getElementById('overlay').classList.add('hidden');
  updHUD();
  if(loopId)cancelAnimationFrame(loopId);
  if(titleId)cancelAnimationFrame(titleId);
  loopId=requestAnimationFrame(loop);
}

// ═══════════════════════════════════════════════════════
//  MAIN LOOP
// ═══════════════════════════════════════════════════════
function loop(){
  if(state!=='playing'&&state!=='dying')return;
  loopId=requestAnimationFrame(loop);
  fc++;
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle='#020008';ctx.fillRect(0,0,W,H);
  updStars();drawStars();

  // Grid
  ctx.strokeStyle='rgba(0,245,255,.025)';ctx.lineWidth=1;
  for(let x=0;x<W;x+=60*SC){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
  for(let y=0;y<H;y+=60*SC){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}

  // Explosions
  exps=exps.filter(ex=>{
    ex.r+=ex.bomb?35*SC:6*SC;ex.life-=ex.bomb?.04:.03;
    if(ex.life<=0)return false;
    ctx.save();ctx.globalAlpha=ex.life*.4;
    ctx.strokeStyle=ex.bomb?'#ffe600':'#ff006e';
    ctx.lineWidth=(ex.bomb?5:2)*SC;ctx.shadowBlur=20;ctx.shadowColor=ctx.strokeStyle;
    ctx.beginPath();ctx.arc(ex.x,ex.y,ex.r,0,Math.PI*2);ctx.stroke();ctx.restore();
    return true;
  });

  // Particles
  parts=parts.filter(p=>{
    p.x+=p.vx;p.y+=p.vy;p.vx*=.93;p.vy*=.93;p.life-=p.dec;
    if(p.life<=0)return false;
    ctx.save();ctx.globalAlpha=p.life;ctx.shadowBlur=8;ctx.shadowColor=p.col;
    ctx.fillStyle=p.col;ctx.beginPath();ctx.arc(p.x,p.y,p.sz*p.life,0,Math.PI*2);ctx.fill();ctx.restore();
    return true;
  });

  if(state==='dying')return;

  // Player input
  if(keys['ArrowLeft'] ||keys['a']||keys['A'])player.x-=player.spd;
  if(keys['ArrowRight']||keys['d']||keys['D'])player.x+=player.spd;
  if(keys['ArrowUp']   ||keys['w']||keys['W'])player.y-=player.spd;
  if(keys['ArrowDown'] ||keys['s']||keys['S'])player.y+=player.spd;
  player.x=clamp(player.x,player.w/2,W-player.w/2);
  player.y=clamp(player.y,player.h/2,H-player.h/2);

  sCool--;
  const fr=Math.max(8,18-level*1.5);
  if((keys[' ']||keys['Space'])&&sCool<=0){shoot();sCool=fr;}

  bombCool--;
  if((keys['z']||keys['Z'])&&bombCool<=0&&bombs>0)smartBomb();

  eSpawnT++;
  const sr=Math.max(28,100-level*8);
  if(eSpawnT>=sr){spawnEnemy();eSpawnT=0;}

  bullets=bullets.filter(b=>{b.x+=b.vx;b.y+=b.vy;return b.y>-20&&b.y<H+20&&b.x>-20&&b.x<W+20;});
  eBullets=eBullets.filter(b=>{b.x+=b.vx;b.y+=b.vy;return b.y<H+20;});

  // Update enemies
  enemies=enemies.filter(e=>{
    e.x+=e.vx;e.y+=e.vy;e.hf=Math.max(0,e.hf-1);
    if(e.x<e.w/2||e.x>W-e.w/2)e.vx*=-1;
    if(e.tp==='boss'){e.vx=Math.sin(fc*.018)*2.5*SC;if(e.y>110*SC)e.vy=.3*SC;}
    if(Math.random()<e.fc&&e.y>0&&e.y<H){
      const dx=player.x-e.x,dy=player.y-e.y,d=Math.sqrt(dx*dx+dy*dy)||1;
      const sp=e.tp==='boss'?5*SC:3.5*SC;
      const bc=e.tp==='boss'?'#ff4400':e.tp==='cruiser'?'#ffee00':e.tp==='interceptor'?'#00ff88':'#ff3399';
      eBullets.push({x:e.x,y:e.y+e.h/2,vx:(dx/d)*sp,vy:(dy/d)*sp,col:bc});
    }
    let alive=true;
    bullets=bullets.filter(b=>{
      if(!alive)return true;
      if(OVL(b.x,b.y,b.w,b.h,e.x,e.y,e.w,e.h)){
        e.hp--;e.hf=8;mkParts(b.x,b.y,e.col,5,3*SC);
        if(e.hp<=0){mkExp(e.x,e.y,e.tp==='boss');addScore(e);if(e.tp==='boss')bossOn=false;alive=false;chkLevel();}
        return false;
      }
      return true;
    });
    if(!alive)return false;
    if(invinc<=0&&OVL(e.x,e.y,e.w*.7,e.h*.7,player.x,player.y,player.w*.6,player.h*.6))takeDmg();
    return e.y<H+80*SC;
  });

  eBullets=eBullets.filter(b=>{
    if(invinc<=0&&OVL(b.x,b.y,6*SC,12*SC,player.x,player.y,player.w*.55,player.h*.55)){
      takeDmg();mkParts(b.x,b.y,b.col,6,2*SC);return false;
    }
    return true;
  });

  invinc--;
  drawPlayer(player);

  // Player bullets
  bullets.forEach(b=>{
    ctx.save();ctx.shadowBlur=12;ctx.shadowColor=b.col;
    const g=ctx.createLinearGradient(b.x,b.y,b.x,b.y-b.h);
    g.addColorStop(0,b.col);g.addColorStop(1,'transparent');
    ctx.fillStyle=g;ctx.fillRect(b.x-b.w/2,b.y-b.h,b.w,b.h);ctx.restore();
  });

  // Enemy bullets — bright with trail
  eBullets.forEach(b=>{
    ctx.save();
    ctx.shadowBlur=22;ctx.shadowColor=b.col;
    ctx.fillStyle='#ffffff';ctx.beginPath();ctx.arc(b.x,b.y,3.5*SC,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=.78;ctx.fillStyle=b.col;ctx.shadowBlur=26;
    ctx.beginPath();ctx.arc(b.x,b.y,6*SC,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=.5;ctx.strokeStyle='#ffffff';ctx.lineWidth=1;ctx.shadowBlur=0;
    ctx.beginPath();ctx.arc(b.x,b.y,7.5*SC,0,Math.PI*2);ctx.stroke();
    // Trail
    ctx.globalAlpha=.38;
    const tl=16*SC,sp=Math.sqrt(b.vx*b.vx+b.vy*b.vy)||1;
    const tx=b.x-(b.vx/sp)*tl,ty=b.y-(b.vy/sp)*tl;
    const tg=ctx.createLinearGradient(b.x,b.y,tx,ty);
    tg.addColorStop(0,b.col);tg.addColorStop(1,'transparent');
    ctx.strokeStyle=tg;ctx.lineWidth=3.5*SC;ctx.shadowBlur=12;ctx.shadowColor=b.col;
    ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.lineTo(tx,ty);ctx.stroke();
    ctx.restore();
  });

  enemies.forEach(drawEnemy);

  // Floating text
  floats=floats.filter(t=>{
    t.y+=t.vy;t.life-=.018;if(t.life<=0)return false;
    ctx.save();ctx.globalAlpha=t.life;
    ctx.font=`bold ${Math.round(13*SC)}px 'Orbitron',monospace`;
    ctx.fillStyle=t.col;ctx.shadowBlur=10;ctx.shadowColor=t.col;ctx.textAlign='center';
    ctx.fillText(t.txt,t.x,t.y);ctx.restore();return true;
  });

  // Bombs HUD
  ctx.save();
  ctx.font=`${Math.round(11*SC)}px 'Share Tech Mono',monospace`;
  ctx.fillStyle='rgba(0,245,255,.6)';ctx.textAlign='left';
  ctx.fillText('BOMBS: '+'◆'.repeat(Math.max(0,bombs))+'◇'.repeat(Math.max(0,5-bombs)),12*SC,20*SC);
  ctx.restore();
}

// ═══════════════════════════════════════════════════════
//  TITLE LOOP
// ═══════════════════════════════════════════════════════
function titleLoop(){
  if(state!=='title'&&state!=='gameover'){titleId=null;return;}
  titleId=requestAnimationFrame(titleLoop);
  if(!W||!H||!stars)return;
  ctx.clearRect(0,0,W,H);ctx.fillStyle='#020008';ctx.fillRect(0,0,W,H);
  updStars();drawStars();
  const t=Date.now()/1000;
  const g=ctx.createRadialGradient(W/2,H/2,20,W/2,H/2,220*SC);
  g.addColorStop(0,`rgba(0,245,255,${.04+Math.sin(t)*.02})`);g.addColorStop(1,'transparent');
  ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
}

// ═══════════════════════════════════════════════════════
//  KEYBOARD
// ═══════════════════════════════════════════════════════
document.addEventListener('keydown',e=>{keys[e.key]=true;if(e.key===' ')e.preventDefault();});
document.addEventListener('keyup',e=>{keys[e.key]=false;});
canvas.addEventListener('mousemove',e=>{
  if(state!=='playing')return;
  const r=canvas.getBoundingClientRect();
  player.x=clamp(e.clientX-r.left,player.w/2,W-player.w/2);
  player.y=clamp(e.clientY-r.top,player.h/2,H-player.h/2);
});
canvas.addEventListener('mousedown',()=>{if(state==='playing')keys[' ']=true;});
canvas.addEventListener('mouseup',()=>{keys[' ']=false;});

// ═══════════════════════════════════════════════════════
//  TOUCH D-PAD
// ═══════════════════════════════════════════════════════
function bindDP(id){
  const el=document.getElementById(id);
  const key=el.dataset.key;
  const dn=(e)=>{e.preventDefault();keys[key]=true;el.classList.add('on');};
  const up=(e)=>{e.preventDefault();keys[key]=false;el.classList.remove('on');};
  el.addEventListener('touchstart',dn,{passive:false});
  el.addEventListener('touchend',up,{passive:false});
  el.addEventListener('touchcancel',up,{passive:false});
  // Also support mouse for testing on desktop
  el.addEventListener('mousedown',dn);
  document.addEventListener('mouseup',()=>{keys[key]=false;el.classList.remove('on');});
}
['dU','dD','dL','dR'].forEach(bindDP);

// Fire button
const bFire=document.getElementById('bFire');
const dnFire=(e)=>{e.preventDefault();keys[' ']=true;bFire.classList.add('on');if(!AC)AC=new(window.AudioContext||window.webkitAudioContext)();else if(AC.state==='suspended')AC.resume();};
const upFire=(e)=>{e.preventDefault();keys[' ']=false;bFire.classList.remove('on');};
bFire.addEventListener('touchstart',dnFire,{passive:false});
bFire.addEventListener('touchend',upFire,{passive:false});
bFire.addEventListener('touchcancel',upFire,{passive:false});
bFire.addEventListener('mousedown',dnFire);
document.addEventListener('mouseup',()=>{keys[' ']=false;bFire.classList.remove('on');});

// Bomb button
const bBomb=document.getElementById('bBomb');
const doBomb=(e)=>{
  e.preventDefault();
  bBomb.classList.add('on');
  if(state==='playing')smartBomb();
  setTimeout(()=>bBomb.classList.remove('on'),200);
};
bBomb.addEventListener('touchstart',doBomb,{passive:false});
bBomb.addEventListener('mousedown',doBomb);

// Prevent accidental zoom/scroll on touch
document.addEventListener('touchmove',e=>e.preventDefault(),{passive:false});

// ═══════════════════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════════════════
document.getElementById('bestD').textContent=best;
resize();
initStars();
titleId=requestAnimationFrame(titleLoop);
