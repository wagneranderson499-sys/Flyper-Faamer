const telaCarregamento = document.getElementById("telaCarregamento");
const telaPrincipal = document.getElementById("telaPrincipal");

const progressoLoading = document.getElementById("progressoLoading");
const porcentagem = document.getElementById("porcentagem");
const mensagemLoading = document.getElementById("mensagemLoading");

const mensagens = [
    "Inicializando sistema...",
    "Carregando jogos...",
    "Preparando o fliperama...",
    "Quase tudo pronto..."
];

let progresso = 0;

const intervalo = setInterval(() => {
    progresso += Math.floor(Math.random() * 5) + 1;

    if (progresso >= 100) {
        progresso = 100;
        clearInterval(intervalo);

        setTimeout(() => {
            telaCarregamento.classList.add("finalizado");
            telaPrincipal.classList.remove("escondida");
        }, 500);
    }

    progressoLoading.style.width = `${progresso}%`;
    porcentagem.textContent = `${progresso}%`;

    if (progresso < 30) {
        mensagemLoading.textContent = mensagens[0];
    } else if (progresso < 55) {
        mensagemLoading.textContent = mensagens[1];
    } else if (progresso < 80) {
        mensagemLoading.textContent = mensagens[2];
    } else {
        mensagemLoading.textContent = mensagens[3];
    }

}, 90);