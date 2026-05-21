# Mahir Backend API Test Suite
$ErrorActionPreference = "Continue"
$BASE = "http://localhost:3000"
$PASS = 0
$FAIL = 0

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Url,
        [string]$Body = $null,
        [string]$Token = $null,
        [int]$ExpectedStatus = 200
    )
    
    $headers = @{ "Content-Type" = "application/json" }
    if ($Token) { $headers["Authorization"] = "Bearer $Token" }
    
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            Headers = $headers
            UseBasicParsing = $true
            ErrorAction = "Stop"
        }
        if ($Body) { $params["Body"] = $Body }
        
        $response = Invoke-WebRequest @params
        $status = $response.StatusCode
        $data = $response.Content | ConvertFrom-Json
        
        if ($status -eq $ExpectedStatus) {
            $script:PASS++
            Write-Host "  [PASS] $Name ($status)"
            return $data
        } else {
            $script:FAIL++
            Write-Host "  [FAIL] $Name (expected $ExpectedStatus, got $status)"
            return $null
        }
    } catch {
        $errStatus = 0
        if ($_.Exception.Response) {
            $errStatus = [int]$_.Exception.Response.StatusCode
        }
        if ($errStatus -eq $ExpectedStatus) {
            $script:PASS++
            Write-Host "  [PASS] $Name ($errStatus - expected error)"
            return $null
        } else {
            $script:FAIL++
            $msg = $_.Exception.Message
            Write-Host "  [FAIL] $Name ($msg)"
            return $null
        }
    }
}

Write-Host ""
Write-Host "=================================================="
Write-Host "  MAHIR BACKEND API - FULL TEST SUITE"
Write-Host "=================================================="
Write-Host ""

# 1. Health Check
Write-Host "--- Health Check ---"
Test-Endpoint -Name "GET /health" -Method "GET" -Url "$BASE/health"

# 2. Auth Tests
Write-Host ""
Write-Host "--- Auth Endpoints ---"

$loginResult = Test-Endpoint -Name "POST /api/auth/login (client)" -Method "POST" -Url "$BASE/api/auth/login" -Body '{"email":"client@mahir.demo","password":"123456"}'
$CLIENT_TOKEN = ""
if ($loginResult) { $CLIENT_TOKEN = $loginResult.data.token }

$provLoginResult = Test-Endpoint -Name "POST /api/auth/login (provider)" -Method "POST" -Url "$BASE/api/auth/login" -Body '{"email":"usman@example.com","password":"123456"}'
$PROVIDER_TOKEN = ""
if ($provLoginResult) { $PROVIDER_TOKEN = $provLoginResult.data.token }

$timestamp = [DateTimeOffset]::Now.ToUnixTimeSeconds()
$regBody = "{`"name`":`"Test User`",`"email`":`"test$timestamp@mahir.test`",`"password`":`"Test@1234`",`"role`":`"client`"}"
Test-Endpoint -Name "POST /api/auth/register" -Method "POST" -Url "$BASE/api/auth/register" -Body $regBody -ExpectedStatus 201

Test-Endpoint -Name "GET /api/auth/me" -Method "GET" -Url "$BASE/api/auth/me" -Token $CLIENT_TOKEN

Test-Endpoint -Name "GET /api/auth/me (no token -> 401)" -Method "GET" -Url "$BASE/api/auth/me" -ExpectedStatus 401

Test-Endpoint -Name "POST /api/auth/login (bad password -> 401)" -Method "POST" -Url "$BASE/api/auth/login" -Body '{"email":"client@mahir.demo","password":"wrong"}' -ExpectedStatus 401

# 3. Client Endpoints
Write-Host ""
Write-Host "--- Client Endpoints ---"

Test-Endpoint -Name "GET /api/client/jobs" -Method "GET" -Url "$BASE/api/client/jobs" -Token $CLIENT_TOKEN
Test-Endpoint -Name "GET /api/client/bookings" -Method "GET" -Url "$BASE/api/client/bookings" -Token $CLIENT_TOKEN
Test-Endpoint -Name "GET /api/client/messages" -Method "GET" -Url "$BASE/api/client/messages" -Token $CLIENT_TOKEN
Test-Endpoint -Name "GET /api/client/jobs (no auth -> 401)" -Method "GET" -Url "$BASE/api/client/jobs" -ExpectedStatus 401

