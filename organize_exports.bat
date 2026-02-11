
@echo off
REM ChatGPT Export Organizer - Windows Batch Version
REM Double-click to organize all ChatGPT exports in current folder

echo.
echo  ========================================
echo   ChatGPT Export Organizer
echo  ========================================
echo.

REM Check if Python is available
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  [!] Python not found. Running PowerShell version...
    echo.
    goto :powershell
)

echo  [i] Using Python organizer...
python "%~dp0organize_exports.py" "%~dp0"
goto :end

:powershell
REM PowerShell fallback
powershell -ExecutionPolicy Bypass -Command ^
    "$source = '%~dp0'; ^
    $archives = Join-Path $source 'Archives'; ^
    New-Item -ItemType Directory -Force -Path $archives | Out-Null; ^
    $files = Get-ChildItem -Path $source -Filter 'ChatGPT_*.md','ChatGPT_*.html','ChatGPT_*.json'; ^
    $groups = $files | ForEach-Object { ^
        if ($_.Name -match 'ChatGPT_(.+?)_\d{4}-\d{2}-\d{2}\.(md|html|json)$') { ^
            [PSCustomObject]@{Name=$Matches[1]; Ext=$Matches[2]; File=$_} ^
        } ^
    } | Group-Object Name; ^
    foreach ($g in $groups) { ^
        $folder = Join-Path $archives $g.Name; ^
        New-Item -ItemType Directory -Force -Path $folder | Out-Null; ^
        Write-Host ('  ' + $g.Name + '/'); ^
        foreach ($f in $g.Group) { ^
            $dest = Join-Path $folder ('conversation.' + $f.Ext); ^
            if (!(Test-Path $dest)) { ^
                Move-Item $f.File.FullName $dest; ^
                Write-Host ('    -> conversation.' + $f.Ext) ^
            } ^
        } ^
    }; ^
    Write-Host ''; ^
    Write-Host ('Done! Check: ' + $archives)"

:end
echo.
echo  Press any key to exit...
pause >nul
