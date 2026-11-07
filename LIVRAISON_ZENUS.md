# zenus V0.3 — Refonte de l'interface selon la référence validée

Date de travail : 7 novembre 2026. Projet créé à partir du ZIP `relaxation-app.zip` de CJ et de la V0.2 locale. **Conserver le nom `zenus` avec le z minuscule.**

## Refonte réalisée

- **Accueil de type dashboard premium**, fidèle à l'organisation du visuel choisi : logo et navigation latérale, en-tête, grand paysage nocturne avec chalet, cartes Détente/Sommeil, atmosphères illustrées, mélangeur, choix des univers, résumé du sommeil et respiration guidée.
- **Lecteur fixe en bas** : lecture, pause, reprise, arrêt, barre de progression, temps, volume général et passage en immersion. Le bouton de reprise conserve une taille adaptée sur mobile.
- **Paysage principal nocturne** tiré du visuel de référence fourni, recadré sans les éléments d'interface. Les huit autres variantes jour/nuit 2D de V0.2 sont conservées.
- **Navigation mobile adaptée** : barre de navigation en bas, lecteur placé au-dessus, colonnes réorganisées sans débordement à 320 px.
- **Dashboard alimenté par les données réelles** : une nouvelle installation indique « Aucune nuit saisie » au lieu d'inventer des mesures. Les graphiques et moyennes apparaissent après saisie d'une nuit.
- **Favoris** : les ambiances de découverte restent disponibles, les favoris réellement sauvegardés s'ajoutent à l'accueil et au carnet personnel.
- **Réglages utiles conservés** : minuterie, fondu sonore, cinq volumes indépendants, voix et respiration guidée, animations facultatives, import/export du carnet, accès à l'ancienne application et aux exercices.
- **Mode hors ligne** : service worker `zenus-static-v3`, avec mise en cache du nouveau visuel. L'installation doit être testée en HTTPS.

## Sauvegardes

Aucune clé locale de V0.2 n'a été modifiée : `zenus.sleep.v1`, `zenus.presets.v1`, `zenus.settings.v2`. Les clés de Relaxation (progression et badges) restent utilisées et n'ont pas été supprimées. Tous les fichiers d'origine `assets/backgrounds`, `ancienne-version.html`, `exercice.html`, `progress.html`, ainsi que leurs scripts historiques sont conservés.

**Attention :** un test sur localhost et la même application sur GitHub Pages n'utilisent pas le même stockage local ; exporter le carnet avant de changer de domaine ou d'appareil.

## Tests réalisés

- Syntaxe JavaScript : `node --check zenus.js` et `node --check service-worker.js`.
- Parcours fonctionnel du dashboard avec Playwright/Chromium, à **320, 390, 768, 1280 et 1672 px** : modes, ambiance, réglages, lecture/pause/reprise (contexte audio simulé), favoris, ajout de nuit, graphique, immersion et absence de débordement horizontal. Aucune erreur JavaScript détectée.
- Les cinq fichiers audio Ogg ont été inspectés avec `ffprobe` : **60 s chacun**.
- Les fichiers référencés par le service worker ont été contrôlés dans l'archive.
- **Limite de test :** le navigateur automatisé de cette session bloque l'accès direct au serveur local. Les écrans ont été testés avec le HTML/CSS/JS chargé en mémoire et des pistes audio simulées. La qualité audio et le comportement écran verrouillé **restent à valider sur le téléphone réel**, ainsi que la publication GitHub Pages.

## Git et publication

Le ZIP final contient l'intégralité du dossier `relaxation-app`, dont `.git`, la branche `main`, l'historique et le remote `origin` déjà présent. Un nouveau commit de refonte V0.3 est créé localement, **aucun push n'est effectué**.

Dans VS Code, ouvrir le dossier décompressé `relaxation-app`, lancer Live Server pour la validation, puis effectuer `git status`, `git log -1 --oneline`, enfin `git push origin main` lorsque tout est validé. Si le distant a changé, ne pas utiliser `--force` : comparer ou intégrer les mises à jour d'abord.

## Évolutions non incluses

- Connexion à Santé Connect, synchronisation multi-appareils, réveil automatique.
- Remplacement des pistes originales de V0.2 par de véritables enregistrements licenciés.
- Audit Android de la lecture lorsque l'écran est verrouillé.
