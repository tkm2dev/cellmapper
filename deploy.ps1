# deploy.ps1 — พุช CellMapper Forensic ขึ้น GitHub Pages (Windows PowerShell)
# by.MerCy-TKM
# วิธีใช้:  1) แก้ $repo ให้เป็น repo ของคุณ  2) รัน  .\deploy.ps1

$repo = "https://github.com/tkm2dev/cellmapper.git"   # <- แก้เป็น repo ของคุณ
$msg  = "CellMapper Forensic PWA v1.1"

if (-not (Test-Path ".git")) {
    git init
    git branch -M main
    git remote add origin $repo
} else {
    if (-not (git remote | Select-String "origin")) { git remote add origin $repo }
}

git add -A
git commit -m $msg
git push -u origin main

Write-Host ""
Write-Host "เสร็จ! เปิด GitHub -> Settings -> Pages -> Branch: main /(root)" -ForegroundColor Yellow
Write-Host "จากนั้นเปิดที่:  https://tkm2dev.github.io/cellmapper/" -ForegroundColor Green
