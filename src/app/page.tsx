'use client';

import React, { useState } from 'react';

// Custom icons using inline SVGs for compatibility and clean code
const DashboardIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
  </svg>
);

const UploadIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

const AnalyticsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const DatabaseIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
  </svg>
);

export default function Home() {
  const [role, setRole] = useState<'admin' | 'manager' | 'be'>('admin');
  const [activeTab, setActiveTab] = useState<'overview' | 'upload'>('overview');
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success'>('idle');

  // Dummy metrics based on selected role
  const metrics = {
    admin: {
      mtdSales: '₹1.84 Cr',
      achievement: '94.2%',
      pendingSubmissions: '4 HQs',
      forecastAccuracy: '88.5%',
    },
    manager: {
      mtdSales: '₹58.2 Lakhs',
      achievement: '91.8%',
      pendingSubmissions: '1 HQ',
      forecastAccuracy: '89.1%',
    },
    be: {
      mtdSales: '₹18.4 Lakhs',
      achievement: '102.5%',
      pendingSubmissions: '0 (Submitted)',
      forecastAccuracy: '92.3%',
    },
  }[role];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Banner */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-cyan-400 flex items-center justify-center font-bold text-white shadow-lg shadow-brand-500/20">
              A
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                Adonis Pharma
              </h1>
              <span className="text-xs text-slate-500 font-medium">Sales Analytics Platform</span>
            </div>
          </div>

          {/* Role selector mockup */}
          <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <span className="text-xs text-slate-400 px-2 font-medium">Scope:</span>
            <button
              onClick={() => setRole('admin')}
              className={`text-xs px-3 py-1.5 rounded-md font-semibold transition-all ${
                role === 'admin' ? 'bg-brand-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Admin
            </button>
            <button
              onClick={() => setRole('manager')}
              className={`text-xs px-3 py-1.5 rounded-md font-semibold transition-all ${
                role === 'manager' ? 'bg-brand-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Manager
            </button>
            <button
              onClick={() => setRole('be')}
              className={`text-xs px-3 py-1.5 rounded-md font-semibold transition-all ${
                role === 'be' ? 'bg-brand-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              BE
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex gap-8">
        {/* Sidebar Navigation */}
        <aside className="w-64 shrink-0 hidden md:flex flex-col gap-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'overview'
                ? 'bg-brand-950/50 border border-brand-800 text-brand-400'
                : 'text-slate-400 hover:bg-slate-900/50 hover:text-slate-100 border border-transparent'
            }`}
          >
            <DashboardIcon />
            Overview Dashboard
          </button>
          
          {role === 'admin' && (
            <button
              onClick={() => setActiveTab('upload')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                activeTab === 'upload'
                  ? 'bg-brand-950/50 border border-brand-800 text-brand-400'
                  : 'text-slate-400 hover:bg-slate-900/50 hover:text-slate-100 border border-transparent'
              }`}
            >
              <UploadIcon />
              Upload Monthly Dump
            </button>
          )}

          <div className="mt-8 border-t border-slate-800 pt-4 px-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Database status</h3>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              Supabase connected
            </div>
          </div>
        </aside>

        {/* Dashboard Content */}
        <main className="flex-1 min-w-0">
          {activeTab === 'overview' ? (
            <div className="space-y-8 animate-fadeIn">
              {/* Heading */}
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                  Performances Overview
                </h2>
                <p className="text-slate-400 text-sm">Role-restricted scope: {role.toUpperCase()}</p>
              </div>

              {/* KPI Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-2xl relative overflow-hidden group hover:border-brand-500/50 transition-all duration-300">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/5 rounded-full blur-2xl group-hover:bg-brand-500/10 transition-all"></div>
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">MTD Sales</span>
                  <div className="text-2xl font-bold text-white mt-1">{metrics.mtdSales}</div>
                  <span className="text-xs text-emerald-400 mt-2 flex items-center gap-1 font-medium">
                    ↑ 12.4% vs Last Month
                  </span>
                </div>

                <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-2xl relative overflow-hidden group hover:border-brand-500/50 transition-all duration-300">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Target Achievement</span>
                  <div className="text-2xl font-bold text-white mt-1">{metrics.achievement}</div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-brand-500 to-cyan-400 h-full rounded-full transition-all duration-1000"
                      style={{ width: metrics.achievement }}
                    ></div>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-2xl relative overflow-hidden group hover:border-brand-500/50 transition-all duration-300">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Secondary Stock Ingest</span>
                  <div className="text-2xl font-bold text-white mt-1">{metrics.pendingSubmissions}</div>
                  <span className="text-xs text-slate-500 mt-2 block font-medium">
                    {role === 'be' ? 'Verified by Administrator' : 'Needs verification'}
                  </span>
                </div>

                <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-2xl relative overflow-hidden group hover:border-brand-500/50 transition-all duration-300">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">System Forecast Accuracy</span>
                  <div className="text-2xl font-bold text-white mt-1">{metrics.forecastAccuracy}</div>
                  <span className="text-xs text-brand-400 mt-2 block font-medium">
                    3-month rolling average basis
                  </span>
                </div>
              </div>

              {/* Chart Placeholder */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-bold text-base text-white">Sales & Forecasting Trends</h3>
                    <p className="text-xs text-slate-400">Monthly breakdown of target vs actual units</p>
                  </div>
                  <div className="flex gap-4 text-xs">
                    <span className="flex items-center gap-1.5 text-brand-400"><span className="w-2.5 h-2.5 rounded-full bg-brand-500"></span> Actual</span>
                    <span className="flex items-center gap-1.5 text-slate-400"><span className="w-2.5 h-2.5 rounded-full bg-slate-700"></span> Target</span>
                  </div>
                </div>
                
                {/* SVG Graph for zero runtime dependencies & full stability */}
                <div className="w-full h-64 flex items-end justify-between px-4 pb-2 border-b border-slate-800 pt-6">
                  {[
                    { month: 'Apr', target: 45, actual: 48 },
                    { month: 'May', target: 55, actual: 52 },
                    { month: 'Jun', target: 60, actual: 65 },
                    { month: 'Jul', target: 70, actual: 68 },
                    { month: 'Aug', target: 75, actual: 80 },
                    { month: 'Sep', target: 85, actual: 82 },
                  ].map((d, i) => (
                    <div key={i} className="flex flex-col items-center gap-2 w-1/6 group">
                      <div className="w-full flex items-end justify-center gap-1.5 h-48 relative">
                        {/* Target bar */}
                        <div 
                          className="bg-slate-800 w-3 rounded-t transition-all group-hover:bg-slate-700" 
                          style={{ height: `${d.target}%` }}
                        ></div>
                        {/* Actual bar */}
                        <div 
                          className="bg-gradient-to-t from-brand-600 to-cyan-400 w-3 rounded-t shadow-lg shadow-brand-500/10 group-hover:scale-y-105 origin-bottom transition-all" 
                          style={{ height: `${d.actual}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-slate-500 font-medium">{d.month}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-8 animate-fadeIn">
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                  Sales Dump Importer
                </h2>
                <p className="text-slate-400 text-sm">Upload the Excel spreadsheet to parse, club, and map transactions.</p>
              </div>

              {/* Upload Panel */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
                {uploadStatus === 'idle' ? (
                  <>
                    <div className="w-16 h-16 bg-slate-950 border border-slate-800 rounded-full flex items-center justify-center text-brand-400 mb-4 shadow-inner">
                      <UploadIcon />
                    </div>
                    <h3 className="font-bold text-white mb-2">Drag and drop your spreadsheet</h3>
                    <p className="text-xs text-slate-400 max-w-sm mb-6">
                      Upload the billing master containing monthly sales transactions. Accepts files of type `.xlsx` or `.xls`.
                    </p>
                    <button
                      onClick={() => setUploadStatus('success')}
                      className="bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-brand-600/25"
                    >
                      Simulate Parse & Upload
                    </button>
                  </>
                ) : (
                  <div className="animate-scaleIn">
                    <div className="w-16 h-16 bg-emerald-950/50 border border-emerald-800 text-emerald-400 rounded-full flex items-center justify-center mb-4 mx-auto">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="font-bold text-white mb-1">Upload Successful!</h3>
                    <p className="text-xs text-emerald-400 font-semibold mb-6">1450 rows parsed and clubbed with 100% mapping</p>
                    <button
                      onClick={() => setUploadStatus('idle')}
                      className="bg-slate-950 border border-slate-800 hover:bg-slate-900 text-slate-300 font-semibold text-sm px-6 py-2.5 rounded-xl transition-all"
                    >
                      Reset Uploader
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-900/60 bg-slate-950 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-600 font-medium">
          Adonis Pharma Analytics Platform © {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
}
