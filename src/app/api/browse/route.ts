import { NextResponse } from 'next/server';
import { getAllCrabs, getOnlineStatus } from '@/lib/db';

export async function GET() {
  const crabs = await getAllCrabs();
  
  // Return public profile info with online status
  const publicCrabs = crabs.map(crab => {
    const onlineStatus = getOnlineStatus(crab.lastActive);
    return {
      username: crab.username,
      displayName: crab.displayName,
      bio: crab.bio,
      avatarUrl: crab.avatarUrl,
      backgroundColor: crab.backgroundColor,
      textColor: crab.textColor,
      accentColor: crab.accentColor,
      lastActive: crab.lastActive,
      onlineStatus: onlineStatus.status,
      onlineText: onlineStatus.text,
    };
  });
  
  // Sort: online first, then by recent activity
  publicCrabs.sort((a, b) => {
    const statusOrder = { online: 0, recent: 1, offline: 2 };
    const statusDiff = statusOrder[a.onlineStatus] - statusOrder[b.onlineStatus];
    if (statusDiff !== 0) return statusDiff;
    // Within same status, sort by most recent
    if (a.lastActive && b.lastActive) {
      return new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime();
    }
    return 0;
  });
  
  return NextResponse.json({ crabs: publicCrabs });
}
