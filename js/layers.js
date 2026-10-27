// ============================================================
// GEOPORTAL TERRITÓRIO EDUCA — layers.js
// Registro das camadas, grupos temáticos, estilos, carregamento,
// rótulos por zoom, filtros e máscara visual de destaque.
// Nenhuma geometria é alterada: clusters e máscara são só visuais.
// ============================================================

import { POPUPS } from "./popups.js?v=20261026-v15";

const SENTINELA_VAZIO = "__vazio__";

// ------------------------------------------------------------
// Cores de referência (extraídas do projeto QGIS / layout)
// ------------------------------------------------------------
const COR = {
    aquicola: "#E31A6A",
    contorno: "#232323",
    mona: "#F4C542",
    resex: "#38A3A5",
    manguezal: "#22C55E",
    sede: "#FF0000",
    limite: "#D9DCD6",        // PROVISÓRIO: no QGIS o limite está desligado no mapa principal
    goj_ta_sa: "#8854A3",
    mutuca: "#29865B",
    monumentos: "#D88335"
};

const ICONE_ESCOLA = "assets/icons/simbolo_escola_capelo_laranja.svg";
const ICONE_PESCA = "assets/icons/peixe_grupos_pesca_artesanal.svg.svg";
const ICONE_GOJ_TA_SA = "assets/icons/marcador_cultural_goj_ta_sa.svg";
const ICONE_MUTUCA = "assets/icons/marcador_pegadas_mutuca.svg";
const ICONE_MONUMENTOS = "assets/icons/marcador_monumentos_artisticos.svg";

// ------------------------------------------------------------
// Panes (ordem de empilhamento, de baixo para cima)
// ------------------------------------------------------------
const PANES = {
    mascara: 330,
    limite: 340,
    uc: 420,
    manguezal: 430,
    areas: 440,
    pontos: 620,
    rotulos: 640
};

export function criarPanes(map) {
    Object.entries(PANES).forEach(([nome, z]) => {
        const pane = map.createPane(nome);
        pane.style.zIndex = z;
    });
    // A máscara nunca captura eventos do mouse/toque.
    map.getPane("mascara").style.pointerEvents = "none";
}

// ------------------------------------------------------------
// Grupos temáticos
// ------------------------------------------------------------
export const GRUPOS = [
    { id: "ref", nome: "Referências territoriais", camadas: ["limite", "sede"] },
    { id: "escolar", nome: "Comunidade escolar", camadas: ["instituicoes"] },
    { id: "arte_edu", nome: "Arte-educação", camadas: ["trilha_mutuca", "monumentos"] },
    { id: "tradicionais", nome: "Comunidades tradicionais", camadas: ["goj_ta_sa", "pesca"] },
    { id: "aqui", nome: "Aquicultura", camadas: ["areas"] },
    { id: "uc", nome: "Unidades de Conservação", camadas: ["mona", "resex"] },
    { id: "eco", nome: "Ecossistemas costeiros", camadas: ["manguezal"] }
];

// ------------------------------------------------------------
// Registro das camadas
// ------------------------------------------------------------
const estiloContornoAmarelo = {
    color: COR.amarelo, weight: 2, opacity: 1,
    fill: true, fillColor: COR.amarelo, fillOpacity: 0
};

