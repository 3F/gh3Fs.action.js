@echo off

set src=src\app.js
set esTarget=es2018

if not exist ".\node_modules" call npm install || goto err

set reltype=%1
if not defined reltype set reltype=release

if "%reltype%"=="debug" (
    call ncc build %src% -s --no-source-map-register --target %esTarget% -o dist || goto err
) else (
    call ncc build %src% -m --target %esTarget% -o dist || goto err
)

exit /B 0

:err
echo. Failed. 1>&2
exit /B 1