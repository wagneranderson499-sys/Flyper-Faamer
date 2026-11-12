
// ELEMENTOS DO HTML

const canvas = document.getElementById("tabuleiro");
const ctx = canvas.getContext("2d");

const pontuacaoElemento = document.getElementById("pontuacao");
const recordeElemento = document.getElementById("recorde");

const telaMensagem = document.getElementById("telaMensagem");
const mensagemEmoji = document.getElementById("mensagemEmoji");
const mensagemTitulo = document.getElementById("mensagemTitulo");
const mensagemTexto = document.getElementById("mensagemTexto");

const botaoIniciar = document.getElementById("botaoIniciar");
const botaoPausar = document.getElementById("botaoPausar");
const botaoVoltar = document.getElementById("botaoVoltar");

// CONFIGURAÇÕES

const tamanhoCelula = 20;
const quantidadeCelulas = canvas.width / tamanhoCelula;

const velocidadeJogo = 120;

let cobrinha = [];
let comida = {};

let direcao = "direita";
let proximaDirecao = "direita";

let pontuacao = 0;
let recorde = Number(localStorage.getItem("snakeRecorde")) || 0;

let intervaloJogo = null;
let jogoAtivo = false;
let jogoPausado = false;

// MOSTRAR RECORDE SALVO

recordeElemento.textContent = formatarNumero(recorde);

// FORMATAR NÚMEROS

function formatarNumero(numero) {
    return String(numero).padStart(3, "0");
}

// INICIAR JOGO

function iniciarJogo() {
    clearInterval(intervaloJogo);

    cobrinha = [
        { x: 8, y: 10 },
        { x: 7, y: 10 },
        { x: 6, y: 10 }
    ];

    direcao = "direita";
    proximaDirecao = "direita";

    pontuacao = 0;

    pontuacaoElemento.textContent = formatarNumero(pontuacao);

    gerarComida();

    jogoAtivo = true;
    jogoPausado = false;

    telaMensagem.classList.add("escondida");

    botaoPausar.disabled = false;
    botaoPausar.textContent = "Ⅱ PAUSAR";

    desenharJogo();

    intervaloJogo = setInterval(atualizarJogo, velocidadeJogo);
}

// GERAR COMIDA EM UMA POSIÇÃO LIVRE

function gerarComida() {
    do {
        comida = {
            x: Math.floor(Math.random() * quantidadeCelulas),
            y: Math.floor(Math.random() * quantidadeCelulas)
        };
    } while (
        cobrinha.some(parte =>
            parte.x === comida.x && parte.y === comida.y
        )
    );
}

// ATUALIZAR JOGO

function atualizarJogo() {
    direcao = proximaDirecao;

    const cabeca = { ...cobrinha[0] };

    if (direcao === "cima") cabeca.y--;
    if (direcao === "baixo") cabeca.y++;
    if (direcao === "esquerda") cabeca.x--;
    if (direcao === "direita") cabeca.x++;

    // VERIFICAR COLISÃO COM AS PAREDES

    if (
        cabeca.x < 0 ||
        cabeca.x >= quantidadeCelulas ||
        cabeca.y < 0 ||
        cabeca.y >= quantidadeCelulas
    ) {
        finalizarJogo();
        return;
    }

    const comeu = (
        cabeca.x === comida.x &&
        cabeca.y === comida.y
    );

    // VERIFICAR COLISÃO COM O PRÓPRIO CORPO
    // Se não comeu, a última parte da cauda vai sair da posição atual.

    const corpoParaVerificar = comeu
        ? cobrinha
        : cobrinha.slice(0, -1);

    const bateuNoCorpo = corpoParaVerificar.some(parte =>
        parte.x === cabeca.x && parte.y === cabeca.y
    );

    if (bateuNoCorpo) {
        finalizarJogo();
        return;
    }

    cobrinha.unshift(cabeca);

    if (comeu) {
        pontuacao += 10;

        pontuacaoElemento.textContent = formatarNumero(pontuacao);

        atualizarRecorde();

        gerarComida();
    } else {
        cobrinha.pop();
    }

    desenharJogo();
}

// ATUALIZAR RECORDES

function atualizarRecorde() {
    if (pontuacao > recorde) {
        recorde = pontuacao;

        localStorage.setItem("snakeRecorde", recorde);

        recordeElemento.textContent = formatarNumero(recorde);
    }
}

// DESENHAR O TABULEIRO

function desenharJogo() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    desenharFundo();
    desenharComida();
    desenharCobrinha();
}

// FUNDO COM GRADE

function desenharFundo() {
    ctx.fillStyle = "#080e19";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "#172536";
    ctx.lineWidth = 0.5;

    for (let i = 0; i <= canvas.width; i += tamanhoCelula) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
    }
}

// DESENHAR COBRINHA

