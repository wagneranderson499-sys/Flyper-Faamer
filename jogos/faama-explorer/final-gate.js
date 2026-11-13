/* FAAMA Explorer — portão da fase final (Igreja da FAAMA).
   A igreja só abre quando TODAS as nove missões anteriores estiverem concluídas.
   As missões futuras são intencionalmente obrigatórias: falta de implementação NÃO libera a igreja.
   Integração de missões futuras no motor:
      window.FAAMA_EXTRA_QUESTS = window.FAAMA_EXTRA_QUESTS || {};
      window.FAAMA_EXTRA_QUESTS.pool = poolQuest;       // .progress().completed === true
      window.FAAMA_EXTRA_QUESTS.female = femaleQuest;   // .progress().completed === true
      window.FAAMA_EXTRA_QUESTS.male = maleQuest;       // .progress().completed === true
   Não persiste "desbloqueado": sempre calcula a partir dos salvamentos reais das missões.
*/
"use strict";
window.createFaamaFinalGate = function createFaamaFinalGate({getProgress}){
  const requirements=Object.freeze([
    {id:"quest01",name:"A Chave Desaparecida"},
    {id:"quest02",name:"Mistério do Prédio Central"},
    {id:"academic",name:"Desafio do Conhecimento"},
    {id:"sports",name:"Circuito dos Campeões"},
    {id:"restaurant",name:"O Restaurante Misterioso"},
    {id:"school",name:"O Tesouro da FAAMinha"},
    {id:"pool",name:"Desafio Aquático — Piscina"},
    {id:"female",name:"Missão do Residencial Feminino"},
    {id:"male",name:"Missão do Residencial Masculino"}
  ]);
  function progress(){
    let values={};
    try{
      const found=getProgress();
      if(found&&typeof found==="object")values=found;
    }catch(_err){/* Fail closed: qualquer erro mantém a Igreja bloqueada. */}
    const chapters=requirements.map(item=>{
      const completed=values[item.id]?.completed===true;
      return {id:item.id,name:item.name,completed};
    });
    const done=chapters.filter(c=>c.completed).length;
    const missing=chapters.filter(c=>!c.completed);
    return {unlocked:missing.length===0,done,total:chapters.length,chapters,missing};
  }
  function notice(){
    const p=progress();
    if(p.unlocked)return "A Igreja foi desbloqueada! A última aventura estará disponível quando a fase final estiver implementada.";
    return "🔒 Igreja bloqueada: conclua todas as outras missões primeiro ("+
      p.done+"/"+p.total+"). Faltam: "+p.missing.map(m=>m.name).join(", ")+".";
  }
  return {progress,notice};
};
