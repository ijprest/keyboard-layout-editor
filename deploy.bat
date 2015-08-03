@echo off
SETLOCAL ENABLEEXTENSIONS ENABLEDELAYEDEXPANSION
set PARMS=
if "%1"=="" SET PARMS=--dryrun
for %%Q IN (css js fonts samples bg) DO (
  aws s3 sync .\%%Q s3://www.keyboard-layout-editor.com/%%Q --acl public-read %PARMS%
)
for %%Q IN (kb.html oauth.html kb.js render.js serial.js extensions.js *.md *.json favicon.ico) DO (
  aws s3 cp .\%%Q s3://www.keyboard-layout-editor.com/%%Q --acl public-read %PARMS%
)
goto :EOF
