// ============================================================
// GEOPORTAL TERRITÓRIO EDUCA — gaveta.js
// Gaveta lateral direita (slide-over) que substitui os popups do Leaflet.
// Recebe o mesmo HTML já gerado por popups.js (POPUPS[camada]) e o injeta
// no painel; nenhum dado, texto ou caminho de imagem é alterado aqui.
// ============================================================

import { configurarCarrosseisPopup } from "./popups.js?v=20261027-v40";

let gaveta = null;
let topo = null;
let titulo = null;
let subtitulo = null;
let corpo = null;
let btnFechar = null;
let focoAnterior = null;
let iniciada = false;

let lightboxEl = null;
let focoLightbox = null;
let carrosselLightbox = null;

function iniciar() {
    if (iniciada) return gaveta !== null;
    iniciada = true;

    gaveta = document.getElementById("gaveta-feicao");
    if (!gaveta) return false;
    topo = gaveta.querySelector(".gaveta-feicao__topo");
    titulo = document.getElementById("gaveta-feicao-titulo");
    corpo = document.getElementById("gaveta-feicao-corpo");
    btnFechar = document.getElementById("gaveta-feicao-fechar");

    // Cria o container de textos do cabeçalho (Título + Badge/Subtítulo)
    if (topo && titulo && !document.getElementById("gaveta-feicao-sub")) {
        const cabInfo = document.createElement("div");
        cabInfo.className = "gaveta-feicao__cab-info";
        subtitulo = document.createElement("p");
        subtitulo.id = "gaveta-feicao-sub";
        subtitulo.className = "gaveta-feicao__sub";
        subtitulo.hidden = true;
        topo.insertBefore(cabInfo, btnFechar);
        cabInfo.appendChild(titulo);
        cabInfo.appendChild(subtitulo);
    } else {
        subtitulo = document.getElementById("gaveta-feicao-sub");
    }

    btnFechar.addEventListener("click", fecharGavetaFeicao);

    // Teclado global: Esc fecha primeiro o Lightbox (e setas <- -> navegam nele quando aberto).
    document.addEventListener("keydown", e => {
        const lbAberto = lightboxEl && lightboxEl.classList.contains("lightbox--aberto");
        if (lbAberto) {
            if (e.key === "Escape") {
                e.preventDefault();
                e.stopPropagation();
                fecharLightbox();
                return;
            }
            if (e.key === "ArrowLeft") {
                e.preventDefault();
                e.stopPropagation();
                navegarLightbox(-1);
                return;
            }
            if (e.key === "ArrowRight") {
                e.preventDefault();
                e.stopPropagation();
                navegarLightbox(1);
                return;
            }
        }
        if (e.key === "Escape" && gaveta.classList.contains("gaveta-feicao--aberta")) {
            fecharGavetaFeicao();
        }
    });

    // Se a gaveta institucional (O projeto, Fontes...) abrir, esta recolhe: ocupam o mesmo lado.
    new MutationObserver(() => {
        if (document.body.classList.contains("gaveta-aberta")) fecharGavetaFeicao(false);
    }).observe(document.body, { attributes: true, attributeFilter: ["class"] });

    return true;
}

/**
 * Avança ou retrocede o slide do carrossel ativo dentro do Lightbox,
 * mantendo o carrossel da gaveta lateral sincronizado.
 */
function navegarLightbox(delta) {
    if (!carrosselLightbox || !lightboxEl) return;
    const seletorSeta = delta < 0 ? ".pp-carrossel__seta--esq" : ".pp-carrossel__seta--dir";
    const btnSetaGaveta = carrosselLightbox.querySelector(seletorSeta);
    if (!btnSetaGaveta) return;

    btnSetaGaveta.click();

    const novaImg = carrosselLightbox.querySelector(".pp-carrossel__slide--ativo .pp-midia__img");
    const imgClone = lightboxEl.querySelector(".lightbox__img");
    if (novaImg && imgClone) {
        imgClone.src = novaImg.getAttribute("src");
        imgClone.alt = novaImg.getAttribute("alt") || "Imagem ampliada";
        focoLightbox = novaImg;
    }
}

