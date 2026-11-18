# Office plánovač

Jednoduchá responzívna webová aplikácia v slovenčine na plánovanie dochádzky tímu (pondelok až piatok).

## Funkcie

- automaticky zobrazuje aktuálny plánovací týždeň,
- od soboty prepne na nasledujúci pracovný týždeň,
- pri otvorenej karte kontroluje zmenu týždňa priebežne,
- umožňuje prehliadať predchádzajúce a nasledujúce týždne,
- pridáva členov tímu,
- pri každom dni ponúka stavy Prídem (zelená), Neprídem (červená), Ešte neviem (oranžová),
- používa Supabase na spoločné ukladanie údajov a prihlasovanie e-mailovým odkazom.

## Nastavenie Supabase

1. Vytvor projekt na [supabase.com](https://supabase.com/).
2. V Supabase otvor SQL Editor → New query.
3. Vlož celý obsah súboru `supabase-setup.sql` a stlač Run.
4. V Project Settings → API skopíruj Project URL a verejný anon/public key.
5. V Authentication nastav prihlasovanie e-mailom a povoľ len pozvaných členov tímu.
6. V Authentication → URL Configuration pridaj adresu GitHub Pages do povolených redirect URL.

## Nastavenie aplikácie

Vytvor súbor `config.js` podľa `config.example.js` a vlož doň údaje zo Supabase:

```js
window.APP_CONFIG = {
  SUPABASE_URL: "https://tvoj-projekt.supabase.co",
  SUPABASE_ANON_KEY: "tvoj-verejny-anon-key"
};
```

**Nikdy nevkladaj do webovej aplikácie Supabase service_role key ani databázové heslo.** Súbor `config.js` nepatrí do verejného repozitára. Pre bezpečné nasadenie ho pridaj cez GitHub Actions Secrets a workflow; zatiaľ je v repozitári iba vzor `config.example.js`.

## GitHub Pages

1. V repozitári otvor Settings → Pages.
2. Vyber Deploy from a branch.
3. Zvoľ vetvu `main` a priečinok `/(root)`, potom ulož.
4. Po nasadení bude stránka dostupná na adrese zobrazenej v nastaveniach Pages.

## Ochrana údajov

Repozitár je momentálne verejný, preto môže ktokoľvek prezerať zdrojový kód. Nezadávaj doň mená kolegov, dochádzku, prihlasovacie údaje ani súkromné kľúče. Pred použitím so skutočnými pracovnými údajmi si over, či firma povoľuje GitHub Pages a Supabase a či je nastavená primeraná autentifikácia a prístupové politiky. Samotný GitHub Pages je verejný statický hosting; nie je vhodný na ochranu dôverných interných údajov bez ďalšej schválenej ochrany.

## Súbory

- `index.html` – používateľské rozhranie
- `styles.css` – vzhľad
- `app.js` – logika kalendára, prihlásenia a ukladania
- `config.example.js` – vzor konfigurácie
- `supabase-setup.sql` – databázové tabuľky a RLS politiky
