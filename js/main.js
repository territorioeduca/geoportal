// ============================================================
// GEOPORTAL TERRITÓRIO EDUCA — main.js
// Inicialização: mapa, mapas-base, camadas e interface.
// Leaflet (L) e Leaflet.markercluster vêm de vendor/ (scripts globais).
// ============================================================

import { criarPanes, carregarCamadas } from "./layers.js";
import { iniciarUI, iniciarModalSobre } from "./ui.js";

// Inicializa o modal "Sobre o geoportal" imediatamente, sem esperar carregamento dos dados
iniciarModalSobre();

// Enquadramento inspirado no recorte do Sul da Ilha do layout QGIS
// (aprox. UTM 22S x 732000–753500, y 6920000–6941500, convertido para lat/lng).
const VISTAS = {
    sulIlha: [[-27.83, -48.66], [-27.63, -48.44]]
};

const map = L.map("map", {
    minZoom: 3,
    maxZoom: 19,
    zoomControl: false,
    closePopupOnClick: true
}).fitBounds(VISTAS.sulIlha);

// Controle de zoom reposicionado para o canto superior direito
L.control.zoom({ position: "topright" }).addTo(map);

// Garante popup geográfico único e fechamento ao clicar em área vazia do mapa
map.on("popupopen", e => {
    map.eachLayer(l => {
        if (l instanceof L.Popup && l !== e.popup) {
            map.closePopup(l);
        }
    });
});

map.on("click", () => {
    map.closePopup();
});

window.map = map;

const esri = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {
        maxZoom: 19,
        attribution: "Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community"
    }
);

const osm = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a> contributors"
});

// O primeiro item é o mapa-base padrão.
const basemaps = {
    esri: { nome: "Satélite (Esri World Imagery)", layer: esri },
    osm: { nome: "OpenStreetMap", layer: osm }
};
esri.addTo(map);

L.control.scale({ imperial: false, position: "bottomleft" }).addTo(map);

criarPanes(map);

carregarCamadas(map)
    .then(({ estado, falhas, mascara }) => {
        iniciarUI({ map, estado, falhas, mascara, basemaps, vistas: VISTAS });
    })
    .catch(erro => {
        console.error(erro);
        const aviso = document.getElementById("aviso");
        aviso.textContent = "Erro ao iniciar o geoportal. Verifique se está sendo servido por HTTP(S).";
        aviso.hidden = false;
    });