/**
 * Cria (uma única vez) ou retorna o container de tela cheia do Lightbox.
 */
function obterLightbox() {
    if (lightboxEl) return lightboxEl;

    lightboxEl = document.createElement("div");
    lightboxEl.id = "lightbox-midia";
    lightboxEl.className = "lightbox";
    lightboxEl.setAttribute("role", "dialog");
    lightboxEl.setAttribute("aria-modal", "true");
    lightboxEl.setAttribute("aria-hidden", "true");
    lightboxEl.setAttribute("aria-label", "Visualização da imagem em tela cheia");

    const btnFecharLb = document.createElement("button");
    btnFecharLb.type = "button";
    btnFecharLb.className = "lightbox__fechar";
    btnFecharLb.setAttribute("aria-label", "Fechar visualização em tela cheia");
    btnFecharLb.setAttribute("title", "Fechar (Esc)");
    btnFecharLb.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;

    const btnAntLb = document.createElement("button");
    btnAntLb.type = "button";
    btnAntLb.className = "lightbox__seta lightbox__seta--esq";
    btnAntLb.setAttribute("aria-label", "Foto anterior");
    btnAntLb.setAttribute("title", "Foto anterior");
    btnAntLb.innerHTML = `<svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"></polyline></svg>`;
    btnAntLb.addEventListener("click", e => {
        e.preventDefault();
        e.stopPropagation();
        navegarLightbox(-1);
    });

    const btnProxLb = document.createElement("button");
    btnProxLb.type = "button";
    btnProxLb.className = "lightbox__seta lightbox__seta--dir";
    btnProxLb.setAttribute("aria-label", "Próxima foto");
    btnProxLb.setAttribute("title", "Próxima foto");
    btnProxLb.innerHTML = `<svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"></polyline></svg>`;
    btnProxLb.addEventListener("click", e => {
        e.preventDefault();
        e.stopPropagation();
        navegarLightbox(1);
    });

    const imgClone = document.createElement("img");
    imgClone.className = "lightbox__img";
    imgClone.alt = "";

    lightboxEl.appendChild(btnFecharLb);
    lightboxEl.appendChild(btnAntLb);
    lightboxEl.appendChild(imgClone);
    lightboxEl.appendChild(btnProxLb);
    document.body.appendChild(lightboxEl);

    // Permite também rolar fotos com a roda do mouse no Lightbox
    let ultimoScrollLb = 0;
    lightboxEl.addEventListener("wheel", e => {
        if (!carrosselLightbox) return;
        e.preventDefault();
        const agora = Date.now();
        if (agora - ultimoScrollLb > 220) {
            ultimoScrollLb = agora;
            navegarLightbox(e.deltaY > 0 || e.deltaX > 0 ? 1 : -1);
        }
    }, { passive: false });

    // Fechar ao clicar no botão "X" ou em qualquer área do fundo escuro translúcido
    lightboxEl.addEventListener("click", e => {
        if (e.target.closest(".lightbox__seta")) return;
        if (e.target === lightboxEl || e.target.closest(".lightbox__fechar")) {
            fecharLightbox();
        }
    });

    return lightboxEl;
}

/**
 * Abre o Lightbox clonando src e alt da imagem clicada na gaveta.
 */
export function abrirLightbox(src, alt, origemImg = null) {
    if (!src) return;
    const lb = obterLightbox();
    const imgClone = lb.querySelector(".lightbox__img");
    const btnFecharLb = lb.querySelector(".lightbox__fechar");
    const btnAntLb = lb.querySelector(".lightbox__seta--esq");
    const btnProxLb = lb.querySelector(".lightbox__seta--dir");

    focoLightbox = origemImg || document.activeElement;
    carrosselLightbox = origemImg ? origemImg.closest(".pp-carrossel") : null;
    const temMultiplas = Boolean(
        carrosselLightbox && carrosselLightbox.querySelectorAll(".pp-carrossel__slide").length > 1
    );

    if (btnAntLb) btnAntLb.hidden = !temMultiplas;
    if (btnProxLb) btnProxLb.hidden = !temMultiplas;

    imgClone.src = src;
    imgClone.alt = alt || "Imagem ampliada";

    lb.classList.add("lightbox--aberto");
    lb.setAttribute("aria-hidden", "false");
    if (btnFecharLb) btnFecharLb.focus({ preventScroll: true });
}

