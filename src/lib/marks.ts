/** Adds up the marks written as inline code in a paper (`1,5 pt`, `2 ن`…). */
export function sumMarks(markdown: string): { sum: number; count: number } {
  const body = markdown.replace(/```[\s\S]*?(```|$)/g, "");
  let sum = 0;
  let count = 0;
  for (const m of body.matchAll(/`([^`\n]+)`/g)) {
    const n = m[1].match(/\d+(?:[.,]\d+)?/);
    if (!n) continue;
    sum += parseFloat(n[0].replace(",", "."));
    count++;
  }
  return { sum: Math.round(sum * 100) / 100, count };
}
