'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Gamepad2,
  UserRound,
  House,
  CalendarDays,
  Library,
  Heart,
  Monitor,
  Sun,
  Moon,
  Plus,
  Search,
  LayoutGrid,
  List,
  Lock,
  ArrowUpRight,
  Check,
  Play,
  Layers,
  Star,
  Share2,
  Settings2,
  Cpu,
  ArrowRight,
  Download,
  Upload,
  Trash2,
  X,
  Globe,
  Link2,
  ChevronRight,
  HardDrive,
  History,
} from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import {
  catalog,
  collectionAccess,
  seedCollection,
  makeItem,
  validCollection,
  inSection,
  filteredItems,
  updateComponents,
  statuses,
  priorities,
  componentTypes,
  type Item,
  type Kind,
  type Collection,
} from '@/lib/tracker';
import { getSupabase } from '@/lib/supabase';
import { draftKey, loadLibrary, saveLibrary } from '@/lib/account-library';
import { AccountStatus } from '@/components/account-status';
import { covers } from '@/lib/covers';
import {
  GameLists,
  PlayerPage,
  VisibilityOptions,
} from '@/components/game-lists';
import {
  CollectionOverview,
  UpcomingPage,
} from '@/components/collection-overview';
import { releaseLabel, releaseStatus } from '@/lib/releases';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
const STORAGE = 'pixel-tracker:v1';
const sectionLabels: Record<string, string> = {
  dashboard: 'My collection',
  profile: 'Profile',
  upcoming: 'Upcoming',
  games: 'Games',
  consoles: 'Consoles',
  builds: 'PC builds',
  gameWishlist: 'Game wishlist',
  hardwareWishlist: 'Hardware wishlist',
};
function Picker({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  label: string;
}) {
  return (
    <Select value={value} onValueChange={(v) => v !== null && onChange(v)}>
      <SelectTrigger className="picker" aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}
function Cover({
  item,
  small = false,
}: {
  item: Pick<Item, 'kind' | 'title' | 'catalogId'>;
  small?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const src = item.catalogId ? covers[item.catalogId] : undefined;
  return (
    <div
      className={`art ${small ? 'small-art' : ''} ${!src || failed ? 'cover-fallback' : ''}`}
    >
      {src && !failed ? (
        <img
          src={src}
          alt={`${item.title} cover`}
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <>
          <span className="device-glyph">
            {item.kind === 'game' ? (
              <Gamepad2 size={38} />
            ) : item.kind === 'console' ? (
              <Gamepad2 size={54} strokeWidth={1} />
            ) : (
              <Monitor size={54} strokeWidth={1} />
            )}
          </span>
          {!small && <span>{item.title}</span>}
        </>
      )}
    </div>
  );
}
function RailButton({
  label,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <Tooltip>
      <TooltipTrigger render={<button {...props} aria-label={label} />}>
        {children}
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={10}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
function PersistentSidebar({ children }: { children: ReactNode }) {
  const { isMobile, open, openMobile, setOpen, setOpenMobile } = useSidebar();
  const expanded = isMobile ? openMobile : open;
  const sidebarRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!expanded) return;
    const collapse = () => (isMobile ? setOpenMobile(false) : setOpen(false));
    const handleOutsidePointer = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element) || sidebarRef.current?.contains(target))
        return;
      // The toggle owns its own state change; don't collapse and immediately reopen it.
      if (target.closest('[data-sidebar="trigger"]')) return;
      collapse();
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !event.defaultPrevented) collapse();
    };
    document.addEventListener('pointerdown', handleOutsidePointer);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('pointerdown', handleOutsidePointer);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [expanded, isMobile, setOpen, setOpenMobile]);
  return (
    <div
      ref={sidebarRef}
      className="persistent-sidebar"
      data-slot="sidebar"
      data-state={expanded ? 'expanded' : 'collapsed'}
      data-collapsible={expanded ? '' : 'icon'}
    >
      <Sidebar collapsible="none" className="persistent-sidebar-panel">
        <SidebarTrigger className="rail-mobile-close" />
        {children}
      </Sidebar>
    </div>
  );
}
function Navigation({
  section,
  onNavigate,
  items,
}: {
  section: string;
  onNavigate: (s: string) => void;
  items: Item[];
}) {
  const { setOpenMobile } = useSidebar();
  return (
    <>
      {(
        [
          ['dashboard', House],
          ['games', Library],
          ['consoles', Gamepad2],
          ['builds', Monitor],
          ['gameWishlist', Heart],
          ['hardwareWishlist', Cpu],
          ['upcoming', CalendarDays],
          ['profile', UserRound],
        ] as const
      ).map(([key, Icon]) => (
        <RailButton
          label={sectionLabels[key]}
          key={key}
          className={'nav-item ' + (key === section ? 'active' : '')}
          aria-current={key === section ? 'page' : undefined}
          onClick={() => {
            onNavigate(key);
            setOpenMobile(false);
          }}
        >
          <Icon size={19} />
          <span className="nav-text">{sectionLabels[key]}</span>
          {key !== 'dashboard' && key !== 'upcoming' && key !== 'profile' && (
            <span className="count">
              {items.filter((i) => inSection(i, key)).length}
            </span>
          )}
        </RailButton>
      ))}
    </>
  );
}
function Brand({ onHome }: { onHome: () => void }) {
  const { setOpenMobile } = useSidebar();
  return (
    <button
      className="brand"
      aria-label="Go to My collection"
      onClick={() => {
        onHome();
        setOpenMobile(false);
      }}
    >
      <span className="brand-icon">
        <Gamepad2 size={23} />
      </span>
      <span className="brand-name">pixel dex</span>
    </button>
  );
}
export default function Home() {
  const [data, setData] = useState<Collection>(() => seedCollection());
  const dataRef = useRef(data);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState('');
  const [section, setSection] = useState('dashboard');
  const [gamesView, setGamesView] = useState('collection');
  const isOverview =
    section === 'dashboard' ||
    section === 'upcoming' ||
    section === 'profile' ||
    (section === 'games' && gamesView === 'lists');
  const isWishlist =
    section === 'gameWishlist' || section === 'hardwareWishlist';
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState('All');
  const [platform, setPlatform] = useState('All platforms');
  const [launcher, setLauncher] = useState('All launchers');
  const [sort, setSort] = useState('Recently added');
  const [detail, setDetail] = useState<string | null>(null);
  const [draft, setDraft] = useState<Item | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [catalogQuery, setCatalogQuery] = useState('');
  const [addKind, setAddKind] = useState<Kind>('game');
  const [settings, setSettings] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [notice, setNotice] = useState('');
  const [confirm, setConfirm] = useState<{
    title: string;
    description: string;
    run: () => void;
  } | null>(null);
  const upload = useRef<HTMLInputElement>(null);
  const owner = useRef<string | null>(null);
  const revision = useRef(0);
  const saving = useRef(false);
  const [sync, setSync] = useState('Loading library…');
  const [account, setAccount] = useState(false);
  const [canImport, setCanImport] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  useEffect(() => {
    let active = true;
    let loaded = false;
    const auth = getSupabase().auth;
    const {data: listener} = auth.onAuthStateChange((_event, session) => {
      if(loaded && (session?.user.id ?? null) !== owner.current) window.location.reload();
    });
    async function initialize() {
      try {
        const {data: sessionData, error: sessionError} = await auth.getSession();
        if(sessionError) throw sessionError;
        const id = sessionData.session?.user.id ?? null;
        owner.current = id;
        loaded = true;
        if(id) {
          if(active) { setAccount(true); setData({...seedCollection(),items:[],lists:[],profile:undefined}); }
          const remote = await loadLibrary(id);
          if(!active) return;
          revision.current = remote?.revision ?? 0;
          let collection: Collection = remote?.payload ?? {...seedCollection(),items:[],lists:[],profile:undefined,collectionVisibility:'Private'};
          const pending = localStorage.getItem(draftKey(id));
          if(pending) {
            const draft = JSON.parse(pending);
            if(!validCollection(draft.payload) || !Number.isInteger(draft.revision)) throw new Error('The saved browser draft is unreadable. It has been preserved.');
            if(remote && JSON.stringify(remote.payload) === JSON.stringify(draft.payload)) localStorage.removeItem(draftKey(id));
            else {
              collection = draft.payload;
              revision.current = draft.revision;
              setHasDraft(true);
              setStorageError('You have an unsaved browser draft. Retry saving, or export it before loading the account version.');
            }
          }
          dataRef.current = collection; setData(collection);
          setCanImport(!remote && !pending && !!localStorage.getItem(STORAGE));
          setSync(pending ? 'Check unsaved changes' : remote ? 'Saved to your account' : 'Account library ready');
        } else {
          const saved = localStorage.getItem(STORAGE);
          if(saved) {
            const parsed: unknown = JSON.parse(saved);
            if(!validCollection(parsed)) throw new Error('Your browser library could not be read. It has been left untouched.');
            dataRef.current = parsed; setData(parsed);
          } else localStorage.setItem(STORAGE, JSON.stringify(dataRef.current));
          setSync('Local library · Sign in to save to your account');
        }
        if(active) setReady(true);
      } catch(e) { if(active) {setStorageError(e instanceof Error ? e.message : 'Unable to load your library. Please reload.');setSync('Library unavailable');} }
    }
    void initialize();
    const preventLoss = (e: BeforeUnloadEvent) => { if(saving.current) {e.preventDefault(); e.returnValue='';} };
    window.addEventListener('beforeunload',preventLoss);
    return () => {active=false; listener.subscription.unsubscribe();window.removeEventListener('beforeunload',preventLoss);};
  }, []);
  async function pushAccount(next: Collection) {
    const id = owner.current;
    if(!id || saving.current) return;
    saving.current = true; setSync('Saving…');
    try {
      revision.current = await saveLibrary(next, revision.current, id);
      localStorage.removeItem(draftKey(id));
      setHasDraft(false); setStorageError(''); setCanImport(false); setSync('Saved to your account');
    } catch(e) {
      setHasDraft(true); setSync('Not saved to account');
      setStorageError(e instanceof Error ? e.message : 'Save failed. Your browser draft has been kept.');
    } finally {saving.current=false;}
  }
  useEffect(() => {
    document.documentElement.classList.toggle('dark', data.theme === 'dark');
  }, [data.theme]);
  useEffect(() => {
    if (!notice) return;
    const timeout = setTimeout(() => setNotice(''), 5000);
    return () => clearTimeout(timeout);
  }, [notice]);
  function commit(next: Collection, recover = false) {
    try {
      if (!ready || saving.current || (storageError && (owner.current || !recover))) {
        setNotice('Please finish saving or resolve the library error before making another change.');
        return false;
      }
      if(owner.current) {
        localStorage.setItem(draftKey(owner.current), JSON.stringify({payload:next, revision:revision.current}));
        dataRef.current=next; setData(next); setHasDraft(true);
        void pushAccount(next);
      } else {
        localStorage.setItem(STORAGE, JSON.stringify(next));
        dataRef.current=next; setData(next);
        if(recover) setStorageError('');
      }
      return true;
    } catch {
      setNotice('Unable to keep a recovery copy. Export a backup and free some browser storage before editing.');
      return false;
    }
  }
  function save(item: Item) {
    const current = dataRef.current;
    if (
      commit({
        ...current,
        items: current.items.some((i) => i.id === item.id)
          ? current.items.map((i) => (i.id === item.id ? item : i))
          : [item, ...current.items],
      })
    ) {
      setDraft(null);
      setDetail(item.id);
      setNotice('Saved to your collection.');
    }
  }
  function navigate(next: string, status = 'All') {
    setSection(next);
    if (next === 'games') setGamesView('collection');
    setQuery('');
    setTab(status);
    setPlatform('All platforms');
    setLauncher('All launchers');
  }
  const selected = data.items.find((i) => i.id === detail);
  const sectionItems = data.items.filter((i) => inSection(i, section));
  const visible = filteredItems(
    data.items,
    section,
    query,
    tab,
    platform,
    launcher,
    sort,
  );
  const games = data.items.filter((i) => i.kind === 'game' && i.owned);
  const completed = games.filter((i) => i.status === 'Completed').length;
  const visibility = collectionAccess(data);
  const displayTab = (key: string) =>
    ({
      All: isWishlist
        ? 'Everything'
        : section === 'games'
          ? 'All games'
          : 'All',
      game: 'Games',
      console: 'Consoles',
      build: 'Planned builds',
    })[key] || key;
  function add() {
    setAddKind(
      section === 'consoles' || section === 'hardwareWishlist'
        ? 'console'
        : section === 'builds'
          ? 'build'
          : 'game',
    );
    setCatalogQuery('');
    if (section === 'builds') setDraft(makeItem('build', ''));
    else setAddOpen(true);
  }
  function download(name: string, body: string, type: string) {
    const url = URL.createObjectURL(new Blob([body], { type }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  useEffect(() => {
    type Registry = {
      registerTool: (
        tool: {
          name: string;
          description: string;
          inputSchema: object;
          annotations: object;
          execute: (input: unknown) => unknown;
        },
        options: { signal: AbortSignal },
      ) => unknown;
    };
    const context = (document as Document & { modelContext?: Registry })
      .modelContext;
    if (!context) return;
    const controller = new AbortController();
    try {
      Promise.resolve(
        context.registerTool(
          {
            name: 'read_pixel_collection',
            description:
              'Read the games, consoles, and PC builds stored in this local collection.',
            inputSchema: {
              type: 'object',
              properties: {},
              additionalProperties: false,
            },
            annotations: { readOnlyHint: true, untrustedContentHint: true },
            execute: () => ({ items: dataRef.current.items }),
          },
          { signal: controller.signal },
        ),
      ).catch(() => {});
      Promise.resolve(
        context.registerTool(
          {
            name: 'start_add_pixel_item',
            description:
              'Open an unsaved item form for a game, console, or PC build. Does not save an item.',
            inputSchema: {
              type: 'object',
              properties: {
                kind: { type: 'string', enum: ['game', 'console', 'build'] },
                title: { type: 'string' },
              },
              required: ['kind', 'title'],
              additionalProperties: false,
            },
            annotations: { readOnlyHint: false, untrustedContentHint: false },
            execute: (input: unknown) => {
              const v = input as { kind: Kind; title: string };
              if (
                !v ||
                !['game', 'console', 'build'].includes(v.kind) ||
                typeof v.title !== 'string' ||
                !v.title.trim()
              )
                throw new Error(
                  'A supported kind and non-empty title are required.',
                );
              setDraft(makeItem(v.kind, v.title));
              return { status: 'draft_opened', saved: false };
            },
          },
          { signal: controller.signal },
        ),
      ).catch(() => {});
    } catch {}
    return () => controller.abort();
  }, []);
  return (
    <TooltipProvider>
      <SidebarProvider
        style={
          {
            '--sidebar-width': '232px',
            '--sidebar-width-icon': '72px',
          } as React.CSSProperties
        }
      >
        <PersistentSidebar>
          <Brand onHome={() => navigate('dashboard')} />
          <SidebarContent>
            <Navigation
              section={section}
              onNavigate={navigate}
              items={data.items}
            />
          </SidebarContent>
          <div className="library-progress">
            <div className="library-progress-label">
              <span>Library completed</span>
              <strong>
                {games.length
                  ? Math.round((completed / games.length) * 100)
                  : 0}
                %
              </strong>
            </div>
            <Progress
              value={games.length ? (completed / games.length) * 100 : 0}
              aria-label="Library completed"
            />
          </div>
          <RailButton
            label="Settings"
            className="nav-item"
            onClick={() => setSettings(true)}
          >
            <Settings2 size={18} />
            <span className="nav-text">Settings</span>
          </RailButton>
          <div className="sidebar-bottom">
            <span className="avatar">P</span>
            <button
              className="profile-name text-button"
              onClick={() => navigate('profile')}
            >
              My profile
            </button>
            <RailButton
              label={
                data.theme === 'dark'
                  ? 'Switch to light theme'
                  : 'Switch to dark theme'
              }
              className="icon-button"
              aria-label={
                data.theme === 'dark'
                  ? 'Switch to light theme'
                  : 'Switch to dark theme'
              }
              onClick={() =>
                commit({
                  ...data,
                  theme: data.theme === 'dark' ? 'light' : 'dark',
                })
              }
            >
              {data.theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </RailButton>
          </div>
        </PersistentSidebar>
        <main className="workspace">
          <header className="topbar">
            <span>
              <SidebarTrigger />
              <button
                className="breadcrumb-home"
                onClick={() => navigate('dashboard')}
              >
                My collection
              </button>
              {section !== 'dashboard' && (
                <>
                  <span className="crumb">/</span>
                  {sectionLabels[section]}
                </>
              )}
            </span>
            {!isOverview && (
              <button className="private" onClick={() => setSharing(true)}>
                {visibility === 'Private' ? (
                  <Lock size={13} />
                ) : visibility === 'Public' ? (
                  <Globe size={13} />
                ) : (
                  <Link2 size={13} />
                )}{' '}
                {visibility} collection{' '}
                {visibility !== 'Private' && '· Preview'}
              </button>
            )}
          </header>
          <div className="page">
            <p role="status" className="library-sync-status">{sync}</p>
            {hasDraft && <div className="detail-actions"><button className="secondary" disabled={sync === 'Saving…'} onClick={() => void pushAccount(dataRef.current)}>Retry save</button><button className="secondary" onClick={() => download('pixel-dex-unsaved.json',JSON.stringify(dataRef.current,null,2),'application/json')}>Export unsaved copy</button><button className="secondary" disabled={sync === 'Saving…'} onClick={() => setConfirm({title:'Load saved account library?',description:'This discards the unsaved browser draft. Export it first if you want to keep it.',run:() => {if(owner.current) localStorage.removeItem(draftKey(owner.current)); window.location.reload();}})}>Load account version</button></div>}
            {storageError && (
              <div className="warning" role="alert">
                {storageError}
              </div>
            )}
            <div className="page-heading">
              <div>
                <h1>
                  {sectionLabels[section]}
                  <span className="title-dot">.</span>
                </h1>
              </div>
              {!isOverview && (
                <div className="heading-actions">
                  <button
                    className="icon-button share-button"
                    aria-label="Share collection"
                    onClick={() => setSharing(true)}
                  >
                    <Share2 size={18} />
                  </button>
                  <button className="primary" disabled={!ready} onClick={add}>
                    <Plus size={18} />{' '}
                    {isWishlist
                      ? 'Add to wishlist'
                      : section === 'consoles'
                        ? 'Add console'
                        : section === 'builds'
                          ? 'New build'
                          : 'Add game'}
                  </button>
                </div>
              )}
            </div>
            {section === 'games' && (
              <Tabs
                value={gamesView}
                onValueChange={(v) => setGamesView(String(v))}
              >
                <TabsList className="games-area-tabs" aria-label="Games area">
                  <TabsTrigger value="collection">Collection</TabsTrigger>
                  <TabsTrigger value="lists">
                    Lists <span>{data.lists?.length || 0}</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            )}
            {section === 'profile' ? (
              <PlayerPage
                data={data}
                commit={commit}
                renderArt={(game, small) => (
                  <Cover
                    item={{
                      kind: 'game',
                      title: game.title,
                      catalogId: game.catalogId,
                    }}
                    small={small}
                  />
                )}
              />
            ) : section === 'games' && gamesView === 'lists' ? (
              <GameLists
                data={data}
                commit={commit}
                renderArt={(game, small) => (
                  <Cover
                    item={{
                      kind: 'game',
                      title: game.title,
                      catalogId: game.catalogId,
                    }}
                    small={small}
                  />
                )}
              />
            ) : section === 'dashboard' ? (
              <CollectionOverview
                items={data.items}
                onOpen={setDetail}
                onNavigate={navigate}
                renderCover={(item, small) => (
                  <Cover item={item} small={small} />
                )}
              />
            ) : section === 'upcoming' ? (
              <UpcomingPage
                items={data.items}
                onOpen={setDetail}
                onNavigate={navigate}
                renderCover={(item, small) => (
                  <Cover item={item} small={small} />
                )}
              />
            ) : (
              <>
                {section === 'games' ? (
                  <div className="stats">
                    {(
                      [
                        [Library, games.length, 'Games owned'],
                        [
                          Play,
                          games.filter((i) => i.status === 'Playing').length,
                          'Currently playing',
                        ],
                        [Check, completed, 'Completed'],
                        [
                          Heart,
                          data.items.filter(
                            (i) => i.kind === 'game' && !i.owned,
                          ).length,
                          'On your wishlist',
                        ],
                      ] as const
                    ).map(([Icon, n, label], idx) => (
                      <button
                        className="stat"
                        key={label}
                        onClick={() => {
                          if (idx === 3) {
                            navigate('gameWishlist');
                          } else {
                            setTab(
                              idx === 1
                                ? 'Playing'
                                : idx === 2
                                  ? 'Completed'
                                  : 'All',
                            );
                            setQuery('');
                            setLauncher('All launchers');
                            setPlatform('All platforms');
                          }
                        }}
                      >
                        <Icon size={18} />
                        <strong>{n}</strong>
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="section-summary">
                    <span>
                      {sectionItems.length}{' '}
                      {section === 'builds'
                        ? 'current builds'
                        : section === 'consoles'
                          ? 'consoles in your collection'
                          : section === 'gameWishlist'
                            ? 'games on your wishlist'
                            : 'items on your wishlist'}
                    </span>
                    {section === 'builds' && (
                      <button
                        onClick={() => {
                          navigate('hardwareWishlist');
                          setTab('build');
                        }}
                      >
                        View planned builds <ArrowRight size={15} />
                      </button>
                    )}
                  </div>
                )}
                {section === 'hardwareWishlist' && (
                  <Tabs value={tab} onValueChange={(v) => setTab(String(v))}>
                    <TabsList className="collection-tabs" variant="line">
                      {['All', 'console', 'build'].map((t) => (
                        <TabsTrigger
                          key={t}
                          value={t}
                          className={tab === t ? 'selected' : ''}
                        >
                          {displayTab(t)}
                          <span>
                            {
                              sectionItems.filter(
                                (i) => t === 'All' || i.kind === t,
                              ).length
                            }
                          </span>
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                )}
                <div className="toolbar">
                  {section === 'games' && (
                    <Picker
                      label="Filter game status"
                      value={tab === 'All' ? 'All games' : tab}
                      options={['All games', ...statuses]}
                      onChange={(v) => setTab(v === 'All games' ? 'All' : v)}
                    />
                  )}

                  <label className="search-box">
                    <Search size={17} />
                    <input
                      aria-label="Search your collection"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={`Search ${sectionLabels[section].toLowerCase()}…`}
                    />
                    {query && (
                      <button
                        className="icon-button"
                        aria-label="Clear search"
                        onClick={() => setQuery('')}
                      >
                        <X size={14} />
                      </button>
                    )}
                  </label>
                  {section === 'games' && (
                    <>
                      <Picker
                        label="Filter platform"
                        value={platform}
                        onChange={setPlatform}
                        options={[
                          'All platforms',
                          ...new Set(
                            sectionItems.map((i) => i.platform).filter(Boolean),
                          ),
                        ]}
                      />
                      <Picker
                        label="Filter launcher"
                        value={launcher}
                        onChange={setLauncher}
                        options={[
                          'All launchers',
                          ...new Set(
                            sectionItems
                              .filter((i) => i.platform === 'PC')
                              .map((i) => i.launcher)
                              .filter(Boolean),
                          ),
                        ]}
                      />
                    </>
                  )}
                  <Picker
                    label="Sort collection"
                    value={sort}
                    onChange={setSort}
                    options={[
                      'Recently added',
                      'Title A–Z',
                      ...(section === 'games' ? ['Highest rated'] : []),
                      ...(isWishlist ? ['Priority'] : []),
                    ]}
                  />
                  <div className="view-toggle">
                    <button
                      className={data.view === 'grid' ? 'selected' : ''}
                      aria-label="Tile view"
                      aria-pressed={data.view === 'grid'}
                      onClick={() => commit({ ...data, view: 'grid' })}
                    >
                      <LayoutGrid size={17} />
                    </button>
                    <button
                      className={data.view === 'list' ? 'selected' : ''}
                      aria-label="List view"
                      aria-pressed={data.view === 'list'}
                      onClick={() => commit({ ...data, view: 'list' })}
                    >
                      <List size={17} />
                    </button>
                  </div>
                </div>
                {launcher !== 'All launchers' && (
                  <div className="filter-summary">
                    Showing {launcher} games{' '}
                    <button
                      onClick={() => {
                        setLauncher('All launchers');
                        setPlatform('All platforms');
                      }}
                    >
                      Clear filter <X size={13} />
                    </button>
                  </div>
                )}
                {visible.length === 0 ? (
                  <div className="empty-state">
                    <Search size={32} />
                    <h2>
                      {sectionItems.length
                        ? 'No matches this time.'
                        : 'A new collection starts here.'}
                    </h2>
                    <p>
                      {sectionItems.length
                        ? 'Try another title or clear your filters.'
                        : 'Add something you own, or something you’re looking forward to.'}
                    </p>
                    <button
                      className="secondary"
                      onClick={() =>
                        sectionItems.length
                          ? (setQuery(''),
                            setTab('All'),
                            setPlatform('All platforms'),
                            setLauncher('All launchers'))
                          : add()
                      }
                    >
                      {sectionItems.length
                        ? 'Clear filters'
                        : 'Add your first item'}
                    </button>
                  </div>
                ) : data.view === 'list' ? (
                  <div className="table-shell">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>
                            {section === 'consoles'
                              ? 'Edition'
                              : 'Platform / type'}
                          </TableHead>
                          <TableHead>
                            {section === 'consoles'
                              ? 'Color'
                              : 'Launcher / details'}
                          </TableHead>
                          <TableHead>
                            {isWishlist ? 'Priority' : 'Status'}
                          </TableHead>
                          <TableHead>
                            {isWishlist ? 'Release' : 'Rating'}
                          </TableHead>
                          <TableHead>
                            <span className="sr-only">Open</span>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {visible.map((i) => (
                          <TableRow key={i.id}>
                            <TableCell>
                              <button
                                className="table-title"
                                onClick={() => setDetail(i.id)}
                              >
                                <Cover item={i} small />
                                <span>{i.title}</span>
                              </button>
                            </TableCell>
                            <TableCell>
                              {i.kind === 'console'
                                ? i.edition
                                : i.platform || 'PC build'}
                            </TableCell>
                            <TableCell>
                              {i.kind === 'console'
                                ? i.color || '—'
                                : i.kind === 'build'
                                  ? `${i.components.length} components`
                                  : i.launcher}
                            </TableCell>
                            <TableCell>
                              <span className="pill">
                                {!i.owned
                                  ? i.priority
                                  : i.kind === 'game'
                                    ? i.status
                                    : 'Owned'}
                              </span>
                            </TableCell>
                            <TableCell>
                              {!i.owned
                                ? releaseLabel(i)
                                : i.rating
                                  ? `${i.rating} / 5`
                                  : '—'}
                            </TableCell>
                            <TableCell>
                              <button
                                className="icon-button"
                                aria-label={`Open ${i.title}`}
                                onClick={() => setDetail(i.id)}
                              >
                                <ChevronRight size={17} />
                              </button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div
                    className={
                      section === 'builds'
                        ? 'build-grid'
                        : 'game-grid ' +
                          (section === 'consoles' ? 'console-grid' : '')
                    }
                  >
                    {visible.map((i) =>
                      i.kind === 'build' ? (
                        <button
                          className="build-card"
                          key={i.id}
                          onClick={() => setDetail(i.id)}
                        >
                          <div className="build-card-top">
                            <Monitor size={35} strokeWidth={1.3} />
                            <span className="pill">
                              {i.owned ? 'Current build' : 'Planned build'}
                            </span>
                          </div>
                          <h2>{i.title}</h2>
                          <p>{i.notes || 'A setup of your own.'}</p>
                          <div className="component-preview">
                            {i.components.slice(0, 3).map((c) => (
                              <div key={c.id}>
                                <span>{c.type}</span>
                                <strong>{c.name}</strong>
                              </div>
                            ))}
                          </div>
                          <div className="build-card-bottom">
                            {i.components.length} components{' '}
                            <ArrowUpRight size={17} />
                          </div>
                        </button>
                      ) : (
                        <button
                          className="game-card"
                          key={i.id}
                          onClick={() => setDetail(i.id)}
                        >
                          <div
                            className={
                              'cover ' +
                              (i.kind === 'console' ? 'console-cover' : '')
                            }
                          >
                            <Cover item={i} />
                            <span
                              className={
                                'cover-badge ' +
                                (i.status === 'Completed' && i.owned
                                  ? 'completed'
                                  : '')
                              }
                            >
                              <i />
                              {!i.owned
                                ? `${i.priority} priority`
                                : i.kind === 'console'
                                  ? 'Owned'
                                  : i.status}
                            </span>
                          </div>
                          <div className="game-title">
                            {i.title}
                            <ArrowUpRight size={16} />
                          </div>
                          <div className="game-meta">
                            {i.platform}
                            <span>·</span>
                            {i.kind === 'console'
                              ? i.color || i.edition
                              : i.launcher}
                            {i.rating > 0 && i.owned && (
                              <span className="rating">
                                <Star size={11} fill="currentColor" />
                                {i.rating}
                              </span>
                            )}
                          </div>
                          {!i.owned && i.releaseDate && (
                            <div className="release-note">
                              Release · {releaseLabel(i)}
                            </div>
                          )}
                        </button>
                      ),
                    )}
                  </div>
                )}
                <footer>
                  <Layers size={14} /> {visible.length}{' '}
                  {visible.length === 1 ? 'item' : 'items'} · Saved on this
                  device
                  <span>PIXEL DEX / PROTOTYPE 01</span>
                </footer>
              </>
            )}
          </div>
        </main>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent className="catalog-dialog">
            <DialogTitle>
              Add to {isWishlist ? 'your wishlist' : 'your collection'}
            </DialogTitle>
            <DialogDescription>
              Search the sample catalog, or create your own entry.
            </DialogDescription>
            {section === 'hardwareWishlist' && (
              <Tabs
                value={addKind}
                onValueChange={(v) => {
                  setAddKind(v as Kind);
                  setCatalogQuery('');
                }}
              >
                <TabsList>
                  <TabsTrigger value="console">Consoles</TabsTrigger>
                  <TabsTrigger value="build">PC builds</TabsTrigger>
                </TabsList>
              </Tabs>
            )}
            <label className="search-box">
              <Search size={18} />
              <input
                autoFocus
                aria-label="Search catalog"
                placeholder={
                  addKind === 'build'
                    ? 'Name your planned build…'
                    : 'Search by title…'
                }
                value={catalogQuery}
                onChange={(e) => setCatalogQuery(e.target.value)}
              />
            </label>
            <div className="catalog-results">
              {catalog
                .filter(
                  (i) =>
                    i.kind === addKind &&
                    i.title.toLowerCase().includes(catalogQuery.toLowerCase()),
                )
                .map((c) => {
                  const exists = data.items.some((i) => i.catalogId === c.id);
                  return (
                    <button
                      className="catalog-result"
                      key={c.id}
                      onClick={() => {
                        if (exists) {
                          const item = data.items.find(
                            (i) => i.catalogId === c.id,
                          )!;
                          setDetail(item.id);
                          setAddOpen(false);
                        } else {
                          setDraft(makeItem(c.kind, c.title, !isWishlist, c));
                          setAddOpen(false);
                        }
                      }}
                    >
                      <Cover
                        item={{ kind: c.kind, title: c.title, catalogId: c.id }}
                        small
                      />
                      <span>
                        <strong>{c.title}</strong>
                        <small>{c.subtitle}</small>
                      </span>
                      {exists ? <Check size={18} /> : <Plus size={18} />}
                    </button>
                  );
                })}
              {addKind !== 'build' &&
                !catalog.some(
                  (i) =>
                    i.kind === addKind &&
                    i.title.toLowerCase().includes(catalogQuery.toLowerCase()),
                ) && (
                  <p className="muted">
                    No catalog match. You can add this title below.
                  </p>
                )}
            </div>
            <button
              className="secondary"
              onClick={() => {
                setDraft(makeItem(addKind, catalogQuery, !isWishlist));
                setAddOpen(false);
              }}
            >
              <Plus size={16} />
              {addKind === 'build'
                ? 'Create planned build'
                : 'Add a custom entry'}
            </button>
            <p className="dialog-footnote">
              16 games · 8 consoles · No connected accounts
            </p>
          </DialogContent>
        </Dialog>
        <Sheet
          open={!!selected}
          onOpenChange={(open) => !open && setDetail(null)}
        >
          <SheetContent className="detail-sheet">
            {selected && (
              <>
                <div className="detail-banner">
                  <Cover item={selected} />
                </div>
                <div className="detail-body">
                  <div className="eyebrow">
                    {selected.owned ? 'IN YOUR COLLECTION' : 'ON YOUR WISHLIST'}
                  </div>
                  <SheetTitle>{selected.title}</SheetTitle>
                  <SheetDescription>
                    {selected.kind === 'build'
                      ? 'Your components and upgrade history.'
                      : [
                          selected.platform,
                          selected.kind === 'game'
                            ? selected.launcher
                            : selected.edition,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                  </SheetDescription>
                  <div className="detail-actions">
                    <button
                      className="primary"
                      onClick={() => {
                        setDraft({
                          ...selected,
                          components: selected.components.map((c) => ({
                            ...c,
                          })),
                        });
                        setDetail(null);
                      }}
                    >
                      <Settings2 size={16} /> Edit{' '}
                      {selected.kind === 'build' ? 'build' : 'details'}
                    </button>
                    {!selected.owned && (
                      <button
                        className="secondary"
                        onClick={() => {
                          save({
                            ...selected,
                            owned: true,
                            createdAt: Date.now(),
                          });
                          setNotice('Moved to your owned collection.');
                        }}
                      >
                        <Check size={16} />{' '}
                        {selected.kind === 'build'
                          ? 'Mark as built'
                          : 'Mark as owned'}
                      </button>
                    )}
                  </div>
                  <dl className="details-grid">
                    {selected.kind === 'game' && (
                      <>
                        <div>
                          <dt>Status</dt>
                          <dd>
                            {selected.owned ? selected.status : 'Wishlisted'}
                          </dd>
                        </div>
                        <div>
                          <dt>Format</dt>
                          <dd>{selected.format}</dd>
                        </div>
                        <div>
                          <dt>Rating</dt>
                          <dd className="stars">
                            {selected.rating
                              ? '★'.repeat(selected.rating) +
                                '☆'.repeat(5 - selected.rating)
                              : 'Not rated'}
                          </dd>
                        </div>
                        <div>
                          <dt>Launcher</dt>
                          <dd>{selected.launcher || 'None'}</dd>
                        </div>
                      </>
                    )}
                    {selected.kind === 'console' && (
                      <>
                        <div>
                          <dt>Edition</dt>
                          <dd>{selected.edition || 'Not set'}</dd>
                        </div>
                        <div>
                          <dt>Color</dt>
                          <dd>{selected.color || 'Not set'}</dd>
                        </div>
                      </>
                    )}
                    {!selected.owned && (
                      <>
                        <div>
                          <dt>Priority</dt>
                          <dd>{selected.priority}</dd>
                        </div>
                        <div>
                          <dt>Release date</dt>
                          <dd>{releaseLabel(selected)}</dd>
                        </div>
                      </>
                    )}
                  </dl>
                  <h3>
                    {selected.kind === 'game' ? 'Review & notes' : 'Notes'}
                  </h3>
                  <p className="notes">
                    {selected.notes ||
                      'No notes yet. A thought, a memory, or a reason to come back.'}
                  </p>
                  {selected.kind === 'build' && (
                    <>
                      <h3>
                        <Cpu size={17} /> Components{' '}
                        <span>{selected.components.length}</span>
                      </h3>
                      <div className="component-list">
                        {selected.components.length ? (
                          selected.components.map((c) => (
                            <div key={c.id}>
                              <span>{c.type}</span>
                              <strong>{c.name}</strong>
                            </div>
                          ))
                        ) : (
                          <p className="muted">
                            Add the first component in Edit build.
                          </p>
                        )}
                      </div>
                      <h3>
                        <History size={17} /> Upgrade history
                      </h3>
                      {selected.history.length ? (
                        selected.history.map((h, i) => (
                          <div className="history-entry" key={i}>
                            <i />
                            <small>
                              {h.date} · {h.type}
                            </small>
                            <p>{h.to}</p>
                            <small>Previously: {h.from}</small>
                          </div>
                        ))
                      ) : (
                        <p className="muted">
                          Changes to an owned build’s components appear here.
                        </p>
                      )}
                    </>
                  )}
                  <button
                    className="danger-link"
                    onClick={() =>
                      setConfirm({
                        title: `Remove ${selected.title}?`,
                        description:
                          'This entry, including its notes and history, will be removed from this device.',
                        run: () => {
                          if (
                            commit({
                              ...data,
                              items: data.items.filter(
                                (i) => i.id !== selected.id,
                              ),
                            })
                          ) {
                            setDetail(null);
                            setNotice('Entry removed.');
                          }
                        },
                      })
                    }
                  >
                    <Trash2 size={15} /> Remove from collection
                  </button>
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
        {draft && (
          <Editor item={draft} onClose={() => setDraft(null)} onSave={save} />
        )}
        <Dialog open={sharing} onOpenChange={setSharing}>
          <DialogContent className="settings-dialog">
            <DialogTitle>Collection visibility</DialogTitle>
            <DialogDescription>
              This setting applies to your entire collection. Each list has its
              own visibility.
            </DialogDescription>
            <VisibilityOptions
              value={visibility}
              collection
              onChange={(value) =>
                commit({
                  ...data,
                  collectionVisibility:
                    value === 'Public' ? 'Public' : 'Private',
                })
              }
            />
            <div className="info-panel">
              <Globe size={17} />
              <p>
                Your top six and public lists remain visible even if your
                collection is private. Personal reviews and notes are not
                included in the public collection preview.
              </p>
            </div>
            <button
              className="secondary"
              onClick={() => {
                setSharing(false);
                navigate('profile');
              }}
            >
              <UserRound size={17} /> Open profile
            </button>
            <p className="dialog-footnote">
              Saved account settings control access to your public profile and collection.
            </p>
          </DialogContent>
        </Dialog>
        <Dialog open={settings} onOpenChange={setSettings}>
          <DialogContent className="settings-dialog">
            <DialogTitle>Your space, your way</DialogTitle>
            <DialogDescription>
              Account, appearance, and collection data.
            </DialogDescription>
            <AccountStatus />
            {canImport && <div className="settings-section"><h3>Bring your local library</h3><p>This account has no saved library yet. Import the collection from this browser, including lists and notes.</p><button className="secondary" onClick={() => setConfirm({title:'Import browser library into this account?',description:'Only import if this browser library belongs to you. The original local copy will be kept.',run:() => {try {const value=JSON.parse(localStorage.getItem(STORAGE)||'null'); if(!validCollection(value)) throw new Error(); commit(value);} catch {setNotice('The local collection could not be imported.');}}})}>Import browser library</button></div>}
            <Field label="Appearance">
              <Picker
                label="Theme"
                value={data.theme === 'dark' ? 'Dark' : 'Light'}
                options={['Dark', 'Light']}
                onChange={(v) =>
                  commit({ ...data, theme: v === 'Dark' ? 'dark' : 'light' })
                }
              />
            </Field>
            <div className="settings-section">
              <h3>Collection backup</h3>
              <p>
                Keep a copy before clearing browser data, or bring your
                collection to another device.
              </p>
              <div className="detail-actions">
                <button
                  className="secondary"
                  onClick={() =>
                    download(
                      'pixel-dex-backup.json',
                      (account ? JSON.stringify(dataRef.current, null, 2) : localStorage.getItem(STORAGE)) ||
                        JSON.stringify(data, null, 2),
                      'application/json',
                    )
                  }
                >
                  <Download size={16} /> Export backup
                </button>
                <button
                  className="secondary"
                  onClick={() => upload.current?.click()}
                >
                  <Upload size={16} /> Import backup
                </button>
              </div>
              <input
                ref={upload}
                type="file"
                accept="application/json,.json"
                hidden
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (!file) return;
                  try {
                    if (file.size > 10_000_000) throw new Error();
                    const parsed: unknown = JSON.parse(await file.text());
                    if (!validCollection(parsed)) throw new Error();
                    setConfirm({
                      title: 'Replace your local collection?',
                      description: `Import ${parsed.items.length} items from this backup. Export your current collection first if you want to keep it.`,
                      run: () => {
                        if (commit(parsed, true)) {
                          setNotice('Backup imported.');
                          setSettings(false);
                        }
                      },
                    });
                  } catch {
                    setNotice(
                      'That file is not a valid Pixel Dex backup. Your collection was not changed.',
                    );
                  }
                }}
              />
            </div>
            <div className="settings-section">
              <h3>Make it yours</h3>
              <p>
                The starter collection uses sample data. Clear it when you’re
                ready to add your own.
              </p>
              <button
                className="danger-link"
                onClick={() =>
                  setConfirm({
                    title: 'Start with an empty collection?',
                    description:
                      'This clears your owned and wishlist records, reviews, and upgrade history. Lists and profile favorites stay. Export a backup first to keep your records.',
                    run: () => {
                      if (commit({ ...data, items: [] }, true)) {
                        setSettings(false);
                        setNotice('Your empty collection is ready.');
                      }
                    },
                  })
                }
              >
                <Trash2 size={15} /> Clear collection
              </button>
            </div>
            <div className="info-panel">
              <HardDrive size={17} />
              <p>
                Saved in this browser. A responsive web prototype for desktop
                and phone; account sync and native apps come later.
              </p>
            </div>
          </DialogContent>
        </Dialog>
        <AlertDialog
          open={!!confirm}
          onOpenChange={(open) => !open && setConfirm(null)}
        >
          <AlertDialogContent>
            <AlertDialogTitle>{confirm?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirm?.description}
            </AlertDialogDescription>
            <div className="detail-actions">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  confirm?.run();
                  setConfirm(null);
                }}
              >
                Confirm
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
        {notice && (
          <div role="status" className="notice">
            <Check size={17} />
            {notice}
            <button aria-label="Dismiss message" onClick={() => setNotice('')}>
              <X size={15} />
            </button>
          </div>
        )}
      </SidebarProvider>
    </TooltipProvider>
  );
}
function Editor({
  item,
  onClose,
  onSave,
}: {
  item: Item;
  onClose: () => void;
  onSave: (item: Item) => void;
}) {
  const [form, setForm] = useState(item);
  const set = <K extends keyof Item>(key: K, value: Item[K]) =>
    setForm((f) => ({ ...f, [key]: value }));
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="edit-dialog">
        <DialogTitle>
          {item.title ? 'Edit details' : `New ${item.kind}`}
        </DialogTitle>
        <DialogDescription>
          {item.kind === 'build'
            ? 'Give every component a place. Changes to owned builds are kept in upgrade history.'
            : 'Your collection, exactly how you remember it.'}
        </DialogDescription>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.title.trim()) return;
            const updated = updateComponents(
              item,
              form.components
                .filter((c) => c.name.trim())
                .map((c) => ({ ...c, name: c.name.trim() })),
              new Date().toISOString().slice(0, 10),
            );
            onSave({
              ...form,
              title: form.title.trim(),
              components: updated.components,
              history: updated.history,
            });
          }}
        >
          <Field
            label={
              item.kind === 'console'
                ? 'Model'
                : item.kind === 'build'
                  ? 'Build name'
                  : 'Title'
            }
          >
            <input
              required
              maxLength={180}
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder={
                item.kind === 'build'
                  ? 'e.g. The daily driver'
                  : 'Enter a title'
              }
            />
          </Field>
          <div className="form-grid">
            <Field label="Collection">
              <Picker
                label="Owned or wishlist"
                value={form.owned ? 'Owned' : 'Wishlist'}
                options={['Owned', 'Wishlist']}
                onChange={(v) => set('owned', v === 'Owned')}
              />
            </Field>
            {item.kind !== 'build' && (
              <Field label="Platform">
                <Picker
                  label="Platform"
                  value={form.platform}
                  options={[
                    ...new Set(
                      [
                        'PC',
                        'PlayStation',
                        'PlayStation 5',
                        'PlayStation 4',
                        'Nintendo',
                        'Nintendo Switch',
                        'Xbox',
                        'Xbox Series X|S',
                        'Other',
                        form.platform,
                      ].filter(Boolean),
                    ),
                  ]}
                  onChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      platform: v,
                      launcher:
                        v === 'PC'
                          ? f.launcher === 'None'
                            ? 'Steam'
                            : f.launcher
                          : 'None',
                    }))
                  }
                />
              </Field>
            )}
            {item.kind === 'game' && (
              <>
                {form.platform === 'PC' && (
                  <Field label="Launcher">
                    <Picker
                      label="Launcher"
                      value={form.launcher}
                      options={[
                        ...new Set(
                          [
                            'Steam',
                            'Epic Games',
                            'DRM Free',
                            'GOG',
                            'Xbox app',
                            'EA app',
                            'Ubisoft Connect',
                            'Battle.net',
                            'None',
                            form.launcher,
                          ].filter(Boolean),
                        ),
                      ]}
                      onChange={(v) => set('launcher', v)}
                    />
                  </Field>
                )}
                <Field label="Format">
                  <Picker
                    label="Format"
                    value={form.format}
                    options={['Digital', 'Physical']}
                    onChange={(v) => set('format', v)}
                  />
                </Field>
                {form.owned && (
                  <Field label="Status">
                    <Picker
                      label="Game status"
                      value={form.status}
                      options={statuses}
                      onChange={(v) => set('status', v as Item['status'])}
                    />
                  </Field>
                )}
              </>
            )}
            {item.kind === 'console' && (
              <>
                <Field label="Edition">
                  <input
                    value={form.edition}
                    maxLength={120}
                    onChange={(e) => set('edition', e.target.value)}
                    placeholder="Standard, special edition…"
                  />
                </Field>
                <Field label="Color">
                  <input
                    value={form.color}
                    maxLength={80}
                    onChange={(e) => set('color', e.target.value)}
                    placeholder="e.g. White"
                  />
                </Field>
              </>
            )}
            {!form.owned && (
              <>
                <Field label="Priority">
                  <Picker
                    label="Wishlist priority"
                    value={form.priority}
                    options={priorities}
                    onChange={(v) => set('priority', v)}
                  />
                </Field>
                <Field label="Release timing">
                  <Picker
                    label="Release timing"
                    value={
                      {
                        date: 'Confirmed date',
                        year: 'Confirmed year',
                        tba: 'To be announced',
                        released: 'Already released',
                      }[releaseStatus(form)]
                    }
                    options={[
                      'Confirmed date',
                      'Confirmed year',
                      'To be announced',
                      'Already released',
                    ]}
                    onChange={(v) =>
                      setForm((f) => ({
                        ...f,
                        releaseStatus: (
                          {
                            'Confirmed date': 'date',
                            'Confirmed year': 'year',
                            'To be announced': 'tba',
                            'Already released': 'released',
                          } as const
                        )[
                          v as
                            | 'Confirmed date'
                            | 'Confirmed year'
                            | 'To be announced'
                            | 'Already released'
                        ],
                        releaseDate: '',
                      }))
                    }
                  />
                </Field>
                {releaseStatus(form) === 'date' && (
                  <Field label="Confirmed release date">
                    <input
                      required
                      type="date"
                      value={form.releaseDate}
                      onChange={(e) => set('releaseDate', e.target.value)}
                    />
                  </Field>
                )}
                {releaseStatus(form) === 'year' && (
                  <Field label="Confirmed release year">
                    <input
                      required
                      type="number"
                      min="1900"
                      max="9999"
                      step="1"
                      placeholder="e.g. 2027"
                      value={form.releaseDate}
                      onChange={(e) => set('releaseDate', e.target.value)}
                    />
                  </Field>
                )}
              </>
            )}
          </div>
          {item.kind === 'game' && (
            <Field label="Your rating">
              <div className="rating-control">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    type="button"
                    aria-label={`Rate ${n} out of 5`}
                    aria-pressed={form.rating === n}
                    key={n}
                    onClick={() => set('rating', form.rating === n ? 0 : n)}
                  >
                    <Star
                      size={25}
                      fill={n <= form.rating ? 'currentColor' : 'none'}
                      className={n <= form.rating ? 'filled' : ''}
                    />
                  </button>
                ))}
                <span>{form.rating ? `${form.rating} / 5` : 'Not rated'}</span>
              </div>
            </Field>
          )}
          {item.kind === 'build' && (
            <div className="components-editor">
              <h3>Components</h3>
              {form.components.map((c, index) => (
                <div className="component-edit" key={c.id}>
                  <Picker
                    label={`Component ${index + 1} type`}
                    value={c.type}
                    options={componentTypes}
                    onChange={(v) =>
                      set(
                        'components',
                        form.components.map((x) =>
                          x.id === c.id ? { ...x, type: v } : x,
                        ),
                      )
                    }
                  />
                  <input
                    required
                    aria-label={`${c.type} component name`}
                    value={c.name}
                    maxLength={180}
                    placeholder="Component name"
                    onChange={(e) =>
                      set(
                        'components',
                        form.components.map((x) =>
                          x.id === c.id ? { ...x, name: e.target.value } : x,
                        ),
                      )
                    }
                  />
                  <button
                    className="icon-button"
                    type="button"
                    aria-label={`Remove ${c.type}`}
                    onClick={() =>
                      set(
                        'components',
                        form.components.filter((x) => x.id !== c.id),
                      )
                    }
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="secondary"
                onClick={() =>
                  set('components', [
                    ...form.components,
                    { id: crypto.randomUUID(), type: 'CPU', name: '' },
                  ])
                }
              >
                <Plus size={16} /> Add component
              </button>
            </div>
          )}
          <Field label={item.kind === 'game' ? 'Review & notes' : 'Notes'}>
            <textarea
              rows={4}
              maxLength={5000}
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder={
                form.owned
                  ? 'What makes this one worth remembering?'
                  : 'Why is this on your list?'
              }
            />
          </Field>
          <div className="form-actions">
            <button className="secondary" type="button" onClick={onClose}>
              Cancel
            </button>
            <button className="primary" type="submit">
              <Check size={16} /> Save to collection
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
