# ============================================================
# build-apk.ps1 — 게임을 안드로이드 APK로 빌드해서 바탕화면에 복사
# 사용법: 파워셸에서  ./build-apk.ps1  실행 (또는 우클릭 → PowerShell로 실행)
# 결과물: 바탕화면\표류서바이버.apk  → 휴대폰에 옮겨서 설치
# ============================================================
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

# JDK 17 사용 (Capacitor 6 요구). 이 PC 기준 경로.
$env:JAVA_HOME = 'C:\Java\jdk-17\jdk-17.0.14'
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
$sdk = 'C:/Users/ehdwn/AppData/Local/Android/Sdk'

Write-Host "[1/4] 웹 빌드..." -ForegroundColor Cyan
npm run build

Write-Host "[2/4] 안드로이드 프로젝트 동기화..." -ForegroundColor Cyan
# ⚠ 다운로드용 APK(public/castaway.apk)가 dist 로 복사되면 앱 안에 APK가 중첩되어
#    용량이 2배로 불어남 → cap sync 전에 dist 안의 apk 제거 (raw GitHub 주소는 repo 파일을 직접 읽음)
Get-ChildItem "$root\dist" -Filter *.apk -ErrorAction SilentlyContinue | Remove-Item -Force
if (-not (Test-Path "$root\android")) { npx cap add android } else { npx cap sync android }

# 한글 경로 우회 + SDK 위치 보정
$gp = "$root\android\gradle.properties"
if (-not (Select-String -Path $gp -Pattern 'overridePathCheck' -Quiet)) {
  Add-Content $gp "`nandroid.overridePathCheck=true"
}
Set-Content "$root\android\local.properties" "sdk.dir=$sdk" -Encoding ascii

Write-Host "[3/4] APK 빌드 (처음엔 몇 분 걸립니다)..." -ForegroundColor Cyan
Set-Location "$root\android"
& "$root\android\gradlew.bat" assembleDebug --console=plain --warning-mode=none
Set-Location $root

Write-Host "[4/4] APK 복사..." -ForegroundColor Cyan
$apk = "$root\android\app\build\outputs\apk\debug\app-debug.apk"
$desktop = [Environment]::GetFolderPath('Desktop')
$dest = Join-Path $desktop '표류서바이버.apk'
Copy-Item $apk $dest -Force

Write-Host "`n완성! ▶ $dest" -ForegroundColor Green
Write-Host "이 파일을 휴대폰으로 옮겨서 탭하면 설치됩니다." -ForegroundColor Green
