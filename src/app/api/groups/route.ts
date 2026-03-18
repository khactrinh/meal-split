import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const authSession = await getServerSession(authOptions);
  const userId = authSession?.user?.id || null;

  const groups = await prisma.group.findMany({
    where: { userId },
    include: { members: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(groups);
}

export async function POST(req: NextRequest) {
  const authSession = await getServerSession(authOptions);
  const userId = authSession?.user?.id || null;

  const body = await req.json();
  const { name, type, color } = body;

  if (!name || !type) {
    return NextResponse.json({ error: "Name and type are required" }, { status: 400 });
  }

  const group = await prisma.group.create({
    data: { name, type, color: color ?? "#6366f1", userId },
    include: { members: true },
  });
  return NextResponse.json(group, { status: 201 });
}
