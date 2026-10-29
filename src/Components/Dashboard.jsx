import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Check, Code, Copy, History, LogOut, Menu, Moon, Plus, Search, Sparkles, Sun, Trash2, Wrench } from 'lucide-react';
import api, { authHeaders, getErrorMessage, isAuthError } from '../lib/api';
import { Sidebar, SidebarBody, SidebarLabel, SidebarLink } from './ui/sidebar';
import { useTheme } from '../lib/useTheme';
import { useToast } from '../lib/useToast';

const MAX_CODE_LENGTH = 20000;
const MAX_LOG_LENGTH = 10000;
const NO_LOG_PLACEHOLDER = 'No error log provided';

const EXAMPLE_CODE = `def calculate_average(nums):
    total = 0
    for n in nums:
        total += n
    return total / len(nums)

print(calculate_average([]))`;

const EXAMPLE_LOG = `Traceback (most recent call last):
  File "main.py", line 7, in <module>
    print(calculate_average([]))
  File "main.py", line 5, in calculate_average
    return total / len(nums)
ZeroDivisionError: division by zero`;

// SQLite stores UTC as "YYYY-MM-DD HH:MM:SS"; make it a valid ISO string first.
const formatDate = (value) => {
  if (!value) return '';
  const date = new Date(`${value.replace(' ', 'T')}Z`);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
};

const firstLine = (code) => (code || '').trim().split('\n')[0] || 'Untitled code';

const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

