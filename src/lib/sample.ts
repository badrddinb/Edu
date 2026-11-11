import type { ExamConfig } from "./types";

/** A hand-written paper so the layout can be previewed without generating anything. */
export const SAMPLE_CONFIG: Partial<ExamConfig> = {
  levelId: "3ac",
  trackId: "",
  subjectId: "maths",
  examType: "cc",
  lang: "fr",
  semester: 1,
  examNumber: 1,
  duration: 120,
  total: 20,
  coefficient: "",
  topics: "Identités remarquables, puissances, racines carrées, théorème de Thalès",
};

export const SAMPLE_EXAM = String.raw`*L'usage de la calculatrice non programmable est autorisé. La rédaction et la clarté des justifications sont prises en compte.*

## Exercice 1 (6 points)

1. Développer et réduire : $A = (2x+3)^2 - (x-1)(x+1)$. ${"`1,5 pt`"}
2. Factoriser : $B = 9x^2 - 16$ et $C = x^2 - 6x + 9$. ${"`2 pt`"}
3. Calculer et simplifier : $D = \sqrt{50} - 3\sqrt{8} + \sqrt{18}$. ${"`1,5 pt`"}
4. Écrire sans radical au dénominateur : $E = \dfrac{6}{\sqrt{3}}$. ${"`1 pt`"}

## Exercice 2 (5 points)

1. Écrire sous la forme d'une seule puissance :
   - $F = \dfrac{2^5 \times 2^{-2}}{2^4}$ ${"`1,5 pt`"}
   - $G = \left(3^2\right)^3 \times 3^{-4}$ ${"`1,5 pt`"}
2. Donner l'écriture scientifique des nombres :
   - $H = 0{,}00045 \times 10^{7}$ ${"`1 pt`"}
   - $K = 3\,600\,000 \times 10^{-2}$ ${"`1 pt`"}

## Exercice 3 (6 points)

$ABC$ est un triangle tel que $AB = 6\ \text{cm}$, $AC = 9\ \text{cm}$ et $BC = 7{,}5\ \text{cm}$.
$M$ est le point du segment $[AB]$ tel que $AM = 4\ \text{cm}$. La parallèle à $(BC)$ passant par $M$ coupe $[AC]$ en $N$. La figure n'est pas en vraie grandeur.

${"```svg"}
<svg viewBox="0 0 280 290" width="280" xmlns="http://www.w3.org/2000/svg" font-family="serif" font-size="16">
  <polygon points="40,250 220,250 192,27" fill="none" stroke="black" stroke-width="1.5"/>
  <line x1="160" y1="250" x2="141" y2="101" stroke="black" stroke-width="1.5"/>
  <text x="24" y="266">A</text>
  <text x="226" y="266">B</text>
  <text x="196" y="22">C</text>
  <text x="156" y="270">M</text>
  <text x="120" y="98">N</text>
</svg>
${"```"}

1. Calculer $AN$. ${"`2 pt`"}
2. Calculer $MN$. ${"`2 pt`"}
3. Soit $Q$ le point de $[AB]$ tel que $AQ = 2\ \text{cm}$ et $P$ le point de $[AC]$ tel que $AP = 3\ \text{cm}$. Montrer que les droites $(PQ)$ et $(BC)$ sont parallèles. ${"`2 pt`"}

## Exercice 4 (3 points)

Un jardin carré a pour côté $(x+5)$ mètres, où $x$ est un nombre positif. On y aménage un bassin carré de côté $x$ mètres.

1. Montrer que l'aire de la partie restante du jardin est $10x + 25$, en mètres carrés. ${"`1,5 pt`"}
2. Calculer $x$ sachant que cette aire est égale à $125\ \text{m}^2$. ${"`1,5 pt`"}`;

export const SAMPLE_CORRECTION = String.raw`## Exercice 1 (6 points)

1. $A = 4x^2 + 12x + 9 - (x^2 - 1) = 3x^2 + 12x + 10$. Développement du carré : 0,5 ; produit $(x-1)(x+1)$ : 0,5 ; réduction : 0,5. ${"`1,5 pt`"}
2. $B = (3x-4)(3x+4)$ et $C = (x-3)^2$. 1 point par factorisation. ${"`2 pt`"}
3. $D = 5\sqrt{2} - 6\sqrt{2} + 3\sqrt{2} = 2\sqrt{2}$. Simplification des trois radicaux : 1 ; résultat : 0,5. ${"`1,5 pt`"}
4. $E = \dfrac{6\sqrt{3}}{3} = 2\sqrt{3}$. ${"`1 pt`"}

## Exercice 2 (5 points)

1. $F = 2^{5-2-4} = 2^{-1}$ ${"`1,5 pt`"} ; $G = 3^{6-4} = 3^{2}$ ${"`1,5 pt`"}
2. $H = 4{,}5 \times 10^{-4} \times 10^{7} = 4{,}5 \times 10^{3}$ ${"`1 pt`"} ; $K = 3{,}6 \times 10^{6} \times 10^{-2} = 3{,}6 \times 10^{4}$ ${"`1 pt`"}

## Exercice 3 (6 points)

1. $M \in [AB]$, $N \in [AC]$ et $(MN) \parallel (BC)$ ; d'après le théorème de Thalès : $\dfrac{AM}{AB} = \dfrac{AN}{AC} = \dfrac{MN}{BC}$. Donc $AN = \dfrac{4 \times 9}{6} = 6\ \text{cm}$. Énoncé du théorème et conditions : 1 ; calcul : 1. ${"`2 pt`"}
2. $MN = \dfrac{4 \times 7{,}5}{6} = 5\ \text{cm}$. ${"`2 pt`"}
3. $\dfrac{AQ}{AB} = \dfrac{2}{6} = \dfrac{1}{3}$ et $\dfrac{AP}{AC} = \dfrac{3}{9} = \dfrac{1}{3}$. Les rapports sont égaux et les points $A, Q, B$ et $A, P, C$ sont alignés dans le même ordre ; d'après la réciproque du théorème de Thalès, $(PQ) \parallel (BC)$. Calcul des rapports : 1 ; conclusion justifiée : 1. ${"`2 pt`"}

## Exercice 4 (3 points)

1. Aire restante : $(x+5)^2 - x^2 = x^2 + 10x + 25 - x^2 = 10x + 25$. ${"`1,5 pt`"}
2. $10x + 25 = 125$, donc $10x = 100$ et $x = 10$. ${"`1,5 pt`"}`;
