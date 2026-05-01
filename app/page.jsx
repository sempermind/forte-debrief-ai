'use client';

import { useState, useRef, useEffect } from 'react';

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const readFileAsBase64 = (file) =>
  new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result.split(',')[1]);
    r.onerror = rej;
    r.readAsDataURL(file);
  });

// ─── WAVEFORM ─────────────────────────────────────────────────────────────────
function Waveform({ analyserRef, isPlaying }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const bars = 44;
    const bw = (W / bars) * 0.58, gap = (W / bars) * 0.42;

    const draw = () => {
      animRef.current = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, W, H);
      let data = null;
      if (analyserRef.current && isPlaying) {
        const buf = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(buf);
        data = buf;
      }
      const t = Date.now() / 1000;
      for (let i = 0; i < bars; i++) {
        const h = data && isPlaying
          ? (data[Math.floor((i / bars) * data.length * 0.55)] / 255) * H * 0.88 + 4
          : Math.abs(Math.sin(t * 1.5 + i * 0.35)) * 9 + 4;
        const x = i * (bw + gap) + gap / 2;
        const y = (H - h) / 2;
        const a = isPlaying ? 0.88 : 0.28;
        const g = ctx.createLinearGradient(x, y, x, y + h);
        g.addColorStop(0, `rgba(255,70,70,${a})`);
        g.addColorStop(0.5, `rgba(214,26,26,${a})`);
        g.addColorStop(1, `rgba(100,15,15,${a * 0.5})`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.roundRect(x, y, bw, h, 2);
        ctx.fill();
      }
    };
    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [isPlaying]);

  return <canvas ref={canvasRef} width={260} height={46} style={{ display: 'block' }} />;
}

