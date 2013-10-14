@echo off
aws s3 sync . s3://www.keyboard-layout-editor.com --exclude aws-private-key.txt --exclude *.py --exclude mongoose* --exclude .git* --exclude *.bat --exclude upload-policy.txt %*