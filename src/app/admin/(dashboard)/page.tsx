import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock, CalendarPlus, UserPlus } from "lucide-react";

import { requireUser } from "@/lib/auth-guard";
import { can } from "@/lib/rbac";
import { getClub, getFootballStats, getMatchSchedule } from "@/lib/football";
import StatBadge from "@/components/StatBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/admin/EmptyState";
import { PageHeader } from "@/components/admin/PageHeader";
import { FeatureTour } from "@/components/admin/help/FeatureTour";
import { UpcomingFixtureCard } from "./upcoming-fixture-card";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

type StatTone = "neutral" | "success" | "warning" | "danger";
type StatCard = Readonly<{ label: string; value: number; tone?: StatTone }>;

const UPCOMING_PREVIEW_LIMIT = 4;

export default async function AdminDashboardPage() {
  const session = await requireUser();
  const [stats, club] = await Promise.all([getFootballStats(), getClub()]);
  const upcoming = await getMatchSchedule(club.id);

  const { teamStats, playerStats } = stats;
  const { role } = session.user;
  const canWriteMatch = can(role, "match:write");
  const canWritePlayer = can(role, "player:write");

  const formStats: readonly StatCard[] = [
    { label: "Played", value: teamStats.matchesPlayed },
    { label: "Wins", value: teamStats.wins, tone: "success" },
    { label: "Draws", value: teamStats.draws, tone: "warning" },
    { label: "Losses", value: teamStats.losses, tone: "danger" },
  ];

  const squadStats: readonly StatCard[] = [
    { label: "Goals for", value: teamStats.goalsFor },
    { label: "Goals against", value: teamStats.goalsAgainst, tone: "warning" },
    { label: "Goal diff", value: teamStats.goalDifference, tone: "success" },
    { label: "Players", value: playerStats.length },
    { label: "Upcoming", value: upcoming.length, tone: "warning" },
  ];

  const previewFixtures = upcoming.slice(0, UPCOMING_PREVIEW_LIMIT);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Overview"
        title={`Hello, ${club.shortName}`}
        description="Season snapshot and quick actions."
        actions={<Badge variant="info">{role}</Badge>}
        helpKey="dashboard"
      />
      <FeatureTour featureKey="welcome" />

      <section aria-label="Form" className="flex flex-col gap-3">
        <p className="text-[10px] uppercase tracking-[0.24em] text-white/50">
          Form
        </p>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {formStats.map((stat) => (
            <StatBadge
              key={stat.label}
              label={stat.label}
              value={stat.value}
              tone={stat.tone}
            />
          ))}
        </div>
      </section>

      <section aria-label="Goals and squad" className="flex flex-col gap-3">
        <p className="text-[10px] uppercase tracking-[0.24em] text-white/50">
          Goals &amp; squad
        </p>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5">
          {squadStats.map((stat) => (
            <StatBadge
              key={stat.label}
              label={stat.label}
              value={stat.value}
              tone={stat.tone}
            />
          ))}
        </div>
      </section>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Upcoming fixtures</CardTitle>
          <Button asChild variant="secondary" size="sm">
            <Link href="/admin/matches">View all</Link>
          </Button>
        </CardHeader>
        {previewFixtures.length > 0 ? (
          <div className="flex flex-col gap-3">
            {previewFixtures.map((fixture) => (
              <UpcomingFixtureCard
                key={`${fixture.date}-${fixture.opponent}`}
                fixture={fixture}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<CalendarClock />}
            eyebrow="Schedule"
            title="No upcoming fixtures"
            description="Nothing is on the calendar yet. Add a match to see it here."
            action={
              canWriteMatch ? (
                <Button asChild>
                  <Link href="/admin/matches">
                    <CalendarPlus />
                    Add fixture
                  </Link>
                </Button>
              ) : undefined
            }
          />
        )}
      </Card>

      <section aria-label="Quick actions" className="flex flex-col gap-3">
        <p className="text-[10px] uppercase tracking-[0.24em] text-white/50">
          Quick actions
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          {canWriteMatch ? (
            <Button asChild size="lg" className="flex-1">
              <Link href="/admin/matches">
                <CalendarPlus />
                Add fixture
              </Link>
            </Button>
          ) : null}
          {canWritePlayer ? (
            <Button asChild size="lg" variant="secondary" className="flex-1">
              <Link href="/admin/players">
                <UserPlus />
                Add player
              </Link>
            </Button>
          ) : null}
          <Button asChild size="lg" variant="secondary" className="flex-1">
            <Link href="/admin/players">Manage players</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