// ─── MINI GRAPH ───────────────────────────────────────────────────────────────
function MiniGraph({ vals, color, label }) {
  const W = 190, H = 108;
  const padL = 10, padR = 10, padT = 12, padB = 28;
  const midY = padT + (H - padT - padB) / 2;
  const range = 36;
  const totalH = H - padT - padB;
  const colW = (W - padL - padR) / 3;
  const axes = ['Dom', 'Ext', 'Pat', 'Con'];
  const toY = (v) => midY - ((v ?? 0) / range) * (totalH / 2);
  const toX = (i) => padL + i * colW;
  const hasData = vals && vals.length === 4;
  const points = hasData ? vals.map((v, i) => ({ x: toX(i), y: toY(v) })) : null;
  const pathD = points
    ? points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
    : '';

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}`, flexShrink: 0 }} />
        <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</span>
      </div>
      <svg width={W} height={H} style={{ display: 'block', borderRadius: 6, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        {/* Midline */}
        <line x1={padL} y1={midY} x2={W - padR} y2={midY} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
        {/* Column guides */}
        {axes.map((_, i) => (
          <line key={i} x1={toX(i)} y1={padT} x2={toX(i)} y2={H - padB} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        ))}
        {/* Axis labels */}
        {axes.map((a, i) => (
          <text key={a} x={toX(i)} y={H - 6} textAnchor="middle" fontSize="8" fill="rgba(255,255,255,0.28)" fontFamily="DM Sans, sans-serif">{a}</text>
        ))}
        {/* Data line */}
        {points ? (
          <>
            <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"
              style={{ filter: `drop-shadow(0 0 3px ${color})` }} />
            {points.map((p, i) => (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r="4.5" fill="rgba(8,8,8,0.8)" stroke={color} strokeWidth="1.5" />
                <text x={p.x} y={p.y - 7} textAnchor="middle" fontSize="8" fill={color} fontFamily="DM Sans, sans-serif" fontWeight="700">
                  {Math.abs(vals[i] ?? 0)}
                </text>
              </g>
            ))}
          </>
        ) : (
          <text x={W / 2} y={midY + 4} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.18)" fontFamily="DM Sans, sans-serif">
            Reading profile...
          </text>
        )}
      </svg>
    </div>
  );
}

// ─── GLASS ────────────────────────────────────────────────────────────────────
function Glass({ children, style = {}, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: 'rgba(255,255,255,0.04)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 16,
      ...style,
    }}>
      {children}
    </div>
  );
}

// ─── RED BUTTON ───────────────────────────────────────────────────────────────
function RedBtn({ children, onClick, disabled, style = {} }) {
  const [h, setH] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        background: disabled ? 'rgba(214,26,26,0.25)' : h ? '#ff2525' : '#d61a1a',
        border: 'none', borderRadius: 10, color: '#fff',
        fontFamily: "'Barlow Condensed', sans-serif",
        fontWeight: 700, fontSize: 17, letterSpacing: '0.06em',
        padding: '14px 32px', cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all .2s', transform: h && !disabled ? 'scale(1.02)' : 'scale(1)',
        ...style,
      }}
    >
      {children}
    </button>
  );
}

// ─── PROFILE PANEL ────────────────────────────────────────────────────────────
function ProfilePanel({ name, snapshot }) {
  return (
    <Glass style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16, height: '100%', overflowY: 'auto' }}>
      {/* Name */}
      <div>
        <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.32)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 4 }}>Participant</div>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 700, color: '#fff' }}>{name}</div>
      </div>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} />

      {/* Strengths */}
      <div>
        <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.32)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 10 }}>Strengths</div>
        {[
          { label: 'Primary', color: '#4ade80', val: snapshot.primary },
          { label: 'Secondary', color: '#60a5fa', val: snapshot.secondary },
        ].map((d) => (
          <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: d.color, boxShadow: `0 0 5px ${d.color}`, flexShrink: 0 }} />
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.38)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', width: 56, flexShrink: 0 }}>{d.label}</span>
            <span style={{ fontSize: 11, color: '#fff', marginLeft: 'auto', textAlign: 'right' }}>{d.val || '—'}</span>
          </div>
        ))}
      </div>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} />

      {/* Three Graphs */}
      <div>
        <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.32)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 12 }}>Communication Graphs</div>
        <MiniGraph vals={snapshot.primaryVals} color="#4ade80" label="Primary — Who You Are" />
        <MiniGraph vals={snapshot.adaptingVals} color="#f87171" label="Adapting — How You Feel" />
        <MiniGraph vals={snapshot.perceiverVals} color="#60a5fa" label="Perceiver — How You're Seen" />
      </div>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} />

      {/* Logic / Stamina / Goals */}
      <div>
        {[
          { label: 'Logic', color: '#f59e0b', val: snapshot.logic },
          { label: 'Stamina', color: '#a78bfa', val: snapshot.stamina },
          { label: 'Goals', color: '#fb923c', val: snapshot.goals },
        ].map((d) => (
          <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 7 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: d.color, boxShadow: `0 0 5px ${d.color}`, flexShrink: 0 }} />
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.38)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', width: 50, flexShrink: 0 }}>{d.label}</span>
            <span style={{ fontSize: 11, color: '#fff', marginLeft: 'auto', textAlign: 'right' }}>{d.val || '—'}</span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 'auto', background: 'rgba(214,26,26,0.07)', border: '1px solid rgba(214,26,26,0.17)', borderRadius: 10, padding: '10px 14px' }}>
        <div style={{ fontSize: 10, color: '#d61a1a', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 3 }}>Powered by</div>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 17, fontWeight: 700, color: '#fff' }}>SEMPER MIND</div>
      </div>
    </Glass>
  );
}

// ─── MESSAGE BUBBLE ───────────────────────────────────────────────────────────
function Bubble({ msg, isLast, isSpeaking, analyserRef }) {
  const ai = msg.role === 'assistant';
  // Don't render empty streaming placeholders
  if (ai && !msg.content) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: ai ? 'flex-start' : 'flex-end', marginBottom: 18 }}>
      {ai && (
        <div style={{ marginBottom: 6, paddingLeft: 2 }}>
          <img src="/Logo Only Transparent.png" alt="Semper Mind" style={{ height: 36, width: 'auto', objectFit: 'contain' }} />
        </div>
      )}
      <div style={{
        maxWidth: '80%',
        background: ai ? 'rgba(255,255,255,0.045)' : '#ffffff',
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        border: ai ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(214,26,26,0.3)',
        borderRadius: ai ? '3px 16px 16px 16px' : '16px 3px 16px 16px',
        padding: ai && isLast && isSpeaking ? '16px 18px 10px' : '13px 17px',
        transition: 'padding .3s',
      }}>
        {ai && isLast && isSpeaking && (
          <div style={{ marginBottom: 10 }}>
            <Waveform analyserRef={analyserRef} isPlaying={isSpeaking} />
          </div>
        )}
        <p style={{ fontSize: 15, lineHeight: 1.68, color: ai ? 'rgba(255,255,255,0.88)' : '#d61a1a', margin: 0, whiteSpace: 'pre-wrap' }}>
          {msg.content}
        </p>
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 18 }}>
      <div style={{ background: 'rgba(255,255,255,0.045)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '3px 16px 16px 16px', padding: '16px 20px', display: 'flex', gap: 6, alignItems: 'center' }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#d61a1a', animation: `pdot 1.2s ease-in-out ${i * 0.2}s infinite` }} />
        ))}
      </div>
    </div>
  );
}

// ─── UPLOAD SCREEN ────────────────────────────────────────────────────────────
function UploadScreen({ onComplete }) {
  const [name, setName] = useState('');
  const [file, setFile] = useState(null);
  const [drag, setDrag] = useState(false);
  const fileRef = useRef();
  const handleFile = (f) => { if (f?.type === 'application/pdf') setFile(f); };
  const ready = name.trim().length > 1 && file;

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32, position: 'relative', zIndex: 1 }}>
      <Glass style={{ maxWidth: 560, width: '100%', padding: '52px 48px' }}>
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.22em', color: '#d61a1a', marginBottom: 12, textTransform: 'uppercase' }}>
            SEMPER MIND — FORTÉ DEBRIEF AI
          </div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 38, fontWeight: 800, color: '#fff', lineHeight: 1.05, marginBottom: 12 }}>
            Let's get started.
          </div>
          <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.38)', lineHeight: 1.7 }}>
            Enter your name and upload your Forté Communication Style Report to begin your personalized debrief.
          </div>
        </div>

        {/* Name */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.42)', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
            Your Name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder=""
            onKeyDown={(e) => e.key === 'Enter' && ready && onComplete({ name: name.trim(), file })}
            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fff', fontSize: 16, padding: '14px 18px', outline: 'none', fontFamily: 'inherit' }}
          />
        </div>

        {/* PDF Drop Zone */}
        <div style={{ marginBottom: 36 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.42)', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
            Your Forté Report (PDF)
          </label>
          <div
            onClick={() => fileRef.current.click()}
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]); }}
            style={{
              border: `2px dashed ${drag ? '#d61a1a' : file ? 'rgba(214,26,26,0.45)' : 'rgba(255,255,255,0.12)'}`,
              borderRadius: 14, padding: '40px 24px', textAlign: 'center', cursor: 'pointer',
              background: drag ? 'rgba(214,26,26,0.05)' : file ? 'rgba(214,26,26,0.03)' : 'rgba(255,255,255,0.015)',
              transition: 'all .2s',
            }}
          >
            <input ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={(e) => handleFile(e.target.files[0])} />
            {file ? (
              <>
                <div style={{ fontSize: 30, marginBottom: 8, color: '#d61a1a' }}>✓</div>
                <div style={{ fontSize: 15, color: '#d61a1a', fontWeight: 600, marginBottom: 4 }}>{file.name}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.28)' }}>Click to change</div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 36, marginBottom: 10, opacity: 0.28 }}>↑</div>
                <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.52)', fontWeight: 500, marginBottom: 6 }}>Drop your PDF here, or click to browse</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.24)' }}>Your Forté Communication Style Report</div>
              </>
            )}
          </div>
        </div>

        <RedBtn onClick={() => onComplete({ name: name.trim(), file })} disabled={!ready} style={{ width: '100%' }}>
          BEGIN MY DEBRIEF →
        </RedBtn>
      </Glass>
    </div>
  );
}

// ─── DEBRIEF SCREEN ───────────────────────────────────────────────────────────
function DebriefScreen({ name, file }) {
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [voiceOn, setVoiceOn] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [snapshot, setSnapshot] = useState({});

  // fullHistoryRef stores the complete API-ready conversation
  // [0] = first user msg with PDF, [1] = AI reply, [2] = user, [3] = AI, ...
  const fullHistoryRef = useRef([]);

  const endRef = useRef(null);
  const analyserRef = useRef(null);
  const audioCtxRef = useRef(null);
  const curAudioRef = useRef(null);
  const recRef = useRef(null);
  const taRef = useRef(null);
  const initRef = useRef(false);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, loading]);

  // Initialize — read PDF and start debrief
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    (async () => {
      setLoading(true);
      try {
        const pdfBase64 = await readFileAsBase64(file);
        const firstUserContent = `My name is ${name}. I'm ready for my Forté debrief. Please begin.`;

        // Call server API route
        const res = await fetch('/api/debrief', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            pdfBase64,
            messages: [{ role: 'user', content: firstUserContent }],
          }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        const parseGraphData = (graphDataLine) => {
          if (!graphDataLine) return;
          const line = graphDataLine;
          const parseNums = (key) => {
            const m = line.match(new RegExp(key + '=\\[([^\\]]+)\\]'));
            return m ? m[1].split(',').map((n) => parseInt(n.trim())) : null;
          };
          const parseStr = (key) => {
            const m = line.match(new RegExp(key + '=\"([^\"]+)\"'));
            return m ? m[1] : null;
          };
          setSnapshot((prev) => ({
            ...prev,
            primaryVals: parseNums('primary') || prev.primaryVals,
            adaptingVals: parseNums('adapting') || prev.adaptingVals,
            perceiverVals: parseNums('perceiver') || prev.perceiverVals,
            primary: parseStr('primaryStrength') || prev.primary,
            secondary: parseStr('secondaryStrength') || prev.secondary,
            logic: parseStr('logic') || prev.logic,
            stamina: parseStr('stamina') || prev.stamina,
            goals: parseStr('goals') || prev.goals,
          }));
        };

        // Add streaming placeholder
        setMsgs([{ role: 'assistant', content: '', streaming: true }]);

        const firstHistory = [{ role: 'user', content: firstUserContent, _pdfBase64: pdfBase64 }];

        await streamCall(
          firstHistory,
          pdfBase64,
          () => {}, // no chunk handler needed — we wait for done
          (data) => {
            parseGraphData(data.graphDataLine);
            const aiMsg = { role: 'assistant', content: data.text };
            fullHistoryRef.current = [
              { role: 'user', content: firstUserContent, _pdfBase64: pdfBase64 },
              aiMsg,
            ];
            setMsgs([aiMsg]);
            extractSnap(data.text);
            setLoading(false);
          },
          (e) => {
            setMsgs([{ role: 'assistant', content: `Something went wrong: ${e.message}. Please refresh and try again.` }]);
            setLoading(false);
          }
        );
        return; // setLoading handled in callbacks
      } catch (e) {
        setMsgs([{ role: 'assistant', content: `Something went wrong: ${e.message}. Please refresh and try again.` }]);
      }
      setLoading(false);
    })();
  }, []);

  const extractSnap = (text) => {
    const s = {};
    if (/extroversion\+/i.test(text) || /primary.*extroversion/i.test(text)) s.primary = 'Extroversion+';
    else if (/dominance\+/i.test(text) || /primary.*dominance/i.test(text)) s.primary = 'Dominance+';
    else if (/patience\+/i.test(text)) s.primary = 'Patience+';
    else if (/conformity\+/i.test(text)) s.primary = 'Conformity+';
    else if (/extroversion/i.test(text)) s.primary = 'Extroversion+';

    if (/non-conformity/i.test(text)) s.secondary = 'Non-Conformity+';
    else if (/introversion/i.test(text)) s.secondary = 'Introversion+';
    else if (/non-dominance/i.test(text)) s.secondary = 'Non-Dominance+';

    const lm = text.match(/facts and feelings|intuitive feelings|feelings|facts/i);
    if (lm) s.logic = lm[0];
    const sm = text.match(/very high|above average|below average|high|average/i);
    if (sm) s.stamina = sm[0];
    const gm = text.match(/meeting goals|most goals|some goals|few goals/i);
    if (gm) s.goals = gm[0];

    if (Object.keys(s).length) setSnapshot((prev) => ({ ...prev, ...s }));
  };

  // Speak via server route (ElevenLabs) with browser TTS fallback
  const speakText = async (text) => {
    stopSpeaking();
    setIsSpeaking(true);
    try {
      const res = await fetch('/api/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      // Check if server returned fallback flag (no ElevenLabs key)
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const d = await res.json();
        if (d.fallback) { fallbackSpeak(text); return; }
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      curAudioRef.current = audio;

      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
        analyserRef.current = audioCtxRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
      }
      const src = audioCtxRef.current.createMediaElementSource(audio);
      src.connect(analyserRef.current);
      analyserRef.current.connect(audioCtxRef.current.destination);
      audio.onended = () => { setIsSpeaking(false); URL.revokeObjectURL(url); };
      audio.play();
    } catch {
      fallbackSpeak(text);
    }
  };

  const fallbackSpeak = (text) => {
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 0.9; utt.pitch = 1.0;
    utt.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utt);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    if (curAudioRef.current) { curAudioRef.current.pause(); curAudioRef.current = null; }
    setIsSpeaking(false);
  };

  // Shared streaming call used by both init and send
  const streamCall = async (history, pdfBase64, onChunk, onDone, onError) => {
    const apiMessages = history.map((m) => ({ role: m.role, content: m.content }));
    try {
      const res = await fetch('/api/debrief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, pdfBase64, messages: apiMessages }),
      });
      if (!res.ok) throw new Error('Request failed');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const parsed = JSON.parse(line);
            if (parsed.done) {
              onDone(parsed);
            }
          } catch {}
        }
      }
      // Handle any remaining buffer
      if (buffer.trim()) {
        try {
          const parsed = JSON.parse(buffer);
          if (parsed.done) onDone(parsed);
        } catch {}
      }
    } catch (e) {
      onError(e);
    }
  };

  const send = async (text) => {
    if (!text.trim() || loading) return;
    stopSpeaking();
    const userMsg = { role: 'user', content: text };
    setMsgs((prev) => [...prev, userMsg]);
    setInput('');
    if (taRef.current) taRef.current.style.height = 'auto';
    setLoading(true);

    // Add streaming placeholder bubble
    setMsgs((prev) => [...prev, { role: 'assistant', content: '', streaming: true }]);

    const history = [...fullHistoryRef.current, userMsg];
    const pdfBase64 = fullHistoryRef.current[0]?._pdfBase64;

    await streamCall(
      history,
      pdfBase64,
      (chunk) => {
        setMsgs((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last?.streaming) updated[updated.length - 1] = { ...last, content: last.content + chunk };
          return updated;
        });
      },
      (data) => {
        const finalText = data.text;
        const aiMsg = { role: 'assistant', content: finalText };
        fullHistoryRef.current = [...history, aiMsg];
        setMsgs((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = aiMsg;
          return updated;
        });
        extractSnap(finalText);
        if (voiceOn) speakText(finalText);
        setLoading(false);
      },
      (e) => {
        setMsgs((prev) => {
          const updated = [...prev];
          // Remove streaming placeholder
          if (updated[updated.length - 1]?.streaming) updated.pop();
          return [...updated, { role: 'assistant', content: `Something went wrong — ${e.message}. Please try again.` }];
        });
        setLoading(false);
      }
    );
  };

  const toggleListen = () => {
    if (isListening) { recRef.current?.stop(); return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert('Speech recognition requires Chrome or Edge.'); return; }
    stopSpeaking();
    const rec = new SR();
    rec.continuous = false; rec.interimResults = true; rec.lang = 'en-US';
    rec.onresult = (e) => setInput(Array.from(e.results).map((r) => r[0].transcript).join(''));
    rec.onend = () => setIsListening(false);
    rec.onerror = () => setIsListening(false);
    recRef.current = rec; rec.start(); setIsListening(true);
  };

  return (
    <div style={{ flex: 1, display: 'flex', gap: 14, padding: '12px 16px', minHeight: 0, position: 'relative', zIndex: 1, overflow: 'hidden' }}>
      {/* Profile sidebar */}
      <div style={{ width: 258, flexShrink: 0, minHeight: 0 }}>
        <ProfilePanel name={name} snapshot={snapshot} />
      </div>

      {/* Chat */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, gap: 8 }}>
        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4 }}>
          {msgs.map((m, i) => (
            <Bubble key={i} msg={m} isLast={i === msgs.length - 1} isSpeaking={isSpeaking} analyserRef={analyserRef} />
          ))}
          {loading && <TypingDots />}
          <div ref={endRef} />
        </div>

        {/* Input bar */}
        <Glass style={{ padding: '10px 14px', display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0, marginTop: 0 }}>
          <textarea
            ref={taRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); } }}
            onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'; }}
            placeholder={isListening ? 'Listening...' : 'Type your response...'}
            rows={1}
            style={{ flex: 1, background: 'transparent', border: 'none', color: '#fff', fontSize: 15, fontFamily: 'inherit', outline: 'none', lineHeight: 1.55, maxHeight: 120, overflowY: 'auto', paddingTop: 0, alignSelf: 'center' }}
          />

          {/* Voice toggle */}
          <button
            onClick={() => { const n = !voiceOn; setVoiceOn(n); if (!n) stopSpeaking(); }}
            style={{ height: 42, padding: '0 14px', borderRadius: 10, border: `1px solid ${voiceOn ? 'rgba(214,26,26,0.45)' : 'rgba(255,255,255,0.12)'}`, flexShrink: 0, cursor: 'pointer', background: voiceOn ? 'rgba(214,26,26,0.15)' : 'rgba(255,255,255,0.04)', transition: 'all .2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: voiceOn ? '#d61a1a' : 'rgba(255,255,255,0.25)', boxShadow: voiceOn ? '0 0 6px #d61a1a' : 'none', transition: 'all .3s', flexShrink: 0 }} />
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', color: voiceOn ? '#fff' : 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>
              {voiceOn ? 'VOICE ON' : 'VOICE OFF'}
            </span>
          </button>

          {/* Mic button — only when voice on */}
          {voiceOn && (
            <button
              onClick={toggleListen}
              style={{ width: 42, height: 42, borderRadius: '50%', border: 'none', flexShrink: 0, cursor: 'pointer', background: isListening ? '#d61a1a' : 'rgba(214,26,26,0.18)', animation: isListening ? 'micpulse 1s ease-in-out infinite' : 'none', transition: 'background .2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <rect x="9" y="2" width="6" height="12" rx="3" fill="#fff" />
                <path d="M5 11a7 7 0 0 0 14 0" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                <line x1="12" y1="18" x2="12" y2="22" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          )}

          {/* Send button */}
          <button
            onClick={() => send(input)}
            disabled={!input.trim() || loading}
            style={{ width: 42, height: 42, borderRadius: '50%', border: 'none', flexShrink: 0, cursor: input.trim() && !loading ? 'pointer' : 'not-allowed', background: input.trim() && !loading ? '#d61a1a' : 'rgba(255,255,255,0.07)', transition: 'all .2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </Glass>
      </div>
    </div>
  );
}

// ─── ROOT PAGE ────────────────────────────────────────────────────────────────
export default function Page() {
  const [screen, setScreen] = useState('upload');
  const [session, setSession] = useState(null);

  return (
    <div style={{ height: '100vh', background: '#080808', fontFamily: "'DM Sans', sans-serif", color: '#fff', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      {/* Ambient orbs */}
      <div style={{ position: 'fixed', top: '-22%', right: '-8%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(214,26,26,0.16) 0%, transparent 70%)', filter: 'blur(70px)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '-18%', left: '-8%', width: 420, height: 420, background: 'radial-gradient(circle, rgba(214,26,26,0.09) 0%, transparent 70%)', filter: 'blur(90px)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', top: '42%', left: '32%', width: 300, height: 300, background: 'radial-gradient(circle, rgba(214,26,26,0.05) 0%, transparent 70%)', filter: 'blur(110px)', pointerEvents: 'none', zIndex: 0 }} />

      {/* Top nav */}
      <div style={{ position: 'relative', zIndex: 2, borderBottom: '1px solid rgba(255,255,255,0.055)', padding: '10px 24px', display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', background: 'rgba(8,8,8,0.88)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', flexShrink: 0 }}>
        {/* Left — Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/Logo Only Transparent.png" alt="Semper Mind" style={{ height: 52, width: 'auto', objectFit: 'contain' }} />
          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, fontWeight: 700, color: '#fff', letterSpacing: '0.12em' }}>SEMPER MIND</span>
        </div>
        {/* Center — Session Title */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
            Forté Communication Style Debrief
          </div>
        </div>
        {/* Right — Session Live + New Session */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 20, padding: '5px 13px' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e' }} />
            <span style={{ fontSize: 12, color: '#22c55e', fontWeight: 600, letterSpacing: '0.04em' }}>Session Live</span>
          </div>
          {screen === 'debrief' && (
            <button
              onClick={() => { setScreen('upload'); setSession(null); }}
              style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, color: 'rgba(255,255,255,0.42)', fontSize: 12, padding: '6px 12px', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              New Session
            </button>
          )}
        </div>
      </div>

      {/* Screen */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
        {screen === 'upload' && (
          <UploadScreen onComplete={(data) => { setSession(data); setScreen('debrief'); }} />
        )}
        {screen === 'debrief' && session && (
          <DebriefScreen name={session.name} file={session.file} />
        )}
      </div>
    </div>
  );
}
