(() => {
  "use strict";

  const machines = [
    { id: "cosmic", name: "COSMIC CLAW", difficulty: "MEDIUM GRIP", cost: 25, accent: "#24e0d0", bg: "#142b58", badge: "POPULAR", prizes: [
      { id: "astro", name: "Astro Bear", icon: "🐻", weight: .56 }, { id: "moon", name: "Moon Bunny", icon: "🐰", weight: .44 }, { id: "alien", name: "Lil Alien", icon: "👽", weight: .38 }, { id: "rocket", name: "Rocket Pal", icon: "🚀", weight: .62 }
    ]},
    { id: "sweet", name: "SWEET SCOOP", difficulty: "EASY GRIP", cost: 20, accent: "#ff7db8", bg: "#4c153d", badge: "EASY WIN", prizes: [
      { id: "donut", name: "Donut Buddy", icon: "🍩", weight: .32 }, { id: "cupcake", name: "Cupcake Cutie", icon: "🧁", weight: .4 }, { id: "berry", name: "Berry Pop", icon: "🍓", weight: .3 }, { id: "candy", name: "Candy Star", icon: "🍬", weight: .28 }
    ]},
    { id: "monster", name: "MONSTER DROP", difficulty: "TOUGH GRIP", cost: 30, accent: "#a8ef3e", bg: "#273f18", badge: "2X TICKETS", prizes: [
      { id: "dragon", name: "Pocket Dragon", icon: "🐲", weight: .74 }, { id: "dino", name: "Neon Dino", icon: "🦖", weight: .68 }, { id: "octo", name: "Grumpy Octo", icon: "🐙", weight: .58 }, { id: "ghost", name: "Glow Ghost", icon: "👻", weight: .47 }
    ]}
  ];

  const state = {
    machine: machines[0], clawX: .55, clawY: .06, velocity: 0, swinging: 0,
    phase: "ready", held: null, plays: 3, tickets: 250,
    wins: JSON.parse(localStorage.getItem("prizeRushWins") || "[]"),
    tried: new Set(JSON.parse(localStorage.getItem("prizeRushTried") || "[]")),
    challenges: JSON.parse(localStorage.getItem("prizeRushChallenges") || "{}"),
    sound: true
  };

  const canvas = document.getElementById("clawCanvas");
  const ctx = canvas.getContext("2d");
  const dropBtn = document.getElementById("dropBtn");
  const leftBtn = document.getElementById("leftBtn");
  const rightBtn = document.getElementById("rightBtn");
  const toast = document.getElementById("resultToast");
  let last = performance.now();
  let activeDirection = 0;

  function makePile() {
    const base = state.machine.prizes;
    state.pile = Array.from({ length: 10 }, (_, i) => {
      const prize = base[i % base.length];
      return { ...prize, x: .18 + ((i * .157) % .68), y: .74 + (i % 3) * .055, rot: ((i * 31) % 36 - 18) * Math.PI / 180, size: .073 + (i % 2) * .008 };
    });
  }

  function roundedRect(x, y, w, h, r) {
    ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill();
  }

  function drawBackground(w, h) {
    const g = ctx.createLinearGradient(0,0,0,h); g.addColorStop(0, state.machine.bg); g.addColorStop(1,"#100720");
    ctx.fillStyle = g; ctx.fillRect(0,0,w,h);
    ctx.globalAlpha = .18; ctx.strokeStyle = state.machine.accent; ctx.lineWidth = 1;
    for (let x=0; x<w; x+=75) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke(); }
    for (let y=0; y<h; y+=75) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke(); }
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#150b29"; ctx.fillRect(0,h*.84,w,h*.16);
    ctx.fillStyle = state.machine.accent + "35"; ctx.fillRect(0,h*.835,w,3);
  }

  function drawPrize(prize, w, h) {
    const x=prize.x*w, y=prize.y*h, s=prize.size*w;
    ctx.save(); ctx.translate(x,y); ctx.rotate(prize.rot || 0);
    ctx.shadowColor = "rgba(0,0,0,.55)"; ctx.shadowBlur = 15; ctx.shadowOffsetY = 9;
    ctx.fillStyle = "rgba(255,255,255,.13)"; ctx.beginPath(); ctx.ellipse(0, s*.2, s*.55, s*.47, 0, 0, Math.PI*2); ctx.fill();
    ctx.shadowColor = "transparent"; ctx.textAlign="center"; ctx.textBaseline="middle"; ctx.font = `${s}px Apple Color Emoji, Segoe UI Emoji, sans-serif`; ctx.fillText(prize.icon,0,0);
    ctx.restore();
  }

  function drawClaw(w,h, time) {
    const sway = Math.sin(time/110) * state.swinging * 10;
    const x=state.clawX*w+sway, top=0, y=state.clawY*h;
    ctx.strokeStyle="#c5bfd4"; ctx.lineWidth=4; ctx.beginPath(); ctx.moveTo(x,top); ctx.lineTo(x,y); ctx.stroke();
    ctx.fillStyle="#6e6682"; ctx.fillRect(x-24,y-7,48,20);
    ctx.fillStyle="#a9a1ba"; roundedRect(x-17,y-12,34,17,6);
    const open = state.phase === "descending" || state.phase === "ready" ? 35 : 16;
    ctx.strokeStyle="#d5cede"; ctx.lineWidth=5; ctx.lineCap="round";
    ctx.beginPath(); ctx.moveTo(x-10,y+7); ctx.quadraticCurveTo(x-open,y+32,x-open-4,y+60); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x+10,y+7); ctx.quadraticCurveTo(x+open,y+32,x+open+4,y+60); ctx.stroke();
    ctx.strokeStyle="#857c98"; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(x,y+10); ctx.lineTo(x-open,y+48); ctx.moveTo(x,y+10); ctx.lineTo(x+open,y+48); ctx.stroke();
    if (state.held) {
      const held = { ...state.held, x:x/w, y:(y+75)/h, rot: Math.sin(time/100)*.15, size:.073 };
      drawPrize(held,w,h);
    }
  }

  function render(time) {
    const dt = Math.min((time-last)/16.67, 2); last=time;
    const w=canvas.width, h=canvas.height;
    if (activeDirection && state.phase === "ready") {
      state.velocity += activeDirection * .00055 * dt;
      state.velocity *= .9; state.clawX += state.velocity * dt;
      state.clawX = Math.max(.18, Math.min(.86, state.clawX)); state.swinging = Math.min(1, state.swinging + .045*dt);
    } else { state.velocity *= .88; state.swinging *= .975; }
    drawBackground(w,h); state.pile.forEach(p => drawPrize(p,w,h)); drawClaw(w,h,time);
    requestAnimationFrame(render);
  }

  function beep(freq=440, duration=.07) {
    if (!state.sound) return;
    try { const a=new AudioContext(); const o=a.createOscillator(); const g=a.createGain(); o.frequency.value=freq; o.type="square"; g.gain.setValueAtTime(.025,a.currentTime); g.gain.exponentialRampToValueAtTime(.001,a.currentTime+duration); o.connect(g).connect(a.destination); o.start(); o.stop(a.currentTime+duration); } catch (_) {}
  }

  function move(dir) {
    if (state.phase !== "ready") return;
    activeDirection = dir; state.velocity += dir*.008; state.swinging = 1; beep(dir<0?320:390,.04);
  }
  function stopMove() { activeDirection = 0; }

  async function drop() {
    if (state.phase !== "ready") return;
    if (state.plays <= 0 && state.tickets < state.machine.cost) { showToast("OUT OF TICKETS", "Complete challenges to earn more"); return; }
    if (state.plays > 0) state.plays--; else state.tickets -= state.machine.cost;
    state.tried.add(state.machine.id); localStorage.setItem("prizeRushTried", JSON.stringify([...state.tried]));
    completeChallenge("play", 40);
    if (state.tried.size >= 2) completeChallenge("machines", 75);
    updateUI(); dropBtn.disabled=true; state.phase="descending"; document.getElementById("machineStatus").textContent="CLAW IN MOTION"; beep(220,.12);
    const targetY=.67; await tween(1050, p => state.clawY=.06+(targetY-.06)*ease(p));
    const candidates=state.pile.map((p,i)=>({p,i,d:Math.abs(p.x-state.clawX)})).sort((a,b)=>a.d-b.d);
    const closest=candidates[0]; const settledPenalty=Math.min(state.swinging*.16,.16); const alignment=Math.max(0, 1-closest.d/.16);
    const grip = state.machine.id==="sweet"?.78:state.machine.id==="monster"?.54:.66;
    const chance=Math.max(.08, alignment*grip-closest.p.weight*.22-settledPenalty);
    state.phase="grabbing"; await wait(420);
    if (Math.random()<chance && closest.d<.13) { state.held=closest.p; state.pile.splice(closest.i,1); beep(660,.13); }
    state.phase="rising"; await tween(900,p=>state.clawY=targetY-(targetY-.06)*ease(p));
    if (state.held) {
      state.phase="returning"; const start=state.clawX; await tween(850,p=>state.clawX=start+(.10-start)*ease(p));
      const won=state.held; state.held=null; state.wins.push(won.id); localStorage.setItem("prizeRushWins",JSON.stringify(state.wins));
      state.tickets += state.machine.id==="monster"?50:20; completeChallenge("win",100); renderCollection();
      showToast(`YOU GOT ${won.name.toUpperCase()}!`, state.machine.id==="monster"?"+50 bonus tickets · prize collected":"+20 tickets · prize added to your shelf");
      beep(880,.2); setTimeout(()=>beep(1100,.25),160);
    } else { showToast("SO CLOSE!", "The claw slipped — settle the sway and try again"); beep(145,.22); }
    if (state.pile.length<6) makePile();
    state.phase="ready"; state.clawY=.06; state.clawX=Math.max(.18,state.clawX); dropBtn.disabled=false; document.getElementById("machineStatus").textContent="MACHINE READY"; updateUI();
  }

  function tween(ms, tick) { return new Promise(resolve=>{ const start=performance.now(); function frame(now){ const p=Math.min(1,(now-start)/ms); tick(p); p<1?requestAnimationFrame(frame):resolve(); } requestAnimationFrame(frame); }); }
  const wait = ms => new Promise(r=>setTimeout(r,ms));
  const ease = p => p<.5?2*p*p:1-Math.pow(-2*p+2,2)/2;
  function showToast(title, sub) { toast.innerHTML=`${title}<small>${sub}</small>`; toast.classList.add("show"); setTimeout(()=>toast.classList.remove("show"),2600); }

  function completeChallenge(id,reward) {
    if (state.challenges[id]) return;
    state.challenges[id]=true; state.tickets+=reward; localStorage.setItem("prizeRushChallenges",JSON.stringify(state.challenges)); updateChallenges();
  }
  function updateChallenges() {
    Object.keys(state.challenges).forEach(id=>document.querySelector(`[data-challenge="${id}"]`)?.classList.add("complete"));
  }
  function updateUI() {
    document.getElementById("ticketCount").textContent=state.tickets;
    document.getElementById("playsLeft").textContent=state.plays;
  }

  function selectMachine(id) {
    if (state.phase!=="ready") return;
    state.machine=machines.find(m=>m.id===id); makePile(); state.clawX=.55; state.swinging=0;
    document.getElementById("machineName").textContent=state.machine.name;
    document.getElementById("marqueeName").textContent=state.machine.name;
    document.getElementById("machineDifficulty").textContent=state.machine.difficulty;
    document.querySelector(".cost").innerHTML=`<span>◆</span> ${state.machine.cost} / PLAY`;
    document.querySelectorAll(".game-tile").forEach(el=>el.classList.toggle("selected",el.dataset.id===id));
    document.getElementById("machine").scrollIntoView({behavior:"smooth",block:"start"}); beep(520,.08);
  }

  function renderGames() {
    document.getElementById("gameGrid").innerHTML=machines.map(m=>`
      <button class="game-tile ${m.id===state.machine.id?"selected":""}" data-id="${m.id}" style="--accent:${m.accent};--tile-bg:${m.bg}" aria-label="Play ${m.name}">
        <div class="game-scene"><div class="mini-claw"></div><div class="prize-pile">${m.prizes.map(p=>`<span>${p.icon}</span>`).join("")}</div></div>
        <div class="tile-info"><div><b>${m.name}</b><small>${m.difficulty} · ${m.cost} TICKETS</small></div><span class="tile-badge">${m.badge}</span></div>
      </button>`).join("");
    document.querySelectorAll(".game-tile").forEach(el=>el.addEventListener("click",()=>selectMachine(el.dataset.id)));
  }

  function renderCollection() {
    const all=machines.flatMap(m=>m.prizes);
    document.getElementById("collectionGrid").innerHTML=all.map(p=>`<div class="collection-item ${state.wins.includes(p.id)?"won":""}" title="${p.name}"><span>${state.wins.includes(p.id)?p.icon:"?"}</span><small>${state.wins.includes(p.id)?p.name:"Locked"}</small></div>`).join("");
  }

  [[leftBtn,-1],[rightBtn,1]].forEach(([button,dir])=>{
    button.addEventListener("pointerdown",()=>move(dir)); button.addEventListener("pointerup",stopMove); button.addEventListener("pointerleave",stopMove);
  });
  window.addEventListener("pointerup",stopMove);
  window.addEventListener("keydown",e=>{ if(e.key==="ArrowLeft") move(-1); if(e.key==="ArrowRight") move(1); if((e.key===" "||e.key==="ArrowDown")&&!e.repeat){e.preventDefault();drop();} });
  window.addEventListener("keyup",e=>{if(e.key==="ArrowLeft"||e.key==="ArrowRight")stopMove();});
  dropBtn.addEventListener("click",drop);
  document.getElementById("soundToggle").addEventListener("click",e=>{state.sound=!state.sound;e.currentTarget.textContent=state.sound?"♪":"×";e.currentTarget.setAttribute("aria-label",state.sound?"Mute arcade sounds":"Turn on arcade sounds");});

  makePile(); renderGames(); renderCollection(); updateChallenges(); updateUI(); requestAnimationFrame(render);
})();
