const canvas = document.getElementById("tabuleiro");
const ctx = canvas.getContext("2d");

// ELEMENTOS HTML
const menuJogo = document.getElementById("menuJogo");
const areaJogo = document.getElementById("areaJogo");
const mensagemJogo = document.getElementById("mensagemJogo");
const pontuacaoHTML = document.getElementById("pontuacao");
const faseHTML = document.getElementById("fase");
const vidasHTML = document.getElementById("vidas");
const mensagemEmoji = document.getElementById("mensagemEmoji");
const mensagemTitulo = document.getElementById("mensagemTitulo");
const mensagemTexto = document.getElementById("mensagemTexto");
const botaoMensagem = document.getElementById("botaoMensagem");
const botaoPausar = document.getElementById("botaoPausar");

// CONFIGURAÇÕES
const LARGURA = canvas.width;
const ALTURA = canvas.height;

const teclas = {
    esquerda: false,
    direita: false,
    atirar: false
};

let estadoJogo = "menu";
let pontuacao = 0;
let vidas = 3;
let fase = 1;

let ultimoTempo = 0;
let tempoDisparo = 0;
let intervaloInimigos = 0;
let direcaoInimigos = 1;

let estrelas = [];

// NAVE DO JOGADOR
const nave = {
    x: LARGURA / 2 - 20,
    y: ALTURA - 65,
    largura: 40,
    altura: 30,
    velocidade: 310
};

// TIROS
let tirosJogador = [];
let tirosInimigos = [];
let inimigos = [];

// CRIA ESTRELAS NO FUNDO
function criarEstrelas() {
    estrelas = [];

    for (let i = 0; i < 75; i++) {
        estrelas.push({
            x: Math.random() * LARGURA,
            y: Math.random() * ALTURA,
            tamanho: Math.random() * 2 + 1,
            brilho: Math.random() * 0.7 + 0.3
        });
    }
}

// CRIA UMA ONDA DE INIMIGOS
function criarInimigos() {
    inimigos = [];

    const linhas = Math.min(3 + fase, 6);
    const colunas = 8;
    const largura = 32;
    const altura = 25;
    const espacoX = 48;
    const espacoY = 45;

    const larguraTotal = (colunas - 1) * espacoX + largura;
    const inicioX = (LARGURA - larguraTotal) / 2;

    for (let linha = 0; linha < linhas; linha++) {
        for (let coluna = 0; coluna < colunas; coluna++) {
            inimigos.push({
                x: inicioX + coluna * espacoX,
                y: 65 + linha * espacoY,
                largura,
                altura,
                linha
            });
        }
    }

    direcaoInimigos = 1;
    intervaloInimigos = 0;
}

// ATUALIZA INFORMAÇÕES
function atualizarPainel() {
    pontuacaoHTML.textContent = String(pontuacao).padStart(4, "0");
    faseHTML.textContent = String(fase).padStart(2, "0");
    vidasHTML.textContent = "❤️".repeat(vidas);
}

// DESENHA ESTRELAS
function desenharEstrelas() {
    estrelas.forEach(estrela => {
        ctx.globalAlpha = estrela.brilho;
        ctx.fillStyle = "#ffffff";

        ctx.beginPath();
        ctx.arc(
            estrela.x,
            estrela.y,
            estrela.tamanho,
            0,
            Math.PI * 2
        );

        ctx.fill();
    });

    ctx.globalAlpha = 1;
}

// DESENHA NAVE
function desenharNave() {
    ctx.save();

    ctx.shadowColor = "#39ff88";
    ctx.shadowBlur = 20;
    ctx.fillStyle = "#39ff88";

    ctx.beginPath();
    ctx.moveTo(nave.x + nave.largura / 2, nave.y);
    ctx.lineTo(nave.x + nave.largura, nave.y + nave.altura);
    ctx.lineTo(nave.x + nave.largura / 2, nave.y + nave.altura - 8);
    ctx.lineTo(nave.x, nave.y + nave.altura);

    ctx.closePath();
    ctx.fill();

    // CABINE DA NAVE
    ctx.fillStyle = "#ffffff";

    ctx.beginPath();
    ctx.arc(
        nave.x + nave.largura / 2,
        nave.y + 17,
        5,
        0,
        Math.PI * 2
    );

    ctx.fill();
    ctx.restore();
}

