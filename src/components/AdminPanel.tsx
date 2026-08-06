import React, { useState, useEffect } from 'react';
import { Registration, GoogleSheetsConfig, DateAvailability } from '../types';
import { Download, Search, RefreshCw, Trash2, FileSpreadsheet, CheckCircle2, Copy, ExternalLink, Users, Monitor, Smartphone, Calendar as CalendarIcon } from 'lucide-react';

interface AdminPanelProps {
  availableDates: string[];
  onRefreshData?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ availableDates, onRefreshData }) => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [sheetsConfig, setSheetsConfig] = useState<GoogleSheetsConfig>({ autoSync: false });
  const [availabilities, setAvailabilities] = useState<DateAvailability[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('all');

  // Google Sheets integration state
  const [webhookUrl, setWebhookUrl] = useState<string>('');
  const [savingConfig, setSavingConfig] = useState<boolean>(false);
  const [configSuccessMsg, setConfigSuccessMsg] = useState<string | null>(null);
  const [scriptTemplate, setScriptTemplate] = useState<string>('');
  const [showScriptModal, setShowScriptModal] = useState<boolean>(false);
  const [copiedScript, setCopiedScript] = useState<boolean>(false);

  useEffect(() => {
    fetchRegistrationsAndAvailabilities();
    fetchScriptTemplate();
  }, []);

  const fetchRegistrationsAndAvailabilities = async () => {
    setLoading(true);
    try {
      const [regRes, availRes] = await Promise.all([
        fetch('/api/registrations'),
        fetch('/api/availability'),
      ]);

      if (regRes.ok) {
        const regData = await regRes.json();
        setRegistrations(regData.registrations || []);
        setSheetsConfig(regData.sheetsConfig || { autoSync: false });
        if (regData.sheetsConfig?.webhookUrl) {
          setWebhookUrl(regData.sheetsConfig.webhookUrl);
        }
      }

      if (availRes.ok) {
        const availData = await availRes.json();
        setAvailabilities(availData || []);
      }
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
    if (!window.confirm(`Are you sure you want to cancel the registration for ${name}? This will free up 1 seat.`)) {
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
    try {
      const res = await fetch('/api/google-sheets/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhookUrl,
          autoSync: true,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSheetsConfig(data.sheetsConfig);
        setConfigSuccessMsg('Google Sheets webhook saved successfully! Registrations stream live.');
        setTimeout(() => setConfigSuccessMsg(null), 5000);
      }
    } catch (err) {
      console.error('Failed to save config', err);
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

  // Filter logic
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
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Top Metrics Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white border border-zinc-200/80 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Total Attendees</span>
            <span className="text-2xl font-bold text-zinc-900 mt-1 block">
              {registrations.length}
            </span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 bg-white border border-zinc-200/80 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Web Testers</span>
            <span className="text-2xl font-bold text-zinc-900 mt-1 block">
              {webCount}
            </span>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
            <Monitor className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 bg-white border border-zinc-200/80 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Mobile Testers</span>
            <span className="text-2xl font-bold text-zinc-900 mt-1 block">
              {mobileCount}
            </span>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
            <Smartphone className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Google Sheets Integration Banner */}
      <div className="bg-[#1A1A1A] text-white rounded-[32px] p-6 sm:p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)] border border-zinc-800">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center space-x-2 bg-zinc-800 px-3 py-1 rounded-full text-xs font-semibold text-blue-300 border border-zinc-700">
              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-400" />
              <span>Google Sheets Sync</span>
            </div>
            <h3 className="text-xl font-bold">Stream Registrations to Google Sheets</h3>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              Registrations automatically sync with live date availability and stream directly to Google Sheets in real time.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <a
              href="/api/export-csv"
              download="event_registrations.csv"
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center space-x-2"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV</span>
            </a>

            <button
              onClick={() => setShowScriptModal(true)}
              className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 font-semibold rounded-xl text-xs transition-all flex items-center space-x-2"
            >
              <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
              <span>Apps Script Code</span>
            </button>
          </div>
        </div>

        {/* Webhook Configuration */}
        <form onSubmit={handleSaveSheetsConfig} className="mt-6 pt-6 border-t border-zinc-800 space-y-2">
          <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
            Google Apps Script Webhook URL (Live Stream)
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="url"
              placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
              value={webhookUrl}
              onChange={e => setWebhookUrl(e.target.value)}
              className="flex-1 px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={savingConfig}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all shadow-md"
            >
              {savingConfig ? 'Saving...' : 'Save Webhook'}
            </button>
          </div>
          {configSuccessMsg && (
            <p className="text-xs text-emerald-400 flex items-center gap-1 font-medium mt-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {configSuccessMsg}
            </p>
          )}
        </form>
      </div>

      {/* Date Capacity Summary Grid */}
      <div className="bg-white border border-zinc-200/80 rounded-[32px] p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-zinc-900">Per-Date Session Capacity & Registration Overview</h3>
            <p className="text-xs text-zinc-400">
              Live remaining seats streamed from registration log.
            </p>
          </div>
          <button
            onClick={handleResetData}
            className="px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200 rounded-xl transition-all"
          >
            Reset All
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {availabilities.map(a => (
            <div key={a.date} className="p-4 rounded-2xl border border-zinc-200 bg-zinc-50/50 space-y-3 text-xs">
              <div className="flex items-center justify-between font-bold text-zinc-900">
                <span className="flex items-center gap-1.5">
                  <CalendarIcon className="w-3.5 h-3.5 text-blue-600" />
                  {a.date}
                </span>
              </div>

              {/* Web Capacity */}
              <div className="space-y-1">
                <div className="flex justify-between text-zinc-700 font-semibold">
                  <span>Web Platform:</span>
                  <span className={a.webBooked >= 10 ? 'text-red-600 font-bold' : 'text-blue-600'}>
                    {a.webBooked} / 10 seats ({10 - a.webBooked} left)
                  </span>
                </div>
                <div className="w-full bg-zinc-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${a.webBooked >= 10 ? 'bg-red-500' : 'bg-blue-600'}`}
                    style={{ width: `${Math.min(100, (a.webBooked / 10) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Mobile Capacity */}
              <div className="space-y-1">
                <div className="flex justify-between text-zinc-700 font-semibold">
                  <span>Mobile Apps:</span>
                  <span className={a.mobileBooked >= 10 ? 'text-red-600 font-bold' : 'text-purple-600'}>
                    {a.mobileBooked} / 10 seats ({10 - a.mobileBooked} left)
                  </span>
                </div>
                <div className="w-full bg-zinc-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${a.mobileBooked >= 10 ? 'bg-red-500' : 'bg-purple-600'}`}
                    style={{ width: `${Math.min(100, (a.mobileBooked / 10) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Registrations List Section */}
      <div className="bg-white border border-zinc-200/80 rounded-[32px] shadow-sm overflow-hidden">
        {/* Header Controls */}
        <div className="p-6 border-b border-zinc-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-zinc-900">Registrations Log</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Showing {filteredRegistrations.length} of {registrations.length} attendee records
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Search attendee..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-zinc-900"
              />
            </div>

            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-700 font-medium focus:outline-none"
            >
              <option value="all">All Roles</option>
              <option value="web">Web Testers</option>
              <option value="mobile">Mobile Testers</option>
            </select>

            <select
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
              className="px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-700 font-medium focus:outline-none"
            >
              <option value="all">All Dates</option>
              {availableDates.map(d => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            <button
              onClick={fetchRegistrationsAndAvailabilities}
              className="p-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl transition-all"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 text-zinc-400 font-bold uppercase tracking-wider text-[10px] border-b border-zinc-100">
              <tr>
                <th className="px-6 py-3">Attendee</th>
                <th className="px-6 py-3">Discipline</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Ticket Code</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-700">
              {filteredRegistrations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-zinc-400">
                    No registrations found.
                  </td>
                </tr>
              ) : (
                filteredRegistrations.map(r => (
                  <tr key={r.id} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="font-bold text-zinc-900">{r.name}</div>
                      <div className="text-[11px] text-zinc-400">{r.email}</div>
                    </td>
                    <td className="px-6 py-3.5">
                      {r.testerType === 'web' ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold text-[10px] border border-blue-200">
                          <Monitor className="w-3 h-3" />
                          <span>Web Platform</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-bold text-[10px] border border-purple-200">
                          <Smartphone className="w-3 h-3" />
                          <span>Mobile Apps</span>
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 font-semibold text-zinc-900">{r.date}</td>
                    <td className="px-6 py-3.5 font-mono text-zinc-500">{r.ticketCode}</td>
                    <td className="px-6 py-3.5 text-right">
                      <button
                        onClick={() => handleDeleteRegistration(r.id, r.name)}
                        className="p-1 text-zinc-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-all"
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

      {/* Google Apps Script Modal */}
      {showScriptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm">
          <div className="bg-white border border-zinc-200 rounded-[32px] max-w-2xl w-full p-6 sm:p-8 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="font-bold text-base text-zinc-900 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                Google Apps Script Setup
              </h3>
              <button
                onClick={() => setShowScriptModal(false)}
                className="text-zinc-400 hover:text-zinc-600 text-xl font-bold px-2"
              >
                ×
              </button>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed">
              Copy this Google Apps Script code into your Google Sheet editor to receive live stream updates for new registrations:
            </p>

            <div className="relative">
              <pre className="p-4 bg-[#1A1A1A] text-blue-300 font-mono text-xs rounded-2xl overflow-x-auto max-h-56 leading-relaxed">
                {scriptTemplate}
              </pre>
              <button
                onClick={copyScriptToClipboard}
                className="absolute top-3 right-3 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center space-x-1 shadow-md transition-all"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedScript ? 'Copied!' : 'Copy Code'}</span>
              </button>
            </div>

            <ol className="text-xs text-zinc-600 space-y-1 list-decimal list-inside bg-zinc-50 p-3 rounded-2xl border border-zinc-200">
              <li>Open Google Sheet &gt; <b>Extensions &gt; Apps Script</b>.</li>
              <li>Paste code &gt; <b>Deploy &gt; New deployment</b>.</li>
              <li>Select <b>Web app</b>, Execute as: <i>Me</i>, Access: <i>Anyone</i>.</li>
              <li>Paste Web App URL into the field above!</li>
            </ol>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowScriptModal(false)}
                className="px-5 py-2 bg-zinc-900 text-white font-semibold text-xs rounded-xl"
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
