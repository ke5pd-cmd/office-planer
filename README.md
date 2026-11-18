# Office plánovač

Jednoduchá responzívna webová aplikácia v slovenčine na plánovanie dochádzky tímu na pracovné dni (pondelok až piatok), vždy po týždňoch.

## Čo aplikácia vie

- automaticky zobrazovať aktuálny plánovací týždeň podľa dátumu,
- od soboty automaticky prepnúť na nasledujúci pracovný týždeň (pondelok – piatok),
- pri otvorenej karte kontrolovať zmenu plánovacieho týždňa priebežne; pri novom týždni sa tabuľka sama prepne,
- prehliadať predchádzajúci a nasledujúci týždeň,
- pridať meno člena tímu (meno zostáva uložené aj pre ďalšie týždne),
- pri každom dni nastaviť stav: **Prídem** (zelená), **Neprídem** (červená), **Ešte neviem** (oranžová),
- ukladať zmeny do spoločnej databázy,
- vyžadovať prihlásenie pracovným e-mailom cez jednorazový odkaz,
- obnovovať zmeny ostatných kolegov približne každých 20 sekúnd.

## Automatický týždenný cyklus

Od pondelka do piatka aplikácia zobrazuje pracovný týždeň, ktorý práve prebieha. Od soboty (vrátane nedele) automaticky zobrazí nasledujúci týždeň. Ak je stránka otvorená, kontroluje zmenu priebežne a po prechode na nový plánovací týždeň sa sama prepne. Staršie týždne a ich záznamy zostávajú uložené; nič sa nemaže.

## 1. Vytvor spoločnú databázu (Supabase)

1. Vytvor projekt na [supabase.com](https://supabase.com/).
2. V projekte otvor **SQL Editor → New query**.
3. Skopíruj celý obsah súboru `supabase-setup.sql`, vlož ho do editora a stlač **Run**.
4. V **Project Settings → API** (alebo **Data API / API Keys**, podľa zobrazenia projektu) skopíruj **Project URL** a verejný **anon/public key**.
5. V **Authentication → Providers → Email** nechaj zapnuté prihlasovanie e-mailom. Pre interný tím odporúčame vypnúť verejnú registráciu a kolegov najprv pozvať cez **Authentication → Users → Invite user**.
6. V **Authentication → URL Configuration** nastav URL svojej GitHub Pages stránky medzi povolené Redirect URLs. Pri lokálnom testovaní môžeš pridať aj `http://localhost:8000`.

## 2. Nastav aplikáciu

1. Skopíruj `config.example.js` a novú kópiu pomenuj `config.js`.
2. Do `config.js` vlož údaje zo Supabase:

```js
window.APP_CONFIG = {
  SUPABASE_URL: "https://tvoj-projekt.supabase.co",
  SUPABASE_ANON_KEY: "tvoj-verejny-anon-key"
};
```

3. Pridaj `config.js` do deploymentu/GitHub Pages spolu s ostatnými súbormi. Supabase anon/public key je určený na použitie v prehliadači; nikdy sem nevkladaj `service_role` key ani databázové heslo. Prístup k údajom chránia RLS pravidlá vytvorené SQL skriptom. Ak firma nechce mať URL a verejný anon key v repozitári, nasadzuj ich cez GitHub Actions Secrets.

## 3. Otestuj lokálne

V priečinku projektu spusti jednoduchý lokálny server, napríklad:

```bash
python -m http.server 8000
```

Potom otvor `http://localhost:8000`.

## 4. Nahraj projekt na GitHub a zapni Pages

1. Vytvor repozitár na GitHube.
2. Nahraj súbory `index.html`, `styles.css`, `app.js`, `config.example.js`, `supabase-setup.sql`, `README.md` a `.gitignore`. **Nenahrávaj `config.js`.**
3. V repozitári otvor **Settings → Pages**.
4. Ako zdroj vyber **Deploy from a branch**, vetvu `main` a priečinok `/ (root)`, potom ulož.
5. Uisti sa, že `config.js` je súčasťou nasadených súborov. Bez neho aplikácia zobrazí upozornenie, že databáza nie je nakonfigurovaná.

### Poznámka k bezpečnému nasadeniu

GitHub Pages publikuje statický web. Supabase URL a anon/public key sú navrhnuté na použitie v klientskom kóde, ale nikdy nezverejňuj `service_role` key ani databázové heslo. Zároveň nastav Supabase tak, aby sa prihlasovali len pozvaní kolegovia. Údaje o dochádzke patria do internej databázy; pred použitím v práci si over, či vaša firma povoľuje Supabase a GitHub Pages. Ak má byť samotná stránka prístupná len zamestnancom, treba použiť firemné SSO alebo inú ochranu prístupu pred GitHub Pages.

## Štruktúra

- `index.html` – rozhranie aplikácie
- `styles.css` – vzhľad a responzívne rozloženie
- `app.js` – logika aplikácie
- `config.example.js` – vzor konfigurácie
- `supabase-setup.sql` – databázové tabuľky a prístupové pravidlá
