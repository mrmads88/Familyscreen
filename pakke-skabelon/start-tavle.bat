@echo off
title Familietavlen
cd /d "%~dp0familietavle"
echo.
echo   Familietavlen starter paa http://localhost:8765
echo   Luk dette vindue for at stoppe tavlen.
echo.
where py >nul 2>nul && (
  start "" /min cmd /c "timeout /t 2 >nul & start http://localhost:8765"
  py -m http.server 8765
  goto :eof
)
where python >nul 2>nul && (
  start "" /min cmd /c "timeout /t 2 >nul & start http://localhost:8765"
  python -m http.server 8765
  goto :eof
)
echo   Python er ikke installeret.
echo   Hent det paa https://www.python.org/downloads/ og saet flueben i "Add python.exe to PATH".
echo   Eller laeg tavlen ind i Home Assistant - se START-HER.md.
echo.
pause
