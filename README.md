# myTasks

Application de gestion de tâches (TODO list) avec listes partageables. Backend Node.js + Express, base de données SQLite, interface web servie par le serveur.

## Fonctionnalités

- Créer / supprimer des listes de tâches
- Ajouter / cocher / supprimer des tâches
- Partager une liste via un **lien secret** (le token de partage) — toute personne ayant le lien peut voir et modifier la liste
- Persistance en base SQLite locale

## Prérequis

- [Node.js](https://nodejs.org/) 18+ (testé sur v23)

## Installation

```bash
npm install
```

## Lancer le serveur

```bash
npm start
```

Puis ouvrir http://localhost:3000 dans le navigateur.

Le port peut être changé via la variable d'environnement `PORT` :

```bash
PORT=8080 npm start
```

## Partage

Chaque liste a un lien de partage unique de la forme `http://localhost:3000/#<token>`.
Le bouton **🔗 Partager** copie ce lien. Comme le serveur tourne en local, le partage
fonctionne pour les appareils sur le même réseau (remplacer `localhost` par l'IP du PC).

## Structure

| Fichier | Rôle |
|---|---|
| `server.js` | Serveur Express + routes API REST |
| `db.js` | Connexion SQLite + schéma |
| `public/` | Interface web (HTML/CSS/JS) |
| `tasks.db` | Base SQLite (créée au démarrage, non versionnée) |

## API

| Méthode | Route | Description |
|---|---|---|
| GET | `/api/lists` | Lister toutes les listes |
| POST | `/api/lists` | Créer une liste `{name}` |
| GET | `/api/lists/:token` | Détail d'une liste + ses tâches |
| DELETE | `/api/lists/:token` | Supprimer une liste |
| POST | `/api/lists/:token/tasks` | Ajouter une tâche `{text}` |
| PATCH | `/api/lists/:token/tasks/:id` | Modifier `{done?, text?}` |
| DELETE | `/api/lists/:token/tasks/:id` | Supprimer une tâche |
