(() => {
  "use strict";

  const machines = [
    { id:"cosmic", name:"COSMIC CLAW", difficulty:"MEDIUM GRIP", cost:25, grip:.76, accent:"#24e0d0", bg:"#142b58", badge:"POPULAR", prizes:[
      {id:"astro",name:"Astro Bear",icon:"🐻",weight:.56},{id:"moon",name:"Moon Bunny",icon:"🐰",weight:.44},{id:"alien",name:"Lil Alien",icon:"👽",weight:.38},{id:"rocket",name:"Rocket Pal",icon:"🚀",weight:.62}]},
    { id:"sweet", name:"SWEET SCOOP", difficulty:"EASY GRIP", cost:20, grip:.82, accent:"#ff7db8", bg:"#4c153d", badge:"EASY WIN", prizes:[
      {id:"donut",name:"Donut Buddy",icon:"🍩",weight:.32},{id:"cupcake",name:"Cupcake Cutie",icon:"🧁",weight:.40},{id:"berry",name:"Berry Pop",icon:"🍓",weight:.30},{id:"candy",name:"Candy Star",icon:"🍬",weight:.28}]},
    { id:"monster", name:"MONSTER DROP", difficulty:"HEAVY PRIZES", cost:30, grip:.72, accent:"#a8ef3e", bg:"#273f18", badge:"2X TICKETS", prizes:[
      {id:"dragon",name:"Pocket Dragon",icon:"🐲",weight:.74},{id:"dino",name:"Neon Dino",icon:"🦖",weight:.68},{id:"octo",name:"Grumpy Octo",icon:"🐙",weight:.58},{id:"ghost",name:"Glow Ghost",icon:"👻",weight:.47}]},
    { id:"ocean", name:"DEEP SEA GRAB", difficulty:"BOUNCY PRIZES", cost:35, grip:.78, unlockPrice:320, accent:"#2aa8ff", bg:"#07375b", badge:"SHOP UNLOCK", prizes:[
      {id:"whale",name:"Mini Whale",icon:"🐳",weight:.53},{id:"puffer",name:"Puffer Pal",icon:"🐡",weight:.46},{id:"crab",name:"Crab Champ",icon:"🦀",weight:.61},{id:"pearl",name:"Pearl Shell",icon:"🐚",weight:.36}]},
    { id:"retro", name:"GOLD RUSH 84", difficulty:"EXPERT GRIP", cost:40, grip:.70, unlockPrice:500, accent:"#ffd733", bg:"#4d3107", badge:"SHOP UNLOCK", prizes:[
      {id:"crown",name:"Pixel Crown",icon:"👑",weight:.66},{id:"robot",name:"Retro Bot",icon:"🤖",weight:.58},{id:"gem",name:"Lucky Gem",icon:"💎",weight:.48},{id:"trophy",name:"Gold Trophy",icon:"🏆",weight:.72}]}
  ];

  const cosmetics = [
    {id:"chrome",name:"Classic Chrome",price:0,color:"#d5cede",glow:"transparent",mark:"⌄",description:"The original polished arcade claw."},
    {id:"pink",name:"Hot Pink Grip",price:140,color:"#ff3d91",glow:"#ff3d91",mark:"⌄",description:"Pink enamel with a soft neon edge glow."},
    {id:"plasma",name:"Plasma Talons",price:220,color:"#24e0d0",glow:"#24e0d0",mark:"ϟ",description:"Electric cyan arms and a plasma badge."},
    {id:"gold",name:"Gold Standard",price:360,color:"#ffd733",glow:"#ffd733",mark:"★",description:"A trophy-grade finish for serious collectors."},
    {id:"sapphire",name:"Sapphire Circuit",price:180,color:"#4f8cff",glow:"#246dff",mark:"◆",description:"Deep blue plating with a crisp electric shine."},
    {id:"toxic",name:"Toxic Grabber",price:260,color:"#a8ef3e",glow:"#76ff28",mark:"×",description:"Radioactive green talons from the monster floor."},
    {id:"candy",name:"Candy Clutch",price:195,color:"#ff9ac8",glow:"#ff4c9a",mark:"♥",description:"Bubblegum enamel made for Sweet Scoop regulars."},
    {id:"inferno",name:"Inferno Hooks",price:310,color:"#ff7138",glow:"#ff3d20",mark:"▲",description:"Hot orange steel with a furnace-bright glow."},
    {id:"void",name:"Void Collector",price:420,color:"#a77bff",glow:"#7b38ff",mark:"✦",description:"Rare ultraviolet plating from beyond the arcade."}
  ];

  const now=new Date(),todayKey=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
  const daySeed=Math.floor(Date.UTC(now.getFullYear(),now.getMonth(),now.getDate())/86400000);
  function seededShuffle(items,seed){const copy=[...items];let value=seed||1;for(let i=copy.length-1;i>0;i--){value=(value*1664525+1013904223)>>>0;const j=value%(i+1);[copy[i],copy[j]]=[copy[j],copy[i]];}return copy;}
  const questPool=[
    {id:"play3",event:"play",goal:3,reward:60,icon:"🎯",title:"Warm up round",description:"Play 3 claw machine rounds"},
    {id:"play5",event:"play",goal:5,reward:95,icon:"🪙",title:"Five more minutes",description:"Play 5 claw machine rounds"},
    {id:"win1",event:"win",goal:1,reward:80,icon:"🎁",title:"Prize of the day",description:"Win any prize today"},
    {id:"win2",event:"win",goal:2,reward:135,icon:"🏆",title:"Double clutch",description:"Win 2 prizes today"},
    {id:"machines2",event:"machines",goal:2,reward:75,icon:"🕹️",title:"Cabinet sampler",description:"Try 2 different machines"},
    {id:"machines3",event:"machines",goal:3,reward:110,icon:"🎮",title:"Arcade tour",description:"Try 3 different machines"},
    {id:"precision1",event:"precision",goal:1,reward:155,icon:"💎",title:"Steady hands",description:"Win once with almost no sway"},
    {id:"precision2",event:"precision",goal:2,reward:230,icon:"⚡",title:"Claw technician",description:"Make 2 precision wins"}
  ];
  const dailyQuests=seededShuffle(questPool,daySeed+31).slice(0,4);
  const challengeRules=Object.fromEntries(dailyQuests.map(q=>[q.id,q]));
  const featuredCosmeticIds=new Set(seededShuffle(cosmetics.filter(c=>c.id!=="chrome"),daySeed+97).slice(0,3).map(c=>c.id));
  const loginRewards=[30,45,60,80,110,150,225];

  const stored = JSON.parse(localStorage.getItem("prizeRushProfile") || "{}");
  const state = {
    machine:machines[0], clawX:.55, clawY:.06, clawV:0, swinging:0, phase:"ready", held:null, slipped:false,
    plays:3, tickets:Number.isFinite(stored.tickets)?stored.tickets:250,
    wins:stored.wins || JSON.parse(localStorage.getItem("prizeRushWins") || "[]"),
    tried:new Set(stored.triedDate===todayKey?(stored.tried||[]):[]),
    unlocked:new Set(stored.unlocked || ["cosmic","sweet","monster"]),
    ownedCosmetics:new Set(stored.ownedCosmetics || ["chrome"]), cosmetic:stored.cosmetic || "chrome",
    challengeProgress:stored.challengeDate===todayKey?(stored.challengeProgress||{}):{}, completed:new Set(stored.challengeDate===todayKey?(stored.completed||[]):[]),
    challengeDate:todayKey,loginStreak:stored.loginStreak||0,lastLoginDate:stored.lastLoginDate||null,dailyReward:0,
    sound:true, shopTab:"machines", gripWidth:.075, pile:[]
  };
  const canvas=document.getElementById("clawCanvas"), ctx=canvas.getContext("2d");
  const dropBtn=document.getElementById("dropBtn"), leftBtn=document.getElementById("leftBtn"), rightBtn=document.getElementById("rightBtn"), toast=document.getElementById("resultToast");
  let last=performance.now(), activeDirection=0;

  function saveProfile() {
    localStorage.setItem("prizeRushProfile",JSON.stringify({
      tickets:state.tickets,wins:state.wins,tried:[...state.tried],unlocked:[...state.unlocked],
      ownedCosmetics:[...state.ownedCosmetics],cosmetic:state.cosmetic,
      challengeProgress:state.challengeProgress,completed:[...state.completed],challengeDate:state.challengeDate,triedDate:todayKey,
      loginStreak:state.loginStreak,lastLoginDate:state.lastLoginDate
    }));
  }

  function makePile() {
    const base=state.machine.prizes;
    state.pile=Array.from({length:12},(_,i)=>{
      const prize=base[i%base.length], row=Math.floor(i/6), col=i%6;
      return {...prize,x:.235+col*.125+(row%2)*.025,y:.793-row*.082,r:.035+((i+1)%3)*.003,vx:0,vy:0,rot:(i%4-.5)*.12,av:0,mass:.65+prize.weight};
    });
  }

  function roundedRect(x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();}
  function drawBackground(w,h){
    const g=ctx.createLinearGradient(0,0,0,h);g.addColorStop(0,state.machine.bg);g.addColorStop(1,"#100720");ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
    ctx.globalAlpha=.18;ctx.strokeStyle=state.machine.accent;ctx.lineWidth=1;
    for(let x=0;x<w;x+=75){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();}
    for(let y=0;y<h;y+=75){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}
    ctx.globalAlpha=1;ctx.fillStyle="#150b29";ctx.fillRect(0,h*.84,w,h*.16);ctx.fillStyle=state.machine.accent+"35";ctx.fillRect(0,h*.835,w,3);
  }

  function drawPrize(p,w,h){
    const x=p.x*w,y=p.y*h,s=p.r*w*2.18;ctx.save();ctx.translate(x,y);ctx.rotate(p.rot||0);
    ctx.shadowColor=state.machine.accent;ctx.shadowBlur=18;ctx.shadowOffsetY=0;ctx.fillStyle="rgba(255,255,255,.24)";ctx.beginPath();ctx.arc(0,0,p.r*w,0,Math.PI*2);ctx.fill();
    ctx.shadowColor="rgba(0,0,0,.6)";ctx.shadowBlur=7;ctx.shadowOffsetY=5;ctx.strokeStyle="rgba(255,255,255,.72)";ctx.lineWidth=2.5;ctx.stroke();
    ctx.shadowColor="rgba(0,0,0,.48)";ctx.shadowBlur=8;ctx.shadowOffsetY=4;ctx.textAlign="center";ctx.textBaseline="middle";ctx.font=`${s}px Apple Color Emoji, Segoe UI Emoji, sans-serif`;ctx.fillText(p.icon,0,1);ctx.restore();
  }

  function clawPosition(time=performance.now()) { return {x:state.clawX+Math.sin(time/110)*state.swinging*.012,y:state.clawY}; }
  function cosmetic(){return cosmetics.find(c=>c.id===state.cosmetic)||cosmetics[0];}
  function drawClaw(w,h,time){
    const pos=clawPosition(time),x=pos.x*w,y=pos.y*h,skin=cosmetic(),open=state.gripWidth*w;
    ctx.save();ctx.shadowColor=skin.glow;ctx.shadowBlur=skin.glow==="transparent"?0:14;
    ctx.strokeStyle=skin.color;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,y);ctx.stroke();
    ctx.fillStyle="#665d79";ctx.fillRect(x-31,y-8,62,25);ctx.fillStyle=skin.color;roundedRect(x-23,y-14,46,20,7);
    ctx.fillStyle="#160b2c";ctx.textAlign="center";ctx.textBaseline="middle";ctx.font="bold 12px sans-serif";ctx.fillText(skin.mark,x,y-3);
    ctx.strokeStyle=skin.color;ctx.lineWidth=10;ctx.lineCap="round";ctx.lineJoin="round";
    ctx.beginPath();ctx.moveTo(x-15,y+8);ctx.bezierCurveTo(x-open*.75,y+28,x-open*1.12,y+62,x-open*.72,y+86);ctx.stroke();
    ctx.beginPath();ctx.moveTo(x+15,y+8);ctx.bezierCurveTo(x+open*.75,y+28,x+open*1.12,y+62,x+open*.72,y+86);ctx.stroke();ctx.restore();
    if(state.held) drawPrize(state.held,w,h);
  }

  function resolvePrizePhysics(dt,time){
    const steps=3,step=Math.min(dt/steps,.018),floor=.835,left=.075,right=.94;
    for(let n=0;n<steps;n++){
      for(const p of state.pile){
        p.vy+=.58*step;p.x+=p.vx*step;p.y+=p.vy*step;p.rot+=p.av*step;p.vx*=.997;p.av*=.985;
        if(p.x-p.r<left){p.x=left+p.r;p.vx=Math.abs(p.vx)*.35;p.av-=p.vy*.15;}
        if(p.x+p.r>right){p.x=right-p.r;p.vx=-Math.abs(p.vx)*.35;p.av+=p.vy*.15;}
        if(p.y+p.r>floor){p.y=floor-p.r;p.vy=-Math.abs(p.vy)*.18;p.vx*=.87;p.av+=p.vx*2.2;if(Math.abs(p.vy)<.008)p.vy=0;}
      }
      for(let i=0;i<state.pile.length;i++)for(let j=i+1;j<state.pile.length;j++){
        const a=state.pile[i],b=state.pile[j],dx=b.x-a.x,dy=b.y-a.y,min=a.r+b.r,d=Math.hypot(dx,dy)||.001;
        if(d<min){const nx=dx/d,ny=dy/d,overlap=min-d,total=a.mass+b.mass;a.x-=nx*overlap*(b.mass/total);a.y-=ny*overlap*(b.mass/total);b.x+=nx*overlap*(a.mass/total);b.y+=ny*overlap*(a.mass/total);
          const rvx=b.vx-a.vx,rvy=b.vy-a.vy,along=rvx*nx+rvy*ny;if(along<0){const impulse=-(1.22)*along/(1/a.mass+1/b.mass);a.vx-=impulse*nx/a.mass;a.vy-=impulse*ny/a.mass;b.vx+=impulse*nx/b.mass;b.vy+=impulse*ny/b.mass;a.av-=along*.7;b.av+=along*.7;}}
      }
      if(state.phase==="descending"||state.phase==="grabbing"||state.phase==="checking"){
        const cp=clawPosition(time),tipY=cp.y+.143;
        for(const p of state.pile)for(const side of [-1,1]){
          const tx=cp.x+side*state.gripWidth*.72,dx=p.x-tx,dy=p.y-tipY,d=Math.hypot(dx,dy)||.001,min=p.r+.012;
          if(d<min){const nx=dx/d,ny=dy/d,overlap=min-d;p.x+=nx*overlap;p.y+=ny*overlap;p.vx+=nx*.035;p.vy+=ny*.025;p.av+=side*.45;}
        }
      }
    }
  }

  function resolveHeldPhysics(dt,time){
    const p=state.held;if(!p)return;
    const cp=clawPosition(time), pocketX=cp.x, pocketY=cp.y+.142;
    const gripMargin=Math.max(.02,state.machine.grip+.22-p.weight), springX=55+gripMargin*68, springY=38+gripMargin*54;
    const dx=pocketX-p.x,dy=pocketY-p.y;
    p.vy+=.58*dt;
    p.vx+=dx*springX*dt;p.vy+=dy*springY*dt;
    p.vx*=Math.pow(.28,dt);p.vy*=Math.pow(.42,dt);
    p.x+=p.vx*dt;p.y+=p.vy*dt;
    p.av+=dx*5.5*dt;p.av*=Math.pow(.2,dt);p.rot+=p.av*dt;
    const horizontalSlip=Math.abs(p.x-pocketX)>Math.max(.125,p.r*3.1);
    const verticalSlip=p.y-pocketY>Math.max(.135,p.r*3.4);
    if(horizontalSlip||verticalSlip){
      p.vx+=(p.x-pocketX)*.7;p.vy=Math.max(p.vy,.04);state.pile.push(p);state.held=null;state.slipped=true;beep(135,.16);
    }
  }

  function render(time){
    const seconds=Math.min((time-last)/1000,.035);last=time;
    if(activeDirection&&state.phase==="ready"){state.clawV+=activeDirection*.65*seconds;state.clawV*=.90;state.clawX+=state.clawV*seconds;state.clawX=Math.max(.18,Math.min(.88,state.clawX));state.swinging=Math.min(1,state.swinging+seconds*3.2);}else{state.clawV*=.86;state.swinging*=Math.pow(.45,seconds);}
    resolvePrizePhysics(seconds,time);resolveHeldPhysics(seconds,time);drawBackground(canvas.width,canvas.height);state.pile.forEach(p=>drawPrize(p,canvas.width,canvas.height));drawClaw(canvas.width,canvas.height,time);requestAnimationFrame(render);
  }

  function beep(freq=440,duration=.07){if(!state.sound)return;try{const a=new AudioContext(),o=a.createOscillator(),g=a.createGain();o.frequency.value=freq;o.type="square";g.gain.setValueAtTime(.025,a.currentTime);g.gain.exponentialRampToValueAtTime(.001,a.currentTime+duration);o.connect(g).connect(a.destination);o.start();o.stop(a.currentTime+duration);}catch(_) {}}
  function move(dir){if(state.phase!=="ready")return;activeDirection=dir;state.clawV+=dir*.12;state.swinging=1;beep(dir<0?320:390,.04);}
  function stopMove(){activeDirection=0;}

  function findPhysicalGrip(){
    const cp=clawPosition(),tipY=cp.y+.143;
    return state.pile.map((p,index)=>({p,index,dx:Math.abs(p.x-cp.x),dy:Math.abs(p.y-tipY)}))
      .filter(c=>c.dx<Math.max(.105,c.p.r*2.4)&&c.dy<Math.max(.125,c.p.r*3.0))
      .sort((a,b)=>(a.dx+a.dy*.35)-(b.dx+b.dy*.35))[0]||null;
  }

  async function drop(){
    if(state.phase!=="ready")return;
    if(state.plays<=0&&state.tickets<state.machine.cost){showToast("OUT OF TICKETS","Complete challenges or save for more plays");return;}
    if(state.plays>0)state.plays--;else state.tickets-=state.machine.cost;
    state.tried.add(state.machine.id);advanceEvent("play",1);setEvent("machines",state.tried.size);saveProfile();updateUI();
    dropBtn.disabled=true;state.phase="descending";document.getElementById("machineStatus").textContent="PHYSICS ACTIVE";beep(220,.12);
    const startSway=state.swinging,targetY=.688;state.gripWidth=.080;state.slipped=false;
    await tween(1050,p=>state.clawY=.06+(targetY-.06)*ease(p));
    let contact=findPhysicalGrip();
    state.phase="grabbing";await tween(440,p=>state.gripWidth=.080-(.035*ease(p)));
    state.phase="checking";document.getElementById("machineStatus").textContent="TESTING THE GRIP...";beep(410,.08);
    await tween(900,p=>state.gripWidth=.045-Math.sin(p*Math.PI*3)*.003*(1-p));
    contact=contact||findPhysicalGrip();
    if(contact){
      const forceRequired=contact.p.weight+state.swinging*.06;
      const baseChance=state.machine.id==="sweet"?.99:state.machine.id==="monster"?.92:state.machine.id==="retro"?.90:.96;
      const alignment=Math.max(0,1-contact.dx/.105),grabChance=Math.max(.88,Math.min(.995,baseChance+alignment*.035-state.swinging*.015-contact.p.weight*.008));
      if(forceRequired<=state.machine.grip+.22&&Math.random()<grabChance){
        const pocket=clawPosition();state.held=contact.p;state.pile.splice(state.pile.indexOf(contact.p),1);
        state.held.x+=(pocket.x-state.held.x)*.48;state.held.y+=(pocket.y+.142-state.held.y)*.35;state.held.vx=state.clawV*.05;state.held.vy=0;beep(660,.13);document.getElementById("machineStatus").textContent="PRIZE SECURED";
      }
      else {contact.p.vx+=(contact.p.x-state.clawX)*.7;contact.p.vy=-.08;}
    }
    state.phase="rising";await tween(1125,p=>state.clawY=targetY-(targetY-.06)*ease(p));
    if(state.held){
      state.phase="returning";const start=state.clawX;await tween(1050,p=>state.clawX=start+(.10-start)*ease(p));
      const won=state.held;state.held=null;state.wins.push(won.id);state.tickets+=state.machine.id==="monster"?50:25;advanceEvent("win",1);if(startSway<.18)advanceEvent("precision",1);renderCollection();
      showToast(`YOU GOT ${won.name.toUpperCase()}!`,state.machine.id==="monster"?"+50 tickets · real physics grab":"+25 tickets · added to your shelf");beep(880,.2);setTimeout(()=>beep(1100,.25),160);
    }else{showToast(state.slipped?"THE PRIZE SLIPPED!":"THE GRIP LET GO",state.slipped?"Move gently after contact — weight and momentum can break the grip":"Good alignment improves your odds — try the grip again");beep(145,.22);}
    if(state.pile.length<6)makePile();state.phase="ready";state.clawY=.06;state.gripWidth=.075;dropBtn.disabled=false;document.getElementById("machineStatus").textContent="MACHINE READY";saveProfile();updateUI();
  }

  function tween(ms,tick){return new Promise(resolve=>{const start=performance.now();function frame(now){const p=Math.min(1,(now-start)/ms);tick(p);p<1?requestAnimationFrame(frame):resolve();}requestAnimationFrame(frame);});}
  const ease=p=>p<.5?2*p*p:1-Math.pow(-2*p+2,2)/2;
  function showToast(title,sub){toast.innerHTML=`${title}<small>${sub}</small>`;toast.classList.add("show");setTimeout(()=>toast.classList.remove("show"),2800);}

  function setEvent(event,value){dailyQuests.filter(q=>q.event===event).forEach(q=>{state.challengeProgress[q.id]=Math.max(state.challengeProgress[q.id]||0,Math.min(value,q.goal));finishChallenge(q.id);});updateChallenges();}
  function advanceEvent(event,amount){dailyQuests.filter(q=>q.event===event).forEach(q=>{state.challengeProgress[q.id]=Math.min((state.challengeProgress[q.id]||0)+amount,q.goal);finishChallenge(q.id);});updateChallenges();}
  function finishChallenge(id){const rule=challengeRules[id];if((state.challengeProgress[id]||0)>=rule.goal&&!state.completed.has(id)){state.completed.add(id);state.tickets+=rule.reward;showToast("CHALLENGE CLEARED!",`+${rule.reward} tickets added to your balance`);beep(760,.15);saveProfile();}}
  function renderChallenges(){document.getElementById("challengeList").innerHTML=dailyQuests.map(q=>`<article class="challenge" data-challenge="${q.id}"><div class="challenge-icon">${q.icon}</div><div><b>${q.title}</b><p>${q.description} <span class="challenge-count">0/${q.goal}</span></p><div class="progress"><i></i></div></div><span class="reward">+${q.reward} ◆</span></article>`).join("");}
  function updateChallenges(){
    Object.entries(challengeRules).forEach(([id,rule])=>{const el=document.querySelector(`[data-challenge="${id}"]`);if(!el)return;const value=Math.min(state.challengeProgress[id]||0,rule.goal);el.classList.toggle("complete",state.completed.has(id));el.querySelector(".progress i").style.width=`${value/rule.goal*100}%`;el.querySelector(".challenge-count").textContent=`${value}/${rule.goal}`;});
  }
  function dateDistance(from,to){if(!from)return 99;const [fy,fm,fd]=from.split("-").map(Number),[ty,tm,td]=to.split("-").map(Number);return Math.round((Date.UTC(ty,tm-1,td)-Date.UTC(fy,fm-1,fd))/86400000);}
  function applyDailyLogin(){
    if(state.lastLoginDate===todayKey)return;
    state.loginStreak=dateDistance(state.lastLoginDate,todayKey)===1?state.loginStreak+1:1;
    state.dailyReward=loginRewards[(state.loginStreak-1)%loginRewards.length];state.tickets+=state.dailyReward;state.lastLoginDate=todayKey;saveProfile();
  }
  function renderLoginStreak(){
    const cycleDay=(state.loginStreak-1)%7+1;document.getElementById("streakCount").textContent=state.loginStreak;
    document.getElementById("streakDays").innerHTML=loginRewards.map((reward,i)=>`<span class="${i<cycleDay?"done":""}" title="Day ${i+1}: ${reward} tickets">${i+1}</span>`).join("");
    document.getElementById("nextReward").textContent=`NEXT: +${loginRewards[cycleDay%7]} ◆`;
  }
  function updateUI(){document.getElementById("ticketCount").textContent=state.tickets;document.getElementById("shopTicketCount").textContent=state.tickets;document.getElementById("playsLeft").textContent=state.plays;}

  function selectMachine(id){
    if(state.phase!=="ready")return;if(!state.unlocked.has(id)){document.getElementById("shop").scrollIntoView({behavior:"smooth"});showToast("MACHINE LOCKED","Unlock this cabinet at the Prize Counter");return;}
    state.machine=machines.find(m=>m.id===id);makePile();state.clawX=.55;state.swinging=0;
    document.getElementById("machineName").textContent=state.machine.name;document.getElementById("marqueeName").textContent=state.machine.name;document.getElementById("machineDifficulty").textContent=state.machine.difficulty;document.querySelector(".cost").innerHTML=`<span>◆</span> ${state.machine.cost} / PLAY`;
    document.querySelectorAll(".game-tile").forEach(el=>el.classList.toggle("selected",el.dataset.id===id));document.getElementById("machine").scrollIntoView({behavior:"smooth",block:"start"});beep(520,.08);
  }

  function renderGames(){
    document.getElementById("gameGrid").innerHTML=machines.map(m=>{const locked=!state.unlocked.has(m.id);return `<button class="game-tile ${m.id===state.machine.id?"selected":""} ${locked?"locked":""}" data-id="${m.id}" style="--accent:${m.accent};--tile-bg:${m.bg}" aria-label="${locked?"Locked machine":"Play"} ${m.name}"><div class="game-scene"><div class="mini-claw"></div><div class="prize-pile">${m.prizes.map(p=>`<span>${p.icon}</span>`).join("")}</div></div><div class="tile-info"><div><b>${m.name}</b><small>${m.difficulty} · ${m.cost} TICKETS</small></div><span class="tile-badge">${locked?`${m.unlockPrice} ◆`:m.badge}</span></div></button>`;}).join("");
    document.querySelectorAll(".game-tile").forEach(el=>el.addEventListener("click",()=>selectMachine(el.dataset.id)));
  }

  function renderCollection(){const all=machines.flatMap(m=>m.prizes);document.getElementById("collectionGrid").innerHTML=all.map(p=>`<div class="collection-item ${state.wins.includes(p.id)?"won":""}" title="${p.name}"><span>${state.wins.includes(p.id)?p.icon:"?"}</span><small>${state.wins.includes(p.id)?p.name:"Locked"}</small></div>`).join("");}

  function renderShop(){
    const items=state.shopTab==="machines"?machines.filter(m=>m.unlockPrice):cosmetics.filter(c=>c.id==="chrome"||state.ownedCosmetics.has(c.id)||featuredCosmeticIds.has(c.id));
    document.getElementById("shopGrid").innerHTML=items.map(item=>{
      const isMachine="unlockPrice" in item,owned=isMachine?state.unlocked.has(item.id):state.ownedCosmetics.has(item.id),equipped=!isMachine&&state.cosmetic===item.id,price=isMachine?item.unlockPrice:item.price;
      const buttonLabel=isMachine?(owned?"UNLOCKED":`UNLOCK · ${price} ◆`):(equipped?"EQUIPPED":owned?"EQUIP":price===0?"OWNED":`BUY · ${price} ◆`);
      return `<article class="shop-card ${equipped?"equipped":""}" style="--item-accent:${item.accent||item.color}"><div class="shop-preview ${isMachine?"":"claw-preview"}">${isMachine?item.prizes[0].icon:item.mark}</div><div class="shop-info"><small>${isMachine?"NEW CABINET":owned?"OWNED COSMETIC":"TODAY'S FEATURE"}</small><h3>${item.name}</h3><p>${isMachine?`${item.difficulty}. Includes 4 new collectible prizes.`:item.description}</p><button class="buy-btn" data-shop-id="${item.id}" ${owned&&isMachine||equipped?"disabled":""}>${buttonLabel}</button></div></article>`;
    }).join("");
    document.querySelectorAll(".buy-btn:not(:disabled)").forEach(btn=>btn.addEventListener("click",()=>buyOrEquip(btn.dataset.shopId)));
  }

  function buyOrEquip(id){
    const machine=machines.find(m=>m.id===id),skin=cosmetics.find(c=>c.id===id),item=machine||skin,price=machine?machine.unlockPrice:skin.price,owned=machine?state.unlocked.has(id):state.ownedCosmetics.has(id);
    if(!owned){if(state.tickets<price){showToast("NOT ENOUGH TICKETS",`You need ${price-state.tickets} more tickets`);return;}state.tickets-=price;if(machine)state.unlocked.add(id);else state.ownedCosmetics.add(id);showToast(machine?"NEW MACHINE UNLOCKED!":"COSMETIC PURCHASED!",item.name);}
    if(skin){state.cosmetic=id;showToast("CLAW UPDATED",`${skin.name} is now equipped`);}
    saveProfile();updateUI();renderGames();renderShop();beep(900,.15);
  }

  [[leftBtn,-1],[rightBtn,1]].forEach(([button,dir])=>{button.addEventListener("pointerdown",()=>move(dir));button.addEventListener("pointerup",stopMove);button.addEventListener("pointerleave",stopMove);});
  window.addEventListener("pointerup",stopMove);window.addEventListener("keydown",e=>{if(e.key==="ArrowLeft")move(-1);if(e.key==="ArrowRight")move(1);if((e.key===" "||e.key==="ArrowDown")&&!e.repeat){e.preventDefault();drop();}});window.addEventListener("keyup",e=>{if(e.key==="ArrowLeft"||e.key==="ArrowRight")stopMove();});
  dropBtn.addEventListener("click",drop);document.getElementById("soundToggle").addEventListener("click",e=>{state.sound=!state.sound;e.currentTarget.textContent=state.sound?"♪":"×";e.currentTarget.setAttribute("aria-label",state.sound?"Mute arcade sounds":"Turn on arcade sounds");});
  document.querySelectorAll("[data-shop-tab]").forEach(btn=>btn.addEventListener("click",()=>{state.shopTab=btn.dataset.shopTab;document.querySelectorAll("[data-shop-tab]").forEach(b=>b.classList.toggle("active",b===btn));renderShop();}));

  applyDailyLogin();makePile();renderChallenges();renderGames();renderShop();renderCollection();updateChallenges();renderLoginStreak();updateUI();requestAnimationFrame(render);
  if(state.dailyReward)setTimeout(()=>showToast("DAILY LOGIN REWARD!",`Day ${state.loginStreak} streak · +${state.dailyReward} tickets`),450);
})();
