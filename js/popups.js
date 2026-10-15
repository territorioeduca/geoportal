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

function popup(titulo, subtitulo, linhas, nota) {
    return `<div class="pp">`
        + `<h3 class="pp__titulo">${esc(titulo)}</h3>`
        + (subtitulo ? `<p class="pp__sub">${esc(subtitulo)}</p>` : "")
        + `<dl class="pp__lista">${linhas.join("")}</dl>`
        + (nota ? `<p class="pp__nota">${esc(nota)}</p>` : "")
        + `</div>`;
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
            texto("Local", p.local),
            fonte("Fonte", p.fonte, p.fonte_url)
        ],
        "Ponto da sede institucional. Não representa área de atuação, abrangência ou influência territorial."
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

    ranchos: p => popup(
        p.nome,
        null,
        [
            texto("Tipo", p.tipo),
            texto("Descrição", p.descricao)
        ],
        "Referência cartográfica associada aos ranchos de pesca tradicional. Não representa inventário individual de edificações."
    ),

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
    )
};
