'use client';
import { ProfileAddress, ShareLink } from '@/components/sharing-controls';
import { useState, type ReactNode } from 'react';
import {
  Plus,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Lock,
  Link2,
  Globe,
  Pencil,
  Trash2,
  Search,
  X,
  ListOrdered,
  Check,
  Eye,
  Download,
  Heart,
  UserRound,
  Gamepad2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  addListGame,
  moveListGame,
  newGameList,
  gameChoices,
  getProfile,
  collectionAccess,
  publicProfile,
  sharedList,
  listSnapshot,
  validGameList,
  type Collection,
  type GameList,
  type GameRef,
  type Visibility,
  type PlayerProfile,
  type Item,
} from '@/lib/tracker';
type RenderArt = (game: GameRef, small?: boolean) => ReactNode;
type CommonProps = {
  data: Collection;
  commit: (next: Collection) => boolean;
  renderArt: RenderArt;
};
const accessOptions = [
  ['Private', Lock, 'Only you can see it.'],
  ['Unlisted', Link2, 'Anyone with the link; hidden from your profile.'],
  ['Public', Globe, 'Visible on your profile and available for discovery.'],
] as const;
export function VisibilityOptions({
  value,
  onChange,
  collection = false,
}: {
  value: string;
  onChange: (v: Visibility) => void;
  collection?: boolean;
}) {
  return (
    <RadioGroup
      className="visibility-options"
      value={value}
      aria-label={collection ? 'Collection visibility' : 'List visibility'}
      onValueChange={(v) => onChange(v as Visibility)}
    >
      {accessOptions
        .filter(([v]) => !collection || v !== 'Unlisted')
        .map(([v, Icon, desc]) => (
          <label key={v} className={value === v ? 'chosen' : ''}>
            <Icon size={18} />
            <span>
              <strong>{v}</strong>
              <small>
                {collection
                  ? v === 'Private'
                    ? 'Your collection is visible only to you.'
                    : 'Your collection is visible on your profile.'
                  : desc}
              </small>
            </span>
            <RadioGroupItem value={v} aria-label={v} />
          </label>
        ))}
    </RadioGroup>
  );
}
function AccessBadge({ value }: { value: Visibility }) {
  const Icon =
    value === 'Private' ? Lock : value === 'Unlisted' ? Link2 : Globe;
  return (
    <span className="list-access">
      <Icon size={13} />
      {value}
    </span>
  );
}
function GamePicker({
  items,
  selected,
  onPick,
  onClose,
  renderArt,
}: {
  items: Item[];
  selected: string[];
  onPick: (game: GameRef) => void;
  onClose: () => void;
  renderArt: RenderArt;
}) {
  const [query, setQuery] = useState('');
  const choices = gameChoices(items).filter((g) =>
    g.title.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="catalog-dialog">
        <DialogTitle>Choose a game</DialogTitle>
        <DialogDescription>
          Choose from the sample catalog or add a custom title. Ownership isn’t
          required.
        </DialogDescription>
        <label className="search-box">
          <Search size={17} />
          <input
            autoFocus
            value={query}
            aria-label="Search games for this list"
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search games…"
          />
        </label>
        <div className="catalog-results">
          {choices.map((game) => (
            <button
              className="catalog-result"
              key={game.id}
              disabled={selected.includes(game.id)}
              onClick={() => {
                onPick(game);
                onClose();
              }}
            >
              {renderArt(game, true)}
              <span>
                <strong>{game.title}</strong>
                <small>
                  {selected.includes(game.id)
                    ? 'Already selected'
                    : 'Add without changing your collection'}
                </small>
              </span>
              {selected.includes(game.id) ? (
                <Check size={17} />
              ) : (
                <Plus size={17} />
              )}
            </button>
          ))}
        </div>
        {query.trim() && (
          <button
            className="secondary"
            onClick={() => {
              onPick({
                id: `custom:${crypto.randomUUID()}`,
                title: query.trim().slice(0, 180),
              });
              onClose();
            }}
          >
            <Plus size={16} /> Add “{query.trim().slice(0, 60)}” as a custom
            title
          </button>
        )}
      </DialogContent>
    </Dialog>
  );
}
export function ListReadView({
  list,
  renderArt,
}: {
  list: Pick<GameList, 'title' | 'description' | 'ranked' | 'entries'>;
  renderArt: RenderArt;
}) {
  return (
    <div className="list-read-view">
      <h2>{list.title}</h2>
      {list.description && (
        <p className="list-description">{list.description}</p>
      )}
      <div className="list-entries">
        {list.entries.map((entry, index) => (
          <article className="list-entry" key={entry.game.id}>
            {list.ranked && <span className="list-rank">{index + 1}</span>}
            <div className="list-entry-cover">{renderArt(entry.game)}</div>
            <div className="list-entry-body">
              <h3>{entry.game.title}</h3>
              {entry.note && <p>{entry.note}</p>}
            </div>
          </article>
        ))}
      </div>
      {!list.entries.length && <p className="muted">No games added yet.</p>}
    </div>
  );
}
function ListMosaic({
  list,
  renderArt,
}: {
  list: GameList;
  renderArt: RenderArt;
}) {
  return (
    <div className="list-mosaic">
      {list.entries.slice(0, 4).map((e) => (
        <div key={e.game.id}>{renderArt(e.game)}</div>
      ))}
      {Array.from({ length: Math.max(0, 4 - list.entries.length) }, (_, n) => (
        <span className="mosaic-empty" key={n}>
          <Gamepad2 size={24} strokeWidth={1} />
        </span>
      ))}
    </div>
  );
}
export function GameLists({ data, commit, renderArt }: CommonProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [draft, setDraft] = useState<GameList | null>(null);
  const [picking, setPicking] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const list = (data.lists || []).find((l) => l.id === selected);
  const lists = (data.lists || [])
    .filter((l) => l.title.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => b.updatedAt - a.updatedAt);
  function save() {
    if (!draft) return;
    const next = { ...draft, title: draft.title.trim(), updatedAt: Date.now() };
    if (!validGameList(next)) {
      setError('Add a list name and check your entries.');
      return;
    }
    if (
      commit({
        ...data,
        lists: [...(data.lists || []).filter((l) => l.id !== next.id), next],
      })
    ) {
      setSelected(next.id);
      setDraft(null);
      setError('');
    }
  }
  function download(list: GameList) {
    try {
      const url = URL.createObjectURL(
        new Blob([listSnapshot(list)], { type: 'text/html' }),
      );
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'pixel-dex-list.html';
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setError('Choose Unlisted or Public before sharing this list.');
    }
  }
  if (draft)
    return (
      <div className="list-editor">
        <div className="list-toolbar">
          <button
            className="text-button"
            onClick={() => {
              setDraft(null);
              setError('');
            }}
          >
            <ArrowLeft size={16} /> Cancel editing
          </button>
          <button className="primary" onClick={save}>
            <Check size={16} /> Save list
          </button>
        </div>
        {error && (
          <p role="alert" className="warning">
            {error}
          </p>
        )}
        <div className="list-editor-grid">
          <div>
            <label className="field">
              <span>List name</span>
              <input
                value={draft.title}
                maxLength={120}
                placeholder="e.g. Worlds I keep coming back to"
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
            </label>
            <label className="field">
              <span>Description</span>
              <textarea
                rows={4}
                maxLength={3000}
                value={draft.description}
                placeholder="What brings these games together?"
                onChange={(e) =>
                  setDraft({ ...draft, description: e.target.value })
                }
              />
            </label>
            <label className="ranking-choice">
              <Switch
                checked={draft.ranked}
                onCheckedChange={(ranked) => setDraft({ ...draft, ranked })}
              />
              <span>
                Numbered ranking
                <small>
                  Manual order is available with or without rankings.
                </small>
              </span>
            </label>
          </div>
          <div>
            <h3>Who can see this list?</h3>
            <VisibilityOptions
              value={draft.visibility}
              onChange={(visibility) => setDraft({ ...draft, visibility })}
            />
          </div>
        </div>
        <div className="section-heading">
          <h2>
            Games <span>{draft.entries.length}</span>
          </h2>
          <button
            className="secondary"
            disabled={draft.entries.length >= 500}
            onClick={() => setPicking(true)}
          >
            <Plus size={16} /> Add game
          </button>
        </div>
        {draft.entries.map((entry, index) => (
          <article className="list-entry editable-entry" key={entry.game.id}>
            {draft.ranked && <span className="list-rank">{index + 1}</span>}
            <div className="list-entry-cover">{renderArt(entry.game)}</div>
            <div className="list-entry-body">
              <h3>{entry.game.title}</h3>
              <label className="field">
                <span className="sr-only">
                  List note for {entry.game.title}
                </span>
                <textarea
                  rows={2}
                  maxLength={3000}
                  value={entry.note}
                  placeholder="Add a note just for this list…"
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      entries: draft.entries.map((v, n) =>
                        n === index ? { ...v, note: e.target.value } : v,
                      ),
                    })
                  }
                />
              </label>
            </div>
            <div className="entry-controls">
              <button
                className="icon-button"
                disabled={index === 0}
                aria-label={`Move ${entry.game.title} up`}
                onClick={() => setDraft(moveListGame(draft, index, index - 1))}
              >
                <ArrowUp size={17} />
              </button>
              <button
                className="icon-button"
                disabled={index === draft.entries.length - 1}
                aria-label={`Move ${entry.game.title} down`}
                onClick={() => setDraft(moveListGame(draft, index, index + 1))}
              >
                <ArrowDown size={17} />
              </button>
              <button
                className="icon-button"
                aria-label={`Remove ${entry.game.title} from list`}
                onClick={() =>
                  setDraft({
                    ...draft,
                    entries: draft.entries.filter((_, n) => n !== index),
                  })
                }
              >
                <X size={17} />
              </button>
            </div>
          </article>
        ))}
        {!draft.entries.length && (
          <div className="quiet-empty">
            <ListOrdered size={28} />
            <p>Add any game, whether you own it or not.</p>
            <button className="secondary" onClick={() => setPicking(true)}>
              <Plus size={16} /> Add first game
            </button>
          </div>
        )}
        <div className="form-actions">
          <button className="primary" onClick={save}>
            Save list
          </button>
        </div>
        {picking && (
          <GamePicker
            items={data.items}
            selected={draft.entries.map((e) => e.game.id)}
            onPick={(game) => setDraft(addListGame(draft, game))}
            onClose={() => setPicking(false)}
            renderArt={renderArt}
          />
        )}
      </div>
    );
  return (
    <div className="lists-page">
      {list ? (
        <>
          <div className="list-toolbar">
            <button className="text-button" onClick={() => setSelected(null)}>
              <ArrowLeft size={16} /> All lists
            </button>
            <div>
              <AccessBadge value={list.visibility} />
              <button
                className="secondary"
                onClick={() => {
                  setDraft(structuredClone(list));
                  setError('');
                }}
              >
                <Pencil size={16} /> Edit list
              </button>
            </div>
          </div>
          <ListReadView list={list} renderArt={renderArt} />
          <div className="list-bottom-actions">
            {list.visibility !== 'Private' && (
              <>
                <ShareLink listId={list.id} />
                <button className="secondary" onClick={() => setPreview(true)}>
                  <Eye size={16} /> Shared preview
                </button>
                <button className="secondary" onClick={() => download(list)}>
                  <Download size={16} /> Share snapshot
                </button>
              </>
            )}
            <button className="danger-link" onClick={() => setDeleting(true)}>
              <Trash2 size={16} /> Delete list
            </button>
          </div>
          <p className="dialog-footnote">
            Notes are visible to everyone who can access this list. Save changes to your account before sharing.
          </p>
        </>
      ) : (
        <>
          <div className="list-toolbar">
            <label className="search-box">
              <Search size={17} />
              <input
                aria-label="Search your lists"
                placeholder="Search lists…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <button
              className="primary"
              disabled={(data.lists || []).length >= 200}
              onClick={() => {
                setDraft(newGameList());
                setError('');
              }}
            >
              <Plus size={16} /> Create list
            </button>
          </div>
          {lists.length ? (
            <div className="lists-grid">
              {lists.map((l) => (
                <button
                  className="list-card"
                  key={l.id}
                  onClick={() => setSelected(l.id)}
                >
                  <ListMosaic list={l} renderArt={renderArt} />
                  <div className="list-card-body">
                    <h2>{l.title}</h2>
                    <div>
                      <span>
                        {l.entries.length} games {l.ranked ? '· Ranked' : ''}
                      </span>
                      <AccessBadge value={l.visibility} />
                    </div>
                    {l.description && <p>{l.description}</p>}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <ListOrdered size={30} />
              <h2>
                {query ? 'No matching lists.' : 'Every list has a story.'}
              </h2>
              <p>
                {query
                  ? 'Try another list name.'
                  : 'Your favorites, a theme, or a top ten. Bring any games together.'}
              </p>
              {!query && (
                <button
                  className="secondary"
                  onClick={() => setDraft(newGameList())}
                >
                  <Plus size={16} /> Create your first list
                </button>
              )}
            </div>
          )}
        </>
      )}
      {error && <p role="alert">{error}</p>}
      <AlertDialog open={deleting} onOpenChange={setDeleting}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete this list?</AlertDialogTitle>
          <AlertDialogDescription>
            The list and its notes will be removed. Games in your collection
            will stay.
          </AlertDialogDescription>
          <div className="detail-actions">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (
                  commit({
                    ...data,
                    lists: (data.lists || []).filter((l) => l.id !== selected),
                  })
                ) {
                  setSelected(null);
                  setDeleting(false);
                }
              }}
            >
              Delete list
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
      <Dialog open={preview} onOpenChange={setPreview}>
        <DialogContent className="list-preview-dialog">
          <DialogTitle>Shared list preview</DialogTitle>
          <DialogDescription>
            {list?.visibility === 'Unlisted'
              ? 'Visible through a shared link, absent from your profile.'
              : 'Visible on your profile.'}
          </DialogDescription>
          {list && sharedList(data, list.id) && (
            <ListReadView
              list={sharedList(data, list.id)!}
              renderArt={renderArt}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
export function PlayerPage({ data, commit, renderArt }: CommonProps) {
  const [visitor, setVisitor] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<PlayerProfile>(() =>
    structuredClone(getProfile(data)),
  );
  const [picking, setPicking] = useState(false);
  const [listId, setListId] = useState<string | null>(null);
  const visible = publicProfile(data);
  const owner = getProfile(data);
  const profile = visitor ? visible : owner;
  const top = profile.topGames;
  const publicLists = visible.lists;
  const access = collectionAccess(data);
  return (
    <div className="player-page">
      <div className="profile-mode">
        <Tabs
          value={visitor ? 'visitor' : 'owner'}
          onValueChange={(v) => {
            setVisitor(v === 'visitor');
            setListId(null);
          }}
        >
          <TabsList>
            <TabsTrigger value="owner">My profile</TabsTrigger>
            <TabsTrigger value="visitor">Visitor preview</TabsTrigger>
          </TabsList>
        </Tabs>
        {!visitor && (
          <button
            className="secondary"
            onClick={() => {
              setDraft(structuredClone(owner));
              setEditing(true);
            }}
          >
            <Pencil size={16} /> Edit profile
          </button>
        )}
      </div>
      {!visitor && <ProfileAddress />}
      <div className="player-header">
        <div className="player-avatar">
          <UserRound size={33} />
        </div>
        <div>
          <h2>{profile.name}</h2>
          {profile.bio && <p>{profile.bio}</p>}
          <span className="public-showcase">
            <Globe size={13} /> Public showcase
          </span>
        </div>
      </div>
      <section className="top-six-section">
        <div className="section-heading">
          <h2>
            <Heart size={18} /> Top six{' '}
            <span>Favorites, in no particular order</span>
          </h2>
          {!visitor && (
            <button
              onClick={() => {
                setDraft(structuredClone(owner));
                setEditing(true);
              }}
            >
              Choose favorites <Pencil size={14} />
            </button>
          )}
        </div>
        {top.length ? (
          <div className="top-six-grid">
            {top.map((game) => (
              <div className="top-six-card" key={game.id}>
                <div>{renderArt(game)}</div>
                <h3>{game.title}</h3>
              </div>
            ))}
          </div>
        ) : (
          <div className="quiet-empty">
            <Heart size={26} />
            <p>
              {visitor
                ? 'No favorites selected yet.'
                : 'Choose up to six games to make your profile your own.'}
            </p>
            {!visitor && (
              <button
                className="secondary"
                onClick={() => {
                  setDraft(structuredClone(owner));
                  setEditing(true);
                }}
              >
                Choose your top six
              </button>
            )}
          </div>
        )}
      </section>
      {!visitor && (
        <section className="collection-access-panel">
          <div>
            <h3>Collection visibility</h3>
            <p>
              Your top six and public lists stay visible even when the
              collection is private.
            </p>
          </div>
          <div>
            <VisibilityOptions
              value={access}
              collection
              onChange={(value) =>
                commit({
                  ...data,
                  collectionVisibility:
                    value === 'Public' ? 'Public' : 'Private',
                })
              }
            />
          </div>
        </section>
      )}
      <section className="profile-public-lists">
        <div className="section-heading">
          <h2>
            <ListOrdered size={18} /> Public lists
          </h2>
        </div>
        {publicLists.length ? (
          <div className="lists-grid">
            {publicLists.map((l) => (
              <button
                key={l.id}
                className="list-card"
                onClick={() => setListId(l.id)}
              >
                <div className="list-mosaic">
                  {l.entries.slice(0, 4).map((e) => (
                    <div key={e.game.id}>{renderArt(e.game)}</div>
                  ))}
                </div>
                <div className="list-card-body">
                  <h2>{l.title}</h2>
                  <span>
                    {l.entries.length} games {l.ranked ? '· Ranked' : ''}
                  </span>
                  {l.description && <p>{l.description}</p>}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <p className="muted">
            {visitor
              ? 'No public lists yet.'
              : 'Lists marked Public will appear here. Private and unlisted lists stay off your profile.'}
          </p>
        )}
      </section>
      <section className="profile-collection">
        <div className="section-heading">
          <h2>Collection</h2>
          <span className="list-access">
            {access === 'Private' ? <Lock size={14} /> : <Globe size={14} />}{' '}
            {access}
          </span>
        </div>
        {visible.collection === null ? (
          <div className="quiet-empty">
            <Lock size={24} />
            <p>This collection is private.</p>
          </div>
        ) : (
          <div className="recent-grid">
            {visible.collection.map((item) => (
              <article className="recent-item" key={item.id}>
                {item.kind === 'game' ? (
                  renderArt(
                    {
                      id: item.id,
                      title: item.title,
                      catalogId: item.catalogId,
                    },
                    true,
                  )
                ) : (
                  <Gamepad2 size={28} />
                )}
                <span>
                  <strong>{item.title}</strong>
                  <small>
                    {item.platform || 'PC build'} ·{' '}
                    {item.owned ? 'Owned' : 'Wishlisted'}
                  </small>
                </span>
              </article>
            ))}
            {!visible.collection.length && (
              <p className="muted">The collection is empty.</p>
            )}
          </div>
        )}
      </section>
      <p className="dialog-footnote">
        Your public profile shows your saved account data. Private and unlisted lists stay off your profile.
      </p>
      <Dialog open={editing && !picking} onOpenChange={setEditing}>
        <DialogContent className="profile-edit-dialog">
          <DialogTitle>Edit your profile</DialogTitle>
          <DialogDescription>
            Your name, bio, and top six form your public showcase.
          </DialogDescription>
          <label className="field">
            <span>Display name</span>
            <input
              value={draft.name}
              maxLength={60}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          </label>
          <label className="field">
            <span>Bio</span>
            <textarea
              rows={2}
              value={draft.bio}
              maxLength={500}
              onChange={(e) => setDraft({ ...draft, bio: e.target.value })}
            />
          </label>
          <div className="section-heading">
            <h2>
              Top six <span>{draft.topGames.length} / 6</span>
            </h2>
            <button
              disabled={draft.topGames.length >= 6}
              onClick={() => setPicking(true)}
            >
              <Plus size={15} /> Add game
            </button>
          </div>
          <div className="top-six-edit">
            {draft.topGames.map((game) => (
              <div key={game.id}>
                {renderArt(game, true)}
                <span>{game.title}</span>
                <button
                  className="icon-button"
                  aria-label={`Remove ${game.title} from top six`}
                  onClick={() =>
                    setDraft({
                      ...draft,
                      topGames: draft.topGames.filter((g) => g.id !== game.id),
                    })
                  }
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
          <p className="dialog-footnote">
            Unranked favorites. Visible even when your collection is private.
          </p>
          <div className="form-actions">
            <button className="secondary" onClick={() => setEditing(false)}>
              Cancel
            </button>
            <button
              className="primary"
              disabled={!draft.name.trim()}
              onClick={() => {
                if (
                  commit({
                    ...data,
                    profile: { ...draft, name: draft.name.trim() },
                  })
                )
                  setEditing(false);
              }}
            >
              Save profile
            </button>
          </div>
        </DialogContent>
      </Dialog>
      {picking && (
        <GamePicker
          items={data.items}
          selected={draft.topGames.map((g) => g.id)}
          onPick={(game) => {
            if (
              draft.topGames.length < 6 &&
              !draft.topGames.some((g) => g.id === game.id)
            )
              setDraft({ ...draft, topGames: [...draft.topGames, game] });
          }}
          onClose={() => setPicking(false)}
          renderArt={renderArt}
        />
      )}
      <Dialog open={!!listId} onOpenChange={(open) => !open && setListId(null)}>
        <DialogContent className="list-preview-dialog">
          <DialogTitle>Public list</DialogTitle>
          <DialogDescription>
            List description and notes shared by this player.
          </DialogDescription>
          {publicLists.find((l) => l.id === listId) && (
            <ListReadView
              list={publicLists.find((l) => l.id === listId)!}
              renderArt={renderArt}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
