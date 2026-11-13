/* FAAMA Explorer — acesso livre temporário para testes.
   As nove missões continuam sendo contadas normalmente, mas nenhuma é
   requisito de entrada na Igreja. Para restaurar a progressão, reverta
   unlocked:true para unlocked:missing.length===0 e reative os avisos.
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
    }catch(_err){/* A ausência de dados não impede explorar o campus. */}
    const chapters=requirements.map(item=>{
      const completed=values[item.id]?.completed===true;
      return {id:item.id,name:item.name,completed};
    });
    const done=chapters.filter(c=>c.completed).length;
    const missing=chapters.filter(c=>!c.completed);
    return {unlocked:true,done,total:chapters.length,chapters,missing};
  }
  function notice(){
    const p=progress();
    return "🔓 Modo de testes: todas as áreas estão abertas. Missões concluídas: "+p.done+"/"+p.total+".";
  }
  return {progress,notice};
};
