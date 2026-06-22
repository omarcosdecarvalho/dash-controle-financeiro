import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const { itemId } = await params;
  const body = await req.json();
  const item = await prisma.itemFatura.update({
    where: { id: itemId },
    data: { categoria: body.categoria },
  });
  return NextResponse.json(item);
}
