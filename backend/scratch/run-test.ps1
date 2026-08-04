Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WorkingDirectory "d:\AgriRent_AI\backend" -PassThru -NoNewWindow
Start-Sleep -Seconds 5
npx tsx d:\AgriRent_AI\backend\scratch\verify_auth_flow2.ts
Stop-Process -Name "node" -Force
