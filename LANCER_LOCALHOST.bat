@echo off
cd /d "%~dp0"
echo.
echo OpenFluidSoundVisualizer - serveur local pour YouTube
echo Ouvre: http://localhost:8080/
echo.
start "" "http://localhost:8080/"
where py >nul 2>nul
if %errorlevel%==0 (
  py -m http.server 8080
  goto :end
)
where python >nul 2>nul
if %errorlevel%==0 (
  python -m http.server 8080
  goto :end
)
echo Python introuvable. Installe Python ou lance: python -m http.server 8080
pause
:end
