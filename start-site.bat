@echo off
rem ================================================================
rem  Run the site on this computer - double-click this file.
rem
rem  First time: downloads the project from GitHub into a folder
rem  named tzedakat-rabbi-shimon next to this file.
rem  Every time: gets the latest version from GitHub, starts a local
rem  server and opens the site in the browser.
rem  To stop the site, close this window.
rem
rem  Needs only Git for Windows. The server is built into Windows PowerShell.
rem  The PowerShell part is below the marker line at the end of this file.
rem ================================================================
set "SITE_SELF=%~f0"
set "SITE_DIR=%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$s=[IO.File]::ReadAllText($env:SITE_SELF); iex $s.Substring($s.IndexOf('#'+'#POWERSHELL#'+'#'))" & pause & exit /b
##POWERSHELL##
$RepoUrl  = 'https://github.com/x3242277-cmyk/tzedakat-rabbi-shimon.git'
$RepoName = 'tzedakat-rabbi-shimon'
$Port     = 8080

function Fail($msg) {
  Write-Host ''
  Write-Host "ERROR: $msg" -ForegroundColor Red
  exit 1
}

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  Fail 'Git was not found. Install Git for Windows and run this file again.'
}

# Where is the project? Next to this file (the file is inside the project),
# in a sub-folder (an earlier run downloaded it), or not downloaded yet.
$here = $env:SITE_DIR
$root = $null
if ((Test-Path -LiteralPath (Join-Path $here 'index.html')) -and (Test-Path -LiteralPath (Join-Path $here '.git'))) {
  $root = $here
} elseif (Test-Path -LiteralPath (Join-Path $here "$RepoName\.git")) {
  $root = Join-Path $here $RepoName
}

if (-not $root) {
  $root = Join-Path $here $RepoName
  Write-Host "Downloading the project from GitHub into $root ..."
  & git clone $RepoUrl $root
  if ($LASTEXITCODE -ne 0) { Fail 'Download from GitHub failed. Check the internet connection and try again.' }
} else {
  Write-Host "Getting the latest version from GitHub into $root ..."
  & git -C $root pull --ff-only
  if ($LASTEXITCODE -ne 0) {
    Write-Host 'Could not update automatically (there may be unsaved local changes). Running the version on this computer.' -ForegroundColor Yellow
  }
}

$root = [IO.Path]::GetFullPath($root).TrimEnd('\') + '\'

# The same security headers as the live site (serve.json mirrors _headers).
$headers = @{}
$cfgPath = Join-Path $root 'serve.json'
if (Test-Path -LiteralPath $cfgPath) {
  try {
    $cfg = [IO.File]::ReadAllText($cfgPath) | ConvertFrom-Json
    foreach ($rule in $cfg.headers) { foreach ($h in $rule.headers) { $headers[$h.key] = $h.value } }
  } catch { }
}

$mime = @{
  '.html' = 'text/html; charset=utf-8'; '.js' = 'application/javascript; charset=utf-8'
  '.css' = 'text/css; charset=utf-8'; '.json' = 'application/json; charset=utf-8'
  '.png' = 'image/png'; '.jpg' = 'image/jpeg'; '.jpeg' = 'image/jpeg'; '.webp' = 'image/webp'
  '.svg' = 'image/svg+xml'; '.ico' = 'image/x-icon'; '.gif' = 'image/gif'
  '.woff2' = 'font/woff2'; '.woff' = 'font/woff'; '.ttf' = 'font/ttf'; '.txt' = 'text/plain; charset=utf-8'
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
try { $listener.Start() } catch {
  Fail "Port $Port is already in use. The site may already be running in another window."
}

$url = "http://localhost:$Port/"
Write-Host ''
Write-Host "The site is running at $url" -ForegroundColor Green
Write-Host 'It works with the real database: changes made here are saved for everyone.' -ForegroundColor Yellow
Write-Host 'To stop the site, close this window.'
Start-Process $url

while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  $res = $ctx.Response
  try {
    $rel = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath).TrimStart('/')
    if ($rel -eq '') { $rel = 'index.html' }
    $file = [IO.Path]::GetFullPath((Join-Path $root $rel))
    if (-not $file.StartsWith($root, [StringComparison]::OrdinalIgnoreCase) -or -not (Test-Path -LiteralPath $file -PathType Leaf)) {
      $res.StatusCode = 404
      $file = Join-Path $root '404.html'
    }
    $bytes = [IO.File]::ReadAllBytes($file)
    $type = $mime[[IO.Path]::GetExtension($file).ToLower()]
    if (-not $type) { $type = 'application/octet-stream' }
    $res.ContentType = $type
    foreach ($k in $headers.Keys) { $res.Headers[$k] = $headers[$k] }
    $res.Headers['Cache-Control'] = 'no-store'
    $res.ContentLength64 = $bytes.Length
    $res.OutputStream.Write($bytes, 0, $bytes.Length)
  } catch {
    try { $res.StatusCode = 500 } catch { }
  } finally {
    $res.Close()
  }
}
