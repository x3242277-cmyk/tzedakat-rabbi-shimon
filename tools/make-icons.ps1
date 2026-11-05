# יוצר את כל האייקונים של האתר מתוך assets\img\logo.png
# מריצים מתיקיית הפרויקט אחרי כל החלפה של הלוגו:
#   powershell -ExecutionPolicy Bypass -File tools\make-icons.ps1
#
# מה נוצר:
#   favicon-32.png         - האייקון בלשונית הדפדפן
#   apple-touch-icon.png   - מסך הבית באייפון (180px, רקע כהה)
#   icon-192.png           - התקנה למסך הבית באנדרואיד
#   icon-512.png           - מסך הפתיחה של האפליקציה המותקנת
#   icon-maskable-512.png  - גרסה עם שוליים רחבים, לאייקונים שהמכשיר חותך לעיגול

Add-Type -AssemblyName System.Drawing
$dir = Join-Path (Split-Path -Parent $PSScriptRoot) "assets\img"
$logoPath = Join-Path $dir "logo.png"
if (-not (Test-Path $logoPath)) { Write-Error "לא נמצא $logoPath"; exit 1 }
$src = [System.Drawing.Image]::FromFile($logoPath)

function Save-Icon([int]$size, [string]$name, [bool]$opaque, [double]$padRatio) {
  $bmp = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  if ($opaque) { $g.Clear([System.Drawing.Color]::FromArgb(255, 16, 16, 20)) } else { $g.Clear([System.Drawing.Color]::Transparent) }
  $pad = [int]($size * $padRatio)
  $box = $size - 2 * $pad
  $scale = [Math]::Min($box / $src.Width, $box / $src.Height)
  $w = [int]($src.Width * $scale); $h = [int]($src.Height * $scale)
  $g.DrawImage($src, [int](($size - $w) / 2), [int](($size - $h) / 2), $w, $h)
  $g.Dispose()
  $bmp.Save((Join-Path $dir $name), [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
}

Save-Icon 32  "favicon-32.png"        $false 0
Save-Icon 180 "apple-touch-icon.png"  $true  0.08
Save-Icon 192 "icon-192.png"          $true  0.06
Save-Icon 512 "icon-512.png"          $true  0.06
Save-Icon 512 "icon-maskable-512.png" $true  0.18
$src.Dispose()
Get-ChildItem $dir -Filter "*.png" | Select-Object Name, Length
