export function SiteFooter() {
  return (
    <footer className="border-t border-gold/25 px-6 py-8 text-xs leading-relaxed text-muted">
      <p>
        This is an unofficial fan site and is not affiliated with the Academy of
        Motion Picture Arts and Sciences. &ldquo;Oscars&rdquo; and
        &ldquo;Academy Awards&rdquo; are registered trademarks of AMPAS.
      </p>
      <p className="mt-3">
        Ceremony records are compiled from the{" "}
        <a
          href="https://awardsdatabase.oscars.org"
          className="text-gold underline-offset-2 hover:text-gold-light hover:underline"
        >
          Academy Awards Database
        </a>{" "}
        and a historical nominations dataset.
      </p>
      <p className="mt-3">
        This product uses the TMDB API but is not endorsed or certified by TMDB.
        Visit{" "}
        <a
          href="https://www.themoviedb.org"
          className="text-gold underline-offset-2 hover:text-gold-light hover:underline"
        >
          themoviedb.org
        </a>
        .
      </p>
    </footer>
  );
}
