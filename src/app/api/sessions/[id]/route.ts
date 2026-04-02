import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authSession = await getServerSession(authOptions);
  const userId = authSession?.user?.id || null;

  const { id } = await params;
  const session = await prisma.mealSession.findUnique({
    where: { id },
    include: {
      groups: {
        include: { 
          group: {
            include: { members: true }
          }
        },
      },
      expenses: {
        include: { 
          participants: {
            include: { member: true }
          }
        },
      },
      prepaids: true,
    },
  });
  if (!session || session.userId !== userId) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(session);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authSession = await getServerSession(authOptions);
  const userId = authSession?.user?.id || null;

  const { id } = await params;

  const session = await prisma.mealSession.findUnique({ where: { id } });
  if (!session || session.userId !== userId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.mealSession.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
