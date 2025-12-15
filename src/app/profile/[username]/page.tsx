// src/app/profile/[username]/page.tsx
import ProfileClient from "./ProfileClient";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ username: string }>;
}

export default async function ProfilePage({ params }: Props) {
  const { username } = await params;
  return <ProfileClient username={decodeURIComponent(username)} />;
}
