# WorldHub

WorldHub er en hjemmeside til rollespillere. Her kan man samle sine spilverdener, NPC'er og spillerkarakterer ét sted. Det er mit svendeprøveprojekt.

Hvis du vil køre projektet på din egen computer, så følg guiden nedenfor.

## Til lærer og censor

Min database er allerede sat op. I behøver ikke selv at oprette en. I skal bare hente koden, lægge mine nøgler ind og starte serveren. Det tager omkring 10 minutter.

## Programmer du skal bruge

1. Node.js. Hent LTS versionen fra nodejs.org. Klik dig igennem installationen.
2. Git. Hent fra git-scm.com. Brug standardindstillingerne.

Du kan også installere VS Code fra code.visualstudio.com hvis du vil kigge på koden, men det er ikke nødvendigt.

## Hent koden

1. Åbn en terminal. På Windows hedder den PowerShell, på Mac hedder den Terminal.
2. Skriv denne kommando og tryk Enter:

```
git clone https://github.com/Kouly-productions/WorldHub.git
```

3. Gå ind i mappen:

```
cd WorldHub
```

## Installer pakkerne

1. Skriv denne kommando i terminalen og tryk Enter:

```
npm install
```

2. Og så venter vi bare i lidt tid til den er færdig :))

## Opret en .env.local fil

Det er her nøglerne til min database skal ligge.

1. Lav en ny fil i WorldHub mappen der hedder .env.local.
2. Åbn filen i Notepad eller en anden editor.
3. Kopier disse to linjer ind:

```
NEXT_PUBLIC_SUPABASE_URL=https://cedtyjxnykuvcclcammj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNlZHR5anhueWt1dmNjbGNhbW1qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0OTA4NDAsImV4cCI6MjA4NzA2Njg0MH0.SWMyzS8uPDpnlEPrxeYFGKmnbyqNbC_qOXs1Yhjv09M
```

4. Gem filen.

## Start serveren

1. Skriv denne kommando i terminalen:

```
npm run dev
```

2. Vent til du ser teksten Ready og http://localhost:3000.
3. Åbn http://localhost:3000 i din browser.

## Test at det virker

1. Klik på Create Account.
2. Opret en bruger med email og password.
3. Log ind.
4. Opret en verden.
5. Opret en NPC.

## Stop serveren

Tryk Ctrl og C i terminalen samtidig. For at starte den igen skal du bare køre npm run dev.

## Hvis noget går galt

1. Hvis npm eller git ikke virker, så har du ikke installeret programmerne rigtigt. Genstart computeren og prøv igen.
2. Hvis du ikke kan logge ind, så er der nok en stavefejl i .env.local. Tjek at de to linjer er præcis som ovenfor.
3. Hvis du får en fejl der siger Cannot find module, så prøv at køre npm install igen.
4. Hvis port 3000 er optaget, så bruger Next.js bare port 3001 i stedet.

## Hvad jeg har brugt

1. Next.js 16 og React 19 til selve siden.
2. TypeScript som programmeringssprog.
3. Tailwind CSS til design.
4. Supabase til database og login.
5. Lucide React til ikoner.

## Live version

Hjemmesiden kører også online på Vercel: [indsæt URL]
