# zenus · détente & sommeil

Application Web de relaxation et de suivi personnel du sommeil, signée CJAJLK.

**Projet complet, avec son dossier `.git` et ses fichiers historiques préservés.**

## Lancer sur ordinateur

Dans VS Code, ouvrez ce dossier puis lancez **Live Server** sur `index.html` (ou exécutez `python -m http.server 5500`).
Le navigateur charge ensuite les cinq sons Ogg et les paysages WebP depuis ce dossier.

## Publier avec le dépôt Git déjà fourni

Ce dossier contient son `.git` initial, sa branche `main` et son remote `origin` pointant vers `https://github.com/cjajlk/relaxation-app.git`.
Après vérification sur votre PC :

```bash
git status
git log -1 --oneline
git push origin main
```

Le commit de cette livraison a été **créé localement**, mais **aucun push en ligne n'a été effectué**.
Ne copiez pas un second dossier `.git` sur un autre dépôt : décompressez le projet complet dans un nouvel emplacement et travaillez dans celui-ci. Si Git annonce que le dépôt distant a changé, ne forcez pas le push : récupérez et réconciliez les modifications avant de publier.

## Fonctions

- Deux modes : **Détente** et **Sommeil** (scènes nocturnes)
- Quatre univers 2D, optimisés WebP, avec animations lentes désactivables
- Affichage immersif plein écran de la scène (touche `Échap` pour quitter)
- Mélangeur 5 pistes locales Ogg : pluie, vagues, feu, vent, musique ambient
- Quatre mélanges préconfigurés et volume général
- Lecture/pause/reprise, minuterie 5 à 120 min ou sans limite, fondu progressif
- Respiration guidée 4-4, 6-6 ou 4-7-8, voix système facultative
- Favoris d'ambiances locales
- Carnet manuel du sommeil et graphique des dernières nuits saisies
- Export / import JSON du carnet, sans effacer les nuits locales déjà enregistrées
- Ancienne version, yoga et statistiques conservés
- Service worker (fonctionnement hors ligne après installation et mise en cache)

## Sauvegarde et confidentialité

Aucun compte ni service tiers. Nuits, favoris et statistiques sont conservés via `localStorage` et restent liés au navigateur utilisé. `zenus.sleep.v1`, `zenus.presets.v1` et les anciennes clés de Relaxation sont conservées, sans migration destructive.
Exportez régulièrement votre carnet via **Mon sommeil → Exporter mon carnet**. Ne publiez pas vos fichiers d'export personnels sur GitHub.

## Vérifications conseillées sur téléphone

La lecture en arrière-plan, écran verrouillé, dépend du système et des restrictions d'économie d'énergie. Testez surtout sous Android avec votre navigateur habituel. Les effets 2D peuvent être coupés si vous préférez une consommation plus faible.

Les pistes de son de cette V0.2 sont des **ambiances numériques originales préparées hors ligne**, et non des enregistrements naturalistes. Les décors sources sont ceux de votre projet initial, retravaillés en variantes optimisées.

Le carnet de sommeil est déclaratif : il ne mesure pas médicalement les phases de sommeil. La connexion à une application de santé n'est pas incluse dans cette version.

Voir `LIVRAISON_ZENUS.md` pour les tests et les limites.

Les fichiers historiques `script.js`, `styles.css`, `exercice.js` et `progress.js`, absents du ZIP entrant, ont été récupérés depuis le premier commit Git. La page de progression utilise maintenant un graphique Canvas sans CDN, pour fonctionner hors ligne.
