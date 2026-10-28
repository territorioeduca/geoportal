<#
.SYNOPSIS
  Sincroniza 05_Geoportal_App/data a partir de 03_Publicacao_GeoJSON (fonte canônica).
.DESCRIPTION
  Direção única: 03_Publicacao_GeoJSON -> 05_Geoportal_App/data. Nunca escreve na fonte.
  Por padrão apenas MOSTRA o que seria copiado. Use -Confirmar para copiar de fato.
  Ferramenta de desenvolvimento; NÃO faz parte do site.
.EXAMPLE
  powershell -ExecutionPolicy Bypass -File .\tools\sincronizar_dados.ps1
  powershell -ExecutionPolicy Bypass -File .\tools\sincronizar_dados.ps1 -Confirmar
#>
param([switch]$Confirmar)

$app = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$canon = (Resolve-Path (Join-Path $app '..\03_Publicacao_GeoJSON')).Path
$destino = Join-Path $app 'data'
New-Item -ItemType Directory -Force $destino | Out-Null

$mudancas = 0
foreach ($f in Get-ChildItem $canon -Filter *.geojson -File) {
    $d = Join-Path $destino $f.Name
    $igual = (Test-Path $d) -and ((Get-FileHash $f.FullName).Hash -eq (Get-FileHash $d).Hash)
    if ($igual) { Write-Host "= $($f.Name) (igual)"; continue }
    $mudancas++
    if ($Confirmar) { Copy-Item $f.FullName $d -Force; Write-Host "> $($f.Name) copiado" -ForegroundColor Green }
    else { Write-Host "~ $($f.Name) seria copiado" -ForegroundColor Yellow }
}
if (-not $Confirmar -and $mudancas) { Write-Host "`nNada foi alterado. Execute com -Confirmar para copiar." }
if (-not $mudancas) { Write-Host "`nNenhuma diferença." }
