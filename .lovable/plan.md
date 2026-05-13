## Objectif

Renforcer la mise en avant du « Made in France » sur la page **Blouse officielle** (`/blouse-officielle`) avec un drapeau français 🇫🇷 et la mention « Fabrication française » à plusieurs endroits clés.

## Modifications dans `src/routes/blouse-officielle.tsx`

### 1. Badge drapeau sur la galerie (au-dessus de l'image principale)
Ajouter un badge superposé en haut à gauche de l'image principale :
- Drapeau FR (3 bandes bleu/blanc/rouge en CSS pur, pas d'emoji pour un rendu net) + texte « Fabriqué en France »
- Style : pill blanc avec ombre légère, position `absolute top-3 left-3`

### 2. Badge à côté du titre
Ajouter une seconde pastille à côté du badge « Tenue officielle » existant, ligne 170 :
- Mini drapeau + « Fabrication française »
- Même style que la pastille existante (rounded-full, fond clair)

### 3. Renforcement du paragraphe descriptif (ligne 185-190)
Mettre en gras la mention finale « **Confectionnée dans nos ateliers français** 🇫🇷 » avec un petit drapeau inline.

### 4. Bloc « Trust » en bas (ligne 287-291)
Remplacer la simple ligne « Fabrication française » par une mise en valeur :
- Icône drapeau FR (au lieu du `Check`)
- Texte en `font-semibold`
- Fond légèrement teinté pour faire ressortir cette ligne par rapport aux autres bullets

### 5. Nouveau bandeau « Made in France » dans le bloc Description (après ligne 313)
Ajouter une bande horizontale dans le bloc `bg-secondary` :
- Grand drapeau français à gauche
- Titre « Fabriqué en France 🇫🇷 » + sous-texte « Confection 100% française dans nos ateliers, du tissu à la finition. »
- Border-top pour séparer du contenu existant

## Composant drapeau

Créer un petit composant inline `<FrenchFlag />` réutilisable dans le fichier (ou inline avec 3 `<span>` colorés) :
```tsx
<span className="inline-flex h-3 w-5 overflow-hidden rounded-sm border border-border">
  <span className="flex-1 bg-[#0055A4]" />
  <span className="flex-1 bg-white" />
  <span className="flex-1 bg-[#EF4135]" />
</span>
```
Tailles variables (h-3 / h-4 / h-6) selon le contexte.

## Hors scope

- Pas de changement sur les autres pages (maternelle, college, lycée, index). L'utilisateur a précisé « partout sur la blouse » → uniquement la page produit.
- Aucune modification backend.