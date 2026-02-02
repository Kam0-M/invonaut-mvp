# Invonaut Rebrand Script
# This script safely renames Flowance to Invonaut across the codebase
# Run from: C:\Users\kamoh\Flowance-Project\flowance-saas

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "INVONAUT REBRAND SCRIPT" -ForegroundColor Cyan
Write-Host "Flowance → Invonaut" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Safety check: Are we in the right directory?
$currentPath = Get-Location
if ($currentPath.Path -notlike "*flowance-saas*") {
    Write-Host "ERROR: Not in the flowance-saas directory!" -ForegroundColor Red
    Write-Host "Current path: $currentPath" -ForegroundColor Yellow
    Write-Host "Please cd to C:\Users\kamoh\Flowance-Project\flowance-saas" -ForegroundColor Yellow
    exit
}

Write-Host "✓ Confirmed in flowance-saas directory" -ForegroundColor Green
Write-Host ""

# Phase 1: Documentation Files (Safest)
Write-Host "PHASE 1: Updating Documentation Files" -ForegroundColor Yellow
Write-Host "--------------------------------------" -ForegroundColor Yellow

$docFiles = @(
    "README.md",
    "USER_GUIDE.md",
    "DEPLOYMENT.md",
    "CHANGELOG.md",
    "CONTRIBUTING.md",
    ".env.example"
)

foreach ($file in $docFiles) {
    if (Test-Path $file) {
        Write-Host "  Updating $file..." -NoNewline
        $content = Get-Content $file -Raw -Encoding UTF8
        $content = $content -replace 'Flowance', 'Invonaut'
        $content = $content -replace 'flowance', 'invonaut'
        $content = $content -replace 'Navigate Your Invoices', 'Get Paid Faster. Powered by AI.'
        $content = $content -replace 'Navigate your invoices', 'Get Paid Faster. Powered by AI.'
        Set-Content $file -Value $content -Encoding UTF8 -NoNewline
        Write-Host " ✓" -ForegroundColor Green
    }
}

Write-Host ""

# Phase 2: Package.json
Write-Host "PHASE 2: Updating package.json" -ForegroundColor Yellow
Write-Host "-------------------------------" -ForegroundColor Yellow

if (Test-Path "package.json") {
    Write-Host "  Updating package.json..." -NoNewline
    $content = Get-Content "package.json" -Raw -Encoding UTF8
    $content = $content -replace '"name": "flowance"', '"name": "invonaut"'
    $content = $content -replace '"name": "flowance-saas"', '"name": "invonaut-saas"'
    Set-Content "package.json" -Value $content -Encoding UTF8 -NoNewline
    Write-Host " ✓" -ForegroundColor Green
}

Write-Host ""

# Phase 3: Source Files (Frontend)
Write-Host "PHASE 3: Updating Frontend Files" -ForegroundColor Yellow
Write-Host "---------------------------------" -ForegroundColor Yellow

# Get all .tsx, .ts, .jsx, .js files in src/app (excluding api routes for now)
$frontendFiles = Get-ChildItem -Path "src/app" -Recurse -Include *.tsx,*.ts,*.jsx,*.js -Exclude *api* | Where-Object { $_.FullName -notlike "*node_modules*" -and $_.FullName -notlike "*.next*" }

Write-Host "  Found $($frontendFiles.Count) frontend files to update"

