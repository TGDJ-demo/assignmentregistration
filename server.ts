import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { Registration, RegistrationRequest, GoogleSheetsConfig, DateAvailability } from './src/types.js';

const PORT = 3000;
const DATA_DIR = path.join(process.cwd(), 'data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');

interface DBStore {
  eventInfo: {
    title: string;
    subtitle: string;
    location: string;
    description: string;
    availableDates: string[];
  };
  registrations: Registration[];
  sheetsConfig: GoogleSheetsConfig;
}

const DEFAULT_DATES = ['2026-08-10', '2026-08-11', '2026-08-12', '2026-08-13', '2026-08-14'];

function loadDB(): DBStore {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, 'utf-8');
      const store: DBStore = JSON.parse(raw);
      if (!store.registrations) store.registrations = [];
      if (!store.eventInfo) {
        store.eventInfo = {
          title: 'QA & Software Testing Certification Summit 2026',
          subtitle: 'Mastering AI Practices in QA & Automation',
          location: 'Virtual Tech Hub & Certification Portal',
          description: 'Congratulations on taking this crucial step toward completing your certification! This assignment is designed to help you get up to speed with best AI practices in the QA and testing world, strengthening our partnership and advancing your career. Select your access discipline (Web Platform or Mobile Apps) and pick an available date.',
          availableDates: DEFAULT_DATES,
        };
      }
      return store;
    }
  } catch (err) {
    console.error('Error loading DB, creating fresh store:', err);
  }

  const initialStore: DBStore = {
    eventInfo: {
      title: 'QA & Software Testing Certification Summit 2026',
      subtitle: 'Mastering AI Practices in QA & Automation',
      location: 'Virtual Tech Hub & Certification Portal',
      description: 'Congratulations on taking this crucial step toward completing your certification! This assignment is designed to help you get up to speed with best AI practices in the QA and testing world, strengthening our partnership and advancing your career. Select your access discipline (Web Platform or Mobile Apps) and pick an available date.',
      availableDates: DEFAULT_DATES,
    },
    registrations: [
      {
        id: 'reg-demo-1',
        name: 'Alex Rivera',
        email: 'alex.rivera@example.com',
        testerType: 'web',
        date: DEFAULT_DATES[0],
        createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
        ticketCode: 'TKT-8921-WEB',
      },
      {
        id: 'reg-demo-2',
        name: 'Samantha Chen',
        email: 'samantha.chen@example.com',
        testerType: 'mobile',
        date: DEFAULT_DATES[0],
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        ticketCode: 'TKT-4412-MOB',
      },
    ],
    sheetsConfig: {
      autoSync: false,
    },
  };

  saveDB(initialStore);
  return initialStore;
}

function saveDB(store: DBStore) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save DB store:', err);
  }
}

