#!/usr/bin/env pwsh
# Test ProxyPal API Translation
# Usage: .\test-proxypal.ps1

$apiUrl = "http://localhost:8317/v1/chat/completions"

$body = @{
    model = "gemini-2.5-flash"
    messages = @(
        @{
            role = "system"
            content = "You are a professional translator. Translate the following text to Vietnamese."
        }
        @{
            role = "user"
            content = "Hello, how are you today? This is a test message."
        }
    )
    temperature = 0.3
} | ConvertTo-Json -Depth 10

Write-Host "🚀 Testing ProxyPal API..." -ForegroundColor Cyan
Write-Host "URL: $apiUrl" -ForegroundColor Gray
Write-Host "ProxyPal: Using Gemini session (any API key works)" -ForegroundColor Gray
Write-Host ""

$headers = @{
    "Authorization" = "Bearer proxypal-local"
    "Content-Type" = "application/json"
}

try {
    $response = Invoke-RestMethod -Uri $apiUrl -Method Post -Body $body -Headers $headers
    
    Write-Host "✅ Success!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Model: $($response.model)" -ForegroundColor Yellow
    Write-Host "Translated Text:" -ForegroundColor Yellow
    Write-Host $response.choices[0].message.content -ForegroundColor White
    Write-Host ""
    Write-Host "Usage:" -ForegroundColor Gray
    Write-Host "  Prompt tokens: $($response.usage.prompt_tokens)" -ForegroundColor Gray
    Write-Host "  Completion tokens: $($response.usage.completion_tokens)" -ForegroundColor Gray
    Write-Host "  Total tokens: $($response.usage.total_tokens)" -ForegroundColor Gray
}
catch {
    Write-Host "❌ Error!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.ErrorDetails) {
        Write-Host ""
        Write-Host "Details:" -ForegroundColor Yellow
        Write-Host $_.ErrorDetails.Message -ForegroundColor White
    }
}
