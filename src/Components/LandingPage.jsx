import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, BrainCircuit, Check, CircleAlert, Code, Heart, History, Menu, Sparkles, X, Zap } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

// Syntax tokens for the hero code preview
const Kw = ({ children }) => <span className="text-primary">{children}</span>;
const Fn = ({ children }) => <span className="text-foreground">{children}</span>;
const Num = ({ children }) => <span className="text-muted-foreground">{children}</span>;
const Str = ({ children }) => <span className="text-muted-foreground">{children}</span>;

const CodeLine = ({ n, indent = 0, error = false, badge = null, children }) => (
  <div className={`flex min-h-8 items-center ${error ? 'bg-destructive/10 shadow-[inset_3px_0_0_rgb(var(--destructive))]' : ''}`}>
    <span className={`w-14 shrink-0 select-none pr-5 text-right ${error ? 'text-destructive' : 'text-subtle'}`}>{n}</span>
    <span className={`whitespace-pre ${error ? 'text-destructive' : ''}`}>
      {'    '.repeat(indent)}
      {children}
    </span>
    {badge}
  </div>
);

// Wide hero mockup: up to 1200px wide and 858.9px tall on desktop; fluid below that.
const CodePreview = () => (
  <div className="mx-auto flex w-full max-w-[1200px] flex-col overflow-hidden rounded-2xl border border-border bg-card text-left shadow-2xl shadow-black/10 lg:h-[858.9px] dark:shadow-black/80">
    <div className="flex shrink-0 items-center gap-2.5 border-b border-border bg-muted px-5 py-4">
      <span className="h-3.5 w-3.5 rounded-full bg-border" />
      <span className="h-3.5 w-3.5 rounded-full bg-border" />
      <span className="h-3.5 w-3.5 rounded-full bg-border" />
      <span className="ml-3 font-mono text-sm text-subtle">buggy_code.py</span>
      <span className="ml-auto inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-sm font-medium text-muted-foreground">
        <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
        AI analyzing
      </span>
    </div>

    <div className="min-h-0 flex-1 overflow-x-auto overflow-y-hidden py-5 font-mono text-sm leading-8 sm:text-[15px] lg:text-base">
      <CodeLine n={1}><Kw>def</Kw> <Fn>calculate_average</Fn>(nums):</CodeLine>
      <CodeLine n={2} indent={1}>total = <Num>0</Num></CodeLine>
      <CodeLine n={3} indent={1}><Kw>for</Kw> n <Kw>in</Kw> nums:</CodeLine>
      <CodeLine n={4} indent={2}>total += n</CodeLine>
      <CodeLine
        n={5}
        indent={1}
        error
        badge={
          <span className="ml-auto mr-5 inline-flex shrink-0 items-center gap-1.5 rounded-full bg-destructive/15 px-3 py-1 font-sans text-xs font-medium text-destructive sm:text-sm">
            <CircleAlert size={14} />
            ZeroDivisionError
          </span>
        }
      >
        <Kw>return</Kw> total / <Fn>len</Fn>(nums)
      </CodeLine>
      <CodeLine n={6}>{''}</CodeLine>
      <CodeLine n={7}><Kw>def</Kw> <Fn>find_maximum</Fn>(nums):</CodeLine>
      <CodeLine n={8} indent={1}>highest = nums[<Num>0</Num>]</CodeLine>
      <CodeLine n={9} indent={1}><Kw>for</Kw> n <Kw>in</Kw> nums:</CodeLine>
      <CodeLine n={10} indent={2}><Kw>if</Kw> n &gt; highest:</CodeLine>
      <CodeLine n={11} indent={3}>highest = n</CodeLine>
      <CodeLine n={12} indent={1}><Kw>return</Kw> highest</CodeLine>
      <CodeLine n={13}>{''}</CodeLine>
      <CodeLine n={14}><Kw>def</Kw> <Fn>main</Fn>():</CodeLine>
      <CodeLine n={15} indent={1}>numbers = []</CodeLine>
      <CodeLine n={16} indent={1}><Fn>print</Fn>(<Str>"Average:"</Str>, <Fn>calculate_average</Fn>(numbers))</CodeLine>
      <CodeLine n={17} indent={1}><Fn>print</Fn>(<Str>"Maximum:"</Str>, <Fn>find_maximum</Fn>(numbers))</CodeLine>
      <CodeLine n={18}>{''}</CodeLine>
      <CodeLine n={19}><Fn>main</Fn>()</CodeLine>
    </div>

    <div className="flex shrink-0 items-start gap-4 border-t border-border bg-muted/40 px-6 py-5">
      <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
        <Sparkles size={18} />
      </span>
      <div className="min-w-0">
        <p className="text-base font-semibold text-foreground">
          AI Fix <span className="font-normal text-muted-foreground">· Add a guard clause for empty lists</span>
        </p>
        <code className="mt-2.5 inline-block rounded-lg border border-border bg-card px-3 py-1.5 font-mono text-sm text-foreground">
          if not nums: return 0
        </code>
      </div>
    </div>
  </div>
);

