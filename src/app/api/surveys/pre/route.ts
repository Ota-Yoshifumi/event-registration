import { NextResponse } from "next/server";

// 事前アンケートは廃止されました
export async function POST() {
  return NextResponse.json(
    { error: "事前アンケートは実施しておりません" },
    { status: 410 }
  );
}
