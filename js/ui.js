// ============================================================
// GEOPORTAL TERRITÓRIO EDUCA — ui.js
// Painel (camadas + legenda + filtros), mapa-base, controles do
// mapa e comportamento responsivo. Todo texto é inserido com
// textContent; nenhum dado é interpretado como HTML.
// ============================================================

import {
    GRUPOS, CAMADAS, definirVisivel, valoresDoFiltro, aplicarFiltros,
    SENTINELA_VAZIO
} from "./layers.js?v=20261027-v40";

function el(tag, atributos = {}, filhos = []) {
    const e = document.createElement(tag);
    Object.entries(atributos).forEach(([k, v]) => {
        if (k === "className") e.className = v;
        else if (k === "texto") e.textContent = v;
        else e.setAttribute(k, v);
    });
    filhos.forEach(f => e.appendChild(f));
    return e;
}

let contadorId = 0;
const novoId = prefixo => `${prefixo}-${++contadorId}`;

// ------------------------------------------------------------
// Símbolo de legenda
// ------------------------------------------------------------
function simbolo(leg, idCamada = "") {
    const classes = ["sim"];
    if (idCamada) classes.push(`sim--${idCamada}`);
    const s = el("span", { className: classes.join(" "), "aria-hidden": "true" });
    switch (leg.forma) {
        case "icone": {
            s.classList.add("sim--icone");
            s.appendChild(el("img", { src: leg.src, alt: "" }));
            break;
        }
        case "ponto": {
            const p = el("span", { className: "sim__ponto" });
            p.style.background = leg.cor;
            s.appendChild(p);
            break;
        }
        case "quadrado":
            s.classList.add("sim--quadrado");
            s.style.background = leg.cor;
            s.style.borderColor = leg.contorno;
            break;
        case "contorno":
            s.classList.add("sim--quadrado");
            s.style.background = "transparent";
            s.style.borderColor = leg.cor;
            s.style.borderWidth = "2px";
            break;
        case "tracejado":
            s.classList.add("sim--quadrado");
            s.style.background = "rgba(227, 26, 106, 0.08)";
            s.style.borderColor = leg.cor;
            s.style.borderStyle = "dashed";
            s.style.borderWidth = "2px";
            break;
        case "linha":
            s.classList.add("sim--linha");
            s.style.borderTopColor = leg.cor;
            break;
    }
    return s;
}

// ------------------------------------------------------------
// Painel de camadas
// ------------------------------------------------------------
function construirCamadas(ctx, container) {
    const { map, estado } = ctx;
    let indiceGrupo = 0;

    GRUPOS.forEach(grupo => {
        const ids = grupo.camadas.filter(id => estado[id]);
        if (!ids.length) return;

        // Acordeão: apenas a primeira categoria começa aberta.
        const aberto = indiceGrupo === 0;
        indiceGrupo++;

        const idCab = novoId("grupo");
        const idCorpo = novoId("grupo-corpo");
        const secao = el("section", {
            className: aberto ? "grupo grupo--aberto" : "grupo",
            "aria-labelledby": idCab
        });
        const botaoGrupo = el("button", {
            type: "button",
            className: "grupo__toggle",
            "aria-expanded": String(aberto),
            "aria-controls": idCorpo
        }, [el("span", { className: "grupo__nome", texto: grupo.nome })]);
        const cab = el("h3", { className: "grupo__cab", id: idCab }, [botaoGrupo]);
        secao.appendChild(cab);

        const interno = el("div", { className: "grupo__interno" });
        const corpoGrupo = el("div", { className: "grupo__corpo", id: idCorpo }, [interno]);
        if (!aberto) interno.setAttribute("inert", "");
        secao.appendChild(corpoGrupo);

        botaoGrupo.addEventListener("click", () => {
            const abrir = !secao.classList.contains("grupo--aberto");
            secao.classList.toggle("grupo--aberto", abrir);
            botaoGrupo.setAttribute("aria-expanded", String(abrir));
            if (abrir) interno.removeAttribute("inert");
            else interno.setAttribute("inert", "");
        });

        ids.forEach(id => {
            const rt = estado[id];
            const def = rt.def;
            const idChk = novoId("camada");
            const chk = el("input", { type: "checkbox", id: idChk });
            chk.checked = rt.visivel;

            const contagem = el("span", { className: "camada__n", texto: `(${rt.total})` });
            const filhosRotulo = [
                simbolo(def.legenda, id),
                el("span", { className: "camada__titulo", texto: def.titulo })
            ];
            if (grupo.id !== "ref") {
                filhosRotulo.push(contagem);
            }
            const rotulo = el("label", { className: "camada__rotulo", for: idChk }, filhosRotulo);
            const item = el("div", { className: "camada" }, [chk, rotulo]);
            if (def.provisorio) {
                item.appendChild(el("span", {
                    className: "selo",
                    texto: "provisório",
                    title: `Estilo provisório (${def.provisorio}); não é identidade visual aprovada.`
                }));
            }

            chk.addEventListener("change", () => {
                definirVisivel(map, estado, id, chk.checked);
            });
            interno.appendChild(item);

            if (def.filtros) interno.appendChild(construirFiltros(rt, contagem));
        });

        container.appendChild(secao);
    });
}

