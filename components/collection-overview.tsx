'use client';
import { useEffect, useState, type ReactNode } from 'react';
import {
  Library,
  Gamepad2,
  ListTodo,
  Heart,
  ArrowRight,
  CalendarDays,
  Play,
  Clock,
  Search,
} from 'lucide-react';
import type { Item } from '@/lib/tracker';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@/components/ui/carousel';
import {
  daysUntil,
  nextThirtyDays,
  releaseLabel,
  todayKey,
  upcomingSections,
} from '@/lib/releases';
type Props = {
  items: Item[];
  onOpen: (id: string) => void;
  onNavigate: (section: string, status?: string) => void;
  renderCover: (item: Item, small?: boolean) => ReactNode;
};
function useToday() {
  const [today, setToday] = useState(() => todayKey());
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const refresh = () => {
      clearTimeout(timer);
      if (document.visibilityState !== 'visible') return;
      setToday(todayKey());
      const now = new Date();
      const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      timer = setTimeout(refresh, midnight.getTime() - now.getTime() + 1000);
    };
    refresh();
    document.addEventListener('visibilitychange', refresh);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);
  return today;
}
function PreviewCard({
  item,
  onOpen,
  renderCover,
}: Pick<Props, 'onOpen' | 'renderCover'> & { item: Item }) {
  return (
    <button className="game-card" onClick={() => onOpen(item.id)}>
      <div className={'cover ' + (item.kind !== 'game' ? 'console-cover' : '')}>
        {renderCover(item)}
        <span className="cover-badge">
          <i />
          {!item.owned
            ? 'Wishlisted'
            : item.kind === 'game'
              ? item.status
              : 'Owned'}
        </span>
      </div>
      <div className="game-title">{item.title}</div>
      <div className="game-meta">
        {item.platform || 'PC build'}
        {item.kind === 'game' && item.platform === 'PC' && (
          <> · {item.launcher}</>
        )}
      </div>
    </button>
  );
}
export function CollectionOverview({
  items,
  onOpen,
  onNavigate,
  renderCover,
}: Props) {
  const today = useToday();
  const games = items.filter((i) => i.owned && i.kind === 'game');
  const playing = games.filter((i) => i.status === 'Playing');
  const recent = [...items]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 6);
  const due = nextThirtyDays(items, today);
  return (
    <div className="overview">
      <div className="stats">
        {(
          [
            [Library, games.length, 'Games owned', 'games', 'All'],
            [
              Gamepad2,
              items.filter((i) => i.owned && i.kind === 'console').length,
              'Consoles owned',
              'consoles',
              'All',
            ],
            [
              ListTodo,
              games.filter((i) => i.status === 'Backlog').length,
              'Games in backlog',
              'games',
              'Backlog',
            ],
            [
              Heart,
              items.filter((i) => !i.owned && i.kind === 'game').length,
              'Games in wishlist',
              'gameWishlist',
              'All',
            ],
          ] as const
        ).map(([Icon, count, label, section, status]) => (
          <button
            className="stat"
            key={label}
            onClick={() => onNavigate(section, status)}
          >
            <Icon size={18} />
            <strong>{count}</strong>
            <span>{label}</span>
          </button>
        ))}
      </div>
      <div className="dashboard-columns">
        <section className="dashboard-playing">
          <div className="section-heading">
            <h2>
              <Play size={17} /> Currently playing <span>{playing.length}</span>
            </h2>
            <button onClick={() => onNavigate('games', 'Playing')}>
              View all <ArrowRight size={15} />
            </button>
          </div>
          {playing.length ? (
            <Carousel
              className="playing-carousel"
              aria-label="Currently playing games"
              opts={{ align: 'start', containScroll: 'trimSnaps' }}
            >
              <CarouselContent>
                {playing.map((item, index) => (
                  <CarouselItem
                    key={item.id}
                    aria-label={`${index + 1} of ${playing.length}`}
                  >
                    <PreviewCard
                      item={item}
                      onOpen={onOpen}
                      renderCover={renderCover}
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="playing-carousel-controls">
                <CarouselPrevious aria-label="Previous playing games" />
                <CarouselNext aria-label="Next playing games" />
              </div>
            </Carousel>
          ) : (
            <div className="quiet-empty">
              <Gamepad2 size={26} />
              <p>Ready for your next game?</p>
              <button
                className="secondary"
                onClick={() => onNavigate('games', 'Backlog')}
              >
                Browse your backlog
              </button>
            </div>
          )}
        </section>
        <section className="release-panel">
          <div className="section-heading">
            <h2>
              <CalendarDays size={17} /> Coming soon
            </h2>
          </div>
          <div className="release-window">
            NEXT 30 DAYS{' '}
            <span>
              {due.length} {due.length === 1 ? 'release' : 'releases'}
            </span>
          </div>
          {due.length ? (
            <div className="release-list">
              {due.slice(0, 5).map((i) => (
                <button
                  className="release-row"
                  key={i.id}
                  onClick={() => onOpen(i.id)}
                >
                  {renderCover(i, true)}
                  <span>
                    <strong>{i.title}</strong>
                    <small>{releaseLabel(i)}</small>
                    <em>
                      {daysUntil(i.releaseDate, today) === 0
                        ? 'Today'
                        : `In ${daysUntil(i.releaseDate, today)} days`}{' '}
                      · {i.kind === 'game' ? 'Game' : 'Hardware'}
                    </em>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="quiet-empty">
              <CalendarDays size={28} />
              <p>No wishlist releases in the next 30 days.</p>
              <small>
                Add a confirmed release date to a wishlist item to see it here.
              </small>
            </div>
          )}
          <button className="panel-link" onClick={() => onNavigate('upcoming')}>
            Explore upcoming releases <ArrowRight size={16} />
          </button>
        </section>
      </div>
      <section className="recent-section">
        <div className="section-heading">
          <h2>
            <Clock size={17} /> Recently added <span>Games & hardware</span>
          </h2>
        </div>
        {recent.length ? (
          <div className="recent-grid">
            {recent.map((i) => (
              <button
                className="recent-item"
                key={i.id}
                onClick={() => onOpen(i.id)}
              >
                {renderCover(i, true)}
                <span>
                  <strong>{i.title}</strong>
                  <small>
                    {i.kind === 'build' ? 'PC build' : i.platform} ·{' '}
                    {i.owned ? 'Owned' : 'Wishlisted'}
                  </small>
                </span>
                <ArrowRight size={15} />
              </button>
            ))}
          </div>
        ) : (
          <div className="quiet-empty">
            <p>Your new additions will appear here.</p>
            <button className="secondary" onClick={() => onNavigate('games')}>
              Add your first game
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
export function UpcomingPage({
  items,
  onOpen,
  onNavigate,
  renderCover,
}: Props) {
  const today = useToday();
  const [query, setQuery] = useState('');
  const sections = upcomingSections(
    items.filter((i) => i.title.toLowerCase().includes(query.toLowerCase())),
    today,
  );
  const count = sections.reduce(
    (sum, section) => sum + section.items.length,
    0,
  );
  return (
    <div className="upcoming-page">
      <label className="search-box upcoming-search">
        <Search size={17} />
        <input
          aria-label="Search upcoming releases"
          placeholder="Search upcoming games & hardware…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      {sections.map((section) => (
        <section className="release-section" key={section.key}>
          <div className="release-section-heading">
            <h2>{section.title}</h2>
          </div>
          <div className="upcoming-grid">
            {section.items.map((i) => (
              <button
                className="upcoming-card"
                key={i.id}
                onClick={() => onOpen(i.id)}
              >
                <div className="release-art">
                  {renderCover(i)}
                  <span className="release-kind">
                    {i.kind === 'game'
                      ? 'Game'
                      : i.kind === 'console'
                        ? 'Console'
                        : 'Planned build'}
                  </span>
                </div>
                <div className="upcoming-card-body">
                  <div className="release-date">
                    {section.dated && <CalendarDays size={14} />}{' '}
                    {releaseLabel(i)}
                  </div>
                  <h3>{i.title}</h3>
                  <div className="game-meta">
                    {i.platform || 'PC build'} <span>·</span> {i.priority}{' '}
                    priority
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      ))}
      {count === 0 && query && (
        <div className="release-empty">No matching releases.</div>
      )}
      {count === 0 && !query && (
        <div className="upcoming-help">
          <p>
            Open a wishlist item, choose Edit details, and set its release
            timing. Released items stay in your wishlist but don’t appear here.
          </p>
          <div>
            <button
              className="secondary"
              onClick={() => onNavigate('gameWishlist')}
            >
              Game wishlist <ArrowRight size={15} />
            </button>
            <button
              className="secondary"
              onClick={() => onNavigate('hardwareWishlist')}
            >
              Hardware wishlist <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
