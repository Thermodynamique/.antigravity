# Aquaterra E-commerce Prototype

Ce projet est un prototype ultra-détaillé et premium pour la marque **Aquaterra**, spécialisée dans l'hydratation durable et le lifestyle haut de gamme.

## Fonctionnalités & Micro-interactions
- **Micro-interaction 1** : Effet de vague (ripple) au clic sur les boutons avec micro-bounce.
- **Micro-interaction 2** : Formulaire de contact avec labels animés et validation visuelle.
- **Micro-interaction 3** : Cartes de produits avec effet de survol 3D (tilt) et révélation du CTA.
- **Micro-interaction 4** : Loader de page fluide (600ms) avec easing professionnel.
- **Micro-interaction 5** : Animations d'apparition (reveal) au défilement.

## Design
- **Typographies** : Outfit (Titres), Montserrat (Corps de texte).
- **Palette** : Emerald Green (#2a4d44), Earthy Gold (#d4a373), Pure White (#ffffff).

## Installation et Lancement

### Prérequis
- Node.js installé sur votre machine.

### Localement
1. Dans le terminal, rendez-vous dans le dossier du projet.
2. Installez les dépendances :
   ```bash
   npm install
   ```
3. Lancez le serveur :
   ```bash
   node server.js
   ```
4. Ouvrez votre navigateur à l'adresse : [http://localhost:3000](http://localhost:3000)

## Déploiement Public (Rapide)
Pour partager ce prototype via une URL publique instantanée, vous pouvez utiliser **ngrok** :
1. Installez ngrok.
2. Lancez le serveur localement (`node server.js`).
3. Dans un autre terminal, tapez :
   ```bash
   ngrok http 3000
   ```
4. Copiez l'URL `Forwarding` fournie (ex: `https://abcd-123.ngrok.io`).

## Structure des Fichiers
- `server.js` : Serveur Express minimaliste.
- `public/index.html` : Structure sémantique HTML5.
- `public/styles.css` : Design system et animations.
- `public/main.js` : Logique d'interaction modulaire.
- `public/assets/` : Emplacement pour les images (placeholders Unsplash utilisés actuellement).
