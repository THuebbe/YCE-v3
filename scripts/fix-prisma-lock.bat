@echo off
echo Fixing Prisma file lock issues...
taskkill /f /im node.exe 2>nul
timeout /t 2 /nobreak >nul
rmdir /s /q "node_modules\.prisma" 2>nul
echo Regenerating Prisma client...
npx prisma generate
echo Done!

● Root Cause & Prevention:

  The EACCES issue happens because:
  1. WSL/Windows file system conflicts - binaries get locked
  2. Multiple Node processes running simultaneously
  3. Prisma engine files being accessed during regeneration

  Long-term prevention:
  - Use npm run build-safe instead of npm run build
  - Run npm run prisma-fix when you hit the error
  - Consider using Docker for development to avoid Windows file system issues