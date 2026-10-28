<#
.SYNOPSIS
  Verifica (somente leitura) se 05_Geoportal_App/data coincide com a fonte canônica
  03_Publicacao_GeoJSON e se os GeoJSON respeitam as regras de privacidade.
.DESCRIPTION
  Não altera nenhum arquivo. Ferramenta de desenvolvimento; NÃO faz parte do site.
  Verificações:
   - mesmos 11 nomes de arquivo (maiúsculas/minúsculas idênticas);
   - hash SHA-256 idêntico entre as duas pastas;
   - contagem de feições esperada;
   - ausência de campos proibidos nas propriedades.
.EXAMPLE
  powershell -ExecutionPolicy Bypass -File .\tools\verificar_dados.ps1
#>
$app = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$canon = (Resolve-Path (Join-Path $app '..\03_Publicacao_GeoJSON')).Path
$copia = Join-Path $app 'data'

$esperado = [ordered]@{
    'areas_aquicolas_baia_sul.geojson' = 111
    'instituicoes_mutuca_educa_2026.geojson' = 17
    'limite_florianopolis.geojson' = 1
    'manguezal_tapera.geojson' = 1
    'mona_lagoa_peri.geojson' = 1
    'monumentos_artisticos.geojson' = 4
    'parques_aquicolas_florianopolis.geojson' = 3
    'pesca_artesanal_sul.geojson' = 20
    'ranchos_pesca_tapera.geojson' = 1
    'resex_pirajubae.geojson' = 1
    'rotulo_areas_aquicolas_baia_sul.geojson' = 1
    'sede_iemc2.geojson' = 1
    'territorio_indigena_goj_ta_sa.geojson' = 1
    'trilha_ecopedagogica_mutuca.geojson' = 1
}
$proibidos = 'cessionario', 'cessionário', 'endereco', 'endereço', 'cep', 'latitude', 'longitude', 'precisao', 'precisão', 'obs', 'observacoes', 'observações', 'nome_pescador', 'pescador_nome'

$erros = 0
function Falha($m) { Write-Host "  [ERRO] $m" -ForegroundColor Red; $script:erros++ }

foreach ($nome in $esperado.Keys) {
    Write-Host $nome
    $a = Join-Path $canon $nome
    $b = Join-Path $copia $nome
    # Comparação sensível a maiúsculas/minúsculas (como no GitHub Pages).
    $nomesCopia = (Get-ChildItem $copia -File).Name
    if ($nomesCopia -cnotcontains $nome) { Falha "ausente (ou com caixa diferente) em data/"; continue }
    if (-not (Test-Path $a)) { Falha "ausente na fonte canônica"; continue }
    if ((Get-FileHash $a -Algorithm SHA256).Hash -ne (Get-FileHash $b -Algorithm SHA256).Hash) { Falha "conteúdo difere da fonte canônica" }
    $gj = Get-Content $b -Raw -Encoding UTF8 | ConvertFrom-Json
    if ($gj.features.Count -ne $esperado[$nome]) { Falha "feições: $($gj.features.Count) (esperado $($esperado[$nome]))" }
    $campos = $gj.features | ForEach-Object { $_.properties.PSObject.Properties.Name } | Sort-Object -Unique
    $achados = $campos | Where-Object { $proibidos -contains $_.ToLower() }
    if ($achados) { Falha "campos proibidos: $($achados -join ', ')" }
}

$extras = (Get-ChildItem $copia -File).Name | Where-Object { $esperado.Keys -cnotcontains $_ }
if ($extras) { Falha "arquivos extras em data/: $($extras -join ', ')" }

if ($erros -eq 0) { Write-Host "`nOK: data/ idêntico à fonte canônica e regras verificadas." -ForegroundColor Green }
else { Write-Host "`n$erros problema(s) encontrado(s)." -ForegroundColor Red; exit 1 }
