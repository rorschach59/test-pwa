## Test PWA – Déploiement Netlify et versioning du Service Worker

### Structure
- `index.html`, `manifest.json`, `app.js`, `styles.css`, `sw.js`
- `netlify.toml`: headers (no-cache sur `sw.js`/`index.html`) + commande de build
- `VERSION`: version semver du service worker
- `bump-sw-version.sh`: script de bump `major|minor|patch` et injection dans `sw.js`

### Versioning (semver)
- Format: `MAJOR.MINOR.PATCH` (ex: `1.2.3`)
  - MAJOR: grosse feature/réséau incompatible
  - MINOR: nouvelle petite feature
  - PATCH: correctif/ajustement mineur

#### Utilisation locale
```bash
./bump-sw-version.sh patch   # 0.0.0 -> 0.0.1
./bump-sw-version.sh minor   # 0.0.1 -> 0.1.0
./bump-sw-version.sh major   # 0.1.0 -> 1.0.0
```
Le script met à jour `VERSION` et remplace la ligne `const SW_VERSION = 'x.y.z';` dans `sw.js`.

### Déploiement Netlify
1. Poussez le dossier dans un repo Git (GitHub/GitLab).
2. Sur Netlify → New site from Git → sélectionnez le repo.
3. Build command: `bash bump-sw-version.sh` (ou définissez la variable env `BUMP=patch`).
4. Publish directory: `.`

À chaque déploiement, la version du SW est incrémentée selon `BUMP` (par défaut `patch`). La PWA affichera le bouton “Mettre à jour” lorsqu’une nouvelle version est disponible et rechargera après activation.

### Conseils PWA en prod
- Garder `sw.js` et `index.html` sans cache agressif (cf. `netlify.toml`).
- Incrémenter la version du SW à chaque changement d’assets pour garantir l’update.
- Tester l’update: ouvrir la PWA installée → bouton “Mettre à jour”.


