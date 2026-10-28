// ============================================================
// GEOPORTAL TERRITÓRIO EDUCA — popups.js
// Templates de popup. Regras:
//  - todo valor vindo dos dados passa por esc() (escape de HTML);
//  - números em formato pt-BR;
//  - campo realmente vazio => "Não informado"; nada é inferido;
//  - nenhum campo proibido pelo briefing (cessionário, nomes
//    individuais, endereço, coordenadas etc.) é lido aqui.
// ============================================================

const NAO_INFORMADO = "Não informado";

/** Escapa caracteres especiais de HTML. */
export function esc(valor) {
    return String(valor)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

/** Verdadeiro somente para null, undefined ou texto em branco. */
export function vazio(valor) {
    return valor === null || valor === undefined || String(valor).trim() === "";
}

/** Formata número em pt-BR; devolve null se não for numérico. */
function numero(valor, casas) {
    const n = Number(valor);
    if (vazio(valor) || !Number.isFinite(n)) return null;
    return n.toLocaleString("pt-BR", {
        minimumFractionDigits: casas,
        maximumFractionDigits: casas
    });
}

/** Aceita apenas URLs http(s). */
function urlSegura(valor) {
    try {
        const u = new URL(String(valor));
        return (u.protocol === "http:" || u.protocol === "https:") ? u : null;
    } catch (e) {
        return null;
    }
}

/** Linha "rótulo: valor" (valor já em HTML seguro, ou null => Não informado). */
function linha(rotulo, htmlSeguro) {
    const conteudo = htmlSeguro === null
        ? `<span class="pp__ni">${NAO_INFORMADO}</span>`
        : htmlSeguro;
    return `<dt>${esc(rotulo)}</dt><dd>${conteudo}</dd>`;
}

/** Campo de texto simples vindo dos dados. */
function texto(rotulo, valor) {
    return linha(rotulo, vazio(valor) ? null : esc(valor));
}

/** Campo numérico com unidade. */
function medida(rotulo, valor, casas, unidade) {
    const n = numero(valor, casas);
    return linha(rotulo, n === null ? null : `${esc(n)} ${esc(unidade)}`);
}

/** Campo de fonte: link se for URL http(s), texto caso contrário. */
function fonte(rotulo, valor, urlOpcional, textoLinkCustom) {
    if (vazio(valor) && vazio(urlOpcional)) return linha(rotulo, null);
    const alvo = urlSegura(!vazio(urlOpcional) ? urlOpcional : valor);
    if (alvo) {
        let rotuloLink;
        if (textoLinkCustom) {
            rotuloLink = textoLinkCustom;
        } else if (!vazio(valor) && !urlSegura(valor)) {
            rotuloLink = String(valor);
        } else {
            rotuloLink = alvo.hostname.replace(/^www\./, "");
        }
        return linha(rotulo,
            `<a href="${esc(alvo.href)}" target="_blank" rel="noopener noreferrer">${esc(rotuloLink)} &#8599;</a>`);
    }
    return linha(rotulo, esc(valor));
}

function popup(titulo, subtitulo, linhas, nota, midiaHtml) {
    if (midiaHtml) {
        return `<div class="pp pp--com-midia">`
            + `<div class="pp__col-texto">`
            + `<h3 class="pp__titulo">${esc(titulo)}</h3>`
            + (subtitulo ? `<p class="pp__sub">${esc(subtitulo)}</p>` : "")
            + `<dl class="pp__lista">${linhas.join("")}</dl>`
            + (nota ? `<p class="pp__nota">${esc(nota)}</p>` : "")
            + `</div>`
            + `<div class="pp__col-midia">${midiaHtml}</div>`
            + `</div>`;
    }

    return `<div class="pp">`
        + `<h3 class="pp__titulo">${esc(titulo)}</h3>`
        + (subtitulo ? `<p class="pp__sub">${esc(subtitulo)}</p>` : "")
        + `<dl class="pp__lista">${linhas.join("")}</dl>`
        + (nota ? `<p class="pp__nota">${esc(nota)}</p>` : "")
        + `</div>`;
}

/**
 * Constrói a estrutura HTML de mídia (foto única ou carrossel).
 * Valida caminhos seguros, escapa textos e associa créditos e datas.
 */
export function montarMidia(p) {
    if (vazio(p.imagem)) return "";

    const rawImagens = String(p.imagem).split(";").map(s => s.trim()).filter(Boolean);
    if (!rawImagens.length) return "";

    // Validação estrita de caminhos relativos em imagens/ com extensões aceitas
    const imagens = rawImagens.filter(caminho => {
        return /^imagens\/[a-zA-Z0-9_\-\.]+\.(jpg|jpeg|png|webp|svg)$/i.test(caminho);
    });
    if (!imagens.length) return "";

    // Leitura por posição com separador ';'
    const rawLegendas = !vazio(p.legenda_imagem)
        ? String(p.legenda_imagem).split(";").map(s => s.trim())
        : [];
    const rawCreditos = !vazio(p.credito_imagem)
        ? String(p.credito_imagem).split(";").map(s => s.trim())
        : [];
    const rawDatas = !vazio(p.data_imagem)
        ? String(p.data_imagem).split(";").map(s => s.trim())
        : [];

    const total = imagens.length;
    const nomeFeicao = !vazio(p.nome) ? p.nome : "Registro";

    const slides = imagens.map((src, i) => {
        // Legenda opcional por posição: só existe se houver texto na posição i (sem fallback)
        const legenda = (rawLegendas.length > i && rawLegendas[i] !== "") ? rawLegendas[i] : "";

        // Crédito e data: mantém valor da posição ou reaproveita o valor único na posição 0
        const credito = (rawCreditos.length > i && rawCreditos[i] !== "")
            ? rawCreditos[i]
            : (rawCreditos.length ? rawCreditos[0] : "");
        const data = (rawDatas.length > i && rawDatas[i] !== "")
            ? rawDatas[i]
            : (rawDatas.length ? rawDatas[0] : "");

        const partesMeta = [];
        if (credito) partesMeta.push(`Foto: ${credito}`);
        if (data) partesMeta.push(data);
        const metaTexto = partesMeta.join(" • ");

        return {
            src,
            alt: `${nomeFeicao} — Foto ${i + 1} de ${total}`,
            legenda,
            meta: metaTexto
        };
    });

    if (total === 1) {
        const s = slides[0];
        const infoHtml = (s.legenda || s.meta)
            ? `<figcaption class="pp-midia__info">`
                + (s.legenda ? `<p class="pp-midia__legenda">${esc(s.legenda)}</p>` : "")
                + (s.meta ? `<p class="pp-midia__meta">${esc(s.meta)}</p>` : "")
                + `</figcaption>`
            : "";
        return `<figure class="pp-midia">`
            + `<div class="pp-midia__moldura">`
            + `<img class="pp-midia__img" src="${esc(s.src)}" alt="${esc(s.alt)}" loading="lazy">`
            + `</div>`
            + infoHtml
            + `</figure>`;
    }

    const slidesHtml = slides.map((s, idx) => {
        const ativo = idx === 0 ? " pp-carrossel__slide--ativo" : "";
        const infoHtml = (s.legenda || s.meta)
            ? `<div class="pp-midia__info">`
                + (s.legenda ? `<p class="pp-midia__legenda">${esc(s.legenda)}</p>` : "")
                + (s.meta ? `<p class="pp-midia__meta">${esc(s.meta)}</p>` : "")
                + `</div>`
            : "";
        return `<div class="pp-carrossel__slide${ativo}" data-slide="${idx}">`
            + `<div class="pp-midia__moldura">`
            + `<img class="pp-midia__img" src="${esc(s.src)}" alt="${esc(s.alt)}" loading="lazy">`
            + `</div>`
            + infoHtml
            + `</div>`;
    }).join("");

    const chevronEsq = `<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"></polyline></svg>`;
    const chevronDir = `<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"></polyline></svg>`;

    return `<div class="pp-carrossel" data-total="${total}" data-atual="0" tabindex="0" role="region" aria-label="Galeria de fotos de ${esc(nomeFeicao)}">`
        + `<div class="pp-carrossel__slides">${slidesHtml}</div>`
        + `<button type="button" class="pp-carrossel__seta pp-carrossel__seta--esq" aria-label="Foto anterior" title="Foto anterior">${chevronEsq}</button>`
        + `<button type="button" class="pp-carrossel__seta pp-carrossel__seta--dir" aria-label="Próxima foto" title="Próxima foto">${chevronDir}</button>`
        + `<div class="pp-carrossel__indicador" aria-live="polite">1 / ${total}</div>`
        + `</div>`;
}

/**
 * Ativa interações do carrossel (setas laterais, scroll do mouse, teclado, touch e clique na imagem)
 * e previne que cliques fechem o popup do mapa.
 */
export function configurarCarrosseisPopup(container) {
    if (!container) return;
    const carrosseis = container.querySelectorAll(".pp-carrossel");
    carrosseis.forEach(carrossel => {
        carrossel.addEventListener("click", e => e.stopPropagation());
        carrossel.addEventListener("dblclick", e => e.stopPropagation());
        carrossel.addEventListener("mousedown", e => e.stopPropagation());

        const btnAnt = carrossel.querySelector(".pp-carrossel__seta--esq");
        const btnProx = carrossel.querySelector(".pp-carrossel__seta--dir");
        const contador = carrossel.querySelector(".pp-carrossel__indicador");
        const slides = carrossel.querySelectorAll(".pp-carrossel__slide");
        const total = slides.length;
        if (total <= 1) return;

        let atual = parseInt(carrossel.getAttribute("data-atual") || "0", 10);

        const mudar = delta => {
            atual = (atual + delta + total) % total;
            carrossel.setAttribute("data-atual", String(atual));
            slides.forEach((s, idx) => {
                s.classList.toggle("pp-carrossel__slide--ativo", idx === atual);
            });
            if (contador) contador.textContent = `${atual + 1} / ${total}`;
        };

        if (btnAnt) {
            btnAnt.onclick = e => {
                e.preventDefault();
                e.stopPropagation();
                mudar(-1);
            };
        }
        if (btnProx) {
            btnProx.onclick = e => {
                e.preventDefault();
                e.stopPropagation();
                mudar(1);
            };
        }

        // Permite avançar imagem clicando na foto (exceto nas setas)
        const molduras = carrossel.querySelectorAll(".pp-midia__moldura");
        molduras.forEach(m => {
            m.style.cursor = "pointer";
            m.title = "Clique para alternar para a próxima imagem";
            m.onclick = e => {
                if (e.target.closest(".pp-carrossel__seta")) return;
                e.preventDefault();
                e.stopPropagation();
                mudar(1);
            };
        });

        // Rolagem de fotos com o scroll / roda do mouse sobre a imagem
        let ultimoScroll = 0;
        carrossel.onwheel = e => {
            e.preventDefault();
            e.stopPropagation();
            const agora = Date.now();
            if (agora - ultimoScroll > 220) {
                ultimoScroll = agora;
                mudar(e.deltaY > 0 || e.deltaX > 0 ? 1 : -1);
            }
        };

        // Navegação por setas do teclado
        carrossel.onkeydown = e => {
            if (e.key === "ArrowLeft") {
                e.preventDefault();
                e.stopPropagation();
                mudar(-1);
            } else if (e.key === "ArrowRight") {
                e.preventDefault();
                e.stopPropagation();
                mudar(1);
            }
        };

        // Suporte a deslizar (swipe) em telas touch
        let toqueX = 0;
        carrossel.ontouchstart = e => {
            if (e.touches && e.touches.length) {
                toqueX = e.touches[0].clientX;
            }
        };
        carrossel.ontouchend = e => {
            if (e.changedTouches && e.changedTouches.length) {
                const diff = e.changedTouches[0].clientX - toqueX;
                if (Math.abs(diff) > 40) {
                    mudar(diff < 0 ? 1 : -1);
                }
            }
        };
    });
}

/** Une dois campos (ex.: município / UF) sem inventar valores. */
function municipioUf(p) {
    const partes = [p.municipio, p.uf].filter(v => !vazio(v));
    return linha("Município / UF", partes.length ? esc(partes.join(" / ")) : null);
}

// ------------------------------------------------------------
// Um template por camada (chave = id da camada em layers.js)
// ------------------------------------------------------------
export const POPUPS = {

    limite: p => popup(
        `Limite de ${vazio(p.municipio) ? "Florianópolis" : p.municipio}`,
        null,
        [
            texto("Município", p.municipio),
            texto("UF", p.uf),
            medida("Área calculada", p.area_calc_km2, 2, "km²")
        ],
        "Área calculada em SIRGAS 2000 / UTM 22S (EPSG:31982)."
    ),

    sede: p => popup(
        vazio(p.nome) ? "IEMC²" : p.nome,
        vazio(p.nome_completo) ? null : p.nome_completo,
        [
            texto("Tipo", p.tipo),
            texto("Instituição", p.instituicao),
            texto("Local", p.local)
        ],
        null,
        montarMidia(p)
    ),

    instituicoes: p => popup(
        p.nome,
        null,
        [
            texto("Tipo", p.tipo),
            texto("Rede de ensino", p.rede),
            texto("Bairro", p.bairro),
            municipioUf(p),
            texto("Sul da Ilha", p.sul_ilha),
            texto("Mutuca Educa 2026", p.mutuca_2026 === "Sim" ? "Inscrita / participante" : p.mutuca_2026),
            fonte("Fonte cadastral", null, p.fonte, "Página institucional")
        ],
        null
    ),

    pesca: p => {
        const titulo = !vazio(p.nome) ? p.nome : (vazio(p.descricao) ? "Grupo de pescadores" : p.descricao);
        const linhas = [];
        if (!vazio(p.descricao) && p.descricao !== titulo) {
            linhas.push(texto("Descrição", p.descricao));
        }
        if (!vazio(p.categoria)) {
            linhas.push(texto("Categoria", p.categoria));
        }
        if (!vazio(p.localidade)) {
            linhas.push(texto("Localidade", p.localidade));
        }
        if (!vazio(p.fonte)) {
            linhas.push(texto("Fonte", p.fonte));
        }
        return popup(
            titulo,
            null,
            linhas,
            "Referência territorial aproximada. Não representa localização exata, cadastro oficial nem inventário completo."
        );
    },

    parques: p => popup(
        p.nome_parque,
        null,
        [
            texto("Tipo de projeto", p.tipo_projeto),
            texto("Projeto (prj)", p.prj),
            texto("Corpo hídrico", p.corpo_hidrico),
            texto("UF", p.uf),
            medida("Área", p.area_ha, 2, "ha")
        ],
        "Área calculada em SIRGAS 2000 / UTM 22S (EPSG:31982)."
    ),

    areas: p => popup(
        vazio(p.num) ? "Área aquícola" : `Área aquícola nº ${p.num}`,
        null,
        [
            texto("Status", p.status),
            texto("Modalidade", p.modalidade),
            texto("Parque aquícola", p.nome_parque),
            texto("Corpo hídrico", p.corpo_hidrico),
            municipioUf(p),
            medida("Área mapeada", p.area_ha, 2, "ha"),
            texto("Fonte", p.fonte_dado)
        ],
        "Área mapeada na base temática. Não indica, por si só, que a área esteja cultivada."
    ),

    mona: p => popup(
        p.nome,
        null,
        [
            texto("Categoria", p.categoria),
            texto("Administração", p.administracao),
            texto("Superfície", p.superficie),
            texto("Grupo de proteção", p.grupo_protecao),
            medida("Área", p.area_ha, 2, "ha"),
            fonte("Link oficial", null, "https://redeplanejamento.pmf.sc.gov.br/pt-BR/programas/uc-lagoaperi", "Página oficial (PMF)")
        ],
        null
    ),

    resex: p => popup(
        p.nome,
        null,
        [
            texto("Categoria", p.categoria),
            texto("Administração", p.administracao),
            texto("Superfície", p.superficie),
            texto("Grupo de proteção", p.grupo_protecao),
            medida("Área", p.area_ha, 2, "ha"),
            fonte("Link oficial", null, "https://www.gov.br/icmbio/pt-br/assuntos/unidade-de-conservacao/unidades-de-biomas/marinho/lista-de-ucs/resex-marinha-do-pirajubae", "Página oficial (ICMBio)")
        ],
        null
    ),

    manguezal: p => popup(
        p.nome,
        null,
        [
            linha("Classificação", "Ecossistema de Manguezal"),
            texto("Classe na base de origem", p.classe),
            medida("Área mapeada", p.area_ha, 2, "ha")
        ],
        "Informação jurídica complementar: manguezais são Áreas de Preservação Permanente (APP) "
        + "pela legislação florestal (Lei nº 12.651/2012, art. 4º, VII). "
        + "Esta geometria é uma referência cartográfica e não constitui delimitação jurídica oficial de APP."
    ),

    goj_ta_sa: p => popup(
        p.nome,
        p.categoria,
        [
            texto("Localidade", p.localidade),
            texto("Descrição", p.descricao)
        ],
        null,
        montarMidia(p)
    ),

    trilha_mutuca: p => popup(
        p.nome,
        p.categoria,
        [
            texto("Localidade", p.localidade),
            texto("Descrição", p.descricao)
        ],
        null,
        montarMidia(p)
    ),

    monumentos: p => popup(
        p.nome,
        p.categoria,
        [
            texto("Localidade", p.localidade),
            texto("Descrição", p.descricao)
        ],
        null,
        montarMidia(p)
    )
};
