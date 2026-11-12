
const canvas = document.getElementById("tabuleiro");
const ctx = canvas.getContext("2d");

// ELEMENTOS HTML
const menuJogo = document.getElementById("menuJogo");
const areaJogo = document.getElementById("areaJogo");
const mensagemJogo = document.getElementById("mensagemJogo");

const pontosJogador1 = document.getElementById("pontosJogador1");
const pontosJogador2 = document.getElementById("pontosJogador2");

const nomeJogador1 = document.getElementById("nomeJogador1");
const nomeJogador2 = document.getElementById("nomeJogador2");

const botaoMensagem = document.getElementById("botaoMensagem");
const botaoPausar = document.getElementById("botaoPausar");

const mensagemEmoji = document.getElementById("mensagemEmoji");
const mensagemTitulo = document.getElementById("mensagemTitulo");
const mensagemTexto = document.getElementById("mensagemTexto");

const controleJogador2 = document.getElementById("controleJogador2");

// CONFIGURAÇÕES
const LARGURA = canvas.width;
const ALTURA = canvas.height;

const ALTURA_RAQUETE = 100;
const LARGURA_RAQUETE = 14;
const RAIO_BOLA = 9;

const VELOCIDADE_JOGADOR = 430;
const VELOCIDADE_COMPUTADOR = 350;

const PONTOS_PARA_VENCER = 5;

// ESTADO DO JOGO
let modoAtual = null;
let estadoJogo = "menu";

let pontuacao1 = 0;
let pontuacao2 = 0;

let ultimoTempo = 0;
let tempoSaque = 0;

const teclas = {
    j1Cima: false,
    j1Baixo: false,
    j2Cima: false,
    j2Baixo: false
};

// RAQUETES
const jogador1 = {
    x: 30,
    y: ALTURA / 2 - ALTURA_RAQUETE / 2,
    largura: LARGURA_RAQUETE,
    altura: ALTURA_RAQUETE,
    cor: "#39ff88"
};

const jogador2 = {
    x: LARGURA - 30 - LARGURA_RAQUETE,
    y: ALTURA / 2 - ALTURA_RAQUETE / 2,
    largura: LARGURA_RAQUETE,
    altura: ALTURA_RAQUETE,
    cor: "#ff3cac"
};

// BOLA
const bola = {
    x: LARGURA / 2,
    y: ALTURA / 2,
    raio: RAIO_BOLA,
    velocidadeX: 0,
    velocidadeY: 0,
    velocidadeInicial: 390
};

// LIMITA A RAQUETE DENTRO DA TELA
function limitarRaquete(raquete) {
    raquete.y = Math.max(
        0,
        Math.min(ALTURA - raquete.altura, raquete.y)
    );
}

// ATUALIZA O PLACAR
function atualizarPlacar() {
    pontosJogador1.textContent = String(pontuacao1).padStart(2, "0");
    pontosJogador2.textContent = String(pontuacao2).padStart(2, "0");
}

// REPOSICIONA A BOLA
function posicionarBola(direcao) {
    bola.x = LARGURA / 2;
    bola.y = ALTURA / 2;

    bola.velocidadeX = 0;
    bola.velocidadeY = 0;

    tempoSaque = 0.8;

    bola.direcaoSaque = direcao;
}

// INICIA O MOVIMENTO DA BOLA
function iniciarSaque() {
    const direcao = bola.direcaoSaque || 1;

    const inclinacao = (Math.random() - 0.5) * 0.9;

    bola.velocidadeX = bola.velocidadeInicial * direcao;
    bola.velocidadeY = bola.velocidadeInicial * inclinacao;

    bola.direcaoSaque = null;
}

// DESENHA O FUNDO
function desenharFundo() {
    ctx.fillStyle = "#060b14";
    ctx.fillRect(0, 0, LARGURA, ALTURA);

    // Linha central
    ctx.save();

    ctx.setLineDash([12, 14]);
    ctx.strokeStyle = "#36c5ff55";
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.moveTo(LARGURA / 2, 0);
    ctx.lineTo(LARGURA / 2, ALTURA);
    ctx.stroke();

    ctx.restore();

    // Círculo central
    ctx.beginPath();
    ctx.arc(LARGURA / 2, ALTURA / 2, 65, 0, Math.PI * 2);
    ctx.strokeStyle = "#36c5ff25";
    ctx.lineWidth = 2;
    ctx.stroke();
}

