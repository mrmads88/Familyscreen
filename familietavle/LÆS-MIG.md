# Familietavlen 🏠⭐

Et touch-dashboard til køkkenvæggen: børnenes opgaver med stjerner og fejringer, Spotify, streaming, lys og bilerne. Alt sammen samlet ét sted.

Tavlen er en almindelig webside (HTML/CSS/JS, ingen installation eller byggetrin). Den kører med **demo-data**, indtil I forbinder Home Assistant.

---

## 1. Prøv den nu

Åbn en terminal i mappen `familietavle` og kør:

```bash
python -m http.server 8765
```

Gå derefter til http://localhost:8765 i browseren. Standard-PIN til forældre-delen er **1234**. Skift den under *Forældre → Skærm & backup*.

---

## 2. Arkitekturen: Home Assistant som "hjernen"

Netflix, Disney+, Renault, Kia, WiZ og Google Home har ingen fælles åben adgang, som en webside kan bruge direkte. Derfor er det smarteste at bruge **Home Assistant** (gratis, kører lokalt) som samlepunkt:

```
 Køkkenskærm (Familietavlen)
          │  WebSocket + token
          ▼
   Home Assistant  ──►  Renault (indbygget integration)
                   ──►  Kia Connect (kia_uvo via HACS)
                   ──►  WiZ-lys (indbygget, lokalt)
                   ──►  Google Cast / Google TV / Nest-højttalere
                   ──►  Spotify (indbygget)
                   ──►  … over 2.000 andre integrationer
```

**Hardware til Home Assistant:** *Home Assistant Green* (ca. 1.000 kr., plug-and-play) eller en Raspberry Pi 4/5.

**Google Home og Home Assistant kan sagtens køre side om side.** I behøver ikke at flytte noget. HA kan også sende sine enheder tilbage til Google Home, så "Hey Google" stadig virker.

### Integrationer i Home Assistant

| Hvad | Integration i HA | Bemærk |
|---|---|---|
| Elbil | Bilmærkets integration, fx **Renault**, **Tesla Fleet**, **Kia Uvo / Hyundai Bluelink** (Markedsplads) eller **Volkswagen** | Batteri, rækkevidde, opladning og forvarmning virker for de fleste. Fjernlåsning afhænger af, hvad producenten giver adgang til. Nye modeller kan mangle i integrationen i starten. |
| WiZ-lys | **WiZ** (indbygget) | Findes automatisk på netværket. |
| Google Home-enheder | **Google Cast**, **Google Nest** og evt. **Matter** | Højttalere og Chromecast findes automatisk. |
| Spotify | **Spotify** (indbygget) | Kræver Spotify Premium for at styre afspilning. |
| TV (Netflix m.fl.) | **Android TV Remote** / **Google Cast** | Giver mulighed for at starte apps på TV'et fra tavlen. |

---

## 3. Forbind tavlen til Home Assistant

1. **Læg tavlen ind i Home Assistant** (anbefalet, så slipper I for CORS-bøvl):
   kopiér mappen `familietavle` til `/config/www/familietavle/` i HA (fx med *File editor*- eller *Samba*-tilføjelsen).
   Tavlen kan nu åbnes på `http://homeassistant.local:8123/local/familietavle/index.html`.
2. **Lav en adgangsnøgle:** i HA, klik på jeres profil → *Sikkerhed* → *Long-lived access tokens* → *Opret token*.
   💡 Tip: opret en separat HA-bruger kaldet "Køkkenskærm" (ikke administrator) og lav tokenet på den.
3. På tavlen: **Forældre → Integrationer** → indsæt adresse og token → *Gem & forbind*.
4. Vælg enheder til **biler, Spotify og TV**. Felterne foreslår automatisk enheder fra jeres HA, så I kan bare begynde at skrive bilens navn.
5. Under **Streamingtjenester**: skriv navnet på appen, som det står i TV'ets kildeliste (fx `Netflix`), så kan tavlen starte appen direkte på TV'et.

Lys og stemninger (scener) dukker automatisk op. Lav fx scenerne *Morgen*, *Aftensmad*, *Filmaften* og *Godnat* i HA.
Under *Hjemmet* kan I tilføje **ekstra enheder**, fx temperatursensorer, kaffemaskinen eller julelyset. Alt fra HA kan vises på tavlen.

---

## 4. Kiosk-tilstand på væggen

Vælg efter hvilken skærm I ender med:

### Android-tablet / vægskærm med Android (anbefalet)
Brug **Fully Kiosk Browser** (Play Butik, licens ca. 60 kr.):
- *Start URL*: adressen til tavlen
- *Kiosk Mode*: til (låser skærmen til tavlen)
- *Motion Detection*: skærmen tænder, når man går forbi
- *Screen Off Timer* og nattetid: sparer strøm og skærm
- *Reload on idle*: tavlen vender altid tilbage efter fx en Netflix-fane

