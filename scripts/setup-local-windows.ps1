param(
  [string]$SupabasePublishableKey = "",
  [int]$Port = 3000,
  [switch]$SkipInstall,
  [switch]$SkipTypecheck
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$Repo = 'https://github.com/Emad211/Neofit-ai.git'
$Branch = 'stage21/onboarding-self-report-v2'
$SupabaseUrl = 'https://rjwrobltmjodfarnltal.supabase.co'
$RunflareNpmRegistry = 'https://mirror-npm.runflare.com'

function Say([string]$Text) {
  Write-Host "[NeoFit Local] $Text" -ForegroundColor Cyan
}

function Fail([string]$Text) {
  Write-Host "[NeoFit Local] ERROR: $Text" -ForegroundColor Red
  exit 1
}

function Require-Command([string]$Name) {
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    Fail "Required command '$Name' was not found. Install it, reopen PowerShell, and try again."
  }
}

function New-Base64Key {
  $bytes = New-Object byte[] 32
  $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  try {
    $rng.GetBytes($bytes)
  } finally {
    $rng.Dispose()
  }
  return [Convert]::ToBase64String($bytes)
}

function Install-Dependencies {
  Say 'Installing workspace dependencies from the default npm registry...'
  & npm install --no-audit --no-fund
  if ($LASTEXITCODE -eq 0) {
    return
  }

  Write-Host ''
  Write-Host '[NeoFit Local] Default npm registry failed. Retrying with Runflare mirror...' -ForegroundColor Yellow
  & npm install --no-audit --no-fund --registry=$RunflareNpmRegistry
  if ($LASTEXITCODE -ne 0) {
    Fail "npm install failed on both the default registry and Runflare mirror ($RunflareNpmRegistry)."
  }
}

Say 'Checking Git, Node.js and npm...'
Require-Command git
Require-Command node
Require-Command npm

$nodeVersion = (& node -p "process.versions.node").Trim()
$nodeMajor = [int]($nodeVersion.Split('.')[0])
if ($nodeMajor -ne 22) {
  Fail "Node.js 22.x is required. Current version: $nodeVersion"
}
Say "Node.js $nodeVersion detected."

$current = (Get-Location).Path
$gitDir = Join-Path $current '.git'

if (-not (Test-Path $gitDir)) {
  $items = @(Get-ChildItem -Force)
  if ($items.Count -gt 0) {
    Fail 'This directory is not empty and is not a Git repository. Refusing to overwrite files.'
  }

  Say "Cloning $Branch into $current ..."
  & git clone --branch $Branch --single-branch $Repo .
  if ($LASTEXITCODE -ne 0) {
    Fail 'git clone failed.'
  }
} else {
  Say "Existing Git repository found. Updating $Branch ..."
  & git fetch origin $Branch
  if ($LASTEXITCODE -ne 0) {
    Fail 'git fetch failed.'
  }

  & git switch $Branch
  if ($LASTEXITCODE -ne 0) {
    Fail 'git switch failed.'
  }

  & git pull --ff-only origin $Branch
  if ($LASTEXITCODE -ne 0) {
    Fail 'git pull --ff-only failed.'
  }
}

if (-not $SupabasePublishableKey.Trim()) {
  Write-Host ''
  Write-Host 'Paste the Supabase publishable key in THIS terminal only.' -ForegroundColor Yellow
  Write-Host 'It will be stored in web\.env.local. Do not paste it into chat.' -ForegroundColor DarkYellow
  $SupabasePublishableKey = Read-Host 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'
}

if (-not $SupabasePublishableKey.Trim()) {
  Fail 'Supabase publishable key is empty.'
}

$appUrl = "http://localhost:$Port"
$envPath = Join-Path $current 'web\.env.local'

$existingEncryption = $null
$existingRecovery = $null
if (Test-Path $envPath) {
  foreach ($line in Get-Content $envPath) {
    if ($line -match '^AI_CREDENTIAL_ENCRYPTION_KEY=(.+)$') {
      $existingEncryption = $Matches[1].Trim()
    }
    if ($line -match '^AUTH_RECOVERY_INTENT_KEY=(.+)$') {
      $existingRecovery = $Matches[1].Trim()
    }
  }
}

$encryptionKey = if ($existingEncryption) { $existingEncryption } else { New-Base64Key }
$recoveryKey = if ($existingRecovery) { $existingRecovery } else { New-Base64Key }

$envLines = @(
  "NEXT_PUBLIC_SUPABASE_URL=$SupabaseUrl",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$($SupabasePublishableKey.Trim())",
  "NEXT_PUBLIC_APP_URL=$appUrl",
  'NEXT_PUBLIC_VERCEL_ENV=development',
  "AI_CREDENTIAL_ENCRYPTION_KEY=$encryptionKey",
  "AUTH_RECOVERY_INTENT_KEY=$recoveryKey"
)

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllLines($envPath, $envLines, $utf8NoBom)
Say 'Local environment written to web\.env.local'

if (-not $SkipInstall) {
  Install-Dependencies
}

if (-not $SkipTypecheck) {
  Say 'Running Web TypeScript check...'
  & npm run typecheck:web
  if ($LASTEXITCODE -ne 0) {
    Fail 'TypeScript check failed.'
  }
}

Write-Host ''
Write-Host '------------------------------------------------------------' -ForegroundColor DarkGray
Write-Host 'NeoFit local setup is ready.' -ForegroundColor Green
Write-Host "URL: $appUrl" -ForegroundColor Green
Write-Host 'Stop server with Ctrl+C.' -ForegroundColor DarkGray
Write-Host '------------------------------------------------------------' -ForegroundColor DarkGray
Write-Host ''
Write-Host 'Notes:' -ForegroundColor Yellow
Write-Host '- This local build uses the shared remote Supabase project.'
Write-Host '- Local encryption/signing keys were generated locally and were not printed.'
Write-Host '- Do not commit or share web\.env.local.'
Write-Host '- Supabase hosted email templates currently use the hosted SiteURL, so local email confirmation may still return to Preview.'
Write-Host ''

Say "Starting Next.js dev server on port $Port ..."
Set-Location (Join-Path $current 'web')
& npm run dev -- -H 127.0.0.1 -p $Port
