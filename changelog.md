# Changelog

## 1.3.1

- Fix: Archive schließen `.git` und `.github` nun zuverlässig aus.
- Fix: Ignore-Pattern werden robust erweitert, damit Plain-Namen (z. B. `@types`) korrekt als Ausschluss greifen.
- Test: Regressionstest ergänzt, der `.git`/`.github` in einem temporären Addon erzeugt und den Ausschluss verifiziert.
- Test: Cleanup verbessert, erzeugte `/tmp/test.zip` wird in `afterAll` entfernt.
- Build: Runtime-Bundle in `dist/index.js` neu erzeugt und synchronisiert.
- Dependency: `adm-zip` auf `0.6.0` aktualisiert.
