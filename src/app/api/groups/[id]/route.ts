import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authSession = await getServerSession(authOptions);
  const userId = authSession?.user?.id || null;

  const { id } = await params;
  const group = await prisma.group.findUnique({
    where: { id },
    include: { members: true },
  });
  
  if (!group || group.userId !== userId) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(group);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authSession = await getServerSession(authOptions);
  const userId = authSession?.user?.id || null;

  const { id } = await params;
  
  const existing = await prisma.group.findUnique({ where: { id }});
  if (!existing || existing.userId !== userId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { name, type, color } = body;

  const group = await prisma.group.update({
    where: { id },
    data: { name, type, color },
    include: { members: true },
  });
  return NextResponse.json(group);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authSession = await getServerSession(authOptions);
  const userId = authSession?.user?.id || null;

  const { id } = await params;
  
  const existing = await prisma.group.findUnique({ where: { id }});
  if (!existing || existing.userId !== userId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.group.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
