import fs from 'fs';

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomBool = (prob = 0.5) => Math.random() < prob;

// --- MOCK DATA POOLS ---
const vehicleMakes = ['Rolls-Royce', 'Mercedes-Benz', 'Range Rover', 'Bentley'];
const vehicleModels = {
  'Rolls-Royce': ['Phantom', 'Ghost', 'Cullinan'],
  'Mercedes-Benz': ['S-Class', 'V-Class', 'Maybach S680', 'EQS'],
  'Range Rover': ['Autobiography', 'SV', 'Vogue'],
  'Bentley': ['Flying Spur', 'Bentayga']
};
const namesFirst = ['Julian', 'Elena', 'Marcus', 'Sienna', 'Arthur', 'Lila', 'Jordan', 'Alexander', 'Victoria', 'Sebastian', 'Isabella', 'William', 'Charlotte', 'Thomas', 'Grace', 'Henry', 'Sophia', 'Jack', 'Amelia', 'Oliver', 'Mia', 'Leo', 'Evelyn'];
const namesLast = ['Sterling', 'Vance', 'Chen', 'Brooks', 'Pendragon', 'West', 'Smith', 'Hughes', 'Croft', 'Rossi', 'Churchill', 'Windsor', 'Mountbatten', 'Astor', 'Grosvenor', 'Cavendish', 'Rothschild', 'Spencer'];
const sectors = ['Hedge Fund / Private Equity', 'Family Office', 'Defense Tech', 'Aeronautics', 'Entertainment', 'Corporate Law', 'Real Estate', 'Diplomatic'];
const companyNames = ['Aetheris Global Holdings', 'Lumina Wealth Management', 'Veridian Systems', 'Onyx Kinetix', 'Summit Capital', 'Vanguard Aerospace', 'Crescent Properties', 'Aegis Security', 'Nexus Communications', 'Helios Energy', 'Meridian Logistics', 'Starlight Media', 'Quantum Computing', 'Horizon Biotech', 'Equinox Trading'];

const vehicleImages = [
  'https://images.unsplash.com/photo-1631477091219-c4fb5ebda941?w=400&q=80',
  'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400&q=80',
  'https://images.unsplash.com/photo-1606016159991-dde6571abfb2?w=400&q=80',
  'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400&q=80',
  'https://images.unsplash.com/photo-1563720225384-9c0560e0a14f?w=400&q=80',
];

const chauffeurPortraits = [
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80',
  'https://images.unsplash.com/photo-1556157382-97eda2d62296?w=400&q=80',
];

const corporateLogos = [
  'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=400&q=80',
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&q=80',
  'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80',
  'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400&q=80',
];

const pastDate = (daysAgo) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};

const futureDate = (daysAhead) => {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split('T')[0];
};

const makeId = (prefix, length) => prefix + '-' + Math.random().toString(36).substr(2, length).toUpperCase();
const formatCurrency = (val) => '$' + val.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});

// --- GENERATORS ---

const vehicles = Array.from({length: 20}).map((_, i) => {
  const make = randomChoice(vehicleMakes);
  const model = randomChoice(vehicleModels[make]);
  const statuses = ['Active', 'In Maintenance', 'Assigned'];
  const statusColors = {'Active': '#34C759', 'In Maintenance': '#ffcccc', 'Assigned': '#d8b4fe'};
  const status = randomChoice(statuses);
  
  return {
    id: `VLO-${8000 + i}`,
    make,
    model,
    image: randomChoice(vehicleImages),
    registration: `LD${randomInt(10, 24)} ${String.fromCharCode(65+randomInt(0,25))}${String.fromCharCode(65+randomInt(0,25))}${String.fromCharCode(65+randomInt(0,25))}`,
    status,
    statusColor: statusColors[status],
    year: randomInt(2021, 2024),
    vin: makeId('VIN', 10),
    mileage: randomInt(500, 45000),
    alerts: randomInt(0, 3) === 0 ? randomInt(1, 4) : 0,
    complianceStatus: randomBool(0.8) ? 'VERIFIED' : 'PENDING',
    motExpiry: futureDate(randomInt(30, 300)),
    insuranceExpiry: futureDate(randomInt(10, 200)),
    faults: Array.from({length: randomInt(0, 5)}).map(() => ({
      date: pastDate(randomInt(1, 60)),
      issue: randomChoice(['Brake pad wear', 'Tire pressure sensor', 'Oil change due', 'Minor scratch on rear bumper', 'Cabin filter replacement']),
      status: randomChoice(['Resolved', 'Pending'])
    }))
  };
});

