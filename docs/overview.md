# Vue d'ensemble fonctionnelle

Ce document complète le README en décrivant les parcours utilisateurs et les cas d'usage principaux de EduShare.

## Rôles

- **Enseignant** : crée des classes, partage des documents, anime les échanges.
- **Élève** : rejoint des classes, consulte les ressources, commente et interagit.

## Parcours clés

1. **Création de classe**
   - L'enseignant se connecte.
   - Il crée une nouvelle classe en renseignant nom, matière, niveau.
   - Un code unique est généré et partagé aux élèves.

2. **Rejoindre une classe**
   - L'élève se connecte puis saisit un code de classe.
   - Après validation, il rejoint automatiquement la classe et voit les ressources associées.

3. **Partage de document**
   - L'enseignant importe un fichier (PDF, présentation, image, vidéo...).
   - Le document est stocké (local ou S3/MinIO) et référencé dans la base.
   - Il peut être partagé avec une classe entière ou des élèves spécifiques.
   - Les élèves reçoivent une notification temps réel et, si configuré, un email.

4. **Consultation et interaction**
   - Les élèves accèdent à la page "Documents" pour consulter les ressources.
   - Ils peuvent commenter les documents selon leurs droits.
   - Les échanges de classe se font via la page "Classe" (messages, notifications Socket.io).

Ce fichier peut être enrichi au fur et à mesure avec des maquettes, des captures d'écran et des scénarios plus détaillés.