import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  PLAYERS: 'nm_players',
  TEAMS: 'nm_teams',
  TOURNAMENTS: 'nm_tournaments',
  SPONSORS: 'nm_sponsors',
  TASKS: 'nm_tasks',
  NOTES: 'nm_notes',
  USER: 'nm_user',
};

const generateId = () => Math.random().toString(36).substr(2, 9) + Date.now().toString(36);

// ─── Generic helpers ────────────────────────────────────────────────────────

const getAll = async (key) => {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveAll = async (key, data) => {
  await AsyncStorage.setItem(key, JSON.stringify(data));
};

// ─── Players ────────────────────────────────────────────────────────────────

export const getPlayers = () => getAll(KEYS.PLAYERS);

export const addPlayer = async (player) => {
  const players = await getPlayers();
  const newPlayer = { ...player, id: generateId(), createdAt: new Date().toISOString() };
  await saveAll(KEYS.PLAYERS, [...players, newPlayer]);
  return newPlayer;
};

export const updatePlayer = async (id, updates) => {
  const players = await getPlayers();
  const updated = players.map((p) => (p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p));
  await saveAll(KEYS.PLAYERS, updated);
};

export const deletePlayer = async (id) => {
  const players = await getPlayers();
  await saveAll(KEYS.PLAYERS, players.filter((p) => p.id !== id));
};

// ─── Teams ──────────────────────────────────────────────────────────────────

export const getTeams = () => getAll(KEYS.TEAMS);

export const addTeam = async (team) => {
  const teams = await getTeams();
  const newTeam = { ...team, id: generateId(), createdAt: new Date().toISOString() };
  await saveAll(KEYS.TEAMS, [...teams, newTeam]);
  return newTeam;
};

export const updateTeam = async (id, updates) => {
  const teams = await getTeams();
  await saveAll(KEYS.TEAMS, teams.map((t) => (t.id === id ? { ...t, ...updates } : t)));
};

export const deleteTeam = async (id) => {
  const teams = await getTeams();
  await saveAll(KEYS.TEAMS, teams.filter((t) => t.id !== id));
};

// ─── Tournaments ─────────────────────────────────────────────────────────────

export const getTournaments = () => getAll(KEYS.TOURNAMENTS);

export const addTournament = async (tournament) => {
  const list = await getTournaments();
  const item = { ...tournament, id: generateId(), createdAt: new Date().toISOString() };
  await saveAll(KEYS.TOURNAMENTS, [...list, item]);
  return item;
};

export const updateTournament = async (id, updates) => {
  const list = await getTournaments();
  await saveAll(KEYS.TOURNAMENTS, list.map((t) => (t.id === id ? { ...t, ...updates } : t)));
};

export const deleteTournament = async (id) => {
  const list = await getTournaments();
  await saveAll(KEYS.TOURNAMENTS, list.filter((t) => t.id !== id));
};

// ─── Sponsors ────────────────────────────────────────────────────────────────

export const getSponsors = () => getAll(KEYS.SPONSORS);

export const addSponsor = async (sponsor) => {
  const list = await getSponsors();
  const item = { ...sponsor, id: generateId(), createdAt: new Date().toISOString() };
  await saveAll(KEYS.SPONSORS, [...list, item]);
  return item;
};

export const updateSponsor = async (id, updates) => {
  const list = await getSponsors();
  await saveAll(KEYS.SPONSORS, list.map((s) => (s.id === id ? { ...s, ...updates } : s)));
};

export const deleteSponsor = async (id) => {
  const list = await getSponsors();
  await saveAll(KEYS.SPONSORS, list.filter((s) => s.id !== id));
};

// ─── Tasks ───────────────────────────────────────────────────────────────────

export const getTasks = () => getAll(KEYS.TASKS);

export const addTask = async (task) => {
  const list = await getTasks();
  const item = { ...task, id: generateId(), completed: false, createdAt: new Date().toISOString() };
  await saveAll(KEYS.TASKS, [...list, item]);
  return item;
};

export const updateTask = async (id, updates) => {
  const list = await getTasks();
  await saveAll(KEYS.TASKS, list.map((t) => (t.id === id ? { ...t, ...updates } : t)));
};

export const deleteTask = async (id) => {
  const list = await getTasks();
  await saveAll(KEYS.TASKS, list.filter((t) => t.id !== id));
};

// ─── Notes ───────────────────────────────────────────────────────────────────

export const getNotes = () => getAll(KEYS.NOTES);

export const addNote = async (note) => {
  const list = await getNotes();
  const item = { ...note, id: generateId(), createdAt: new Date().toISOString() };
  await saveAll(KEYS.NOTES, [...list, item]);
  return item;
};

export const deleteNote = async (id) => {
  const list = await getNotes();
  await saveAll(KEYS.NOTES, list.filter((n) => n.id !== id));
};

// ─── User / Auth ──────────────────────────────────────────────────────────────

export const getUser = async () => {
  try {
    const raw = await AsyncStorage.getItem(KEYS.USER);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const saveUser = async (user) => {
  await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
};

export const clearUser = async () => {
  await AsyncStorage.removeItem(KEYS.USER);
};

// ─── Seed demo data ──────────────────────────────────────────────────────────

export const seedDemoData = async () => {
  const existing = await getPlayers();
  if (existing.length > 0) return;

  const demoPlayers = [
    { name: 'ShadowBlade', game: 'Valorant', role: 'Duelist', rank: 'Radiant', status: 'Active', contact: '+91 98765 43210', email: 'shadow@nm.gg' },
    { name: 'NightKing', game: 'BGMI', role: 'IGL', rank: 'Conqueror', status: 'Active', contact: '+91 87654 32109', email: 'nightking@nm.gg' },
    { name: 'PhantomX', game: 'Valorant', role: 'Sentinel', rank: 'Immortal', status: 'Active', contact: '+91 76543 21098', email: 'phantomx@nm.gg' },
    { name: 'DarkMatter', game: 'COD Mobile', role: 'Sniper', rank: 'Legend', status: 'Trial', contact: '+91 65432 10987', email: 'dark@nm.gg' },
  ];

  for (const p of demoPlayers) await addPlayer(p);

  await addTeam({ name: 'NightMare Valorant', game: 'Valorant', coach: 'CoachNM', wins: 12, losses: 3, status: 'Active' });
  await addTeam({ name: 'NightMare BGMI', game: 'BGMI', coach: 'TacticsX', wins: 8, losses: 5, status: 'Active' });

  await addTournament({ name: 'VCT Challengers India', game: 'Valorant', date: '2025-03-15', prize: '₹2,00,000', status: 'Upcoming', placement: '-' });
  await addTournament({ name: 'BGMI Masters Series', game: 'BGMI', date: '2025-02-28', prize: '₹5,00,000', status: 'Registered', placement: '-' });
  await addTournament({ name: 'Node Cup S3', game: 'Valorant', date: '2025-01-20', prize: '₹50,000', status: 'Completed', placement: '1st' });

  await addSponsor({ name: 'GearUp Gaming', tier: 'Title', value: '₹5,00,000', contact: 'priya@gearup.in', status: 'Active', renewDate: '2025-12-31' });
  await addSponsor({ name: 'NightFuel Energy', tier: 'Co-Title', value: '₹2,00,000', contact: 'deals@nightfuel.com', status: 'Active', renewDate: '2025-06-30' });

  await addTask({ title: 'Review tryout applications', priority: 'High', dueDate: '2025-02-10', assignee: 'Manager' });
  await addTask({ title: 'Renew GearUp contract', priority: 'Critical', dueDate: '2025-03-01', assignee: 'Owner' });
  await addTask({ title: 'Book bootcamp venue', priority: 'Medium', dueDate: '2025-02-20', assignee: 'Operations' });
};
