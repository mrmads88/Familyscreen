# Familietavlen – start her 👋

Et touch-dashboard til køkkenvæggen: børnenes opgaver med stjerner og fejringer, kalender og indkøbsliste, Spotify, streaming på TV'et, lys og bilerne.

**Når du åbner tavlen første gang, starter en opsætningsguide.** Den tager dig igennem det hele trin for trin, tjekker selv om hvert trin virker, og fortæller præcis hvad du mangler, hvis noget ikke virker.

---

## Det skal du bruge
- **Home Assistant** kørende på dit netværk, fx en *Home Assistant Green* (ca. 1.000 kr.) sat i routeren med netkabel.
- En **skærm til væggen**: en Android-tablet, en Windows-touchskærm eller en Raspberry Pi med touchskærm.
- **Chrome** til opsætningen.

---

## Vej 1: Læg tavlen ind i Home Assistant *(anbefalet)*
Så kører tavlen direkte fra Home Assistant, og vægskærmen behøver ikke andet end en browser.

1. Installér tilføjelsen **Samba share** i Home Assistant: **Indstillinger → Apps → Butik → Samba share**. Installér, sæt en adgangskode under *Konfiguration*, og tryk Start.
2. Åbn `\\homeassistant.local\config` i Stifinder på din pc (eller `\\IP-ADRESSE\config`).
3. Lav en mappe der hedder **`www`**, hvis den ikke findes, og kopiér mappen **`familietavle`** ind i den.
   *Fandtes `www`-mappen ikke i forvejen, så genstart Home Assistant én gang.*
4. Åbn tavlen i browseren:
   **`http://homeassistant.local:8123/local/familietavle/index.html`**
5. Opsætningsguiden starter. Adressen på Home Assistant er allerede udfyldt.

## Vej 2: Prøv den først på din Windows-pc
1. Installér **Python** fra python.org, hvis du ikke har det. Sæt flueben i *"Add python.exe to PATH"*.
2. Dobbeltklik på **`start-tavle.bat`**.
3. Tavlen åbner på **http://localhost:8765**, og guiden starter.

---

## Kiosk-tilstand på væggen
- **Android-tablet:** appen **Fully Kiosk Browser**. Sæt *Start URL* til tavlens adresse, og slå *Kiosk Mode* og *Motion Detection* til.
- **Windows:** lav en genvej i Autostart:
  `msedge.exe --kiosk "TAVLENS-ADRESSE" --edge-kiosk-type=fullscreen --no-first-run`
- **Raspberry Pi:** `chromium-browser --kiosk "TAVLENS-ADRESSE"`

## Godt at vide
- **Alt gemmes i browseren på skærmen.** Tag en backup under *Forældre → Skærm & backup*.
- Standard-PIN er **1234**, indtil du vælger en ny i guiden.
- Guiden kan startes igen når som helst: **Forældre → Skærm & backup → Start opsætningsguiden**.
- Mere om integrationerne (biler, Spotify, Google Kalender …) står i `familietavle/LÆS-MIG.md`.

### Typiske faldgruber (guiden hjælper også med dem)
- **Chrome udfylder felter med dit Home Assistant-login** i fx Spotify- eller Google-opsætningen. Tjek altid, at der står den lange nøgle og ikke dit brugernavn eller din kode.
- **"homeassistant.local" virker ikke på alle pc'er.** Brug i stedet IP-adressen, fx `http://192.168.1.50:8123`.
- **Log ind på Spotify og Google i en almindelig Chrome-fane**, ikke i en apps indbyggede browser.
