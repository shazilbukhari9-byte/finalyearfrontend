import { createContext, useContext, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const COLLAPSED_WIDTH = 64;
const EXPANDED_WIDTH = 288;

const SidebarContext = createContext(undefined);
// Whether the content currently being rendered is the full (expanded) version.
const ExpandedContext = createContext(true);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a Sidebar');
  }
  return context;
};

export const useSidebarExpanded = () => useContext(ExpandedContext);

/**
 * Provider. Desktop open state (hover) and mobile drawer state can each be
 * controlled from outside, or left uncontrolled.
 */
export const Sidebar = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  mobileOpen: mobileOpenProp,
  setMobileOpen: setMobileOpenProp,
  animate = true,
}) => {
  const [openState, setOpenState] = useState(false);
  const [mobileOpenState, setMobileOpenState] = useState(false);

  const value = {
    open: openProp !== undefined ? openProp : openState,
    setOpen: setOpenProp !== undefined ? setOpenProp : setOpenState,
    mobileOpen: mobileOpenProp !== undefined ? mobileOpenProp : mobileOpenState,
    setMobileOpen: setMobileOpenProp !== undefined ? setMobileOpenProp : setMobileOpenState,
    animate,
  };

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
};

// `children` may be a render function: ({ expanded }) => node
const renderChildren = (children, expanded) => (
  <ExpandedContext.Provider value={expanded}>
    {typeof children === 'function' ? children({ expanded }) : children}
  </ExpandedContext.Provider>
);

export const SidebarBody = ({ className, children }) => (
  <>
    <DesktopSidebar className={className}>{children}</DesktopSidebar>
    <MobileSidebar className={className}>{children}</MobileSidebar>
  </>
);

/**
 * Desktop: a slim icon rail that lives in the layout. Hovering (or keyboard
 * focus) animates its width, and the page next to it grows or shrinks to fit.
 */
export const DesktopSidebar = ({ className, children }) => {
  const { open, setOpen, animate } = useSidebar();

  return (
    <motion.aside
      initial={false}
      animate={{ width: animate ? (open ? EXPANDED_WIDTH : COLLAPSED_WIDTH) : EXPANDED_WIDTH }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
      }}
      style={{ width: COLLAPSED_WIDTH }}
      className={cn('hidden shrink-0 overflow-hidden border-r border-border bg-card lg:block', className)}
    >
      {/* Fixed inner width so the content is revealed, not squashed, while the width animates. */}
      <div style={{ width: EXPANDED_WIDTH }} className="h-full">
        {renderChildren(children, open || !animate)}
      </div>
    </motion.aside>
  );
};

/** Mobile: a slide-over drawer, opened from a button elsewhere in the page. */
export const MobileSidebar = ({ className, children }) => {
  const { mobileOpen, setMobileOpen } = useSidebar();

  return (
    <AnimatePresence>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Sidebar">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className={cn('relative h-full w-72 max-w-[85%] border-r border-border bg-card', className)}
          >
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Close sidebar"
              className="absolute right-3 top-3 z-10 rounded-lg p-1.5 text-muted-foreground hover:text-foreground"
            >
              <X size={18} />
            </button>
            {renderChildren(children, true)}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
};

/** Text that fades out (and collapses) when the sidebar is the icon rail. */
export const SidebarLabel = ({ children, className }) => {
  const expanded = useSidebarExpanded();
  const { animate } = useSidebar();
  const visible = expanded || !animate;

  return (
    <motion.span
      initial={false}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.15 }}
      className={cn('whitespace-nowrap', className)}
      aria-hidden={!visible}
    >
      {children}
    </motion.span>
  );
};

export const SidebarLink = ({ label, icon, onClick, active = false, tone = 'default', outlined = false, className }) => {
  const expanded = useSidebarExpanded();
  const { animate } = useSidebar();
  const showLabel = expanded || !animate;
  const toneClasses =
    tone === 'danger'
      ? 'text-destructive hover:bg-destructive/10'
      : 'text-muted-foreground hover:bg-muted hover:text-foreground';

  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        'group/sidebar flex h-10 items-center gap-3 rounded-lg px-[11px] text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        // Icon rail: a 40px square button centred in the 64px rail. Expanded: full width row.
        showLabel ? 'w-full' : 'w-10',
        outlined && 'border border-border bg-muted px-[10px] hover:border-primary hover:text-primary',
        active && 'bg-primary/10 text-primary',
        toneClasses,
        className,
      )}
    >
      <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center">{icon}</span>
      <SidebarLabel>{label}</SidebarLabel>
    </button>
  );
};