export const CAMADAS = {

    limite: {
        titulo: "Limite de Florianópolis",
        arquivo: "limite_florianopolis.geojson",
        tipo: "poligono",
        pane: "limite",
        estilo: { color: COR.limite, weight: 2, opacity: 0.9, fill: false },
        legenda: { forma: "linha", cor: COR.limite },
        ligadaInicialmente: true
    },

    sede: {
        titulo: "Sede do IEMC²",
        arquivo: "sede_iemc2.geojson",
        tipo: "ponto-circulo",
        legenda: { forma: "ponto", cor: COR.sede },
        rotulos: [{
            texto: p => p.nome, classe: "lbl--direita lbl--forte",
            minZoom: 9, maxZoom: 19, posicao: "ponto"
        }],
        ligadaInicialmente: true
    },

    instituicoes: {
        titulo: "Instituições participantes do Mutuca Educa 2026",
        arquivo: "instituicoes_mutuca_educa_2026.geojson",
        tipo: "ponto-icone",
        icone: { url: ICONE_ESCOLA, tamanho: [28, 28] },
        titleMarcador: p => p.nome,
        cluster: { classe: "cluster--edu", raio: 16 },
        legenda: { forma: "icone", src: ICONE_ESCOLA },
        filtros: [
            { campo: "rede", rotulo: "Rede" }
        ],
        ligadaInicialmente: true
    },

    pesca: {
        titulo: "Grupos de pescadores",
        arquivo: "pesca_artesanal_sul.geojson",
        tipo: "ponto-icone",
        icone: { url: ICONE_PESCA, tamanho: [28, 18] },
        titleMarcador: p => `${p.descricao || "Grupo de pescadores"}${p.localidade ? " — " + p.localidade : ""}`,
        cluster: { classe: "cluster--pesca", raio: 16 },
        legenda: { forma: "icone", src: ICONE_PESCA },
        filtros: [
            // Localidades exibidas exatamente como estão nos dados (sem normalização).
            { campo: "localidade", rotulo: "Localidade" }
        ],
        ligadaInicialmente: true
    },

    areas: {
        titulo: "Áreas Aquícolas da Baía Sul",
        arquivo: "areas_aquicolas_baia_sul.geojson",
        tipo: "poligono",
        pane: "areas",
        estilo: {
            color: COR.contorno, weight: 1, opacity: 1,
            fill: true, fillColor: COR.aquicola, fillOpacity: 1
        },
        legenda: { forma: "quadrado", cor: COR.aquicola, contorno: COR.contorno },
        // Ponto de referência/rótulo associado: não é camada temática independente.
        rotuloAssociado: {
            arquivo: "rotulo_areas_aquicolas_baia_sul.geojson",
            classe: "lbl--centro", minZoom: 11, maxZoom: 15
        },
        ligadaInicialmente: true
    },

    mona: {
        titulo: "MONA da Lagoa do Peri",
        arquivo: "mona_lagoa_peri.geojson",
        tipo: "poligono",
        pane: "uc",
        estilo: {
            color: COR.mona, weight: 2.5, opacity: 1,
            fill: true, fillColor: COR.mona, fillOpacity: 0.1
        },
        legenda: { forma: "contorno", cor: COR.mona },
        rotulos: [{
            texto: () => "MONA da Lagoa\ndo Peri", classe: "lbl--centro",
            minZoom: 11, maxZoom: 17, posicao: "interior"
        }],
        ligadaInicialmente: true
    },

    resex: {
        titulo: "RESEX Marinha do Pirajubaé",
        arquivo: "resex_pirajubae.geojson",
        tipo: "poligono",
        pane: "uc",
        estilo: {
            color: COR.resex, weight: 2.5, opacity: 1,
            fill: true, fillColor: COR.resex, fillOpacity: 0.1
        },
        legenda: { forma: "contorno", cor: COR.resex },
        rotulos: [{
            texto: () => "RESEX Marinha\ndo Pirajubaé", classe: "lbl--centro",
            minZoom: 11, maxZoom: 17, posicao: "interior"
        }],
        ligadaInicialmente: true
    },

    manguezal: {
        titulo: "Manguezal da Tapera",
        arquivo: "manguezal_tapera.geojson",
        tipo: "poligono",
        pane: "manguezal",
        estilo: {
            color: COR.manguezal, weight: 2.5, opacity: 1,
            fill: true, fillColor: COR.manguezal, fillOpacity: 0.15
        },
        legenda: { forma: "contorno", cor: COR.manguezal },
        rotulos: [{
            texto: () => "Manguezal da Tapera", classe: "lbl--abaixo-esq",
            minZoom: 13, maxZoom: 19, posicao: "centro-bounds"
        }],
        ligadaInicialmente: true
    },

    goj_ta_sa: {
        titulo: "Ponto de Cultura Indígena Goj Tá Sá",
        arquivo: "territorio_indigena_goj_ta_sa.geojson",
        tipo: "ponto-icone",
        icone: { url: ICONE_GOJ_TA_SA, tamanho: [28, 31], ancora: [14, 31], popupAncora: [0, -30] },
        titleMarcador: p => p.nome,
        legenda: { forma: "icone", src: ICONE_GOJ_TA_SA },
        ligadaInicialmente: true
    },

    trilha_mutuca: {
        titulo: "Roteiro Ecopedagógico da Mutuca",
        arquivo: "trilha_ecopedagogica_mutuca.geojson",
        tipo: "ponto-icone",
        icone: { url: ICONE_MUTUCA, tamanho: [28, 31], ancora: [23, 31], popupAncora: [-9, -30] },
        titleMarcador: p => p.nome,
        legenda: { forma: "icone", src: ICONE_MUTUCA },
        ligadaInicialmente: true
    },

    monumentos: {
        titulo: "Monumentos artísticos",
        arquivo: "monumentos_artisticos.geojson",
        tipo: "ponto-icone",
        icone: { url: ICONE_MONUMENTOS, tamanho: [28, 31], ancora: [5, 31], popupAncora: [9, -30] },
        titleMarcador: p => p.nome,
        cluster: { classe: "cluster--monumentos", raio: 16 },
        legenda: { forma: "icone", src: ICONE_MONUMENTOS },
        filtros: [
            { campo: "nome", rotulo: "Monumento" }
        ],
        ligadaInicialmente: true
    }
};