function construirFiltros(rt, contagem) {
    const def = rt.def;
    const criterios = {};
    const selects = [];

    const detalhes = el("details", { className: "filtros" }, [
        el("summary", { texto: "Filtrar" })
    ]);

    const aplicar = () => {
        const n = aplicarFiltros(rt, criterios);
        const filtrando = Object.values(criterios).some(v => v !== "");
        contagem.textContent = filtrando ? `(${n} de ${rt.total})` : `(${rt.total})`;
    };

    def.filtros.forEach(filtro => {
        const { lista, temVazio } = valoresDoFiltro(rt, filtro.campo, filtro.excluirOpcoes);
        const idSel = novoId("filtro");
        const sel = el("select", { id: idSel });
        sel.appendChild(el("option", { value: "", texto: "Todos" }));
        lista.forEach(o => sel.appendChild(el("option", { value: o.valor, texto: o.texto })));
        if (temVazio) {
            sel.appendChild(el("option", { value: SENTINELA_VAZIO, texto: filtro.vazioComo || "Não informado" }));
        }
        criterios[filtro.campo] = "";
        sel.addEventListener("change", () => { criterios[filtro.campo] = sel.value; aplicar(); });
        selects.push(sel);
        detalhes.appendChild(el("div", { className: "filtro" }, [
            el("label", { for: idSel, texto: filtro.rotulo }), sel
        ]));
    });

    const limpar = el("button", { type: "button", className: "btn-link", texto: "Limpar filtros" });
    limpar.addEventListener("click", () => {
        selects.forEach(s => { s.value = ""; });
        Object.keys(criterios).forEach(k => { criterios[k] = ""; });
        aplicar();
    });
    detalhes.appendChild(limpar);
    return detalhes;
}

// ------------------------------------------------------------
// Mapa-base e visualização
// ------------------------------------------------------------
function construirMapaBase(ctx, container) {
    const { map, basemaps } = ctx;
    const fs = el("fieldset", { className: "bloco" }, [el("legend", { texto: "Mapa-base" })]);
    Object.entries(basemaps).forEach(([chave, b], i) => {
        const id = novoId("base");
        const r = el("input", { type: "radio", name: "mapabase", id, value: chave });
        r.checked = i === 0;
        r.addEventListener("change", () => {
            Object.values(basemaps).forEach(x => { if (map.hasLayer(x.layer)) map.removeLayer(x.layer); });
            b.layer.addTo(map);
        });
        fs.appendChild(el("div", { className: "opcao" }, [r, el("label", { for: id, texto: b.nome })]));
    });
    container.appendChild(fs);
}

// ------------------------------------------------------------
// ------------------------------------------------------------
// Gaveta Institucional Lateral Direita (acessibilidade, teclado e foco)
// ------------------------------------------------------------
let modalIniciado = false;
let controladorSidebar = null;
let sidebarEstavaAberta = false;

