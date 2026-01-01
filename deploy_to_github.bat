@echo off
chcp 65001 >nul

REM Remove .git from home directory if it exists
echo Removing .git from home directory...
if exist "C:\Users\AGaminG\.git" (
    rmdir /s /q "C:\Users\AGaminG\.git"
    echo Removed .git from home directory
) else (
    echo No .git in home directory
)

REM Change to project directory
cd /d "%~dp0"
echo Working in: %cd%

REM Initialize git in project directory
if exist ".git" (
    echo Git already initialized
) else (
    echo Initializing git...
    git init
)

REM Create .gitignore
echo Creating .gitignore...
(
echo node_modules/
echo .env
echo .DS_Store
echo *.log
echo Thumbs.db
echo .idea/
echo *.bat
) > .gitignore

REM Add all files
echo Adding files...
git add .

REM Show status
echo.
echo Git status:
git status

REM Create commit
echo.
echo Creating commit...
git commit -m "Initial commit: Spool Manager v2.0.0"

REM Add remote and push
echo.
echo Adding remote origin...
git remote remove origin 2>nul
git remote add origin https://github.com/REWY432/spool.git

REM Rename branch to main
echo.
echo Renaming branch to main...
git branch -M main

echo.
echo ========================================
echo Now run this command to push:
echo git push -u origin main
echo ========================================
pause

