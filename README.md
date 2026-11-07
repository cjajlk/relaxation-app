# zenus · détente & sommeil

Application de détente et de suivi manuel du sommeil de CJAJLK. **zenus** s'écrit avec un **z minuscule**.

## V0.3 : interface panoramique premium

Cette version reprend le **modèle visuel validé** : paysage nocturne, menu latéral sur PC, cartes illustrées Détente/Sommeil, choix d'ambiances, mélangeur sonore, résumé du carnet de sommeil, respiration guidée et lecteur fixe. Sur mobile, le menu se place en bas et l'interface s'adapte à la largeur.

## Ouvrir le projet

1. Décompresser le ZIP complet, **avec le dossier caché `.git`**.
2. Ouvrir `relaxation-app` dans VS Code, puis lancer **Live Server** sur `index.html`.
3. Vérifier le son et les interactions sur PC, puis sur téléphone via GitHub Pages après publication.

Pour publier depuis ce dossier déjà lié au dépôt `cjajlk/relaxation-app` :

```bash
git status
git log -1 --oneline
git push origin main
```

L'archive contient le commit V0.3 **en local uniquement**. Ne forcez jamais un `git push` si Git signale que le dépôt distant a changé.

## Fonctions actuelles

- Détente et Sommeil, paysages 2D avec effets ralentis et mode plein écran.
- Cinq pistes audio Ogg originales, volume indépendant par piste et volume général.
- Quatre ambiances proposées et favoris personnalisés.
- Minuterie de 5 à 120 minutes ou sans limite ; fondu sonore ; pause et reprise.
- Respiration facultative, dont rythme 4-7-8 ; voix du système si disponible.
- Carnet de sommeil manuel, tendances, export/import JSON.
- Ancienne interface, Yoga/Méditation et statistiques historiques conservés.
- Prise en charge du hors ligne après installation et mise en cache sous HTTPS.

## Données privées et limites

Les entrées de sommeil et les favoris sont stockés dans le navigateur via les clés existantes `zenus.sleep.v1`, `zenus.presets.v1`, `zenus.settings.v2`. L'ancien suivi est conservé. Pour changer de domaine, de navigateur ou de téléphone, exportez d'abord le carnet.

Le carnet n'est pas un dispositif médical. Il distingue le **temps passé au lit** du sommeil réellement mesuré, qui n'est pas mesuré par l'application. Les pistes intégrées sont des sons créés numériquement, pas des enregistrements de nature. La lecture avec écran éteint doit être validée sur l'appareil Android réel.

Détails et vérifications dans [LIVRAISON_ZENUS.md](LIVRAISON_ZENUS.md).