const chauffeurs = Array.from({length: 20}).map((_, i) => {
  const isVip = randomBool(0.2);
  const st = randomChoice(['ON-SHIFT', 'OFF-DUTY', 'IN-TRANSIT', 'EXPIRED PCO']);
  let sClass = 'neutral';
  if (st === 'ON-SHIFT' || st === 'IN-TRANSIT') sClass = 'warning';
  if (st === 'EXPIRED PCO') sClass = 'danger';

  let c = 'Compliant';
  let cClass = 'success';
  if (st === 'EXPIRED PCO') { c = 'Compliance Alert'; cClass = 'danger'; }
  else if (randomBool(0.1)) { c = 'Pending Check'; cClass = 'pending'; }

  return {
    id: `VEO-${9000 + i}`,
    name: `${randomChoice(namesFirst)} ${randomChoice(namesLast)}`,
    image: randomChoice(chauffeurPortraits),
    stars: randomInt(4, 5),
    status: st,
    statusType: sClass,
    compliance: c,
    complianceType: cClass,
    hasImage: randomBool(0.9),
    dob: pastDate(randomInt(10000, 18000)),
    mobile: `+44 7${randomInt(100,999)} ${randomInt(100000, 999999)}`,
    email: `driver${i}@velo-executive.com`,
    address: `${randomInt(1, 100)} Random St, London`,
    pcoExpiry: futureDate(randomInt(-10, 300)),
    dbsExpiry: futureDate(randomInt(50, 400)),
    rating: (randomInt(45, 50) / 10).toFixed(2),
    jobsCompleted: randomInt(50, 3000),
    tenure: (randomInt(1, 80) / 10).toFixed(1),
    shifts: Array.from({length: randomInt(5, 15)}).map(() => ({
      date: pastDate(randomInt(1, 30)),
      duration: randomInt(4, 12),
      earnings: randomInt(150, 600)
    }))
  };
});

const corporateClients = Array.from({length: 15}).map((_, i) => {
  const status = randomChoice(['ACTIVE ACCOUNT', 'UNDER REVIEW', 'ON-HOLD']);
  const sc = status === 'ACTIVE ACCOUNT' ? 'active-acc' : (status === 'UNDER REVIEW' ? 'review' : 'on-hold');
  return {
    id: `CORP-${100 + i}`,
    name: companyNames[i % companyNames.length],
    logo: randomChoice(corporateLogos),
    sector: randomChoice(sectors),
    balance: formatCurrency(randomInt(10000, 2500000)),
    manager: `${randomChoice(namesFirst)} ${randomChoice(namesLast)}`,
    status: status,
    statusClass: sc,
    creditLimit: formatCurrency(randomInt(50000, 5000000)),
    tier: randomChoice(['EXECUTIVE ELITE', 'PLATINUM', 'CORE']),
    contact: {
      primaryPhone: `+44 20 ${randomInt(7000, 8999)} ${randomInt(1000, 9999)}`,
      financePhone: `+44 20 ${randomInt(7000, 8999)} ${randomInt(1000, 9999)}`,
      primaryContact: `${randomChoice(namesFirst)} ${randomChoice(namesLast)}`,
      financeEmail: `finance@${companyNames[i % companyNames.length].toLowerCase().replace(/ /g, '')}.com`,
    },
    authorizedUsers: Array.from({length: randomInt(2, 6)}).map(() => ({
      name: `${randomChoice(namesFirst)} ${randomChoice(namesLast)}`,
      role: randomChoice(['Managing Director', 'Executive Assistant', 'Operations Manager', 'Former Employee']),
      email: `${makeId('user', 4).toLowerCase()}@${companyNames[i % companyNames.length].toLowerCase().replace(/ /g, '')}.com`,
      phone: `+44 7${randomInt(100,999)} ${randomInt(100000, 999999)}`,
      status: randomChoice(['Booking Permitted', 'Booking Revoked'])
    })),
    invoices: Array.from({length: randomInt(5, 8)}).map(() => {
      const invStatus = randomChoice(['PAID', 'OUTSTANDING', 'UPCOMING']);
      return {
        id: makeId('#INV', 6),
        date: pastDate(randomInt(0, 100)),
        amount: formatCurrency(randomInt(5000, 25000)),
        status: invStatus, // 'PAID' (Green), 'OUTSTANDING' (Purple), 'UPCOMING' (Yellow)
        trips: Array.from({length: randomInt(3, 8)}).map(() => ({
          taskId: makeId('#VELO', 5),
          route: `${randomChoice(['LHR', 'LCY', 'Mayfair', 'Chelsea'])} to ${randomChoice(['Farnborough', 'The O2', 'LGW', 'City'])}`,
          date: pastDate(randomInt(0, 100)),
          cost: formatCurrency(randomInt(150, 800))
        }))
      };
    })
  };
});

