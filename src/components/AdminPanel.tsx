import React, { useState, useEffect } from 'react';
import { Registration, GoogleSheetsConfig, DateAvailability } from '../types';
import { generateAvailableDates } from '../utils/dateUtils';
import { Download, Search, RefreshCw, Trash2, FileSpreadsheet, CheckCircle2, Copy, ExternalLink, Users, Monitor, Smartphone, Calendar as CalendarIcon, Sparkles } from 'lucide-react';

const DEFAULT_APPS_SCRIPT = `
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

    var regId = rawData.id || rawData.ticketCode || "";
    var name = rawData.name || rawData.fullName || rawData.Name || "";
    var email = rawData.email || rawData.Email || "";
    var rawType = rawData.testerType || rawData.discipline || rawData.type || "";
    var platform = (rawType === 'web' || rawType === 'Web Platform') ? 'Web Platform' : (rawType === 'mobile' || rawType === 'Mobile Apps') ? 'Mobile Apps' : rawType;
    var eventDate = rawData.date || rawData.eventDate || rawData.Date || "";
    var ticketCode = rawData.ticketCode || rawData.ticket || "";
    var createdAt = rawData.createdAt || rawData.timestamp || new Date().toLocaleString();

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

const HARDCODED_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbx42LzjESb5CnTx7UZwsYL2MMg26y5a5hf2rmS0JO6Ztq5a7P-sIdTnDyfXVFybrE6c/exec';

interface AdminPanelProps {
  availableDates: string[];
  onRefreshData?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ availableDates, onRefreshData }) => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [, setSheetsConfig] = useState<GoogleSheetsConfig>({ autoSync: true, webhookUrl: HARDCODED_WEBHOOK_URL });
  const [availabilities, setAvailabilities] = useState<DateAvailability[]>([]);
  const [, setLoading] = useState<boolean>(true);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterDate] = useState<string>('all');

  const [webhookUrl, setWebhookUrl] = useState<string>(HARDCODED_WEBHOOK_URL);
  const [savingConfig, setSavingConfig] = useState<boolean>(false);
  const [configSuccessMsg, setConfigSuccessMsg] = useState<string | null>(null);
  const [scriptTemplate, setScriptTemplate] = useState<string>(DEFAULT_APPS_SCRIPT);
  const [showScriptModal, setShowScriptModal] = useState<boolean>(false);
  const [copiedScript, setCopiedScript] = useState<boolean>(false);

  useEffect(() => {
    fetchRegistrationsAndAvailabilities();
    fetchScriptTemplate();
  }, []);

  const fetchRegistrationsAndAvailabilities = async () => {
    setLoading(true);
    try {
      let serverRegs: Registration[] = [];
      let serverAvails: DateAvailability[] = [];

      try {
        const [regRes, availRes] = await Promise.all([
          fetch('/api/registrations'),
          fetch('/api/availability'),
        ]);

        if (regRes.ok) {
          const regData = await regRes.json();
          serverRegs = regData.registrations || [];
          setSheetsConfig(regData.sheetsConfig || { autoSync: true, webhookUrl: HARDCODED_WEBHOOK_URL });
          const url = regData.sheetsConfig?.webhookUrl || localStorage.getItem('sheets_webhook_url') || HARDCODED_WEBHOOK_URL;
          setWebhookUrl(url);
          localStorage.setItem('sheets_webhook_url', url);
        } else {
          const url = localStorage.getItem('sheets_webhook_url') || HARDCODED_WEBHOOK_URL;
          setWebhookUrl(url);
          localStorage.setItem('sheets_webhook_url', url);
        }

        if (availRes.ok) {
          serverAvails = await availRes.json();
        }
      } catch (_) {
        const url = localStorage.getItem('sheets_webhook_url') || HARDCODED_WEBHOOK_URL;
        setWebhookUrl(url);
        localStorage.setItem('sheets_webhook_url', url);
      }

      let localRegs: Registration[] = [];
      try {
        const stored = localStorage.getItem('registrations_list');
        if (stored) localRegs = JSON.parse(stored);
      } catch (_) {}

      const map = new Map<string, Registration>();
      [...serverRegs, ...localRegs].forEach(r => {
        if (r && r.id) map.set(r.id, r);
        else if (r && r.email && r.date) map.set(`${r.email}-${r.date}`, r);
      });
      const combinedRegs = Array.from(map.values());
      setRegistrations(combinedRegs);

      try {
        localStorage.setItem('registrations_list', JSON.stringify(combinedRegs));
      } catch (_) {}

      const dates = availableDates.length > 0 ? availableDates : generateAvailableDates();
      const calculatedAvails: DateAvailability[] = dates.map(date => {
        const dateRegs = combinedRegs.filter(r => r.date === date);
        const webBooked = dateRegs.filter(r => {
          const t = String(r.testerType);
          return t === 'web' || t === 'Web Platform' || !r.testerType;
        }).length;
        const mobileBooked = dateRegs.filter(r => {
          const t = String(r.testerType);
          return t === 'mobile' || t === 'Mobile Apps';
        }).length;

        const serverMatch = serverAvails.find(a => a.date === date);
        const finalWebBooked = Math.max(webBooked, serverMatch ? serverMatch.webBooked : 0);
        const finalMobileBooked = Math.max(mobileBooked, serverMatch ? serverMatch.mobileBooked : 0);

        return {
          date,
          webBooked: finalWebBooked,
          webMax: 10,
          mobileBooked: finalMobileBooked,
          mobileMax: 10,
        };
      });

      setAvailabilities(calculatedAvails);
    } catch (err) {
      console.error('Failed to fetch admin data', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchScriptTemplate = async () => {
    try {
      const res = await fetch('/api/google-sheets/script-template');
      if (res.ok) {
        const data = await res.json();
        setScriptTemplate(data.scriptCode);
      }
    } catch (err) {
      console.error('Failed to load Apps Script template', err);
    }
  };

  const handleDeleteRegistration = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to cancel registration for ${name}?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/registrations/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchRegistrationsAndAvailabilities();
        if (onRefreshData) onRefreshData();
      }
    } catch (err) {
      console.error('Error deleting registration', err);
    }
  };

  const handleSaveSheetsConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    setConfigSuccessMsg(null);
    if (webhookUrl) {
      localStorage.setItem('sheets_webhook_url', webhookUrl);
    }
    try {
      const res = await fetch('/api/google-sheets/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl, autoSync: true }),
      });
      if (res.ok) {
        const data = await res.json();
        setSheetsConfig(data.sheetsConfig);
        setConfigSuccessMsg('Google Sheets webhook saved!');
        setTimeout(() => setConfigSuccessMsg(null), 5000);
      } else {
        setConfigSuccessMsg('Google Sheets webhook saved locally!');
        setTimeout(() => setConfigSuccessMsg(null), 5000);
      }
    } catch (err) {
      console.error('Failed to save config:', err);
      setConfigSuccessMsg('Google Sheets webhook saved locally!');
      setTimeout(() => setConfigSuccessMsg(null), 5000);
    } finally {
      setSavingConfig(false);
    }
  };

  const handleResetData = async () => {
    if (!window.confirm('Reset all registration data back to default state?')) return;
    try {
      const res = await fetch('/api/admin/reset-data', { method: 'POST' });
      if (res.ok) {
        fetchRegistrationsAndAvailabilities();
        if (onRefreshData) onRefreshData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const copyScriptToClipboard = () => {
    navigator.clipboard.writeText(scriptTemplate);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 3000);
  };

  const filteredRegistrations = registrations.filter(r => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.ticketCode.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = filterType === 'all' || r.testerType === filterType;
    const matchesDate = filterDate === 'all' || r.date === filterDate;

    return matchesSearch && matchesType && matchesDate;
  });

  const webCount = registrations.filter(r => r.testerType === 'web').length;
  const mobileCount = registrations.filter(r => r.testerType === 'mobile').length;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 animate-in fade-in duration-300">
      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 bg-[#101728]/70 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-between shadow-lg">
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Total Registrations</span>
            <span className="text-lg font-bold text-white mt-0.5 block">{registrations.length}</span>
          </div>
          <div className="p-2 bg-gradient-to-br from-indigo-500/20 to-pink-500/20 text-indigo-300 border border-white/10 rounded-xl">
            <Users className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 bg-[#101728]/70 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-between shadow-lg">
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Web Platform</span>
            <span className="text-lg font-bold text-white mt-0.5 block">{webCount}</span>
          </div>
          <div className="p-2 bg-gradient-to-br from-indigo-500/20 to-pink-500/20 text-indigo-300 border border-white/10 rounded-xl">
            <Monitor className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 bg-[#101728]/70 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-between shadow-lg">
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Mobile Apps</span>
            <span className="text-lg font-bold text-white mt-0.5 block">{mobileCount}</span>
          </div>
          <div className="p-2 bg-gradient-to-br from-pink-500/20 to-purple-500/20 text-pink-300 border border-white/10 rounded-xl">
            <Smartphone className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Google Sheets Integration */}
      <div className="bg-[#101728]/70 backdrop-blur-xl text-white rounded-2xl p-4 border border-white/10 space-y-3 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="inline-flex items-center space-x-1.5 bg-white/5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold text-indigo-200 border border-white/10 backdrop-blur-md">
              <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-300" />
              <span>Google Sheets Integration</span>
            </div>
            <h3 className="text-sm font-bold text-white">Live Registration Sync</h3>
            <p className="text-slate-400 text-xs">
              Registrations automatically sync to Google Sheets webhook.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href="/api/export-csv"
              download="event_registrations.csv"
              className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold rounded-xl text-xs transition-colors flex items-center space-x-1.5 cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </a>

            <button
              type="button"
              onClick={() => setShowScriptModal(true)}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 font-semibold rounded-xl text-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-pink-300" />
              <span>Apps Script</span>
            </button>
          </div>
        </div>

        {/* Webhook Form */}
        <form onSubmit={handleSaveSheetsConfig} className="pt-2.5 border-t border-white/10 space-y-1">
          <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Google Apps Script Webhook URL
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="url"
              placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
              value={webhookUrl}
              onChange={e => setWebhookUrl(e.target.value)}
              className="flex-1 px-3.5 py-1.5 bg-[#0A0D15]/80 border border-white/10 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-400/80"
            />
            <button
              type="submit"
              disabled={savingConfig}
              className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer shrink-0"
            >
              {savingConfig ? 'Saving...' : 'Save Webhook'}
            </button>
          </div>
          {configSuccessMsg && (
            <p className="text-xs text-pink-300 flex items-center gap-1 font-medium mt-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {configSuccessMsg}
            </p>
          )}
        </form>
      </div>

      {/* Date Capacity Summary */}
      <div className="bg-[#101728]/70 backdrop-blur-xl border border-white/10 rounded-2xl p-4 space-y-3 shadow-xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <span>Date Capacity & Availability</span>
              <Sparkles className="w-3 h-3 text-pink-300" />
            </h3>
            <p className="text-[11px] text-slate-400">Live seat limits per category (10 max each)</p>
          </div>
          <button
            type="button"
            onClick={handleResetData}
            className="px-2.5 py-1 text-xs font-semibold text-rose-300 hover:bg-rose-950/30 border border-rose-500/30 rounded-lg transition-colors cursor-pointer"
          >
            Reset All
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {availabilities.map(a => (
            <div key={a.date} className="p-2.5 rounded-xl border border-white/10 bg-[#0A0D15]/80 space-y-1.5 text-xs">
              <div className="flex items-center justify-between font-semibold text-white">
                <span className="flex items-center gap-1.5 text-xs">
                  <CalendarIcon className="w-3.5 h-3.5 text-indigo-300" />
                  {a.date}
                </span>
              </div>

              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between text-slate-300">
                  <span>Web:</span>
                  <span className={a.webBooked >= 10 ? 'text-rose-400 font-semibold' : 'text-indigo-300 font-semibold'}>
                    {a.webBooked} / 10 ({10 - a.webBooked} left)
                  </span>
                </div>
                <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${a.webBooked >= 10 ? 'bg-rose-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500'}`}
                    style={{ width: `${Math.min(100, (a.webBooked / 10) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between text-slate-300">
                  <span>Mobile:</span>
                  <span className={a.mobileBooked >= 10 ? 'text-rose-400 font-semibold' : 'text-pink-300 font-semibold'}>
                    {a.mobileBooked} / 10 ({10 - a.mobileBooked} left)
                  </span>
                </div>
                <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${a.mobileBooked >= 10 ? 'bg-rose-500' : 'bg-gradient-to-r from-pink-500 to-purple-500'}`}
                    style={{ width: `${Math.min(100, (a.mobileBooked / 10) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Registrations Table */}
      <div className="bg-[#101728]/70 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-3.5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Registrations Log</h3>
            <p className="text-[11px] text-slate-400">{filteredRegistrations.length} attendees found</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 sm:w-44">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1 bg-[#0A0D15]/80 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-400/80"
              />
            </div>

            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="px-2 py-1 bg-[#0A0D15]/80 border border-white/10 rounded-xl text-xs text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="all">All Roles</option>
              <option value="web">Web Testers</option>
              <option value="mobile">Mobile Testers</option>
            </select>

            <button
              type="button"
              onClick={fetchRegistrationsAndAvailabilities}
              className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 rounded-xl transition-colors cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0A0D15]/80 text-slate-400 font-semibold uppercase tracking-wider text-[10px] border-b border-white/10">
              <tr>
                <th className="px-3.5 py-2.5">Attendee</th>
                <th className="px-3.5 py-2.5">Discipline</th>
                <th className="px-3.5 py-2.5">Date</th>
                <th className="px-3.5 py-2.5">Ticket Code</th>
                <th className="px-3.5 py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {filteredRegistrations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                    No registrations found.
                  </td>
                </tr>
              ) : (
                filteredRegistrations.map(r => (
                  <tr key={r.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-3.5 py-2.5">
                      <div className="font-semibold text-white">{r.name}</div>
                      <div className="text-[11px] text-slate-400">{r.email}</div>
                    </td>
                    <td className="px-3.5 py-2.5">
                      {r.testerType === 'web' ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-300 font-semibold text-[10px] border border-indigo-400/20">
                          <Monitor className="w-3 h-3 text-indigo-300" />
                          <span>Web</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg bg-pink-500/10 text-pink-300 font-semibold text-[10px] border border-pink-400/20">
                          <Smartphone className="w-3 h-3 text-pink-300" />
                          <span>Mobile</span>
                        </span>
                      )}
                    </td>
                    <td className="px-3.5 py-2.5 font-medium text-slate-200">{r.date}</td>
                    <td className="px-3.5 py-2.5 font-mono text-slate-400">{r.ticketCode}</td>
                    <td className="px-3.5 py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteRegistration(r.id, r.name)}
                        className="p-1 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
                        title="Cancel Registration"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Script Modal */}
      {showScriptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-[#101728]/90 border border-white/15 rounded-2xl max-w-lg w-full p-5 space-y-3 shadow-2xl backdrop-blur-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <h3 className="font-bold text-xs sm:text-sm text-white flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-pink-300" />
                Google Apps Script Setup
              </h3>
              <button
                type="button"
                onClick={() => setShowScriptModal(false)}
                className="text-slate-400 hover:text-white font-bold px-1.5 cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="relative">
              <pre className="p-3 bg-[#0A0D15]/90 text-indigo-200 font-mono text-[11px] rounded-xl overflow-x-auto max-h-44 border border-white/10">
                {scriptTemplate}
              </pre>
              <button
                type="button"
                onClick={copyScriptToClipboard}
                className="absolute top-2 right-2 px-2.5 py-1 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold text-xs rounded-lg flex items-center space-x-1 transition-colors cursor-pointer shadow-xs"
              >
                <Copy className="w-3.5 h-3.5 text-pink-300" />
                <span>{copiedScript ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>

            <ol className="text-xs text-slate-300 space-y-1 list-decimal list-inside bg-[#0A0D15]/80 p-2.5 rounded-xl border border-white/10">
              <li>Open Google Sheet &gt; <b>Extensions &gt; Apps Script</b>.</li>
              <li>Paste code &gt; <b>Deploy &gt; New deployment</b>.</li>
              <li>Select <b>Web app</b>, Execute as: <i>Me</i>, Access: <i>Anyone</i>.</li>
              <li>Paste Web App URL into Webhook URL field.</li>
            </ol>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowScriptModal(false)}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/15 text-white font-medium text-xs rounded-xl cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
