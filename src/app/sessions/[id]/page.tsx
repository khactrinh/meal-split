"use client";

import { useState, useEffect, useMemo, use } from "react";
import Link from "next/link";
import { formatVND } from "@/lib/utils";

export default function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAddExpense, setShowAddExpense] = useState(false);
  
  const [expenseForm, setExpenseForm] = useState({
    name: "", amount: "", note: ""
  });
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);

  const loadSession = () => {
    fetch(`/api/sessions/${id}`).then(r => r.json()).then(data => {
      setSession(data);
      setLoading(false);
    });
  };

  useEffect(() => loadSession(), [id]);

  // Lấy danh sách tất cả thành viên từ các nhóm tham gia session này
  const allMembers = useMemo(() => {
    if (!session || session.error) return [];
    const members: any[] = [];
    if (session.groups) {
      session.groups.forEach((g: any) => {
        if (g.group && g.group.members) {
          g.group.members.forEach((m: any) => {
            members.push({ ...m, groupName: g.group.name, groupId: g.group.id });
          });
        }
      });
    }
    return members;
  }, [session]);

  const toggleParticipant = (memberId: string) => {
    if (selectedParticipants.includes(memberId)) {
      setSelectedParticipants(selectedParticipants.filter(x => x !== memberId));
    } else {
      setSelectedParticipants([...selectedParticipants, memberId]);
    }
  };

  const selectAllParticipants = () => {
    if (selectedParticipants.length === allMembers.length) {
      setSelectedParticipants([]);
    } else {
      setSelectedParticipants(allMembers.map(m => m.id));
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseForm.name || !expenseForm.amount || selectedParticipants.length === 0) return;

    await fetch("/api/expenses", {
      method: "POST",
      body: JSON.stringify({
        sessionId: id,
        name: expenseForm.name,
        amount: Number(expenseForm.amount.replace(/\D/g, "")),
        note: expenseForm.note,
        participantIds: selectedParticipants
      }),
    });

    setExpenseForm({ name: "", amount: "", note: "" });
    setSelectedParticipants([]);
    setShowAddExpense(false);
    loadSession();
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm("Xóa mục này?")) return;
    await fetch(`/api/expenses/${expenseId}`, { method: "DELETE" });
    loadSession();
  };

  // Tính toán kết quả chia tiền
  const calculateResult = useMemo(() => {
    if (!session || session.error) return { byMember: {}, byGroup: {} };
    
    const byMember: Record<string, { member: any, total: number }> = {};
    const byGroup: Record<string, { groupName: string, total: number }> = {};

    // Khởi tạo 0 cho mọi người
    allMembers.forEach(m => {
      byMember[m.id] = { member: m, total: 0 };
    });

    // Cộng dồn từng expense
    session.expenses.forEach((exp: any) => {
      exp.participants.forEach((p: any) => {
        if (byMember[p.memberId]) {
          byMember[p.memberId].total += (p.shareAmount || 0);
        }
      });
    });

    // Gom nhóm
    // Làm tròn cho từng cá nhân trước để khi cộng lên nhóm không bị lệch số lẻ
    allMembers.forEach(m => {
      byMember[m.id].total = Math.round(byMember[m.id].total);
      
      if (!byGroup[m.groupId]) {
        byGroup[m.groupId] = { groupName: m.groupName, total: 0 };
      }
      byGroup[m.groupId].total += byMember[m.id].total;
    });

    return { byMember, byGroup };
  }, [session, allMembers]);

  if (loading) return <div>Đang tải...</div>;
  if (!session || session.error) return <div style={{ textAlign: "center", padding: "4rem", color: "var(--danger)" }}>Không tìm thấy hoặc bạn không có quyền truy cập phiên này.</div>;

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2>🍽️ {session.name}</h2>
          <p style={{ margin: 0 }}>
            {new Date(session.date).toLocaleDateString("vi-VN")} • Ttổng cộng: <strong style={{ color: "var(--primary)", fontSize: "1.25rem" }}>{formatVND(session.totalAmount)}</strong>
          </p>
        </div>
        <Link href="/" className="btn btn-outline" style={{ width: "auto" }}>
          ← Về trang chủ
        </Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 350px", gap: "2rem" }}>
        {/* Cột trái: Hóa đơn */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3>Danh sách món ăn</h3>
            <button 
              onClick={() => setShowAddExpense(!showAddExpense)}
              className="btn-primary btn" 
              style={{ width: "auto", padding: "0.25rem 1rem", borderRadius: "999px" }}
            >
              + Thêm mục mới
            </button>
          </div>

          {showAddExpense && (
            <div className="card mb-4" style={{ backgroundColor: "rgba(99, 102, 241, 0.05)", border: "2px solid var(--primary)" }}>
              <form onSubmit={handleAddExpense}>
                <div className="flex gap-4">
                  <div className="form-group flex-1">
                    <label className="form-label">Tên món</label>
                    <input className="form-input" required value={expenseForm.name} onChange={e => setExpenseForm({...expenseForm, name: e.target.value})} placeholder="Ăn gì..." />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Thành tiền (VNĐ)</label>
                    <input className="form-input" type="number" required value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})} placeholder="100000" />
                  </div>
                </div>
                
                <div className="form-group">
                  <div className="flex justify-between items-center mb-2">
                    <label className="form-label mb-0">Ai đóng tiền món này?</label>
                    <button type="button" onClick={selectAllParticipants} style={{ color: "var(--primary)", fontSize: "0.875rem" }}>
                      {selectedParticipants.length === allMembers.length ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                    </button>
                  </div>
                  <div className="flex-col gap-2">
                    {/* Gom nhóm các lựa chọn cá nhân theo Nhóm/Gia đình */}
                    {Object.entries(
                      allMembers.reduce((acc, m) => {
                        if (!acc[m.groupName]) acc[m.groupName] = [];
                        acc[m.groupName].push(m);
                        return acc;
                      }, {} as Record<string, any[]>)
                    ).map(([groupName, members]: [string, any]) => (
                      <div key={groupName} className="mb-2">
                        <strong style={{ fontSize: "0.875rem", color: "#94a3b8", display: "block", marginBottom: "0.5rem" }}>
                          {groupName}
                        </strong>
                        <div className="flex gap-2" style={{ flexWrap: "wrap" }}>
                          {members.map((m: any) => (
                            <div 
                              key={m.id} 
                              onClick={() => toggleParticipant(m.id)}
                              className="badge"
                              style={{ 
                                cursor: "pointer", 
                                padding: "0.5rem 1rem",
                                border: selectedParticipants.includes(m.id) ? "1px solid var(--primary)" : "1px solid var(--border)",
                                background: selectedParticipants.includes(m.id) ? "var(--primary)" : "transparent",
                                color: selectedParticipants.includes(m.id) ? "white" : "inherit"
                              }}
                            >
                              {m.avatar} {m.name}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button type="button" onClick={() => setShowAddExpense(false)} className="btn btn-outline" style={{ width: "auto" }}>Hủy</button>
                  <button type="submit" disabled={selectedParticipants.length===0} className="btn btn-primary" style={{ width: "auto" }}>Lưu khoản chi</button>
                </div>
              </form>
            </div>
          )}

          {session.expenses.length === 0 ? (
            <p className="text-center p-8" style={{ color: "var(--border)" }}>Chưa có khoản chi nào.</p>
          ) : (
            <div className="flex-col gap-2">
              {session.expenses.map((exp: any) => (
                <div key={exp.id} className="card p-4" style={{ marginBottom: "0.5rem" }}>
                  <div className="flex justify-between items-center mb-2">
                    <h4 style={{ margin: 0 }}>{exp.name}</h4>
                    <div className="flex items-center gap-4">
                      <strong style={{ color: "var(--primary)" }}>{formatVND(exp.amount)}</strong>
                      <button onClick={() => handleDeleteExpense(exp.id)} style={{ color: "var(--danger)", padding: "0.25rem" }}>🗑️</button>
                    </div>
                  </div>
                  <div className="flex gap-2 overflow-x-auto">
                    {exp.participants.map((p: any) => (
                      <span key={p.id} className="badge" style={{ fontSize: "0.75rem" }}>
                        {p.member?.avatar} {p.member?.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cột phải: Kết quả chia tiền */}
        <div>
          <div className="card sticky" style={{ top: "2rem" }}>
            <h3 className="mb-4" style={{ textAlign: "center", borderBottom: "1px solid var(--border)", paddingBottom: "1rem" }}>💰 TỔNG KẾT</h3>
            
            <h4 style={{ color: "#94a3b8", fontSize: "0.875rem", textTransform: "uppercase" }}>Theo Nhóm / Gia đình</h4>
            <div className="mb-4">
              {Object.values(calculateResult.byGroup).filter(g => g.total > 0).map((g: any, idx) => (
                <div key={idx} className="flex justify-between items-center mb-2">
                  <strong>{g.groupName}</strong>
                  <span style={{ fontWeight: "700", color: "var(--success)" }}>{formatVND(g.total)}</span>
                </div>
              ))}
              {Object.values(calculateResult.byGroup).filter(g => g.total > 0).length === 0 && (
                <p style={{ fontSize: "0.875rem" }}>Chưa có phát sinh</p>
              )}
            </div>

            <h4 style={{ color: "#94a3b8", fontSize: "0.875rem", textTransform: "uppercase" }}>Theo Cá nhân</h4>
            <div>
              {Object.values(calculateResult.byMember).filter(m => m.total > 0).sort((a,b) => b.total - a.total).map((m: any, idx) => (
                <div key={idx} className="flex justify-between items-center mb-2 p-2 rounded" style={{ background: "rgba(255,255,255,0.02)" }}>
                  <div className="flex items-center gap-2">
                    <span>{m.member.avatar}</span>
                    <span>{m.member.name}</span>
                  </div>
                  <span style={{ fontFamily: "monospace", fontSize: "0.875rem" }}>{formatVND(m.total)}</span>
                </div>
              ))}
              {Object.values(calculateResult.byMember).filter(m => m.total > 0).length === 0 && (
                <p style={{ fontSize: "0.875rem" }}>Chưa có phát sinh</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