export function iniciarModalSobre() {
    if (modalIniciado) return;
    const modal = document.getElementById("modal-sobre");
    const tituloModal = document.getElementById("modal-sobre-titulo");
    const btnFechar = document.getElementById("btn-fechar-modal");
    const btnMenuMobile = document.getElementById("btn-menu-mobile");
    const menuLista = document.getElementById("menu-institucional");
    const navBotoes = document.querySelectorAll(".nav__item[data-secao]");
    const linkRetornoMapa = document.getElementById("link-retorno-mapa");
    const paineis = modal ? modal.querySelectorAll(".modal__painel-secao") : [];
    const corpo = document.body;
    const movel = window.matchMedia("(max-width: 800px)");

    if (!modal || !btnFechar) return;
    modalIniciado = true;

    let ultimoFoco = null;

    const TITULOS_SECOES = {
        "secao-projeto": "O projeto",
        "secao-fontes": "Dados e fontes",
        "secao-parceiros": "Parceiros",
        "secao-contato": "Contato"
    };

    const fecharMenuMobile = () => {
        if (btnMenuMobile && menuLista) {
            btnMenuMobile.setAttribute("aria-expanded", "false");
            menuLista.classList.remove("nav__lista--aberta");
        }
    };

    const definirSecao = secaoId => {
        if (!secaoId) return;
        if (tituloModal && TITULOS_SECOES[secaoId]) {
            tituloModal.textContent = TITULOS_SECOES[secaoId];
        }
        paineis.forEach(p => {
            p.hidden = p.id !== secaoId;
        });
        const corpoPainel = modal.querySelector(".gaveta__corpo, .modal__corpo");
        if (corpoPainel) corpoPainel.scrollTop = 0;
    };

    const atualizarMenuAtivo = secaoId => {
        navBotoes.forEach(b => {
            const ehAtivo = b.getAttribute("data-secao") === secaoId;
            b.classList.toggle("nav__item--ativo", ehAtivo);
            b.setAttribute("aria-expanded", String(ehAtivo));
        });
    };

    const abrirOuTrocar = (origem, secaoId) => {
        const jaAberta = corpo.classList.contains("gaveta-aberta");
        if (!jaAberta) {
            ultimoFoco = origem || document.activeElement;
            // No desktop, recolhe temporariamente a sidebar esquerda se estiver aberta
            if (controladorSidebar && !movel.matches) {
                sidebarEstavaAberta = controladorSidebar.estaAberto();
                if (sidebarEstavaAberta) {
                    controladorSidebar.definir(false);
                }
            }
        }

        definirSecao(secaoId);
        atualizarMenuAtivo(secaoId);

        if (!jaAberta) {
            corpo.classList.add("gaveta-aberta");
            modal.removeAttribute("hidden");
            modal.setAttribute("aria-hidden", "false");
            modal.setAttribute("open", "");
        }

        if (btnFechar) btnFechar.focus();
        fecharMenuMobile();

        if (controladorSidebar && controladorSidebar.map) {
            setTimeout(() => controladorSidebar.map.invalidateSize(), 280);
        }
    };

    const fechar = () => {
        const estavaAberta = corpo.classList.contains("gaveta-aberta") || modal.hasAttribute("open");
        if (!estavaAberta) return;

        corpo.classList.remove("gaveta-aberta");
        modal.setAttribute("hidden", "");
        modal.setAttribute("aria-hidden", "true");
        modal.removeAttribute("open");

        navBotoes.forEach(b => {
            b.classList.remove("nav__item--ativo");
            b.setAttribute("aria-expanded", "false");
        });

        // No desktop, restaura o estado anterior da sidebar esquerda se estava aberta
        if (controladorSidebar && !movel.matches) {
            if (sidebarEstavaAberta) {
                controladorSidebar.definir(true);
                sidebarEstavaAberta = false;
            }
            if (controladorSidebar.map) {
                setTimeout(() => controladorSidebar.map.invalidateSize(), 280);
            }
        }

        if (ultimoFoco && typeof ultimoFoco.focus === "function") {
            ultimoFoco.focus();
        }
        fecharMenuMobile();
    };

    // Navegação nos botões do menu institucional: se clicar na mesma seção já aberta, fecha a gaveta; caso contrário, abre ou troca
    navBotoes.forEach(btn => {
        btn.addEventListener("click", () => {
            const secao = btn.getAttribute("data-secao");
            const jaAberta = corpo.classList.contains("gaveta-aberta");
            const mesmaSecao = btn.classList.contains("nav__item--ativo");
            if (jaAberta && mesmaSecao) {
                fechar();
            } else {
                abrirOuTrocar(btn, secao);
            }
        });
    });

    // Título "Geoportal Território Educa" funciona como retorno ao mapa
    if (linkRetornoMapa) {
        linkRetornoMapa.addEventListener("click", e => {
            e.preventDefault();
            fechar();
            const mapEl = document.getElementById("map");
            if (mapEl) mapEl.focus();
        });
    }

    // Botão Fechar (X)
    btnFechar.addEventListener("click", fechar);

    // Tecla Escape fecha a gaveta
    document.addEventListener("keydown", e => {
        if (e.key === "Escape" && corpo.classList.contains("gaveta-aberta")) {
            e.preventDefault();
            fechar();
        }
    });

    // Menu mobile
    if (btnMenuMobile && menuLista) {
        btnMenuMobile.addEventListener("click", () => {
            const aberto = btnMenuMobile.getAttribute("aria-expanded") === "true";
            btnMenuMobile.setAttribute("aria-expanded", String(!aberto));
            menuLista.classList.toggle("nav__lista--aberta", !aberto);
        });

        document.addEventListener("click", e => {
            if (!btnMenuMobile.contains(e.target) && !menuLista.contains(e.target)) {
                fecharMenuMobile();
            }
        });
    }
}

