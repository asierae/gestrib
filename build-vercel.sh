#!/bin/bash
# Script para build en Vercel
cp src/environments/environment.prod.ts src/environments/environment.ts
ng build --configuration production
