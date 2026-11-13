# FAAMA Explorer 3.3 — Roteiro de teste no navegador

Este roteiro acompanha a versão **A Luz que Permanece**. O jogo roda no Live Server, sem instalação de dependências.

## 1. Preparação

No terminal do VS Code:

```powershell
git fetch origin
git switch feat/faama-explorer-visual-v2
git pull origin feat/faama-explorer-visual-v2
```

Abra `jogos/faama-explorer/index.html` com **Open with Live Server**.

Controles: **WASD/setas** para mover, **E** para interagir, **1/2/3** para responder e **Esc** para fechar. O progresso é salvo no `localStorage` do navegador.

## 2. Teste visual

- [ ] Todos os nove locais mantêm suas posições no mapa.
- [ ] HUD, minimapa, diálogos e painéis ficam legíveis no desktop.
- [ ] Verificar layout no modo celular das ferramentas do navegador (F12).
- [ ] Na Igreja, conferir bancos, corredor, púlpito, instrumentos, vitrais, Livro, painéis e Samuel.
- [ ] Personagem não atravessa bancos/móveis; movimentação e saída com E funcionam.
- [ ] Luz e animação final não escondem os botões da tela de vitória.

## 3. Desbloqueio e missão final

- [ ] Com **menos de nove missões concluídas**, a Igreja mostra **BLOQUEADA** e não abre.
- [ ] Com **nove missões concluídas**, a Igreja mostra **LIBERADA**; apenas entrar não deve zerar o jogo.
- [ ] Conversar com Samuel e resolver **nove lembranças** no Livro da Jornada.
- [ ] Resposta errada não avança; fechar/reabrir o desafio mantém a página atual.
- [ ] Atualizar o navegador no meio do Livro mantém as páginas concluídas.
- [ ] Resolver os painéis na sequência **Fé → Esperança → Amor**.
- [ ] Antes da conversa final com Samuel, ainda não há recompensa da Missão 10.
- [ ] **Cancelar a conversa final com Esc** não deve entregar XP nem iniciar a animação.
- [ ] Completar todas as falas de Samuel concede **200 XP**, conquista **Lenda da FAAMA** e inicia a animação.
- [ ] Tela final apresenta **10/10 missões**, **1.850 XP**, **100%**, recordes e retrospectiva.
- [ ] **Ver créditos**, **Continuar explorando** e **Rever celebração** funcionam.
- [ ] Recarregar a página conserva a vitória, XP e recordes; não duplica a recompensa.

## 4. Regressão dos locais antigos

- [ ] Entrar, caminhar e sair do Prédio Central e do Prédio Acadêmico.
- [ ] Entrar, caminhar e sair do Complexo Esportivo e do Restaurante.
- [ ] Entrar, caminhar e sair da FAAMinha e da Piscina.
- [ ] Entrar, caminhar e sair dos Residenciais Feminino e Masculino.

## 5. Salvamento e reinício

**Atenção:** testar os botões de reinício pode apagar seu progresso local.

- [ ] Cancelar reinício não apaga nada.
- [ ] Reiniciar só a Igreja remove apenas o progresso/XP da Missão 10.
- [ ] Reiniciar uma missão anterior fecha o portão da Igreja novamente.
- [ ] Confirmar **Recomeçar toda a jornada** zera as dez missões, os recordes e volta à entrada.

## 6. Relato de falhas

Se encontrar defeito, registre: **local**, **ação**, **resultado esperado**, **resultado observado** e, se possível, print ou mensagem do Console (F12).

> Cenários internos são representações lúdicas. Testes simulados de lógica e Canvas foram executados; este roteiro existe para a validação visual em um navegador real.
