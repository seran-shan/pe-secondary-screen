"use client";

// Removed unused imports

export function HomepageHero() {

  return (
    <div className="space-y-6">
      {/* Hero Title */}
      <div className="space-y-4 text-center">
        <div className="space-y-2">
          <h1 className="text-foreground text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Exit Radar by <span className="text-primary">FSN Labs</span>
          </h1>
          <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
            Your central hub for portfolio companies and PE firm management.
            Discover, analyze, and monitor investment opportunities.
          </p>
        </div>
      </div>
    </div>
  );
}
