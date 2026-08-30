# Refonte Premium des Documents et de l'Éditeur

L'objectif de cette phase est de repenser totalement la façon dont les documents sont affichés et édités, suite à vos retours et à l'image de référence fournie (icônes de fichiers style macOS/Apple).

## User Review Required

> [!IMPORTANT]
> Avant de commencer à coder cette refonte majeure, j'aimerais que vous validiez l'approche ci-dessous. Est-ce que cette nouvelle direction correspond parfaitement à ce que vous aviez en tête avec l'image fournie ?

## Proposed Changes

---

# Refonte Premium des Documents (Mode "Focus In-Canvas")

C'est une excellente idée ! Ouvrir une fenêtre casse l'immersion spatiale. Le document doit rester sur le bureau (le canvas). Quand on veut l'éditer, on se concentre dessus : la feuille s'agrandit, la caméra zoome dessus, et tout le reste (autres nœuds, branches, boutons) disparaît temporairement.

## User Review Required

> [!IMPORTANT]
> Voici le plan pour réaliser cette transition fluide sans ouvrir de nouvelle fenêtre. Est-ce que cela correspond parfaitement à votre vision ?

## Proposed Changes

---

### [1. Disparition de la Fenêtre Modale]

On supprime complètement le système de "fenêtre qui s'ouvre par-dessus".

#### [DELETE] `global-document-editor.tsx`
- Ce fichier ne sera plus utilisé. Le document sera édité directement à sa place sur le canvas.

#### [MODIFY] [page.tsx](file:///c:/Users/ezmp/nightcode/packages/web/src/app/page.tsx)
- Retrait de `GlobalDocumentEditor`.
- La barre de chat VercelV0Chat reste toujours en bas (`z-20`).

---

### [2. Le Nœud Document : De l'Aperçu à l'Éditeur]

C'est le nœud lui-même sur le canvas qui va se transformer de façon fluide.

#### [MODIFY] [document-node.tsx](file:///c:/Users/ezmp/nightcode/packages/web/src/components/ui/document-node.tsx)
- **Au repos (Aperçu)** : La feuille fait `320x450px`, elle affiche le titre et l'extrait de texte.
- **Au clic (Édition / Focus)** : La feuille s'agrandit de manière fluide pour atteindre sa taille réelle de travail (ex: `800x1050px`), et révèle l'éditeur complet (la barre d'outils, le titre modifiable, et BlockNote).
- On intègre la logique de l'éditeur directement à l'intérieur du nœud pour qu'il soit modifiable *in-place*.

---

### [3. Le Mode Focus (Canvas)]

Quand un document passe en mode édition, le reste du monde doit s'effacer.

#### [MODIFY] [canvas.tsx](file:///c:/Users/ezmp/nightcode/packages/web/src/components/ui/canvas.tsx) & [CanvasContext.tsx](file:///c:/Users/ezmp/nightcode/packages/web/src/contexts/CanvasContext.tsx)
- **Fondu des autres éléments** : Si `activeDocumentId` est défini, tous les *autres* nœuds et les lignes (edges) deviennent transparents (`opacity-0`) et inactifs.
- **Masquage de l'UI** : Le bouton "Organiser" et autres contrôles du canvas disparaissent.
- **Cadrage automatique** : La caméra de React Flow va se déplacer et zoomer automatiquement et de façon fluide sur le document pour qu'il remplisse parfaitement l'écran au-dessus de la chat bar.

## Verification Plan

### Manual Verification
- Clic sur le document : pas de nouvelle fenêtre. La feuille s'agrandit doucement sur le canvas.
- Les autres nœuds et les branches disparaissent en fondu.
- La caméra se centre sur le document.
- Pour quitter le mode édition, un bouton "Fermer" sur le document (ou un clic en dehors) réduit la feuille et fait réapparaître le reste du canvas.

## Verification Plan

### Manual Verification
- Côté canvas : l'icône est une véritable feuille de papier blanche (style note).
- Au clic : l'éditeur s'ouvre comme MS Word (fond gris, page blanche centrée).
- **Le Chat en bas** : Le panneau de chat reste visible par-dessus l'éditeur et peut être utilisé pour modifier le texte.