function desenharCobrinha() {
    cobrinha.forEach((parte, indice) => {
        const x = parte.x * tamanhoCelula;
        const y = parte.y * tamanhoCelula;

        ctx.save();

        if (indice === 0) {
            // CABEÇA

            ctx.shadowColor = "#39ff88";
            ctx.shadowBlur = 18;
            ctx.fillStyle = "#a2ffc4";
        } else {
            // CORPO

            ctx.shadowColor = "#39ff88";
            ctx.shadowBlur = 10;
            ctx.fillStyle = indice % 2 === 0
                ? "#39ff88"
                : "#20d96b";
        }

        ctx.beginPath();
        ctx.roundRect(
            x + 2,
            y + 2,
            tamanhoCelula - 4,
            tamanhoCelula - 4,
            5
        );

        ctx.fill();

        // OLHOS DA COBRINHA

        if (indice === 0) {
            ctx.shadowBlur = 0;
            ctx.fillStyle = "#07150e";

            let olho1;
            let olho2;

            if (direcao === "direita" || direcao === "esquerda") {
                const posicaoX = direcao === "direita" ? x + 13 : x + 5;

                olho1 = { x: posicaoX, y: y + 6 };
                olho2 = { x: posicaoX, y: y + 13 };
            } else {
                const posicaoY = direcao === "baixo" ? y + 13 : y + 5;

                olho1 = { x: x + 6, y: posicaoY };
                olho2 = { x: x + 13, y: posicaoY };
            }

            ctx.beginPath();
            ctx.arc(olho1.x, olho1.y, 1.8, 0, Math.PI * 2);
            ctx.arc(olho2.x, olho2.y, 1.8, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    });
}

// DESENHAR COMIDA

function desenharComida() {
    const centroX = comida.x * tamanhoCelula + tamanhoCelula / 2;
    const centroY = comida.y * tamanhoCelula + tamanhoCelula / 2;

    ctx.save();

    ctx.shadowColor = "#ff4fc8";
    ctx.shadowBlur = 20;

    ctx.fillStyle = "#ff4fc8";
    ctx.beginPath();
    ctx.arc(centroX, centroY, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(centroX - 2, centroY - 2, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

// MUDAR DIREÇÃO

function mudarDirecao(novaDirecao) {
    if (!jogoAtivo || jogoPausado) return;

    const direcoesOpostas = {
        cima: "baixo",
        baixo: "cima",
        esquerda: "direita",
        direita: "esquerda"
    };

    if (novaDirecao === direcoesOpostas[direcao]) {
        return;
    }

    proximaDirecao = novaDirecao;
}

// CONTROLES DO TECLADO

document.addEventListener("keydown", (evento) => {
    const teclas = [
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        "w", "a", "s", "d",
        "W", "A", "S", "D"
    ];

    if (teclas.includes(evento.key)) {
        evento.preventDefault();
    }

    switch (evento.key) {
        case "ArrowUp":
        case "w":
        case "W":
            mudarDirecao("cima");
            break;

        case "ArrowDown":
        case "s":
        case "S":
            mudarDirecao("baixo");
            break;

        case "ArrowLeft":
        case "a":
        case "A":
            mudarDirecao("esquerda");
            break;

        case "ArrowRight":
        case "d":
        case "D":
            mudarDirecao("direita");
            break;

        case " ":
            if (jogoAtivo) {
                alternarPausa();
            }
            break;
    }
});

// CONTROLES DO CELULAR

document.querySelectorAll(".direcional[data-direcao]").forEach(botao => {
    botao.addEventListener("pointerdown", (evento) => {
        evento.preventDefault();
        mudarDirecao(botao.dataset.direcao);
    });
});

// PAUSAR E CONTINUAR

function alternarPausa() {
    if (!jogoAtivo) return;

    if (!jogoPausado) {
        clearInterval(intervaloJogo);

        jogoPausado = true;

        botaoPausar.textContent = "▶ CONTINUAR";

        mostrarMensagem(
            "⏸️",
            "JOGO PAUSADO",
            "Sua partida está pausada.",
            "CONTINUAR"
        );
    } else {
        jogoPausado = false;

        telaMensagem.classList.add("escondida");

        botaoPausar.textContent = "Ⅱ PAUSAR";

        intervaloJogo = setInterval(atualizarJogo, velocidadeJogo);
    }
}

// MOSTRAR MENSAGEM

function mostrarMensagem(emoji, titulo, texto, textoBotao) {
    mensagemEmoji.textContent = emoji;
    mensagemTitulo.textContent = titulo;
    mensagemTexto.textContent = texto;
    botaoIniciar.textContent = textoBotao;

    telaMensagem.classList.remove("escondida");
}

// FINALIZAR PARTIDA

function finalizarJogo() {
    clearInterval(intervaloJogo);

    jogoAtivo = false;
    jogoPausado = false;

    botaoPausar.disabled = true;
    botaoPausar.textContent = "Ⅱ PAUSAR";

    mostrarMensagem(
        "💥",
        "GAME OVER",
        `Sua pontuação foi ${pontuacao} pontos. Que tal tentar novamente?`,
        "JOGAR NOVAMENTE"
    );
}

// BOTÕES

botaoIniciar.addEventListener("click", () => {
    if (jogoAtivo && jogoPausado) {
        alternarPausa();
    } else {
        iniciarJogo();
    }
});

botaoPausar.addEventListener("click", alternarPausa);

// VOLTAR PARA A FLYPER FAAMER

botaoVoltar.addEventListener("click", () => {
    const confirmar = confirm(
        "Deseja realmente voltar ao menu da FLYPER FAAMER? Sua partida atual será encerrada."
    );

    if (confirmar) {
        clearInterval(intervaloJogo);
        window.location.href = "../../index.html";
    }
});

// DESENHO INICIAL DO TABULEIRO

desenharFundo();
