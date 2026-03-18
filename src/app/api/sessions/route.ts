import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const authSession = await getServerSession(authOptions);
  const userId = authSession?.user?.id || null;

  const sessions = await prisma.mealSession.findMany({
    where: { userId },
    include: {
      groups: {
        include: { group: true },
      },
      expenses: {
        include: { participants: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(sessions);
}

export async function POST(req: NextRequest) {
  const authSession = await getServerSession(authOptions);
  const userId = authSession?.user?.id || null;

  const body = await req.json();
  const { name, description, groupIds } = body;

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const session = await prisma.mealSession.create({
    data: {
      name,
      description,
      userId,
      groups: {
        create: (groupIds || []).map((groupId: string) => ({
          group: { connect: { id: groupId } },
        })),
      },
    },
    include: {
      groups: {
        include: { group: true },
      },
    },
  });
  return NextResponse.json(session, { status: 201 });
}
