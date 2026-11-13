/* FAAMA Explorer — planta jogável v2.
   Coordenadas estilizadas com base nas marcações e fotos fornecidas pelo usuário.
   Eixos x/y são posições horizontais e verticais do mapa, não são GPS. */
window.FAAMA_MAP = {
  sites: [
    { id:"sports", name:"COMPLEXO ESPORTIVO", short:"Complexo esportivo", x:3, y:12, w:6, h:5, z:30,
      type:"sports", roof:"#276cbd", wall:"#e9ddc4", side:"#b8c7c2",
      info:"Complexo esportivo: quadras, ginásio e desafios de energia." },
    { id:"pool", name:"PISCINA", short:"Piscina", x:10, y:7, w:5, h:3, z:8,
      type:"pool", roof:"#b7dec9", wall:"#f0ebd6", side:"#a7beb6",
      info:"Piscina da FAAMA: área de lazer e atividades aquáticas." },
    { id:"female", name:"RESIDENCIAL FEMININO", short:"Residencial feminino", x:16, y:8, w:6, h:4, z:69,
      type:"female", roof:"#b6c9c2", wall:"#f2ece0", side:"#d8cbd0",
      info:"Residencial feminino: fachada envidraçada com moldura vermelha, conforme a referência." },
    { id:"restaurant", name:"RESTAURANTE", short:"Restaurante", x:23, y:11, w:4, h:4, z:38,
      type:"restaurant", roof:"#4c5258", wall:"#737f7b", side:"#414b4c",
      info:"Restaurante: refeição e descanso entre as atividades. Prédio separado dos residenciais." },
    { id:"school", name:"FAAMINHA", short:"FAAMinha", x:4, y:27, w:6, h:4, z:28,
      type:"school", roof:"#2062b1", wall:"#95c753", side:"#c8d7bb",
      info:"FAAMinha: escola verde, com cobertura azul, conforme a fotografia enviada." },
    { id:"central", name:"PRÉDIO CENTRAL", short:"Prédio central", x:16, y:24, w:6, h:4, z:86,
      type:"central", roof:"#4cb79e", wall:"#edba38", side:"#236bc2",
      info:"Prédio central: primeira aventura, encontre a chave e evite os desafios do campus." },
    { id:"male", name:"RESIDENCIAL MASCULINO", short:"Residencial masculino", x:28, y:10, w:5, h:4, z:65,
      type:"male", roof:"#34a18b", wall:"#f6efe0", side:"#c9d6c7",
      info:"Residencial masculino: edifício com telhado verde e faixa azul/roxa, no canto superior direito do campus." },
    { id:"academic", name:"PRÉDIO ACADÊMICO", short:"Prédio acadêmico", x:26, y:29, w:6, h:4, z:68,
      type:"academic", roof:"#66747d", wall:"#edf1e8", side:"#c8d6d6",
      info:"Prédio acadêmico: dois andares, salas de aula e atividades universitárias." },
    { id:"church", name:"IGREJA DA FAAMA", short:"Igreja da FAAMA", x:4, y:37, w:5, h:4, z:75,
      type:"church", roof:"#bc6438", wall:"#f1dfc0", side:"#d0b092",
      info:"Igreja da FAAMA: ponto importante da aventura e das atividades do campus." }
  ],
  roads: [
    // A via principal liga a portaria à praça do Prédio Central.
    [[20,43],[20,36],[19,32],[19,29]],
    // Contorno do prédio central em direção aos residenciais e piscina.
    [[19,22],[19,19],[18,15],[18,12]],
    // Lado esquerdo: igreja, FAAMinha, quadras e piscina.
    [[20,36],[11,35],[8,32],[5,31],[5,20],[5,15],[11,10]],
    // Lado direito: Prédio Acadêmico, restaurante e Residencial Masculino.
    [[20,36],[26,37],[30,34],[30,27],[29,19],[27,16],[25,15],[30,13]],
    // Passeio transversal ao norte do prédio central.
    [[5,21],[11,21],[19,21],[28,21]],
    [[19,29],[23,28],[25,25],[28,21]],
    // Acesso à igreja.
    [[11,35],[7,40]],
    // Rotas de ligação no setor superior.
    [[18,15],[12,13],[11,10]],
    [[24,21],[24,16],[25,15]]
  ]};
