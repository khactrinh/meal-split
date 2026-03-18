import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const authSession = await getServerSession(authOptions);
  const userId = authSession?.user?.id || null;

  const members = await prisma.member.findMany({
    where: { userId },
    include: { group: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(members);
}

export async function POST(req: NextRequest) {
  const authSession = await getServerSession(authOptions);
  const userId = authSession?.user?.id || null;

  const body = await req.json();
  const { name, avatar, groupId } = body;

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  // Optional: check if groupId belongs to user
  if (groupId) {
     const group = await prisma.group.findUnique({ where: { id: groupId }});
     if (!group || group.userId !== userId) return NextResponse.json({ error: "Invalid group" }, { status: 400 });
  }

  const member = await prisma.member.create({
    data: { name, avatar, groupId: groupId ?? null, userId },
    include: { group: true },
  });
  return NextResponse.json(member, { status: 201 });
}
