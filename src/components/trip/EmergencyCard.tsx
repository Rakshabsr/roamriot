'use client'

import { useState } from 'react'
import { ShieldAlert, ChevronDown, Phone, Cross, Building2, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmergencyInfo {
  police: string
  ambulance: string
  fire: string
  general?: string          // single emergency number (e.g. 112 in EU)
  localTaxi?: string        // primary ride-hailing app
  hospitalSearch: string    // Google Maps search URL
  embassySearch: string     // Embassy URL
  notes?: string            // country-specific tips
}

const EMERGENCY_DATA: Record<string, EmergencyInfo> = {
  // ── India ──────────────────────────────────────────────────────────────
  india: {
    police: '100', ambulance: '108', fire: '101', general: '112',
    localTaxi: 'Ola / Uber',
    hospitalSearch: 'https://www.google.com/maps/search/hospital+near+me',
    embassySearch: 'https://www.mea.gov.in/foreign-missions-in-india.htm',
    notes: 'Dial 112 for any emergency. Jio / Airtel SIMs work nationwide.',
  },
  // ── Indonesia / Bali ───────────────────────────────────────────────────
  indonesia: {
    police: '110', ambulance: '118', fire: '113', general: '112',
    localTaxi: 'Gojek / Grab',
    hospitalSearch: 'https://www.google.com/maps/search/rumah+sakit+near+me',
    embassySearch: 'https://kemlu.go.id/portal/en',
    notes: 'Blue Light Hospital in Kuta is popular with tourists. Download Gojek before landing.',
  },
  // ── Japan ──────────────────────────────────────────────────────────────
  japan: {
    police: '110', ambulance: '119', fire: '119',
    localTaxi: 'JapanTaxi / GO',
    hospitalSearch: 'https://www.google.com/maps/search/hospital+near+me',
    embassySearch: 'https://www.mofa.go.jp/about/emb_cons/over/index.html',
    notes: 'Emergency operators may not speak English — stay calm and say your location. IC cards work on most transit.',
  },
  // ── South Korea ────────────────────────────────────────────────────────
  korea: {
    police: '112', ambulance: '119', fire: '119',
    localTaxi: 'KakaoTaxi',
    hospitalSearch: 'https://www.google.com/maps/search/hospital+near+me',
    embassySearch: 'https://www.mofa.go.kr/eng/index.do',
    notes: 'KakaoTaxi is the most reliable. T-money card works on all Seoul transit. 1345 for foreigner assistance.',
  },
  // ── Thailand ───────────────────────────────────────────────────────────
  thailand: {
    police: '191', ambulance: '1669', fire: '199', general: '1155',
    localTaxi: 'Grab',
    hospitalSearch: 'https://www.google.com/maps/search/hospital+near+me',
    embassySearch: 'https://www.mfa.go.th/en/page/foreign-embassies-and-consulates',
    notes: '1155 is the Tourist Police line — English-speaking. Bumrungrad Hospital in Bangkok is internationally accredited.',
  },
  // ── France ─────────────────────────────────────────────────────────────
  france: {
    police: '17', ambulance: '15', fire: '18', general: '112',
    localTaxi: 'Uber / G7',
    hospitalSearch: 'https://www.google.com/maps/search/hôpital+near+me',
    embassySearch: 'https://www.diplomatie.gouv.fr/en/coming-to-france/welcome-to-france/ambassades-et-consulats',
    notes: '112 works across all EU. SAMU (15) for medical, Pompiers (18) for fire & accidents.',
  },
  // ── Portugal ───────────────────────────────────────────────────────────
  portugal: {
    police: '112', ambulance: '112', fire: '112', general: '112',
    localTaxi: 'Uber / Bolt',
    hospitalSearch: 'https://www.google.com/maps/search/hospital+near+me',
    embassySearch: 'https://www.embassypages.com/portugal',
    notes: '112 is the single number for all emergencies across Portugal.',
  },
  // ── Singapore ──────────────────────────────────────────────────────────
  singapore: {
    police: '999', ambulance: '995', fire: '995',
    localTaxi: 'Grab / ComfortDelGro',
    hospitalSearch: 'https://www.google.com/maps/search/hospital+near+me',
    embassySearch: 'https://www.mfa.gov.sg/Overseas-Mission',
    notes: 'Singapore General Hospital (SGH) is centrally located. EZ-Link card works on all MRT/buses.',
  },
  // ── UAE / Dubai ────────────────────────────────────────────────────────
  uae: {
    police: '999', ambulance: '998', fire: '997', general: '999',
    localTaxi: 'Careem / Uber',
    hospitalSearch: 'https://www.google.com/maps/search/hospital+near+me',
    embassySearch: 'https://www.mofa.gov.ae/en/Missions',
    notes: 'Dubai Health Authority hospitals are high quality. Careem is the dominant ride-app.',
  },
  // ── Default fallback ───────────────────────────────────────────────────
  default: {
    police: '911 / 999 / 112', ambulance: '911 / 999 / 112', fire: '911 / 999 / 112', general: '112',
    localTaxi: 'Uber / local apps',
    hospitalSearch: 'https://www.google.com/maps/search/hospital+near+me',
    embassySearch: 'https://www.embassypages.com',
    notes: '112 is the international emergency number — works in most countries even without a SIM.',
  },
}

function getEmergencyInfo(destination: string): EmergencyInfo {
  const d = destination.toLowerCase()
  if (d.includes('india') || d.includes('jaipur') || d.includes('delhi') || d.includes('mumbai') ||
      d.includes('goa') || d.includes('udaipur') || d.includes('kolkata') || d.includes('bangalore') ||
      d.includes('chennai') || d.includes('hyderabad')) return EMERGENCY_DATA.india
  if (d.includes('bali') || d.includes('indonesia') || d.includes('jakarta') || d.includes('yogyakarta')) return EMERGENCY_DATA.indonesia
  if (d.includes('japan') || d.includes('tokyo') || d.includes('osaka') || d.includes('kyoto')) return EMERGENCY_DATA.japan
  if (d.includes('korea') || d.includes('seoul') || d.includes('busan') || d.includes('incheon')) return EMERGENCY_DATA.korea
  if (d.includes('thailand') || d.includes('bangkok') || d.includes('phuket') || d.includes('chiang mai')) return EMERGENCY_DATA.thailand
  if (d.includes('france') || d.includes('paris')) return EMERGENCY_DATA.france
  if (d.includes('portugal') || d.includes('lisbon') || d.includes('porto')) return EMERGENCY_DATA.portugal
  if (d.includes('singapore')) return EMERGENCY_DATA.singapore
  if (d.includes('dubai') || d.includes('uae') || d.includes('abu dhabi')) return EMERGENCY_DATA.uae
  return EMERGENCY_DATA.default
}

export function EmergencyCard({ destination }: { destination: string }) {
  const [open, setOpen] = useState(false)
  const info = getEmergencyInfo(destination)

  return (
    <div className="mx-4 mb-3 rounded-3xl border-2 border-red-100 dark:border-red-900/30 bg-gradient-to-br from-white dark:from-[#1a1110] to-red-50 dark:to-[#1f1210] overflow-hidden shadow-soft">
      <button onClick={() => setOpen(v => !v)} className="w-full flex items-center gap-3 p-4 text-left">
        <div className="w-10 h-10 rounded-2xl bg-red-500 flex items-center justify-center flex-shrink-0">
          <ShieldAlert size={18} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">Emergency Info</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
            {info.general ? `Dial ${info.general}` : `Police ${info.police} · Ambulance ${info.ambulance}`} · tap to expand
          </p>
        </div>
        <div className={cn('w-7 h-7 rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-center transition-transform flex-shrink-0', open && 'rotate-180')}>
          <ChevronDown size={14} className="text-red-500 dark:text-red-400" />
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 animate-fade-up">
          {/* Emergency numbers */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Police', num: info.police, icon: '🚔' },
              { label: 'Ambulance', num: info.ambulance, icon: '🚑' },
              { label: 'Fire', num: info.fire, icon: '🚒' },
            ].map(({ label, num, icon }) => (
              <a key={label} href={`tel:${num.split('/')[0].trim()}`}
                className="flex flex-col items-center gap-1 py-3 px-2 rounded-2xl bg-white dark:bg-[#1a1814] border border-red-100 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-center">
                <span className="text-xl">{icon}</span>
                <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100">{num.split('/')[0].trim()}</span>
                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">{label}</span>
              </a>
            ))}
          </div>

          {info.general && (
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30">
              <Phone size={14} className="text-red-500 dark:text-red-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-bold text-red-800 dark:text-red-300">Universal emergency</p>
                <p className="text-xs text-red-600 dark:text-red-400">Dial <strong>{info.general}</strong> for any emergency</p>
              </div>
              <a href={`tel:${info.general}`}
                className="flex-shrink-0 px-3 py-1.5 rounded-xl bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-colors">
                Call
              </a>
            </div>
          )}

          {/* Quick links */}
          <div className="grid grid-cols-2 gap-2">
            <a href={info.hospitalSearch} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 rounded-2xl bg-white dark:bg-[#1a1814] border border-slate-100 dark:border-[#1e2f2b] hover:bg-sea-50 dark:hover:bg-sea-900/20 transition-colors">
              <Cross size={14} className="text-red-500 dark:text-red-400 flex-shrink-0" />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Nearest hospital</span>
            </a>
            <a href={info.embassySearch} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 rounded-2xl bg-white dark:bg-[#1a1814] border border-slate-100 dark:border-[#1e2f2b] hover:bg-sage-50 dark:hover:bg-sage-900/20 transition-colors">
              <Building2 size={14} className="text-sage-500 dark:text-sage-400 flex-shrink-0" />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Embassy finder</span>
            </a>
          </div>

          {/* Local tip */}
          {info.notes && (
            <div className="flex gap-2 p-3 rounded-2xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20">
              <AlertTriangle size={12} className="text-amber-500 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">{info.notes}</p>
            </div>
          )}

          {/* Local taxi */}
          {info.localTaxi && (
            <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
              Local ride: <span className="font-semibold text-slate-600 dark:text-slate-300">{info.localTaxi}</span>
            </p>
          )}
        </div>
      )}
    </div>
  )
}
