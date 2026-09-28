// Génère docs/A-VERIFIER.md : les informations à confirmer avant impression.
import { readFileSync, writeFileSync } from "node:fs";
const mods = JSON.parse(readFileSync(new URL("../public/data/modules.json", import.meta.url)));
const rows = mods.filter(m => JSON.stringify(m).includes("vérifier"))
  .map(m => `| ${m.code} | ${m.titre} | ${[["duree",m.duree],["essentiel",m.essentiel],["astuce",m.astuce]].filter(([,v])=>v&&v.includes("vérifier")).map(([k])=>k).join(", ")} | [ ] |`);
writeFileSync(new URL("../docs/A-VERIFIER.md", import.meta.url),
`# Informations à vérifier\n\nListe générée par \`npm run a-verifier\` à partir de \`public/data/modules.json\`. Une fois l'info confirmée (topo-guide, onf.fr, office de tourisme, prestataire), corriger le module, retirer la mention « à vérifier » et mettre à jour \`verifieLe\`.\n\n| Code | Module | Champ(s) | Fait |\n| --- | --- | --- | --- |\n${rows.join("\n")}\n\nÀ vérifier aussi, hors fiches : horaires des marchés, jour du grand marché de Saint-Pierre, accès aux bassins de la ravine Saint-Gilles, téléphérique de Saint-Denis, Maison du Coco, dates des fêtes (Dipavali, Safran en fête), tarifs cités.\n`);
console.log(rows.length + " modules à vérifier → docs/A-VERIFIER.md");
