import { notFound } from "next/navigation";
import { SponsorDetailClient } from "@/components/sponsors/sponsor-detail-client";
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
          sponsor: true,
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
          Alert: {
            include: {
              user: true,
            },
          },
        },
        orderBy: { dateInvested: "desc" },
      },
    },
  });

  if (!sponsor) {
    notFound();
  }

  return <SponsorDetailClient initialSponsor={sponsor} />;
}
