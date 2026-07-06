$manifestPath = Join-Path $PSScriptRoot "com.homework.ollama.json"
$regPath = "HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.homework.ollama"
$braveRegPath = "HKCU:\Software\BraveSoftware\Brave-Browser\NativeMessagingHosts\com.homework.ollama"

New-Item -Path $regPath -Force | Out-Null
Set-ItemProperty -Path $regPath -Name "(Default)" -Value $manifestPath
Write-Host "✓ Chrome native messaging host registered"

New-Item -Path $braveRegPath -Force | Out-Null
Set-ItemProperty -Path $braveRegPath -Name "(Default)" -Value $manifestPath
Write-Host "✓ Brave native messaging host registered"

Write-Host ""
Write-Host "Done! Reload the extension in brave://extensions and try Smart mode."
Write-Host "Make sure Ollama is running (ollama serve) before clicking Auto-Fill."
