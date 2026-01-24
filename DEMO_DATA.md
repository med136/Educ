# EduShare - Guide des Données de Démonstration

## 🎯 Vue d'ensemble

Ce projet comprend maintenant des données de démonstration pour vous permettre de tester rapidement toutes les fonctionnalités de la plateforme EduShare.

## 📊 Données Créées

### Utilisateurs (3)
- **Admin**: admin@edushare.com / password123
- **Enseignant 1**: marie.dubois@edushare.com / password123
- **Enseignant 2**: pierre.martin@edushare.com / password123

### Catégories (4)
- Mathématiques
- Sciences
- Technologie
- Méthodologie

### Tags (6)
- Python
- JavaScript
- Tutoriel
- Débutant
- Physique
- Théorie

### Articles (6)
1. **Introduction à Python pour les Débutants**
   - Auteur: Marie Dubois
   - Catégorie: Technologie
   - Tags: Python, Tutoriel
   - Temps de lecture: 5 min

2. **JavaScript ES6+ : Les Nouveautés Essentielles**
   - Auteur: Marie Dubois
   - Catégorie: Technologie
   - Tags: JavaScript
   - Temps de lecture: 7 min

3. **Les Lois de Newton : Fondements de la Mécanique**
   - Auteur: Pierre Martin
   - Catégorie: Sciences
   - Tags: Physique, Théorie
   - Temps de lecture: 6 min

4. **Les Équations du Second Degré : Guide Complet**
   - Auteur: Marie Dubois
   - Catégorie: Mathématiques
   - Temps de lecture: 8 min

5. **La Chimie Organique : Les Bases**
   - Auteur: Pierre Martin
   - Catégorie: Sciences
   - Temps de lecture: 10 min

6. **Méthodes de Travail Efficaces pour Réussir**
   - Auteur: Marie Dubois
   - Catégorie: Technologie
   - Temps de lecture: 4 min

### Commentaires (2)
- Commentaire approuvé sur l'article Python
- Commentaire en attente de modération sur l'article JavaScript

## 🚀 Comment Générer les Données

### Prérequis
- Base de données PostgreSQL configurée
- Variables d'environnement configurées dans `.env`

### Commandes

```bash
# 1. Aller dans le dossier backend
cd backend

# 2. Générer le client Prisma (si pas déjà fait)
npm run prisma:generate

# 3. Appliquer les migrations (si pas déjà fait)
npm run prisma:migrate

# 4. Exécuter le script de seed
npm run prisma:seed
```

Le script créera automatiquement toutes les données de démonstration. Si des données existent déjà avec les mêmes identifiants (email, slug), elles seront conservées (upsert).

## 🎨 Nouveau Design

### Page d'Accueil Moderne
La nouvelle page d'accueil (`/`) présente :

#### 1. **Hero Section**
- Titre accrocheur avec gradient
- Statistiques en temps réel (articles, utilisateurs, classes)
- Appels à l'action clairs (S'inscrire / Explorer)
- Animations fluides et effets de parallaxe

#### 2. **Section Fonctionnalités**
- 4 cartes de fonctionnalités avec icônes
- Animations au survol
- Design moderne avec gradients

#### 3. **Articles Populaires**
- Grille responsive (1/2/3 colonnes selon l'écran)
- Cartes avec images de couverture (Unsplash)
- Métadonnées : auteur, temps de lecture, commentaires
- Tags visuels
- États de chargement avec skeleton

#### 4. **Call-to-Action Final**
- Gradient coloré
- Boutons d'inscription/connexion
- Message motivant

### Palette de Couleurs
- **Primaire**: Bleu (#3B82F6) → Violet (#9333EA)
- **Secondaire**: Cyan, Vert, Ambre
- **Neutre**: Gris pour le texte et arrière-plans
- **Mode Sombre**: Support complet

### Design System
- **Espacements**: Cohérents avec Tailwind (4, 6, 8, 12, 16, 24)
- **Bordures**: Arrondies (rounded-xl, rounded-2xl)
- **Ombres**: Progressives (shadow-lg, shadow-xl, shadow-2xl)
- **Transitions**: Fluides (300ms)

## 🔧 Personnalisation

### Modifier les Données
Éditez `backend/prisma/seed.ts` pour :
- Ajouter plus d'utilisateurs
- Créer d'autres catégories/tags
- Personnaliser le contenu des articles
- Ajouter des classes virtuelles

### Images de Couverture
Les images utilisent Unsplash :
```typescript
coverImage: 'https://images.unsplash.com/photo-ID?w=800'
```

Remplacez `photo-ID` par l'ID de votre image Unsplash préférée.

## 📱 Responsive

Le design est entièrement responsive :
- **Mobile** (< 640px): Layout simple colonne
- **Tablet** (640px - 1024px): Grille 2 colonnes
- **Desktop** (> 1024px): Grille 3 colonnes

## 🎯 Prochaines Étapes

1. **Tester** la nouvelle interface
2. **Se connecter** avec un compte demo
3. **Explorer** le dashboard admin
4. **Créer** de nouveaux articles
5. **Modérer** les commentaires

## 🛠️ Support

Pour toute question ou problème :
1. Vérifiez que la base de données est bien configurée
2. Assurez-vous que toutes les migrations sont appliquées
3. Consultez les logs du serveur pour plus de détails

---

**EduShare** - Plateforme éducative moderne et professionnelle