# 4. Provider Endpoints
Write-Host ""
Write-Host "--- Provider Endpoints ---"

Test-Endpoint -Name "GET /api/provider/profile" -Method "GET" -Url "$BASE/api/provider/profile" -Token $PROVIDER_TOKEN
Test-Endpoint -Name "GET /api/provider/jobs?lat&lng" -Method "GET" -Url "$BASE/api/provider/jobs?lat=33.6939&lng=72.9941&radiusKm=10" -Token $PROVIDER_TOKEN
Test-Endpoint -Name "GET /api/provider/bookings" -Method "GET" -Url "$BASE/api/provider/bookings" -Token $PROVIDER_TOKEN
Test-Endpoint -Name "GET /api/provider/earnings" -Method "GET" -Url "$BASE/api/provider/earnings" -Token $PROVIDER_TOKEN
Test-Endpoint -Name "GET /api/provider/messages" -Method "GET" -Url "$BASE/api/provider/messages" -Token $PROVIDER_TOKEN

$statusBody = '{"isActive":true}'
Test-Endpoint -Name "PUT /api/provider/status" -Method "PUT" -Url "$BASE/api/provider/status" -Body $statusBody -Token $PROVIDER_TOKEN

Test-Endpoint -Name "GET /api/provider/profile (no auth -> 401)" -Method "GET" -Url "$BASE/api/provider/profile" -ExpectedStatus 401
Test-Endpoint -Name "GET /api/provider/profile (client token -> 403)" -Method "GET" -Url "$BASE/api/provider/profile" -Token $CLIENT_TOKEN -ExpectedStatus 403

# 5. Provider Profile Update
Write-Host ""
Write-Host "--- Provider Profile Update ---"
$updateBody = '{"bio":"Updated bio for testing","skills":["AC Repair","Gas Charging","Inverter AC"]}'
Test-Endpoint -Name "PUT /api/provider/profile" -Method "PUT" -Url "$BASE/api/provider/profile" -Body $updateBody -Token $PROVIDER_TOKEN

# 6. Agent Endpoints
Write-Host ""
Write-Host "--- Agent Endpoints ---"
Test-Endpoint -Name "GET /api/agent/logs" -Method "GET" -Url "$BASE/api/agent/logs" -Token $CLIENT_TOKEN

# 7. Error Handling
Write-Host ""
Write-Host "--- Error Handling ---"
Test-Endpoint -Name "GET /api/nonexistent (404)" -Method "GET" -Url "$BASE/api/nonexistent" -ExpectedStatus 404

# 8. Validation Edge Cases
Write-Host ""
Write-Host "--- Validation Edge Cases ---"
Test-Endpoint -Name "POST /api/auth/register (missing fields -> 400)" -Method "POST" -Url "$BASE/api/auth/register" -Body '{"email":"bad"}' -ExpectedStatus 400
Test-Endpoint -Name "POST /api/auth/register (invalid email -> 400)" -Method "POST" -Url "$BASE/api/auth/register" -Body '{"name":"X","email":"notanemail","password":"short","role":"client"}' -ExpectedStatus 400
Test-Endpoint -Name "POST /api/auth/register (duplicate email -> 409)" -Method "POST" -Url "$BASE/api/auth/register" -Body '{"name":"Dupe","email":"client@mahir.demo","password":"Demo@1234","role":"client"}' -ExpectedStatus 409

# Summary
Write-Host ""
Write-Host "=================================================="
if ($FAIL -eq 0) {
    Write-Host "  ALL TESTS PASSED: $PASS passed, $FAIL failed"
} else {
    Write-Host "  RESULTS: $PASS passed, $FAIL failed"
}
Write-Host "=================================================="
Write-Host ""
