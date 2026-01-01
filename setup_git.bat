@echo off
chcp 65001
cd /d "%~dp0"
echo Current directory: %cd%

REM Check if .git exists
if exist ".git" (
    echo Git already initialized in this directory
) else (
    echo Initializing git repository...
    git init
)

REM Create .gitignore if not exists
if not exist ".gitignore" (
    echo Creating .gitignore...
    echo node_modules/ > .gitignore
    echo .env >> .gitignore
    echo .DS_Store >> .gitignore
    echo *.log >> .gitignore
    echo Thumbs.db >> .gitignore
)

echo.
echo Listing files:
dir /b

echo.
echo Git status:
git status