### Windows (mini-pc eller all-in-one med touch)
Lav en genvej i *Start → Autostart* med:
```bash
"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --kiosk "http://homeassistant.local:8123/local/familietavle/index.html" --edge-kiosk-type=fullscreen --no-first-run
```
Til en helt låst løsning: *Indstillinger → Konti → Andre brugere → Kiosk* (Tildelt adgang).

### Raspberry Pi med touchskærm
```bash
chromium-browser --kiosk --noerrdialogs --disable-infobars --check-for-update-interval=31536000 "http://homeassistant.local:8123/local/familietavle/index.html"
```
Slå *Lette effekter* til under *Forældre → Skærm*, hvis animationerne hakker. Installér et skærmtastatur (fx `squeekboard`) til forældre-delen.

---

## 4b. Kalender og indkøbsliste

**Kalender (Google Kalender):** Tavlen viser alle `calendar.`-enheder fra Home Assistant og kan oprette nye aftaler.
1. Lav en fælles kalender **"Familie"** i Google Kalender og del den med resten af familien (*Indstillinger for kalenderen → Del med bestemte personer*).
   Har en person ikke en Google-konto (fx en mail hos en anden udbyder), kan vedkommende enten oprette en gratis Google-konto med sin nuværende mail, eller abonnere i Outlook via kalenderens *hemmelige adresse i iCal-format* (kun visning).
2. Tilføj **Google Calendar**-integrationen i Home Assistant. Den kræver et OAuth-klient-id fra Google Cloud Console med typen "TV og enheder med begrænset input", og Google Calendar API skal være slået til. Sæt OAuth-appen til *I produktion*, ellers udløber login efter 7 dage.
3. På tavlen: **Forældre → Integrationer → Kalender & indkøb**: vælg hvilke kalendere der vises, og at nye aftaler skal i `calendar.familie`.

**Indkøbsliste:** Tavlen bruger Home Assistants indkøbsliste (`todo.indkobsliste`) eller en anden `todo.`-liste, du vælger.
- **Med stemmen:** Google sender ikke længere stemme-varer til andre apps (fx Bring!). "Hey Google, tilføj mælk til indkøbslisten" havner i **Google Keep**. Integrationen *Google Keep Sync* (HACS) kan spejle Keep-listen til Home Assistant, men den kræver et login-token med adgang til hele Google-kontoen, så brug helst en separat Google-konto.

**Nemlig.com:** Med integrationen **Nemlig.com** (uofficiel, HACS → brugerdefineret repository `https://github.com/DruonDK/ha-nemlig`, kræver HA 2026.10+) får tavlen et Nemlig-kort under *Indkøb*:
- kurvens pris, levering, total og hvor meget der mangler til minimumskøb
- næste levering og status (fx "På vej")
- **Læg listen i kurven:** varer, I har købt før, findes automatisk. Ellers vælger I fra en liste med priser. "2 mælk" giver 2 stk.
- **Find vare:** søg i hele sortimentet og læg i kurven

Tavlen bestiller aldrig: bestilling, betaling og leveringstid vælges i Nemlig-appen. Kurven er den samme som i appen.

**Varebilleder og ret/fjern i kurven (valgfrit):** integrationen kan som standard hverken sende billeder eller rette antal i kurven. To små tilføjelser i integrationen klarer det. Se den præcise kode i `ha-tilfoejelser/nemlig.md` i repoet. De skal sættes ind igen, hvis integrationen opdateres. Uden dem virker tavlen stadig, bare uden billeder og uden −/+/fjern i "Se kurven".

## 5. Sådan virker tavlen

- **Børnene** trykker på deres opgaver → konfetti, lyd, flyvende stjerne og ros. Når alle dagens opgaver er klaret: stor fejring 🏆. Nyt niveau giver sin egen fejring.
- **Stjerner** spares op til **belønninger**, som I selv laver (fx skærmtid eller vælg aftenens film). En voksen godkender med PIN.
- **Stime 🔥** tæller dage i træk med alle opgaver klaret. **Ugeprikkerne** viser ugen.
- Et tryk på en klaret opgave fortryder den (med bekræftelse).
- **Forældre-delen** (PIN) har børn med foto eller figur, opgaver (dage, kun i dag, stjerner), belønninger, bonusstjerner, integrationer, vejr-by, pauseskærm og backup.
- **Oplåsning af biler** kræver PIN. Låsning gør ikke.
- **Pauseskærm** med stort ur, vejrudsigt og børnenes status efter et par minutter. Den flytter sig langsomt, så skærmen ikke brænder ind.

### Data
Alt gemmes lokalt i skærmens browser. Tag en **backup** under *Forældre → Skærm & backup* en gang imellem.

---

## Filer

```
familietavle/
├─ index.html      – sidens skelet
├─ css/style.css   – design
├─ js/store.js     – data: børn, opgaver, stjerner, indstillinger
├─ js/ha.js        – Home Assistant-forbindelse + demo-data
├─ js/fx.js        – konfetti og lyde
└─ js/app.js       – alle sider og handlinger
```
