// ================================
// CONFIGURAÇÕES DO JOGO
// ================================

const fases = [
    { cartas: 6, nivel: "Fácil" },
    { cartas: 10, nivel: "Fácil" },
    { cartas: 14, nivel: "Fácil" },
    { cartas: 18, nivel: "Médio" },
    { cartas: 22, nivel: "Médio" },
    { cartas: 26, nivel: "Médio" },
    { cartas: 30, nivel: "Difícil" },
    { cartas: 34, nivel: "Difícil" },
    { cartas: 36, nivel: "Difícil" }
];

const temas = {
    animais: [
        "🐶", "🐱", "🦊", "🐼", "🐸", "🦁",
        "🐵", "🐰", "🐯", "🐨", "🐮", "🐷",
        "🐔", "🐧", "🦋", "🐢", "🐙", "🦄"
    ],

    frutas: [
        "🍎", "🍌", "🍇", "🍉", "🍓", "🍍",
        "🥝", "🍒", "🥑", "🍑", "🍋", "🥥",
        "🍊", "🫐", "🥭", "🍐", "🍈", "🍅"
    ],

    espaco: [
        "🚀", "🪐", "🌎", "🌙", "⭐", "☄️",
        "👽", "🛸", "🌞", "🌟", "🌌", "🛰️",
        "🌠", "🌑", "🌕", "🌍", "🪨", "🔭"
    ]
};

// ================================
// VARIÁVEIS DO JOGO
// ================================

let faseAtual = 0;
let tentativas = 0;
let paresEncontrados = 0;
let pontos = 0;
let segundos = 0;

let primeiraCarta = null;
let segundaCarta = null;

let bloqueado = false;
let somAtivo = true;

let intervalo = null;
let timeoutVirar = null;
let timeoutFase = null;

let recorde = Number(localStorage.getItem("recordeMemoria")) || 0;

// ================================
// ELEMENTOS DO HTML
// ================================

const telaInicial = document.getElementById("telaInicial");
const telaJogo = document.getElementById("telaJogo");
const telaFinal = document.getElementById("telaFinal");

const tabuleiro = document.getElementById("tabuleiro");
const modal = document.getElementById("modal");

const botaoJogar = document.getElementById("botaoJogar");
const botaoContinuar = document.getElementById("botaoContinuar");
const botaoReiniciar = document.getElementById("botaoReiniciar");
const botaoSom = document.getElementById("botaoSom");
const botaoJogarNovamente = document.getElementById("botaoJogarNovamente");
const botaoVoltar = document.getElementById("botaoVoltar");
const botaoVoltarMenu = document.getElementById("botaoVoltarMenu");

// ================================
// EMBARALHAR CARTAS
// ================================

function embaralhar(lista) {
    for (let i = lista.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));

        [lista[i], lista[j]] = [lista[j], lista[i]];
    }

    return lista;
}

// ================================
// INICIAR JOGO
// ================================

function iniciarJogo() {
    pararTemporizadores();

    faseAtual = 0;
    tentativas = 0;
    paresEncontrados = 0;
    pontos = 0;
    segundos = 0;

    primeiraCarta = null;
    segundaCarta = null;
    bloqueado = false;

    somAtivo = document.getElementById("somInicial").checked;

    atualizarBotaoSom();

    telaInicial.classList.add("escondida");
    telaFinal.classList.add("escondida");
    telaJogo.classList.remove("escondida");

    modal.classList.add("escondida");

    document.getElementById("tempo").textContent = "00:00";

    criarTabuleiro();
    atualizarInformacoes();

    iniciarCronometro();
}

// ================================
// VOLTAR AO MENU
// ================================

function voltarAoMenu() {

    const desejaSair = confirm(
        "Deseja realmente voltar ao menu? Seu progresso nesta partida será perdido."
    );

    if (!desejaSair) {
        return;
    }

    pararTemporizadores();

    primeiraCarta = null;
    segundaCarta = null;
    bloqueado = false;

    modal.classList.add("escondida");

    telaJogo.classList.add("escondida");
    telaFinal.classList.add("escondida");

    telaInicial.classList.remove("escondida");

    document.getElementById("recordeInicial").textContent =
        `${recorde} pontos`;
}

// ================================
// CRIAR TABULEIRO
// ================================

