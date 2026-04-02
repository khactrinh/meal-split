import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const authSession = await getServerSession(authOptions);
  const userId = authSession?.user?.id || null;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { mealSessionId, groupId, memberId, isSettled } = await req.json();

  if (groupId) {
    // 1. Tích chọn gia đình: Cập nhật gia đình và tất cả thành viên trong đó
    const members = await prisma.member.findMany({ where: { groupId } });
    
    await prisma.$transaction([
      prisma.sessionGroup.update({
        where: { mealSessionId_groupId: { mealSessionId, groupId } },
        data: { isSettled }
      }),
      ...members.map(m => prisma.sessionPrepaid.upsert({
        where: { mealSessionId_memberId: { mealSessionId, memberId: m.id } },
        update: { isSettled },
        create: { mealSessionId, memberId: m.id, amount: 0, isSettled }
      }))
    ]);
  } else if (memberId) {
    // 2. Tích chọn cá nhân: Cập nhật người đó
    await prisma.sessionPrepaid.upsert({
      where: { mealSessionId_memberId: { mealSessionId, memberId } },
      update: { isSettled },
      create: { mealSessionId, memberId, amount: 0, isSettled }
    });

    // 3. Tự động cập nhật gia đình nếu toàn bộ thành viên đã xong
    const member = await prisma.member.findUnique({ where: { id: memberId }, select: { groupId: true } });
    if (member?.groupId) {
      const allMembersInGroup = await prisma.member.findMany({ where: { groupId: member.groupId } });
      const groupPrepaids = await prisma.sessionPrepaid.findMany({
        where: { 
          mealSessionId, 
          memberId: { in: allMembersInGroup.map(m => m.id) },
          isSettled: true 
        }
      });

      const isAllSettled = groupPrepaids.length === allMembersInGroup.length;
      await prisma.sessionGroup.update({
        where: { mealSessionId_groupId: { mealSessionId, groupId: member.groupId } },
        data: { isSettled: isAllSettled }
      });
    }
  }

  return NextResponse.json({ success: true });
}
