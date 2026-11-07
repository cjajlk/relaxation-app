# zenus — Première évolution de Relaxation App

Version préparée le 7 novembre 2026 pour `cjajlk/relaxation-app`.

## Contenu de la mise à jour

- Nouveau nom **zenus** (avec un **z minuscule**) dans le titre, l'interface et le manifeste.
- Nouvelle interface mobile et PC, thème bleu nuit/violet, compatible avec les **quatre paysages existants** (`assets/backgrounds`).
- Deux modes : **Détente** et **Sommeil**.
- **Mélangeur sonore** Web Audio : pluie, vagues, feu de cheminée, brise et nappe musicale originale, avec volumes indépendants.
- **Minuterie** (libre / 15 / 30 / 45 / 60 min) et baisse graduelle du volume durant les 90 dernières secondes.
- Lecture, pause, reprise, arrêt d'une séance.
- **Respiration guidée**, dont 4-7-8 dans le bon ordre : inspirer 4 s, retenir 7 s, expirer 8 s ; voix de synthèse facultative.
- **Favoris** pour les mélanges sonores et les décors, sauvegardés localement.
- **Carnet de sommeil** manuel : heure du coucher, réveil, latence estimée, réveils, qualité, notes, historique et moyennes.
- Lien vers les anciens exercices de yoga et méditation, et vers les anciennes statistiques.
- Ancienne interface mise à l'abri dans `ancienne-version.html`.
- Service worker pour la mise en cache hors ligne des ressources du dépôt (à vérifier une fois publié).

## Déploiement dans GitHub

**Important : le dépôt en ligne n'a PAS été modifié automatiquement.** Les tentatives d'écriture ont été refusées (HTTP 403, « Resource not accessible by integration »). Ce ZIP est une mise à jour prête à installer, pas un déploiement déjà réalisé.

1. Faire une sauvegarde du dépôt `cjajlk/relaxation-app`, branche `main`.
2. Décompresser le ZIP **sur l'ordinateur**.
3. Copier les fichiers de ce ZIP **à la racine du dépôt**, en remplaçant uniquement les fichiers portant les mêmes noms (`index.html`, `exercice.html`, `progress.html`). Ne pas envoyer le ZIP tel quel à GitHub.
4. **Conserver sans modifier** `assets/`, `sounds/`, `script.js`, `styles.css`, `exercice.js`, `progress.js` : ils sont nécessaires à la nouvelle interface ou à la version historique.
5. Committer et pousser les changements sur `main` (ou créer une pull request après vérification).
6. Vérifier `https://cjajlk.github.io/relaxation-app/` et les fonctions sur un vrai téléphone Android.

## Données utilisateur

- Les anciennes statistiques utilisent les clés locales `totalTimeSeconds`, `sessionsCount`, `sessionDates`, `badges` et `badgeDates` et restent conservées.
- Les nouvelles séances de plus de 30 secondes enrichissent ces statistiques, sans effacer les anciennes valeurs.
- Les nouveaux favoris utilisent `zenus.presets.v1`.
- Les nuits saisies utilisent `zenus.sleep.v1`.
- Tout reste dans le stockage local du **même navigateur et de la même origine** (`cjajlk.github.io/relaxation-app/`). Il n'existe pas de synchronisation entre appareils.

## Limites et vérifications à faire sur téléphone

- Sons générés, pas des enregistrements naturalistes. Ils pourront être remplacés par des ambiances de qualité supérieure lors d'une version ultérieure.
- Le comportement de lecture avec écran éteint varie suivant Android et le navigateur et n'est pas garanti.
- Aucun connecteur Santé Connect : la saisie du sommeil est manuelle en V0.1.
- Les anciennes pages « Mes séances » chargent Chart.js par CDN : leur graphique peut demander Internet. Le service worker précharge uniquement les fichiers hébergés dans le dépôt.
- Les décors de l'ancien dépôt doivent être présents au bon chemin pour être visibles ; ils ne sont pas inclus dans ce pack.
- Le suivi du sommeil est déclaratif et ne constitue pas une mesure médicale.

## Contrôles réalisés hors publication

- Analyse syntaxique `node --check` sur `zenus.js` et `service-worker.js`.
- Tests d'interaction Chromium (Playwright) aux résolutions **320, 390, 1280 px** : navigation, choix de mode, changements de décor, son, pause/reprise, respiration, favoris, saisie/suppression de nuit et écriture de statistiques héritées.
- Aucun débordement horizontal observé et aucune erreur JavaScript lors de ces scénarios.
- Ces tests ont été effectués dans un document local injecté : ils **ne constituent pas** une vérification du site GitHub Pages déployé ni une validation audio subjective.
