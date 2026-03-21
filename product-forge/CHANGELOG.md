# Product Forge — Changelog

## Cycle 1 — Fondations
- Création de la structure de base du projet
- Page d'accueil avec bookmarklet AliExpress → Product Forge
- Scraping basique des données produit AliExpress

## Cycle 2 — Scraping & données produit
- Intégration Apify pour le scraping AliExpress (acteur dédié)
- Extraction titre, prix, images, description, variantes
- Gestion des erreurs réseau et retries automatiques

## Cycle 3 — Génération IA (Claude)
- Intégration API Claude (Anthropic) pour la génération de fiches
- Mode gratuit avec copier/coller du prompt vers claude.ai
- Prompt optimisé SEO Etsy : titre, description, 13 tags, prix
- Parsing robuste du JSON retourné par Claude

## Cycle 4 — Interface & UX
- Design complet dark mode premium (palette or/noir)
- Header sticky avec statut en temps réel
- Panneau Settings pour clés API (Claude, Apify)
- Système de toasts pour les notifications
- Affichage galerie d'images du produit

## Cycle 5 — Fiches & sauvegarde
- Panneau "Mes fiches" avec sauvegarde localStorage
- Brouillons automatiques et fiches finalisées
- Export des fiches au format prêt pour Etsy
- Copie rapide titre, description, tags individuellement
- Calcul de prix avec marge configurable

## Cycle 6 — Batch & optimisations
- Mode batch : scraping de plusieurs URLs en une fois
- Barre de progression batch avec statut par produit
- Panneau latéral dédié au batch
- Optimisation des performances et gestion mémoire

## Cycle 7 — Onboarding & guide
- Guide d'onboarding interactif à la première visite
- 3 étapes expliquées : bookmarklet, AliExpress, génération
- Bouton ❓ pour revoir le guide à tout moment
- Noms de fichiers SEO pour les images (renommage intelligent)
- Prévisualisation de la fiche Etsy (mockup visuel)

## Cycle 8 — PWA & polish final
- Ajout du manifest PWA (installable sur mobile/desktop)
- Favicon SVG ⚒ et meta tags PWA complets
- Meta description SEO pour le référencement du site
- Tous les messages d'erreur vérifiés et traduits en français
- Footer discret avec version et crédit
- Apple mobile web app support
- Nettoyage et polish final de l'interface
