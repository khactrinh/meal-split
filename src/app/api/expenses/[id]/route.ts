import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authSession = await getServerSession(authOptions);
  const userId = authSession?.user?.id || null;

  const { id } = await params;
  
  const expense = await prisma.expense.findUnique({ 
    where: { id },
    include: { mealSession: true }
  });
  if (!expense || expense.mealSession.userId !== userId) return NextResponse.json({ error: "Not found or forbidden" }, { status: 404 });

  await prisma.expense.delete({ where: { id } });

  // Update session total
  const session = await prisma.mealSession.findUnique({ where: { id: expense.mealSessionId }, include: { expenses: true } });
  if (session) {
    const totalAmount = session.expenses.reduce((sum: number, exp: any) => sum + exp.amount, 0);
    await prisma.mealSession.update({ where: { id: session.id }, data: { totalAmount } });
  }

  return NextResponse.json({ success: true });
}