// DESENHA UM INIMIGO
function desenharInimigo(inimigo) {
    ctx.save();

    const cores = ["#ff3cac", "#a970ff", "#36c5ff"];
    const cor = cores[inimigo.linha % cores.length];

    ctx.fillStyle = cor;
    ctx.shadowColor = cor;
    ctx.shadowBlur = 12;

    const x = inimigo.x;
    const y = inimigo.y;
    const w = inimigo.largura;
    const h = inimigo.altura;

    // Corpo
    ctx.fillRect(x + 5, y + 5, w - 10, h - 10);

    // Cabeça
    ctx.fillRect(x + 10, y, w - 20, 8);

    // Pernas
    ctx.fillRect(x, y + h - 8, 8, 8);
    ctx.fillRect(x + w - 8, y + h - 8, 8, 8);

    // Olhos
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#ffffff";

    ctx.fillRect(x + 9, y + 9, 5, 5);
    ctx.fillRect(x + w - 14, y + 9, 5, 5);

    ctx.restore();
}

// DESENHA OS TIROS
function desenharTiros() {
    ctx.save();

    tirosJogador.forEach(tiro => {
        ctx.shadowColor = "#39ff88";
        ctx.shadowBlur = 12;
        ctx.fillStyle = "#39ff88";
        ctx.fillRect(tiro.x, tiro.y, tiro.largura, tiro.altura);
    });

    tirosInimigos.forEach(tiro => {
        ctx.shadowColor = "#ff3cac";
        ctx.shadowBlur = 12;
        ctx.fillStyle = "#ff3cac";
        ctx.fillRect(tiro.x, tiro.y, tiro.largura, tiro.altura);
    });

    ctx.restore();
}

// DESENHA O JOGO
function desenharJogo() {
    ctx.fillStyle = "#050814";
    ctx.fillRect(0, 0, LARGURA, ALTURA);

    desenharEstrelas();

    // Linha do chão
    ctx.strokeStyle = "#36c5ff35";
    ctx.lineWidth = 2;

        ctx.beginPath();
    ctx.moveTo(0, ALTURA - 20);
    ctx.lineTo(LARGURA, ALTURA - 20);
    ctx.stroke();

    desenharNave();
    inimigos.forEach(desenharInimigo);
    desenharTiros();
}

// MOVIMENTAÇÃO DA NAVE
function movimentarNave(delta) {
    if (teclas.esquerda) {
        nave.x -= nave.velocidade * delta;
    }

    if (teclas.direita) {
        nave.x += nave.velocidade * delta;
    }

    // Impede a nave de sair da tela
    nave.x = Math.max(
        0,
        Math.min(LARGURA - nave.largura, nave.x)
    );
}

// DISPARA UM TIRO
function disparar() {
    if (tempoDisparo > 0) return;

    tirosJogador.push({
        x: nave.x + nave.largura / 2 - 2,
        y: nave.y,
        largura: 4,
        altura: 15,
        velocidade: 500
    });

    tempoDisparo = 0.3;
}

// MOVIMENTA OS TIROS DO JOGADOR
function movimentarTirosJogador(delta) {
    tirosJogador.forEach(tiro => {
        tiro.y -= tiro.velocidade * delta;
    });

    tirosJogador = tirosJogador.filter(
        tiro => tiro.y + tiro.altura > 0
    );
}

// MOVIMENTA OS TIROS DOS INIMIGOS
function movimentarTirosInimigos(delta) {
    tirosInimigos.forEach(tiro => {
        tiro.y += tiro.velocidade * delta;
    });

    tirosInimigos = tirosInimigos.filter(
        tiro => tiro.y < ALTURA
    );
}

// MOVIMENTAÇÃO DOS INIMIGOS
function movimentarInimigos(delta) {
    const velocidade = 30 + fase * 8;

    inimigos.forEach(inimigo => {
        inimigo.x += velocidade * direcaoInimigos * delta;
    });

    const encostouDireita = inimigos.some(
        inimigo => inimigo.x + inimigo.largura >= LARGURA - 8
    );

    const encostouEsquerda = inimigos.some(
        inimigo => inimigo.x <= 8
    );

    if (
        (encostouDireita && direcaoInimigos === 1) ||
        (encostouEsquerda && direcaoInimigos === -1)
    ) {
        direcaoInimigos *= -1;

        inimigos.forEach(inimigo => {
            inimigo.y += 15;
        });
    }
}

// INIMIGOS DISPARAM
function inimigosDisparam(delta) {
    intervaloInimigos -= delta;

    if (intervaloInimigos > 0 || inimigos.length === 0) {
        return;
    }

    const quantidade = Math.min(
        1 + Math.floor(fase / 3),
        3
    );

    for (let i = 0; i < quantidade; i++) {
        if (inimigos.length === 0) break;

        const escolhido = inimigos[
            Math.floor(Math.random() * inimigos.length)
        ];

        tirosInimigos.push({
            x: escolhido.x + escolhido.largura / 2 - 2,
            y: escolhido.y + escolhido.altura,
            largura: 5,
            altura: 13,
            velocidade: 190 + fase * 12
        });
    }

    intervaloInimigos = Math.max(0.45, 1.5 - fase * 0.08);
}

