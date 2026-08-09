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
$PortableNodeVersion = '22.13.1'
$NodeDistBase = 'https://nodejs.org/dist'

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

function Get-NodeArchiveArchitecture {
  $architecture = $env:PROCESSOR_ARCHITEW6432
  if (-not $architecture) {
    $architecture = $env:PROCESSOR_ARCHITECTURE
  }

  switch ($architecture.ToUpperInvariant()) {
    'AMD64' { return 'x64' }
    'ARM64' { return 'arm64' }
    'X86' { return 'x86' }
    default { Fail "Unsupported Windows architecture: $architecture" }
  }
}

function Download-File([string]$Url, [string]$Destination) {
  [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
  try {
    Say "Downloading $Url"
    Invoke-WebRequest -UseBasicParsing -Uri $Url -OutFile $Destination
    return
  } catch {
    Write-Host '[NeoFit Local] PowerShell download failed. Retrying with curl.exe...' -ForegroundColor Yellow
  }

  if (Get-Command curl.exe -ErrorAction SilentlyContinue) {
    & curl.exe -fL --retry 2 --connect-timeout 20 -o $Destination $Url
    if ($LASTEXITCODE -eq 0) {
      return
    }
  }

  Fail "Could not download $Url"
}

function Ensure-Node22([string]$ProjectRoot) {
  $existingNode = Get-Command node -ErrorAction SilentlyContinue
  if ($existingNode) {
    try {
      $existingVersion = (& node -p "process.versions.node").Trim()
      $existingMajor = [int]($existingVersion.Split('.')[0])
      if ($existingMajor -eq 22) {
        Say "System Node.js $existingVersion is compatible."
        $systemNpm = Get-Command npm.cmd -ErrorAction SilentlyContinue
        if (-not $systemNpm) {
          $systemNpm = Get-Command npm -ErrorAction SilentlyContinue
        }
        if (-not $systemNpm) {
          Fail 'npm was not found next to the compatible Node.js installation.'
        }
        return $systemNpm.Source
      }
      Say "System Node.js $existingVersion is not used by NeoFit local."
    } catch {
      Say 'Existing Node.js could not be inspected; preparing a local Node 22 runtime.'
    }
  }

  $arch = Get-NodeArchiveArchitecture
  $folderName = "node-v$PortableNodeVersion-win-$arch"
  $toolsDir = Join-Path $ProjectRoot '.tools'
  $nodeHome = Join-Path $toolsDir $folderName
  $nodeExe = Join-Path $nodeHome 'node.exe'
  $npmCmd = Join-Path $nodeHome 'npm.cmd'

  if (-not (Test-Path $nodeExe)) {
    New-Item -ItemType Directory -Force -Path $toolsDir | Out-Null
    $zipPath = Join-Path $toolsDir "$folderName.zip"
    if (Test-Path $zipPath) {
      Remove-Item -Force $zipPath
    }

    $downloadUrl = "$NodeDistBase/v$PortableNodeVersion/$folderName.zip"
    Download-File $downloadUrl $zipPath

    Say "Extracting portable Node.js $PortableNodeVersion..."
    Expand-Archive -LiteralPath $zipPath -DestinationPath $toolsDir -Force
    Remove-Item -Force $zipPath
  }

  if (-not (Test-Path $nodeExe) -or -not (Test-Path $npmCmd)) {
    Fail 'Portable Node.js extraction is incomplete.'
  }

  $env:Path = "$nodeHome;$env:Path"
  $portableVersion = (& $nodeExe -p "process.versions.node").Trim()
  if (-not $portableVersion.StartsWith('22.')) {
    Fail "Portable Node.js validation failed: $portableVersion"
  }

  Say "Portable Node.js $portableVersion activated for this NeoFit session."
  return $npmCmd
}

function Install-Dependencies([string]$NpmCommand) {
  Say 'Installing workspace dependencies from the default npm registry...'
  & $NpmCommand install --no-audit --no-fund
  if ($LASTEXITCODE -eq 0) {
    return
  }

  Write-Host ''
  Write-Host '[NeoFit Local] Default npm registry failed. Retrying with Runflare mirror...' -ForegroundColor Yellow
  & $NpmCommand install --no-audit --no-fund --registry=$RunflareNpmRegistry
  if ($LASTEXITCODE -ne 0) {
    Fail "npm install failed on both the default registry and Runflare mirror ($RunflareNpmRegistry)."
  }
}

Say 'Checking Git and preparing the local runtime...'
Require-Command git

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

$npmCommand = Ensure-Node22 $current
$activeNodeVersion = (& node -p "process.versions.node").Trim()
$activeNpmVersion = (& $npmCommand -v).Trim()
Say "Active Node.js: $activeNodeVersion"
Say "Active npm: $activeNpmVersion"

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
  Install-Dependencies $npmCommand
}

if (-not $SkipTypecheck) {
  Say 'Running Web TypeScript check...'
  & $npmCommand run typecheck:web
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
Write-Host '- Node 24 on the machine was not uninstalled or changed.'
Write-Host '- Local encryption/signing keys were generated locally and were not printed.'
Write-Host '- Do not commit or share web\.env.local.'
Write-Host '- Supabase hosted email templates currently use the hosted SiteURL, so local email confirmation may still return to Preview.'
Write-Host ''

Say "Starting Next.js dev server on port $Port ..."
Set-Location (Join-Path $current 'web')
& $npmCommand run dev -- -H 127.0.0.1 -p $Port
