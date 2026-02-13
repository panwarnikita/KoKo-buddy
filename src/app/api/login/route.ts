// import { connectDB } from "@/lib/db";
// import User from "@/models/User";
import { connectDB } from "../../../lib/db";
import User from "../../../models/User";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    await connectDB();

    const user = await User.findOne({ email });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 400 });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });

    return NextResponse.json({ message: "Login successful", user: { name: user.name, email: user.email } }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}