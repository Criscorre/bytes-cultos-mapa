<#
  Script para crear y empujar el repo a GitHub usando `gh` (recomendado) o con un PAT.
  Uso: ejecutar en PowerShell desde la raíz del proyecto.
#>
param(
  [string]$repo = "bytescreativoss-debug/Bytes-cultos",
  [switch]$public
)

function Exec-GitPushWithPAT($remoteUrl) {
  Write-Host "Preparando commit y push a $remoteUrl"
  git add .
  git commit -m "Prep: Docker + Firebase integration, initializers and middleware" -q
  git branch -M main
  git remote add origin $remoteUrl -f 2>$null
  git push -u origin main
}

if (Get-Command gh -ErrorAction SilentlyContinue) {
  Write-Host "gh CLI detectado. Intentando crear repo y empujar..."
  $flags = "--source . --remote origin --push"
  if ($public) { gh repo create $repo --public $flags } else { gh repo create $repo --private $flags }
  exit $LASTEXITCODE
} else {
  Write-Host "gh CLI no encontrado. Si preferís, instalalo: https://cli.github.com/"
  $pat = Read-Host -AsSecureString "Ingresá un Personal Access Token (PAT) con scope repo (o presioná Enter para cancelar)"
  if (!$pat) { Write-Host "Cancelado."; exit 1 }
  $bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($pat)
  $plain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
  [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)

  $remoteUrl = $repo -match '/' ? "https://$plain@github.com/$repo.git" : "https://$plain@github.com/$repo.git"
  Exec-GitPushWithPAT $remoteUrl
}
