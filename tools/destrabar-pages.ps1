# Destraba la publicación en GitHub Pages cuando falla con
# "Deployment request failed ... due to in progress deployment. Please cancel <SHA> first".
# Cancela ese despliegue colgado y vuelve a lanzar la última publicación.
# Usa la sesión de GitHub que Git ya tiene guardada en esta PC (no muestra ni guarda el token).
#
# Uso (desde la carpeta del repo):
#   powershell -ExecutionPolicy Bypass -File tools\destrabar-pages.ps1 -Sha <SHA que dice el error>
param(
  [Parameter(Mandatory = $true)][string]$Sha,
  [string]$Repo = 'jonathanaveda-spec/carteraasesor'
)
$ErrorActionPreference = 'Stop'
# Si la terminal se abrió antes de instalar Git, todavía no lo encuentra: se recarga el PATH.
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  $env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User')
}
$cred = "protocol=https`nhost=github.com`n`n" | git credential fill
$tok = (($cred -split "`n") | Where-Object { $_ -like 'password=*' }) -replace '^password=', ''
if (-not $tok) { throw 'Git no tiene una sesión de GitHub guardada. Haz primero un git push para iniciar sesión.' }
$h = @{ Authorization = "Bearer $tok"; Accept = 'application/vnd.github+json'; 'User-Agent' = 'cartera'; 'X-GitHub-Api-Version' = '2022-11-28' }
$base = "https://api.github.com/repos/$Repo"
try {
  Invoke-RestMethod -Method Post "$base/pages/deployments/$Sha/cancel" -Headers $h | Out-Null
  Write-Host "Despliegue $Sha cancelado."
} catch {
  Write-Host "No se pudo cancelar $Sha (puede que ya no estuviera en curso): $($_.Exception.Message)"
}
$run = (Invoke-RestMethod "$base/actions/runs?per_page=1" -Headers $h).workflow_runs[0]
Invoke-RestMethod -Method Post "$base/actions/runs/$($run.id)/rerun" -Headers $h | Out-Null
Write-Host "Publicación #$($run.run_number) relanzada. En 1-2 minutos debería estar en línea."
