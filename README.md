# WorldHub

WorldHub er en hjemmeside til rollespillere. Her kan man oprette spilverdener, lave karakterer (NPC'er og spillere) og dele dem med sine venner.

Den her guide viser dig, hvordan du henter projektet og kører det på din egen computer

> **INFO**: Du behøver ikke selv at sætte en database op. Forbindelsen til min Supabase database er allerede klar i guiden nedenfor. Du skal bare hente projektet, installere det, og starte det.

---

## Hvad får du brug for?

Før du starter, skal du installere to programmer på din computer. Det er gratis, og det tager cirka 5 minutter.

### 1. Node.js (selve "motoren" der kører hjemmesiden)
- Gå til https://nodejs.org
- Klik på den store grønne knap der hedder "LTS"
- Når filen er hentet, åbn den og klik "Næste" hele vejen igennem
- Når installationen er færdig, er du klar

### 2. Git (programmet der henter koden fra GitHub)
- Gå til https://git-scm.com/downloads
- Klik på "Download for Windows" (eller Mac/Linux)
- Når filen er hentet, åbn den og klik "Næste" hele vejen igennem
- Du kan bare bruge alle standard-indstillingerne

### Valgfrit: En kode-editor
Hvis du gerne vil kunne se koden, kan du installere Visual Studio Code:
- Gå til https://code.visualstudio.com/
- Klik "Download for Windows"
- Installer programmet

---

## Trin 1: Hent projektet til din computer

1. Åbn et terminal-vindue:
   - **Windows**: Tryk på Windows knappen, skriv "PowerShell" og tryk Enter
   - **Mac**: Tryk på Cmd + mellemrum, skriv "Terminal" og tryk Enter
2. Skriv (eller kopier) denne kommando ind og tryk Enter:

```bash
git clone https://github.com/Kouly-productions/WorldHub.git
```

3. Vent et øjeblik mens projektet hentes
4. Skriv så denne kommando for at gå ind i projekt mappen:

```bash
cd WorldHub
```

---

## Trin 2: Installer projektets pakker

WorldHub bruger en masse små pakker som skal installeres. Det gør du sådan her:

1. I samme terminal, skriv:

```bash
npm install
```

2. Tryk Enter
3. Og så venter vi bare lidt :))
4. Når det er færdigt, kommer du tilbage til en almindelig kommando linje

---

## Trin 3: Sæt forbindelsen til databasen op

Hjemmesiden gemmer alle data (brugere, verdener, karakterer) i databasen Supabase. Du skal fortælle hjemmesiden hvor databasen ligger.

1. I `WorldHub`-mappen skal du oprette en fil der hedder `.env.local`

   **Sådan gør du det i terminalen:**
   - **Windows (PowerShell)**: Skriv `New-Item .env.local` og tryk Enter
   - **Mac/Linux**: Skriv `touch .env.local` og tryk Enter

2. Åbn filen i Notepad, VS Code, eller hvad du nu har:
   - **Windows**: Skriv `notepad .env.local` i terminalen
   - **Mac**: Skriv `open -e .env.local` i terminalen

3. Kopier følgende ind i filen:

```
NEXT_PUBLIC_SUPABASE_URL=https://cedtyjxnykuvcclcammj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNlZHR5anhueWt1dmNjbGNhbW1qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0OTA4NDAsImV4cCI6MjA4NzA2Njg0MH0.SWMyzS8uPDpnlEPrxeYFGKmnbyqNbC_qOXs1Yhjv09M
```

4. Gem filen og luk den (Ctrl + S, så Ctrl + W)

---

## Trin 4: Start hjemmesiden

Nu er alt klar. Tid til at starte hjemmesiden!

1. Tilbage i terminalen, skriv:

```bash
npm run dev
```

2. Tryk Enter
3. Vent et øjeblik. Du vil se noget der siger:

```
✓ Ready in 2s
- Local:   http://localhost:3000
```

4. Åbn din browser og gå til **http://localhost:3000**
5. Du burde nu se WorldHub's login-side

---

## Trin 5: Test at det virker

1. Klik på **"Create Account"** for at oprette en bruger
2. Skriv en e-mail, brugernavn og password
3. Log ind
4. Opret en verden
5. Opret en NPC

Og alt burde at vrike YIPEEEEEEEE!!! :D

---

## Teknologier brugt i projektet

- **Next.js 16** – Framework til hjemmesiden
- **React 19** – Bibliotek til at bygge brugergrænsefladen
- **TypeScript** – Programmeringssprog
- **Tailwind CSS 4** – Styling
- **Supabase** – Database og login-system
- **Lucide React** – Ikoner

---

## Live version

WorldHub kører også online på Vercel. Du kan finde den live version her:
https://worldhub-nine.vercel.app/worldChoice
