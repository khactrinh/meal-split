"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";

export default function AuthHeader() {
  const { data: session, status } = useSession();

  return (
    <nav style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
      <Link href="/groups" className="btn btn-outline" style={{ padding: "0.5rem 1rem", width: "auto" }}>
        Nhóm & Bạn bè
      </Link>
      {status === "loading" ? (
        <span style={{ fontSize: "0.875rem", color: "#94a3b8" }}>...</span>
      ) : session ? (
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <img src={session.user?.image || ""} alt="" style={{ width: "32px", height: "32px", borderRadius: "50%" }} />
          <button onClick={() => signOut({ callbackUrl: "/" })} className="btn btn-danger" style={{ padding: "0.5rem 1rem", width: "auto", fontSize: "0.875rem" }}>
            Đăng xuất
          </button>
        </div>
      ) : (
        <button onClick={() => signIn("google")} className="btn btn-primary" style={{ padding: "0.5rem 1rem", width: "auto", fontSize: "0.875rem" }}>
          Đăng nhập Google
        </button>
      )}
    </nav>
  );
}