// ------------------------------------------------------------
// Entrada
// ------------------------------------------------------------
export function iniciarUI(ctx) {
    const conteudo = document.getElementById("painel-conteudo");
    construirMapaBase(ctx, conteudo);
    const camadas = el("div", { className: "bloco" }, [
        el("h2", { className: "bloco__titulo", texto: "Camadas e legenda" })
    ]);
    construirCamadas(ctx, camadas);
    conteudo.appendChild(camadas);

    iniciarModalSobre();

    if (ctx.falhas.length) {
        const aviso = document.getElementById("aviso");
        aviso.textContent = `Não foi possível carregar: ${ctx.falhas.join(", ")}.`;
        aviso.hidden = false;
    }

    // Painel recolhível (desktop) / gaveta (celular).
    const { map } = ctx;
    const botao = document.getElementById("btn-painel");
    const painel = document.getElementById("painel");
    const painelBackdrop = document.getElementById("painel-backdrop");
    const corpo = document.body;
    const movel = window.matchMedia("(max-width: 800px)");
    const definir = aberto => {
        corpo.classList.toggle("painel-oculto", !aberto);
        botao.setAttribute("aria-expanded", String(aberto));
        const rotulo = aberto ? "Recolher painel de camadas" : "Abrir painel de camadas";
        botao.setAttribute("aria-label", rotulo);
        botao.title = rotulo;
        setTimeout(() => map.invalidateSize(), 260);
    };
    definir(!movel.matches);

    controladorSidebar = {
        estaAberto: () => !corpo.classList.contains("painel-oculto"),
        definir: definir,
        map: map
    };

    botao.addEventListener("click", () => {
        const novoAberto = corpo.classList.contains("painel-oculto");
        definir(novoAberto);
        if (corpo.classList.contains("gaveta-aberta")) {
            sidebarEstavaAberta = novoAberto;
        }
    });

    // Fechar sidebar ao tocar fora dela no mobile (backdrop ou área externa)
    if (painelBackdrop) {
        painelBackdrop.addEventListener("click", () => {
            if (movel.matches && !corpo.classList.contains("painel-oculto")) {
                definir(false);
            }
        });
    }

    document.addEventListener("click", e => {
        if (!movel.matches || corpo.classList.contains("painel-oculto")) return;
        if (painel && !painel.contains(e.target) && !botao.contains(e.target)) {
            definir(false);
        }
    });

    document.addEventListener("keydown", e => {
        if (corpo.classList.contains("gaveta-aberta")) return; // Escape tratado pela gaveta institucional
        if (e.key === "Escape" && movel.matches && !corpo.classList.contains("painel-oculto")) {
            definir(false);
            botao.focus();
        }
    });
    window.addEventListener("resize", () => map.invalidateSize());
}