// VERIFICA COLISÕES ENTRE TIROS E INIMIGOS
function verificarColisoes() {
    for (let indiceTiro = tirosJogador.length - 1; indiceTiro >= 0; indiceTiro--) {
        const tiro = tirosJogador[indiceTiro];

        for (let i = inimigos.length - 1; i >= 0; i--) {
            const inimigo = inimigos[i];

            const colidiu =
                tiro.x < inimigo.x + inimigo.largura &&
                tiro.x + tiro.largura > inimigo.x &&
                tiro.y < inimigo.y + inimigo.altura &&
                tiro.y + tiro.altura > inimigo.y;

            if (colidiu) {
                inimigos.splice(i, 1);
                tirosJogador.splice(indiceTiro, 1);

                pontuacao += 10;
                atualizarPainel();

                break;
            }
        }
    }
}

// VERIFICA SE UM TIRO ATINGIU A NAVE
function verificarDanoNave() {
    for (let i = tirosInimigos.length - 1; i >= 0; i--) {
        const tiro = tirosInimigos[i];

        const colidiu =
            tiro.x < nave.x + nave.largura &&
            tiro.x + tiro.largura > nave.x &&
            tiro.y < nave.y + nave.altura &&
            tiro.y + tiro.altura > nave.y;

        if (colidiu) {
            tirosInimigos.splice(i, 1);
            perderVida();
            break;
        }
    }
}

// PERDE UMA VIDA
function perderVida() {
    vidas--;
    atualizarPainel();

    nave.x = LARGURA / 2 - nave.largura / 2;
    tirosInimigos = [];

    if (vidas <= 0) {
        finalizarJogo();
    }
}

// VERIFICA SE OS INIMIGOS CHEGARAM AO FINAL
function verificarInvasao() {
    const invasorChegou = inimigos.some(
        inimigo => inimigo.y + inimigo.altura >= nave.y
    );

    if (invasorChegou) {
        finalizarJogo();
    }
}

// PASSA PARA A PRÓXIMA FASE
function verificarFase() {
    if (inimigos.length === 0) {
        fase++;

        tirosJogador = [];
        tirosInimigos = [];

        criarInimigos();
        atualizarPainel();

        mostrarMensagem(
            "🚀",
            `FASE ${fase}`,
            "Os invasores estão ficando mais fortes!",
            "CONTINUAR"
        );

        estadoJogo = "transicao";
    }
}

// FINALIZA O JOGO
function finalizarJogo() {
    estadoJogo = "finalizado";

    mostrarMensagem(
        "💥",
        "GAME OVER",
        `Sua pontuação foi ${pontuacao} pontos!`,
        "JOGAR NOVAMENTE"
    );

    botaoPausar.textContent = "⏸ PAUSAR";
}

// EXIBE MENSAGEM
function mostrarMensagem(emoji, titulo, texto, botao) {
    mensagemEmoji.textContent = emoji;
    mensagemTitulo.textContent = titulo;
    mensagemTexto.textContent = texto;
    botaoMensagem.textContent = botao;

    mensagemJogo.classList.remove("escondida");
}

// ESCONDE MENSAGEM
function esconderMensagem() {
    mensagemJogo.classList.add("escondida");
}

// ATUALIZA O JOGO
function atualizarJogo(delta) {
    if (estadoJogo !== "jogando") return;

    movimentarNave(delta);

    tempoDisparo -= delta;

    if (teclas.atirar) {
        disparar();
    }

    movimentarTirosJogador(delta);
    movimentarTirosInimigos(delta);
    movimentarInimigos(delta);
    inimigosDisparam(delta);

    verificarColisoes();
    verificarDanoNave();

    if (estadoJogo !== "jogando") return;

    verificarInvasao();

    if (estadoJogo !== "jogando") return;

    verificarFase();
}

// INICIA UMA NOVA PARTIDA
function iniciarJogo() {
    pontuacao = 0;
    vidas = 3;
    fase = 1;

    nave.x = LARGURA / 2 - nave.largura / 2;

    tirosJogador = [];
    tirosInimigos = [];

    tempoDisparo = 0;
    teclas.esquerda = false;
    teclas.direita = false;
    teclas.atirar = false;

    criarEstrelas();
    criarInimigos();

    atualizarPainel();

    menuJogo.classList.add("escondida");
    areaJogo.classList.remove("escondida");

    esconderMensagem();

    estadoJogo = "jogando";

    botaoPausar.textContent = "⏸ PAUSAR";
}