const CopyButton = ({ getText, label = 'Copy', className = '' }) => {
  const [copied, setCopied] = useState(false);
  const toast = useToast();

  const handleCopy = async () => {
    if (await copyToClipboard(getText())) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
      toast.success('Copied to clipboard');
    } else {
      toast.error('Copy failed', 'Your browser blocked clipboard access.');
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md border border-border bg-card text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-colors ${className}`}
    >
      {copied ? (
        <>
          <Check size={14} />
          Copied
        </>
      ) : (
        <>
          <Copy size={14} />
          {label}
        </>
      )}
    </button>
  );
};

const HEADING_ICONS = [
  { pattern: /\u{1F50D}|\u{1F41B}/u, Icon: Search },
  { pattern: /\u{1F6E0}|\u{1F527}|\u{2705}/u, Icon: Wrench },
];

const EMOJI_PATTERN = /\p{Extended_Pictographic}[\u{FE0F}\u{200D}]*/gu;

const textOf = (children) => (Array.isArray(children) ? children : [children])
  .map((child) => (typeof child === 'string' ? child : ''))
  .join('');

const stripEmoji = (children) => (Array.isArray(children) ? children : [children])
  .map((child, i) => (typeof child === 'string' ? (i === 0 ? child.replace(EMOJI_PATTERN, '').trimStart() : child.replace(EMOJI_PATTERN, '')) : child));

const Heading = ({ children }) => {
  const match = HEADING_ICONS.find(({ pattern }) => pattern.test(textOf(children)));
  return (
    <h2 className="flex items-center gap-2">
      {match && <match.Icon size={18} className="shrink-0 text-primary" />}
      <span>{stripEmoji(children)}</span>
    </h2>
  );
};

// Wraps every markdown code block so it gets its own copy button.
const CodeBlock = ({ children }) => {
  const codeElement = Array.isArray(children) ? children[0] : children;
  const text = String(codeElement?.props?.children ?? '').replace(/\n$/, '');

  return (
    <div className="relative mb-3 [&>pre]:mb-0">
      <CopyButton getText={() => text} className="absolute top-2 right-2 z-10" />
      <pre>{children}</pre>
    </div>
  );
};

const CodeEditor = ({ value, onChange, onSubmit }) => {
  const gutterRef = useRef(null);
  const lineCount = useMemo(() => Math.max(1, value.split('\n').length), [value]);

  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const { selectionStart, selectionEnd } = e.target;
      const next = `${value.slice(0, selectionStart)}  ${value.slice(selectionEnd)}`;
      onChange(next);
      requestAnimationFrame(() => {
        e.target.selectionStart = e.target.selectionEnd = selectionStart + 2;
      });
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="flex flex-1 min-h-0 font-mono text-sm leading-6">
      <div
        ref={gutterRef}
        aria-hidden="true"
        className="select-none overflow-hidden text-right text-subtle bg-muted/50 border-r border-border py-3 pl-3 pr-3"
      >
        {Array.from({ length: lineCount }, (_, i) => (
          <div key={i}>{i + 1}</div>
        ))}
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onScroll={(e) => { if (gutterRef.current) gutterRef.current.scrollTop = e.target.scrollTop; }}
        wrap="off"
        spellCheck={false}
        placeholder="// Paste your problematic code here..."
        aria-label="Source code"
        className="flex-1 min-w-0 resize-none bg-transparent p-3 text-foreground placeholder:text-subtle focus:outline-none whitespace-pre overflow-auto"
      />
    </div>
  );
};

const Dashboard = ({ setPage }) => {
  const [history, setHistory] = useState([]);
  const [rawCode, setRawCode] = useState('');
  const [errorLog, setErrorLog] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeChat, setActiveChat] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const toast = useToast();
  const [confirmDelete, setConfirmDelete] = useState(null); // an item id, 'all', or null
  const [deleting, setDeleting] = useState(false);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    setPage('login');
  }, [setPage]);

  const loadHistory = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token || token === 'undefined' || token === 'null') {
      handleLogout();
      return;
    }
    try {
      const res = await api.get('/api/history', { headers: authHeaders(token) });
      setHistory(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('History fetch error', err);
      if (isAuthError(err)) {
        toast.warning('Session expired', 'Please sign in again.');
        handleLogout();
        return;
      }
      setHistory([]);
    }
  }, [handleLogout, toast]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const codeTooLong = rawCode.length > MAX_CODE_LENGTH;
  const logTooLong = errorLog.length > MAX_LOG_LENGTH;
  const canSubmit = rawCode.trim().length > 0 && !codeTooLong && !logTooLong && !loading;

  const handleFixBug = async () => {
    if (!canSubmit) return;

    const token = localStorage.getItem('token');
    if (!token) {
      handleLogout();
      return;
    }

    setLoading(true);
    setAiResponse('');
    setActiveChat(null);
    try {
      const res = await api.post(
        '/api/debug',
        { raw_code: rawCode, error_log: errorLog.trim() || NO_LOG_PLACEHOLDER },
        { headers: authHeaders(token) },
      );
      setAiResponse(res.data.response || res.data.ai_response || '');
      toast.success('Fix ready', 'Your solution is in the ShazDebug panel.');
      loadHistory();
    } catch (err) {
      console.error('Debug submission error', err);
      if (isAuthError(err)) {
        toast.warning('Session expired', 'Please sign in again.');
        handleLogout();
        return;
      }
      toast.error('Could not fix your code', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const resetWorkspace = () => {
    setRawCode('');
    setErrorLog('');
    setAiResponse('');
    setActiveChat(null);
    setSidebarOpen(false);
  };

  const openHistoryItem = (item) => {
    setRawCode(item.raw_code);
    setErrorLog(item.error_log === NO_LOG_PLACEHOLDER ? '' : item.error_log);
    setAiResponse(item.ai_response);
    setActiveChat(item);
    setSidebarOpen(false);
  };

  const runDelete = async (url, onSuccess) => {
    const token = localStorage.getItem('token');
    if (!token) {
      handleLogout();
      return;
    }
    setDeleting(true);
    try {
      await api.delete(url, { headers: authHeaders(token) });
      onSuccess();
    } catch (err) {
      if (isAuthError(err)) {
        toast.warning('Session expired', 'Please sign in again.');
        handleLogout();
        return;
      }
      if (err.response?.status === 404) {
        onSuccess(); // already gone on the server, so just drop it from the list
      } else {
        toast.error('Delete failed', getErrorMessage(err, 'Could not delete. Please try again.'));
      }
    } finally {
      setDeleting(false);
      setConfirmDelete(null);
    }
  };

  const deleteItem = (item) => runDelete(`/api/history/${item.id}`, () => {
    setHistory((current) => current.filter((entry) => entry.id !== item.id));
    if (activeChat?.id === item.id) resetWorkspace();
    toast.success('Scan deleted');
  });

  const clearHistory = () => runDelete('/api/history', () => {
    setHistory([]);
    if (activeChat) resetWorkspace();
    toast.success('History cleared', 'All your scans were deleted.');
  });

  const loadExample = () => {
    setRawCode(EXAMPLE_CODE);
    setErrorLog(EXAMPLE_LOG);
    setActiveChat(null);
  };

  const renderSidebar = (expanded) => (
    <div className="flex h-full w-72 flex-col py-4">
      <div className="px-3">
        <div className="flex h-10 items-center gap-3 px-1">
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Code size={16} />
          </span>
          <SidebarLabel className="text-lg font-bold tracking-tight text-foreground">Shaz<span className="text-primary">Debug</span></SidebarLabel>
        </div>
        <div className="mt-4">
          <SidebarLink label="New Chat" icon={<Plus size={18} />} onClick={resetWorkspace} outlined />
        </div>
      </div>

      {expanded ? (
        <>
          <div className="mt-4 flex items-center justify-between px-5 pb-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-subtle">Recent Scans</h3>
            {history.length > 0 && confirmDelete !== 'all' && (
              <button
                onClick={() => setConfirmDelete('all')}
                className="text-xs font-medium text-subtle transition-colors hover:text-destructive"
              >
                Clear all
              </button>
            )}
          </div>

          {confirmDelete === 'all' && (
            <div className="mx-3 mb-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3" role="alertdialog">
              <p className="text-xs text-foreground">Delete all {history.length} scans? This can't be undone.</p>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={clearHistory}
                  disabled={deleting}
                  className="rounded-md bg-destructive px-3 py-1 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {deleting ? 'Deleting...' : 'Delete all'}
                </button>
                <button
                  onClick={() => setConfirmDelete(null)}
                  disabled={deleting}
                  className="rounded-md border border-border px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="flex-1 space-y-2 overflow-y-auto px-3 pb-3">
            {history.length === 0 ? (
              <p className="px-2 pt-2 text-sm text-subtle">No history yet. Your debug sessions will show up here.</p>
            ) : (
              history.map((item) =>
                confirmDelete === item.id ? (
                  <div key={item.id} className="rounded-lg border border-destructive/40 bg-destructive/10 p-3" role="alertdialog">
                    <p className="truncate text-xs text-foreground">Delete "{firstLine(item.raw_code)}"?</p>
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => deleteItem(item)}
                        disabled={deleting}
                        className="rounded-md bg-destructive px-3 py-1 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                      >
                        {deleting ? 'Deleting...' : 'Delete'}
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        disabled={deleting}
                        className="rounded-md border border-border px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    key={item.id}
                    className={`group relative rounded-xl border transition-colors ${
                      activeChat?.id === item.id
                        ? 'border-primary/60 bg-primary/10'
                        : 'border-border bg-background/40 hover:border-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <button onClick={() => openHistoryItem(item)} className="block w-full min-w-0 px-3 py-2 pr-10 text-left">
                      <span className="block truncate font-mono text-xs text-foreground">{firstLine(item.raw_code)}</span>
                      <span className="mt-0.5 block text-[11px] text-subtle">{formatDate(item.created_at)}</span>
                    </button>
                    <button
                      onClick={() => setConfirmDelete(item.id)}
                      aria-label="Delete this scan"
                      title="Delete"
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ),
              )
            )}
          </div>
        </>
      ) : (
        <div className="mt-2 flex-1 px-3">
          <SidebarLink label="Recent Scans" icon={<History size={18} />} />
        </div>
      )}

      <div className="space-y-1 border-t border-border px-3 pt-3">
        <SidebarLink
          label={theme === 'dark' ? 'Light theme' : 'Dark theme'}
          icon={theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          onClick={toggleTheme}
        />
        <SidebarLink label="Log Out" icon={<LogOut size={18} />} onClick={() => { toast.info('Signed out', 'See you soon.'); handleLogout(); }} tone="danger" />
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background font-sans text-foreground">
      <Sidebar mobileOpen={sidebarOpen} setMobileOpen={setSidebarOpen}>
        <SidebarBody>{({ expanded }) => renderSidebar(expanded)}</SidebarBody>
      </Sidebar>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Open history"
              className="rounded-lg border border-border p-2 text-muted-foreground hover:text-foreground lg:hidden"
            >
              <Menu size={18} />
            </button>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-bold tracking-tight">AI Debugging Center</h2>
              <p className="hidden truncate text-xs text-muted-foreground sm:block">
                Paste your broken code, add the error log if you have one, then press Ctrl + Enter.
              </p>
            </div>
          </div>
          <button
            onClick={loadExample}
            className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            Try an example
          </button>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-1 content-start gap-4 overflow-y-auto p-4 sm:p-6 lg:grid-cols-2 lg:grid-rows-1 lg:overflow-hidden">
          {/* LEFT: input */}
          <section className="flex flex-col gap-4 lg:min-h-0">
            <div className="flex min-h-[18rem] flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-card focus-within:border-primary/60 transition-colors">
              <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
                <span className="text-sm font-medium text-muted-foreground">
                  Source Code <span className="text-destructive">*</span>
                </span>
                <span className={`text-xs ${codeTooLong ? 'text-destructive' : 'text-subtle'}`}>
                  {rawCode.length.toLocaleString()} / {MAX_CODE_LENGTH.toLocaleString()}
                </span>
              </div>
              <CodeEditor value={rawCode} onChange={setRawCode} onSubmit={handleFixBug} />
            </div>

            <div className="flex h-40 shrink-0 flex-col overflow-hidden rounded-2xl border border-border bg-card focus-within:border-destructive/50 transition-colors">
              <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
                <span className="text-sm font-medium text-muted-foreground">Compiler / Runtime Error Log (optional)</span>
                <span className={`text-xs ${logTooLong ? 'text-destructive' : 'text-subtle'}`}>
                  {errorLog.length.toLocaleString()} / {MAX_LOG_LENGTH.toLocaleString()}
                </span>
              </div>
              <textarea
                value={errorLog}
                onChange={(e) => setErrorLog(e.target.value)}
                spellCheck={false}
                placeholder="Terminal error trace goes here (leave blank if you don't have it)..."
                aria-label="Error log"
                className="flex-1 resize-none bg-transparent p-3 font-mono text-sm text-destructive placeholder:text-subtle focus:outline-none"
              />
            </div>

            <div className="flex shrink-0 items-center justify-between gap-3">
              <button
                onClick={resetWorkspace}
                disabled={!rawCode && !errorLog && !aiResponse}
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
              >
                Clear
              </button>
              <button
                onClick={handleFixBug}
                disabled={!canSubmit}
                className="rounded-xl bg-primary px-8 py-3 font-semibold text-primary-foreground transition-all hover:bg-primary/90 active:translate-y-0 disabled:cursor-not-allowed disabled:bg-border disabled:text-subtle"
              >
                {loading ? 'Analyzing...' : 'Fix My Bug'}
              </button>
            </div>
          </section>

          {/* RIGHT: AI solution */}
          <section className="flex min-h-[20rem] min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card lg:min-h-0">
            <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
              <span className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <span className={`h-2 w-2 rounded-full bg-primary ${loading ? 'animate-pulse' : ''}`} />
                ShazDebug Solution
              </span>
              {aiResponse && !loading && <CopyButton getText={() => aiResponse} label="Copy all" />}
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {loading ? (
                <div className="space-y-3 py-2" role="status" aria-label="Analyzing your code">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
                  <div className="mt-6 h-24 w-full animate-pulse rounded-xl bg-muted" />
                </div>
              ) : aiResponse ? (
                <div className="markdown-content max-w-none font-sans leading-relaxed text-muted-foreground">
                  <ReactMarkdown components={{ pre: CodeBlock, h2: Heading }}>{aiResponse}</ReactMarkdown>
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Sparkles size={24} />
                  </span>
                  <h3 className="text-base font-semibold text-foreground">Your fix will appear here</h3>
                  <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                    Paste some broken code on the left and press Fix My Bug, or load a ready-made example.
                  </p>
                  <button
                    onClick={loadExample}
                    className="mt-4 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
                  >
                    Load example
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
