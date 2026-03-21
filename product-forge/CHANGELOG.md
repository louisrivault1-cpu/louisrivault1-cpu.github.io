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
- Favicon SVG et meta tags PWA complets
- Meta description SEO pour le référencement du site
- Messages d'erreur traduits en français
- Footer discret avec version et crédit
- Apple mobile web app support

## Cycle 9 — Catégories & pricing avancé
- Sélecteur de catégories Etsy (bijoux, déco, mode, etc.)
- Prompts Claude adaptés par catégorie
- Calculateur de prix intelligent avec marge, shipping, frais Etsy
- Slider de marge interactif avec affichage profit en temps réel
- Grille de calcul responsive (tablette/mobile)

## Cycle 10 — Profils & tokens sécurisés
- Système de profils utilisateurs (multi-boutiques)
- Login par prénom/pseudo avec avatar généré
- Stockage séparé des tokens et settings par profil
- Migration automatique des anciens settings vers profils
- Badge profil dans le header avec menu logout
- Test des tokens API (Apify, Claude) avec statut visuel

## Cycle 11 — Firebase Auth & Cloud Sync
- Authentification Google via Firebase Auth
- Écran de connexion dédié au lancement
- Sauvegarde automatique des tokens dans Firestore
- Synchronisation cloud des fiches produit (brouillons)
- Indicateur de sync visuel dans le header
- Suppression cloud synchronisée des brouillons

## Cycle 12 — Responsive & Mobile
- Refonte responsive complète (desktop, tablette, mobile)
- Breakpoints 1024px, 768px, 480px avec adaptations spécifiques
- Grilles adaptatives pour images, calculs, boutons
- Modals plein écran sur mobile (bottom-sheet style)
- Touch targets minimum 44px pour accessibilité
- Panneau brouillons plein écran sur mobile
- Polices input 16px pour éviter le zoom iOS

## Cycle 13 — Alt-text, meta SEO & export avancé
- Génération automatique d'alt-text SEO par image
- Meta description Etsy générée par Claude
- Key features extraites et affichées (bullets)
- Export CSV des fiches produit
- Export JSON complet avec toutes les données
- Dropdown d'export multi-format
- Compteur de caractères meta description (160 max)

## Cycle 14 — Bookmarklet fallback & robustesse
- Détection intelligente des erreurs de scraping
- Bannière fallback bookmarklet si Apify échoue
- Messages d'erreur contextuels (401, 402, 408, 429)
- Timeouts progressifs : 30s → 45s → 60s
- Retry automatique avec badge tentative X/3
- Messages de progression pendant le scraping
- Support bookmarklet direct (forgeFromBookmarklet)

## Cycle 15 — Performance & polish
- Skeleton loaders animés (remplacent le spinner classique)
- Barre de progression animée pendant scraping et génération
- Progress bar avec mode indéterminé et mode pourcentage
- Debounce sur tous les inputs (recherche, titre, description, prix)
- Lazy loading confirmé sur toutes les images dynamiques
- Animations fade-in / slide-up à l'arrivée des données
- Scale on click sur tous les boutons (feedback tactile)
- Toast animations améliorées (cubic-bezier entrée/sortie)
- Polices Apple system cohérentes partout
- Cohérence couleurs/espacements (#0a0a0f fond, #c8a961 accents)

## Cycle 16 — Tests & documentation
- README.md complet avec guide d'utilisation en 3 étapes
- CHANGELOG.md résumant les 16 cycles de développement
- TESTS.md documentant tous les tests effectués
- Footer mis à jour : Product Forge v3.0
- Vérification du flow complet via navigateur
