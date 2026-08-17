'use client'

import React, { useState } from 'react'
import { Mic, CheckCircle2, Clock, Terminal, Sparkles, Filter } from 'lucide-react'

type VoiceAuditLog = {
  id: number
  transcript: string
  action: string
  layer: 'Layer 0 (DOM)' | 'Layer 1-2 (Groq LLM)'
  status: 'success' | 'confirmed' | 'escalated'
  duration_ms: number
  timestamp: string
}

const SAMPLE_LOGS: VoiceAuditLog[] = [
  { id: 1, transcript: 'pauza qil', action: 'pause_video', layer: 'Layer 0 (DOM)', status: 'success', duration_ms: 12, timestamp: '1 daqiqa oldin' },
  { id: 2, transcript: 'ovozni 80 foizga qo\'y', action: 'set_volume (value: 80)', layer: 'Layer 0 (DOM)', status: 'success', duration_ms: 15, timestamp: '3 daqiqa oldin' },
  { id: 3, transcript: 'menga fantastik kinolarni topib ber', action: 'search_content (query: fantastika)', layer: 'Layer 1-2 (Groq LLM)', status: 'success', duration_ms: 320, timestamp: '6 daqiqa oldin' },
  { id: 4, transcript: 'bunga 5 baho qo\'y', action: 'rate_content (stars: 5)', layer: 'Layer 1-2 (Groq LLM)', status: 'success', duration_ms: 280, timestamp: '12 daqiqa oldin' },
  { id: 5, transcript: 'tomosha tarixini tozala', action: 'clear_watch_history', layer: 'Layer 1-2 (Groq LLM)', status: 'confirmed', duration_ms: 450, timestamp: '20 daqiqa oldin' },
]

export default function VoiceLogsPage() {
  const [logs] = useState<VoiceAuditLog[]>(SAMPLE_LOGS)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-bold text-[#F8FAFC]">
            AI Ovozli Buyruqlar va WS Audit Jurnali
          </h2>
          <p className="text-xs text-[#64748B]">
            58 ta ovozli funksiya va WebSocket orqali Groq LLM agenti tomonidan bajarilgan amallar logi
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-[rgba(0,255,163,0.2)] bg-[#0F171A] px-3.5 py-1.5 text-xs font-bold text-[#00FFA3]">
          <Sparkles size={14} /> Jonli monitoring faol
        </div>
      </div>

      {/* Logs Table */}
      <div className="overflow-hidden rounded-3xl border border-[rgba(0,255,163,0.15)] bg-[#0F171A] shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[rgba(0,255,163,0.1)] bg-[#0B1013] text-[#64748B] font-bold uppercase tracking-wider">
              <tr>
                <th className="p-4">Vaqt</th>
                <th className="p-4">Foydalanuvchi nutqi (STT)</th>
                <th className="p-4">Bajarilgan amal (Tool)</th>
                <th className="p-4">Qatlam</th>
                <th className="p-4">Tezlik</th>
                <th className="p-4 text-right">Holat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(0,255,163,0.06)] text-[#F8FAFC]">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-[#0B1013]/60 transition">
                  <td className="p-4 text-[#64748B] whitespace-nowrap">{log.timestamp}</td>
                  <td className="p-4 font-bold text-[#F8FAFC] italic">&ldquo;{log.transcript}&rdquo;</td>
                  <td className="p-4 font-mono font-bold text-[#00FFA3]">{log.action}</td>
                  <td className="p-4">
                    <span className="rounded-md border border-[rgba(0,255,163,0.2)] bg-[rgba(0,255,163,0.08)] px-2 py-0.5 text-[10px] font-bold text-[#00FFA3]">
                      {log.layer}
                    </span>
                  </td>
                  <td className="p-4 font-mono text-xs text-[#64748B]">{log.duration_ms} ms</td>
                  <td className="p-4 text-right">
                    <span className="inline-flex items-center gap-1 text-[#00FFA3] font-bold text-[11px]">
                      <CheckCircle2 size={13} /> {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
