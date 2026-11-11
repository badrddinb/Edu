# Imtihan — امتحان

Site web pour les enseignants marocains : il rédige des sujets d'examen conformes au système
éducatif marocain, pour chaque cycle, chaque niveau, chaque filière et chaque matière, avec le
barème et les éléments de réponse, prêts à imprimer.

## Ce que fait le site

- **Tous les niveaux** : primaire (1ʳᵉ à 6ᵉ), collège (1AC à 3AC), lycée (tronc commun, 1ʳᵉ et
  2ᵉ bac) avec toutes les filières : sciences expérimentales, sciences mathématiques A et B,
  sciences physiques, SVT, sciences agronomiques, économie et gestion, lettres, sciences
  humaines, STE, STM, arts appliqués, enseignement originel, bac professionnel.
- **Tous les types d'épreuve** : devoir surveillé (contrôle continu), évaluation diagnostique,
  examen normalisé local, provincial, régional et national, proposés selon le niveau.
- **Sujet en arabe, en français ou en anglais**, avec en-tête officiel (académie, direction,
  établissement, durée, coefficient), formules mathématiques, tableaux et figures.
- **Corrigé et barème** détaillés, question par question.
- **Retouches** : demander une modification en une phrase, ou modifier le texte directement.
- **Impression / PDF** au format A4 : le sujet, le corrigé, ou les deux.
- **Interface en français et en arabe** ; les sujets générés sont conservés sur l'appareil.

Les sujets sont rédigés par une IA (Claude, d'Anthropic) à partir des programmes et des cadres de
référence qu'elle connaît. Ce ne sont pas des épreuves officielles : l'enseignant doit relire
l'énoncé, les données et le barème avant de distribuer le sujet.

## Lancer le site

Il faut Node.js 20 ou plus récent et une clé API Anthropic.

```bash
npm install
cp .env.example .env.local   # puis renseigner ANTHROPIC_API_KEY
npm run dev                  # http://localhost:3000
```

Sans clé API, le site s'ouvre quand même : le bouton « Voir un exemple » affiche un sujet rédigé
à la main pour juger de la mise en page.

| Variable | Rôle |
| --- | --- |
| `ANTHROPIC_API_KEY` | Clé API Anthropic, utilisée côté serveur uniquement. Obligatoire. |
| `ACCESS_CODE` | Code demandé aux enseignants avant de générer. Recommandé en ligne. |
| `ANTHROPIC_MODEL` | Modèle utilisé, `claude-opus-5-5` par défaut. |

## Mettre en ligne

C'est une application Next.js standard : `npm run build` puis `npm start`, ou un déploiement
sur Vercel ou tout hébergeur Node.js en définissant les variables ci-dessus. La rédaction d'un
sujet complet peut prendre quelques minutes ; l'hébergeur doit autoriser des réponses de cette
durée (la route est configurée pour 300 secondes).

## Organisation du code

| Fichier | Contenu |
| --- | --- |
| `src/lib/curriculum.ts` | Cycles, niveaux, filières, matières, types d'épreuve, académies. |
| `src/lib/prompt.ts` | Consignes données au modèle et structure usuelle de chaque épreuve. |
| `src/app/api/generate/route.ts` | Appel à l'API Claude, réponse envoyée au fil de l'eau. |
| `src/components/ExamForm.tsx` | Formulaire de l'enseignant. |
| `src/components/Paper.tsx` | Feuille d'examen : en-tête officiel, sujet, corrigé. |
| `src/lib/i18n.ts` | Textes de l'interface et de la feuille (français, arabe, anglais). |

Pour ajouter une matière ou une filière, il suffit de compléter `src/lib/curriculum.ts`.
