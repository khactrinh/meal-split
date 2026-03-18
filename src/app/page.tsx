"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatVND } from "@/lib/utils";

type Session = {
  id: string;
  name: string;
  totalAmount: number;
  date: string;
  groups: { group: { name: string, type: string } }[];
};

export default function Home() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/sessions")
      .then((res) => res.json())
      .then((data) => {
        setSessions(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center flex-mobile-col mb-8">
        <div>
          <h2>Lịch sử chi tiêu</h2>
          <p>Quản lý các hoạt động và chi phí chung của bạn</p>
        </div>
        <Link href="/sessions/new" className="btn btn-primary" style={{ width: "auto" }}>
          + Thêm phiên mới
        </Link>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "#94a3b8" }}>
          Đang tải dữ liệu...
        </div>
      ) : sessions.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "4rem 2rem", borderStyle: "dashed", borderColor: "var(--border)" }}>
          <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🍽️</div>
          <h3>Chưa có hoạt động nào</h3>
          <p>Bắt đầu bằng việc tạo một phiên chia tiền mới!</p>
          <Link href="/sessions/new" className="btn btn-primary mt-4" style={{ width: "auto" }}>
            Tạo phiên ngay
          </Link>
        </div>
      ) : (
        <div className="flex-col gap-4">
          {sessions.map((session) => (
            <Link href={`/sessions/${session.id}`} key={session.id}>
              <div className="card flex justify-between items-center flex-mobile-col" style={{ cursor: "pointer", gap: "1rem" }}>
                <div>
                  <h3>{session.name}</h3>
                  <div className="flex gap-2 items-center" style={{ fontSize: "0.875rem", color: "#94a3b8" }}>
                    <span>{new Date(session.date).toLocaleDateString("vi-VN")}</span>
                    <span>•</span>
                    <div className="flex gap-2">
                      {session.groups.slice(0, 3).map((g, idx) => (
                        <span key={idx} className="badge">{g.group.name}</span>
                      ))}
                      {session.groups.length > 3 && <span className="badge">+{session.groups.length - 3}</span>}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "1.25rem", fontWeight: "700", color: "var(--primary)" }}>
                    {formatVND(session.totalAmount)}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
