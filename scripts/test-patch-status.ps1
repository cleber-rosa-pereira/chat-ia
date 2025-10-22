param(
  [Parameter(Mandatory=$true)] [string]$Id
)

Write-Host "== Teste: 400 invalid_status =="
$bad = @{ status = "banana" } | ConvertTo-Json -Compress
try {
  Invoke-RestMethod -Method Patch -Uri "http://localhost:3333/appointments/$Id/status" -ContentType "application/json" -Body $bad
} catch {
  Write-Host ">> HTTP:" $_.Exception.Response.StatusCode.value__
  if ($_.ErrorDetails.Message) { Write-Host ">> Body:" $_.ErrorDetails.Message }
  else {
    $sr = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $body = $sr.ReadToEnd(); $sr.Close(); Write-Host ">> Body:" $body
  }
}

Write-Host "`n== Teste: 404 not_found =="
$fakeID = [guid]::NewGuid().ToString()
$ok = @{ status = "scheduled" } | ConvertTo-Json -Compress
try {
  Invoke-RestMethod -Method Patch -Uri "http://localhost:3333/appointments/$fakeID/status" -ContentType "application/json" -Body $ok
} catch {
  Write-Host ">> HTTP:" $_.Exception.Response.StatusCode.value__
  if ($_.ErrorDetails.Message) { Write-Host ">> Body:" $_.ErrorDetails.Message }
  else {
    $sr = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $body = $sr.ReadToEnd(); $sr.Close(); Write-Host ">> Body:" $body
  }
}
