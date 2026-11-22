Add-Type -AssemblyName System.Drawing
$source = [System.Drawing.Bitmap]::new((Resolve-Path 'public/assets/island-test/original-atlas.png'))
$target = [System.Drawing.Bitmap]::new($source.Width, $source.Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
for ($y=0; $y -lt $source.Height; $y++) {
  for ($x=0; $x -lt $source.Width; $x++) {
    $c=$source.GetPixel($x,$y); $r=[double]$c.R; $g=[double]$c.G; $b=[double]$c.B
    if ($g -lt 65 -and $r -lt 65 -and $b -lt 65) { $target.SetPixel($x,$y,$c); continue }
    $grain=(([math]::Sin($x*12.9898+$y*78.233)*43758.5453)%1)*2.2
    if ($g -gt $r*1.08) {
      $shade=($g-120)*.22
      $nr=188+$shade+$grain; $ng=207+$shade+$grain; $nb=115+$shade*.65+$grain
    } else {
      $warm=($r-110)*.16
      $nr=239+$warm+$grain; $ng=211+$warm*.70+$grain; $nb=174+$warm*.48+$grain
      if ($b-$r -gt 12) { $nr=192+$warm*.4+$grain; $ng=177+$warm*.4+$grain; $nb=193+$warm*.4+$grain }
    }
    $target.SetPixel($x,$y,[System.Drawing.Color]::FromArgb($c.A,[int][math]::Clamp($nr,0,255),[int][math]::Clamp($ng,0,255),[int][math]::Clamp($nb,0,255)))
  }
}
$target.Save((Join-Path (Get-Location) 'public/assets/island-test/pastel-atlas.png'),[System.Drawing.Imaging.ImageFormat]::Png)
$source.Dispose(); $target.Dispose()