// DESENHA AS RAQUETES
function desenharRaquete(raquete) {
    ctx.save();

    ctx.shadowColor = raquete.cor;
    ctx.shadowBlur = 20;

    ctx.fillStyle = raquete.cor;

    ctx.beginPath();

    ctx.roundRect(
        raquete.x,
        raquete.y,
        raquete.largura,
        raquete.altura,
        7
    );

    ctx.fill();

    ctx.restore();
}

// DESENHA A BOLA
function desenharBola() {
    ctx.save();

    ctx.shadowColor = "#36c5ff";
    ctx.shadowBlur = 25;

    ctx.fillStyle = "#ffffff";

    ctx.beginPath();
    ctx.arc(bola.x, bola.y, bola.raio, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

// DESENHA TODO O TABULEIRO
function desenharJogo() {
    desenharFundo();

    desenharRaquete(jogador1);
    desenharRaquete(jogador2);

    desenharBola();
}

// MOVIMENTAÇÃO DO JOGADOR 1
function movimentarJogador1(delta) {
    if (teclas.j1Cima) {
        jogador1.y -= VELOCIDADE_JOGADOR * delta;
    }

    if (teclas.j1Baixo) {
        jogador1.y += VELOCIDADE_JOGADOR * delta;
    }

    limitarRaquete(jogador1);
}

// MOVIMENTAÇÃO DO JOGADOR 2
function movimentarJogador2(delta) {
    if (modoAtual === "dupla") {
        if (teclas.j2Cima) {
            jogador2.y -= VELOCIDADE_JOGADOR * delta;
        }

        if (teclas.j2Baixo) {
            jogador2.y += VELOCIDADE_JOGADOR * delta;
        }
    } else {
        // INTELIGÊNCIA DO COMPUTADOR
        const centroRaquete = jogador2.y + jogador2.altura / 2;

        const diferenca = bola.y - centroRaquete;

        if (Math.abs(diferenca) > 10) {
            const movimento = Math.sign(diferenca) *
                VELOCIDADE_COMPUTADOR * delta;

            jogador2.y += movimento;
        }
    }

    limitarRaquete(jogador2);
}

// COLISÃO DA BOLA COM AS RAQUETES
function verificarColisoes() {

    // RAQUETE DO JOGADOR 1
    if (
        bola.velocidadeX < 0 &&
        bola.x - bola.raio <= jogador1.x + jogador1.largura &&
        bola.x + bola.raio >= jogador1.x &&
        bola.y + bola.raio >= jogador1.y &&
        bola.y - bola.raio <= jogador1.y + jogador1.altura
    ) {
        bola.x = jogador1.x + jogador1.largura + bola.raio;

        rebaterBola(jogador1, 1);
    }

    // RAQUETE DO JOGADOR 2
    if (
        bola.velocidadeX > 0 &&
        bola.x + bola.raio >= jogador2.x &&
        bola.x - bola.raio <= jogador2.x + jogador2.largura &&
        bola.y + bola.raio >= jogador2.y &&
        bola.y - bola.raio <= jogador2.y + jogador2.altura
    ) {
        bola.x = jogador2.x - bola.raio;

        rebaterBola(jogador2, -1);
    }
}

// REBATE A BOLA
function rebaterBola(raquete, direcao) {
    const centroRaquete = raquete.y + raquete.altura / 2;

    const distancia = (bola.y - centroRaquete) /
        (raquete.altura / 2);

    // Aumenta a velocidade a cada rebatida
    const velocidadeAtual = Math.min(
        Math.hypot(bola.velocidadeX, bola.velocidadeY) + 18,
        780
    );

    bola.velocidadeX = velocidadeAtual * direcao;

    bola.velocidadeY = distancia * velocidadeAtual * 0.75;

    // Limita a inclinação
    bola.velocidadeY = Math.max(
        -velocidadeAtual * 0.85,
        Math.min(velocidadeAtual * 0.85, bola.velocidadeY)
    );
}

// VERIFICA COLISÃO COM AS PAREDES
function verificarParedes() {
    if (bola.y - bola.raio <= 0) {
        bola.y = bola.raio;
        bola.velocidadeY = Math.abs(bola.velocidadeY);
    }

    if (bola.y + bola.raio >= ALTURA) {
        bola.y = ALTURA - bola.raio;
        bola.velocidadeY = -Math.abs(bola.velocidadeY);
    }
}

// MARCA OS PONTOS
function marcarPonto(jogador) {
    if (jogador === 1) {
        pontuacao1++;
        posicionarBola(1);
    } else {
        pontuacao2++;
        posicionarBola(-1);
    }

    atualizarPlacar();

    // VERIFICA SE ALGUÉM VENCEU
    if (pontuacao1 >= PONTOS_PARA_VENCER) {
        finalizarJogo(1);
    } else if (pontuacao2 >= PONTOS_PARA_VENCER) {
        finalizarJogo(2);
    }
}

// FINALIZA A PARTIDA
function finalizarJogo(vencedor) {
    estadoJogo = "finalizado";

    let titulo;
    let texto;
    let emoji;

    if (vencedor === 1) {
        titulo = "JOGADOR 1 VENCEU!";
        texto = "Parabéns! Você foi muito bem!";
        emoji = "🏆";
    } else if (modoAtual === "solo") {
        titulo = "COMPUTADOR VENCEU!";
        texto = "Não desista! Tente novamente.";
        emoji = "🤖";
    } else {
        titulo = "JOGADOR 2 VENCEU!";
        texto = "Parabéns pela vitória!";
        emoji = "🏆";
    }

    mostrarMensagem(emoji, titulo, texto, "JOGAR NOVAMENTE");
    botaoPausar.textContent = "⏸ PAUSAR";
}

// EXIBE MENSAGEM NA TELA
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

// ATUALIZA A PARTIDA
function atualizarJogo(delta) {
    if (estadoJogo !== "jogando") return;

    movimentarJogador1(delta);
    movimentarJogador2(delta);

    if (tempoSaque > 0) {
        tempoSaque -= delta;

        if (tempoSaque <= 0) {
            iniciarSaque();
        }

        return;
    }

    bola.x += bola.velocidadeX * delta;
    bola.y += bola.velocidadeY * delta;

    verificarParedes();
    verificarColisoes();

    // BOLA SAIU PELA DIREITA
    if (bola.x - bola.raio > LARGURA) {
        marcarPonto(1);
    }

    // BOLA SAIU PELA ESQUERDA
    if (bola.x + bola.raio < 0) {
        marcarPonto(2);
    }
}

// LOOP PRINCIPAL
function loop(tempoAtual) {
    const delta = Math.min(
        (tempoAtual - ultimoTempo) / 1000 || 0,
        0.03
    );

    ultimoTempo = tempoAtual;

    atualizarJogo(delta);
    desenharJogo();

    requestAnimationFrame(loop);
}

// INICIA UMA PARTIDA
function iniciarJogo(modo) {
    modoAtual = modo;

    pontuacao1 = 0;
    pontuacao2 = 0;

    jogador1.y = ALTURA / 2 - jogador1.altura / 2;
    jogador2.y = ALTURA / 2 - jogador2.altura / 2;

    teclas.j1Cima = false;
    teclas.j1Baixo = false;
    teclas.j2Cima = false;
    teclas.j2Baixo = false;

    atualizarPlacar();

    if (modo === "solo") {
        nomeJogador1.textContent = "JOGADOR 1";
        nomeJogador2.textContent = "COMPUTADOR";

        document.getElementById("tituloControle1").textContent = "JOGADOR 1";
        document.getElementById("tituloControle2").textContent = "COMPUTADOR";

        controleJogador2.classList.add("escondida");

        document.getElementById("instrucoes").textContent =
            "JOGADOR: W / S OU CONTROLES NA TELA";
    } else {
        nomeJogador1.textContent = "JOGADOR 1";
        nomeJogador2.textContent = "JOGADOR 2";

        document.getElementById("tituloControle1").textContent = "JOGADOR 1";
        document.getElementById("tituloControle2").textContent = "JOGADOR 2";

        controleJogador2.classList.remove("escondida");

        document.getElementById("instrucoes").textContent =
            "JOGADOR 1: W / S  •  JOGADOR 2: ↑ / ↓";
    }

    menuJogo.classList.add("escondida");
    areaJogo.classList.remove("escondida");

    estadoJogo = "jogando";

    posicionarBola(Math.random() < 0.5 ? -1 : 1);

    botaoPausar.textContent = "⏸ PAUSAR";

    esconderMensagem();
}

// PAUSAR E CONTINUAR
function alternarPausa() {
    if (estadoJogo === "jogando") {
        estadoJogo = "pausado";

        teclas.j1Cima = false;
        teclas.j1Baixo = false;
        teclas.j2Cima = false;
        teclas.j2Baixo = false;

        mostrarMensagem(
            "⏸️",
            "JOGO PAUSADO",
            "Continue quando estiver pronto.",
            "CONTINUAR"
        );

        botaoPausar.textContent = "▶ CONTINUAR";

    } else if (estadoJogo === "pausado") {
        estadoJogo = "jogando";

        esconderMensagem();

        botaoPausar.textContent = "⏸ PAUSAR";
    }
}

// EVENTOS DOS BOTÕES
document.getElementById("modoSolo").addEventListener("click", () => {
    iniciarJogo("solo");
});

document.getElementById("modoDupla").addEventListener("click", () => {
    iniciarJogo("dupla");
});

botaoPausar.addEventListener("click", alternarPausa);

document.getElementById("botaoReiniciar").addEventListener("click", () => {
    if (modoAtual) {
        iniciarJogo(modoAtual);
    }
});

botaoMensagem.addEventListener("click", () => {
    if (estadoJogo === "pausado") {
        alternarPausa();
    } else if (estadoJogo === "finalizado") {
        iniciarJogo(modoAtual);
    }
});

// VOLTAR AO MENU PRINCIPAL
document.getElementById("botaoVoltar").addEventListener("click", () => {
    const confirmar = confirm(
        "Deseja sair do Pong e voltar ao menu principal?"
    );

    if (confirmar) {
        window.location.href = "../../index.html";
    }
});

// CONTROLES PELO TECLADO
document.addEventListener("keydown", (evento) => {
    const tecla = evento.key.toLowerCase();

    if (
        ["arrowup", "arrowdown", " "].includes(tecla)
    ) {
        evento.preventDefault();
    }

    if (estadoJogo !== "jogando") {
        if (tecla === " " && estadoJogo === "pausado") {
            alternarPausa();
        }
        return;
    }

    if (tecla === "w") teclas.j1Cima = true;
    if (tecla === "s") teclas.j1Baixo = true;

    if (tecla === "arrowup") teclas.j2Cima = true;
    if (tecla === "arrowdown") teclas.j2Baixo = true;

    if (tecla === " " && estadoJogo === "jogando") {
        alternarPausa();
    }
});

document.addEventListener("keyup", (evento) => {
    const tecla = evento.key.toLowerCase();

    if (tecla === "w") teclas.j1Cima = false;
    if (tecla === "s") teclas.j1Baixo = false;

    if (tecla === "arrowup") teclas.j2Cima = false;
    if (tecla === "arrowdown") teclas.j2Baixo = false;
});

// CONTROLES POR TOQUE
const botoesDirecao = document.querySelectorAll(".botao-direcao");

botoesDirecao.forEach((botao) => {
    const controle = botao.dataset.controle;

    const mapaControles = {
        "j1-cima": "j1Cima",
        "j1-baixo": "j1Baixo",
        "j2-cima": "j2Cima",
        "j2-baixo": "j2Baixo"
    };

    const teclaCorrespondente = mapaControles[controle];

    function pressionar(evento) {
        evento.preventDefault();

        if (estadoJogo !== "jogando") return;

        teclas[teclaCorrespondente] = true;
    }

    function soltar(evento) {
        evento.preventDefault();

        teclas[teclaCorrespondente] = false;
    }

    botao.addEventListener("pointerdown", pressionar);
    botao.addEventListener("pointerup", soltar);
    botao.addEventListener("pointercancel", soltar);
    botao.addEventListener("pointerleave", soltar);
});

// LIMPA TECLAS SE A PÁGINA PERDER O FOCO
window.addEventListener("blur", () => {
    teclas.j1Cima = false;
    teclas.j1Baixo = false;
    teclas.j2Cima = false;
    teclas.j2Baixo = false;
});

// DESENHA A TELA INICIAL
desenharJogo();

// INICIA O LOOP
requestAnimationFrame(loop);
