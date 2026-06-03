YouTube / barre de lecture / fumée audio
=======================================

YouTube peut afficher Erreur 153 si la page est ouverte directement en file://.
Lance plutôt le projet en localhost.

Windows :
1. Dézippe le dossier.
2. Double-clique sur LANCER_LOCALHOST.bat.
3. Ouvre http://localhost:8080/ si la page ne s'ouvre pas seule.

Linux/Mac :
1. Dans le dossier : ./LANCER_LOCALHOST.sh
2. Ouvre http://localhost:8080/

Nouveautés :
- La barre de lecture du bas contrôle le MP3 ou YouTube.
- Si YouTube est actif, la barre affiche le temps YouTube et permet lecture / pause / déplacement.
- Si un MP3 et YouTube sont actifs ensemble, la lecture, la pause et le déplacement sont envoyés aux deux pour les garder synchronisés.
- La touche Espace fait pause / lecture synchronisée.
- Le son YouTube peut piloter la fumée via le partage audio de l'onglet.

Pour que le son YouTube fasse de la fumée :
1. Mets un lien YouTube puis clique sur Fond YouTube.
2. Le navigateur demande un partage d'écran / onglet.
3. Choisis cet onglet ou l'onglet du projet.
4. Active bien l'option audio de l'onglet / Share tab audio.

Limite navigateur :
Le son d'une iframe YouTube ne peut pas être lu directement par Web Audio à cause des protections du navigateur.
La solution fiable est donc le partage audio de l'onglet, lancé automatiquement quand tu charges YouTube.


## Scène réactive aux basses

Cette version ajoute le même système que belaq-smoke-music-visualizer-v5 :
- secousse de la scène selon les basses,
- zoom de la scène selon les basses,
- rotation légère selon les basses,
- blur dynamique du fond image ou YouTube,
- parallaxe du fond.

Les réglages sont dans le panneau :
Secousse basses scène, Zoom basses scène, Rotation basses scène, Blur fond ↔ basses, Parallaxe fond basses.
Ils sont sauvegardés automatiquement en localStorage.
