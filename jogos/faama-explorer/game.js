
"use strict";

(() => {
  const canvas = document.getElementById("world");

  if (!canvas) {
    console.error("Canvas com id='world' não encontrado.");
    return;
  }

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    console.error("Não foi possível iniciar o Canvas 2D.");
    return;
  }

  const ui = {
    location: document.getElementById("location"),
    objective: document.getElementById("objective"),
    interact: document.getElementById("interact"),
    toast: document.getElementById("toast"),
    fatal: document.getElementById("fatal"),
    zoom: document.getElementById("zoomLabel")
  };

  const SW = 1200;
  const SH = 760;
  const W = 34;
  const H = 44;
  const TW = 39;
  const TH = 19.5;

  canvas.width = SW;
  canvas.height = SH;

  // Planta do campus separada do motor de renderização.
  const sites = window.FAAMA_MAP.sites;

  const player = {
    x: 20,
    y: 42,
    speed: 5,
    walk: 0,
    facing: "down",
    moving: false
  };

  const held = new Set();

  let zoom = 0.8;
  let time = 0;
  let previous = 0;
  let toastUntil = 0;
  let near = null;

  const camera = iso(18, 24.5);

  const roads = window.FAAMA_MAP.roads;
  const interior = window.createFaamaInterior({
    ctx,canvasWidth:SW,canvasHeight:SH
  });
  const centralSite = sites.find(s => s.id === "central");
  const academicSite = sites.find(s => s.id === "academic");
  const sportsSite = sites.find(s => s.id === "sports");
  const restaurantSite = sites.find(s => s.id === "restaurant");
  const schoolSite = sites.find(s => s.id === "school");
  const churchSite = sites.find(s => s.id === "church");
  const poolSite = sites.find(s => s.id === "pool");
  const femaleSite = sites.find(s => s.id === "female");
  const maleSite = sites.find(s => s.id === "male");
  const interiorUI = {
    panel:document.getElementById("interiorStatus"),
    room:document.getElementById("interiorRoom"),
    minimap:document.getElementById("minimapPanel"),
    building:document.getElementById("interiorBuilding")
  };
  function nearCentralEntrance(){
    if(!centralSite)return false;
    // Faixa curta junto à porta; a pista da missão, mais ao sul,
    // continua acessível sem ser confundida com a entrada do prédio.
    return player.y >= centralSite.y+centralSite.h-.15 &&
      player.y <= centralSite.y+centralSite.h+1.30 &&
      Math.hypot(player.x-(centralSite.x+centralSite.w/2),
        player.y-(centralSite.y+centralSite.h+.65))<1.45;
  }
  function nearAcademicEntrance(){
    if(!academicSite)return false;
    const cx=academicSite.x+academicSite.w/2;
    const y=academicSite.y+academicSite.h;
    return player.y >= y-.15 && player.y <= y+1.3 &&
      Math.hypot(player.x-cx,player.y-(y+.65))<1.45;
  }
  function nearSportsEntrance(){
    if(!sportsSite)return false;
    const cx=sportsSite.x+sportsSite.w/2,y=sportsSite.y+sportsSite.h;
    return player.y>=y-.16&&player.y<=y+1.4&&
      Math.hypot(player.x-cx,player.y-(y+.65))<1.48;
  }
  function nearRestaurantEntrance(){
    if(!restaurantSite)return false;
    const cx=restaurantSite.x+restaurantSite.w/2;
    const y=restaurantSite.y+restaurantSite.h;
    return player.y>=y-.15 && player.y<=y+1.42 &&
      Math.hypot(player.x-cx,player.y-(y+.67))<1.5;
  }
  function nearSchoolEntrance(){
    if(!schoolSite)return false;
    const cx=schoolSite.x+schoolSite.w/2;
    const y=schoolSite.y+schoolSite.h;
    return player.y>=y-.16&&player.y<=y+1.4&&
      Math.hypot(player.x-cx,player.y-(y+.66))<1.47;
  }
  function nearChurchEntrance(){
    if(!churchSite)return false;
    const cx=churchSite.x+churchSite.w/2;
    const y=churchSite.y+churchSite.h;
    return player.y>=y-.15&&player.y<=y+1.4&&
      Math.hypot(player.x-cx,player.y-(y+.65))<1.45;
  }
  // Todas as novas portas preservam a posição original dos edifícios no mapa.
  function nearNewSiteEntrance(site){
    if(!site)return false;
    const cx=site.x+site.w/2,y=site.y+site.h;
    return player.y>=y-.18&&player.y<=y+1.42&&
      Math.hypot(player.x-cx,player.y-(y+.66))<1.48;
  }
  function setInteriorMode(enabled){
    if(interiorUI.panel)interiorUI.panel.classList.toggle("hidden",!enabled);
    if(interiorUI.minimap)interiorUI.minimap.classList.toggle("hidden",enabled);
  }
  function enterCentral(){
    if(interiorUI.building)interiorUI.building.textContent="🏛️ PRÉDIO CENTRAL • INTERIOR";
    interior.enter();
    held.clear();
    player.moving=false;
    setInteriorMode(true);
    if(ui.toast)ui.toast.classList.add("hidden");
    show("Você entrou no Prédio Central. Explore as salas e converse com Marina!",5);
  }
  function leaveCentral(){
    if(!interior.active)return;
    interior.leave();
    held.clear();
    player.x=centralSite.x+centralSite.w/2;
    player.y=centralSite.y+centralSite.h+1.30;
    player.moving=false;
    nearTalker=null;
    nearQuestItem=null;
    setInteriorMode(false);
    show("Você saiu do Prédio Central e voltou ao campus.",4);
  }

  function enterAcademic(){
    if(interiorUI.building)interiorUI.building.textContent="🎓 PRÉDIO ACADÊMICO • INTERIOR";
    academic.enter();
    held.clear();
    player.moving=false;
    setInteriorMode(true);
    if(ui.toast)ui.toast.classList.add("hidden");
    show("Bem-vindo ao Prédio Acadêmico! Converse com a professora Helena.",5);
  }
  function leaveAcademic(){
    if(!academic.active)return;
    academic.leave();
    held.clear();
    player.x=academicSite.x+academicSite.w/2;
    player.y=academicSite.y+academicSite.h+1.25;
    player.moving=false;
    nearTalker=null;
    nearQuestItem=null;
    setInteriorMode(false);
    show("Você voltou ao campus pelo Prédio Acadêmico.",4);
  }
  function enterSports(){
    if(interiorUI.building)interiorUI.building.textContent="🏆 COMPLEXO ESPORTIVO • GINÁSIO";
    sports.enter();
    held.clear();
    player.moving=false;
    setInteriorMode(true);
    if(ui.toast)ui.toast.classList.add("hidden");
    refreshSportsUI();
    show("Bem-vindo ao ginásio! Converse com o treinador Rafael para começar.",5);
  }
  function leaveSports(){
    if(!sports.active)return;
    sports.leave();
    held.clear();
    player.x=sportsSite.x+sportsSite.w/2;
    player.y=sportsSite.y+sportsSite.h+1.25;
    player.moving=false;
    nearTalker=null;
    nearQuestItem=null;
    setInteriorMode(false);
    refreshSportsUI();
    show("Você voltou ao campus. O recorde do circuito foi preservado.",4);
  }
  function enterRestaurant(){
    if(interiorUI.building)interiorUI.building.textContent="🍽️ RESTAURANTE DA FAAMA • INTERIOR";
    restaurant.enter();
    held.clear();
    player.moving=false;
    setInteriorMode(true);
    if(ui.toast)ui.toast.classList.add("hidden");
    refreshRestaurantUI();
    show(restaurant.phase==="paused"
      ?"Seu pedido foi salvo! Converse com Clara para retomar de onde parou."
      :"Bem-vindo ao Restaurante! Converse com a cozinheira Clara.",5);
  }
  function leaveRestaurant(){
    if(!restaurant.active)return;
    closeFood();
    restaurant.leave();
    held.clear();
    player.x=restaurantSite.x+restaurantSite.w/2;
    player.y=restaurantSite.y+restaurantSite.h+1.25;
    player.moving=false;
    nearTalker=null;
    nearQuestItem=null;
    setInteriorMode(false);
    refreshRestaurantUI();
    show("Você voltou ao campus. Os pedidos e o recorde foram preservados.",4);
  }
  function enterSchool(){
    if(interiorUI.building)interiorUI.building.textContent="🗺️ FAAMINHA • INTERIOR";
    school.enter();
    held.clear();
    player.moving=false;
    setInteriorMode(true);
    if(ui.toast)ui.toast.classList.add("hidden");
    refreshSchoolUI();
    show("Você entrou na FAAMinha! Converse com a professora Sofia para começar a aventura.",5);
  }
  function leaveSchool(){
    if(!school.active)return;
    closeSchoolPuzzle();
    school.leave();
    held.clear();
    player.x=schoolSite.x+schoolSite.w/2;
    player.y=schoolSite.y+schoolSite.h+1.25;
    player.moving=false;
    nearTalker=null;nearQuestItem=null;
    setInteriorMode(false);
    refreshSchoolUI();
    show("Você saiu da FAAMinha. As pistas encontradas foram salvas.",4);
  }
  function enterPool(){
    if(interiorUI.building)interiorUI.building.textContent="🏊 PISCINA • DESAFIO AQUÁTICO";
    pool.enter();held.clear();player.moving=false;setInteriorMode(true);
    if(ui.toast)ui.toast.classList.add("hidden");
    refreshPoolUI();
    show("Bem-vindo à Piscina! Converse com a guarda-vidas Nara.",5);
  }
  function leavePool(){
    if(!pool.active)return;
    pool.leave();held.clear();
    player.x=poolSite.x+poolSite.w/2;
    player.y=poolSite.y+poolSite.h+1.25;
    player.moving=false;nearTalker=null;nearQuestItem=null;
    setInteriorMode(false);refreshPoolUI();
    show("Você voltou ao campus. O recorde aquático foi preservado.",4);
  }
  function enterResidence(kind){
    const residence=kind==="female"?female:male;
    if(interiorUI.building)interiorUI.building.textContent=
      "🏠 "+residence.conf.name.toUpperCase()+" • INTERIOR";
    residence.enter();held.clear();player.moving=false;setInteriorMode(true);
    if(ui.toast)ui.toast.classList.add("hidden");
    refreshResidenceUI(kind);
    show("Você entrou no "+residence.conf.name+". Converse com "+residence.npc.name+".",5);
  }
  function leaveResidence(kind){
    const residence=kind==="female"?female:male;
    if(!residence.active)return;
    closeResidencePuzzle();
    residence.leave();held.clear();
    const site=kind==="female"?femaleSite:maleSite;
    player.x=site.x+site.w/2;
    player.y=site.y+site.h+1.25;
    player.moving=false;nearTalker=null;nearQuestItem=null;
    setInteriorMode(false);refreshResidenceUI(kind);
    show("Você voltou ao campus. O progresso do residencial foi salvo.",4);
  }
  function enterChurch(){
    if(!finalGate.progress().unlocked||!church.enter()){
      show(finalGate.notice(),7);refreshFinalGateUI();return false;
    }
    if(interiorUI.building)interiorUI.building.textContent="⛪ IGREJA DA FAAMA • FASE FINAL";
    held.clear();player.moving=false;setInteriorMode(true);
    if(ui.toast)ui.toast.classList.add("hidden");
    refreshChurchUI();
    show(church.progress().completed
      ?"Bem-vindo de volta! Você já é Lenda da FAAMA. Reveja sua vitória no diário."
      :"Você chegou à última fase. Converse com o capelão Samuel.",6);
    return true;
  }
  function leaveChurch(){
    if(!church.active)return;
    closeChurchChallenge();
    stopChurchCinematic();
    closeFinalVictory();
    church.leave();held.clear();
    player.x=churchSite.x+churchSite.w/2;
    player.y=churchSite.y+churchSite.h+1.25;
    player.moving=false;nearTalker=null;nearQuestItem=null;
    setInteriorMode(false);
    refreshChurchUI();
    show("Você voltou ao campus. A história final e todas as conquistas continuam salvas.",5);
  }
  // Os atores são independentes da planta aprovada dos prédios.
  const life = window.createCampusLife({
    ctx, P, sites, worldW: W, worldH: H,
    obstacleAt: (x, y, radius) => landscapeBlocked(x, y, radius)
  });
  let nearTalker = null;
  let nearQuestItem = null;
  let activeDialogue = null;
  let pendingQuestNotice = null;
  let pendingSportsStart=false;
  let pendingRestaurantStart=false;
  let pendingPoolStart=false;

  // Missão 01 compartilha o Canvas, sem mudar o mapa nem os NPCs.
  let questStorage = null;
  try {questStorage = window.localStorage;} catch (_error) {}
  const quest = window.createFaamaQuest({ ctx, P, storage: questStorage });
  const indoorQuest = window.createFaamaIndoorQuest({
    storage:questStorage,firstQuest:quest
  });
  const academic = window.createFaamaAcademic({
    ctx,storage:questStorage,canvasWidth:SW,canvasHeight:SH
  });
  const sports=window.createFaamaSports({
    ctx,storage:questStorage,canvasWidth:SW,canvasHeight:SH
  });
  const restaurant=window.createFaamaRestaurant({
    ctx,storage:questStorage,canvasWidth:SW,canvasHeight:SH
  });
  const school=window.createFaamaSchool({
    ctx,storage:questStorage,canvasWidth:SW,canvasHeight:SH
  });
  const pool=window.createFaamaPool({
    ctx,storage:questStorage,canvasWidth:SW,canvasHeight:SH
  });
  const female=window.createFaamaResidence({
    kind:"female",ctx,storage:questStorage,canvasWidth:SW,canvasHeight:SH
  });
  const male=window.createFaamaResidence({
    kind:"male",ctx,storage:questStorage,canvasWidth:SW,canvasHeight:SH
  });
  // As três missões adicionais alimentam diretamente o portão final:
  // todas precisam retornar completed === true para liberar a Igreja.
  window.FAAMA_EXTRA_QUESTS={...(window.FAAMA_EXTRA_QUESTS||{}),pool,female,male};
  function refreshTotalXP(){
    if(questUI.xp)questUI.xp.textContent=
      (quest.progress().xp+indoorQuest.progress().xp+academic.progress().xp+
        sports.progress().xp+restaurant.progress().xp+school.progress().xp+
        pool.progress().xp+female.progress().xp+male.progress().xp+
        church.progress().xp)+" XP";
  }
  const poolUI={
    hud:document.getElementById("poolHUD"),
    timer:document.getElementById("poolTimer"),
    status:document.getElementById("poolStatus"),
    hudBuoys:document.getElementById("poolBuoyCount"),
    hudState:document.getElementById("poolState"),
    bar:document.getElementById("poolBuoyBar"),
    stage:document.getElementById("poolQuestStage"),
    description:document.getElementById("poolQuestDescription"),
    buoys:document.getElementById("poolQuestBuoys"),
    best:document.getElementById("poolBestTime"),
    time:document.getElementById("poolQuestTime"),
    achievement:document.getElementById("poolQuestAchievement")
  };
  function refreshPoolUI(){
    const p=pool.progress();
    const stages={idle:"DISPONÍVEL",running:"EM ANDAMENTO",
      failed:"TEMPO ESGOTADO",finished:"CONCLUÍDA"};
    if(poolUI.hud)poolUI.hud.classList.toggle("hidden",!pool.active);
    if(poolUI.stage)poolUI.stage.textContent=p.completed?"CONCLUÍDA":stages[p.stage];
    if(poolUI.description)poolUI.description.textContent=p.objective;
    if(poolUI.buoys)poolUI.buoys.textContent="🏊 Boias coletadas: "+p.buoys+" / "+p.total;
    if(poolUI.best)poolUI.best.textContent="⏱️ Recorde: "+p.bestLabel;
    if(poolUI.time)poolUI.time.textContent=p.stage==="running"
      ?"⏳ Restante: "+p.timeLeft.toFixed(1).replace(".",",")+"s":
      p.stage==="finished"?"⏱️ Último tempo: "+p.elapsed.toFixed(1).replace(".",",")+"s":
      "⏳ Limite: 120 segundos";
    if(poolUI.achievement){
      poolUI.achievement.textContent=p.achievement?"🏆 "+p.achievement:"🏆 Conquista bloqueada";
      poolUI.achievement.classList.toggle("complete",p.completed);
    }
    if(poolUI.timer)poolUI.timer.textContent=(p.stage==="finished"?p.elapsed:p.timeLeft).toFixed(1).replace(".",",")+"s";
    if(poolUI.status)poolUI.status.textContent=p.objective;
    if(poolUI.hudBuoys)poolUI.hudBuoys.textContent=p.buoys+" / "+p.total+" boias";
    if(poolUI.hudState)poolUI.hudState.textContent=p.stage==="running"?"Rumo à chegada!":
      p.stage==="failed"?"Tente novamente":p.stage==="finished"?"Circuito concluído":"Fale com Nara";
    if(poolUI.bar)poolUI.bar.style.width=(p.buoys/p.total*100)+"%";
    refreshTotalXP();
  }
  const residenceUI={
    hud:document.getElementById("residenceHUD"),
    hudTitle:document.getElementById("residenceHUDTitle"),
    hudCount:document.getElementById("residenceHUDCount"),
    hudHint:document.getElementById("residenceHUDHint"),
    hudBar:document.getElementById("residenceHUDBar"),
    female:{
      stage:document.getElementById("femaleQuestStage"),
      description:document.getElementById("femaleQuestDescription"),
      agenda:document.getElementById("femaleQuestAgenda"),
      garrafa:document.getElementById("femaleQuestGarrafa"),
      livro:document.getElementById("femaleQuestLivro"),
      steps:document.getElementById("femaleQuestSteps"),
      achievement:document.getElementById("femaleQuestAchievement")
    },
    male:{
      stage:document.getElementById("maleQuestStage"),
      description:document.getElementById("maleQuestDescription"),
      cartaz:document.getElementById("maleQuestCartaz"),
      lanterna:document.getElementById("maleQuestLanterna"),
      bloco:document.getElementById("maleQuestBloco"),
      steps:document.getElementById("maleQuestSteps"),
      achievement:document.getElementById("maleQuestAchievement")
    }
  };
  const residencePuzzleUI={
    root:document.getElementById("residencePuzzle"),
    title:document.getElementById("residencePuzzleTitle"),
    step:document.getElementById("residencePuzzleStep"),
    question:document.getElementById("residencePuzzleQuestion"),
    feedback:document.getElementById("residencePuzzleFeedback"),
    close:document.getElementById("residencePuzzleClose"),
    choices:[...document.querySelectorAll("[data-residence-answer]")]
  };
  let residencePuzzleKind=null;
  function currentResidence(){return female.active?female:male.active?male:null;}
  function refreshResidenceUI(kind){
    const o=kind==="female"?female:male;
    const p=o.progress(),target=residenceUI[kind];
    const stages={ready:"DISPONÍVEL",collect:"COLETANDO MATERIAIS",
      organize:"ORGANIZAR ETAPAS",return:"VOLTAR AO MONITOR",completed:"CONCLUÍDA"};
    if(target.stage)target.stage.textContent=stages[p.stage];
    if(target.description)target.description.textContent=p.objective;
    if(target.steps)target.steps.textContent="🧩 Etapas concluídas: "+p.solved+" / 3";
    for(const item of p.items){
      const node=target[item.id];
      if(!node)continue;
      node.textContent=(item.found?"✓ ":p.started?"○ ":"🔒 ")+item.name;
      node.classList.toggle("complete",item.found);
    }
    if(target.achievement){
      target.achievement.textContent=p.achievement?"🏆 "+p.achievement:"🏆 Conquista bloqueada";
      target.achievement.classList.toggle("complete",p.completed);
    }
    const active=currentResidence();
    if(residenceUI.hud)residenceUI.hud.classList.toggle("hidden",!active);
    if(active){
      const state=active.progress();
      if(residenceUI.hudTitle)residenceUI.hudTitle.textContent=
        "🏠 "+active.conf.short+" • "+active.conf.title;
      if(residenceUI.hudCount)residenceUI.hudCount.textContent=state.collected+"/3";
      if(residenceUI.hudHint)residenceUI.hudHint.textContent=state.objective;
      if(residenceUI.hudBar)residenceUI.hudBar.style.width=
        ((state.collected+state.solved)/6*100)+"%";
    }
    refreshTotalXP();
  }
  function closeResidencePuzzle(){
    if(!residencePuzzleKind)return;
    residencePuzzleKind=null;
    residencePuzzleUI.root.classList.add("hidden");
    held.clear();
  }
  function openResidencePuzzle(kind,puzzle){
    residencePuzzleKind=kind;
    held.clear();
    (kind==="female"?female:male).pause();
    residencePuzzleUI.title.textContent=puzzle.title;
    residencePuzzleUI.step.textContent=(puzzle.index+1)+"/3";
    residencePuzzleUI.question.textContent=puzzle.question;
    residencePuzzleUI.feedback.textContent="Escolha uma resposta. Tente novamente se errar.";
    residencePuzzleUI.choices.forEach((btn,index)=>btn.textContent=
      (index+1)+". "+puzzle.choices[index]);
    residencePuzzleUI.root.classList.remove("hidden");
  }
  function answerResidencePuzzle(index){
    if(!residencePuzzleKind)return;
    const kind=residencePuzzleKind;
    const result=(kind==="female"?female:male).answer(index);
    if(result.correct){
      closeResidencePuzzle();
      refreshResidenceUI(kind);
      show(result.message,6);
    }else if(!result.ignored){
      residencePuzzleUI.feedback.textContent=result.message;
    }
  }
  // A Igreja é a última fase. As futuras missões precisam ser concluídas
  // e registrar sua instância em window.FAAMA_EXTRA_QUESTS antes da liberação.
  const finalGate=window.createFaamaFinalGate({
    getProgress:()=>{
      const extras=window.FAAMA_EXTRA_QUESTS||{};
      return {
        quest01:quest.progress(),quest02:indoorQuest.progress(),
        academic:academic.progress(),sports:sports.progress(),
        restaurant:restaurant.progress(),school:school.progress(),
        pool:extras.pool?.progress?.()||null,
        female:extras.female?.progress?.()||null,
        male:extras.male?.progress?.()||null
      };
    }
  });
  const church=window.createFaamaChurch({
    ctx,storage:questStorage,canvasWidth:SW,canvasHeight:SH,
    isUnlocked:()=>finalGate.progress().unlocked
  });
  const PLAYTIME_KEY="faama-explorer-playtime-v1";
  let playTimeSeconds=0,playtimeSaveBucket=0;
  try{
    const savedSeconds=Number(questStorage?.getItem(PLAYTIME_KEY));
    if(Number.isFinite(savedSeconds)&&savedSeconds>=0&&savedSeconds<1e8){
      playTimeSeconds=savedSeconds;playtimeSaveBucket=Math.floor(playTimeSeconds/8);
    }
  }catch(_error){}
  function persistPlayTime(){
    try{questStorage?.setItem(PLAYTIME_KEY,String(Math.round(playTimeSeconds)));}catch(_error){}
  }
  function formatPlaytime(seconds){
    const n=Math.max(0,Math.round(seconds)),h=Math.floor(n/3600),m=Math.floor(n%3600/60),s=n%60;
    return h>0?h+"h "+String(m).padStart(2,"0")+"min":m>0?m+"min "+String(s).padStart(2,"0")+"s":s+"s";
  }
  const finalGateUI={
    stage:document.getElementById("finalGateStage"),
    description:document.getElementById("finalGateDescription"),
    count:document.getElementById("finalGateCount"),
    bar:document.getElementById("finalGateBar"),
    missing:document.getElementById("finalGateMissing"),
    chapters:{
      quest01:document.getElementById("finalGateQuest01"),
      quest02:document.getElementById("finalGateQuest02"),
      academic:document.getElementById("finalGateAcademic"),
      sports:document.getElementById("finalGateSports"),
      restaurant:document.getElementById("finalGateRestaurant"),
      school:document.getElementById("finalGateSchool"),
      pool:document.getElementById("finalGatePool"),
      female:document.getElementById("finalGateFemale"),
      male:document.getElementById("finalGateMale")
    }
  };
  let finalGateCachedState="";
  function refreshFinalGateUI(){
    const p=finalGate.progress();
    const state=p.chapters.map(c=>c.completed?"1":"0").join("")+
      (church.progress().completed?"1":"0");
    if(state===finalGateCachedState)return;
    finalGateCachedState=state;
    if(finalGateUI.stage)finalGateUI.stage.textContent=
      !p.unlocked?"🔒 BLOQUEADA":church.progress().completed?"🏆 JOGO ZERADO":"🔓 LIBERADA";
    if(finalGateUI.description)finalGateUI.description.textContent=!p.unlocked
      ?"Conclua todas as outras missões para desbloquear a Igreja, a última fase do FAAMA Explorer."
      :church.progress().completed
      ?"Missão final concluída! Você zerou o jogo e pode continuar explorando o campus."
      :"Todas as missões anteriores foram concluídas! A Igreja está aberta para a grande missão final.";
    if(finalGateUI.count)finalGateUI.count.textContent=
      p.done+" de "+p.total+" missões concluídas";
    if(finalGateUI.bar)finalGateUI.bar.style.width=(p.done/p.total*100)+"%";
    if(finalGateUI.missing)finalGateUI.missing.textContent=p.unlocked
      ?church.progress().completed?"🏆 Lenda da FAAMA — a jornada foi concluída!"
        :"Tudo pronto! Entre na Igreja e conclua O Livro da Jornada."
      :"Faltam: "+p.missing.map(c=>c.name).join(" • ");
    for(const c of p.chapters){
      const node=finalGateUI.chapters[c.id];
      if(!node)continue;
      node.textContent=(c.completed?"✓ ":"🔒 ")+c.name;
      node.classList.toggle("complete",c.completed);
    }
  }
  const churchUI={
    hud:document.getElementById("churchHUD"),
    hudCount:document.getElementById("churchHUDCount"),
    hudObjective:document.getElementById("churchHUDObjective"),
    hudBar:document.getElementById("churchHUDBar"),
    stage:document.getElementById("churchQuestStage"),
    description:document.getElementById("churchQuestDescription"),
    book:document.getElementById("churchQuestBook"),
    virtues:document.getElementById("churchQuestVirtues"),
    achievement:document.getElementById("churchQuestAchievement"),
    bar:document.getElementById("churchQuestBar"),
    replay:document.getElementById("churchQuestReplay")
  };
  const churchChallengeUI={
    root:document.getElementById("churchChallenge"),
    title:document.getElementById("churchChallengeTitle"),
    step:document.getElementById("churchChallengeStep"),
    lead:document.getElementById("churchChallengeLead"),
    question:document.getElementById("churchChallengeQuestion"),
    feedback:document.getElementById("churchChallengeFeedback"),
    close:document.getElementById("churchChallengeClose"),
    choices:[...document.querySelectorAll("[data-church-answer]")]
  };
  const cinematicUI={
    root:document.getElementById("churchCinematic"),
    bar:document.getElementById("churchCinematicBar")
  };
  const endingUI={
    root:document.getElementById("endingScreen"),
    missions:document.getElementById("endingMissions"),
    xp:document.getElementById("endingXP"),
    progress:document.getElementById("endingProgress"),
    playtime:document.getElementById("endingPlaytime"),
    records:document.getElementById("endingRecords"),
    credits:document.getElementById("endingCredits"),
    explore:document.getElementById("endingExplore"),
    toggleCredits:document.getElementById("endingToggleCredits"),
    restart:document.getElementById("endingRestartJourney")
  };
  let churchChallengeActive=null;
  let churchCinematicActive=false,churchCinematicElapsed=0,endingOpen=false;
  function refreshChurchUI(){
    const p=church.progress();
    const names={locked:"🔒 BLOQUEADA",ready:"DISPONÍVEL",book:"LIVRO DA JORNADA",
      virtues:"FÉ • ESPERANÇA • AMOR",return:"VOLTAR A SAMUEL",completed:"🏆 JOGO ZERADO"};
    if(churchUI.stage)churchUI.stage.textContent=names[p.stage];
    if(churchUI.description)churchUI.description.textContent=p.objective;
    if(churchUI.book)churchUI.book.textContent=
      "📖 Livro da Jornada: "+p.book+" / "+p.bookTotal+" lembranças";
    if(churchUI.virtues)churchUI.virtues.textContent=
      "✦ Fé • Esperança • Amor: "+p.virtues+" / "+p.virtueTotal+" concluídos";
    if(churchUI.achievement){
      churchUI.achievement.textContent=p.completed
        ?"🏆 Conquista: Lenda da FAAMA":"🏆 Conquista bloqueada: Lenda da FAAMA";
      churchUI.achievement.classList.toggle("complete",p.completed);
    }
    if(churchUI.hud)churchUI.hud.classList.toggle("hidden",!church.active);
    if(churchUI.hudCount)churchUI.hudCount.textContent=(p.book+p.virtues)+"/12";
    if(churchUI.hudObjective)churchUI.hudObjective.textContent=p.objective;
    if(churchUI.hudBar)churchUI.hudBar.style.width=((p.book+p.virtues)/12*100)+"%";
    if(churchUI.bar)churchUI.bar.style.width=((p.book+p.virtues)/12*100)+"%";
    if(churchUI.replay)churchUI.replay.classList.toggle("hidden",!p.completed);
    refreshTotalXP();
  }
  function closeChurchChallenge(){
    if(!churchChallengeActive)return;
    churchChallengeActive=null;
    churchChallengeUI.root.classList.add("hidden");
    held.clear();
  }
  function fillChurchChallenge(item,feedback){
    churchChallengeUI.title.textContent=item.type==="book"
      ?item.icon+" "+item.place:item.icon+" Painel da "+item.title;
    churchChallengeUI.step.textContent=item.type==="book"
      ?"LIVRO DA JORNADA • "+(item.index+1)+"/9":
      "TRÊS VALORES • "+(item.index+1)+"/3";
    churchChallengeUI.lead.textContent=item.type==="book"
      ?"Recordação "+(item.index+1)+" de nove. Qual valor você aprendeu?"
      :"1 Coríntios 13:13 • "+item.title;
    churchChallengeUI.question.textContent=item.question||item.prompt;
    churchChallengeUI.feedback.textContent=feedback||"Escolha a atitude que melhor corresponde à jornada.";
    churchChallengeUI.choices.forEach((button,i)=>{
      button.textContent=(i+1)+". "+item.choices[i];
    });
  }
  function openChurchChallenge(item){
    if(churchChallengeActive||!church.active)return;
    churchChallengeActive=item;
    held.clear();church.pause();
    fillChurchChallenge(item);
    churchChallengeUI.root.classList.remove("hidden");
  }
  function answerChurchChallenge(index){
    if(!churchChallengeActive)return;
    const item=churchChallengeActive;
    const result=church.answer(item.type,item.id,index);
    if(result.correct){
      refreshChurchUI();
      if(result.next){
        churchChallengeActive=result.next;
        fillChurchChallenge(result.next,"✓ "+result.message);
      }else{
        closeChurchChallenge();
        show(result.message,7);
      }
    }else if(!result.ignored){
      churchChallengeUI.feedback.textContent=result.message;
    }else{
      closeChurchChallenge();
      show(church.objective(),5);
    }
  }
  function stopChurchCinematic(){
    churchCinematicActive=false;churchCinematicElapsed=0;
    if(cinematicUI.root)cinematicUI.root.classList.add("hidden");
    if(cinematicUI.bar)cinematicUI.bar.style.width="0%";
  }
  function startChurchCinematic(){
    if(!church.active||!church.progress().completed)return;
    endingOpen=false;
    if(endingUI.root)endingUI.root.classList.add("hidden");
    churchCinematicActive=true;churchCinematicElapsed=0;
    held.clear();church.pause();persistPlayTime();
    if(cinematicUI.bar)cinematicUI.bar.style.width="0%";
    if(cinematicUI.root)cinematicUI.root.classList.remove("hidden");
  }
  function refreshEndingStats(){
    const missions=finalGate.progress().done+(church.progress().completed?1:0);
    if(endingUI.missions)endingUI.missions.textContent=missions+"/10";
    if(endingUI.xp)endingUI.xp.textContent=
      (quest.progress().xp+indoorQuest.progress().xp+academic.progress().xp+
        sports.progress().xp+restaurant.progress().xp+school.progress().xp+
        pool.progress().xp+female.progress().xp+male.progress().xp+church.progress().xp)+" XP";
    if(endingUI.progress)endingUI.progress.textContent=Math.round(missions/10*100)+"%";
    if(endingUI.playtime)endingUI.playtime.textContent=formatPlaytime(playTimeSeconds);
    if(endingUI.records)endingUI.records.textContent=
      "🏅 Ginásio: "+sports.progress().bestLabel+
      "  •  🍽️ Restaurante: "+restaurant.progress().bestLabel+
      "  •  🏊 Piscina: "+pool.progress().bestLabel;
  }
  function openFinalVictory(){
    if(!church.progress().completed||!finalGate.progress().unlocked){
      show("Complete primeiro as dez missões para acessar o encerramento.",5);return false;
    }
    stopChurchCinematic();
    refreshEndingStats();
    if(endingUI.credits)endingUI.credits.classList.add("hidden");
    if(endingUI.toggleCredits)endingUI.toggleCredits.textContent="Ver créditos";
    endingOpen=true;held.clear();
    if(endingUI.root)endingUI.root.classList.remove("hidden");
    persistPlayTime();
    return true;
  }
  function closeFinalVictory(){
    endingOpen=false;
    if(endingUI.root)endingUI.root.classList.add("hidden");
    held.clear();
  }
  function tickChurchCinematic(dt){
    if(!churchCinematicActive)return;
    churchCinematicElapsed+=dt;
    if(cinematicUI.bar)cinematicUI.bar.style.width=
      (Math.min(1,churchCinematicElapsed/4)*100)+"%";
    if(churchCinematicElapsed>=4.1)openFinalVictory();
  }
  const schoolUI={
    hud:document.getElementById("schoolHUD"),
    count:document.getElementById("schoolHUDCount"),
    hint:document.getElementById("schoolHUDHint"),
    bar:document.getElementById("schoolProgressBar"),
    stage:document.getElementById("schoolQuestStage"),
    description:document.getElementById("schoolQuestDescription"),
    mural:document.getElementById("schoolClueMural"),
    livro:document.getElementById("schoolClueLivro"),
    quadro:document.getElementById("schoolClueQuadro"),
    brinquedo:document.getElementById("schoolClueBrinquedo"),
    desenho:document.getElementById("schoolClueDesenho"),
    capsule:document.getElementById("schoolCapsule"),
    achievement:document.getElementById("schoolQuestAchievement")
  };
  const schoolPuzzleUI={
    root:document.getElementById("schoolPuzzle"),
    title:document.getElementById("schoolPuzzleTitle"),
    number:document.getElementById("schoolPuzzleNumber"),
    clue:document.getElementById("schoolPuzzleClue"),
    question:document.getElementById("schoolPuzzleQuestion"),
    feedback:document.getElementById("schoolPuzzleFeedback"),
    close:document.getElementById("schoolPuzzleClose"),
    choices:[...document.querySelectorAll("[data-school-answer]")]
  };
  let schoolPuzzleOpen=null;
  function refreshSchoolUI(){
    const p=school.progress();
    const labels={ready:"DISPONÍVEL",clues:"PROCURANDO PISTAS",
      capsule:"CÁPSULA REVELADA",return:"ENTREGAR TESOURO",completed:"CONCLUÍDA"};
    if(schoolUI.stage)schoolUI.stage.textContent=labels[p.stage];
    if(schoolUI.description)schoolUI.description.textContent=p.objective;
    if(schoolUI.hud)schoolUI.hud.classList.toggle("hidden",!school.active);
    if(schoolUI.count)schoolUI.count.textContent=p.solved+" / 5";
    if(schoolUI.hint)schoolUI.hint.textContent=p.objective;
    if(schoolUI.bar)schoolUI.bar.style.width=(p.solved/p.total*100)+"%";
    for(const c of p.clues){
      const target=schoolUI[c.id];
      if(!target)continue;
      target.textContent=(c.solved?"✓ ":c.active?"🔎 ":"🔒 ")+c.name;
      target.classList.toggle("complete",c.solved);
    }
    if(schoolUI.capsule){
      schoolUI.capsule.textContent=p.hasCapsule?
        "🎁 Cápsula do tempo encontrada":
        p.solved===5?"🎁 Cápsula do tempo revelada":
          "🔒 Cápsula do tempo bloqueada";
      schoolUI.capsule.classList.toggle("complete",p.hasCapsule);
    }
    if(schoolUI.achievement){
      schoolUI.achievement.textContent=p.achievement?
        "🏆 "+p.achievement:"🏆 Conquista bloqueada";
      schoolUI.achievement.classList.toggle("complete",p.completed);
    }
    refreshTotalXP();
  }
  function closeSchoolPuzzle(){
    if(!schoolPuzzleOpen)return;
    schoolPuzzleOpen=null;
    schoolPuzzleUI.root.classList.add("hidden");
    held.clear();
  }
  function openSchoolPuzzle(puzzle){
    if(schoolPuzzleOpen)return;
    schoolPuzzleOpen=puzzle;
    held.clear();school.pause();
    schoolPuzzleUI.title.textContent=puzzle.icon+" "+puzzle.name;
    schoolPuzzleUI.number.textContent=puzzle.number+"/5";
    schoolPuzzleUI.clue.textContent=puzzle.clue;
    schoolPuzzleUI.question.textContent=puzzle.question;
    schoolPuzzleUI.feedback.textContent="Escolha uma das três respostas para revelar a próxima pista.";
    schoolPuzzleUI.choices.forEach((button,index)=>{
      button.textContent=(index+1)+". "+puzzle.choices[index];
    });
    schoolPuzzleUI.root.classList.remove("hidden");
  }
  function answerSchoolPuzzle(index){
    if(!schoolPuzzleOpen)return;
    const result=school.answer(schoolPuzzleOpen.id,index);
    if(result.correct){
      closeSchoolPuzzle();
      refreshSchoolUI();
      show(result.message,7);
    }else if(!result.ignored){
      schoolPuzzleUI.feedback.textContent=result.message;
    }
  }
  const restaurantUI={
    hud:document.getElementById("restaurantHUD"),
    timer:document.getElementById("restaurantTimer"),
    hudOrder:document.getElementById("restaurantHUDOrder"),
    delivered:document.getElementById("restaurantDelivered"),
    hudState:document.getElementById("restaurantHUDState"),
    bar:document.getElementById("restaurantProgressBar"),
    stage:document.getElementById("restaurantQuestStage"),
    description:document.getElementById("restaurantQuestDescription"),
    questOrders:document.getElementById("restaurantQuestOrders"),
    questErrors:document.getElementById("restaurantQuestErrors"),
    best:document.getElementById("restaurantBestTime"),
    achievement:document.getElementById("restaurantQuestAchievement")
  };
  const foodUI={
    root:document.getElementById("restaurantCooking"),
    title:document.getElementById("restaurantCookingTitle"),
    hint:document.getElementById("restaurantCookingHint"),
    customer:document.getElementById("restaurantCookingCustomer"),
    feedback:document.getElementById("restaurantCookingFeedback"),
    count:document.getElementById("restaurantSelectedCount"),
    close:document.getElementById("restaurantCookingClose"),
    prepare:document.getElementById("restaurantPrepare"),
    choices:[...document.querySelectorAll("[data-food-id]")]
  };
  let foodOpen=false;
  let selectedFood=new Set();
  function refreshRestaurantUI(){
    const p=restaurant.progress();
    const names={idle:"DISPONÍVEL",paused:"PAUSADA",running:"EM ANDAMENTO",
      failed:"TEMPO ESGOTADO",finished:"CONCLUÍDA"};
    if(restaurantUI.hud)restaurantUI.hud.classList.toggle("hidden",!restaurant.active);
    if(restaurantUI.stage)restaurantUI.stage.textContent=
      p.completed?"CONCLUÍDA":names[p.stage];
    if(restaurantUI.description)restaurantUI.description.textContent=p.objective;
    if(restaurantUI.questOrders)restaurantUI.questOrders.textContent=
      "🍴 Pedidos entregues: "+p.served+" / "+p.total;
    if(restaurantUI.questErrors)restaurantUI.questErrors.textContent="⚠️ Erros: "+p.errors;
    if(restaurantUI.best)restaurantUI.best.textContent="⏱️ Recorde: "+p.bestLabel;
    if(restaurantUI.achievement){
      restaurantUI.achievement.textContent=p.achievement?"🏆 "+p.achievement:"🏆 Conquista bloqueada";
      restaurantUI.achievement.classList.toggle("complete",p.completed);
    }
    if(restaurantUI.timer)restaurantUI.timer.textContent=
      (p.stage==="finished"?p.elapsed:p.timeLeft).toFixed(1).replace(".",",")+"s";
    if(restaurantUI.hudOrder)restaurantUI.hudOrder.textContent=
      p.order?(p.order.icon+" "+p.order.name+" • "+p.order.customer):"Todos os pedidos concluídos!";
    if(restaurantUI.delivered)restaurantUI.delivered.textContent=p.served+" / 5 pedidos";
    if(restaurantUI.hudState)restaurantUI.hudState.textContent=
      p.stage==="running"?(p.prepared?"Entregue ao estudante":"Prepare na bancada"):
      p.stage==="paused"?"Retome com Clara":p.stage==="failed"?"Tempo esgotado":
      p.stage==="finished"?"Serviço concluído":"Fale com Clara";
    if(restaurantUI.bar)restaurantUI.bar.style.width=(p.served/p.total*100)+"%";
    refreshSchoolUI();
  }
  function refreshFoodChoices(){
    if(foodUI.count)foodUI.count.textContent=selectedFood.size+" de 3 ingredientes";
    foodUI.choices.forEach(btn=>{
      btn.setAttribute("aria-pressed",selectedFood.has(btn.dataset.foodId)?"true":"false");
    });
  }
  function closeFood(){
    if(!foodOpen)return;
    foodOpen=false;
    foodUI.root.classList.add("hidden");
    selectedFood=new Set();
    held.clear();
  }
  function openFood(){
    const p=restaurant.progress();
    if(p.stage!=="running"){show(p.objective,4);return;}
    if(p.prepared){show("O prato já está pronto! Entregue-o ao estudante.",4);return;}
    if(!p.order)return;
    foodOpen=true;
    selectedFood=new Set();
    held.clear();
    restaurant.pause();
    foodUI.title.textContent=p.order.icon+" "+p.order.name;
    foodUI.hint.textContent=p.order.hint+" Selecione exatamente três ingredientes.";
    foodUI.customer.textContent="Pedido de "+p.order.customer+" • Os ingredientes devem combinar com o prato.";
    foodUI.feedback.textContent="O tempo continua correndo durante o preparo!";
    refreshFoodChoices();
    foodUI.root.classList.remove("hidden");
  }
  function selectFood(id){
    if(!foodOpen)return;
    if(selectedFood.has(id))selectedFood.delete(id);
    else if(selectedFood.size>=3){
      foodUI.feedback.textContent="Limite de três ingredientes. Desmarque um para escolher outro.";
      return;
    }else selectedFood.add(id);
    refreshFoodChoices();
  }
  function prepareFood(){
    if(!foodOpen)return;
    const result=restaurant.prepare([...selectedFood]);
    if(result.correct){
      closeFood();
      show(result.message,6);
    }else if(result.kind==="timeout"){
      closeFood();
      show(result.message,6);
    }else if(result.message){
      foodUI.feedback.textContent=result.message;
    }
    refreshRestaurantUI();
  }
  const sportsUI={
    hud:document.getElementById("sportsHUD"),
    hudTimer:document.getElementById("sportsTimer"),
    hudMedals:document.getElementById("sportsMedalCount"),
    hudState:document.getElementById("sportsRaceState"),
    bar:document.getElementById("sportsMedalBar"),
    stage:document.getElementById("sportsQuestStage"),
    description:document.getElementById("sportsQuestDescription"),
    medals:document.getElementById("sportsQuestMedals"),
    best:document.getElementById("sportsBestTime"),
    remaining:document.getElementById("sportsQuestTime"),
    achievement:document.getElementById("sportsAchievement")
  };
  function refreshSportsUI(){
    const p=sports.progress();
    const labels={idle:"DISPONÍVEL",running:"EM ANDAMENTO",
      failed:"TEMPO ESGOTADO",finished:"CONCLUÍDA"};
    if(sportsUI.stage)sportsUI.stage.textContent=p.completed?"CONCLUÍDA":labels[p.stage];
    if(sportsUI.description)sportsUI.description.textContent=p.objective;
    if(sportsUI.medals)sportsUI.medals.textContent="🏅 Medalhas: "+p.medals+" / "+p.medalTotal;
    if(sportsUI.best)sportsUI.best.textContent="⏱️ Recorde: "+p.bestLabel;
    if(sportsUI.remaining)sportsUI.remaining.textContent=
      p.stage==="running"?"⏳ Restante: "+p.timeLeft.toFixed(1).replace(".",",")+"s":
      p.stage==="finished"?"⏱️ Última corrida: "+p.elapsed.toFixed(1).replace(".",",")+"s":
      "⏳ Limite: "+p.timeLimit+" segundos";
    if(sportsUI.achievement){
      sportsUI.achievement.textContent=p.achievement?"🏆 "+p.achievement:"🏆 Conquista bloqueada";
      sportsUI.achievement.classList.toggle("complete",p.completed);
    }
    if(sportsUI.hud)sportsUI.hud.classList.toggle("hidden",!sports.active);
    if(sportsUI.hudTimer)sportsUI.hudTimer.textContent=
      (p.stage==="finished"?p.elapsed:p.timeLeft).toFixed(1).replace(".",",")+"s";
    if(sportsUI.hudMedals)sportsUI.hudMedals.textContent=
      p.medals+" / "+p.medalTotal+" medalhas";
    if(sportsUI.hudState)sportsUI.hudState.textContent=
      p.stage==="running"?"Vá até a chegada!":
      p.stage==="failed"?"Tente novamente":
      p.stage==="finished"?"Circuito concluído":"Fale com Rafael";
    if(sportsUI.bar)sportsUI.bar.style.width=(p.medals/p.medalTotal*100)+"%";
    refreshRestaurantUI();
  }
  const academicUI={
    stage:document.getElementById("academicQuestStage"),
    description:document.getElementById("academicDescription"),
    quadro:document.getElementById("academicStationQuadro"),
    catalogo:document.getElementById("academicStationCatalogo"),
    terminal:document.getElementById("academicStationTerminal"),
    achievement:document.getElementById("academicAchievement")
  };
  const academicQuizUI={
    root:document.getElementById("academicQuiz"),
    title:document.getElementById("academicQuizTitle"),
    question:document.getElementById("academicQuestion"),
    feedback:document.getElementById("academicQuizFeedback"),
    close:document.getElementById("academicQuizClose"),
    options:[...document.querySelectorAll("[data-academic-answer]")]
  };
  let activeAcademicQuiz=null;
  function refreshAcademicUI(){
    const p=academic.progress();
    const labels={ready:"DISPONÍVEL",challenges:"3 DESAFIOS",return:"VOLTAR À PROFESSORA",completed:"CONCLUÍDA"};
    if(academicUI.stage)academicUI.stage.textContent=labels[p.stage];
    if(academicUI.description)academicUI.description.textContent=p.objective;
    for(const st of p.stations){
      const node=academicUI[st.id];
      if(node){
        node.textContent=(st.done?"✓ ":"○ ")+st.name;
        node.classList.toggle("complete",st.done);
      }
    }
    if(academicUI.achievement){
      academicUI.achievement.textContent=p.achievement?"🏆 "+p.achievement:"🏆 Conquista bloqueada";
      academicUI.achievement.classList.toggle("complete",p.completed);
    }
    refreshSportsUI();
  }
  function closeAcademicQuiz(){
    if(!activeAcademicQuiz)return;
    activeAcademicQuiz=null;
    academicQuizUI.root.classList.add("hidden");
    held.clear();
  }
  function openAcademicQuiz(station){
    activeAcademicQuiz=station;
    held.clear();
    academic.pause();
    academicQuizUI.title.textContent="🎓 "+station.name;
    academicQuizUI.question.textContent=station.question;
    academicQuizUI.feedback.textContent="Escolha uma resposta. Você pode usar as teclas 1, 2 e 3.";
    academicQuizUI.options.forEach((button,index)=>{
      button.textContent=(index+1)+". "+station.choices[index];
    });
    academicQuizUI.root.classList.remove("hidden");
  }
  function answerAcademicQuiz(index){
    if(!activeAcademicQuiz)return;
    const result=academic.answer(activeAcademicQuiz.id,index);
    if(result.correct){
      closeAcademicQuiz();
      refreshAcademicUI();
      show(result.message,6);
    }else if(!result.ignored){
      academicQuizUI.feedback.textContent=result.message;
    }
  }
  const indoorQuestUI = {
    stage:document.getElementById("indoorQuestStage"),
    description:document.getElementById("indoorQuestDescription"),
    clueMural:document.getElementById("indoorClueMural"),
    clueQuadro:document.getElementById("indoorClueQuadro"),
    clueEstante:document.getElementById("indoorClueEstante"),
    document:document.getElementById("indoorDocument"),
    achievement:document.getElementById("indoorAchievement")
  };
  const riddleUI = {
    root:document.getElementById("indoorRiddle"),
    feedback:document.getElementById("riddleFeedback"),
    close:document.getElementById("riddleClose")
  };
  let riddleOpen=false;
  function refreshIndoorQuestUI() {
    const progress=indoorQuest.progress();
    if(indoorQuestUI.stage){
      const names={locked:"BLOQUEADA",ready:"NOVA MISSÃO",
        clues:"INVESTIGAR PISTAS",riddle:"RESOLVER ENIGMA",
        document:"BUSCAR DOCUMENTO",return:"ENTREGAR DOCUMENTO",
        completed:"CONCLUÍDA"};
      indoorQuestUI.stage.textContent=names[progress.stage];
    }
    if(indoorQuestUI.description)indoorQuestUI.description.textContent=progress.objective;
    for(const c of progress.clues){
      const dest=indoorQuestUI["clue"+c.id[0].toUpperCase()+c.id.slice(1)];
      if(dest){
        dest.textContent=(c.found?"✓ ":"○ ")+c.name;
        dest.classList.toggle("complete",c.found);
      }
    }
    if(indoorQuestUI.document){
      indoorQuestUI.document.textContent=progress.hasDocument?
        "📄 Documento recuperado":"🔒 Documento não encontrado";
      indoorQuestUI.document.classList.toggle("complete",progress.hasDocument);
    }
    if(indoorQuestUI.achievement){
      indoorQuestUI.achievement.textContent=progress.achievement?
        "🏆 "+progress.achievement:"🏆 Conquista bloqueada";
      indoorQuestUI.achievement.classList.toggle("complete",progress.completed);
    }
    refreshAcademicUI();
  }
  function closeRiddle(){
    if(!riddleOpen)return;
    riddleOpen=false;
    riddleUI.root.classList.add("hidden");
    held.clear();
  }
  function openRiddle(){
    if(riddleOpen)return;
    riddleOpen=true;
    held.clear();
    interior.pause();
    if(riddleUI.feedback)riddleUI.feedback.textContent=
      "Escolha a combinação usando as três pistas na ordem: mural, quadro e estante.";
    riddleUI.root.classList.remove("hidden");
  }
  function answerRiddle(code){
    if(!riddleOpen)return;
    const result=indoorQuest.answer(code);
    if(result.correct){
      closeRiddle();
      refreshIndoorQuestUI();
      show(result.message,6);
    } else if(riddleUI.feedback && !result.ignored){
      riddleUI.feedback.textContent=result.message;
    }
  }
  const questUI = {
    stage: document.getElementById("questStage"),
    description: document.getElementById("questDescription"),
    clueBilhete: document.getElementById("clue-bilhete"),
    cluePegadas: document.getElementById("clue-pegadas"),
    clueCaderno: document.getElementById("clue-caderno"),
    key: document.getElementById("questKey"),
    achievement: document.getElementById("questAchievement"),
    xp: document.getElementById("xpLabel")
  };

  function refreshQuestUI() {
    const q = quest.progress();
    if (questUI.stage) {
      const label = {
        ready:"AGUARDANDO INÍCIO",clues:"INVESTIGAÇÃO",
        key:"ENCONTRAR A CHAVE",return:"DEVOLVER A CHAVE",
        completed:"MISSÃO CONCLUÍDA"
      };
      questUI.stage.textContent = label[q.stage];
    }
    if (questUI.description) questUI.description.textContent = q.objective;
    refreshIndoorQuestUI();
    for (const clue of q.clues) {
      const element = questUI["clue"+clue.id[0].toUpperCase()+clue.id.slice(1)];
      if(!element)continue;
      element.textContent = (clue.done?"✓ ":"○ ")+clue.name;
      element.classList.toggle("complete",clue.done);
    }
    if (questUI.key) {
      questUI.key.textContent = q.hasKey?"🔑 Chave encontrada":"🔒 Chave não encontrada";
      questUI.key.classList.toggle("complete",q.hasKey);
    }
    if (questUI.achievement) {
      questUI.achievement.textContent = q.achievement
        ?"🏆 "+q.achievement : "🏆 Conquista bloqueada";
      questUI.achievement.classList.toggle("complete",q.completed);
    }
  }
  const dialogueUI = {
    root: document.getElementById("npcDialogue"),
    name: document.getElementById("npcName"),
    role: document.getElementById("npcRole"),
    line: document.getElementById("npcLine"),
    portrait: document.getElementById("npcPortrait"),
    next: document.getElementById("dialogNext"),
    close: document.getElementById("dialogClose")
  };

  // Projeção 2,5D: x representa posição horizontal e y a profundidade.
  // A projeção anterior em losango invertia os setores esquerdo/direito.
  function iso(x, y, z = 0) {
    return {
      x: x * TW * .73 - y * TW * .12,
      y: x * TH * .18 + y * TH * .82 - z
    };
  }

  function P(x, y, z = 0) {
    return iso(x, y, z);
  }

  function polygon(points, color, stroke = null) {
    ctx.beginPath();

    points.forEach((p, i) => {
      if (i === 0) {
        ctx.moveTo(p.x, p.y);
      } else {
        ctx.lineTo(p.x, p.y);
      }
    });

    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  function ellipse(x, y, rx, ry, color) {
    ctx.beginPath();
    ctx.ellipse(
      x, y,
      Math.max(1, rx),
      Math.max(1, ry),
      0, 0, Math.PI * 2
    );
    ctx.fillStyle = color;
    ctx.fill();
  }

  function line(a, b, color, width) {
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
  }

  function tile(x, y, color) {
    polygon([P(x,y),P(x+1,y),P(x+1,y+1),P(x,y+1)],color);
  }

  function seeded(n) {
    const v = Math.sin(n * 78.233 + 4.32) * 43758.5453;
    return v - Math.floor(v);
  }

  function inside(x, y, s, pad = 0) {
    return (
      x >= s.x - pad &&
      x <= s.x + s.w + pad &&
      y >= s.y - pad &&
      y <= s.y + s.h + pad
    );
  }

  function roadNear(x, y) {
    for (const road of roads) {
      for (let i = 0; i < road.length - 1; i++) {
        const a = road[i];
        const b = road[i + 1];

        const vx = b[0] - a[0];
        const vy = b[1] - a[1];

        const lengthSquared = vx * vx + vy * vy;

        if (lengthSquared === 0) continue;

        const t = Math.max(
          0,
          Math.min(
            1,
            ((x - a[0]) * vx + (y - a[1]) * vy) / lengthSquared
          )
        );

        const px = a[0] + t * vx;
        const py = a[1] + t * vy;

        if (Math.hypot(x - px, y - py) < 1.25) {
          return true;
        }
      }
    }

    return false;
  }


  // A mata é mais densa ao redor do campus, sem tampar o centro e os caminhos.
  const trees = [];
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const noise = seeded(x * 23 + y * 79);
      const perimeter = x < 4 || x > W-5 || y < 6 || y > H-6;
      const occupied = sites.some(s => inside(x, y, s, perimeter ? 1 : 2.1));
      if (occupied || roadNear(x, y)) continue;
      if (noise > (perimeter ? 0.63 : 0.93)) {
        trees.push({
          x: x + 0.15 + seeded(x * 17 + y) * .35,
          y: y + 0.15 + seeded(y * 13 + x) * .35,
          size: .72 + seeded(x * 41 + y * 13) * .54,
          flowering: noise > .981,
          seed: x * 33 + y * 19
        });
      }
    }
  }

  const palms = [
    {x:12.3,y:25.6},{x:24.4,y:27.9},{x:12.1,y:33.4},
    {x:24.7,y:35.2},{x:13.1,y:17},{x:22.6,y:17.5},
    {x:10.5,y:37.3},{x:27,y:23},{x:9.5,y:22.6}
  ];

  function ground() {
    // Diferentes tons de grama criam volume, mesmo sem texturas externas.
    const colors = ["#7ea85d","#80af62","#8fba68","#75a95b","#97bb6c"];
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const n = seeded(x * 7 + y * 47);
        const color = colors[Math.min(colors.length-1,Math.floor(n*colors.length))];
        tile(x, y, color);
        if (n > .89) {
          const p=P(x+.36,y+.36);
          line({x:p.x-3,y:p.y},{x:p.x-1,y:p.y-4},"#65984d",1);
          line({x:p.x+2,y:p.y},{x:p.x+1,y:p.y-3},"#b0d17b",1);
        }
      }
    }
    // Margem arborizada do perímetro.
    line(P(0,H),P(W,H),"#6a995b",7);
  }

  function drawRoads() {
    // Três camadas fazem as calçadas parecerem lajes em vez de traços planos.
    for (const road of roads) {
      for (let i=0; i<road.length-1; i++) {
        const a=P(...road[i]), b=P(...road[i+1]);
        line({x:a.x+2,y:a.y+3},{x:b.x+2,y:b.y+3},"#33594355",36);
        line(a,b,"#829b79",32);
        line(a,b,"#f7e5ba",27);
        line(a,b,"#d8bfa0",24);
        line(a,b,"#e9d6b4",20);
        // Riscos regulares imitam divisões de pedra/piso.
        const dx=b.x-a.x,dy=b.y-a.y, len=Math.hypot(dx,dy);
        const nx=-dy/(len||1),ny=dx/(len||1);
        for(let t=11; t<len-5; t+=13) {
          const px=a.x+dx*t/len,py=a.y+dy*t/len;
          line({x:px+nx*7,y:py+ny*7},{x:px-nx*7,y:py-ny*7},
            "#b9997a55",1);
        }
      }
    }
    // Rodovia PA-391 ao sul do portão.
    const yRoad=P(18,45).y;
    const start=P(-4,45).x, end=P(48,45).x;
    line({x:start,y:yRoad},{x:end,y:yRoad},"#34454b",64);
    line({x:start,y:yRoad},{x:end,y:yRoad},"#d7d9c8",57);
    line({x:start,y:yRoad},{x:end,y:yRoad},"#65717b",51);
    line({x:start,y:yRoad-21},{x:end,y:yRoad-21},"#eee7b9",1.6);
    line({x:start,y:yRoad+21},{x:end,y:yRoad+21},"#eee7b9",1.6);
    for(let x=start+18;x<end-18;x+=58) {
      line({x,y:yRoad},{x:x+28,y:yRoad},"#f4da87",3);
    }
  }

  function garden(x,y,r=1) {
    const p=P(x,y);
    ellipse(p.x+2,p.y+4,18*r,7*r,"#315f3b66");
    ellipse(p.x,p.y,18*r,8*r,"#f8dfa7");
    ellipse(p.x,p.y-2,15*r,6*r,"#418c50");
    for(let i=0;i<11;i++){
      const n=seeded(i*33+x*9+y*13),a=i*Math.PI*2/11;
      const xx=p.x+Math.cos(a)*12*r*n;
      const yy=p.y-2+Math.sin(a)*4*r*n;
      ellipse(xx,yy,2.5*r,1.8*r,
        i%3===0?"#f9f5b6":i%3===1?"#f7a2c5":"#f5c66e");
      ellipse(xx-.7,yy-.8,.65*r,.65*r,"#fff6df");
    }
  }

  function plazaPaving(x1,y1,x2,y2) {
    polygon([P(x1,y1),P(x2,y1),P(x2,y2),P(x1,y2)],"#f0d7b1","#bb9975");
    for(let y=y1+.6;y<y2;y+=.95){
      line(P(x1+.15,y),P(x2-.15,y),"#cda88577",.9);
    }
    for(let x=x1+.5;x<x2;x+=1.35){
      line(P(x,y1+.2),P(x,y2-.2),"#cda88550",.8);
    }
  }

  function plazas() {
    // Praça central e caminhos de entrada; sem mudar os edifícios.
    plazaPaving(14.7,29.2,23.3,36.1);
    garden(13.7,30.2,1.1);
    garden(24.4,30.1,1.1);
    garden(14.4,34.8,.95);
    garden(23.6,34.6,.95);
    garden(12.1,24.1,.85);
    garden(25.3,24.4,.95);
    garden(10.6,19.9,.9);
  }


  function building(b) {
    if (b.type === "pool") {
      drawPool(b);
      drawSiteLabel(b);
      return;
    }
    if (b.type === "sports") {
      drawSports(b);
      drawSiteLabel(b);
      return;
    }

    const footprint = P(b.x + b.w / 2, b.y + b.h / 2);
    ellipse(footprint.x + 9, footprint.y + 11,
      b.w * TW * 0.48, b.h * TH * 0.50, "#163c3440");
    const A = P(b.x, b.y);
    const B = P(b.x + b.w, b.y);
    const C = P(b.x + b.w, b.y + b.h);
    const D = P(b.x, b.y + b.h);
    const z = b.z;

    polygon([
      A, D,
      { x: D.x, y: D.y - z },
      { x: A.x, y: A.y - z }
    ], b.wall);

    polygon([
      D, C,
      { x: C.x, y: C.y - z },
      { x: D.x, y: D.y - z }
    ], b.side);

    polygon([
      A, B,
      { x: B.x, y: B.y - z },
      { x: A.x, y: A.y - z }
    ], b.wall);

    polygon([
      B, C,
      { x: C.x, y: C.y - z },
      { x: B.x, y: B.y - z }
    ], b.side);

    polygon(
      [A, B, C, D].map(p => ({
        x: p.x,
        y: p.y - z
      })),
      b.roof,
      "#315c4b"
    );

    const roofA = P(b.x + 0.3, b.y + 0.3, z + 5);
    const roofB = P(b.x + b.w - 0.3, b.y + 0.3, z + 5);
    const roofC = P(b.x + b.w - 0.3, b.y + b.h - 0.3, z + 5);
    const roofD = P(b.x + 0.3, b.y + b.h - 0.3, z + 5);

    polygon(
      [roofA, roofB, roofC, roofD],
      b.type === "church" ? "#b8673c" :
      b.type === "central" ? "#1e817a" :
      b.roof
    );

    // Janelas das fachadas
    for (let i = 1; i < b.w; i++) {
      const t = i / b.w;
      const x = A.x + (B.x - A.x) * t;
      const y = A.y + (B.y - A.y) * t - z + 24;

      polygon([
        { x: x - 7, y: y - 8 },
        { x: x + 7, y: y - 1 },
        { x: x + 7, y: y + 11 },
        { x: x - 7, y: y + 4 }
      ], b.type === "central"
        ? (i % 2 ? "#274a82" : "#9cdbd9")
        : "#8fc2c3");
    }

    for (let i = 1; i < b.h; i++) {
      const t = i / b.h;
      const x = D.x + (C.x - D.x) * t;
      const y = D.y + (C.y - D.y) * t - z + 24;

      polygon([
        { x: x - 7, y: y - 1 },
        { x: x + 7, y: y - 8 },
        { x: x + 7, y: y + 4 },
        { x: x - 7, y: y + 11 }
      ], b.type === "central" ? "#243f79" : "#94c2bd");
    }

    buildingDetails(b, A, B, C, D, z);

    if (b.type === "central") {
      const p = P(
        b.x + b.w * 0.58,
        b.y + b.h,
        z - 5
      );

      polygon([
        { x: p.x - 17, y: p.y - 18 },
        { x: p.x + 16, y: p.y - 2 },
        { x: p.x + 16, y: p.y + 20 },
        { x: p.x - 17, y: p.y + 4 }
      ], "#e88938");
    }

    if (b.type === "pool") {
      const p = P(
        b.x + b.w / 2,
        b.y + b.h / 2,
        z + 8
      );

      ellipse(p.x, p.y, b.w * TW * 0.32, b.h * TH * 0.3, "#f2f5ed");
      ellipse(p.x, p.y - 2, b.w * TW * 0.28, b.h * TH * 0.24, "#3faed2");

      for (let i = -2; i <= 2; i++) {
        line(
          { x: p.x - 25, y: p.y + i * 4 },
          { x: p.x + 25, y: p.y + i * 4 },
          "#9de8ed",
          1
        );
      }
    }

    if (b.type === "sports") {
      const p = P(
        b.x + b.w / 2,
        b.y + b.h / 2,
        z + 6
      );

      ellipse(p.x, p.y, 38, 17, "#2d91a4");

      line(
        { x: p.x - 35, y: p.y },
        { x: p.x + 35, y: p.y },
        "#d4f2e8",
        2
      );
    }

    if (b.type === "church") {
      const p = P(
        b.x + b.w / 2,
        b.y + b.h / 2,
        z + 20
      );

      line(
        { x: p.x, y: p.y - 20 },
        { x: p.x, y: p.y + 4 },
        "#f4e2ba",
        4
      );

      line(
        { x: p.x - 9, y: p.y - 11 },
        { x: p.x + 9, y: p.y - 11 },
        "#f4e2ba",
        4
      );
    }

    architecturalFinish(b);
    drawSiteLabel(b);
    if(b.type==="church")drawChurchFinalBadge(b);
  }

  // Selo visual: sem mudar o mapa, a Igreja é o último capítulo.
  function drawChurchFinalBadge(b){
    const status=finalGate.progress();
    const p=P(b.x+b.w/2,b.y+b.h/2,b.z+62);
    const title=status.unlocked?"🔓 FASE FINAL":"🔒 ÚLTIMA FASE";
    const line2=status.unlocked?"LIBERADA":status.done+"/"+status.total+" MISSÕES";
    ctx.save();
    ctx.shadowColor="#0c2537aa";
    ctx.shadowBlur=12;
    ctx.fillStyle=status.unlocked?"#1f6457ee":"#273748ef";
    ctx.strokeStyle=status.unlocked?"#bfe4ba":"#e7c17d";
    ctx.lineWidth=2;
    ctx.beginPath();
    ctx.roundRect(p.x-73,p.y-66,146,44,9);
    ctx.fill();ctx.shadowBlur=0;ctx.stroke();
    ctx.textAlign="center";
    ctx.fillStyle="#fff2d4";
    ctx.font="bold 12px Arial,sans-serif";
    ctx.fillText(title,p.x,p.y-48);
    ctx.fillStyle="#f7d894";
    ctx.font="bold 10px Arial,sans-serif";
    ctx.fillText(line2,p.x,p.y-32);
    ctx.restore();
  }


  // Texto com fundo de alto contraste, reutilizado por todas as estruturas.
  function drawSiteLabel(b) {
    const center = P(
      b.x + b.w / 2,
      b.y + b.h / 2,
      b.z + 30
    );

    ctx.save();
    ctx.font = "bold 13px 'DM Sans', Arial, sans-serif";
    ctx.textAlign = "center";
    const label = b.short || b.name;
    const labelWidth = ctx.measureText(label).width + 24;
    ctx.shadowColor = "#0a221dc2";
    ctx.shadowBlur = 12;
    ctx.fillStyle = "#112a30e8";
    ctx.strokeStyle = "#e8c272";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(center.x - labelWidth/2, center.y-20, labelWidth, 26, 8);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.stroke();
    ctx.fillStyle = "#fff6de";
    ctx.fillText(label, center.x, center.y-2);
    ctx.restore();
  }

  function drawPool(b) {
    // Piscina ao ar livre: deck claro, água translúcida e raias.
    const margin=.27;
    const corners=[
      P(b.x,b.y),P(b.x+b.w,b.y),
      P(b.x+b.w,b.y+b.h),P(b.x,b.y+b.h)
    ];
    polygon(corners,"#b9c7b3","#e6dfb9");
    polygon([
      P(b.x+margin,b.y+margin),P(b.x+b.w-margin,b.y+margin),
      P(b.x+b.w-margin,b.y+b.h-margin),P(b.x+margin,b.y+b.h-margin)
    ],"#eff1dc","#799f93");
    polygon([
      P(b.x+.55,b.y+.52),P(b.x+b.w-.55,b.y+.52),
      P(b.x+b.w-.55,b.y+b.h-.52),P(b.x+.55,b.y+b.h-.52)
    ],"#2b9dcd","#b4ebf6");
    for(let i=1;i<=3;i++) {
      const t=i/4;
      line(P(b.x+.65,b.y+.52+(b.h-1.04)*t),
        P(b.x+b.w-.65,b.y+.52+(b.h-1.04)*t),"#dcfaffb5",1.8);
    }
    for(let i=0;i<11;i++) {
      const x=b.x+.65+seeded(i*5)* (b.w-1.3);
      const y=b.y+.64+seeded(i*8+4)*(b.h-1.25);
      const p=P(x,y);
      const shimmer=Math.sin(time*2.2+i)*2;
      line({x:p.x-5,y:p.y+shimmer},{x:p.x+6,y:p.y+shimmer},
        "#d5f5f4a0",1.3);
    }
    // Guarda-sóis e espreguiçadeiras afastados da água.
    for(const [x,y] of [[b.x+.32,b.y+.32],[b.x+b.w-.35,b.y+b.h-.3]]) {
      const p=P(x,y);
      ellipse(p.x+2,p.y+2,9,3,"#1f5f6177");
      line(p,{x:p.x,y:p.y-20},"#f0ead1",2);
      polygon([{x:p.x-13,y:p.y-17},{x:p.x,y:p.y-26},
        {x:p.x+13,y:p.y-17}],"#fff7d9","#e4b866");
      line({x:p.x-6,y:p.y+1},{x:p.x+7,y:p.y+1},"#e9e2cb",4);
    }
  }

  function drawSports(b) {
    const A=P(b.x,b.y),B=P(b.x+b.w,b.y),
          C=P(b.x+b.w,b.y+b.h),D=P(b.x,b.y+b.h);
    ellipse(P(b.x+b.w/2,b.y+b.h/2).x+7,
      P(b.x+b.w/2,b.y+b.h/2).y+9,b.w*TW*.47,14,"#26494555");
    polygon([A,B,C,D],"#3b9f92","#daf2de");
    const inner=[
      P(b.x+.25,b.y+.28),P(b.x+b.w-.25,b.y+.28),
      P(b.x+b.w-.25,b.y+b.h-.28),P(b.x+.25,b.y+b.h-.28)
    ];
    polygon(inner,"#2e86b9","#f7f1dc");
    line(P(b.x+.2,b.y+b.h/2),P(b.x+b.w-.2,b.y+b.h/2),
      "#e9f3e8",2.3);
    for(const x of [b.x+.2,b.x+b.w-.2]) {
      line(P(x,b.y+.3),P(x,b.y+b.h-.3),"#eaf9f2",1.5);
    }
    // Pilares metálicos azuis sustentam o telhado em arco.
    for(const [x,y] of [[b.x,b.y],[b.x+b.w,b.y],
                        [b.x,b.y+b.h],[b.x+b.w,b.y+b.h]]) {
      const p=P(x,y);
      line(p,{x:p.x,y:p.y-66},"#2263ac",6);
      ellipse(p.x,p.y,3,2,"#e6f7ff");
    }
    const frontLeft=P(b.x,b.y+b.h),frontRight=P(b.x+b.w,b.y+b.h);
    const backLeft=P(b.x,b.y),backRight=P(b.x+b.w,b.y);
    const lift=61;
    const roof=[
      {x:backLeft.x,y:backLeft.y-lift},
      {x:backRight.x,y:backRight.y-lift},
      {x:frontRight.x,y:frontRight.y-lift},
      {x:frontLeft.x,y:frontLeft.y-lift}
    ];
    polygon(roof,"#efe8cb","#296bac");
    const left={x:frontLeft.x,y:frontLeft.y-15},
          right={x:frontRight.x,y:frontRight.y-15};
    ctx.beginPath();
    ctx.moveTo(left.x,left.y);
    ctx.quadraticCurveTo((left.x+right.x)/2,
      Math.min(left.y,right.y)-135,right.x,right.y);
    ctx.lineTo(right.x,right.y-15);
    ctx.quadraticCurveTo((left.x+right.x)/2,
      Math.min(left.y,right.y)-155,left.x,left.y-15);
    ctx.closePath();
    ctx.fillStyle="#f0e5c5";
    ctx.fill();
    ctx.strokeStyle="#2772b5";
    ctx.lineWidth=5;ctx.stroke();
    for(let i=1;i<5;i++) {
      const t=i/5;
      const x=left.x+(right.x-left.x)*t;
      const y=left.y+(right.y-left.y)*t
        - 4*135*t*(1-t);
      line({x,y:y-17},{x,y:y+2},"#3170af",2);
    }
  }

  function architecturalFinish(b) {
    // Pisos, portas e linhas de telhado na fachada frontal.
    const front = (t,h=0)=>P(b.x+b.w*t,b.y+b.h,h);
    const frontA=front(0),frontB=front(1);
    if(b.type==="church") {
      line(front(0,b.z),front(1,b.z),"#a34b2d",5);
      for(let i=1;i<7;i++) {
        const t=i/7;
        line(front(t,b.z+3),front(t+.04,b.z+7),"#e09d62",2);
      }
    } else {
      line(front(0,b.z),front(1,b.z),
        b.type==="central"?"#287eb2":"#dbe5d0",6);
      line(front(0,b.z+2),front(1,b.z+2),"#a2c7bf",2);
    }
    const levels=b.z>55?[.67,.33]:[.57];
    for(const level of levels) {
      for(let i=1;i<=Math.max(2,Math.floor(b.w));i++){
        const t=i/(Math.max(2,Math.floor(b.w))+1);
        if(Math.abs(t-.5)<.14 && level<.5)continue;
        const p=front(t,b.z*level);
        ctx.fillStyle="#173e5c";
        ctx.fillRect(p.x-6,p.y-9,13,15);
        ctx.fillStyle=i%2?"#77bfd2":"#88c4d5";
        ctx.fillRect(p.x-4,p.y-7,9,10);
        line({x:p.x,y:p.y-7},{x:p.x,y:p.y+3},
          "#e2f4e7",1);
        line({x:p.x-6,y:p.y+7},{x:p.x+7,y:p.y+7},
          "#e7dfc7",2.4);
      }
    }
    const door=front(.5);
    const doorColor=b.type==="restaurant"?"#314f59":"#1f5b6f";
    ctx.fillStyle="#293e3d77";
    ctx.fillRect(door.x-16,door.y-34,35,36);
    ctx.fillStyle=doorColor;
    ctx.fillRect(door.x-14,door.y-34,30,31);
    ctx.fillStyle="#8ecbd4";
    ctx.fillRect(door.x-11,door.y-30,24,23);
    line({x:door.x+2,y:door.y-30},
      {x:door.x+2,y:door.y-7},"#d2e9e8",1.6);
    ellipse(door.x+5,door.y-14,1.7,1.7,"#fff5cc");
    line({x:door.x-19,y:door.y+1},
      {x:door.x+20,y:door.y+1},"#dcd2b9",4);
    if(b.type==="central"){
      ctx.beginPath();
      ctx.moveTo(door.x-30,door.y-35);
      ctx.quadraticCurveTo(door.x+1,door.y-68,door.x+33,door.y-35);
      ctx.strokeStyle="#e27c2f";ctx.lineWidth=11;ctx.stroke();
      ctx.strokeStyle="#306eaa";ctx.lineWidth=5;ctx.stroke();
    }
    if(b.type==="female") {
      // Grande pórtico avermelhado na entrada envidraçada.
      const left=front(.1,b.z-.5),right=front(.9,b.z-.5);
      line(left,right,"#d44a56",7);
    }
  }

  // Fachadas inspiradas nas fotos do usuário, desenhadas em faces isométricas.
  function buildingDetails(b, A, B, C, D, z) {
    const wallAB = (t, depth) => ({
      x: A.x + (B.x - A.x) * t,
      y: A.y + (B.y - A.y) * t - z + depth
    });
    const wallBC = (t, depth) => ({
      x: B.x + (C.x - B.x) * t,
      y: B.y + (C.y - B.y) * t - z + depth
    });

    // Frisos de pavimentos e iluminação nas fachadas.
    if (z > 40) {
      const a = wallAB(0, z * .55);
      const bEnd = wallAB(1, z * .55);
      line(a, bEnd,
        b.type === "male" ? "#6656bb" :
        b.type === "central" ? "#134ca5" : "#ccd8d1", 6);
      line(wallBC(0, z * .55), wallBC(1, z * .55), "#527c81", 3);
      for (const depth of [z*.69, z*.86]) {
        for (let i=1; i<Math.max(3, b.w); i++) {
          const p = wallAB(i / Math.max(3,b.w), depth);
          polygon([
            {x:p.x-7,y:p.y-9},{x:p.x+6,y:p.y-2},
            {x:p.x+6,y:p.y+5},{x:p.x-7,y:p.y-2}
          ], "#315d77", "#e0ece6");
        }
      }
    }

    if (b.type === "female") {
      // Vidraça panorâmica com moldura vermelha.
      const frame = [wallAB(.05,8),wallAB(.95,8),
        wallAB(.95,z-12),wallAB(.05,z-12)];
      polygon(frame, "#79bbce", "#d83043");
      line(wallAB(.05,8), wallAB(.95,8), "#cf293f", 8);
      line(wallAB(.05,z-12), wallAB(.95,z-12), "#cf293f", 8);
      for (let k=1;k<7;k++) {
        line(wallAB(k/7,10), wallAB(k/7,z-14), "#dff6ffab", 2);
      }
      line(wallAB(.06,z*.51),wallAB(.94,z*.51),"#e8f6f1aa",2);
    }

    if (b.type === "male") {
      line(wallAB(0,z*.47),wallAB(1,z*.47),"#6c4bba",8);
      line(wallBC(0,z*.47),wallBC(1,z*.47),"#594ba8",6);
      line(wallAB(0,z*.19),wallAB(1,z*.19),"#37a486",6);
      // Coluna principal da entrada, inspirada na foto.
      const p = wallAB(.52,z-8);
      line({x:p.x-3,y:p.y-35},{x:p.x-3,y:p.y+5},"#72aaa0",9);
    }

    if (b.type === "school") {
      const l=wallAB(0,15), r=wallAB(1,15);
      line(l,r,"#236acc",12);
      line(wallAB(0,22),wallAB(1,22),"#b7d9e1",3);
      const p=wallAB(.72,z-5);
      ctx.fillStyle="#e4a24a";
      ctx.fillRect(p.x-10,p.y-17,20,16);
    }

    if (b.type === "restaurant") {
      const l=wallAB(.15,25), r=wallAB(.85,25);
      line(l,r,"#31393f",18);
      const p=wallAB(.5,22);
      ctx.font="bold 10px Arial";
      ctx.textAlign="center";
      ctx.fillStyle="#fff8db";
      ctx.fillText("RESTAURANTE",p.x,p.y+3);
    }

    if (b.type === "academic") {
      line(wallAB(0,z*.5),wallAB(1,z*.5),"#63819a",6);
      line(wallBC(0,z*.5),wallBC(1,z*.5),"#7298a4",5);
    }

    if (b.type === "sports") {
      // Cobertura curvada com arcos azuis.
      const center=P(b.x+b.w/2,b.y+b.h/2,z+22);
      ctx.save();
      ctx.strokeStyle="#1c68c1";
      ctx.lineWidth=6;
      ctx.beginPath();
      ctx.moveTo(center.x-75,center.y+30);
      ctx.quadraticCurveTo(center.x,center.y-62,center.x+75,center.y+30);
      ctx.stroke();
      ctx.strokeStyle="#e9e0c6";
      ctx.lineWidth=4;
      ctx.beginPath();
      ctx.moveTo(center.x-65,center.y+22);
      ctx.quadraticCurveTo(center.x,center.y-47,center.x+65,center.y+22);
      ctx.stroke();
      ctx.restore();
    }

    if (b.type === "central") {
      // Marquise laranja e azul e sinalização brilhante da missão.
      const door=wallAB(.52,z-4);
      line({x:door.x-21,y:door.y-22},{x:door.x+21,y:door.y-2},
           "#f29035",12);
      const mark=P(b.x+b.w/2,b.y+b.h+1);
      const pulse=1 + Math.sin(time*3)*.14;
      ellipse(mark.x,mark.y,15*pulse,6*pulse,"#ffd65c55");
      ellipse(mark.x,mark.y,8*pulse,3*pulse,"#ffe082");
      ctx.font="bold 20px Arial";
      ctx.textAlign="center";
      ctx.fillStyle="#ffca48";
      ctx.fillText("!",mark.x,mark.y-15-Math.sin(time*3)*3);
    }
  }


  function tree(t) {
    const p=P(t.x,t.y), sz=t.size;
    const seed=t.seed || 13;
    // Copas em grupos arredondados para substituir as árvores geométricas.
    ellipse(p.x+10*sz,p.y+5*sz,23*sz,8*sz,"#234d3559");
    line({x:p.x,y:p.y},{x:p.x-3*sz,y:p.y-35*sz},"#6d5039",8*sz);
    line({x:p.x-2*sz,y:p.y-24*sz},
      {x:p.x-15*sz,y:p.y-41*sz},"#786147",3*sz);
    const baseColors=t.flowering
      ? ["#a94481","#d65d9c","#e385b0","#f7acd3"]
      : ["#226441","#2e7e48","#4b9751","#7db85e"];
    const clumps=[
      [-22,-45,15],[-10,-59,18],[12,-60,18],[25,-46,16],
      [0,-43,23],[-28,-32,12],[27,-32,12],[0,-70,15]
    ];
    clumps.forEach(([dx,dy,r],i)=>{
      const ox=(seeded(seed+i*3)-.5)*6;
      const oy=(seeded(seed+i*7)-.5)*5;
      ellipse(p.x+(dx+ox)*sz,p.y+(dy+oy)*sz,r*sz,r*.78*sz,
        baseColors[i%baseColors.length]);
      ellipse(p.x+(dx+ox-5)*sz,p.y+(dy+oy-5)*sz,
        r*.45*sz,r*.28*sz,t.flowering?"#ffbfdf55":"#b6d87e72");
    });
    for(let i=0;i<8;i++){
      const a=seeded(seed+i*13)*Math.PI*2;
      const rad=seeded(seed+i*17)*24*sz;
      ellipse(p.x+Math.cos(a)*rad,p.y-49*sz+Math.sin(a)*rad*.8,
        2.2*sz,1.5*sz,t.flowering?"#fff0d3":"#b4d17a");
    }
  }

  function palm(t) {
    const p=P(t.x,t.y);
    ellipse(p.x+5,p.y+3,13,4,"#244b3555");
    ctx.beginPath();
    ctx.moveTo(p.x,p.y);
    ctx.quadraticCurveTo(p.x-10,p.y-26,p.x+2,p.y-64);
    ctx.strokeStyle="#936f48";
    ctx.lineWidth=7;
    ctx.stroke();
    for(let i=0;i<6;i++){
      const a=i*Math.PI/3 + .2;
      const ox=Math.cos(a)*32, oy=Math.sin(a)*15;
      const start={x:p.x+2,y:p.y-64};
      const tip={x:start.x+ox,y:start.y+oy+8};
      ctx.beginPath();
      ctx.moveTo(start.x,start.y);
      ctx.quadraticCurveTo(start.x+ox*.5,start.y+oy-13,tip.x,tip.y);
      ctx.quadraticCurveTo(start.x+ox*.48+5,start.y+oy-3,start.x,start.y+2);
      ctx.fillStyle=i%2?"#327c42":"#58a44f";
      ctx.fill();
      line(start,{x:start.x+ox*.68,y:start.y+oy*.5},
        "#91c975",1.3);
    }
    ellipse(p.x+2,p.y-65,4,4,"#a58d47");
  }


  function character() {
    const p=P(player.x,player.y);
    const step=player.moving ? Math.sin(player.walk) : 0;
    const bob=player.moving ? Math.abs(Math.sin(player.walk))*2 : 0;
    const side=player.facing==="left" ? -1 : 1;
    ellipse(p.x+3,p.y+3,13,5,"#10282077");

    ctx.save();
    ctx.translate(p.x,p.y-bob);
    ctx.scale(side,1);
    ctx.lineCap="round";
    ctx.lineJoin="round";

    // Pernas com deslocamento alternado e tênis brancos.
    const leg=(x, swing)=>{
      ctx.strokeStyle="#273c66";
      ctx.lineWidth=7;
      ctx.beginPath();
      ctx.moveTo(x,-13);
      ctx.lineTo(x+swing,-3);
      ctx.stroke();
      ctx.strokeStyle="#f2dfc4";
      ctx.lineWidth=5;
      ctx.beginPath();
      ctx.moveTo(x+swing-2,-2);
      ctx.lineTo(x+swing+6,-2);
      ctx.stroke();
    };
    leg(-5,step*5);
    leg(5,-step*5);

    // Mochila, braços e uniforme.
    ctx.fillStyle="#1f394d";
    ctx.beginPath();
    ctx.roundRect(-15,-34,11,24,4); ctx.fill();
    ctx.strokeStyle="#dca96f";
    ctx.lineWidth=6;
    for (const arm of [-1,1]) {
      ctx.beginPath();
      ctx.moveTo(arm*10,-30);
      ctx.lineTo(arm*(12+step*3),-17+arm*step*3);
      ctx.stroke();
    }
    const shirt=ctx.createLinearGradient(-12,-36,11,-13);
    shirt.addColorStop(0,"#f6faf4");
    shirt.addColorStop(1,"#b6d5df");
    ctx.fillStyle=shirt;
    ctx.strokeStyle="#2c5975";
    ctx.lineWidth=2;
    ctx.beginPath();
    ctx.roundRect(-12,-36,24,24,7);ctx.fill();ctx.stroke();
    ctx.fillStyle="#326eac";
    ctx.fillRect(-4,-26,8,3);
    ctx.fillStyle="#233d60";
    ctx.fillRect(-11,-15,22,4);

    // Pescoço e rosto em estilo RPG (em vez de blocos retangulares).
    ctx.fillStyle="#d89c6d";
    ctx.fillRect(-4,-43,8,9);
    ellipse(0,-49,13,15,"#b46e47");
    ellipse(0,-50,12,14,"#e4a67a");
    ellipse(-12,-50,3,4,"#d59268");
    ellipse(12,-50,3,4,"#d59268");
    for (const [x,y,r] of [[-10,-61,6],[-4,-65,7],[4,-64,7],[10,-60,6],[-13,-57,4]]) {
      ellipse(x,y,r,r*.8,"#3e2a28");
    }
    if(player.facing!=="up") {
      ellipse(-4,-50,1.6,2.1,"#202d35");
      ellipse(5,-50,1.6,2.1,"#202d35");
      line({x:-2,y:-43},{x:3,y:-43},"#995943",1.5);
      ellipse(-8,-46,3,1.5,"#ed917844");
    }
    ctx.restore();
  }


  // Detalhes das praças renderizados sob prédios e personagens.
  function campusDecor() {
    for(let y=2;y<H-2;y+=2.3){
      for(let x=2;x<W-2;x+=2.6){
        const n=seeded(x*83+y*37);
        if(n<.60 || roadNear(x,y) ||
           sites.some(b=>inside(x,y,b,1)))continue;
        const p=P(x,y);
        line({x:p.x,y:p.y},{x:p.x-2,y:p.y-5},"#417d48",1.3);
        line({x:p.x+3,y:p.y},{x:p.x+4,y:p.y-4},"#699f51",1.2);
        if(n>.83) {
          ellipse(p.x-3,p.y-6,2.5,2,n>.93?"#ec95b8":"#f8dc8f");
          ellipse(p.x+2,p.y-5,2,1.6,"#fff3d1");
        }
      }
    }

    const lamps=[
      [13.5,36.5],[24.7,36.5],[13.4,29.1],[24.5,29.1],
      [11.9,21],[26.8,21],[10.4,16],[26,17]
    ];
    for (const [x,y] of lamps) {
      const p=P(x,y);
      ellipse(p.x+4,p.y+4,7,3,"#172f3359");
      line(p,{x:p.x,y:p.y-31},"#3f5d56",3.7);
      ellipse(p.x,p.y-32,7,6,"#ffdb7566");
      ellipse(p.x,p.y-33,4,4,"#fff1a8");
      line({x:p.x-4,y:p.y-36},{x:p.x+4,y:p.y-36},"#273e43",2);
    }

    const benches=[[12.3,33],[25.5,33.2],[13.1,26],[24.9,26],[9.5,36.1]];
    benches.forEach(([x,y])=>{
      const p=P(x,y);
      ellipse(p.x+4,p.y+6,18,4,"#26443355");
      line({x:p.x-12,y:p.y-8},{x:p.x+12,y:p.y-8},"#7d5239",6);
      line({x:p.x-12,y:p.y-1},{x:p.x+12,y:p.y-1},"#c89257",6);
      line({x:p.x-8,y:p.y+1},{x:p.x-8,y:p.y+8},"#40514c",3);
      line({x:p.x+8,y:p.y+1},{x:p.x+8,y:p.y+8},"#40514c",3);
    });

    // Borboletas dão movimento sem criar NPCs ou missões prematuras.
    for(const [x,y,phase] of [[11,28,0],[27,25,1.6],[9.8,17,3.1]]){
      const p=P(x,y), flight=Math.sin(time*2.1+phase);
      const bx=p.x+Math.sin(time*.7+phase)*7;
      const by=p.y-17+flight*4;
      ellipse(bx-3,by,3,2.2,"#f7b6db");
      ellipse(bx+3,by,3,2.2,"#ffdf87");
      line({x:bx,y:by-2},{x:bx,y:by+4},"#6c664c",1);
    }
  }


  function gateway() {
    const p=P(20,42.7);
    ctx.save();
    // Entrada baseada na foto: estrutura branca, cobertura azul e guarita.
    ellipse(p.x+9,p.y+8,108,16,"#1a35434b");
    // Faixa de pedestre que liga a PA-391 à entrada.
    for(let i=0;i<7;i++){
      const x=p.x-51+i*16;
      line({x,y:p.y+10},{x:x+9,y:p.y+10},"#f5e9d0",7);
    }
    const columns=[-82,82];
    columns.forEach(dx=>{
      const cx=p.x+dx;
      ctx.fillStyle="#cbd1c6";
      ctx.fillRect(cx-9,p.y-89,18,91);
      ctx.fillStyle="#f3ecd9";
      ctx.fillRect(cx-9,p.y-89,12,88);
      ctx.fillStyle="#31719a";
      ctx.fillRect(cx-9,p.y-25,18,22);
      ctx.fillStyle="#d3b875";
      ctx.fillRect(cx-10,p.y-91,20,7);
      // Banners Adventistas nos dois pilares.
      polygon([
        {x:cx-7,y:p.y-69},{x:cx+7,y:p.y-69},
        {x:cx+7,y:p.y-41},{x:cx,y:p.y-36},
        {x:cx-7,y:p.y-41}
      ],"#2966ac","#e3ecdc");
      ctx.fillStyle="#e4f4fa";
      ctx.font="bold 14px Arial";
      ctx.textAlign="center";
      ctx.fillText("A",cx,p.y-49);
    });
    const gradient=ctx.createLinearGradient(0,p.y-93,0,p.y-61);
    gradient.addColorStop(0,"#bbf4f0");
    gradient.addColorStop(.3,"#76c7d8");
    gradient.addColorStop(1,"#2a6e9a");
    polygon([
      {x:p.x-103,y:p.y-85},{x:p.x+103,y:p.y-85},
      {x:p.x+92,y:p.y-60},{x:p.x-92,y:p.y-60}
    ],gradient,"#dff2e5");
    for(let i=-4;i<=4;i++){
      line({x:p.x+i*19,y:p.y-85},{x:p.x+i*17,y:p.y-60},
        "#2b7b9f",1.4);
    }
    // Placa longa com o nome da instituição.
    ctx.fillStyle="#fff5df";
    ctx.fillRect(p.x-104,p.y-110,208,24);
    ctx.strokeStyle="#b4aa85";
    ctx.lineWidth=2;
    ctx.strokeRect(p.x-104,p.y-110,208,24);
    ctx.font="bold 10px Arial";
    ctx.textAlign="center";
    ctx.fillStyle="#1a486c";
    ctx.fillText("FACULDADE ADVENTISTA DA AMAZÔNIA",p.x,p.y-94);

    // Guarita sob a cobertura, separada da passagem lateral.
    ctx.fillStyle="#879c94";
    ctx.fillRect(p.x-17,p.y-42,34,39);
    ctx.fillStyle="#efead7";
    ctx.fillRect(p.x-15,p.y-42,30,34);
    ctx.fillStyle="#477f92";
    ctx.fillRect(p.x-12,p.y-34,24,17);
    ctx.fillStyle="#d4f5eb";
    ctx.fillRect(p.x-10,p.y-32,20,13);
    line({x:p.x,y:p.y-32},{x:p.x,y:p.y-19},"#edf7eb",2);
    // Cancelas, sem fechar o caminho do jogador.
    for(const dx of [-52,52]){
      const sign=dx<0?-1:1;
      ctx.fillStyle="#e19b43";
      ctx.fillRect(p.x+dx,p.y-10,7,14);
      line({x:p.x+dx+3,y:p.y-10},
        {x:p.x+dx+sign*21,y:p.y-17},"#f8e4cf",4);
      line({x:p.x+dx+3,y:p.y-10},
        {x:p.x+dx+sign*21,y:p.y-17},"#da5c4d",1);
    }
    ctx.restore();
  }

  const miniCanvas=document.getElementById("miniMap");
  const miniCtx=miniCanvas?.getContext("2d");
  function drawMinimap() {
    if (!miniCtx) return;
    const m=miniCtx, sx=4,sy=3.65,ox=14,oy=10;
    m.clearRect(0,0,miniCanvas.width,miniCanvas.height);
    const ground=m.createLinearGradient(0,0,160,190);
    ground.addColorStop(0,"#79aa69");
    ground.addColorStop(1,"#315f54");
    m.fillStyle=ground;
    m.fillRect(0,0,miniCanvas.width,miniCanvas.height);
    m.strokeStyle="#d2be91";
    m.lineWidth=4;
    for (const road of roads) {
      m.beginPath();
      road.forEach(([x,y],i)=>{
        if (i===0) m.moveTo(ox+x*sx,oy+y*sy);
        else m.lineTo(ox+x*sx,oy+y*sy);
      });
      m.stroke();
    }
    for (const b of sites) {
      m.fillStyle=
        b.id==="pool"?"#49c5e4":
        b.id==="female"?"#e55b6e":
        b.id==="male"?"#8058b4":
        b.id==="central"?"#e4b74e":
        b.id==="restaurant"?"#6b7372":
        b.id==="school"?"#44b2d1":
        b.id==="academic"?"#c9dce1":
        "#f1e0b5";
      m.fillRect(ox+b.x*sx,oy+b.y*sy,b.w*sx,b.h*sy);
      m.strokeStyle="#203d3a";
      m.lineWidth=1;
      m.strokeRect(ox+b.x*sx,oy+b.y*sy,b.w*sx,b.h*sy);
      if(b.id==="church"){
        m.textAlign="center";
        m.font="bold 13px Arial,sans-serif";
        m.fillStyle="#fff6d9";
        m.fillText(finalGate.progress().unlocked?"✦":"🔒",
          ox+(b.x+b.w/2)*sx,oy+(b.y+b.h/2)*sy+5);
      }
    }
    life.drawMinimapMarkers(m,ox,oy,sx,sy);
    quest.drawMinimapMarkers(m,ox,oy,sx,sy);
    const px=ox+player.x*sx,py=oy+player.y*sy;
    m.beginPath();m.arc(px,py,6,0,Math.PI*2);
    m.fillStyle="#f3dc65";m.fill();
    m.lineWidth=2;m.strokeStyle="#102d35";m.stroke();
    m.font="bold 13px Arial";
    m.textAlign="right";
    m.fillStyle="#fcf7e7";
    m.fillText("N ↑",158,17);
  }


  function sky() {
    const g = ctx.createLinearGradient(0, 0, 0, SH);

    g.addColorStop(0, "#80bed6");
    g.addColorStop(0.55, "#c2e3df");
    g.addColorStop(1, "#e7ebc9");

    ctx.fillStyle = g;
    ctx.fillRect(0, 0, SW, SH);

    ellipse(1000, 105, 65, 65, "#f7e4a6aa");
  }

  function cloud(x, y, s) {
    ellipse(x, y, 54 * s, 15 * s, "#fffdf2b3");
    ellipse(x + 27 * s, y - 12 * s, 32 * s, 21 * s, "#fffdf2c2");
    ellipse(x - 28 * s, y - 7 * s, 30 * s, 17 * s, "#fffdf2c2");
  }

  function show(text, seconds = 4) {
    if (!ui.toast) return;

    ui.toast.textContent = text;
    ui.toast.classList.remove("hidden");
    toastUntil = time + seconds;
  }

  function landscapeBlocked(x, y, radius=.32) {
    return trees.some(t =>
      Math.hypot(x-t.x,y-t.y)<radius+.23*t.size
    ) || palms.some(t =>
      Math.hypot(x-t.x,y-t.y)<radius+.2
    );
  }

  function blocked(x, y) {
    return sites.some(s => inside(x, y, s, 0.2)) ||
      landscapeBlocked(x, y, .30) ||
      life.solidAt(x, y, .33);
  }

  function nearest() {
    let found = null;
    let distance = 2.2;

    for (const s of sites) {
      const nx = Math.max(s.x, Math.min(player.x, s.x + s.w));
      const ny = Math.max(s.y, Math.min(player.y, s.y + s.h));

      const d = Math.hypot(player.x - nx, player.y - ny);

      if (d < distance) {
        found = s;
        distance = d;
      }
    }

    return found;
  }

  function dialoguePortrait(npc) {
    const icon = {
      lia: "👩🏽‍🎓", mateus: "👨🏻‍💻", bia: "👩🏾‍⚕️",
      daniel: "👨🏼‍🎓", clara: "👩🏽‍🏫", marina: "👩🏽‍💼",
      helena: "👩🏽‍🏫", "clara-chef": "👩🏽‍🍳", sofia: "👩🏽‍🏫",
      "nara-pool":"🏊🏽‍♀️","isabela-residencia":"👩🏽‍🎓","gabriel-residencia":"👨🏽‍🎓"
    };
    return icon[npc.id] || "🧑‍🎓";
  }

  function refreshDialogue() {
    if (!activeDialogue) return;
    const { npc, index } = activeDialogue;
    dialogueUI.name.textContent = npc.name;
    dialogueUI.role.textContent = npc.role;
    dialogueUI.line.textContent = npc.lines[index];
    dialogueUI.portrait.textContent = dialoguePortrait(npc);
    dialogueUI.next.textContent =
      index === npc.lines.length - 1 ? "Encerrar" : "Continuar";
  }

  function openDialogue(npc) {
    activeDialogue = { npc, index: 0 };
    held.clear();
    player.moving = false;
    if (ui.toast) ui.toast.classList.add("hidden");
    refreshDialogue();
    dialogueUI.root.classList.remove("hidden");
  }

  function closeDialogue(completed=false) {
    if (!activeDialogue) return;
    const startSports=completed===true && pendingSportsStart && sports.active;
    const startRestaurant=completed===true && pendingRestaurantStart && restaurant.active;
    const startPool=completed===true && pendingPoolStart && pool.active;
    pendingSportsStart=false;
    pendingRestaurantStart=false;
    pendingPoolStart=false;
    activeDialogue = null;
    dialogueUI.root.classList.add("hidden");
    held.clear();
    if (pendingQuestNotice) {
      show(pendingQuestNotice,6);
      pendingQuestNotice = null;
    }
    if(startSports&&sports.start()){
      refreshSportsUI();
      show("Circuito iniciado! 90 segundos para pegar as cinco medalhas!",5);
    }
    if(startRestaurant&&restaurant.begin()){
      refreshRestaurantUI();
      show("Restaurante aberto! Você tem três minutos para preparar e entregar cinco pedidos.",5);
    }
    if(startPool&&pool.start()){
      refreshPoolUI();
      show("Desafio Aquático iniciado! Colete cinco boias em até 120 segundos!",5);
    }
  }

  function advanceDialogue() {
    if (!activeDialogue) return;
    if (activeDialogue.index >= activeDialogue.npc.lines.length - 1) {
      closeDialogue(true);
    } else {
      activeDialogue.index++;
      refreshDialogue();
    }
  }

  function interact() {
    if(foodOpen||schoolPuzzleOpen||residencePuzzleKind)return;
    if (activeDialogue) {
      advanceDialogue();
      return;
    }
    if(pool.active){
      const spot=pool.nearest();
      if(!spot){show(pool.objective(),4);return;}
      if(spot.kind==="exit")leavePool();
      else if(spot.kind==="coach"){
        const event=pool.talkCoach();
        pendingPoolStart=event.startOnClose===true;
        openDialogue({...pool.coach,lines:event.lines});
      }else if(spot.kind==="finish"){
        show(pool.progress().buoys<5?"Encontre as cinco boias e volte à chegada!":pool.objective(),4);
      }
      return;
    }
    const residence=currentResidence();
    if(residence){
      const action=residence.nearest();
      const kind=residence.kind;
      if(!action){show(residence.objective(),4);return;}
      if(action.kind==="exit")leaveResidence(kind);
      else if(action.kind==="npc"){
        const result=residence.talk();
        openDialogue({...residence.npc,lines:result.lines});
        if(result.changed){
          refreshResidenceUI(kind);
          pendingQuestNotice=result.message||null;
        }
      }else if(action.kind==="item"){
        const result=residence.inspect(action.id);
        if(result?.message)show(result.message,6);
        if(result?.changed)refreshResidenceUI(kind);
      }else if(action.kind==="board"){
        const result=residence.inspect("board");
        if(result?.puzzle)openResidencePuzzle(kind,result.puzzle);
        else if(result?.message)show(result.message,5);
      }
      return;
    }
    if(school.active){
      const action=school.nearest();
      if(!action){show(school.objective(),5);return;}
      if(action.kind==="exit"){
        leaveSchool();
      }else if(action.kind==="teacher"){
        const event=school.talk();
        openDialogue({...school.teacher,lines:event.lines});
        if(event.changed){
          refreshSchoolUI();
          pendingQuestNotice=event.message||null;
        }
      }else if(action.kind==="clue"){
        const result=school.inspect(action.id);
        if(result?.puzzle)openSchoolPuzzle(result.puzzle);
        else if(result?.message)show(result.message,5);
      }else if(action.kind==="capsule"){
        const result=school.inspect("capsule");
        if(result?.message)show(result.message,7);
        if(result?.changed)refreshSchoolUI();
      }
      return;
    }
    if(restaurant.active){
      const action=restaurant.nearest();
      if(!action){show(restaurant.objective(),4);return;}
      if(action.kind==="exit"){
        leaveRestaurant();
      }else if(action.kind==="chef"){
        const event=restaurant.talkChef();
        pendingRestaurantStart=event.startOnClose===true;
        openDialogue({...restaurant.chef,lines:event.lines});
      }else if(action.kind==="prep"){
        openFood();
      }else if(action.kind==="customer"){
        const event=restaurant.deliver(action.id);
        if(event?.message)show(event.message,event.kind==="finished"?7:5);
        refreshRestaurantUI();
      }
      return;
    }
    if(sports.active){
      const action=sports.nearest();
      if(!action){show(sports.objective(),4);return;}
      if(action.kind==="exit"){
        leaveSports();
      }else if(action.kind==="coach"){
        const event=sports.talkCoach();
        pendingSportsStart=event.startOnClose===true;
        openDialogue({...sports.coach,lines:event.lines});
      }else if(action.kind==="finish"){
        if(sports.phase==="running"){
          show("Pegue as cinco medalhas e cruze a linha de chegada!",4);
        }else{
          show(sports.objective(),4);
        }
      }
      return;
    }
    if(academic.active){
      if(activeAcademicQuiz)return;
      const action=academic.nearest();
      if(!action){
        show(academic.objective(),4);
        return;
      }
      if(action.kind==="exit"){
        leaveAcademic();
      }else if(action.kind==="npc"){
        const result=academic.talk();
        openDialogue({...action.npc,lines:result.lines});
        if(result.changed){
          refreshAcademicUI();
          pendingQuestNotice=result.message||null;
        }
      }else if(action.kind==="station"){
        const result=academic.inspect(action.id);
        if(result?.quiz)openAcademicQuiz(result.quiz);
        else if(result?.message)show(result.message,5);
      }
      return;
    }
    if (interior.active) {
      if(riddleOpen)return;
      const action=interior.interact();
      if(!action){
        show("Explore a recepção, as duas salas e os objetos do Prédio Central.",4);
        return;
      }
      if(action.kind==="exit"){
        leaveCentral();
      } else if(action.kind==="npc"){
        const event=indoorQuest.talkToMarina();
        openDialogue({...action.npc,lines:event.lines});
        if(event.changed){
          refreshIndoorQuestUI();
          pendingQuestNotice=event.message||null;
        }
      } else if(action.kind==="object"){
        const event=indoorQuest.inspect(action.id);
        if(event?.openRiddle){
          openRiddle();
        }else if(event){
          show(event.message,6);
          if(event.changed)refreshIndoorQuestUI();
        }else{
          show(action.text,6);
        }
      }
      return;
    }
    // A porta tem prioridade somente na sua faixa de acesso, sem
    // ocultar a pista da Missão 01 que fica mais ao sul da praça.
    if (near?.id==="church"&&nearChurchEntrance()) {
      // O capítulo final deve validar novamente as nove missões antes de abrir.
      // Até a implementação do seu interior, a entrada só exibe o status.
      show(finalGate.notice(),8);
      refreshFinalGateUI();
      return;
    }
    if (near?.id==="pool"&&nearNewSiteEntrance(poolSite)) {
      enterPool();return;
    }
    if (near?.id==="female"&&nearNewSiteEntrance(femaleSite)) {
      enterResidence("female");return;
    }
    if (near?.id==="male"&&nearNewSiteEntrance(maleSite)) {
      enterResidence("male");return;
    }
    if (near?.id==="school"&&nearSchoolEntrance()) {
      enterSchool();
      return;
    }
    if (near?.id==="restaurant"&&nearRestaurantEntrance()) {
      enterRestaurant();
      return;
    }
    if (near?.id==="sports"&&nearSportsEntrance()) {
      enterSports();
      return;
    }
    if (near?.id==="academic"&&nearAcademicEntrance()) {
      enterAcademic();
      return;
    }
    if (near?.id==="central"&&nearCentralEntrance()) {
      enterCentral();
      return;
    }
    nearQuestItem = quest.nearItem(player.x,player.y);
    if (nearQuestItem) {
      const result=quest.collect(nearQuestItem.item.id);
      if (result) {
        show(result.message,6);
        refreshQuestUI();
      }
      nearQuestItem = quest.nearItem(player.x,player.y);
      return;
    }

    nearTalker = life.nearestTalker(player.x,player.y,1.85);
    if (nearTalker) {
      if (nearTalker.npc.id==="lia") {
        const event=quest.talkToLia();
        openDialogue({...nearTalker.npc,lines:event.lines});
        if(event.changed) {
          refreshQuestUI();
          pendingQuestNotice = event.message || null;
        }
      } else {
        openDialogue(nearTalker.npc);
      }
    } else if (near?.id==="central") {
      show("Para entrar no Prédio Central, aproxime-se da porta principal na fachada voltada para a entrada do campus.",5);
    } else if (near?.id==="academic") {
      show("Para entrar no Prédio Acadêmico, aproxime-se da porta principal na fachada voltada para a entrada do campus.",5);
    } else if (near?.id==="sports") {
      show("Para entrar no Complexo Esportivo, vá até a porta principal do ginásio.",5);
    } else if (near?.id==="restaurant") {
      show("Para entrar no Restaurante, aproxime-se da entrada principal.",5);
    } else if (near?.id==="school") {
      show("Para entrar na FAAMinha, aproxime-se da porta principal da escola.",5);
    } else if (near?.id==="pool") {
      show("Para entrar na Piscina, aproxime-se do acesso principal ao sul da área de lazer.",5);
    } else if (near?.id==="female") {
      show("Para entrar no Residencial Feminino, aproxime-se da porta principal.",5);
    } else if (near?.id==="male") {
      show("Para entrar no Residencial Masculino, aproxime-se da porta principal.",5);
    } else if (near?.id==="church") {
      show(finalGate.notice(),8);
      refreshFinalGateUI();
    } else if (near) {
      show(near.info, 6);
    } else {
      show("Aproxime-se de uma pista, estudante ou prédio para interagir.");
    }
  }

  function update(dt) {
    if(pool.active){
      if(activeDialogue){
        held.clear();pool.pause();
        if(ui.interact){ui.interact.disabled=false;ui.interact.textContent="CONTINUAR [E]";}
        if(ui.objective)ui.objective.textContent="Conversa com "+activeDialogue.npc.name;
      }else{
        const event=pool.update(dt,held);
        if(event?.message)show(event.message,event.kind==="buoy"?3:7);
        const spot=pool.nearest();
        if(ui.interact){
          ui.interact.disabled=!spot;
          ui.interact.textContent=spot?.kind==="exit"?"SAIR [E]":
            spot?.kind==="coach"?"CONVERSAR [E]":"INTERAGIR [E]";
        }
        if(ui.objective)ui.objective.textContent=pool.objective();
      }
      if(ui.location)ui.location.textContent="PISCINA • DESAFIO AQUÁTICO";
      if(interiorUI.room)interiorUI.room.textContent="Área da piscina";
      const hint=document.getElementById("hint");
      if(hint)hint.textContent="WASD / SETAS • E conversar • colete 5 boias";
      refreshPoolUI();
      return;
    }
    const residence=currentResidence();
    if(residence){
      const kind=residence.kind;
      if(residencePuzzleKind){
        held.clear();residence.pause();
        if(ui.interact)ui.interact.disabled=true;
        if(ui.objective)ui.objective.textContent="Responda ao desafio de organização";
      }else if(activeDialogue){
        held.clear();residence.pause();
        if(ui.interact){ui.interact.disabled=false;ui.interact.textContent="CONTINUAR [E]";}
        if(ui.objective)ui.objective.textContent="Conversa com "+activeDialogue.npc.name;
      }else{
        residence.update(dt,held);
        const spot=residence.nearest();
        if(ui.interact){
          ui.interact.disabled=!spot;
          ui.interact.textContent=spot?.kind==="exit"?"SAIR [E]":
            spot?.kind==="npc"?"CONVERSAR [E]":
            spot?.kind==="item"?"PEGAR [E]":
            spot?.kind==="board"?"ORGANIZAR [E]":"INTERAGIR [E]";
        }
        if(ui.objective)ui.objective.textContent=spot?
          "[E] "+spot.name:residence.objective();
      }
      if(ui.location)ui.location.textContent=residence.conf.name.toUpperCase()+
        " • "+residence.roomName().toUpperCase();
      if(interiorUI.room)interiorUI.room.textContent=residence.roomName();
      const hint=document.getElementById("hint");
      if(hint)hint.textContent="WASD / SETAS • E investigar • quadro de organização";
      refreshResidenceUI(kind);
      return;
    }
    if(school.active){
      if(schoolPuzzleOpen){
        held.clear();
        school.pause();
        if(ui.interact)ui.interact.disabled=true;
        if(ui.objective)ui.objective.textContent="Resolva o enigma para descobrir a próxima pista";
      }else if(activeDialogue){
        held.clear();school.pause();
        if(ui.interact){
          ui.interact.disabled=false;
          ui.interact.textContent="CONTINUAR [E]";
        }
        if(ui.objective)ui.objective.textContent="Conversa com "+activeDialogue.npc.name;
      }else{
        school.update(dt,held);
        const spot=school.nearest();
        if(ui.interact){
          ui.interact.disabled=!spot;
          ui.interact.textContent=spot?.kind==="exit"?"SAIR [E]":
            spot?.kind==="teacher"?"CONVERSAR [E]":
            spot?.kind==="clue"?"INVESTIGAR [E]":
            spot?.kind==="capsule"?"PEGAR TESOURO [E]":"INTERAGIR [E]";
        }
        if(ui.objective)ui.objective.textContent=
          spot?"[E] "+(spot.kind==="exit"?"Voltar ao campus":spot.name):school.objective();
      }
      if(ui.location)ui.location.textContent="FAAMINHA • "+school.roomName().toUpperCase();
      if(interiorUI.room)interiorUI.room.textContent=school.roomName();
      const hint=document.getElementById("hint");
      if(hint)hint.textContent="WASD / SETAS • E investigar • pistas em sequência";
      refreshSchoolUI();
      return;
    }
    if(restaurant.active){
      if(activeDialogue){
        held.clear();
        restaurant.pause();
        if(ui.interact){
          ui.interact.disabled=false;
          ui.interact.textContent="CONTINUAR [E]";
        }
        if(ui.objective)ui.objective.textContent="Conversa com "+activeDialogue.npc.name;
      }else{
        const result=restaurant.update(dt,foodOpen?new Set():held);
        if(result?.kind==="timeout"&&foodOpen)closeFood();
        if(result?.message)show(result.message,7);
        const spot=restaurant.nearest();
        if(ui.interact){
          ui.interact.disabled=foodOpen||!spot;
          ui.interact.textContent=spot?.kind==="exit"?"SAIR [E]":
            spot?.kind==="chef"?"CONVERSAR [E]":
            spot?.kind==="prep"?"PREPARAR [E]":
            spot?.kind==="customer"?"ENTREGAR [E]":"INTERAGIR [E]";
        }
        if(ui.objective)ui.objective.textContent=restaurant.objective();
      }
      if(ui.location)ui.location.textContent="RESTAURANTE DA FAAMA • SALÃO";
      if(interiorUI.room)interiorUI.room.textContent="O Restaurante Misterioso";
      const hint=document.getElementById("hint");
      if(hint)hint.textContent="WASD / SETAS • E preparar e entregar pedidos";
      refreshRestaurantUI();
      return;
    }
    if(sports.active){
      if(activeDialogue){
        held.clear();
        sports.pause();
        if(ui.interact){
          ui.interact.disabled=false;
          ui.interact.textContent="CONTINUAR [E]";
        }
        if(ui.objective)ui.objective.textContent="Conversa com "+activeDialogue.npc.name;
      }else{
        const event=sports.update(dt,held);
        if(event?.message)show(event.message,event.kind==="medal"?3:7);
        const spot=sports.nearest();
        if(ui.interact){
          ui.interact.disabled=!spot;
          ui.interact.textContent=spot?.kind==="exit"?"SAIR [E]":
            spot?.kind==="coach"?"CONVERSAR [E]":"INTERAGIR [E]";
        }
        if(ui.objective)ui.objective.textContent=sports.objective();
      }
      if(ui.location)ui.location.textContent="COMPLEXO ESPORTIVO • GINÁSIO";
      if(interiorUI.room)interiorUI.room.textContent="Circuito dos Campeões";
      const hint=document.getElementById("hint");
      if(hint)hint.textContent="WASD / SETAS • E interagir • colete 5 medalhas";
      refreshSportsUI();
      return;
    }
    if(academic.active){
      if(activeAcademicQuiz){
        held.clear();
        academic.pause();
        if(ui.interact)ui.interact.disabled=true;
        if(ui.objective)ui.objective.textContent="Responda ao Desafio do Conhecimento";
      } else if(activeDialogue){
        held.clear();
        academic.pause();
        if(ui.interact){
          ui.interact.disabled=false;
          ui.interact.textContent="CONTINUAR [E]";
        }
        if(ui.objective)ui.objective.textContent="Conversa com "+activeDialogue.npc.name;
      } else {
        academic.update(dt,held);
        const spot=academic.nearest();
        if(ui.interact){
          ui.interact.disabled=!spot;
          ui.interact.textContent=spot?.kind==="exit"?"SAIR [E]":
            spot?.kind==="npc"?"CONVERSAR [E]":
            spot?.kind==="station"?"RESPONDER [E]":"INTERAGIR [E]";
        }
        if(ui.objective)ui.objective.textContent=
          spot?"[E] "+(spot.kind==="exit"?"Voltar ao campus":spot.name):academic.objective();
      }
      if(ui.location)ui.location.textContent="PRÉDIO ACADÊMICO • "+academic.roomName().toUpperCase();
      if(interiorUI.room)interiorUI.room.textContent=academic.roomName();
      const hint=document.getElementById("hint");
      if(hint)hint.textContent="WASD / SETAS • E interagir • provas e biblioteca";
      return;
    }
    if(interior.active){
      if(riddleOpen){
        held.clear();
        interior.pause();
        if(ui.interact)ui.interact.disabled=true;
        if(ui.objective)ui.objective.textContent="Resolva o enigma do armário";
        return;
      }
      if(activeDialogue){
        held.clear();
        interior.pause();
        if(ui.interact){
          ui.interact.disabled=false;
          ui.interact.textContent="CONTINUAR [E]";
        }
        if(ui.objective)ui.objective.textContent=
          "Conversa com "+activeDialogue.npc.name;
      } else {
        interior.update(dt,held);
        const spot=interior.nearest();
        if(ui.interact){
          ui.interact.disabled=!spot;
          ui.interact.textContent=spot?.kind==="exit"?"SAIR [E]":
            spot?.kind==="npc"?"CONVERSAR [E]":
            spot?.kind==="object"?"EXAMINAR [E]":"INTERAGIR [E]";
        }
        if(ui.objective){
          ui.objective.textContent=spot
            ? "[E] "+(spot.kind==="exit"?"Voltar ao campus":spot.name)
            : indoorQuest.stage()==="locked"
              ? "Explore o Prédio Central • conclua a Missão 01 para novas aventuras"
              : indoorQuest.objective();
        }
      }
      if(ui.location)ui.location.textContent=
        "PRÉDIO CENTRAL • "+interior.roomName().toUpperCase();
      if(interiorUI.room)interiorUI.room.textContent=interior.roomName();
      const hint=document.getElementById("hint");
      if(hint)hint.textContent="WASD / SETAS • E interagir • porta de saída";
      return;
    }

    if (activeDialogue) {
      held.clear();
      player.moving = false;
      if (ui.interact) {
        ui.interact.disabled = false;
        ui.interact.textContent = "CONTINUAR [E]";
      }
      if (ui.objective) {
        ui.objective.textContent = "Conversa com " + activeDialogue.npc.name;
      }
      return;
    }

    let dx =
      Number(held.has("ArrowRight") || held.has("d")) -
      Number(held.has("ArrowLeft") || held.has("a"));

    let dy =
      Number(held.has("ArrowDown") || held.has("s")) -
      Number(held.has("ArrowUp") || held.has("w"));

    const length = Math.hypot(dx, dy) || 1;

    dx = dx / length * player.speed * dt;
    dy = dy / length * player.speed * dt;

    const nx = Math.max(0.5, Math.min(W - 0.5, player.x + dx));
    const ny = Math.max(0.5, Math.min(H - 0.5, player.y + dy));

    const previousX=player.x, previousY=player.y;
    if (!blocked(nx, player.y)) player.x = nx;
    if (!blocked(player.x, ny)) player.y = ny;

    // Só animar passos quando houver deslocamento real, sem atravessar NPCs.
    player.moving = Math.hypot(player.x-previousX,player.y-previousY) > .0001;
    if (player.moving) {
      player.walk += dt * 12;
      player.facing = Math.abs(dx) > Math.abs(dy)
        ? (dx > 0 ? "right" : "left")
        : (dy > 0 ? "down" : "up");
    }

    near = nearest();
    nearTalker = life.nearestTalker(player.x, player.y, 1.85);
    nearQuestItem = quest.nearItem(player.x,player.y);

    if (ui.location) {
      ui.location.textContent = near
        ? near.name
        : player.y > 38
          ? "ENTRADA DA FAAMA"
          : "CAMPUS DA FAAMA";
    }

    if (ui.interact) {
      ui.interact.disabled = !(nearQuestItem || nearTalker || near);
      ui.interact.textContent = near?.id==="pool"&&nearNewSiteEntrance(poolSite)
        ? "ENTRAR [E]" : near?.id==="female"&&nearNewSiteEntrance(femaleSite)
        ? "ENTRAR [E]" : near?.id==="male"&&nearNewSiteEntrance(maleSite)
        ? "ENTRAR [E]" : near?.id==="church"&&nearChurchEntrance()
        ? finalGate.progress().unlocked?"FASE FINAL [E]":"🔒 BLOQUEADA [E]"
        : near?.id==="school"&&nearSchoolEntrance()
        ? "ENTRAR [E]" : near?.id==="restaurant"&&nearRestaurantEntrance()
        ? "ENTRAR [E]" : near?.id==="sports"&&nearSportsEntrance()
        ? "ENTRAR [E]" : near?.id==="academic"&&nearAcademicEntrance()
        ? "ENTRAR [E]" : near?.id==="central"&&nearCentralEntrance()
          ? "ENTRAR [E]" : nearQuestItem
          ? "INVESTIGAR [E]" : nearTalker
            ? "CONVERSAR [E]" : "INTERAGIR [E]";
    }

    const hint = document.getElementById("hint");
    if (hint) {
      hint.textContent = near?.id==="pool"&&nearNewSiteEntrance(poolSite)
        ? "[E] Entrar na Piscina"
        : near?.id==="female"&&nearNewSiteEntrance(femaleSite)
        ? "[E] Entrar no Residencial Feminino"
        : near?.id==="male"&&nearNewSiteEntrance(maleSite)
        ? "[E] Entrar no Residencial Masculino"
        : near?.id==="church"&&nearChurchEntrance()
        ? finalGate.progress().unlocked
          ? "[E] A Igreja está liberada para a última fase"
          : "[E] Igreja bloqueada — conclua todas as missões"
        : near?.id==="school"&&nearSchoolEntrance()
        ? "[E] Entrar na FAAMinha"
        : near?.id==="restaurant"&&nearRestaurantEntrance()
        ? "[E] Entrar no Restaurante"
        : near?.id==="sports"&&nearSportsEntrance()
        ? "[E] Entrar no Complexo Esportivo"
        : near?.id==="academic"&&nearAcademicEntrance()
        ? "[E] Entrar no Prédio Acadêmico"
        : near?.id==="central"&&nearCentralEntrance()
          ? "[E] Entrar no Prédio Central"
        : nearQuestItem
          ? "[E] Investigar: "+nearQuestItem.item.name
          : nearTalker
          ? "[E] Conversar com " + nearTalker.npc.name
          : near
            ? "[E] Conhecer: "+(near.short || near.name)
            : "WASD / SETAS para caminhar";
    }

    if (ui.objective) {
      ui.objective.textContent=quest.stage()==="completed"?
        (indoorQuest.stage()==="ready"
          ? "Missão 02 liberada! Entre no Prédio Central e converse com Marina."
          : indoorQuest.stage()==="completed"
            ? academic.stage()==="completed"
              ? sports.progress().completed
                ? restaurant.progress().completed
                  ? school.progress().completed
                    ? !pool.progress().completed
                      ? "Próxima aventura: Desafio Aquático na Piscina."
                      : !female.progress().completed
                      ? "Próxima aventura: A Rotina Equilibrada no Residencial Feminino."
                      : !male.progress().completed
                      ? "Próxima aventura: Projeto em Equipe no Residencial Masculino."
                      : "Nove missões concluídas! A Igreja foi desbloqueada para a fase final."
                    : "Próxima aventura: O Tesouro da FAAMinha. Converse com Sofia!"
                  : "Nova missão: O Restaurante Misterioso. Converse com Clara!"
                : "Próximo desafio: Circuito dos Campeões no Complexo Esportivo."
              : "Prédio Acadêmico: converse com a professora Helena."
            : "Missão 02: continue a investigação no Prédio Central.")
        : quest.objective();
    }
  }

  function render(ms) {
    try {
      const dt = Math.min((ms - previous) / 1000 || 0, 0.05);

      previous = ms;
      time += dt;

      if(!interior.active&&!academic.active&&!sports.active&&!restaurant.active&&!school.active&&
          !pool.active&&!female.active&&!male.active){
        life.update(dt, player, activeDialogue?.npc.id || null);
      }
      update(dt);
      refreshFinalGateUI();

      if(pool.active){
        pool.draw(time,zoom);
        if(ui.toast&&time>toastUntil)ui.toast.classList.add("hidden");
        requestAnimationFrame(render);return;
      }
      if(female.active||male.active){
        currentResidence().draw(time,zoom);
        if(ui.toast&&time>toastUntil)ui.toast.classList.add("hidden");
        requestAnimationFrame(render);return;
      }
      if(school.active){
        school.draw(time,zoom);
        if(ui.toast&&time>toastUntil)ui.toast.classList.add("hidden");
        requestAnimationFrame(render);
        return;
      }
      if(restaurant.active){
        restaurant.draw(time,zoom);
        if(ui.toast&&time>toastUntil)ui.toast.classList.add("hidden");
        requestAnimationFrame(render);
        return;
      }
      if(sports.active){
        sports.draw(time,zoom);
        if(ui.toast&&time>toastUntil)ui.toast.classList.add("hidden");
        requestAnimationFrame(render);
        return;
      }
      if(academic.active){
        academic.draw(time,zoom);
        if(ui.toast&&time>toastUntil)ui.toast.classList.add("hidden");
        requestAnimationFrame(render);
        return;
      }
      if(interior.active){
        interior.draw(time,zoom,indoorQuest.markers());
        if(ui.toast&&time>toastUntil)ui.toast.classList.add("hidden");
        requestAnimationFrame(render);
        return;
      }

      ctx.setTransform(1, 0, 0, 1, 0, 0);

      sky();

      cloud((time * 10 + 180) % (SW + 240) - 120, 100, 1.15);
      cloud((time * 7 + 740) % (SW + 240) - 120, 165, 0.8);
      cloud((time * 6 + 1050) % (SW + 240) - 120, 64, 0.65);

      const focus = iso(player.x, player.y);
      // Visão geral na entrada; a câmera segue quando o jogador
      // se aproxima das bordas da região visível.
      const overview = iso(18, 24.5);
      const follow = (axis, safe) => {
        const distance=focus[axis]-overview[axis];
        return overview[axis] + Math.sign(distance) *
          Math.max(0, Math.abs(distance)-safe/zoom);
      };
      const targetX=follow("x", SW*.39);
      const targetY=follow("y", SH*.39);
      const smoothing=1-Math.exp(-Math.min(dt,.05)*8);
      camera.x += (targetX-camera.x)*smoothing;
      camera.y += (targetY-camera.y)*smoothing;

      ctx.save();

      ctx.translate(SW / 2, SH / 2 + 55);
      ctx.scale(zoom, zoom);
      ctx.translate(-camera.x, -camera.y);

      ground();
      drawRoads();
      plazas();
      campusDecor();

      const objects = [
        ...trees.map(t => ({
          depth: t.y + t.x * .02,
          draw: () => tree(t)
        })),
        ...palms.map(t => ({
          depth: t.y + t.x * .02,
          draw: () => palm(t)
        })),
        ...sites.map(s => ({
          depth: s.y + s.h + s.x * .02,
          draw: () => building(s)
        })),
        ...life.renderables(player),
        ...quest.renderables(time,player),
        {
          depth: player.y + player.x * .02,
          draw: character
        },
        {
          depth: 43.7,
          draw: gateway
        }
      ].sort((a, b) => a.depth - b.depth);

      objects.forEach(o => o.draw());

      ctx.restore();
      drawMinimap();

      if (ui.toast && time > toastUntil) {
        ui.toast.classList.add("hidden");
      }

      requestAnimationFrame(render);

    } catch (error) {
      console.error("Erro no FAAMA Explorer:", error);

      if (ui.fatal) {
        ui.fatal.textContent = "Erro no cenário: " + error.message;
        ui.fatal.classList.remove("hidden");
      }
    }
  }

  const allowed = new Set([
    "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight",
    "w", "a", "s", "d"
  ]);

  window.addEventListener("keydown", e => {
    const k = e.key.length === 1
      ? e.key.toLowerCase()
      : e.key;

    if(residencePuzzleKind){
      if(k==="Escape")closeResidencePuzzle();
      else if(["1","2","3"].includes(k))answerResidencePuzzle(Number(k)-1);
      e.preventDefault();return;
    }
    if(schoolPuzzleOpen){
      if(k==="Escape")closeSchoolPuzzle();
      else if(["1","2","3"].includes(k))answerSchoolPuzzle(Number(k)-1);
      e.preventDefault();
      return;
    }
    if(foodOpen){
      if(k==="Escape")closeFood();
      else if(k==="Enter")prepareFood();
      else if(/^[0-9]$/.test(k)){
        const index=k==="0"?9:Number(k)-1;
        const button=foodUI.choices[index];
        if(button)selectFood(button.dataset.foodId);
      }
      e.preventDefault();
      return;
    }
    if(activeAcademicQuiz){
      if(k==="Escape")closeAcademicQuiz();
      else if(["1","2","3"].includes(k))answerAcademicQuiz(Number(k)-1);
      e.preventDefault();
      return;
    }
    if(riddleOpen){
      if(k==="Escape")closeRiddle();
      else if(["1","2","3"].includes(k)){
        answerRiddle({"1":"231","2":"312","3":"123"}[k]);
      } else return;
      e.preventDefault();
      return;
    }

    if ((k === "e" || (k === "Enter" && activeDialogue)) && !e.repeat) {
      e.preventDefault();
      interact();
      return;
    }
    if (k === "Escape" && activeDialogue) {
      e.preventDefault();
      closeDialogue();
      return;
    }

    if (allowed.has(k)) {
      held.add(k);
      e.preventDefault();
    }
  });

  window.addEventListener("keyup", e => {
    const k = e.key.length === 1
      ? e.key.toLowerCase()
      : e.key;

    held.delete(k);
  });

  window.addEventListener("blur", () => {
    held.clear();
  });

  document.querySelectorAll("[data-key]").forEach(btn => {
    const k = btn.dataset.key;

    btn.addEventListener("pointerdown", e => {
      e.preventDefault();
      held.add(k);
      btn.setPointerCapture(e.pointerId);
    });

    ["pointerup", "pointercancel", "lostpointercapture"].forEach(evento => {
      btn.addEventListener(evento, () => held.delete(k));
    });
  });

  if (ui.interact) {
    ui.interact.addEventListener("click", interact);
  }
  if (dialogueUI.next) {
    dialogueUI.next.addEventListener("click", advanceDialogue);
  }
  if (dialogueUI.close) {
    dialogueUI.close.addEventListener("click",()=>closeDialogue(false));
  }

  const reset = document.getElementById("reset");

  if (reset) {
    reset.addEventListener("click", () => {
      closeDialogue();
      closeRiddle();
      closeAcademicQuiz();
      closeFood();
      closeSchoolPuzzle();
      closeResidencePuzzle();
      if(pool.active)leavePool();
      if(female.active)leaveResidence("female");
      if(male.active)leaveResidence("male");
      if(school.active)leaveSchool();
      if(restaurant.active)leaveRestaurant();
      if(sports.active)leaveSports();
      if(interior.active)leaveCentral();
      if(academic.active)leaveAcademic();
      player.x = 20;
      player.y = 42;
      near = nearest();
      nearTalker = life.nearestTalker(player.x, player.y, 1.85);
      show("Você voltou à entrada da FAAMA.");
    });
  }

  const questRestart = document.getElementById("questRestart");
  if (questRestart) {
    questRestart.addEventListener("click", () => {
      if (typeof window.confirm === "function" &&
          !window.confirm("Recomeçar A Chave Desaparecida? A Missão 02 também será reiniciada, pois depende da primeira. As recompensas das duas serão apagadas.")) {
        return;
      }
      pendingQuestNotice = null;
      closeDialogue();
      closeRiddle();
      closeAcademicQuiz();
      closeFood();
      closeSchoolPuzzle();
      closeResidencePuzzle();
      if(pool.active)leavePool();
      if(female.active)leaveResidence("female");
      if(male.active)leaveResidence("male");
      if(school.active)leaveSchool();
      if(restaurant.active)leaveRestaurant();
      if(sports.active)leaveSports();
      if(interior.active)leaveCentral();
      if(academic.active)leaveAcademic();
      held.clear();
      quest.restart();
      // Missão 02 depende da primeira: reiniciar a primeira reinicia ambas.
      indoorQuest.reset();
      refreshIndoorQuestUI();
      player.x=20;
      player.y=42;
      nearQuestItem=null;
      nearTalker=life.nearestTalker(player.x,player.y,1.85);
      refreshQuestUI();
      show("Missão reiniciada! Converse com Lia perto da entrada.",5);
    });
  }

  const indoorQuestRestart=document.getElementById("indoorQuestRestart");
  if(indoorQuestRestart){
    indoorQuestRestart.addEventListener("click",()=>{
      if(typeof window.confirm==="function" &&
        !window.confirm("Recomeçar somente O Mistério do Prédio Central? A Missão 01 será preservada."))return;
      closeDialogue();
      closeRiddle();
      pendingQuestNotice=null;
      indoorQuest.reset();
      refreshIndoorQuestUI();
      show("Missão 02 reiniciada. Converse com Marina para começar novamente.",5);
    });
  }
  if(riddleUI.close)riddleUI.close.addEventListener("click",closeRiddle);
  document.querySelectorAll("[data-riddle-answer]").forEach(btn=>{
    btn.addEventListener("click",()=>answerRiddle(btn.dataset.riddleAnswer));
  });

  const academicQuestRestart=document.getElementById("academicQuestRestart");
  if(academicQuestRestart){
    academicQuestRestart.addEventListener("click",()=>{
      if(typeof window.confirm==="function" &&
        !window.confirm("Recomeçar somente O Desafio do Conhecimento? As Missões 01 e 02 serão preservadas."))return;
      pendingQuestNotice=null;
      closeDialogue();
      closeAcademicQuiz();
      academic.restart();
      refreshAcademicUI();
      show("Missão 03 reiniciada. Converse com a professora Helena.",5);
    });
  }
  if(academicQuizUI.close)academicQuizUI.close.addEventListener("click",closeAcademicQuiz);
  academicQuizUI.options.forEach((btn,index)=>{
    btn.addEventListener("click",()=>answerAcademicQuiz(index));
  });

  const sportsQuestRestart=document.getElementById("sportsQuestRestart");
  if(sportsQuestRestart){
    sportsQuestRestart.addEventListener("click",()=>{
      if(typeof window.confirm==="function" &&
        !window.confirm("Recomeçar o Circuito dos Campeões? Isso apaga os 200 XP, a conquista e o recorde esportivo, mas preserva as Missões 01–03."))return;
      pendingSportsStart=false;
      closeDialogue();
      sports.restartProgress();
      refreshSportsUI();
      show("Missão 04 reiniciada. Converse com Rafael para começar.",5);
    });
  }

  const restaurantQuestRestart=document.getElementById("restaurantQuestRestart");
  if(restaurantQuestRestart){
    restaurantQuestRestart.addEventListener("click",()=>{
      if(typeof window.confirm==="function" &&
        !window.confirm("Recomeçar O Restaurante Misterioso? O andamento dos pedidos, o recorde, os 200 XP e a conquista serão apagados. As Missões 01–04 serão preservadas."))return;
      pendingRestaurantStart=false;
      closeDialogue();
      closeFood();
      restaurant.reset();
      refreshRestaurantUI();
      show("Missão 05 reiniciada. Converse com Clara para começar novamente.",5);
    });
  }
  if(foodUI.close)foodUI.close.addEventListener("click",closeFood);
  if(foodUI.prepare)foodUI.prepare.addEventListener("click",prepareFood);
  foodUI.choices.forEach(btn=>{
    btn.addEventListener("click",()=>selectFood(btn.dataset.foodId));
  });

  const schoolQuestRestart=document.getElementById("schoolQuestRestart");
  if(schoolQuestRestart){
    schoolQuestRestart.addEventListener("click",()=>{
      if(typeof window.confirm==="function" &&
        !window.confirm("Recomeçar O Tesouro da FAAMinha? As cinco pistas, a cápsula e os 200 XP da Missão 06 serão apagados. As Missões 01–05 serão preservadas."))return;
      closeDialogue();
      closeSchoolPuzzle();
      school.restart();
      refreshSchoolUI();
      show("Missão 06 reiniciada. Converse com a professora Sofia para começar.",5);
    });
  }
  if(schoolPuzzleUI.close)schoolPuzzleUI.close.addEventListener("click",closeSchoolPuzzle);
  schoolPuzzleUI.choices.forEach((btn,index)=>{
    btn.addEventListener("click",()=>answerSchoolPuzzle(index));
  });

  const poolRestart=document.getElementById("poolQuestRestart");
  if(poolRestart)poolRestart.addEventListener("click",()=>{
    if(typeof window.confirm==="function" &&
      !window.confirm("Recomeçar o Desafio Aquático? O recorde, a conquista e os 200 XP da Missão 07 serão apagados. As demais missões serão preservadas."))return;
    pendingPoolStart=false;closeDialogue();pool.restartProgress();
    refreshPoolUI();refreshFinalGateUI();
    show("Desafio Aquático reiniciado. Converse com Nara para começar.",5);
  });
  for(const kind of ["female","male"]){
    const button=document.getElementById(kind+"QuestRestart");
    if(!button)continue;
    button.addEventListener("click",()=>{
      const o=kind==="female"?female:male;
      const id=kind==="female"?"08":"09";
      if(typeof window.confirm==="function" &&
        !window.confirm("Recomeçar a Missão "+id+" do "+o.conf.name+
          "? Isso apagará os 200 XP e a conquista dessa missão, mas preservará todas as outras."))return;
      closeDialogue();closeResidencePuzzle();
      o.restart();
      refreshResidenceUI(kind);refreshFinalGateUI();
      show("Missão "+id+" reiniciada. Converse com "+o.npc.name+".",5);
    });
  }
  if(residencePuzzleUI.close)residencePuzzleUI.close.addEventListener("click",closeResidencePuzzle);
  residencePuzzleUI.choices.forEach((btn,index)=>{
    btn.addEventListener("click",()=>answerResidencePuzzle(index));
  });

  function changeZoom(d) {
    zoom = Math.max(
      0.7,
      Math.min(1.6, Math.round((zoom + d) * 10) / 10)
    );

    if (ui.zoom) {
      ui.zoom.textContent = Math.round(zoom * 100) + "%";
    }
  }

  const zoomIn = document.getElementById("zoomIn");
  const zoomOut = document.getElementById("zoomOut");

  if (zoomIn) {
    zoomIn.addEventListener("click", () => changeZoom(0.1));
  }

  if (zoomOut) {
    zoomOut.addEventListener("click", () => changeZoom(-0.1));
  }

  refreshQuestUI();
  refreshIndoorQuestUI();
  refreshAcademicUI();
  refreshSportsUI();
  refreshRestaurantUI();
  refreshSchoolUI();
  refreshPoolUI();
  refreshResidenceUI("female");
  refreshResidenceUI("male");
  refreshTotalXP();
  refreshFinalGateUI();
  console.log("FAAMA Explorer: JavaScript iniciado!");

  requestAnimationFrame(render);
})();