/**
 * Fecha o Lightbox e devolve o foco para a gaveta lateral.
 */
export function fecharLightbox() {
    if (!lightboxEl || !lightboxEl.classList.contains("lightbox--aberto")) return;
    lightboxEl.classList.remove("lightbox--aberto");
    lightboxEl.setAttribute("aria-hidden", "true");

    const imgClone = lightboxEl.querySelector(".lightbox__img");
    if (imgClone) imgClone.removeAttribute("src");

    if (focoLightbox && typeof focoLightbox.focus === "function") {
        focoLightbox.focus({ preventScroll: true });
    }
    focoLightbox = null;
    carrosselLightbox = null;
}

/**
 * Monta o palco horizontal do carrossel (imagem principal arredondada à esquerda +
 * faixa "peek" da próxima imagem à direita) e injeta os pontos de paginação (dots)
 * centralizados logo abaixo, idêntico à referência visual.
 */
function configurarDotsCarrossel(container) {
    if (!container) return;

    container.querySelectorAll(".pp-carrossel").forEach(carrossel => {
        const slides = carrossel.querySelectorAll(".pp-carrossel__slide");
        const total = slides.length;
        if (total <= 1) return;

        const btnProx = carrossel.querySelector(".pp-carrossel__seta--dir");

        slides.forEach((slide, slideIdx) => {
            const moldura = slide.querySelector(".pp-midia__moldura");
            if (!moldura) return;

            // Identifica placas educativas para preservar 100% da arte sem bordas pretas
            const legendaEl = slide.querySelector(".pp-midia__legenda");
            const imgPrincipal = moldura.querySelector(".pp-midia__img");
            if (imgPrincipal && legendaEl && /placa/i.test(legendaEl.textContent)) {
                imgPrincipal.classList.add("pp-midia__img--placa");
            }

            // Cria o container de palco horizontal (imagem principal + prévia da próxima foto à direita)
            const palco = document.createElement("div");
            palco.className = "pp-carrossel__palco";
            moldura.parentNode.insertBefore(palco, moldura);
            palco.appendChild(moldura);

            const proxSlide = slides[(slideIdx + 1) % total];
            const proxImg = proxSlide ? proxSlide.querySelector(".pp-midia__img") : null;
            if (proxImg && proxImg.getAttribute("src")) {
                const peek = document.createElement("div");
                peek.className = "pp-carrossel__peek";
                peek.setAttribute("aria-hidden", "true");
                peek.title = "Próxima foto";

                const peekImg = document.createElement("img");
                peekImg.className = "pp-carrossel__peek-img";
                peekImg.src = proxImg.getAttribute("src");
                peekImg.alt = "";
                peekImg.loading = "lazy";
                peek.appendChild(peekImg);

                peek.addEventListener("click", e => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (btnProx) btnProx.click();
                });

                palco.appendChild(peek);
            }

            const dotsWrap = document.createElement("div");
            dotsWrap.className = "pp-carrossel__dots";
            dotsWrap.setAttribute("role", "tablist");
            dotsWrap.setAttribute("aria-label", "Paginação das imagens");

            for (let i = 0; i < total; i++) {
                const dot = document.createElement("button");
                dot.type = "button";
                dot.className = i === slideIdx
                    ? "pp-carrossel__dot pp-carrossel__dot--ativo"
                    : "pp-carrossel__dot";
                dot.setAttribute("aria-label", `Foto ${i + 1} de ${total}`);
                dot.setAttribute("aria-current", i === slideIdx ? "true" : "false");
                dot.addEventListener("click", e => {
                    e.preventDefault();
                    e.stopPropagation();
                    const atual = parseInt(carrossel.getAttribute("data-atual") || "0", 10);
                    const passos = (i - atual + total) % total;
                    if (passos > 0 && btnProx) {
                        for (let p = 0; p < passos; p++) btnProx.click();
                    }
                });
                dotsWrap.appendChild(dot);
            }

            // Insere os dots imediatamente após o palco (.pp-carrossel__palco) e antes dos créditos (.pp-midia__info)
            palco.insertAdjacentElement("afterend", dotsWrap);
        });
    });
}

