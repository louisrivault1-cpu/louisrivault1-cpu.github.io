# Product Forge

Transforme n'importe quel produit AliExpress en fiche Etsy professionnelle optimisée SEO grâce à Claude AI. Titres, descriptions, tags et prix calculés automatiquement. 100% gratuit.

![Product Forge Screenshot](screenshot-placeholder.png)

## Comment l'utiliser

### Etape 1 — Connecte-toi
Ouvre Product Forge et connecte-toi avec ton compte Google. Tes tokens API et fiches produit sont sauvegardés dans le cloud.

### Etape 2 — Scrape un produit
Colle un lien AliExpress dans la barre de recherche. Product Forge extrait automatiquement le titre, le prix, les images, les specs et les variantes via Apify. Tu peux aussi utiliser le bookmarklet directement depuis AliExpress.

### Etape 3 — Genere ta fiche Etsy
Choisis ta catégorie, clique sur "Generer avec Claude" et Product Forge crée automatiquement un titre SEO (140 car.), une description vendeuse, 13 tags optimisés, des noms de fichiers SEO pour les images, et un prix calculé avec ta marge souhaitée. Exporte le tout en JSON, CSV, ou copie directement dans Etsy.

## Configuration Apify

Product Forge utilise Apify pour scraper les produits AliExpress. Pour configurer :

1. Crée un compte gratuit sur [apify.com](https://apify.com)
2. Copie ton **API Token** depuis les Settings de ton compte Apify
3. Colle-le dans les Parametres de Product Forge (icone engrenage)
4. L'acteur par defaut est `painless_rachis/product-forge-scraper` — tu peux le remplacer par ton propre acteur

### Mode API Claude (optionnel)

Pour la generation automatique (sans copier/coller le prompt) :

1. Recupere une cle API sur [console.anthropic.com](https://console.anthropic.com)
2. Colle-la dans les Parametres > Cle API Claude
3. Selectionne le mode "API Anthropic" dans les parametres

Le mode gratuit fonctionne aussi : Product Forge genere le prompt et tu le colles dans claude.ai.

## Fonctionnalites

- Scraping AliExpress automatique via Apify (ou bookmarklet)
- Generation IA de fiches Etsy via Claude (API ou mode gratuit)
- Titres SEO optimises (140 caracteres max)
- 13 tags Etsy optimises par fiche
- Descriptions vendeuses avec storytelling
- Calculateur de prix avec marge et frais
- Alt-text SEO pour chaque image
- Noms de fichiers SEO pour les images
- Mode batch (plusieurs URLs en une fois)
- Sauvegarde cloud via Firebase
- Export JSON, CSV, copie directe
- Preview Etsy en temps reel
- Responsive (desktop, tablette, mobile)
- PWA installable

## Stack technique

- HTML/CSS/JS vanilla (zero dependance frontend)
- Firebase Auth + Firestore (authentification et cloud sync)
- API Apify (scraping AliExpress)
- API Claude / Anthropic (generation IA)
- PWA avec manifest.json

## Licence

MIT — Louis Rivault, 2025-2026