// Ids que alimentam a máscara de destaque (geometrias públicas).
const IDS_DESTAQUE = ["mona", "resex", "manguezal"];

// ------------------------------------------------------------
// Utilitários geométricos (apenas para posicionar rótulos)
// ------------------------------------------------------------
function partes(geom) {
    return geom.type === "Polygon" ? [geom.coordinates] : geom.coordinates;
}

function limitesDe(anel) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    anel.forEach(([x, y]) => {
        minX = Math.min(minX, x); maxX = Math.max(maxX, x);
        minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    });
    return { minX, minY, maxX, maxY };
}

function dentro(x, y, anel) {
    let dentroDoAnel = false;
    for (let i = 0, j = anel.length - 1; i < anel.length; j = i++) {
        const [xi, yi] = anel[i], [xj, yj] = anel[j];
        if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) {
            dentroDoAnel = !dentroDoAnel;
        }
    }
    return dentroDoAnel;
}

/** Ponto interior (lat, lng) perto do centro da maior parte do polígono. */
function pontoInterior(geom) {
    let melhor = null, maiorArea = -1;
    partes(geom).forEach(p => {
        const b = limitesDe(p[0]);
        const area = (b.maxX - b.minX) * (b.maxY - b.minY);
        if (area > maiorArea) { maiorArea = area; melhor = p[0]; }
    });
    const b = limitesDe(melhor);
    const cx = (b.minX + b.maxX) / 2, cy = (b.minY + b.maxY) / 2;
    let escolhido = null, menorDist = Infinity;
    const N = 60;
    for (let i = 0; i <= N; i++) {
        for (let j = 0; j <= N; j++) {
            const x = b.minX + (b.maxX - b.minX) * i / N;
            const y = b.minY + (b.maxY - b.minY) * j / N;
            if (dentro(x, y, melhor)) {
                const d = (x - cx) ** 2 + (y - cy) ** 2;
                if (d < menorDist) { menorDist = d; escolhido = [y, x]; }
            }
        }
    }
    return escolhido || [cy, cx];
}

/** Centro do retângulo envolvente de toda a geometria (lat, lng). */
function centroBounds(geom) {
    const todos = partes(geom).flatMap(p => p[0]);
    const b = limitesDe(todos);
    return [(b.minY + b.maxY) / 2, (b.minX + b.maxX) / 2];
}

function posicaoRotulo(feature, spec) {
    const g = feature.geometry;
    if (spec.posicao === "ponto") return [g.coordinates[1], g.coordinates[0]];
    if (spec.posicao === "interior") return pontoInterior(g);
    return centroBounds(g);
}

// ------------------------------------------------------------
// Construção das camadas
// ------------------------------------------------------------
function criarMarcadorRotulo(latlng, texto, classe) {
    const html = `<span class="lbl ${classe}"></span>`;
    const marcador = L.marker(latlng, {
        pane: "rotulos",
        interactive: false,
        keyboard: false,
        icon: L.divIcon({ className: "lbl-wrap", html, iconSize: [0, 0] })
    });
    // Texto inserido via textContent (sem HTML).
    marcador._textoRotulo = texto;
    marcador.on("add", () => {
        const el = marcador.getElement();
        if (el && el.firstChild) el.firstChild.textContent = texto;
    });
    return marcador;
}

