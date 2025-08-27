import { notFound } from "next/navigation";
import { SponsorDetailClient } from "@/components/sponsors/sponsor-detail-client";
import { SponsorsProvider, type Sponsor } from "@/components/sponsors";
import { db } from "@/server/db";

type Props = {
  params: Promise<{ sponsorId: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { sponsorId } = await params;
  const sponsor = await db.sponsor.findUnique({
    where: { id: sponsorId },
    select: { name: true },
  });

  return {
    title: sponsor ? `${sponsor.name} - Sponsor Details` : "Sponsor Not Found",
  };
}

export default async function SponsorDetailPage({ params }: Props) {
  const { sponsorId } = await params;

  const sponsor = await db.sponsor.findUnique({
    where: { id: sponsorId },
    include: {
      portfolio: {
        include: {
          comments: {
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
            orderBy: { createdAt: "desc" },
          },
          watchlistedBy: true,
        },
        orderBy: { dateInvested: "desc" },
      },
    },
  });

  if (!sponsor) {
    notFound();
  }

  // Convert to the format expected by SponsorsProvider
  const sponsorForProvider: Sponsor = {
    id: sponsor.id,
    name: sponsor.name,
    contact: sponsor.contact,
    portfolio: sponsor.portfolio.map((p) => ({
      asset: p.asset,
      webpage: p.webpage ?? undefined,
      fsnSector: p.fsnSector ?? undefined,
      dateInvested: p.dateInvested ? p.dateInvested.toISOString() : undefined,
    })),
  };

  return (
    <SponsorsProvider initialSponsors={[sponsorForProvider]}>
      <SponsorDetailClient initialSponsor={sponsor} />
    </SponsorsProvider>
  );
}
