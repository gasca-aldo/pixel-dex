'use client';
import { useEffect, useState } from 'react';
import { ArrowRight, Moon, Sun } from 'lucide-react';
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
  Completed: "Games that you've finished but not necessarily keep.",
  Backlog: "You own these but haven't started yet.",
  Paused: 'Games you needed a break from or just wanted to jump into something else for the moment.',
  Dropped:
    'No shame, just not for you.',
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
            <img src="/brand/pixel-dex-icon.svg" width="25" height="25" alt="" />
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
              Keep the games you've played, the consoles you owned, what you're playing, your backlog, what you've dropped, and what you can't wait to see released.
            </p>
            <StartLink />
          </div>
          <figure className="landing-preview">
            <figcaption>
              <span>Games & memories</span>
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

            <h2 id="history-heading">Every game is an experience to be remembered.</h2>
          </div>
          <div>
            <StatusMeanings />
            <p>
              Keep a record of the games you have experienced across platforms and time.
            </p>
          </div>
        </section>
        <section className="landing-journal" aria-labelledby="journal-heading">

          <h2 id="journal-heading">
            Remember the experience,
            <br />
            not just the status.
          </h2>
          <p>
            Write a quick note, leave a short review, or take the time to share the whole story you had with that game.
          </p>
          <p>
            What did you love? What disappointed you? Why did you stop playing?
            What made you come back years later?
          </p>
        </section>
        <div className="landing-pair">
          <section aria-labelledby="hardware-heading">

            <h2 id="hardware-heading">
              The things we play on become part of the memory.
            </h2>
            <p>
              Consoles, handhelds and every hardware we play in can be as meaningful as the games themselves.
            </p>
            <p>
              Keep your hardware alongside your games and build a journal that
              reflects how you actually experienced them.
            </p>
          </section>
          <section aria-labelledby="upcoming-heading">

            <h2 id="upcoming-heading">
              Sometimes the memory starts with the hype.
            </h2>
            <p>
              Keep track of upcoming games you’re excited about and the ones
              sitting on your wishlist.
            </p>
            <p>
              Remember what you expected before release and eventually, what the game actually meant to you even if it didn't match the expectations.
            </p>
          </section>
        </div>
        <section
          className="landing-identity"
          aria-labelledby="identity-heading"
        >
          <h2 id="identity-heading">This is who you are as a player.</h2>
          <p>
            Build your Pixel Dex with what you’ve experienced and share it as you want.
          </p>
          <div className="landing-beta-note">
            <strong>Pixel Dex is growing with you.</strong>
            <p>
              It’s currently a WIP, so things will keep changing and
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
        <div className="landing-footer-brand">
          <img src="/brand/pixel-dex-app-icon.svg" width="28" height="28" alt="" />
          <strong>pixel dex</strong>
        </div>
        <nav aria-label="Footer">
          <a href="/privacy">Privacy</a>
          <a href="/hardware-credits">Hardware credits</a>
        </nav>
      </footer>
    </div>
  );
}