function construirCamada(def, geojson) {
    const rt = {
        def,
        features: geojson.features,
        total: geojson.features.length,
        exibidas: geojson.features.length,
        visivel: false,
        rotulos: []
    };

    const onEachFeature = (feature, layer) => {
        const gerar = POPUPS[def.id];
        if (gerar) {
            const temMidia = Boolean(feature.properties && feature.properties.imagem);
            layer.bindPopup(() => gerar(feature.properties), {
                minWidth: temMidia ? 320 : 260,
                maxWidth: temMidia ? 820 : 380,
                className: temMidia ? "popup-te popup-te--amplo" : "popup-te",
                autoPan: true,
                autoPanPaddingTopLeft: L.point(20, 56),
                autoPanPaddingBottomRight: L.point(20, 24),
                keepInView: true,
                closeOnEscapeKey: true,
                autoClose: true,
                closeOnClick: true
            });
        }
    };

    if (def.tipo === "poligono") {
        rt.grupo = L.geoJSON(null, {
            pane: def.pane,
            style: () => def.estilo,
            bubblingMouseEvents: false,
            onEachFeature
        });
    } else if (def.tipo === "ponto-circulo") {
        rt.grupo = L.geoJSON(null, {
            pointToLayer: (f, latlng) => L.circleMarker(latlng, {
                pane: "pontos", radius: 7, weight: 3,
                color: "#FFFFFF", opacity: 0.55,
                fillColor: COR.sede, fillOpacity: 1,
                bubblingMouseEvents: false
            }),
            onEachFeature
        });
    } else {
        const icone = L.icon({
            iconUrl: def.icone.url,
            iconSize: def.icone.tamanho,
            iconAnchor: def.icone.ancora || [def.icone.tamanho[0] / 2, def.icone.tamanho[1] / 2],
            popupAnchor: def.icone.popupAncora || [0, -def.icone.tamanho[1] / 2]
        });
        rt.fabricaPontos = dados => L.geoJSON(dados, {
            pointToLayer: (f, latlng) => L.marker(latlng, {
                icon: icone,
                keyboard: true,
                title: def.titleMarcador ? def.titleMarcador(f.properties) : "",
                bubblingMouseEvents: false
            }),
            onEachFeature
        });
        if (def.cluster) {
            // Agrupamento/spiderfy apenas na interface; coordenadas intactas.
            rt.grupo = L.markerClusterGroup({
                maxClusterRadius: def.cluster.raio,
                showCoverageOnHover: false,
                spiderfyOnMaxZoom: true,
                zoomToBoundsOnClick: true,
                spiderLegPolylineOptions: { weight: 1.5, color: "#FFFFFF", opacity: 0.85 },
                iconCreateFunction: c => L.divIcon({
                    html: `<span>${c.getChildCount()}</span>`,
                    className: `cluster ${def.cluster.classe}`,
                    iconSize: [20, 20]
                })
            });
        } else {
            rt.grupo = L.layerGroup();
        }
    }

    // Rótulos da própria camada.
    (def.rotulos || []).forEach(spec => {
        const f = rt.features[0];
        if (!f) return;
        const m = criarMarcadorRotulo(posicaoRotulo(f, spec), spec.texto(f.properties), spec.classe);
        rt.rotulos.push({ marcador: m, minZoom: spec.minZoom, maxZoom: spec.maxZoom });
    });

    renderizar(rt, rt.features);
    return rt;
}

function renderizar(rt, feats) {
    const dados = { type: "FeatureCollection", features: feats };
    if (rt.fabricaPontos) {
        rt.grupo.clearLayers();
        rt.grupo.addLayer(rt.fabricaPontos(dados));
    } else if (rt.def.tipo === "poligono" || rt.def.tipo === "ponto-circulo") {
        rt.grupo.clearLayers();
        rt.grupo.addData(dados);
    }
    rt.exibidas = feats.length;
}

// ------------------------------------------------------------
// Carregamento
// ------------------------------------------------------------
async function buscarJson(arquivo) {
    const resp = await fetch(`data/${arquivo}?v=20261026-v15`, { cache: "no-store" });
    if (!resp.ok) throw new Error(`Falha ao carregar ${arquivo} (HTTP ${resp.status})`);
    return resp.json();
}