const LandingPage = ({ setPage }) => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // The page content is sticky with a negative top, so once you reach its end it stays
  // pinned while the footer (a full-screen panel) slides up and covers it.
  const mainRef = useRef(null);
  const [stickyTop, setStickyTop] = useState(0);

  useEffect(() => {
    const main = mainRef.current;
    if (!main) return undefined;
    const update = () => setStickyTop(Math.min(0, window.innerHeight - main.offsetHeight));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(main);
    window.addEventListener('resize', update);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans overflow-x-clip">

      {/* ───────────── NAVBAR (floating pill) ───────────── */}
      <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6 sm:pt-4">
        <nav
          aria-label="Main"
          className={`mx-auto grid max-w-7xl grid-cols-[1fr_auto] items-center rounded-full border border-border bg-card/90 py-2 pl-3 pr-2.5 backdrop-blur-md transition-shadow duration-300 md:grid-cols-[1fr_auto_1fr] sm:pl-4 ${
            scrolled
              ? 'shadow-xl shadow-black/10 dark:shadow-black/60'
              : 'shadow-md shadow-black/5 dark:shadow-black/30'
          }`}
        >
          {/* Logo */}
          <button
            type="button"
            className="flex items-center gap-2.5 justify-self-start"
            onClick={() => scrollTo('hero')}
            aria-label="ShazDebug home"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-muted text-primary">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M8 3L4 7L8 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 3L20 7L16 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 3L10 21" stroke="currentColor" strokeOpacity="0.55" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="18" cy="17" r="3" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M20.5 19.5L22 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </span>
            <span className="text-lg font-bold tracking-tight">
              <span className="text-foreground">Shaz</span><span className="text-primary">Debug</span>
            </span>
          </button>

          {/* Centre links (desktop) */}
          <div className="hidden items-center gap-1 md:flex">
            {[
              { label: 'Home', target: 'hero' },
              { label: 'About Us', target: 'about' },
            ].map((link) => (
              <button
                key={link.target}
                onClick={() => scrollTo(link.target)}
                className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* Actions (desktop) */}
          <div className="hidden items-center gap-2 justify-self-end md:flex">
            <ThemeToggle className="rounded-full" />
            <button
              onClick={() => setPage('login')}
              className="rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            >
              Sign in
            </button>
            <button
              onClick={() => setPage('register')}
              className="rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90"
            >
              Sign up
            </button>
          </div>

          {/* Mobile controls */}
          <div className="flex items-center gap-1.5 justify-self-end md:hidden">
            <ThemeToggle className="rounded-full" />
            <button
              className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </nav>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="mx-auto mt-2 flex max-w-7xl flex-col gap-1 rounded-3xl border border-border bg-card/95 p-3 shadow-xl shadow-black/10 backdrop-blur-md md:hidden dark:shadow-black/60">
            <button onClick={() => scrollTo('hero')} className="rounded-2xl px-4 py-3 text-left text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">Home</button>
            <button onClick={() => scrollTo('about')} className="rounded-2xl px-4 py-3 text-left text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">About Us</button>
            <div className="mt-1 grid grid-cols-2 gap-2">
              <button onClick={() => setPage('login')} className="rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted">Sign in</button>
              <button onClick={() => setPage('register')} className="rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90">Sign up</button>
            </div>
          </div>
        )}
      </header>

      <main ref={mainRef} className="sticky z-[1] bg-background" style={{ top: stickyTop }}>
      {/* ───────────── HERO SECTION ───────────── */}
      <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden">

        {/* Subtle grid pattern */}
        <div className="absolute inset-0 text-foreground opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)', backgroundSize: '60px 60px' }}>
        </div>

        {/* Subtle center glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 text-center pt-24 pb-16">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-foreground/5 border border-foreground/10 rounded-full px-4 py-1.5 mb-8">
            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></div>
            <span className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">AI-Powered Debugging</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6 tracking-tight">
            <span className="text-foreground">Debug Smarter,</span>
            <br />
            <span className="text-primary">
              Ship Faster.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-muted-foreground text-lg md:text-xl leading-relaxed max-w-2xl mx-auto mb-10">
            Paste your broken code, get instant AI-powered analysis, root cause detection,
            and a working fix — in seconds. No more hours wasted on stack traces.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <button
              onClick={() => setPage('login')}
              className="group px-8 py-3.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl transition-all hover:-translate-y-1 active:translate-y-0 text-base flex items-center gap-2 shadow-lg shadow-primary/20">
              Get Started Free
              <ArrowRight size={18} strokeWidth={2.5} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button onClick={() => scrollTo('about')}
              className="px-8 py-3.5 bg-transparent hover:bg-foreground/5 border border-border hover:border-muted-foreground text-muted-foreground hover:text-foreground font-semibold rounded-xl transition-all text-base">
              Learn More
            </button>
          </div>

          <CodePreview />
        </div>
      </section>

      {/* ───────────── ABOUT US SECTION ───────────── */}
      <section id="about" className="py-24 px-6 relative">

        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent"></div>

        <div className="max-w-6xl mx-auto">

          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-foreground/5 border border-foreground/10 rounded-full px-4 py-1.5 mb-5">
              <span className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">About Us</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-foreground">
              Why <span className="text-primary">ShazDebug?</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
              We built the tool we always wished existed. No fluff — just paste your code,
              get a real fix, and move on.
            </p>
          </div>

          {/* Feature Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
            {[
              {
                icon: <BrainCircuit size={28} strokeWidth={1.8} />,
                title: 'AI-Powered Analysis',
                desc: 'Leverages cutting-edge language models to understand your code semantically — not just pattern-match against known errors.',
              },
              {
                icon: <Zap size={28} strokeWidth={1.8} />,
                title: 'Instant Results',
                desc: 'No waiting, no queues. Submit your code and get a detailed root cause analysis with a working fix in under a few seconds.',
              },
              {
                icon: <History size={28} strokeWidth={1.8} />,
                title: 'Full History Tracking',
                desc: 'Every debug session is saved to your personal history. Revisit past fixes, compare approaches, and learn from your own code.',
              },
            ].map((card, i) => (
              <div key={i}
                className="group bg-card border border-border rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:border-muted-foreground hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/50">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-5 text-primary bg-primary/10 border border-border">
                  {card.icon}
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{card.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>

          {/* Mission Statement */}
          <div className="relative bg-card border border-border rounded-2xl p-10 text-center overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[1px] bg-gradient-to-r from-transparent via-border to-transparent"></div>
            <div className="relative z-10">
              <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">Our Mission</h3>
              <p className="text-muted-foreground text-base md:text-lg leading-relaxed max-w-3xl mx-auto mb-6">
                We believe every developer deserves a brilliant debugging partner. ShazDebug was born
                from the frustration of spending hours on bugs that should take minutes. We combine the power
                of modern AI with a clean, distraction-free interface — so you can focus on building, not broken code.
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-sm">
                {['Free to Start', 'Secure & Private', 'Any Language', 'No Setup Required'].map((tag) => (
                  <span key={tag} className="flex items-center gap-1.5 text-muted-foreground">
                    <Check size={14} strokeWidth={3} className="text-primary" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      </main>

      {/* ───────────── FOOTER ───────────── */}
      <footer className="relative z-[2]">
        <div
          className="relative flex min-h-screen w-full flex-col overflow-hidden rounded-t-[36px] bg-zinc-950 px-6 pt-32 text-zinc-300 sm:px-12 lg:px-20"
          style={{ backgroundImage: 'radial-gradient(ellipse at top left, rgba(61,220,132,0.16), transparent 55%)' }}
        >
          <div className="grid gap-12 md:grid-cols-[1.2fr_2fr]">
            {/* Brand + call to action */}
            <div className="max-w-sm">
              <button
                type="button"
                onClick={() => scrollTo('hero')}
                className="flex items-center gap-3"
                aria-label="ShazDebug home"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-[#3DDC84]">
                  <Code size={20} />
                </span>
                <span className="text-xl font-bold tracking-tight text-white">
                  Shaz<span className="text-[#3DDC84]">Debug</span>
                </span>
              </button>
              <p className="mt-5 text-sm leading-relaxed text-zinc-400">
                AI-powered debugging. Paste your broken code and get the root cause and a working fix in seconds.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={() => setPage('register')}
                  className="rounded-full bg-[#3DDC84] px-5 py-2.5 text-sm font-semibold text-zinc-950 transition-opacity hover:opacity-90"
                >
                  Get started
                </button>
                <button
                  onClick={() => setPage('login')}
                  className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                >
                  Sign in
                </button>
              </div>
            </div>

            {/* Link columns */}
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
              {[
                {
                  title: 'Product',
                  links: [
                    { label: 'AI-powered analysis', onClick: () => scrollTo('about') },
                    { label: 'Instant results', onClick: () => scrollTo('about') },
                    { label: 'History tracking', onClick: () => scrollTo('about') },
                  ],
                },
                {
                  title: 'Explore',
                  links: [
                    { label: 'Home', onClick: () => scrollTo('hero') },
                    { label: 'About us', onClick: () => scrollTo('about') },
                    { label: 'Our mission', onClick: () => scrollTo('about') },
                  ],
                },
                {
                  title: 'Account',
                  links: [
                    { label: 'Sign in', onClick: () => setPage('login') },
                    { label: 'Sign up', onClick: () => setPage('register') },
                  ],
                },
              ].map((column) => (
                <div key={column.title}>
                  <h4 className="border-b border-white/10 pb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                    {column.title}
                  </h4>
                  <ul className="mt-4 space-y-3">
                    {column.links.map((link) => (
                      <li key={link.label}>
                        <button
                          onClick={link.onClick}
                          className="text-sm text-zinc-300 transition-colors hover:text-white"
                        >
                          {link.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Large faded wordmark */}
          <div
            aria-hidden="true"
            className="my-auto select-none bg-clip-text text-center text-[clamp(2.25rem,13vw,17rem)] font-extrabold leading-[0.9] tracking-tight text-transparent"
            style={{
              // Soft white fade from the top, with a hint of brand green rising from the bottom corners.
              backgroundImage:
                'radial-gradient(ellipse at 0% 100%, rgba(61,220,132,0.30), transparent 42%), radial-gradient(ellipse at 100% 100%, rgba(61,220,132,0.34), transparent 42%), linear-gradient(to bottom, rgba(255,255,255,0.2), rgba(255,255,255,0.05))',
            }}
          >
            SHAZDEBUG
          </div>

          {/* Bottom bar */}
          <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-white/10 py-6 text-xs text-zinc-500 md:flex-row">
            <span>© {new Date().getFullYear()} ShazDebug. All rights reserved.</span>
            <span className="inline-flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#3DDC84]" />
              All systems operational
            </span>
            <span className="inline-flex items-center gap-1.5">
              Built with <Heart size={13} className="text-[#3DDC84]" fill="currentColor" /> for developers who hate broken code.
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