const privateClients = Array.from({length: 15}).map((_, i) => {
  const status = randomChoice(['ACTIVE ACCOUNT', 'VIP EXCLUSIVE', 'UNDER REVIEW']);
  const sc = status === 'ACTIVE ACCOUNT' ? 'active-acc' : (status === 'VIP EXCLUSIVE' ? 'vip' : 'review');
  const name = `${randomChoice(namesFirst)} ${randomChoice(namesLast)}`;
  return {
    id: `PRIV-${300 + i}`,
    name: name,
    type: randomChoice(['VIP Client', 'Royal/Diplomatic', 'High Net Worth', 'Entertainment']),
    spend: formatCurrency(randomInt(5000, 500000)),
    manager: `${randomChoice(namesFirst)} ${randomChoice(namesLast)}`,
    status: status,
    statusClass: sc,
    contact: {
      phone: `+44 7${randomInt(100,999)} ${randomInt(100000, 999999)}`,
      email: `${name.toLowerCase().replace(/ /g, '.')}@private.example.com`,
      assistant: `${randomChoice(namesFirst)} ${randomChoice(namesLast)}`
    },
    rides: Array.from({length: randomInt(2, 8)}).map(() => ({
      taskId: makeId('#VELO', 5),
      date: pastDate(randomInt(2, 60)),
      route: randomChoice(['LHR ➔ Mayfair', 'Kensington ➔ Farnborough', 'Chelsea ➔ LGW', 'Mayfair ➔ The O2']),
      class: randomChoice(['First Class', 'Business Class', 'SUV']),
      security: randomChoice(['CLEARED', 'ENHANCED']),
      status: randomChoice(['Completed', 'Active']),
      driver: `${randomChoice(namesFirst)} ${randomChoice(namesLast)}`,
      vehicle: randomChoice(vehicleModels['Mercedes-Benz']),
      cost: formatCurrency(randomInt(200, 1200))
    }))
  };
});

const ledger = Array.from({length: 60}).map((_, i) => {
  const isCorporate = randomBool(0.6);
  const client = isCorporate ? randomChoice(corporateClients) : randomChoice(privateClients);
  const driver = randomChoice(chauffeurs);
  const vehicle = randomChoice(vehicles);
  const status = randomChoice(['Completed', 'Active', 'Scheduled', 'Cancelled']);
  
  return {
    id: `JOB-${5000 + i}`,
    clientType: isCorporate ? 'Corporate' : 'Private',
    clientId: client.id,
    clientName: client.name,
    driverId: driver.id,
    driverName: driver.name,
    vehicleId: vehicle.id,
    vehicleMake: vehicle.make,
    status: status,
    date: pastDate(randomInt(-5, 30)),
    value: formatCurrency(randomInt(150, 3500)),
    route: `${randomChoice(['LHR', 'LCY', 'Mayfair', 'Chelsea', 'Canary Wharf'])} ➔ ${randomChoice(['Farnborough', 'The O2', 'Soho', 'Knightsbridge', 'LGW'])}`
  };
});

const activeTasks = ledger.filter(l => l.status === 'Active' || l.status === 'Scheduled').map(t => ({
  id: t.id,
  chauffeur: t.driverName,
  vehicle: t.vehicleMake,
  client: t.clientName,
  status: t.status,
  eta: `${randomInt(5, 45)} MINS`,
  progress: randomInt(0, 100),
  lat: 51.5074 + (Math.random() - 0.5) * 0.1,
  lng: -0.1278 + (Math.random() - 0.5) * 0.1
}));

