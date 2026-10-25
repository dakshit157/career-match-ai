# CareerMatch AI Development Runner
# Launches FastAPI Backend and Next.js Frontend in separate PowerShell windows

Write-Host "Starting CareerMatch AI Application..." -ForegroundColor Cyan

# 1. Start Backend in a new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host 'Starting CareerMatch AI FastAPI Backend...' -ForegroundColor Green; cd backend; .\.venv\Scripts\python.exe main.py"

# 2. Start Frontend in a new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host 'Starting CareerMatch AI Next.js Frontend...' -ForegroundColor Cyan; cd frontend; npm run dev"

Write-Host "`nBackend will be available at: http://localhost:8000 (Docs: http://localhost:8000/docs)" -ForegroundColor Green
Write-Host "Frontend will be available at: http://localhost:3000" -ForegroundColor Cyan
Write-Host "`nHappy Career Matching!" -ForegroundColor Yellow
