"use client";

// Removed unused imports

export function HomepageHero() {
  return (
    <div className="space-y-6">
      {/* Hero Title */}
      <div className="space-y-4 text-center">
        <div className="space-y-2">
          <h1 className="text-foreground text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Exit Radar by{" "}
            <span className="text-primary inline-block transition-all duration-500 ease-in-out hover:scale-105 hover:drop-shadow-[0_0_20px_rgba(34,197,94,0.3)]">
              FSN Labs
            </span>
          </h1>
          <p className="text-muted-foreground hover:text-foreground/80 mx-auto max-w-2xl text-lg transition-colors duration-300">
            Your central hub for portfolio companies and PE firm management.
            Discover, analyze, and monitor investment opportunities.
          </p>
        </div>
      </div>
    </div>
  );
}
