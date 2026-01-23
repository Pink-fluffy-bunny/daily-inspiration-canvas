@echo off
echo 正在启动本地服务器...
echo 请在浏览器中访问: http://localhost:5000
echo 按Ctrl+C可停止服务器
cd /d "%~dp0"
npx serve dist -l 5000
pause
