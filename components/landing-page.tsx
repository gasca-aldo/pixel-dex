'use client';
import { useEffect, useState } from 'react';
import { ArrowRight, Gamepad2, Moon, Sun } from 'lucide-react';
import { covers } from '@/lib/covers';

function StartLink() {
  return (
    <a className="primary landing-cta" href="/login?mode=signup">
      Start your Pixel Dex <ArrowRight size={17} aria-hidden="true" />
    </a>
  );
}
const examples = [
  { id: '1145360', title: 'Hades', status: 'Playing' },
  { id: '504230', title: 'Celeste', status: 'Completed' },
  { id: '413150', title: 'Stardew Valley', status: 'Paused' },
];
const statusMeanings = {
  Playing: 'Your current experience.',
  Completed: 'A journey you finished.',
  Backlog: 'Something you want to dive into.',
  Paused: 'An experience you’re stepping away from for now.',
  Dropped:
    'A game you chose to leave behind — and that’s part of the journey too.',
};
function StatusMeanings() {
  const [active, setActive] = useState<string | null>(null);
  return (
    <>
      <div className="landing-statuses" role="group" aria-label="Game statuses">
        {Object.entries(statusMeanings).map(([status]) => (
          <button
            key={status}
            type="button"
            aria-pressed={active === status}
            aria-describedby={`landing-status-${status}`}
            onPointerEnter={(event) => {
              if (event.pointerType !== 'touch') setActive(status);
            }}
            onFocus={() => setActive(status)}
            onClick={() => setActive(status)}
          >
            {status}
          </button>
        ))}
      </div>
      <div
        className="landing-status-meaning"
        aria-live="polite"
        aria-atomic="true"
      >
        <p
          aria-hidden={active !== null}
          className={active === null ? 'is-active' : ''}
        >
          Choose a status to explore its meaning.
        </p>
        {Object.entries(statusMeanings).map(([status, meaning]) => (
          <p
            key={status}
            id={`landing-status-${status}`}
            aria-hidden={active !== status}
            className={active === status ? 'is-active' : ''}
          >
            <strong>{status}</strong> · {meaning}
          </p>
        ))}
      </div>
    </>
  );
}
export function LandingPage() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
  }, []);
  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem('pixel-dex-theme', next ? 'dark' : 'light');
    } catch {}
  }
  return (
    <div className="landing">
      <a className="landing-skip" href="#landing-content">
        Skip to content
      </a>
      <header className="landing-nav landing-container">
        <a className="landing-brand" href="/" aria-label="Pixel Dex home">
          <span>
            <Gamepad2 size={25} aria-hidden="true" />
          </span>
          pixel dex
        </a>
        <nav aria-label="Main navigation">
          <button
            className="landing-theme"
            onClick={toggleTheme}
            aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            {dark ? <Sun size={19} /> : <Moon size={19} />}
          </button>
          <a className="landing-signin" href="/login">
            Sign in <ArrowRight size={15} aria-hidden="true" />
          </a>
        </nav>
      </header>
      <main id="landing-content" className="landing-container" tabIndex={-1}>
        <section className="landing-hero" aria-labelledby="landing-title">
          <div>
            <span className="landing-beta">Public Beta</span>
            <h1 id="landing-title">
              Your games.
              <br />
              Your hardware.
              <br />
              <em>Your journey.</em>
            </h1>
            <p className="landing-lead">
              Pixel Dex is your personal gaming journal.
            </p>
            <p>
              Keep the games you’ve played, the hardware you’ve collected, what
              you’re playing now, what’s waiting in your backlog, what you
              dropped, and what you can’t wait to experience next.
            </p>
            <StartLink />
          </div>
          <figure className="landing-preview">
            <figcaption>
              <span>Games & memories</span>
              <small>Sample journal entries</small>
            </figcaption>
            <div className="landing-cards">
              {examples.map((game) => (
                <div className="game-card" key={game.id}>
                  <div className="cover">
                    <img
                      src={covers[game.id]}
                      alt={`${game.title} cover`}
                      width="600"
                      height="900"
                    />
                    <span className="cover-badge">{game.status}</span>
                  </div>
                  <div className="game-title">{game.title}</div>
                </div>
              ))}
            </div>
            <div className="landing-note">
              <span className="landing-eyebrow">Review & notes · Celeste</span>
              <p>
                “Came for the climb. Stayed for the feeling of trying again.”
              </p>
            </div>
          </figure>
        </section>
        <section className="landing-story" aria-labelledby="history-heading">
          <div>
            <span className="landing-eyebrow">Your gaming history</span>
            <h2 id="history-heading">Every game has a place in your story.</h2>
          </div>
          <div>
            <StatusMeanings />
            <p>
              Keep a record of the games that have been part of your journey,
              across platforms and over time.
            </p>
            <p>
              You don’t need to own a game forever for the experience to matter.
            </p>
          </div>
        </section>
        <section className="landing-journal" aria-labelledby="journal-heading">
          <span className="landing-eyebrow">More than a checkmark</span>
          <h2 id="journal-heading">
            Remember the experience,
            <br />
            not just the status.
          </h2>
          <p>
            Write a quick note, leave a short review, or take the time to tell
            the whole story.
          </p>
          <p>
            What did you love? What disappointed you? Why did you stop playing?
            What made you come back years later?
          </p>
          <p className="landing-belief">
            There’s no backlog guilt in Pixel Dex. Finishing a game is only one
            possible part of the experience.
          </p>
        </section>
        <div className="landing-pair">
          <section aria-labelledby="hardware-heading">
            <span className="landing-eyebrow">Beyond the games</span>
            <h2 id="hardware-heading">
              The things we play on become part of the memory.
            </h2>
            <p>
              Consoles, handhelds and hardware can be as meaningful as the games
              themselves.
            </p>
            <p>
              Keep your hardware alongside your games and build a journal that
              reflects how you actually experienced them.
            </p>
          </section>
          <section aria-labelledby="upcoming-heading">
            <span className="landing-eyebrow">Looking forward</span>
            <h2 id="upcoming-heading">
              Sometimes the memory starts with the hype.
            </h2>
            <p>
              Keep track of upcoming games you’re excited about and the ones
              sitting on your wishlist.
            </p>
            <p>
              Remember what you expected before release — and eventually, what
              the game actually meant to you.
            </p>
          </section>
        </div>
        <section
          className="landing-identity"
          aria-labelledby="identity-heading"
        >
          <span className="landing-eyebrow">
            Personal first. Shared your way.
          </span>
          <h2 id="identity-heading">This is who you are as a gamer.</h2>
          <p className="landing-lead">
            Your favorites. Your games. Your hardware. Your lists. Your
            thoughts.
          </p>
          <p>
            Build a Pixel Dex that reflects what you’ve experienced and what
            mattered to you, then share as much or as little of it as you want.
          </p>
          <div className="landing-beta-note">
            <strong>Pixel Dex is growing with you.</strong>
            <p>
              It’s currently in public beta, so things will keep changing and
              improving as real players use it.
            </p>
          </div>
          <div className="landing-final-actions">
            <StartLink />
            <a className="landing-feedback" href="mailto:aldongasca@gmail.com">
              Send feedback <ArrowRight size={16} aria-hidden="true" />
            </a>
          </div>
        </section>
      </main>
      <footer className="landing-footer landing-container">
        <div>
          <strong>Pixel Dex</strong>
          <p>Your personal gaming journal.</p>
        </div>
        <nav aria-label="Footer">
          <a href="/privacy">Privacy</a>
          <a href="/hardware-credits">Hardware credits</a>
        </nav>
      </footer>
    </div>
  );
}
