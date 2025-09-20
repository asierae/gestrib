@echo off
REM Script para build en Vercel (Windows)
copy src\environments\environment.prod.ts src\environments\environment.ts
ng build --configuration production
