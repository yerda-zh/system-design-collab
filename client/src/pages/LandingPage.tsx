import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  Layers, Users, Zap, MessageSquare, History,
  CheckCircle2, LayoutGrid, GitBranch,
} from 'lucide-react';

// ─── Scroll reveal hook ───────────────────────────────────────────────────────
function useScrollReveal(options?: { delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });
  return { ref, inView, delay: options?.delay ?? 0 };
}

// ─── Mobile detection ─────────────────────────────────────────────────────────
function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return mobile;
}

// ─── Navbar ───────────────────────────────────────────────────────────────────
function Navbar() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [scrolled, setScrolled] = useState(false);
  const [signInHovered, setSignInHovered] = useState(false);
  const [ctaHovered, setCtaHovered] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 2rem',
        zIndex: 1000,
        backgroundColor: scrolled
          ? 'rgba(15, 23, 42, 0.95)'
          : 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: scrolled
          ? '1px solid rgba(255,255,255,0.1)'
          : '1px solid rgba(255,255,255,0.06)',
        transition: 'background-color 0.3s, border-color 0.3s',
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        <Layers size={22} color="#A78BFA" />
        <span style={{ color: 'white', fontWeight: 700, fontSize: '1rem' }}>
          System Design Collab
        </span>
      </div>

      {/* Right actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        {!isMobile && (
          <button
            onClick={() => navigate('/login')}
            onMouseEnter={() => setSignInHovered(true)}
            onMouseLeave={() => setSignInHovered(false)}
            style={{
              background: 'none',
              border: 'none',
              color: signInHovered ? 'white' : '#94A3B8',
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'color 0.15s',
              padding: 0,
            }}
          >
            Sign in
          </button>
        )}
        <button
          onClick={() => navigate('/register')}
          onMouseEnter={() => setCtaHovered(true)}
          onMouseLeave={() => setCtaHovered(false)}
          style={{
            backgroundColor: ctaHovered ? '#6D28D9' : '#7C3AED',
            color: 'white',
            padding: '0.5rem 1.1rem',
            borderRadius: '8px',
            fontSize: '0.9rem',
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
            transition: 'background-color 0.15s, transform 0.15s, box-shadow 0.15s',
            transform: ctaHovered ? 'translateY(-1px)' : 'none',
            boxShadow: ctaHovered
              ? '0 4px 12px rgba(124, 58, 237, 0.4)'
              : 'none',
          }}
        >
          Get started free →
        </button>
      </div>
    </nav>
  );
}

// ─── Hero canvas illustration ─────────────────────────────────────────────────
function CanvasIllustration() {
  return (
    <svg width="100%" height="400" viewBox="0 0 860 400" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="12" cy="12" r="0.8" fill="#CBD5E1" opacity="0.4" />
        </pattern>
        <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#94A3B8" />
        </marker>
      </defs>
      {/* Background */}
      <rect width="860" height="400" fill="#F8FAFC" />
      <rect x="48" width="812" height="400" fill="url(#dots)" />
      {/* Left sidebar */}
      <rect x="0" y="0" width="48" height="400" fill="#1E293B" />
      <circle cx="24" cy="32" r="8" fill="#7C3AED" opacity="0.8" />
      <rect x="12" y="56" width="24" height="3" rx="1.5" fill="#334155" />
      <rect x="12" y="66" width="24" height="3" rx="1.5" fill="#334155" />
      <rect x="12" y="76" width="24" height="3" rx="1.5" fill="#334155" />
      {/* Connector lines */}
      <path d="M 266 170 L 380 120" stroke="#94A3B8" strokeWidth="1.5" fill="none" markerEnd="url(#arrowhead)" />
      <path d="M 266 190 L 380 240" stroke="#94A3B8" strokeWidth="1.5" fill="none" markerEnd="url(#arrowhead)" />
      <path d="M 540 120 L 620 170" stroke="#94A3B8" strokeWidth="1.5" fill="none" markerEnd="url(#arrowhead)" />
      <path d="M 540 240 L 620 200" stroke="#94A3B8" strokeWidth="1.5" fill="none" markerEnd="url(#arrowhead)" />
      {/* Service node — purple */}
      <rect x="140" y="155" width="126" height="60" rx="8" fill="white" stroke="#E2E8F0" strokeWidth="1" />
      <rect x="140" y="155" width="126" height="16" rx="8" fill="#7C3AED" />
      <rect x="140" y="163" width="126" height="8" fill="#7C3AED" />
      <text x="203" y="167" textAnchor="middle" fill="white" fontSize="9" fontFamily="Inter,sans-serif" fontWeight="600">API Gateway</text>
      <text x="203" y="188" textAnchor="middle" fill="#64748B" fontSize="8" fontFamily="Inter,sans-serif">Service</text>
      {/* Database node — blue */}
      <rect x="380" y="90" width="120" height="60" rx="8" fill="white" stroke="#E2E8F0" strokeWidth="1" />
      <rect x="380" y="90" width="120" height="16" rx="8" fill="#2563EB" />
      <rect x="380" y="98" width="120" height="8" fill="#2563EB" />
      <text x="440" y="102" textAnchor="middle" fill="white" fontSize="9" fontFamily="Inter,sans-serif" fontWeight="600">PostgreSQL</text>
      <text x="440" y="122" textAnchor="middle" fill="#64748B" fontSize="8" fontFamily="Inter,sans-serif">Database</text>
      {/* Cache node — green */}
      <rect x="380" y="210" width="120" height="60" rx="8" fill="white" stroke="#E2E8F0" strokeWidth="1" />
      <rect x="380" y="210" width="120" height="16" rx="8" fill="#16A34A" />
      <rect x="380" y="218" width="120" height="8" fill="#16A34A" />
      <text x="440" y="222" textAnchor="middle" fill="white" fontSize="9" fontFamily="Inter,sans-serif" fontWeight="600">Redis</text>
      <text x="440" y="242" textAnchor="middle" fill="#64748B" fontSize="8" fontFamily="Inter,sans-serif">Cache</text>
      {/* Queue node — amber */}
      <rect x="620" y="155" width="120" height="60" rx="8" fill="white" stroke="#E2E8F0" strokeWidth="1" />
      <rect x="620" y="155" width="120" height="16" rx="8" fill="#D97706" />
      <rect x="620" y="163" width="120" height="8" fill="#D97706" />
      <text x="680" y="167" textAnchor="middle" fill="white" fontSize="9" fontFamily="Inter,sans-serif" fontWeight="600">Kafka</text>
      <text x="680" y="188" textAnchor="middle" fill="#64748B" fontSize="8" fontFamily="Inter,sans-serif">Queue</text>
      {/* Cursor: Alex */}
      <g transform="translate(310, 130)">
        <path d="M0 0 L0 12 L3.5 9 L6 14 L7.5 13.5 L5 8.5 L9 8.5 Z" fill="#E11D48" stroke="white" strokeWidth="0.8" />
        <rect x="10" y="2" width="30" height="14" rx="4" fill="#E11D48" />
        <text x="25" y="12" textAnchor="middle" fill="white" fontSize="7" fontFamily="Inter,sans-serif">Alex</text>
      </g>
      {/* Cursor: Priya */}
      <g transform="translate(490, 260)">
        <path d="M0 0 L0 12 L3.5 9 L6 14 L7.5 13.5 L5 8.5 L9 8.5 Z" fill="#7C3AED" stroke="white" strokeWidth="0.8" />
        <rect x="10" y="2" width="32" height="14" rx="4" fill="#7C3AED" />
        <text x="26" y="12" textAnchor="middle" fill="white" fontSize="7" fontFamily="Inter,sans-serif">Priya</text>
      </g>
    </svg>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero() {
  const navigate = useNavigate();
  const [primaryHovered, setPrimaryHovered] = useState(false);
  const [secondaryHovered, setSecondaryHovered] = useState(false);

  const scrollToHowItWorks = () => {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #0F172A 0%, #1A0533 50%, #0F172A 100%)',
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {/* Decorative blobs */}
      <div style={{ position: 'absolute', top: '-100px', left: '-100px', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '0', right: '-50px', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ maxWidth: '800px', width: '100%', margin: '0 auto', padding: '0 2rem', paddingTop: '140px', paddingBottom: '80px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        {/* Badge */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <span style={{ backgroundColor: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', color: '#C4B5FD', padding: '0.3rem 0.9rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 500, display: 'inline-block', marginBottom: '1.5rem' }}>
            ✦ Built for engineering teams
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
          style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 800, color: 'white', lineHeight: 1.1, marginBottom: '1.25rem', margin: '0 0 1.25rem' }}>
          The{' '}
          <span style={{ background: 'linear-gradient(135deg, #A78BFA, #7C3AED)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            collaborative
          </span>
          {' '}canvas for system architects
        </motion.h1>

        {/* Subheading */}
        <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
          style={{ fontSize: '1.1rem', color: '#94A3B8', lineHeight: 1.7, maxWidth: '580px', margin: '0 auto 2rem' }}>
          Design systems together in real time. Typed components, live cursors,
          architectural warnings, and threaded discussions — all in one canvas.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
          style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/register')}
            onMouseEnter={() => setPrimaryHovered(true)}
            onMouseLeave={() => setPrimaryHovered(false)}
            style={{
              backgroundColor: primaryHovered ? '#6D28D9' : '#7C3AED',
              color: 'white',
              padding: '0.75rem 1.75rem',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              transition: 'background-color 0.15s, box-shadow 0.15s',
              boxShadow: primaryHovered ? '0 8px 24px rgba(124,58,237,0.45)' : '0 4px 12px rgba(124,58,237,0.3)',
            }}
          >
            Get started free →
          </button>
          <button
            onClick={scrollToHowItWorks}
            onMouseEnter={() => setSecondaryHovered(true)}
            onMouseLeave={() => setSecondaryHovered(false)}
            style={{
              backgroundColor: secondaryHovered ? 'rgba(255,255,255,0.05)' : 'transparent',
              border: secondaryHovered ? '1px solid rgba(255,255,255,0.25)' : '1px solid rgba(255,255,255,0.15)',
              color: '#CBD5E1',
              padding: '0.75rem 1.75rem',
              borderRadius: '8px',
              fontSize: '1rem',
              cursor: 'pointer',
              transition: 'background-color 0.15s, border-color 0.15s',
            }}
          >
            See how it works ↓
          </button>
        </motion.div>

        {/* Browser mockup */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          style={{ maxWidth: '900px', margin: '3rem auto 0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08)' }}
        >
          {/* Browser chrome */}
          <div style={{ backgroundColor: '#1E293B', padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#FF5F57', display: 'inline-block' }} />
            <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#FFBD2E', display: 'inline-block' }} />
            <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#28C840', display: 'inline-block' }} />
            <div style={{ flex: 1, backgroundColor: '#0F172A', borderRadius: '6px', padding: '0.3rem 0.75rem', fontSize: '0.75rem', color: '#475569', marginLeft: '0.5rem', textAlign: 'left' }}>
              systemdesigncollab.app/room/architecture-review
            </div>
          </div>
          {/* Canvas content */}
          <div style={{ backgroundColor: '#F8FAFC', height: '400px', position: 'relative', overflow: 'hidden' }}>
            <CanvasIllustration />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Social proof bar ─────────────────────────────────────────────────────────
function SocialProofBar() {
  return (
    <section style={{ backgroundColor: '#0F172A', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '1.25rem 2rem' }}>
      <p style={{ fontSize: '0.82rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center', marginBottom: '0.875rem' }}>
        Designed for teams who care about their architecture
      </p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
        {[
          { icon: <Users size={14} color="#7C3AED" />, label: 'Real-time collaboration' },
          { icon: <Zap size={14} color="#7C3AED" />, label: 'Live warnings' },
          { icon: <MessageSquare size={14} color="#7C3AED" />, label: 'Threaded comments' },
          { icon: <History size={14} color="#7C3AED" />, label: 'Version snapshots' },
        ].map(({ icon, label }) => (
          <div key={label} style={{ color: '#64748B', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {icon}
            {label}
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Feature: Real-time Collaboration ────────────────────────────────────────
function FeatureCollaboration({ isMobile }: { isMobile: boolean }) {
  const { ref, inView } = useScrollReveal();

  return (
    <section style={{ padding: '6rem 2rem' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '5rem', alignItems: 'center' }}>
        {/* Text side */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, x: -40 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.7 }}
        >
          <p style={{ color: '#7C3AED', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.15em', marginBottom: '0.75rem' }}>COLLABORATION</p>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.2, marginBottom: '1rem' }}>Work together in real time</h2>
          <p style={{ color: '#64748B', lineHeight: 1.8, fontSize: '1rem', marginBottom: '1.25rem' }}>
            See your teammates' cursors live on the canvas. Every node move, connection, and edit syncs instantly. Conflict resolution keeps everyone in sync even when editing simultaneously.
          </p>
          {[
            'Live cursors with user names',
            'Automatic conflict resolution (OT)',
            'Real-time user presence',
          ].map((item) => (
            <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#374151', fontSize: '0.9rem', marginTop: '0.6rem' }}>
              <CheckCircle2 size={16} color="#7C3AED" />
              {item}
            </div>
          ))}
        </motion.div>

        {/* Visual side */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          <div style={{ backgroundColor: '#0F172A', borderRadius: '16px', padding: '2rem', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.06)' }}>
            {/* Mini canvas with cursors */}
            <div style={{ backgroundColor: '#1E293B', borderRadius: '10px', padding: '1.5rem', position: 'relative', minHeight: '200px' }}>
              {/* Simplified node boxes */}
              <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ flex: 1, backgroundColor: '#0F172A', borderRadius: '8px', padding: '0.75rem 1rem', border: '1px solid rgba(37,99,235,0.4)' }}>
                  <div style={{ width: '100%', height: '6px', borderRadius: '3px', backgroundColor: '#2563EB', marginBottom: '0.5rem' }} />
                  <p style={{ color: '#94A3B8', fontSize: '0.75rem', margin: 0 }}>PostgreSQL</p>
                </div>
                <div style={{ flex: 1, backgroundColor: '#0F172A', borderRadius: '8px', padding: '0.75rem 1rem', border: '1px solid rgba(124,58,237,0.4)' }}>
                  <div style={{ width: '100%', height: '6px', borderRadius: '3px', backgroundColor: '#7C3AED', marginBottom: '0.5rem' }} />
                  <p style={{ color: '#94A3B8', fontSize: '0.75rem', margin: 0 }}>API Service</p>
                </div>
              </div>
              {/* Cursor: Alex */}
              <div style={{ position: 'absolute', top: '1.5rem', left: '2.5rem', display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
                <div style={{ width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderBottom: '10px solid #E11D48' }} />
                <div style={{ backgroundColor: '#E11D48', color: 'white', fontSize: '10px', padding: '1px 6px', borderRadius: '4px', whiteSpace: 'nowrap' }}>Alex</div>
              </div>
              {/* Cursor: Priya */}
              <div style={{ position: 'absolute', bottom: '2rem', right: '3rem', display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
                <div style={{ width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderBottom: '10px solid #16A34A' }} />
                <div style={{ backgroundColor: '#16A34A', color: 'white', fontSize: '10px', padding: '1px 6px', borderRadius: '4px', whiteSpace: 'nowrap' }}>Priya</div>
              </div>
              {/* Connection line SVG */}
              <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }} viewBox="0 0 300 200" preserveAspectRatio="none">
                <line x1="100" y1="60" x2="200" y2="60" stroke="#334155" strokeWidth="1.5" strokeDasharray="4 3" />
              </svg>
            </div>
            {/* Online badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#22C55E' }} />
              <span style={{ color: '#64748B', fontSize: '0.8rem' }}>2 collaborators online</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Feature: Warning Engine ──────────────────────────────────────────────────
function FeatureWarnings({ isMobile }: { isMobile: boolean }) {
  const { ref, inView } = useScrollReveal();

  return (
    <section style={{ backgroundColor: '#FAFAFA', padding: '6rem 0' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 2rem', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '5rem', alignItems: 'center' }}>
        {/* Visual side (left) */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, x: -40 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.7 }}
          style={{ order: isMobile ? 2 : 1 }}
        >
          <div style={{ backgroundColor: '#0F172A', borderRadius: '16px', padding: '2rem', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.06)' }}>
            {/* Node with warning badge */}
            <div style={{ backgroundColor: '#1E293B', borderRadius: '10px', padding: '1rem 1.25rem', marginBottom: '1rem', position: 'relative', border: '1px solid rgba(239,68,68,0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ width: '80px', height: '6px', borderRadius: '3px', backgroundColor: '#2563EB', marginBottom: '0.4rem' }} />
                  <p style={{ color: '#94A3B8', fontSize: '0.75rem', margin: 0 }}>User Service</p>
                </div>
                <div style={{ width: 22, height: 22, borderRadius: '50%', backgroundColor: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ color: 'white', fontSize: '12px', fontWeight: 700, lineHeight: 1 }}>!</span>
                </div>
              </div>
            </div>
            {/* Warning list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                { label: 'Single point of failure', color: '#EF4444', severity: 'High' },
                { label: 'No cache layer detected', color: '#F59E0B', severity: 'Med' },
                { label: 'Cascading failure risk', color: '#F59E0B', severity: 'Med' },
              ].map(({ label, color, severity }) => (
                <div key={label} style={{ backgroundColor: '#1E293B', borderRadius: '8px', padding: '0.6rem 0.875rem', display: 'flex', alignItems: 'center', gap: '0.75rem', border: `1px solid ${color}22` }}>
                  <div style={{ width: '3px', height: '32px', backgroundColor: color, borderRadius: '2px', flexShrink: 0 }} />
                  <span style={{ color: '#CBD5E1', fontSize: '0.8rem', flex: 1 }}>{label}</span>
                  <span style={{ color, fontSize: '0.7rem', fontWeight: 700 }}>{severity}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Text side (right) */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.2 }}
          style={{ order: isMobile ? 1 : 2 }}
        >
          <p style={{ color: '#7C3AED', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.15em', marginBottom: '0.75rem' }}>INTELLIGENCE</p>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.2, marginBottom: '1rem' }}>Catch architecture mistakes before they happen</h2>
          <p style={{ color: '#64748B', lineHeight: 1.8, fontSize: '1rem', marginBottom: '1.25rem' }}>
            The warning engine continuously analyzes your canvas graph. Single points of failure, missing cache layers, cascading failure risks — flagged automatically as you design.
          </p>
          {[
            'Single point of failure detection',
            'Missing cache layer warnings',
            'Cascading failure risk analysis',
          ].map((item) => (
            <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#374151', fontSize: '0.9rem', marginTop: '0.6rem' }}>
              <CheckCircle2 size={16} color="#7C3AED" />
              {item}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ─── Feature: Typed Components ────────────────────────────────────────────────
function FeatureComponents({ isMobile }: { isMobile: boolean }) {
  const { ref, inView } = useScrollReveal();

  const componentItems = [
    { label: 'PostgreSQL', sublabel: 'Database', color: '#2563EB' },
    { label: 'Redis', sublabel: 'Cache', color: '#16A34A' },
    { label: 'Kafka', sublabel: 'Queue', color: '#D97706' },
    { label: 'API Gateway', sublabel: 'Service', color: '#7C3AED' },
  ];

  return (
    <section style={{ backgroundColor: 'white', padding: '6rem 2rem' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '5rem', alignItems: 'center' }}>
        {/* Text side */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, x: -40 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.7 }}
        >
          <p style={{ color: '#7C3AED', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.15em', marginBottom: '0.75rem' }}>COMPONENTS</p>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.2, marginBottom: '1rem' }}>Every node means something</h2>
          <p style={{ color: '#64748B', lineHeight: 1.8, fontSize: '1rem', marginBottom: '1.25rem' }}>
            Drop a PostgreSQL, Redis, Kafka, or API Gateway with a single click. Each component carries semantic meaning — the warning engine understands what each node is and how it typically behaves.
          </p>
          {[
            'Semantic node types with metadata',
            'Component-aware warning rules',
            'One-click drag to canvas',
          ].map((item) => (
            <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#374151', fontSize: '0.9rem', marginTop: '0.6rem' }}>
              <CheckCircle2 size={16} color="#7C3AED" />
              {item}
            </div>
          ))}
        </motion.div>

        {/* Visual side */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          <div style={{ backgroundColor: '#0F172A', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ color: '#475569', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Component Library</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {componentItems.map(({ label, sublabel, color }) => (
                <div key={label} style={{ backgroundColor: '#1E293B', borderRadius: '8px', padding: '0.875rem 1rem', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '6px', backgroundColor: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '2px', backgroundColor: color }} />
                  </div>
                  <div>
                    <p style={{ color: '#E2E8F0', fontSize: '0.8rem', fontWeight: 600, margin: 0, lineHeight: 1.2 }}>{label}</p>
                    <p style={{ color: '#475569', fontSize: '0.7rem', margin: 0 }}>{sublabel}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── How It Works ─────────────────────────────────────────────────────────────
function HowItWorks() {
  const { ref, inView } = useScrollReveal();

  const steps = [
    {
      number: '01',
      icon: <LayoutGrid size={28} color="#7C3AED" />,
      title: 'Create a canvas',
      body: 'Start a new canvas and invite your team via a shareable link.',
      delay: 0,
    },
    {
      number: '02',
      icon: <GitBranch size={28} color="#7C3AED" />,
      title: 'Design together',
      body: 'Drag typed components onto the canvas. Connect them, label the edges, discuss via comments.',
      delay: 0.15,
    },
    {
      number: '03',
      icon: <Zap size={28} color="#7C3AED" />,
      title: 'Get instant feedback',
      body: 'The warning engine flags issues in real time. Save named snapshots as your design evolves.',
      delay: 0.3,
    },
  ];

  return (
    <section id="how-it-works" style={{ backgroundColor: '#0F172A', padding: '6rem 2rem' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          style={{ textAlign: 'center', marginBottom: '3rem' }}
        >
          <p style={{ color: '#7C3AED', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.15em', marginBottom: '0.75rem' }}>HOW IT WORKS</p>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'white', lineHeight: 1.2 }}>
            From blank canvas to architecture review in minutes
          </h2>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '2rem' }}>
          {steps.map(({ number, icon, title, body, delay }) => (
            <StepCard key={number} number={number} icon={icon} title={title} body={body} delay={delay} inView={inView} />
          ))}
        </div>
      </div>
    </section>
  );
}

function StepCard({ number, icon, title, body, delay, inView }: {
  number: string; icon: React.ReactNode; title: string; body: string; delay: number; inView: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: '#1E293B',
        borderRadius: '12px',
        padding: '2rem',
        border: hovered ? '1px solid rgba(124,58,237,0.3)' : '1px solid rgba(255,255,255,0.06)',
        transform: hovered ? 'translateY(-4px)' : 'none',
        transition: 'border-color 0.2s, transform 0.2s',
        cursor: 'default',
      }}
    >
      <p style={{ fontSize: '3rem', fontWeight: 800, color: 'rgba(124,58,237,0.3)', margin: '0 0 0.75rem', lineHeight: 1 }}>{number}</p>
      <div style={{ marginBottom: '0.75rem' }}>{icon}</div>
      <p style={{ color: 'white', fontWeight: 700, fontSize: '1.05rem', margin: '0 0 0.5rem' }}>{title}</p>
      <p style={{ color: '#64748B', fontSize: '0.9rem', lineHeight: 1.7, margin: 0 }}>{body}</p>
    </motion.div>
  );
}

// ─── Final CTA ────────────────────────────────────────────────────────────────
function FinalCTA() {
  const navigate = useNavigate();
  const { ref, inView } = useScrollReveal();
  const [btnHovered, setBtnHovered] = useState(false);

  return (
    <section style={{ background: 'linear-gradient(135deg, #1A0533 0%, #0F172A 50%, #1A0533 100%)', padding: '8rem 2rem', textAlign: 'center' }}>
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 40 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7 }}
      >
        <p style={{ color: '#7C3AED', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.15em', marginBottom: '0.75rem' }}>START TODAY</p>
        <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, color: 'white', maxWidth: '600px', margin: '0 auto 1.5rem', lineHeight: 1.15 }}>
          Your architecture deserves a better canvas.
        </h2>
        <p style={{ color: '#64748B', marginBottom: '2.5rem', fontSize: '1rem' }}>
          Free to start. No credit card required.
        </p>
        <button
          onClick={() => navigate('/register')}
          onMouseEnter={() => setBtnHovered(true)}
          onMouseLeave={() => setBtnHovered(false)}
          style={{
            backgroundColor: '#7C3AED',
            color: 'white',
            padding: '1rem 2.5rem',
            borderRadius: '8px',
            fontSize: '1.1rem',
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
            boxShadow: btnHovered
              ? '0 12px 40px rgba(124, 58, 237, 0.6)'
              : '0 8px 32px rgba(124, 58, 237, 0.45)',
            transform: btnHovered ? 'translateY(-2px)' : 'none',
            transition: 'box-shadow 0.15s, transform 0.15s',
          }}
        >
          Get started free →
        </button>
        <p style={{ color: '#475569', fontSize: '0.88rem', marginTop: '1.25rem' }}>
          Already have an account?{' '}
          <span
            onClick={() => navigate('/login')}
            style={{ color: '#A78BFA', cursor: 'pointer' }}
          >
            Sign in
          </span>
        </p>
      </motion.div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  const navigate = useNavigate();
  const [signInHovered, setSignInHovered] = useState(false);
  const [startHovered, setStartHovered] = useState(false);

  return (
    <footer style={{ backgroundColor: '#0F172A', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '2rem' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Layers size={18} color="#A78BFA" />
          <span style={{ color: '#334155', fontSize: '0.82rem' }}>
            System Design Collab — Built for engineers
          </span>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <button
            onClick={() => navigate('/login')}
            onMouseEnter={() => setSignInHovered(true)}
            onMouseLeave={() => setSignInHovered(false)}
            style={{ background: 'none', border: 'none', color: signInHovered ? '#94A3B8' : '#475569', fontSize: '0.82rem', cursor: 'pointer', transition: 'color 0.15s', padding: 0 }}
          >
            Sign in
          </button>
          <button
            onClick={() => navigate('/register')}
            onMouseEnter={() => setStartHovered(true)}
            onMouseLeave={() => setStartHovered(false)}
            style={{ background: 'none', border: 'none', color: startHovered ? '#94A3B8' : '#475569', fontSize: '0.82rem', cursor: 'pointer', transition: 'color 0.15s', padding: 0 }}
          >
            Get started
          </button>
        </div>
      </div>
    </footer>
  );
}

// ─── Root page ────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const isMobile = useIsMobile();

  return (
    <div style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif', overflowX: 'hidden' }}>
      <Navbar />
      <Hero />
      <SocialProofBar />
      <FeatureCollaboration isMobile={isMobile} />
      <FeatureWarnings isMobile={isMobile} />
      <FeatureComponents isMobile={isMobile} />
      <HowItWorks />
      <FinalCTA />
      <Footer />
    </div>
  );
}