const staffRoles = ['Dispatcher', 'Admin', 'Compliance Officer', 'Fleet Coordinator', 'Customer Success'];
const staff = Array.from({length: 25}).map((_, i) => ({
  id: `EMP-${1000 + i}`,
  name: `${randomChoice(namesFirst)} ${randomChoice(namesLast)}`,
  role: randomChoice(staffRoles),
  image: randomChoice(chauffeurPortraits),
  status: randomChoice(['Active', 'On Leave', 'Shift Complete']),
  shiftAvailability: randomChoice(['Morning', 'Evening', 'Night', 'Flexible']),
  schedule: Array.from({length: 7}).map((_, j) => ({
    day: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][j],
    shift: randomBool(0.7) ? `${randomInt(6, 14)}:00 - ${randomInt(15, 22)}:00` : 'OFF'
  }))
}));

// Generates 15 threads PER client
const threads = [];
const generateThreads = (clients, type) => {
  clients.forEach(client => {
    for (let i = 0; i < 15; i++) {
      threads.push({
        id: makeId('MSG', 5),
        clientName: client.name,
        clientType: type,
        subject: randomChoice(['Booking Change Request', 'Invoice Inquiry', 'Chauffeur Preference', 'Urgent Airport Pickup', 'Luggage Capacity Check', 'Address Update', 'Security Detail Clarification']),
        status: randomChoice(['Urgent', 'In-Progress', 'Archived']),
        lastMessageTime: pastDate(randomInt(0, 5)),
        preview: 'Please confirm the vehicle can accommodate 4 large suitcases...',
        messages: [
          {
            sender: client.name,
            time: pastDate(randomInt(0, 5)),
            text: 'Could you please provide an update on this? The requirements have slightly shifted.'
          },
          {
            sender: 'System Admin',
            time: pastDate(randomInt(0, 3)),
            text: 'Of course. We have received your update and applied the changes to your itinerary.'
          }
        ]
      });
    }
  });
};

generateThreads(corporateClients, 'Corporate');
generateThreads(privateClients, 'Private');

const financials = {
  revenueThisMonth: formatCurrency(randomInt(500000, 2000000)),
  expensesThisMonth: formatCurrency(randomInt(200000, 800000)),
  taxLiability: formatCurrency(randomInt(50000, 200000)),
  complianceDeadlines: [
    { date: futureDate(15), description: 'VAT Return Q2' },
    { date: futureDate(45), description: 'Fleet PCO Renewals' }
  ],
  monthlyData: Array.from({length: 6}).map((_, i) => ({
    month: ['Jan','Feb','Mar','Apr','May','Jun'][i],
    revenue: randomInt(300000, 900000),
    expenses: randomInt(150000, 400000)
  }))
};

const whiteLabelConfigs = {
  companyName: 'Velo Executive Services',
  primaryColor: '#D4AF37',
  secondaryColor: '#070708',
  domain: 'portal.velo-executive.com',
  logoUrl: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=400&q=80'
};

const dbContent = `export const MOCK_VEHICLES = ${JSON.stringify(vehicles, null, 2)};
export const MOCK_CHAUFFEURS = ${JSON.stringify(chauffeurs, null, 2)};
export const MOCK_CORP_CLIENTS = ${JSON.stringify(corporateClients, null, 2)};
export const MOCK_PRIV_CLIENTS = ${JSON.stringify(privateClients, null, 2)};
export const MOCK_LEDGER = ${JSON.stringify(ledger, null, 2)};
export const MOCK_ACTIVE_TASKS = ${JSON.stringify(activeTasks, null, 2)};
export const MOCK_STAFF = ${JSON.stringify(staff, null, 2)};
export const MOCK_THREADS = ${JSON.stringify(threads, null, 2)};
export const MOCK_FINANCIALS = ${JSON.stringify(financials, null, 2)};
export const MOCK_WHITELABEL = ${JSON.stringify(whiteLabelConfigs, null, 2)};
`;

fs.writeFileSync('src/data/mockDatabase.js', dbContent);
console.log('Successfully generated src/data/mockDatabase.js');
