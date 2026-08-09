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

function Say([string]$Text) {
  Write-Host "[NeoFit Local] $Text" -ForegroundColor Cyan
}

function Fail([string]$Text) {
  Write-Host "[NeoFit Local] ERROR: $Text" -ForegroundColor Red
  exit 1
}

function Require-Command([string]$Name) {
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    Fail "'$Name' پیدا نشد. ابتدا آن را نصب کن و PowerShell را دوباره باز کن."
  }
}

function New-Base64Key {
  $bytes = New-Object byte[] 32
  [System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
  return [Convert]::ToBase64String($bytes)
}

Say "Checking Git and Node.js..."
Require-Command git
Require-Command node
Require-Command npm

$nodeVersion = (& node -p "process.versions.node").Trim()
$nodeMajor = [int]($nodeVersion.Split('.')[0])
if ($nodeMajor -ne 22) {
  Fail "Node.js 22.x لازم است؛ نسخه فعلی $nodeVersion است. Node 22 LTS را نصب/فعال کن."
}

$current = (Get-Location).Path
$gitDir = Join-Path $current '.git'

if (-not (Test-Path $gitDir)) {
  $items = @(Get-ChildItem -Force | Where-Object { $_.Name -notin @('.', '..') })
  if ($items.Count -gt 0) {
    Fail "این پوشه خالی نیست و Git repo هم نیست. اسکریپت برای جلوگیری از overwrite متوقف شد."
  }
  Say "Cloning $Branch into $current ..."
  & git clone --branch $Branch --single-branch $Repo .
  if ($LASTEXITCODE -ne 0) { Fail 'git clone ناموفق بود.' }
} else {
  Say "Existing Git repo found; switching/updating $Branch ..."
  & git fetch origin $Branch
  if ($LASTEXITCODE -ne 0) { Fail 'git fetch ناموفق بود.' }
  & git switch $Branch
  if ($LASTEXITCODE -ne 0) { Fail 'git switch ناموفق بود.' }
  & git pull --ff-only origin $Branch
  if ($LASTEXITCODE -ne 0) { Fail 'git pull --ff-only ناموفق بود.' }
}

if (-not $SupabasePublishableKey.Trim()) {
  Write-Host ''
  Write-Host 'Supabase publishable key را فقط در همین ترمینال paste کن.' -ForegroundColor Yellow
  Write-Host 'این مقدار داخل چت ارسال نمی‌شود و در web\.env.local ذخیره خواهد شد.' -ForegroundColor DarkYellow
  $SupabasePublishableKey = Read-Host 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'
}

if (-not $SupabasePublishableKey.Trim()) {
  Fail 'Supabase publishable key خالی است.'
}

$appUrl = "http://localhost:$Port"
$envPath = Join-Path $current 'web\.env.local'

$existingEncryption = $null
$existingRecovery = $null
if (Test-Path $envPath) {
  foreach ($line in Get-Content $envPath) {
    if ($line -match '^AI_CREDENTIAL_ENCRYPTION_KEY=(.+)$') { $existingEncryption = $Matches[1].Trim() }
    if ($line -match '^AUTH_RECOVERY_INTENT_KEY=(.+)$') { $existingRecovery = $Matches[1].Trim() }
  }
}

$encryptionKey = if ($existingEncryption) { $existingEncryption } else { New-Base64Key }
$recoveryKey = if ($existingRecovery) { $existingRecovery } else { New-Base64Key }

$envContent = @"
NEXT_PUBLIC_SUPABASE_URL=$SupabaseUrl
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$($SupabasePublishableKey.Trim())
NEXT_PUBLIC_APP_URL=$appUrl
NEXT_PUBLIC_VERCEL_ENV=development
AI_CREDENTIAL_ENCRYPTION_KEY=$encryptionKey
AUTH_RECOVERY_INTENT_KEY=$recoveryKey
"@

[System.IO.File]::WriteAllText($envPath, $envContent, (New-Object System.Text.UTF8Encoding($false)))
Say "Local environment written to web\.env.local"

if (-not $SkipInstall) {
  Say 'Installing workspace dependencies...'
  & npm install --no-audit --no-fund
  if ($LASTEXITCODE -ne 0) { Fail 'npm install ناموفق بود.' }
}

if (-not $SkipTypecheck) {
  Say 'Running Web TypeScript check...'
  & npm run typecheck:web
  if ($LASTEXITCODE -ne 0) { Fail 'TypeScript check ناموفق بود.' }
}

Write-Host ''
Write-Host '------------------------------------------------------------' -ForegroundColor DarkGray
Write-Host 'NeoFit local is ready.' -ForegroundColor Green
Write-Host "URL: $appUrl" -ForegroundColor Green
Write-Host 'Stop server: Ctrl+C' -ForegroundColor DarkGray
Write-Host '------------------------------------------------------------' -ForegroundColor DarkGray
Write-Host ''
Write-Host 'Important:' -ForegroundColor Yellow
Write-Host '- This local build uses the shared remote Supabase project.'
Write-Host '- The two encryption/signing keys above are local-only and were not printed.'
Write-Host '- Do not copy web\.env.local into Git or chat.'
Write-Host '- Current Supabase email templates use the hosted SiteURL; local email-confirmation links may still return to Preview until localhost redirect/template support is explicitly enabled.'
Write-Host ''

Say "Starting Next.js dev server on port $Port ..."
Set-Location (Join-Path $current 'web')
& npm run dev -- -H 127.0.0.1 -p $Port
