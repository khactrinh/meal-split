import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const authSession = await getServerSession(authOptions);
  const userId = authSession?.user?.id || null;

  try {
    const { mealSessionId, memberId, amount } = await req.json();

    if (!mealSessionId || !memberId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Kiểm tra quyền truy cập (optionally check if member/session belongs to user)
    
    const prepaid = await prisma.sessionPrepaid.upsert({
      where: {
        mealSessionId_memberId: {
          mealSessionId,
          memberId,
        },
      },
      update: {
        amount: Number(amount),
      },
      create: {
        mealSessionId,
        memberId,
        amount: Number(amount),
      },
    });

    return NextResponse.json(prepaid);
  } catch (error) {
    console.error("Error setting prepaid:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
