"use client";

import { useState, useEffect, useMemo, use } from "react";
import Link from "next/link";
import { formatVND } from "@/lib/utils";

export default function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [settlingId, setSettlingId] = useState<string | null>(null);
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

    setSubmitting(true);
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
    setSubmitting(false);
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
    
    const byMember: Record<string, { member: any, total: number, paidBefore: number, isSettled: boolean }> = {};
    const byGroup: Record<string, { groupName: string, total: number, isSettled: boolean, groupId: string }> = {};

    // Khởi tạo 0 cho mọi người
    allMembers.forEach(m => {
      const prepaidRecord = session.prepaids?.find((p: any) => p.memberId === m.id);
      byMember[m.id] = { 
        member: m, 
        total: 0, 
        paidBefore: prepaidRecord?.amount || 0,
        isSettled: prepaidRecord?.isSettled || false
      };
    });

    // Cộng dồn từng expense
    session.expenses.forEach((exp: any) => {
      exp.participants.forEach((p: any) => {
        if (byMember[p.memberId]) {
          byMember[p.memberId].total += (p.shareAmount || 0);
        }
      });
    });

    // Trừ số tiền đã ứng trước
    allMembers.forEach(m => {
      if (byMember[m.id]) {
        byMember[m.id].total -= byMember[m.id].paidBefore;
      }
    });

    // Gom nhóm
    allMembers.forEach(m => {
      byMember[m.id].total = Math.round(byMember[m.id].total);
      
      if (!byGroup[m.groupId]) {
        const sessionGroup = session.groups?.find((g: any) => g.groupId === m.groupId);
        byGroup[m.groupId] = { 
          groupName: m.groupName, 
          total: 0, 
          isSettled: sessionGroup?.isSettled || false,
          groupId: m.groupId
        };
      }
      byGroup[m.groupId].total += byMember[m.id].total;
    });

    return { byMember, byGroup };
  }, [session, allMembers]);

  const handleToggleSettlement = async (params: { groupId?: string, memberId?: string, isSettled: boolean }) => {
    const idToSet = params.groupId || params.memberId || "";
    setSettlingId(idToSet);
    try {
      const res = await fetch("/api/sessions/settle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mealSessionId: id,
          ...params
        }),
      });
      if (!res.ok) throw new Error("Failed to toggle settlement");
      await loadSession();
    } catch (err) {
      console.error(err);
      alert("Không thể cập nhật trạng thái đóng tiền. Vui lòng thử lại.");
    } finally {
      setSettlingId(null);
    }
  };

  const handleUpdatePrepaid = async (memberId: string, amount: string) => {
    const numAmount = Number(amount);
    await fetch("/api/sessions/prepaid", {
      method: "POST",
      body: JSON.stringify({
        mealSessionId: id,
        memberId,
        amount: numAmount
      }),
    });
    loadSession();
  };

  if (loading) return <div>Đang tải...</div>;
  if (!session || session.error) return <div style={{ textAlign: "center", padding: "4rem", color: "var(--danger)" }}>Không tìm thấy hoặc bạn không có quyền truy cập phiên này.</div>;

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-8 flex-mobile-col">
        <div>
          <h2>🍽️ {session.name}</h2>
          <p style={{ margin: 0 }}>
            {new Date(session.date).toLocaleDateString("vi-VN")} • Tổng cộng: <strong style={{ color: "var(--primary)", fontSize: "1.25rem" }}>{formatVND(session.totalAmount)}</strong>
          </p>
        </div>
        <Link href="/" className="btn btn-outline" style={{ width: "auto" }}>
          ← Về trang chủ
        </Link>
      </div>

      <div className="flex-mobile-col flex gap-12 items-start" style={{ display: "flex", width: "100%" }}>
        {/* Cột trái: Hóa đơn & Tiền ứng */}
        <div style={{ flex: 1.5, width: "100%" }}>
          {/* Section Tiền ứng trước */}
          <div className="card mb-8" style={{ border: "1px solid var(--border)", background: "rgba(255,255,255,0.01)", padding: "1.5rem" }}>
            <div className="flex justify-between items-center mb-4">
              <h3 style={{ margin: 0, fontSize: "1.1rem" }}>💳 Tiền ứng trước phiên này</h3>
              <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>(Tự động lưu khi nhập xong)</span>
            </div>
            
            <div className="flex flex-col gap-4">
              {Object.entries(
                allMembers.reduce((acc, m) => {
                  if (!acc[m.groupName]) acc[m.groupName] = [];
                  acc[m.groupName].push(m);
                  return acc;
                }, {} as Record<string, any[]>)
              ).map(([groupName, members]: [string, any]) => (
                <div key={groupName} style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "0.75rem" }}>
                  <div style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: "600", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {groupName}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "0.75rem" }}>
                    {members.map((m: any) => {
                      const paid = calculateResult.byMember[m.id]?.paidBefore || 0;
                      return (
                        <div key={m.id} className="flex items-center gap-2 p-1 rounded-full bg-white/5 border border-white/10 hover:border-primary/30 transition-colors" style={{ paddingRight: "0.75rem", width: "100%", boxSizing: "border-box" }}>
                          <span style={{ fontSize: "1rem", marginLeft: "0.25rem", flexShrink: 0 }}>{m.avatar}</span>
                          <span style={{ fontWeight: "500", fontSize: "0.8rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1 }}>{m.name}</span>
                          <div style={{ display: "flex", alignItems: "center", background: "rgba(0,0,0,0.2)", borderRadius: "999px", padding: "0 0.75rem", border: "1px solid rgba(255,255,255,0.1)", flexShrink: 0 }}>
                            <input 
                              type="number" 
                              className="form-input" 
                              style={{ 
                                padding: "0.15rem 0", 
                                fontSize: "0.8rem", 
                                width: "90px", 
                                height: "24px",
                                textAlign: "right",
                                border: "none",
                                background: "transparent",
                                boxShadow: "none",
                                color: "white"
                              }}
                              defaultValue={paid || ""}
                              onBlur={(e) => handleUpdatePrepaid(m.id, e.target.value)}
                              placeholder="0"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center mb-8 flex-wrap gap-2">
            <h3>Danh sách chi tiêu</h3>
            <button 
              onClick={() => setShowAddExpense(!showAddExpense)}
              className="btn-primary btn" 
              style={{ width: "auto", padding: "0.5rem 1.25rem", borderRadius: "999px" }}
            >
              + Thêm khoản chi
            </button>
          </div>

          {showAddExpense && (
            <div className="card mb-8" style={{ backgroundColor: "rgba(99, 102, 241, 0.05)", border: "2px solid var(--primary)", padding: "2rem 1.5rem" }}>
              <form onSubmit={handleAddExpense}>
                <div className="flex gap-6 flex-mobile-col mb-2">
                  <div className="form-group flex-1">
                    <label className="form-label" style={{ marginBottom: "0.75rem" }}>Nội dung chi (VD: Ăn uống, trò chơi...)</label>
                    <input className="form-input" required value={expenseForm.name} onChange={e => setExpenseForm({...expenseForm, name: e.target.value})} placeholder="Nhập nội dung..." />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ marginBottom: "0.75rem" }}>Thành tiền (VNĐ)</label>
                    <input className="form-input" type="number" required value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})} placeholder="100000" />
                  </div>
                </div>
                
                <div className="form-group mt-2">
                  <div className="flex justify-between items-center mb-4">
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
                  <button type="submit" disabled={submitting || selectedParticipants.length===0} className="btn btn-primary" style={{ width: "auto" }}>
                    {submitting ? "Đang lưu..." : "Lưu khoản chi"}
                  </button>
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
                  <div className="flex justify-between items-center mb-2 flex-wrap gap-2">
                    <h4 style={{ margin: 0, wordBreak: "break-word", flex: "1 1 auto", minWidth: "120px" }}>{exp.name}</h4>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <strong style={{ color: "var(--primary)" }}>{formatVND(exp.amount)}</strong>
                      <button onClick={() => handleDeleteExpense(exp.id)} style={{ color: "var(--danger)", padding: "0.25rem" }}>🗑️</button>
                    </div>
                  </div>
                  <div className="flex gap-2" style={{ paddingBottom: "0.25rem", flexWrap: "wrap" }}>
                    {exp.participants.map((p: any) => (
                      <span key={p.id} className="badge" style={{ fontSize: "0.75rem", whiteSpace: "nowrap", flexShrink: 0, padding: "0.3rem 0.75rem" }}>
                        {p.member?.avatar} <span style={{ marginLeft: "0.25rem" }}>{p.member?.name}</span>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cột phải: Kết quả chia tiền */}
        <div className="flex-1" style={{ position: "sticky", top: "2rem", width: "100%", maxWidth: "450px", minWidth: "350px" }}>
          <div className="card" style={{ padding: "2rem" }}>
            <h3 className="mb-4" style={{ textAlign: "center", borderBottom: "1px solid var(--border)", paddingBottom: "1rem" }}>💰 TỔNG KẾT</h3>
            
            <h4 style={{ color: "#94a3b8", fontSize: "0.875rem", textTransform: "uppercase" }}>Theo Nhóm / Gia đình</h4>
            <div className="mb-4">
              {Object.values(calculateResult.byGroup).sort((a: any, b: any) => b.total - a.total).map((g: any, idx) => (
                <div key={idx} className="flex justify-between items-start mb-2 flex-wrap gap-x-4 p-2 rounded hover:bg-white/5 transition-colors group relative">
                   <label className="flex items-center gap-2 flex-1 min-width-[120px] cursor-pointer">
                     <input 
                       type="checkbox" 
                       disabled={settlingId === g.groupId}
                       checked={g.isSettled} 
                       onChange={(e) => handleToggleSettlement({ groupId: g.groupId, isSettled: e.target.checked })}
                       style={{ width: "1.1rem", height: "1.1rem" }}
                     />
                     <strong style={{ opacity: g.isSettled ? 0.5 : 1 }}>{g.groupName}</strong>
                     {settlingId === g.groupId && <span className="animate-spin" style={{ fontSize: "0.7rem" }}>⌛</span>}
                   </label>
                   <div className="flex flex-col items-end">
                     <span style={{ 
                       fontWeight: "700", 
                       color: g.isSettled ? "#94a3b8" : g.total > 0 ? "var(--warning)" : g.total < 0 ? "var(--success)" : "inherit",
                       whiteSpace: "nowrap",
                       textDecoration: g.isSettled ? "line-through" : "none"
                     }}>
                       {g.total > 0 ? `+ ${formatVND(g.total)}` : g.total < 0 ? `- ${formatVND(Math.abs(g.total))}` : formatVND(0)}
                     </span>
                     <span style={{ fontSize: "0.65rem", opacity: 0.8 }}>
                       {g.isSettled ? "Xong" : g.total > 0 ? "Cần đóng" : g.total < 0 ? "Dư" : "Xong"}
                     </span>
                   </div>
                </div>
              ))}
              {Object.values(calculateResult.byGroup).length === 0 && (
                <p style={{ fontSize: "0.875rem" }}>Chưa có phát sinh</p>
              )}
            </div>

            <h4 style={{ color: "#94a3b8", fontSize: "0.875rem", textTransform: "uppercase" }}>Theo Cá nhân</h4>
            <div>
              {Object.values(calculateResult.byMember).sort((a: any, b: any) => b.total - a.total).map((m: any, idx) => (
                <div key={idx} className="flex justify-between items-center mb-2 p-2 rounded hover:bg-white/5 transition-colors" style={{ background: m.isSettled ? "transparent" : "rgba(255,255,255,0.02)" }}>
                  <label className="flex items-center gap-2 cursor-pointer flex-1">
                    <input 
                       type="checkbox" 
                       disabled={settlingId === m.member.id}
                       checked={m.isSettled} 
                       onChange={(e) => handleToggleSettlement({ memberId: m.member.id, isSettled: e.target.checked })}
                       style={{ width: "1rem", height: "1rem" }}
                     />
                    <span>{m.member.avatar}</span>
                    <div className="flex flex-col">
                      <span style={{ opacity: m.isSettled ? 0.5 : 1 }}>{m.member.name}</span>
                      {m.paidBefore > 0 && (
                        <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>Đã ứng: {formatVND(m.paidBefore)}</span>
                      )}
                    </div>
                    {settlingId === m.member.id && <span className="animate-spin" style={{ fontSize: "0.7rem" }}>⌛</span>}
                  </label>
                  <div className="flex flex-col items-end">
                    <span style={{ 
                      fontFamily: "monospace", 
                      fontSize: "0.875rem", 
                      fontWeight: "700",
                      color: m.isSettled ? "#94a3b8" : m.total > 0 ? "var(--warning)" : m.total < 0 ? "var(--success)" : "inherit",
                      textDecoration: m.isSettled ? "line-through" : "none"
                    }}>
                      {m.total > 0 ? `+ ${formatVND(m.total)}` : m.total < 0 ? `- ${formatVND(Math.abs(m.total))}` : formatVND(0)}
                    </span>
                    <span style={{ fontSize: "0.65rem", opacity: 0.8 }}>
                      {m.isSettled ? "Đã xong" : m.total > 0 ? "Cần đóng thêm" : m.total < 0 ? "Tiền thừa" : "Đã xong"}
                    </span>
                  </div>
                </div>
              ))}
              {Object.values(calculateResult.byMember).length === 0 && (
                <p style={{ fontSize: "0.875rem" }}>Chưa có phát sinh</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
