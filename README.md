# Bank API

API Node.js et TypeScript avec Express, MariaDB et Drizzle ORM.
Chaque utilisateur possède des comptes avec leur propre solde.

## Démarrage local

1. Installer les dépendances avec `npm ci` (Node.js 24).
2. Copier `.env.example` vers `.env` et configurer `DB_CONNECTION_STRING` et `JWT_KEY`.
3. Créer la base `ScammistanBank` dans MariaDB.
4. Sur une nouvelle base locale, exécuter `npm run db:push` pour créer le schéma.
5. Démarrer avec `npm run dev`.

Le fichier `.env` contient des secrets et doit rester ignoré par Git.

## Routes

| Méthode | Route | Description |
| --- | --- | --- |
| POST | `/api/auth/register` | Créer un utilisateur |
| POST | `/api/auth/login` | Se connecter |
| POST | `/api/auth/logout` | Se déconnecter |
| GET | `/api/accounts` | Lister ses comptes (JWT requis) |
| GET | `/ping` | Vérifier le serveur |
| GET | `/health` | Vérifier le serveur et MariaDB |

Swagger est disponible à `/swagger` en développement uniquement.

Après connexion, utiliser le champ `token` de la réponse pour lire ses comptes :

```sh
curl http://localhost:3001/api/accounts \
  -H "Authorization: Bearer YOUR_LOGIN_TOKEN"
```

Cette route vérifie la signature HS256 et l'expiration du JWT, puis utilise le
`userId` du token pour filtrer les comptes. Elle attend le header `Authorization`;
le cookie de connexion seul ne suffit pas. Une liste vide renvoie `[]`.
Un token absent, invalide ou expiré renvoie HTTP 401. La déconnexion supprime le
cookie, mais ne révoque pas un bearer token déjà émis : le client doit le supprimer.

Exécuter `npm test` pour compiler et tester la protection de cette route.

## Build et déploiement

```sh
npm run build
npm start
```

Le workflow GitHub Actions déploie les changements de la branche `etu` dans
`/var/www/bank` et démarre le service systemd `bank`. Consulter
[les instructions VPS](AI%20Convos/README%20VPS%20Deploy.md) pour la configuration initiale,
les secrets GitHub et les variables d'environnement du serveur.

Les migrations historiques restent dans `drizzle/`. Les migrations de base de
données ne sont jamais appliquées automatiquement par le workflow.
