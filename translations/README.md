# Traductions manquantes — KILIMO Agritech

Le français (`fr`) est la langue de référence de l'application (`src/i18n/i18n.tsx`).
Les fichiers CSV de ce dossier listent, pour chaque langue encore incomplète, les
clés qui existent en français mais pas (encore) dans cette langue.

## État au 2026-07-27

| Langue | Clés manquantes / 387 |
|---|---|
| Swahili (`sw`) | 237 |
| Hausa (`ha`) | 230 |
| Yoruba (`yo`) | 239 |
| Arabe (`ar`) | 124 |
| Russe (`ru`) | 167 |
| Chinois simplifié (`zh`) | 167 |
| Allemand (`de`) | 167 |

Voir `i18n-missing-SUMMARY.csv` pour le total à jour (régénéré par le script de fusion).

## Format de chaque CSV

Colonnes : `key, french_reference, english_reference, translation`

- `key` : identifiant technique, **ne pas traduire ni modifier**.
- `french_reference` : texte source à traduire (référence principale).
- `english_reference` : traduction anglaise existante, donnée à titre de contexte
  supplémentaire quand elle existe (peut être vide).
- `translation` : **colonne à remplir** par le traducteur, dans la langue du fichier.

Ne pas toucher aux autres colonnes. Les cellules contenant une virgule ou un
guillemet sont déjà correctement échappées au format CSV standard (RFC 4180) —
ouvrables tel quel dans Excel/Google Sheets/LibreOffice.

## Consignes pour le traducteur

- Garder le ton de la marque : professionnel, chaleureux, orienté agriculture/agritech.
- Respecter les variables et la ponctuation de fin (`...`, `?`, `!`) du texte source.
- Ne pas traduire les noms propres (`KILIMO`, `KILIMO Agritech`).
- Une cellule non traduite peut rester vide — elle sera simplement ignorée à la
  réintégration (le site affichera le français en repli, pas de clé cassée).

## Réintégration dans le code

Une fois une ou plusieurs colonnes `translation` remplies, exécuter depuis la
racine du projet :

```bash
node scripts/merge-translations.cjs
```

Ce script :
1. Insère chaque traduction fournie dans le bon bloc de `src/i18n/i18n.tsx`.
2. Réécrit chaque CSV en ne conservant que les lignes **encore non traduites**
   (on peut donc renvoyer le même fichier à un traducteur pour un second lot,
   ou committer un premier lot partiel sans perdre le suivi du reste).

Vérifier ensuite la compilation avant de committer :

```bash
npx tsc -p tsconfig.app.json --noEmit
```

Le script a été testé (données factices, restaurées ensuite) sur une insertion
avec valeurs contenant virgules et guillemets — round-trip CSV → i18n.tsx validé.
