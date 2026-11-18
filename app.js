(() => {
  'use strict';

  const config = window.APP_CONFIG || {};
  const hasConfig = typeof config.SUPABASE_URL === 'string' &&
    config.SUPABASE_URL.startsWith('https://') &&
    typeof config.SUPABASE_ANON_KEY === 'string' &&
    config.SUPABASE_ANON_KEY.length > 20;

  const $ = (id) => document.getElementById(id);
  const elements = {
    configWarning: $('config-warning'),
    plannerPanel: $('planner-panel'),
    prevWeek: $('prev-week'),
    nextWeek: $('next-week'),
    thisWeek: $('this-week'),
    weekLabel: $('week-label'),
    grid: $('planner-grid'),
    addPersonForm: $('add-person-form'),
    nameInput: $('name-input'),
    appMessage: $('app-message'),
    refreshButton: $('refresh-button')
  };

  if (!hasConfig || !window.supabase || !window.supabase.createClient) {
    elements.configWarning.hidden = false;
    elements.plannerPanel.hidden = true;
    return;
  }

  const client = window.supabase.createClient(
    config.SUPABASE_URL,
    config.SUPABASE_ANON_KEY
  );

  const STATUS = {
    coming: { label: 'Prídem', symbol: '✓', className: 'coming' },
    away: { label: 'Neprídem', symbol: '×', className: 'away' },
    unsure: { label: 'Ešte neviem', symbol: '?', className: 'unsure' }
  };

  // Od soboty sa zobrazuje nasledujúci pracovný týždeň.
  let weekStart = getPlanningMonday(new Date());
  let lastAutomaticWeek = localDateString(weekStart);
  let refreshTimer = null;
  let dayCheckTimer = null;
  let loading = false;

  function localDateString(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function getMonday(date) {
    const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const day = (copy.getDay() + 6) % 7;
    copy.setDate(copy.getDate() - day);
    return copy;
  }

  function addDays(date, days) {
    const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    copy.setDate(copy.getDate() + days);
    return copy;
  }

  function getPlanningMonday(date) {
    const monday = getMonday(date);
    return (date.getDay() === 6 || date.getDay() === 0)
      ? addDays(monday, 7)
      : monday;
  }

  function formatDate(date, options) {
    return new Intl.DateTimeFormat('sk-SK', options).format(date);
  }

  function setMessage(message, isError = false) {
    elements.appMessage.textContent = message;
    elements.appMessage.style.color = isError ? '#bd4141' : '#65728a';
  }

  function updateWeekLabel() {
    const friday = addDays(weekStart, 4);
    const startMonth = formatDate(weekStart, { month: 'long' });
    const endMonth = formatDate(friday, { month: 'long' });
    const year = friday.getFullYear();
    elements.weekLabel.textContent = startMonth === endMonth
      ? `${weekStart.getDate()}. – ${friday.getDate()}. ${endMonth} ${year}`
      : `${weekStart.getDate()}. ${startMonth} – ${friday.getDate()}. ${endMonth} ${year}`;
  }

  function renderGrid(members, attendance) {
    updateWeekLabel();
    const days = Array.from({ length: 5 }, (_, i) => addDays(weekStart, i));
    const today = localDateString(new Date());
    const byCell = new Map();
    attendance.forEach((row) => {
      byCell.set(`${row.member_id}:${row.day}`, row.status);
    });

    if (!members.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.textContent = 'Zatiaľ tu nikto nie je. Pridaj svoje meno nižšie a označ dni, kedy prídeš.';
      elements.grid.replaceChildren(empty);
      return;
    }

    const table = document.createElement('table');
    table.className = 'planner-table';
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const nameHeader = document.createElement('th');
    nameHeader.textContent = 'MENO';
    headerRow.appendChild(nameHeader);

    days.forEach((day) => {
      const th = document.createElement('th');
      if (localDateString(day) === today) th.classList.add('today-header', 'today-column');
      const dayName = document.createElement('span');
      dayName.className = 'day-name';
      dayName.textContent = formatDate(day, { weekday: 'long' }).replace(/^./, c => c.toLocaleUpperCase('sk-SK'));
      const dayDate = document.createElement('span');
      dayDate.className = 'day-date';
      dayDate.textContent = formatDate(day, { day: 'numeric', month: 'short' });
      th.append(dayName, dayDate);
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    members.forEach((member) => {
      const row = document.createElement('tr');
      const nameCell = document.createElement('td');
      const nameWrap = document.createElement('div');
      nameWrap.className = 'person-name';
      const avatar = document.createElement('span');
      avatar.className = 'avatar';
      avatar.textContent = member.name.trim().split(/\s+/).slice(0, 2).map(part => part[0] || '').join('');
      const name = document.createElement('span');
      name.textContent = member.name;
      nameWrap.append(avatar, name);
      nameCell.appendChild(nameWrap);
      row.appendChild(nameCell);

      days.forEach((day) => {
        const dayString = localDateString(day);
        const cell = document.createElement('td');
        if (dayString === today) cell.classList.add('today-column');
        const group = document.createElement('div');
        group.className = 'status-group';
        const currentStatus = byCell.get(`${member.id}:${dayString}`) || '';
        Object.entries(STATUS).forEach(([statusKey, info]) => {
          const button = document.createElement('button');
          button.type = 'button';
          button.className = `status-button ${info.className}`;
          button.textContent = info.symbol;
          button.title = info.label;
          button.setAttribute('aria-label', `${member.name}, ${formatDate(day, { weekday: 'long', day: 'numeric', month: 'long' })}: ${info.label}`);
          button.setAttribute('aria-pressed', String(currentStatus === statusKey));
          button.addEventListener('click', () => saveStatus(member.id, dayString, statusKey));
          group.appendChild(button);
        });
        cell.appendChild(group);
        row.appendChild(cell);
      });
      tbody.appendChild(row);
    });
    table.appendChild(tbody);
    elements.grid.replaceChildren(table);
  }

  async function loadWeek(silent = false) {
    if (loading) return;
    loading = true;
    if (!silent) {
      elements.grid.innerHTML = '<div class="loading-state">Načítavam plán…</div>';
    }
    const start = localDateString(weekStart);
    const end = localDateString(addDays(weekStart, 5));
    try {
      const [membersResult, attendanceResult] = await Promise.all([
        client.from('team_members').select('id,name').order('name', { ascending: true }),
        client.from('office_attendance').select('member_id,day,status').gte('day', start).lt('day', end)
      ]);
      if (membersResult.error) throw membersResult.error;
      if (attendanceResult.error) throw attendanceResult.error;
      renderGrid(membersResult.data || [], attendanceResult.data || []);
      if (!silent) setMessage('Plán je aktuálny. Zmeny sa ukladajú automaticky.');
    } catch (error) {
      elements.grid.innerHTML = '<div class="empty-state">Nepodarilo sa načítať plán. Skontroluj internetové pripojenie.</div>';
      setMessage(error.message || 'Chyba pri načítaní údajov.', true);
    } finally {
      loading = false;
    }
  }

  async function saveStatus(memberId, day, status) {
    setMessage('Ukladám zmenu…');
    const { error } = await client.from('office_attendance').upsert(
      { member_id: memberId, day, status },
      { onConflict: 'member_id,day' }
    );
    if (error) {
      setMessage(error.message || 'Zmenu sa nepodarilo uložiť.', true);
      return;
    }
    await loadWeek(true);
    setMessage('Hotovo, zmena je uložená.');
  }

  elements.addPersonForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const name = elements.nameInput.value.trim().replace(/\s+/g, ' ');
    if (!name) return;
    const button = elements.addPersonForm.querySelector('button[type="submit"]');
    button.disabled = true;
    setMessage('Pridávam meno…');
    try {
      const { error } = await client.from('team_members').insert({ name });
      if (error) {
        if (error.code === '23505') {
          throw new Error('Tvoje meno už v zozname je. Nájdeš ho v tabuľke vyššie.');
        }
        throw error;
      }
      elements.nameInput.value = '';
      await loadWeek(true);
      setMessage(`Vitaj v pláne, ${name}! Teraz si vyber stavy pri jednotlivých dňoch.`);
    } catch (error) {
      setMessage(error.message || 'Meno sa nepodarilo pridať.', true);
    } finally {
      button.disabled = false;
    }
  });

  elements.prevWeek.addEventListener('click', () => {
    weekStart = addDays(weekStart, -7);
    loadWeek();
  });
  elements.nextWeek.addEventListener('click', () => {
    weekStart = addDays(weekStart, 7);
    loadWeek();
  });
  elements.thisWeek.addEventListener('click', () => {
    weekStart = getPlanningMonday(new Date());
    lastAutomaticWeek = localDateString(weekStart);
    loadWeek();
  });
  elements.refreshButton.addEventListener('click', () => loadWeek());

  function checkForNewPlanningWeek() {
    const nextPlanningMonday = getPlanningMonday(new Date());
    const nextKey = localDateString(nextPlanningMonday);
    if (nextKey === lastAutomaticWeek) return;
    lastAutomaticWeek = nextKey;
    weekStart = nextPlanningMonday;
    loadWeek();
  }

  // Pravidelné obnovenie zdieľaných údajov a automatický prechod na nový týždeň.
  refreshTimer = window.setInterval(() => {
    checkForNewPlanningWeek();
    loadWeek(true);
  }, 20000);
  dayCheckTimer = window.setInterval(checkForNewPlanningWeek, 60000);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      checkForNewPlanningWeek();
      loadWeek(true);
    }
  });
  window.addEventListener('focus', () => {
    checkForNewPlanningWeek();
    loadWeek(true);
  });

  loadWeek();
})();