function criarTabuleiro() {

    const quantidadeCartas = fases[faseAtual].cartas;
    const quantidadePares = quantidadeCartas / 2;

    const temaEscolhido = document.getElementById("tema").value;

    const emojis = temas[temaEscolhido].slice(0, quantidadePares);

    let cartas = emojis.flatMap(emoji => [emoji, emoji]);

    cartas = embaralhar(cartas);

    tabuleiro.innerHTML = "";

    const colunas = Math.ceil(Math.sqrt(quantidadeCartas));

    tabuleiro.style.setProperty("--colunas", colunas);

    cartas.forEach(emoji => {

        const carta = document.createElement("button");

        carta.type = "button";
        carta.classList.add("carta");
        carta.textContent = "?";

        carta.dataset.emoji = emoji;

        carta.setAttribute("aria-label", "Carta fechada");

        carta.addEventListener("click", function () {
            virarCarta(carta);
        });

        tabuleiro.appendChild(carta);

    });

    atualizarInformacoes();
}

// ================================
// VIRAR CARTA
// ================================

function virarCarta(carta) {

    if (
        bloqueado ||
        carta.classList.contains("revelada") ||
        carta.classList.contains("combinada")
    ) {
        return;
    }

    carta.textContent = carta.dataset.emoji;

    carta.classList.add("revelada");

    carta.setAttribute("aria-label", "Carta revelada");

    tocarSom("virar");

    if (primeiraCarta === null) {

        primeiraCarta = carta;

        return;
    }

    segundaCarta = carta;

    tentativas++;

    if (
        primeiraCarta.dataset.emoji ===
        segundaCarta.dataset.emoji
    ) {

        // ACERTOU O PAR

        primeiraCarta.classList.add("combinada");
        segundaCarta.classList.add("combinada");

        paresEncontrados++;

        pontos += 100;

        tocarSom("acerto");

        limparSelecao();

        atualizarInformacoes();

        const totalPares = fases[faseAtual].cartas / 2;

        if (paresEncontrados === totalPares) {

            bloqueado = true;

            timeoutFase = setTimeout(() => {
                concluirFase();
            }, 700);

        }

    } else {

        // ERROU O PAR

        bloqueado = true;

        pontos = Math.max(0, pontos - 10);

        tocarSom("erro");

        atualizarInformacoes();

        timeoutVirar = setTimeout(() => {

            if (primeiraCarta && segundaCarta) {

                primeiraCarta.textContent = "?";
                segundaCarta.textContent = "?";

                primeiraCarta.classList.remove("revelada");
                segundaCarta.classList.remove("revelada");

                primeiraCarta.setAttribute("aria-label", "Carta fechada");
                segundaCarta.setAttribute("aria-label", "Carta fechada");

            }

            limparSelecao();

        }, 1000);

    }
}

// ================================
// LIMPAR SELEÇÃO
// ================================

function limparSelecao() {

    primeiraCarta = null;
    segundaCarta = null;

    bloqueado = false;
}

// ================================
// ATUALIZAR INFORMAÇÕES
// ================================

function atualizarInformacoes() {

    const totalPares = fases[faseAtual].cartas / 2;

    document.getElementById("tentativas").textContent = tentativas;

    document.getElementById("pares").textContent =
        `${paresEncontrados}/${totalPares} pares`;

    document.getElementById("pontos").textContent = pontos;

    document.getElementById("faseAtual").textContent =
        `Fase ${faseAtual + 1} de ${fases.length}`;

    document.getElementById("nivelAtual").textContent =
        `Nível ${fases[faseAtual].nivel}`;

    const progresso = (paresEncontrados / totalPares) * 100;

    document.getElementById("barraProgresso").style.width =
        `${progresso}%`;
}

// ================================
// CRONÔMETRO
// ================================

function iniciarCronometro() {

    clearInterval(intervalo);

    intervalo = setInterval(() => {

        segundos++;

        document.getElementById("tempo").textContent =
            formatarTempo(segundos);

    }, 1000);
}

function formatarTempo(tempo) {

    const minutos = Math.floor(tempo / 60);

    const segundosRestantes = tempo % 60;

    return (
        String(minutos).padStart(2, "0") +
        ":" +
        String(segundosRestantes).padStart(2, "0")
    );
}

// ================================
// PARAR TEMPORIZADORES
// ================================

function pararTemporizadores() {

    clearInterval(intervalo);
    clearTimeout(timeoutVirar);
    clearTimeout(timeoutFase);

    intervalo = null;
    timeoutVirar = null;
    timeoutFase = null;
}

