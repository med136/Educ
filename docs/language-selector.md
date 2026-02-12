# Sélecteur de langue - Documentation

## Fonctionnalités

Le sélecteur de langue permet aux utilisateurs de basculer entre le français et l'arabe dans toute l'application EduShare.

## Implémentation

### Composant principal
- **Fichier** : `frontend/src/components/common/LanguageSelector.tsx`
- **Utilisation** : Intégré dans `PublicLayout.tsx` et `Layout.tsx`

### Fonctionnalités clés

1. **Basculement de langue** : Permet de passer du français à l'arabe et vice-versa
2. **Support RTL** : Applique automatiquement la direction RTL (Right-to-Left) pour l'arabe
3. **Persistance** : Sauvegarde la préférence de langue dans localStorage
4. **Interface intuitive** : Menu déroulant avec drapeaux et noms de langues
5. **Accessibilité** : Support complet des attributs ARIA

### Configuration

#### Langues supportées
- **Français (fr)** : 🇫🇷 Français
- **Arabe (ar)** : 🇸🇦 العربية

#### Fichiers de traduction
- `frontend/src/locales/fr/translation.json` - Traductions françaises
- `frontend/src/locales/ar/translation.json` - Traductions arabes

### Personnalisation

#### Ajouter une nouvelle langue
1. Ajouter le fichier de traduction dans `src/locales/`
2. Mettre à jour le tableau `languages` dans `LanguageSelector.tsx`
3. Mettre à jour `resources` dans `i18n.ts`

#### Modifier le style
Le composant utilise les classes Tailwind CSS. Les classes principales sont :
- `.relative` - Positionnement du menu déroulant
- `.inline-flex h-9` - Style du bouton principal
- `.absolute right-0 mt-1 w-32` - Positionnement du menu

### Comportement RTL

Lors du passage à l'arabe :
1. La direction du document (`document.documentElement.dir`) est changée en `rtl`
2. La langue du document (`document.documentElement.lang`) est changée en `ar`
3. La police arabe (`Cairo`, `Noto Kufi Arabic`) est automatiquement appliquée via CSS

### Dépannage

#### Problèmes courants
1. **La direction RTL ne s'applique pas** : Vérifier que `index.css` contient les styles pour `html[dir="rtl"]`
2. **Les traductions ne s'affichent pas** : Vérifier que les clés existent dans les deux fichiers de traduction
3. **La langue ne se sauvegarde pas** : Vérifier que localStorage est activé dans le navigateur

#### Débogage
Pour vérifier la langue actuelle :
```javascript
console.log('Langue actuelle:', i18n.language)
console.log('Direction:', document.documentElement.dir)
```

### Notes techniques

- Le composant utilise `useTranslation` de `react-i18next`
- La détection de langue se fait via `localStorage` puis `navigator.language`
- Le rechargement de la page est nécessaire pour appliquer correctement la direction RTL
- Le composant est entièrement TypeScript et accessible

## Capture d'écran

![Sélecteur de langue](./images/language-selector.png)

*Le sélecteur de langue dans l'en-tête de l'application*