# Test script for Fastag Alert System API

$baseUrl = "http://localhost:5000/api"

Write-Host "========== FASTAG ALERT SYSTEM API TESTS ==========" -ForegroundColor Cyan

# Test 1: Login as Admin
Write-Host "`n[1] Testing Admin Login..." -ForegroundColor Yellow
$loginBody = @{
    email = "admin@fastag.com"
    password = "admin123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -ContentType "application/json" -Body $loginBody
    $adminToken = $loginResponse.token
    $adminId = $loginResponse.user.id
    Write-Host "[PASS] Admin login successful" -ForegroundColor Green
    Write-Host "  Token: $($adminToken.Substring(0, 20))..." -ForegroundColor Gray
    Write-Host "  User: $($loginResponse.user.email)" -ForegroundColor Gray
} catch {
    Write-Host "[FAIL] Admin login failed: $_" -ForegroundColor Red
    exit 1
}

# Test 2: Login as Manager
Write-Host "`n[2] Testing Manager Login..." -ForegroundColor Yellow
$loginBody = @{
    email = "manager@fastag.com"
    password = "manager123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -ContentType "application/json" -Body $loginBody
    $managerToken = $loginResponse.token
    Write-Host "[PASS] Manager login successful" -ForegroundColor Green
    Write-Host "  User: $($loginResponse.user.email) | Role ID: $($loginResponse.user.roleId)" -ForegroundColor Gray
} catch {
    Write-Host "[FAIL] Manager login failed: $_" -ForegroundColor Red
}

# Test 3: Get Current User Profile
Write-Host "`n[3] Testing Get User Profile..." -ForegroundColor Yellow
$headers = @{ Authorization = "Bearer $adminToken" }
try {
    $profileResponse = Invoke-RestMethod -Uri "$baseUrl/auth/me" -Method GET -Headers $headers
    Write-Host "[PASS] Profile retrieved" -ForegroundColor Green
    Write-Host "  Name: $($profileResponse.name) | Email: $($profileResponse.email)" -ForegroundColor Gray
} catch {
    Write-Host "[FAIL] Profile retrieval failed: $_" -ForegroundColor Red
}

# Test 4: Get All Users (Admin Only)
Write-Host "`n[4] Testing Get All Users (Admin)..." -ForegroundColor Yellow
try {
    $usersResponse = Invoke-RestMethod -Uri "$baseUrl/users" -Method GET -Headers $headers
    Write-Host "[PASS] Users list retrieved" -ForegroundColor Green
    Write-Host "  Total users: $($usersResponse.Count)" -ForegroundColor Gray
    $usersResponse | ForEach-Object { Write-Host "    - $($_.email) (Role: $($_.roleId))" -ForegroundColor Gray }
} catch {
    Write-Host "[FAIL] Users list failed: $_" -ForegroundColor Red
}

# Test 5: Register New User
Write-Host "`n[5] Testing User Registration..." -ForegroundColor Yellow
$registerBody = @{
    email = "driver@fastag.com"
    password = "driver123"
    name = "Test Driver"
    roleId = 3
} | ConvertTo-Json

try {
    $registerResponse = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method POST -ContentType "application/json" -Body $registerBody
    Write-Host "[PASS] User registered successfully" -ForegroundColor Green
    Write-Host "  Email: $($registerResponse.email) | Name: $($registerResponse.name)" -ForegroundColor Gray
} catch {
    Write-Host "[FAIL] Registration failed: $_" -ForegroundColor Red
}

# Test 6: Get Vehicles
Write-Host "`n[6] Testing Get Vehicles..." -ForegroundColor Yellow
try {
    $vehiclesResponse = Invoke-RestMethod -Uri "$baseUrl/vehicles" -Method GET -Headers $headers
    Write-Host "[PASS] Vehicles retrieved" -ForegroundColor Green
    Write-Host "  Total vehicles: $($vehiclesResponse.Count)" -ForegroundColor Gray
    $vehiclesResponse | ForEach-Object { 
        $status = if ($_.isLowBalance) { "[LOW]" } else { "[OK]" }
        Write-Host "    - $($_.vehicleNumber) ($($_.model)) - Balance: Rs$($_.fastagBalance) $status" -ForegroundColor Gray 
    }
} catch {
    Write-Host "[FAIL] Vehicles retrieval failed: $_" -ForegroundColor Red
}

# Test 7: Create Vehicle (Admin)
Write-Host "`n[7] Testing Create Vehicle..." -ForegroundColor Yellow
$vehicleBody = @{
    vehicleNumber = "TEST-001"
    ownerName = "Test Owner"
    model = "Test Model"
    mileage = 5000
    fastagBalance = 500
    lastServiceDate = "2026-01-01"
} | ConvertTo-Json

try {
    $vehicleResponse = Invoke-RestMethod -Uri "$baseUrl/vehicles" -Method POST -ContentType "application/json" -Headers $headers -Body $vehicleBody
    Write-Host "[PASS] Vehicle created" -ForegroundColor Green
    Write-Host "  Vehicle Number: $($vehicleResponse.vehicleNumber) | Balance: Rs$($vehicleResponse.fastagBalance)" -ForegroundColor Gray
    $vehicleId = $vehicleResponse.id
} catch {
    Write-Host "[FAIL] Vehicle creation failed: $_" -ForegroundColor Red
}

# Test 8: Recharge Fastag
Write-Host "`n[8] Testing Fastag Recharge..." -ForegroundColor Yellow
$rechargeBody = @{ amount = 1000 } | ConvertTo-Json
try {
    $rechargeResponse = Invoke-RestMethod -Uri "$baseUrl/vehicles/$vehicleId/recharge" -Method POST -ContentType "application/json" -Headers $headers -Body $rechargeBody
    Write-Host "[PASS] Fastag recharged" -ForegroundColor Green
    Write-Host "  New Balance: Rs$($rechargeResponse.fastagBalance)" -ForegroundColor Gray
} catch {
    Write-Host "[FAIL] Recharge failed: $_" -ForegroundColor Red
}

# Test 9: Test Unauthorized Access
Write-Host "`n[9] Testing Unauthorized Access..." -ForegroundColor Yellow
$unauthorizedTest = $false
try {
    $result = Invoke-WebRequest -Uri "$baseUrl/vehicles" -Method GET -ErrorAction Stop
    Write-Host "[FAIL] Should have been unauthorized!" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "[PASS] Correctly rejected unauthorized request (401)" -ForegroundColor Green
    } else {
        Write-Host "[WARN] Unexpected status code: $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
    }
}

# Test 10: Logout
Write-Host "`n[10] Testing Logout..." -ForegroundColor Yellow
try {
    $logoutResponse = Invoke-WebRequest -Uri "$baseUrl/auth/logout" -Method POST -Headers $headers -ErrorAction Stop
    Write-Host "[PASS] Logout successful" -ForegroundColor Green
} catch {
    Write-Host "[FAIL] Logout failed: $_" -ForegroundColor Red
}

Write-Host "`n========== ALL TESTS COMPLETED ==========" -ForegroundColor Cyan