async function startServer() {
  const app = express();
  app.use(express.json());

  let db = loadDB();

  // Calculate availability for dates
  function getDateAvailabilities(): DateAvailability[] {
    return db.eventInfo.availableDates.map(date => {
      const webBooked = db.registrations.filter(r => r.date === date && r.testerType === 'web').length;
      const mobileBooked = db.registrations.filter(r => r.date === date && r.testerType === 'mobile').length;
      return {
        date,
        webBooked,
        webMax: 10,
        mobileBooked,
        mobileMax: 10,
      };
    });
  }

  // API Endpoints

  // GET Event Information
  app.get('/api/event-info', (_req: Request, res: Response) => {
    res.json(db.eventInfo);
  });

  // GET Availability by Date (for Web and Mobile)
  app.get('/api/availability', (req: Request, res: Response) => {
    const date = req.query.date as string | undefined;
    const availabilities = getDateAvailabilities();
    if (date) {
      const found = availabilities.find(a => a.date === date) || {
        date,
        webBooked: 0,
        webMax: 10,
        mobileBooked: 0,
        mobileMax: 10,
      };
      return res.json(found);
    }
    res.json(availabilities);
  });

  // POST Register for an event
  app.post('/api/register', async (req: Request, res: Response) => {
    const { name, email, testerType, date }: RegistrationRequest = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Full name is required.' });
    }
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'A valid email address is required.' });
    }
    if (!testerType || !['web', 'mobile'].includes(testerType)) {
      return res.status(400).json({ error: 'Please select whether you need Web or Mobile access.' });
    }
    if (!date) {
      return res.status(400).json({ error: 'Event date selection is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if user has already registered with this email address
    const existing = db.registrations.find(
      r => r.email.toLowerCase() === cleanEmail
    );
    if (existing) {
      return res.status(400).json({
        error: `You have already picked a date with this email address (${cleanEmail}). Your reserved pass is for ${existing.date} (${existing.testerType === 'web' ? 'Web Platform' : 'Mobile Apps'}) with Ticket Code ${existing.ticketCode}.`,
        alreadyRegistered: true,
        existingRegistration: existing,
      });
    }

    // Check capacity limit for the requested tester type on this date (Max 10 per platform)
    const bookedCount = db.registrations.filter(
      r => r.date === date && r.testerType === testerType
    ).length;

    if (bookedCount >= 10) {
      const platformName = testerType === 'web' ? 'Web Platform' : 'Mobile Apps';
      return res.status(400).json({
        error: `${platformName} access for ${date} is fully booked (10/10 slots reserved). Please select another date.`,
        slotFull: true,
      });
    }

    const ticketCode = `TKT-${Math.floor(1000 + Math.random() * 9000)}-${testerType.toUpperCase()}`;
    const newReg: Registration = {
      id: `reg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      email: cleanEmail,
      testerType,
      date,
      createdAt: new Date().toISOString(),
      ticketCode,
    };

    db.registrations.push(newReg);
    saveDB(db);

    // Trigger external Google Sheets webhook if configured
    if (db.sheetsConfig.webhookUrl) {
      try {
        await fetch(db.sheetsConfig.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'ADD_ROW',
            data: newReg,
            id: newReg.id,
            name: newReg.name,
            email: newReg.email,
            testerType: newReg.testerType,
            date: newReg.date,
            ticketCode: newReg.ticketCode,
            createdAt: newReg.createdAt,
          }),
        });
        db.sheetsConfig.lastSyncTime = new Date().toISOString();
        saveDB(db);
      } catch (err) {
        console.error('Google Sheets Webhook Push Error:', err);
      }
    }

    return res.json({
      success: true,
      message: 'Registration successful!',
      registration: newReg,
    });
  });

  // GET Check existing email registration
  app.get('/api/check-email', (req: Request, res: Response) => {
    const email = req.query.email as string | undefined;
    if (!email) return res.json({ registered: false });

    const cleanEmail = email.trim().toLowerCase();
    const existing = db.registrations.find(r => r.email.toLowerCase() === cleanEmail);
    if (existing) {
      return res.json({ registered: true, existingRegistration: existing });
    }
    return res.json({ registered: false });
  });

  // GET All Registrations (Admin View)
  app.get('/api/registrations', (_req: Request, res: Response) => {
    res.json({
      registrations: db.registrations,
      sheetsConfig: db.sheetsConfig,
      totalCount: db.registrations.length,
      webCount: db.registrations.filter(r => r.testerType === 'web').length,
      mobileCount: db.registrations.filter(r => r.testerType === 'mobile').length,
      availabilities: getDateAvailabilities(),
    });
  });

  // DELETE Registration
  app.delete('/api/registrations/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const initialLen = db.registrations.length;
    db.registrations = db.registrations.filter(r => r.id !== id);
    if (db.registrations.length === initialLen) {
      return res.status(404).json({ error: 'Registration not found' });
    }
    saveDB(db);
    res.json({ success: true, message: 'Registration cancelled and seat released.' });
  });

  // POST Google Sheets Configuration
  app.post('/api/google-sheets/config', (req: Request, res: Response) => {
    const { webhookUrl, spreadsheetId, autoSync } = req.body;
    db.sheetsConfig = {
      webhookUrl: webhookUrl ? webhookUrl.trim() : undefined,
      spreadsheetId: spreadsheetId ? spreadsheetId.trim() : undefined,
      autoSync: Boolean(autoSync),
      lastSyncTime: db.sheetsConfig.lastSyncTime,
    };
    saveDB(db);
    res.json({ success: true, sheetsConfig: db.sheetsConfig });
  });

  // GET Export CSV format for Google Sheets
  app.get('/api/export-csv', (_req: Request, res: Response) => {
    const headers = ['Registration ID', 'Name', 'Email', 'Tester Type', 'Event Date', 'Ticket Code', 'Registered At'];
    const rows = db.registrations.map(r => [
      `"${r.id}"`,
      `"${r.name.replace(/"/g, '""')}"`,
      `"${r.email.replace(/"/g, '""')}"`,
      `"${r.testerType === 'web' ? 'Web Platform' : 'Mobile Apps'}"`,
      `"${r.date}"`,
      `"${r.ticketCode}"`,
      `"${new Date(r.createdAt).toLocaleString()}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="event_registrations.csv"');
    res.status(200).send(csvContent);
  });

  // GET Google Apps Script code template
  app.get('/api/google-sheets/script-template', (_req: Request, res: Response) => {
    const scriptCode = `
// ==========================================
// GOOGLE SHEETS AUTOMATIC REGISTRATION SYNC
// ==========================================
function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Auto-create Header Row if Sheet is empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Registration ID", 
        "Name", 
        "Email", 
        "Platform / Discipline", 
        "Event Date", 
        "Ticket Code", 
        "Registered At"
      ]);
      sheet.getRange("1:1").setFontWeight("bold").setBackground("#e8f0fe");
    }

    // Safely parse post body (handles JSON body or form parameters)
    var rawData = {};
    if (e && e.postData && e.postData.contents) {
      try {
        var parsed = JSON.parse(e.postData.contents);
        rawData = parsed.data || parsed;
      } catch (err) {
        rawData = e.parameter || {};
      }
    } else if (e && e.parameter) {
      rawData = e.parameter;
    }

    // Extract fields with multiple key fallbacks
    var regId = rawData.id || rawData.ticketCode || "";
    var name = rawData.name || rawData.fullName || rawData.Name || "";
    var email = rawData.email || rawData.Email || "";
    var rawType = rawData.testerType || rawData.discipline || rawData.type || "";
    var platform = (rawType === 'web' || rawType === 'Web Platform') ? 'Web Platform' : (rawType === 'mobile' || rawType === 'Mobile Apps') ? 'Mobile Apps' : rawType;
    var eventDate = rawData.date || rawData.eventDate || rawData.Date || "";
    var ticketCode = rawData.ticketCode || rawData.ticket || "";
    var createdAt = rawData.createdAt || rawData.timestamp || new Date().toLocaleString();

    // Append new row to spreadsheet
    sheet.appendRow([
      regId,
      name,
      email,
      platform,
      eventDate,
      ticketCode,
      createdAt
    ]);

    return ContentService.createTextOutput(JSON.stringify({ "result": "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ "result": "error", "message": err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
    `.trim();

    res.json({ scriptCode });
  });

  // POST Reset Demo Data
  app.post('/api/admin/reset-data', (_req: Request, res: Response) => {
    db.registrations = [];
    db.sheetsConfig = { autoSync: false };
    saveDB(db);
    res.json({ success: true, message: 'All registrations reset and seats restored.' });
  });

  // Vite Middleware integration for dev / static for prod
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Event Registration Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
