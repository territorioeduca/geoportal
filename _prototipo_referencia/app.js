// ============================================================
// GEOPORTAL TERRITÓRIO EDUCA
// ============================================================


// ------------------------------------------------------------
// 1. CRIAR O MAPA
// ------------------------------------------------------------

const map = L.map("map").setView(
    [-27.67, -48.55],
    11
);


// ------------------------------------------------------------
// 2. MAPA-BASE
// ------------------------------------------------------------

const osm = L.tileLayer(
    "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors"
    }
).addTo(map);


// ------------------------------------------------------------
// 3. CONTROLE DE CAMADAS
// ------------------------------------------------------------

const mapasBase = {
    "OpenStreetMap": osm
};

const camadasTematicas = {};

const controleCamadas = L.control.layers(
    mapasBase,
    camadasTematicas,
    {
        collapsed: false
    }
).addTo(map);


// ------------------------------------------------------------
// 4. LIMITE DE FLORIANÓPOLIS
// ------------------------------------------------------------

fetch("data/limite_florianopolis.geojson")

    .then(response => {

        if (!response.ok) {
            throw new Error(
                "Erro ao carregar limite de Florianópolis."
            );
        }

        return response.json();
    })

    .then(data => {

        const camadaLimite = L.geoJSON(
            data,
            {
                // O limite é apenas visual.
                // Ele não deve capturar cliques do mouse.
                interactive: false,

                style: {
                    color: "#555555",
                    weight: 2,
                    fillOpacity: 0
                }
            }
        ).addTo(map);

        controleCamadas.addOverlay(
            camadaLimite,
            "Limite de Florianópolis"
        );

        // Ajusta inicialmente a visualização
        // ao município de Florianópolis.
        map.fitBounds(
            camadaLimite.getBounds()
        );

        console.log(
            "Limite de Florianópolis carregado."
        );
    })

    .catch(error => {

        console.error(
            "Erro no limite de Florianópolis:",
            error
        );
    });


// ------------------------------------------------------------
// 5. SEDE DO IEMC²
// ------------------------------------------------------------

fetch("data/sede_iemc2.geojson")

    .then(response => {

        if (!response.ok) {
            throw new Error(
                "Erro ao carregar sede do IEMC²."
            );
        }

        return response.json();
    })

    .then(data => {

        const camadaIEMC = L.geoJSON(
            data,
            {
                pointToLayer: function (
                    feature,
                    latlng
                ) {

                    return L.circleMarker(
                        latlng,
                        {
                            radius: 8,
                            weight: 2,
                            fillOpacity: 0.9,

                            // Impede que o clique seja
                            // repassado ao mapa.
                            bubblingMouseEvents: false
                        }
                    );
                },

                onEachFeature: function (
                    feature,
                    layer
                ) {

                    const p =
                        feature.properties;

                    const popup = `
                        <strong>${p.nome}</strong>

                        <br>

                        ${p.nome_completo}

                        <br><br>

                        <strong>Tipo:</strong>
                        ${p.tipo}

                        <br>

                        <strong>Instituição:</strong>
                        ${p.instituicao}

                        <br>

                        <strong>Local:</strong>
                        ${p.local}

                        <br><br>

                        <strong>Fonte:</strong>
                        ${p.fonte}
                    `;

                    layer.bindPopup(
                        popup
                    );

                    // Faz o clique abrir explicitamente
                    // o popup.
                    layer.on(
                        "click",
                        function (e) {

                            L.DomEvent.stopPropagation(
                                e
                            );

                            layer.openPopup();
                        }
                    );
                }
            }
        ).addTo(map);

        controleCamadas.addOverlay(
            camadaIEMC,
            "Sede do IEMC²"
        );

        console.log(
            "Sede do IEMC² carregada."
        );
    })

    .catch(error => {

        console.error(
            "Erro na sede do IEMC²:",
            error
        );
    });


// ------------------------------------------------------------
// 6. INSTITUIÇÕES MUTUCA EDUCA
// ------------------------------------------------------------

fetch(
    "data/instituicoes_mutuca_educa_2026.geojson"
)

    .then(response => {

        if (!response.ok) {
            throw new Error(
                "Erro ao carregar instituições."
            );
        }

        return response.json();
    })

    .then(data => {

        const camadaInstituicoes =
            L.geoJSON(
                data,
                {
                    pointToLayer:
                        function (
                            feature,
                            latlng
                        ) {

                            return L.circleMarker(
                                latlng,
                                {
                                    radius: 6,
                                    weight: 1,
                                    fillOpacity: 0.85,
                                    bubblingMouseEvents:
                                        false
                                }
                            );
                        },

                    onEachFeature:
                        function (
                            feature,
                            layer
                        ) {

                            const p =
                                feature.properties;

                            const popup = `
                                <strong>
                                    ${p.nome}
                                </strong>

                                <br><br>

                                <strong>Tipo:</strong>
                                ${p.tipo}

                                <br>

                                <strong>Rede:</strong>
                                ${p.rede}

                                <br>

                                <strong>Bairro:</strong>
                                ${p.bairro}

                                <br>

                                <strong>Município:</strong>
                                ${p.municipio}

                                <br>

                                <strong>
                                    Mutuca Educa 2026:
                                </strong>
                                ${p.mutuca_2026}
                            `;

                            layer.bindPopup(
                                popup
                            );

                            layer.on(
                                "click",
                                function (e) {

                                    L.DomEvent
                                        .stopPropagation(
                                            e
                                        );

                                    layer.openPopup();
                                }
                            );
                        }
                }
            ).addTo(map);

        controleCamadas.addOverlay(
            camadaInstituicoes,
            "Instituições Mutuca Educa"
        );

        console.log(
            "Instituições carregadas."
        );
    })

    .catch(error => {

        console.error(
            "Erro nas instituições:",
            error
        );
    });


// ------------------------------------------------------------
// 7. MANGUEZAL DA TAPERA
// ------------------------------------------------------------

fetch("data/manguezal_tapera.geojson")

    .then(response => {

        if (!response.ok) {
            throw new Error(
                "Erro ao carregar Manguezal da Tapera."
            );
        }

        return response.json();
    })

    .then(data => {

        const camadaManguezal =
            L.geoJSON(
                data,
                {
                    style: {
                        weight: 2,
                        fillOpacity: 0.35
                    },

                    onEachFeature:
                        function (
                            feature,
                            layer
                        ) {

                            const p =
                                feature.properties;

                            const area =
                                Number(
                                    p.area_ha
                                ).toLocaleString(
                                    "pt-BR",
                                    {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    }
                                );

                            const popup = `
                                <strong>
                                    ${p.nome}
                                </strong>

                                <br><br>

                                <strong>
                                    Classe:
                                </strong>
                                ${p.classe}

                                <br>

                                <strong>
                                    Área:
                                </strong>
                                ${area} ha
                            `;

                            layer.bindPopup(
                                popup
                            );
                        }
                }
            ).addTo(map);

        controleCamadas.addOverlay(
            camadaManguezal,
            "Manguezal da Tapera"
        );

        console.log(
            "Manguezal da Tapera carregado."
        );
    })

    .catch(error => {

        console.error(
            "Erro no Manguezal da Tapera:",
            error
        );
    });