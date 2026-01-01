# Скрипт для деплоя на GitHub
$ErrorActionPreference = "Stop"

# Получаем текущую директорию скрипта
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

Write-Host "Инициализация git репозитория..." -ForegroundColor Green
git init

Write-Host "Добавление файлов..." -ForegroundColor Green
git add .

Write-Host "Создание коммита..." -ForegroundColor Green
git commit -m "Initial commit: Spool Manager v2.0.0"

Write-Host "Переименование ветки в main..." -ForegroundColor Green
git branch -M main

Write-Host "Добавление remote origin..." -ForegroundColor Green
git remote add origin https://github.com/REWY432/spool.git

Write-Host "Отправка на GitHub..." -ForegroundColor Green
git push -u origin main

Write-Host "Готово! Проект успешно запушен на GitHub." -ForegroundColor Green
Write-Host "Для активации GitHub Pages:" -ForegroundColor Yellow
Write-Host "1. Перейдите в Settings > Pages" -ForegroundColor Yellow
Write-Host "2. Выберите Source: GitHub Actions" -ForegroundColor Yellow
Write-Host "3. Workflow автоматически задеплоит проект" -ForegroundColor Yellow

