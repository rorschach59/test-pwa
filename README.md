## PWA minimaliste avec notifications push (WonderPush)

### Objectif
- L’utilisateur clique sur un bouton, s’inscrit en 1 clic et reçoit des notifications sur son smartphone.
- Cross‑browser: Chrome, Firefox, Safari, Opera.
- Pas d’installation PWA requise, seulement l’autorisation navigateur.

### Structure minimale
- `index.html`: inclut WonderPush SDK et le bouton d’activation.
- `manifest.json`: nécessaire pour PWA (icônes, couleurs).
- `app.js`: branche le bouton pour appeler `WonderPush.subscribe()`.
- `styles.css`: styles de base.
- `netlify.toml`: en-têtes utiles (no-cache pour `index.html`).

### Intégration WonderPush
Dans `index.html` (head), ajouter:

```html
<script src="https://cdn.by.wonderpush.com/sdk/1.1/wonderpush-loader.min.js" async></script>
<script>
  window.WonderPush = window.WonderPush || [];
  WonderPush.push(["init", {
    webKey: "VOTRE_WEB_KEY",
  }]);
  // Optionnel: auto-display du prompt d’autorisation
  // WonderPush.push(["subscribe"]);
</script>
```

Dans `app.js`, sur clic utilisateur:

```js
document.getElementById('enableNotificationsBtn')?.addEventListener('click', () => {
  window.WonderPush = window.WonderPush || [];
  window.WonderPush.push(["subscribe"]);
});
```

### Notes compatibilité
- iOS (Safari): nécessite iOS ≥ 16.4. Aucune installation PWA requise pour recevoir des push Web, mais l’utilisateur doit autoriser.
- Les politiques d’affichage (verrouillé, bruit, badges) sont gérées par l’OS et WonderPush.

### Déploiement rapide
1. Déployer les fichiers statiques (Netlify/Vercel/autres).
2. Configurer WonderPush (domaine autorisé, Web Key).
3. Ouvrir la page et cliquer “Activer les notifications”.
4. Envoyer une notification test depuis le dashboard WonderPush.