/**
 * Conecta o evento de zoom (Lightbox) às imagens do carrossel ou figura única da gaveta.
 */
function configurarLightboxGaveta(container) {
    if (!container) return;

    // Remove o avanço de slide no clique da moldura para que o clique na foto abra o Lightbox
    container.querySelectorAll(".pp-midia__moldura").forEach(moldura => {
        moldura.onclick = null;
        moldura.style.cursor = "";
        moldura.removeAttribute("title");
    });

    container.querySelectorAll(".pp-midia__img").forEach(img => {
        img.title = "Clique para ampliar a imagem";
        img.addEventListener("click", e => {
            e.preventDefault();
            e.stopPropagation();
            abrirLightbox(img.getAttribute("src"), img.getAttribute("alt"), img);
        });
    });
}

/**
 * Abre a gaveta com o HTML da feição (mesmo conteúdo que ia no popup).
 * Ordem do DOM:
 * 1. Cabeçalho escuro (Título + Badge + Botão "X")
 * 2. Bloco de Texto (Localidade e Descrição)
 * 3. Carrossel de Imagens + Dots + Créditos da foto
 */
export function abrirGavetaFeicao(html, origem) {
    if (!iniciar()) return;

    // A gaveta institucional ocupa o mesmo lado: fecha antes de abrir esta.
    if (document.body.classList.contains("gaveta-aberta")) {
        const fecharInstitucional = document.getElementById("btn-fechar-modal");
        if (fecharInstitucional) fecharInstitucional.click();
    }

    if (!gaveta.classList.contains("gaveta-feicao--aberta")) {
        focoAnterior = origem || document.activeElement;
    }

    corpo.innerHTML = html;

    // 1. Cabeçalho: move Título (.pp__titulo) e Badge (.pp__sub) para o topo escuro
    const h3 = corpo.querySelector(".pp__titulo");
    if (h3) {
        titulo.textContent = h3.textContent;
        h3.remove();
    } else {
        titulo.textContent = "Informações";
    }

    const sub = corpo.querySelector(".pp__sub");
    if (subtitulo) {
        if (sub && sub.textContent.trim() !== "") {
            subtitulo.textContent = sub.textContent;
            subtitulo.hidden = false;
            sub.remove();
        } else {
            subtitulo.textContent = "";
            subtitulo.hidden = true;
            if (sub) sub.remove();
        }
    }

    // 2. Reordenação explícita no DOM: Bloco de Texto primeiro, Carrossel de Imagens depois
    const wrapMidia = corpo.querySelector(".pp--com-midia");
    if (wrapMidia) {
        const colTexto = wrapMidia.querySelector(".pp__col-texto");
        const colMidia = wrapMidia.querySelector(".pp__col-midia");
        if (colTexto && colMidia) {
            wrapMidia.appendChild(colTexto);
            wrapMidia.appendChild(colMidia);
        }
    }

    configurarCarrosseisPopup(corpo);
    configurarDotsCarrossel(corpo);
    configurarLightboxGaveta(corpo);
    corpo.scrollTop = 0;

    gaveta.classList.add("gaveta-feicao--aberta");
    gaveta.setAttribute("aria-hidden", "false");
    document.body.classList.add("gaveta-feicao-aberta");
    btnFechar.focus({ preventScroll: true });
}

export function fecharGavetaFeicao(devolverFoco = true) {
    fecharLightbox();
    if (!gaveta || !gaveta.classList.contains("gaveta-feicao--aberta")) return;
    gaveta.classList.remove("gaveta-feicao--aberta");
    gaveta.setAttribute("aria-hidden", "true");
    document.body.classList.remove("gaveta-feicao-aberta");
    if (devolverFoco === true && focoAnterior && typeof focoAnterior.focus === "function") {
        focoAnterior.focus({ preventScroll: true });
    }
    focoAnterior = null;
}
