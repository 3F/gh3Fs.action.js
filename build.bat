@echo off

if not exist ".\node_modules" call npm install || goto err

set reltype=%1
if not defined reltype set reltype=release

if "%reltype%"=="debug" (
    call ncc build src\app.js -m -s --target es2018 -o dist
) else (
    call ncc build src\app.js -m --target es2018 -o dist
)

exit /B 0

:err
echo. Build failed. 1>&2
exit /B 1