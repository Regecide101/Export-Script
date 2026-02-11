@echo off
REM ChatGPT Export Organizer - Windows Batch Version
REM Double-click to organize all ChatGPT exports in the same folder as this script

echo.
echo  ========================================
echo   ChatGPT Export Organizer
echo  ========================================
echo.

REM Change to the directory where this batch file is located
cd /d "%~dp0"

REM Check if Python is available
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  [!] Python not found. Running PowerShell version...
    echo.
    goto :powershell
)

echo  [i] Using Python organizer...
echo  [i] Working directory: %cd%
echo.
python "%~dp0organize_exports.py"
goto :end

:powershell
REM PowerShell fallback
powershell -ExecutionPolicy Bypass -Command ^
    "$source = '%~dp0'.TrimEnd('\'); ^
    Write-Host ('  Working directory: ' + $source); ^
    Write-Host ''; ^
    $archives = Join-Path $source 'Archives'; ^
    New-Item -ItemType Directory -Force -Path $archives | Out-Null; ^
    $files = Get-ChildItem -Path $source -Filter 'ChatGPT_*.*' | Where-Object { $_.Extension -match '\.(md|html|json|png|jpg|jpeg|gif|webp)$' }; ^
    $groups = @{}; ^
    foreach ($f in $files) { ^
        if ($f.Name -match 'ChatGPT_(.+?)_\d{4}-\d{2}-\d{2}(_image_\d+)?\.(md|html|json|png|jpg|jpeg|gif|webp)$') { ^
            $convName = $Matches[1]; ^
            if (-not $groups.ContainsKey($convName)) { $groups[$convName] = @{files=@(); images=@()} }; ^
            if ($Matches[2]) { $groups[$convName].images += $f } else { $groups[$convName].files += $f } ^
        } ^
    }; ^
    foreach ($name in $groups.Keys | Sort-Object) { ^
        $folder = Join-Path $archives $name; ^
        New-Item -ItemType Directory -Force -Path $folder | Out-Null; ^
        Write-Host ('  ' + $name + '/'); ^
        foreach ($f in $groups[$name].files) { ^
            $ext = $f.Extension; ^
            $dest = Join-Path $folder ('conversation' + $ext); ^
            if (!(Test-Path $dest)) { Move-Item $f.FullName $dest; Write-Host ('    -> conversation' + $ext) } ^
        }; ^
        if ($groups[$name].images.Count -gt 0) { ^
            $imgFolder = Join-Path $folder 'images'; ^
            New-Item -ItemType Directory -Force -Path $imgFolder | Out-Null; ^
            foreach ($img in $groups[$name].images) { ^
                $imgName = $img.Name -replace 'ChatGPT_.+?_\d{4}-\d{2}-\d{2}_', ''; ^
                $dest = Join-Path $imgFolder $imgName; ^
                if (!(Test-Path $dest)) { Move-Item $img.FullName $dest } ^
            }; ^
            Write-Host ('    -> images/ (' + $groups[$name].images.Count + ' files)') ^
        } ^
    }; ^
    Write-Host ''; ^
    Write-Host ('Done! Check: ' + $archives)"

:end
echo.
echo  Press any key to exit...
pause >nul