// ================================
// CONCLUIR FASE
// ================================

function concluirFase() {

    bloqueado = true;

    if (faseAtual === 2) {

        mostrarModal(
            "🎉",
            "Parabéns!",
            "Você concluiu o nível fácil! Agora vamos para o nível médio!"
        );

    } else if (faseAtual === 5) {

        mostrarModal(
            "🔥",
            "Muito bem!",
            "Você venceu o nível médio! Agora chegou a hora do nível difícil!"
        );

    } else if (faseAtual === 8) {

        clearInterval(intervalo);
        intervalo = null;

        finalizarJogo();

    } else {

        mostrarModal(
            "⭐",
            "Fase concluída!",
            "Muito bem! Prepare-se para o próximo desafio!"
        );

    }
}

// ================================
// MOSTRAR MENSAGEM
// ================================

function mostrarModal(emoji, titulo, mensagem) {

    document.getElementById("modalEmoji").textContent = emoji;

    document.getElementById("modalTitulo").textContent = titulo;

    document.getElementById("modalMensagem").textContent = mensagem;

    botaoContinuar.textContent = "Próxima fase";

    modal.classList.remove("escondida");

    tocarSom("vitoria");
}

// ================================
// PRÓXIMA FASE
// ================================

function proximaFase() {

    modal.classList.add("escondida");

    faseAtual++;

    paresEncontrados = 0;

    primeiraCarta = null;
    segundaCarta = null;

    bloqueado = false;

    criarTabuleiro();

    atualizarInformacoes();
}

// ================================
// FINALIZAR JOGO
// ================================

function finalizarJogo() {

    if (pontos > recorde) {

        recorde = pontos;

        localStorage.setItem("recordeMemoria", recorde);

    }

    document.getElementById("resultadoPontos").textContent = pontos;

    document.getElementById("resultadoTempo").textContent =
        formatarTempo(segundos);

    document.getElementById("resultadoTentativas").textContent =
        tentativas;

    document.getElementById("resultadoRecorde").textContent =
        recorde;

    document.getElementById("recordeInicial").textContent =
        `${recorde} pontos`;

    tocarSom("vitoria");

    setTimeout(() => {

        telaJogo.classList.add("escondida");

        telaFinal.classList.remove("escondida");

    }, 500);
}

// ================================
// EFEITOS SONOROS
// ================================

function tocarSom(tipo) {

    if (!somAtivo) return;

    const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) return;

    const audio = new AudioContextClass();

    const frequencias = {
        virar: 350,
        acerto: 650,
        erro: 180,
        vitoria: 850
    };

    const oscilador = audio.createOscillator();

    const volume = audio.createGain();

    oscilador.connect(volume);

    volume.connect(audio.destination);

    oscilador.frequency.value = frequencias[tipo];

    oscilador.type = "sine";

    volume.gain.setValueAtTime(0.08, audio.currentTime);

    volume.gain.exponentialRampToValueAtTime(
        0.001,
        audio.currentTime + 0.2
    );

    oscilador.start();

    oscilador.stop(audio.currentTime + 0.2);

    oscilador.onended = () => audio.close();
}

// ================================
// CONTROLE DO SOM
// ================================

function atualizarBotaoSom() {

    botaoSom.textContent = somAtivo
        ? "🔊 Som ligado"
        : "🔇 Som desligado";
}

// ================================
// CONTROLES DOS BOTÕES
// ================================

botaoJogar.addEventListener("click", iniciarJogo);

botaoContinuar.addEventListener("click", proximaFase);

botaoReiniciar.addEventListener("click", iniciarJogo);

botaoJogarNovamente.addEventListener("click", iniciarJogo);

botaoVoltar.addEventListener("click", () => {

    pararTemporizadores();

    telaFinal.classList.add("escondida");

    telaInicial.classList.remove("escondida");

    document.getElementById("recordeInicial").textContent =
        `${recorde} pontos`;

});

botaoVoltarMenu.addEventListener("click", voltarAoMenu);

botaoSom.addEventListener("click", () => {

    somAtivo = !somAtivo;

    atualizarBotaoSom();

    if (somAtivo) {
        tocarSom("acerto");
    }

});

// ================================
// CARREGAR RECORDE
// ================================

document.getElementById("recordeInicial").textContent =
    `${recorde} pontos`;