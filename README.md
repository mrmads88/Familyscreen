# Familyscreen

Familietavlen: et touch-dashboard til køkkenvæggen med børnenes opgaver og stjerner, kalender, indkøbsliste med Nemlig.com, Spotify, TV, lys og biler. Alt styres via Home Assistant.

- **Tavlen:** `familietavle/` er ren HTML/CSS/JS uden byggetrin. Se [familietavle/LÆS-MIG.md](familietavle/LÆS-MIG.md).
- **Pakke til andre:** `pakke-skabelon/` har en startfil og en kort vejledning.
- **Data:** børn, opgaver, indstillinger og Home Assistant-token gemmes kun i browseren på hver skærm. Intet personligt ligger i repoet eller på serveren.

## Kør lokalt

```bash
python -m http.server 8765 --directory familietavle
```

Åbn http://localhost:8765.

## Udrulning (Azure Static Web Apps, gratis)

1. Læg ændringerne på grenen `Production`.
2. GitHub → **Actions** → **Deploy Familyscreen Prod to Azure** → **Run workflow** på `Production`, og skriv `PRODUCTION`.

Workflowet tjekker syntaks og at ingen backup-filer eller tokens er kommet med, før det udruller.
