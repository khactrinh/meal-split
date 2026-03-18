import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const authSession = await getServerSession(authOptions);
  const userId = authSession?.user?.id || null;

  const body = await req.json();
  const { sessionId, name, amount, note, participantIds } = body;

  if (!sessionId || !name || amount === undefined || !participantIds || participantIds.length === 0) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Auth check for mealSession
  const session = await prisma.mealSession.findUnique({ where: { id: sessionId }, include: { expenses: true } });
  if (!session || session.userId !== userId) return NextResponse.json({ error: "Not found or forbidden" }, { status: 403 });

  // Calculate share amount perfectly to integer, distributing remainder
  const numParticipants = participantIds.length;
  const shareBase = Math.floor(Number(amount) / numParticipants);
  const remainder = Number(amount) - (shareBase * numParticipants);
  
  const expense = await prisma.expense.create({
    data: {
      mealSessionId: sessionId,
      name,
      amount: Number(amount),
      note,
      splitMethod: "equal",
      participants: {
        create: participantIds.map((memberId: string, index: number) => ({
          member: { connect: { id: memberId } },
          shareAmount: shareBase + (index < remainder ? 1 : 0),
        })),
      },
    },
    include: {
      participants: {
        include: { member: true }
      }
    },
  });

  // Update session total
  if (session) {
    const totalAmount = session.expenses.reduce((sum: number, exp: any) => sum + exp.amount, 0) + expense.amount;
    await prisma.mealSession.update({ where: { id: sessionId }, data: { totalAmount } });
  }

  return NextResponse.json(expense, { status: 201 });
}