// PAUSAR E CONTINUAR
function alternarPausa() {
    if (estadoJogo === "jogando") {
        estadoJogo = "pausado";

        teclas.esquerda = false;
        teclas.direita = false;
        teclas.atirar = false;

        mostrarMensagem(
            "⏸️",
            "JOGO PAUSADO",
            "Descanse um pouco e prepare-se para continuar.",
            "CONTINUAR"
        );

        botaoPausar.textContent = "▶ CONTINUAR";

    } else if (estadoJogo === "pausado") {
        estadoJogo = "jogando";

        esconderMensagem();

        botaoPausar.textContent = "⏸ PAUSAR";
    }
}

// LOOP PRINCIPAL
function loop(tempoAtual) {
    const delta = Math.min(
        (tempoAtual - ultimoTempo) / 1000 || 0,
        0.035
    );

    ultimoTempo = tempoAtual;

    atualizarJogo(delta);
    desenharJogo();

    requestAnimationFrame(loop);
}
// BOTÃO INICIAR
document.getElementById("botaoIniciar").addEventListener("click", () => {
    iniciarJogo();
});

// BOTÃO PAUSAR
botaoPausar.addEventListener("click", () => {
    alternarPausa();
});

// BOTÃO REINICIAR
document.getElementById("botaoReiniciar").addEventListener("click", () => {
    iniciarJogo();
});

// BOTÃO DA MENSAGEM
botaoMensagem.addEventListener("click", () => {
    if (estadoJogo === "pausado") {
        alternarPausa();

    } else if (estadoJogo === "transicao") {
        estadoJogo = "jogando";
        esconderMensagem();

    } else if (estadoJogo === "finalizado") {
        iniciarJogo();
    }
});

// VOLTAR AO MENU PRINCIPAL
document.getElementById("botaoVoltar").addEventListener("click", () => {
    const confirmar = confirm(
        "Deseja sair do Space Invaders e voltar ao menu principal?"
    );

    if (confirmar) {
        window.location.href = "../../index.html";
    }
});

// CONTROLES DO TECLADO
document.addEventListener("keydown", evento => {
    const tecla = evento.key.toLowerCase();

    if (["arrowleft", "arrowright", " "].includes(tecla)) {
        evento.preventDefault();
    }

    if (tecla === "escape" && estadoJogo === "jogando") {
        alternarPausa();
        return;
    }

    if (estadoJogo !== "jogando") return;

    if (tecla === "arrowleft" || tecla === "a") {
        teclas.esquerda = true;
    }

    if (tecla === "arrowright" || tecla === "d") {
        teclas.direita = true;
    }

    if (tecla === " ") {
        teclas.atirar = true;
    }
});

document.addEventListener("keyup", evento => {
    const tecla = evento.key.toLowerCase();

    if (tecla === "arrowleft" || tecla === "a") {
        teclas.esquerda = false;
    }

    if (tecla === "arrowright" || tecla === "d") {
        teclas.direita = false;
    }

    if (tecla === " ") {
        teclas.atirar = false;
    }
});

// CONTROLES TOUCH
const botoesControle = document.querySelectorAll("[data-controle]");

botoesControle.forEach(botao => {
    const controle = botao.dataset.controle;

    function pressionar(evento) {
        evento.preventDefault();

        if (estadoJogo !== "jogando") return;

        if (controle === "esquerda") {
            teclas.esquerda = true;
        }

        if (controle === "direita") {
            teclas.direita = true;
        }

        if (controle === "atirar") {
            teclas.atirar = true;
        }
    }

    function soltar(evento) {
        evento.preventDefault();

        if (controle === "esquerda") {
            teclas.esquerda = false;
        }

        if (controle === "direita") {
            teclas.direita = false;
        }

        if (controle === "atirar") {
            teclas.atirar = false;
        }
    }

    botao.addEventListener("pointerdown", pressionar);
    botao.addEventListener("pointerup", soltar);
    botao.addEventListener("pointercancel", soltar);
    botao.addEventListener("lostpointercapture", soltar);

    botao.addEventListener("pointerleave", evento => {
        if (evento.buttons === 0) {
            soltar(evento);
        }
    });
});

// LIMPA OS CONTROLES QUANDO A PÁGINA PERDE O FOCO
window.addEventListener("blur", () => {
    teclas.esquerda = false;
    teclas.direita = false;
    teclas.atirar = false;
});

// PREPARA A TELA INICIAL
criarEstrelas();
desenharJogo();

// INICIA O LOOP
requestAnimationFrame(loop);