foreach ($file in $frontendFiles) {
    $relativePath = $file.FullName.Replace($currentPath.Path, "").TrimStart('\')
    Write-Host "  Updating $relativePath..." -NoNewline
    
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    
    # Replace brand names
    $content = $content -replace 'Flowance', 'Invonaut'
    $content = $content -replace 'flowance', 'invonaut'
    
    # Replace taglines
    $content = $content -replace 'Navigate Your Invoices', 'Get Paid Faster. Powered by AI.'
    $content = $content -replace 'Navigate your invoices', 'Get Paid Faster. Powered by AI.'
    $content = $content -replace 'Navigate\s+your\s+invoices', 'Get Paid Faster. Powered by AI.'
    
    if ($content -ne $originalContent) {
        Set-Content $file.FullName -Value $content -Encoding UTF8 -NoNewline
        Write-Host " ✓" -ForegroundColor Green
    } else {
        Write-Host " (no changes)" -ForegroundColor Gray
    }
}

Write-Host ""

# Phase 4: API Routes & Backend
Write-Host "PHASE 4: Updating API Routes" -ForegroundColor Yellow
Write-Host "-----------------------------" -ForegroundColor Yellow

$apiFiles = Get-ChildItem -Path "src/app/api" -Recurse -Include *.tsx,*.ts,*.jsx,*.js -ErrorAction SilentlyContinue | Where-Object { $_.FullName -notlike "*node_modules*" -and $_.FullName -notlike "*.next*" }

if ($apiFiles) {
    Write-Host "  Found $($apiFiles.Count) API files to update"
    
    foreach ($file in $apiFiles) {
        $relativePath = $file.FullName.Replace($currentPath.Path, "").TrimStart('\')
        Write-Host "  Updating $relativePath..." -NoNewline
        
        $content = Get-Content $file.FullName -Raw -Encoding UTF8
        $originalContent = $content
        
        $content = $content -replace 'Flowance', 'Invonaut'
        $content = $content -replace 'flowance', 'invonaut'
        
        if ($content -ne $originalContent) {
            Set-Content $file.FullName -Value $content -Encoding UTF8 -NoNewline
            Write-Host " ✓" -ForegroundColor Green
        } else {
            Write-Host " (no changes)" -ForegroundColor Gray
        }
    }
} else {
    Write-Host "  No API files found or already updated" -ForegroundColor Gray
}

Write-Host ""

# Phase 5: Components
Write-Host "PHASE 5: Updating Components" -ForegroundColor Yellow
Write-Host "----------------------------" -ForegroundColor Yellow

$componentFiles = Get-ChildItem -Path "src/components" -Recurse -Include *.tsx,*.ts,*.jsx,*.js -ErrorAction SilentlyContinue | Where-Object { $_.FullName -notlike "*node_modules*" -and $_.FullName -notlike "*.next*" }

if ($componentFiles) {
    Write-Host "  Found $($componentFiles.Count) component files to update"
    
    foreach ($file in $componentFiles) {
        $relativePath = $file.FullName.Replace($currentPath.Path, "").TrimStart('\')
        Write-Host "  Updating $relativePath..." -NoNewline
        
        $content = Get-Content $file.FullName -Raw -Encoding UTF8
        $originalContent = $content
        
        $content = $content -replace 'Flowance', 'Invonaut'
        $content = $content -replace 'flowance', 'invonaut'
        
        if ($content -ne $originalContent) {
            Set-Content $file.FullName -Value $content -Encoding UTF8 -NoNewline
            Write-Host " ✓" -ForegroundColor Green
        } else {
            Write-Host " (no changes)" -ForegroundColor Gray
        }
    }
} else {
    Write-Host "  No component files found" -ForegroundColor Gray
}

Write-Host ""

# Phase 6: Lib folder
Write-Host "PHASE 6: Updating Lib Files" -ForegroundColor Yellow
Write-Host "---------------------------" -ForegroundColor Yellow

$libFiles = Get-ChildItem -Path "src/lib" -Recurse -Include *.tsx,*.ts,*.jsx,*.js -ErrorAction SilentlyContinue | Where-Object { $_.FullName -notlike "*node_modules*" -and $_.FullName -notlike "*.next*" }

if ($libFiles) {
    Write-Host "  Found $($libFiles.Count) lib files to update"
    
    foreach ($file in $libFiles) {
        $relativePath = $file.FullName.Replace($currentPath.Path, "").TrimStart('\')
        Write-Host "  Updating $relativePath..." -NoNewline
        
        $content = Get-Content $file.FullName -Raw -Encoding UTF8
        $originalContent = $content
        
        $content = $content -replace 'Flowance', 'Invonaut'
        $content = $content -replace 'flowance', 'invonaut'
        
        if ($content -ne $originalContent) {
            Set-Content $file.FullName -Value $content -Encoding UTF8 -NoNewline
            Write-Host " ✓" -ForegroundColor Green
        } else {
            Write-Host " (no changes)" -ForegroundColor Gray
        }
    }
} else {
    Write-Host "  No lib files found" -ForegroundColor Gray
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "REBRAND COMPLETE!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary:" -ForegroundColor Yellow
Write-Host "  ✓ Documentation updated" -ForegroundColor Green
Write-Host "  ✓ package.json updated" -ForegroundColor Green
Write-Host "  ✓ Frontend files updated" -ForegroundColor Green
Write-Host "  ✓ API routes updated" -ForegroundColor Green
Write-Host "  ✓ Components updated" -ForegroundColor Green
Write-Host "  ✓ Lib files updated" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Copy the logo: Copy Logo.png to public/invonaut-logo.png" -ForegroundColor White
Write-Host "  2. Test the app: npm run dev" -ForegroundColor White
Write-Host "  3. Commit changes: git add . && git commit -m 'Rebrand to Invonaut'" -ForegroundColor White
Write-Host ""
