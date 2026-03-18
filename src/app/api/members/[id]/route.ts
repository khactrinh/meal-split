import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authSession = await getServerSession(authOptions);
  const userId = authSession?.user?.id || null;

  const { id } = await params;
  
  const existing = await prisma.member.findUnique({ where: { id }});
  if (!existing || existing.userId !== userId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { name, avatar, groupId } = body;

  const member = await prisma.member.update({
    where: { id },
    data: { name, avatar, groupId: groupId ?? null },
    include: { group: true },
  });
  return NextResponse.json(member);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authSession = await getServerSession(authOptions);
  const userId = authSession?.user?.id || null;

  const { id } = await params;
  
  const existing = await prisma.member.findUnique({ where: { id }});
  if (!existing || existing.userId !== userId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.member.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
