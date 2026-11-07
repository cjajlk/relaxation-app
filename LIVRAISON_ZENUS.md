# zenus — Livraison complète V0.2 premium

**7 novembre 2026.** Projet d'origine : dossier `relaxation-app` fourni par CJ, y compris historique `.git`.

## Améliorations intégrées

1. Nom officiel **zenus**, toujours avec un z minuscule.
2. Décors 2D de votre projet initial rehaussés (8 versions WebP optimisées, jour/nuit) : forêt, plage, pluie à la fenêtre, cheminée. Les 4 PNG originaux ne sont pas supprimés.
3. Décors plus hauts, scène principale immersive plein écran, sélecteur illustré de paysages, mouvements lents, effets discrets (pluie / lumière / lucioles) et bouton pour désactiver les animations.
4. Pistes sonores originales en fichiers Ogg Vorbis : 60 secondes par ambiance, 5 canaux indépendants (pluie, vagues, feu, brise, musique), avec bouclage préparé, au lieu de bruits de 4 secondes synthétisés en direct.
5. Ambiances préréglées : Pluie du soir, Rivage calme, Cocooning, Sous-bois ; volume indépendant par piste et volume général.
6. Minuterie libre / 5 / 10 / 15 / 30 / 45 / 60 / 90 / 120 min, fondu en fin de séance, pause / reprise / arrêt.
7. Conservation des modes Détente et Sommeil, respiration guidée 4-7-8 correctement ordonnée, voix facultative.
8. Carnet manuel du sommeil : courbe sur 7 nuits saisies, export JSON et réimport non destructif des données.
9. Service worker actualisé pour mettre en cache les fichiers Ogg et WebP, avec prise en charge des requêtes audio « Range » en mode hors ligne.
10. Préservation de l'ancienne application, des exercices, des statistiques héritées et des données locales.

## Fichiers conservés

- Le dossier **`.git/`** complet avec `origin` existant et son historique.
- `assets/backgrounds/` : images PNG d'origine intactes.
- `ancienne-version.html`, `exercice.html`, `progress.html`, et les anciennes ressources : aucune suppression.
- Le dossier `sounds/` comprend les nouvelles pistes originales, directement intégrées au projet.

## Tests locaux effectués

- Analyse de syntaxe JavaScript (`node --check`) : `zenus.js`, `service-worker.js`.
- `ffprobe` : les 5 sons Ogg ont une durée de 60 s et sont reconnus par le décodeur.
- Chromium headless (interface + fichiers audio injectés localement) sur **320, 390, 1280 px** : navigation, scènes, bascule jour/nuit, contrôle des volumes, presets, ambiance sonore, lecture/pause/reprise/arrêt, respiration, immersion, carnet et export JSON, favori : sans erreur JavaScript ni débordement horizontal.
- Tests effectués en simulation Chromium, **pas sur un véritable appareil Android ni sur GitHub Pages**. Évaluation musicale subjective à réaliser par l'utilisateur.

## Publication

**Aucun commit poussé en ligne depuis ce travail.** La connexion GitHub accessible à l'assistant précédemment consultée refusait les écritures (403). Les fichiers et le commit sont disponibles localement dans le dossier ZIP.

Sur Windows : décompressez ce ZIP, ouvrez **le dossier `relaxation-app`** dans VS Code, essayez avec Live Server, puis `git push origin main` depuis le terminal VS Code (ou la fonction Synchroniser les modifications). Vérifiez ensuite l'adresse `https://cjajlk.github.io/relaxation-app/`.

Ne forcez pas un push si le dépôt distant a changé. Ne remplacez pas le dossier `.git` d'un autre clone par copie partielle.

## Limites actuelles

- La lecture de médias écran éteint et l'installation hors ligne nécessitent une validation en conditions réelles sur smartphone.
- Les sons sont des compositions/ambiances **synthétiques originales**, pas des enregistrements de terrain ; ils demandent une écoute subjective et pourront être remplacés par de futurs enregistrements licenciés.
- Le suivi reste manuel et local, sans Santé Connect ni synchronisation multi-appareils.
- Pour bénéficier du hors ligne après installation sur GitHub Pages, une première connexion et un chargement complet des ressources sont nécessaires.
