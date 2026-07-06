$m = Join-Path $PSScriptRoot "com.homework.ollama.json"
$c = "HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.homework.ollama"
$b = "HKCU:\Software\BraveSoftware\Brave-Browser\NativeMessagingHosts\com.homework.ollama"

foreach ($p in @($c, $b)) {
  New-Item -Path $p -Force | Out-Null
  New-ItemProperty -LiteralPath $p -Name "(Default)" -Value $m -Force | Out-Null
}

Write-Host "Done. Reload extension in brave://extensions."
