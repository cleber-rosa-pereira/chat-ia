param(
  [Parameter(Mandatory=$true)] [string]$CompanyId,
  [Parameter(Mandatory=$true)] [string]$ProfessionalId,
  [Parameter(Mandatory=$true)] [string]$ServiceId,
  [Parameter(Mandatory=$true)] [string]$StartIso,  # ex.: 2025-10-21T17:15:00Z
  [Parameter(Mandatory=$true)] [string]$EndIso    # ex.: 2025-10-21T17:45:00Z
)

$body = @{
  company_id      = $CompanyId
  professional_id = $ProfessionalId
  service_id      = $ServiceId
  customer_name   = "Teste POST Conflito"
  customer_phone  = "5599999999990"
  start_time      = $StartIso
  end_time        = $EndIso
} | ConvertTo-Json -Compress

Write-Host "== Tentando criar $StartIso → $EndIso =="
try {
  Invoke-RestMethod -Method Post -Uri "http://localhost:3333/appointments" -ContentType "application/json" -Body $body
  Write-Host ">> Criado (sem conflito)"
} catch {
  $status = "N/A"
  if ($_.Exception -and $_.Exception.Response -and $_.Exception.Response.StatusCode) {
    $status = $_.Exception.Response.StatusCode.value__
  }
  Write-Host ">> HTTP:" $status

  if ($_.ErrorDetails -and $_.ErrorDetails.Message) {
    Write-Host ">> Body:" $_.ErrorDetails.Message
  } elseif ($_.Exception -and $_.Exception.Response) {
    $sr = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $resp = $sr.ReadToEnd(); $sr.Close()
    Write-Host ">> Body:" $resp
  } else {
    Write-Host ">> Body:" $_.Exception.Message
  }
}
