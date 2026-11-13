/* FAAMA Explorer 2.5 — Missão 02: O Mistério do Prédio Central.
 * História fictícia, independente do desenho do campus e da Missão 01. */
"use strict";

window.createFaamaIndoorQuest = function createFaamaIndoorQuest({storage,firstQuest}) {
  const KEY="faama-explorer-quest-02-v1";
  const clues=[
    {id:"mural",name:"Aviso na recepção",digit:"3",
      text:"Atrás de um aviso há uma anotação: 'Primeiro número: 3'."},
    {id:"quadro",name:"Anotação no quadro",digit:"1",
      text:"No canto do quadro, alguém escreveu: 'Segundo número: 1'."},
    {id:"estante",name:"Marcador de livro",digit:"2",
      text:"Um marcador entre os livros diz: 'Terceiro número: 2'."}
  ];
  const allowed=new Set(clues.map(c=>c.id));
  const blank=()=>({started:false,found:[],solved:false,hasDocument:false,completed:false});
  function load(){
    try{
      const parsed=JSON.parse(storage?.getItem(KEY)||"null");
      if(!parsed||parsed.version!==1)return blank();
      const found=[...new Set(Array.isArray(parsed.found)?
        parsed.found.filter(id=>allowed.has(id)):[])];
      const all=found.length===clues.length;
      const completed=all&&parsed.completed===true&&parsed.hasDocument===true&&parsed.solved===true;
      const solved=all&&parsed.solved===true;
      const hasDocument=solved&&parsed.hasDocument===true;
      return {
        started:parsed.started===true||found.length>0||solved,
        found,solved,hasDocument,completed
      };
    }catch(_err){return blank()}
  }
  const state=load();
  function save(){
    try{storage?.setItem(KEY,JSON.stringify({version:1,...state}))}
    catch(_err){/* localStorage pode estar indisponível */ }
  }
  function unlocked(){return firstQuest.progress().completed===true;}
  function stage(){
    if(!unlocked())return "locked";
    if(state.completed)return "completed";
    if(!state.started)return "ready";
    if(state.hasDocument)return "return";
    if(state.solved)return "document";
    if(state.found.length===clues.length)return "riddle";
    return "clues";
  }
  function progress(){
    return {
      stage:stage(),unlocked:unlocked(),started:state.started,
      found:[...state.found],solved:state.solved,
      hasDocument:state.hasDocument,completed:state.completed,
      xp:state.completed&&unlocked()?150:0,
      achievement:state.completed&&unlocked()?"Detetive do Prédio Central":null,
      clues:clues.map(c=>({id:c.id,name:c.name,found:state.found.includes(c.id)})),
      objective:objective()
    };
  }
  function objective(){
    const s=stage();
    if(s==="locked")return "Conclua A Chave Desaparecida para liberar esta missão.";
    if(s==="ready")return "Converse com Marina na recepção para começar a Missão 02.";
    if(s==="clues")return "Investigue o mural, o quadro e a estante: "+
      (3-state.found.length)+" pista(s) restante(s).";
    if(s==="riddle")return "Vá ao armário da recepção e descubra a combinação de três dígitos.";
    if(s==="document")return "Armário aberto! Examine-o novamente para pegar o documento.";
    if(s==="return")return "Documento na mochila! Entregue-o à Marina na recepção.";
    return "Missão 02 concluída! O mistério do Prédio Central foi resolvido.";
  }
  function talkToMarina(){
    const s=stage();
    if(s==="locked")return {changed:false,lines:[
      "Olá! Primeiro ajude Lia a recuperar a chave desaparecida, lá fora.",
      "Depois volte aqui. Tenho outro mistério esperando por você!"
    ]};
    if(s==="ready"){
      state.started=true;save();
      return {changed:true,message:"Missão 02 iniciada! Investigue três pistas nas salas.",lines:[
        "Que bom que você voltou! Um documento importante foi guardado em algum lugar do Prédio Central.",
        "O armário de arquivos está fechado e a combinação ficou dividida em três pistas.",
        "Investigue o mural da recepção, o quadro da sala de aula e a estante da sala de estudos.",
        "Descubra o código, abra o armário e traga o documento para mim!"
      ]};
    }
    if(s==="return"){
      state.completed=true;save();
      return {changed:true,rewarded:true,
        message:"Missão 02 concluída! +150 XP e a conquista Detetive do Prédio Central!",
        lines:[
          "Você encontrou o documento e resolveu o enigma! Excelente trabalho!",
          "Aqui estão seus 150 XP e a conquista 'Detetive do Prédio Central'.",
          "Agora já podemos organizar os documentos. Obrigada pela ajuda!"
        ]};
    }
    if(s==="clues")return {changed:false,lines:[
      "Precisamos descobrir os três números. Você já encontrou "+
        state.found.length+" de 3 pistas.",
      "Lembre-se: mural da recepção, quadro da sala de aula e estante de livros."
    ]};
    if(s==="riddle")return {changed:false,lines:[
      "Você já tem os três números. Vá ao armário da recepção e digite-os na ordem certa."
    ]};
    if(s==="document")return {changed:false,lines:[
      "Você abriu o armário! Examine-o mais uma vez para recolher o documento."
    ]};
    if(s==="completed")return {changed:false,lines:[
      "Os documentos estão seguros. Sua conquista está registrada!",
      "Continue explorando o campus e descubra outros lugares."
    ]};
    return {changed:false,lines:["Volte ao armário para buscar o documento e traga-o para mim."]};
  }
  function inspect(id){
    const s=stage();
    if(s==="locked"||s==="ready"||s==="completed")return null;
    const clue=clues.find(c=>c.id===id);
    if(clue && s==="clues"){
      if(state.found.includes(id))return {changed:false,message:"Você já registrou esta pista."};
      state.found.push(id);save();
      return {changed:true,message:clue.text+
        (state.found.length===3?" Todas as pistas encontradas! Procure o armário.":"")};
    }
    if(id==="arquivo"){
      if(s==="clues")return {changed:false,message:"O armário está trancado. Investigue as três pistas antes de tentar abri-lo."};
      if(s==="riddle")return {changed:false,openRiddle:true};
      if(s==="document"){
        state.hasDocument=true;save();
        return {changed:true,message:"Documento encontrado! Volte à recepção e entregue-o à Marina."};
      }
      if(s==="return")return {changed:false,message:"O documento já está na mochila. Entregue-o à Marina."};
    }
    return null;
  }
  function answer(code){
    if(stage()!=="riddle")return {correct:false,ignored:true};
    if(String(code)!=="312"){
      return {correct:false,ignored:false,message:"Combinação incorreta. Releia as pistas e tente novamente."};
    }
    state.solved=true;save();
    return {correct:true,changed:true,
      message:"Armário aberto! O documento está lá dentro. Pressione E para pegá-lo."};
  }
  function reset(){
    Object.assign(state,blank());save();
  }
  function markers(){
    const s=stage();
    if(s==="clues")return clues.filter(c=>!state.found.includes(c.id))
      .map(c=>({id:c.id,kind:"clue"}));
    if(["riddle","document"].includes(s))return [
      {id:"arquivo",kind:s==="riddle"?"lock":"document"}];
    if(s==="return")return [{id:"marina",kind:"delivery"}];
    return [];
  }
  return {stage,progress,objective,talkToMarina,inspect,answer,reset,markers};
};
