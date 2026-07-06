$manifestPath = Join-Path $PSScriptRoot "com.homework.ollama.json"
$chromePath = "HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.homework.ollama"
$bravePath = "HKCU:\Software\BraveSoftware\Brave-Browser\NativeMessagingHosts\com.homework.ollama"

foreach ($path in @($chromePath, $bravePath)) {
  $null = New-Item -Path $path -Force
  $null = New-ItemProperty -LiteralPath $path -Name "(Default)" -Value $manifestPath -Force
}

Write-Host "✓ Chrome and Brave native messaging host registered"
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Reload the extension in brave://extensions (click ↻)"
Write-Host "2. Make sure Ollama is running: ollama serve"
Write-Host "3. Open quiz-test.html in Brave"
Write-Host "4. Toggle to Smart (AI) mode and click Auto-Fill"