export async function carregarCamadas(map) {
    const estado = {};
    const falhas = [];

    await Promise.all(Object.entries(CAMADAS).map(async ([id, def]) => {
        def.id = id;
        try {
            estado[id] = construirCamada(def, await buscarJson(def.arquivo));
        } catch (erro) {
            console.error(erro);
            falhas.push(def.titulo);
        }
    }));

    // Ponto de referência das áreas aquícolas: apenas rótulo, sem popup/contagem.
    const areas = estado.areas;
    if (areas && areas.def.rotuloAssociado) {
        const r = areas.def.rotuloAssociado;
        try {
            const gj = await buscarJson(r.arquivo);
            const f = gj.features[0];
            const m = criarMarcadorRotulo(
                [f.geometry.coordinates[1], f.geometry.coordinates[0]],
                f.properties.nome, r.classe);
            areas.rotulos.push({ marcador: m, minZoom: r.minZoom, maxZoom: r.maxZoom });
        } catch (erro) {
            console.error(erro);
        }
    }

    // Mostra as camadas ligadas inicialmente.
    Object.values(estado).forEach(rt => {
        if (rt.def.ligadaInicialmente) definirVisivel(map, estado, rt.def.id, true);
    });
    map.on("zoomend", () => atualizarRotulos(map, estado));
    atualizarRotulos(map, estado);

    return { estado, falhas, mascara: criarMascara(estado) };
}

// ------------------------------------------------------------
// Visibilidade e rótulos por zoom
// ------------------------------------------------------------
export function definirVisivel(map, estado, id, visivel) {
    const rt = estado[id];
    if (!rt) return;
    rt.visivel = visivel;
    if (visivel && !map.hasLayer(rt.grupo)) map.addLayer(rt.grupo);
    if (!visivel && map.hasLayer(rt.grupo)) map.removeLayer(rt.grupo);
    atualizarRotulos(map, estado);
}

export function atualizarRotulos(map, estado) {
    const z = map.getZoom();
    Object.values(estado).forEach(rt => {
        rt.rotulos.forEach(r => {
            const mostrar = rt.visivel && z >= r.minZoom && z <= r.maxZoom;
            const naMapa = map.hasLayer(r.marcador);
            if (mostrar && !naMapa) r.marcador.addTo(map);
            if (!mostrar && naMapa) map.removeLayer(r.marcador);
        });
    });
}

// ------------------------------------------------------------
// Filtros (apenas valores existentes nos dados)
// ------------------------------------------------------------
function ehVazio(v) {
    return v === null || v === undefined || String(v).trim() === "";
}

export function valoresDoFiltro(rt, campo, excluirOpcoes = []) {
    const valores = new Set();
    let temVazio = false;
    rt.features.forEach(f => {
        const v = f.properties[campo];
        if (ehVazio(v)) {
            temVazio = true;
        } else {
            const str = String(v);
            if (!excluirOpcoes.includes(str)) {
                valores.add(str);
            }
        }
    });
    const lista = [...valores].sort((a, b) => a.localeCompare(b, "pt-BR"))
        .map(v => ({ valor: v, texto: v }));
    return { lista, temVazio };
}

export function aplicarFiltros(rt, criterios) {
    const feats = rt.features.filter(f => Object.entries(criterios).every(([campo, esperado]) => {
        if (esperado === "") return true;
        const v = f.properties[campo];
        if (esperado === SENTINELA_VAZIO) return ehVazio(v);
        return !ehVazio(v) && String(v) === esperado;
    }));
    renderizar(rt, feats);
    return feats.length;
}

export { SENTINELA_VAZIO };

// ------------------------------------------------------------
// Máscara visual de destaque (puramente estética e não interativa)
// Esmaece o entorno de MONA, RESEX e Manguezal, reproduzindo o
// efeito do layout do QGIS com as geometrias públicas dessas camadas.
// ------------------------------------------------------------
function criarMascara(estado) {
    if (!IDS_DESTAQUE.every(id => estado[id])) return null;
    const aneis = [];
    IDS_DESTAQUE.forEach(id => {
        estado[id].features.forEach(f => {
            partes(f.geometry).forEach(p => p.forEach(anel => {
                aneis.push(anel.map(([x, y]) => [y, x]));
            }));
        });
    });
    const mundo = [[-85, -180], [-85, 180], [85, 180], [85, -180]];
    return L.polygon([mundo, ...aneis], {
        pane: "mascara",
        stroke: false,
        fillColor: "#FFFFFF",
        fillOpacity: 0.27,
        fillRule: "evenodd",
        interactive: false,
        bubblingMouseEvents: false
    });
}

/** Limites (L.LatLngBounds) do limite municipal, para "Ver Florianópolis inteira". */
export function limitesFlorianopolis(estado) {
    const rt = estado.limite;
    return rt ? L.geoJSON({ type: "FeatureCollection", features: rt.features }).getBounds() : null;
}
