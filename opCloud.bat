@echo off
:: 启动数据服务接口
@echo off
echo 当前盘符和路径：%~dp0
call node %~dp0/bin/www

pause
