<#
.SYNOPSIS
  Servidor HTTP local SOMENTE PARA DESENVOLVIMENTO do geoportal.
.DESCRIPTION
  Serve a pasta 05_Geoportal_App em http://localhost:8080/ (módulos ES e fetch
  exigem HTTP; não funcionam abrindo index.html por file://).
  Este script NÃO faz parte do site publicado: o geoportal é 100% estático e
  não depende de PowerShell. Qualquer servidor estático equivalente serve.
.EXAMPLE
  powershell -ExecutionPolicy Bypass -File .\tools\servir_local.ps1
  powershell -ExecutionPolicy Bypass -File .\tools\servir_local.ps1 -Porta 9000
#>
param([int]$Porta = 8080)

$raiz = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$tipos = @{
    '.html' = 'text/html; charset=utf-8'; '.css' = 'text/css; charset=utf-8'
    '.js' = 'text/javascript; charset=utf-8'; '.json' = 'application/json; charset=utf-8'
    '.geojson' = 'application/geo+json; charset=utf-8'; '.svg' = 'image/svg+xml'
    '.png' = 'image/png'; '.woff2' = 'font/woff2'; '.txt' = 'text/plain; charset=utf-8'
}

$ouvinte = New-Object System.Net.HttpListener
$ouvinte.Prefixes.Add("http://localhost:$Porta/")
$ouvinte.Start()
Write-Host "Geoportal em http://localhost:$Porta/  (Ctrl+C para encerrar)"
Write-Host "Servindo: $raiz"

try {
    while ($ouvinte.IsListening) {
        $ctx = $ouvinte.GetContext()
        $caminho = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath.TrimStart('/'))
        if ([string]::IsNullOrEmpty($caminho)) { $caminho = 'index.html' }
        $arquivo = [System.IO.Path]::GetFullPath((Join-Path $raiz $caminho))
        # Impede acesso fora da pasta do app.
        if ($arquivo.StartsWith($raiz) -and (Test-Path -LiteralPath $arquivo -PathType Leaf)) {
            $ext = [System.IO.Path]::GetExtension($arquivo).ToLower()
            $ctx.Response.ContentType = if ($tipos.ContainsKey($ext)) { $tipos[$ext] } else { 'application/octet-stream' }
            $bytes = [System.IO.File]::ReadAllBytes($arquivo)
            $ctx.Response.ContentLength64 = $bytes.Length
            $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $ctx.Response.StatusCode = 404
            Write-Host "404 $caminho"
        }
        $ctx.Response.Close()
    }
} finally {
    $ouvinte.Stop()
}
