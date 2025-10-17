@echo off
title VPP Server
cd /d "%~dp0"
cd index

:: 启动浏览器访问网页
start http://localhost:7878

:: 启动本地HTTP服务器
python -m http.server 7878

pause
