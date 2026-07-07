# Projet Phoenix — V1

Petite application web mobile pour suivre une transformation physique sur 90 jours.

## Fonctionnalités

- Tableau de bord mobile
- Poids actuel
- Objectif de poids
- Progression vers l’objectif
- Cases quotidiennes :
  - 2 L d’eau
  - 8 000 pas
  - séance de sport
  - calories approximativement respectées
  - pas de soda
  - sommeil suffisant
- Saisie du poids
- Saisie du tour de taille
- Journal rapide du ressenti
- Historique
- Graphique basique sans librairie externe
- Export JSON
- Export CSV
- Import JSON
- Données stockées localement dans le navigateur

## Lancement simple

Tu peux ouvrir `index.html` directement dans un navigateur pour tester.

Attention : en ouverture directe `file://`, le stockage local fonctionne, mais l’installation comme vraie PWA peut être limitée selon le navigateur.

## Lancement propre en local

Depuis le dossier du projet :

```bash
python3 -m http.server 8080
```

Puis ouvrir :

```txt
http://localhost:8080
```

Depuis un téléphone sur le même réseau :

```txt
http://IP_DU_PC:8080
```

Pour une installation PWA complète sur téléphone, le navigateur peut exiger HTTPS. En local, le plus propre sera plus tard de servir l’application via Caddy/Nginx avec certificat local ou via un nom local.

## Sauvegarde

Utilise régulièrement :

- `Exporter JSON` pour sauvegarder/restaurer tout le projet
- `Exporter CSV` pour lecture dans Excel/LibreOffice

## Données

Les données sont stockées dans `localStorage` sous la clé :

```txt
projetPhoenixV1
```

Aucune donnée n’est envoyée sur Internet.
