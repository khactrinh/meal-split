"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { use } from "react";

export default function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [group, setGroup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newMember, setNewMember] = useState({ name: "", avatar: "👨" });
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState("");

  const loadGroup = () => {
    fetch(`/api/groups/${id}`).then(r => r.json()).then(data => {
      setGroup(data);
      setEditNameValue(data.name);
      setLoading(false);
    });
  };

  useEffect(() => loadGroup(), [id]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.name) return;
    await fetch("/api/members", {
      method: "POST",
      body: JSON.stringify({ ...newMember, groupId: id }),
    });
    setNewMember({ name: "", avatar: "👨" });
    loadGroup();
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Bạn chắc chắn muốn xóa thành viên này?")) return;
    await fetch(`/api/members/${memberId}`, { method: "DELETE" });
    loadGroup();
  };

  const handleUpdateGroup = async () => {
    if (!editNameValue.trim()) return;
    await fetch(`/api/groups/${id}`, {
      method: "PUT",
      body: JSON.stringify({ name: editNameValue, type: group.type, color: group.color }),
    });
    setIsEditingName(false);
    loadGroup();
  };

  const handleDeleteGroup = async () => {
    if (!confirm("Xóa toàn bộ nhóm và thành viên?")) return;
    await fetch(`/api/groups/${id}`, { method: "DELETE" });
    window.location.href = "/groups";
  };

  if (loading) return <div>Đang tải...</div>;
  if (!group) return <div>Không tìm thấy nhóm</div>;

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        {isEditingName ? (
          <div className="flex items-center gap-2" style={{ flexWrap: "wrap", flex: 1 }}>
            <h2 style={{ margin: 0 }}>👥 Quản lý:</h2>
            <input 
              className="form-input" 
              value={editNameValue} 
              onChange={e => setEditNameValue(e.target.value)}
              style={{ padding: "0.25rem 0.5rem", width: "100%", maxWidth: "200px", fontSize: "1rem", fontWeight: "600" }}
              autoFocus
            />
            <button onClick={handleUpdateGroup} className="btn btn-primary" style={{ padding: "0.25rem 0.75rem", borderRadius: "var(--radius)", width: "auto" }}>Lưu</button>
            <button onClick={() => { setIsEditingName(false); setEditNameValue(group.name); }} className="btn btn-outline" style={{ padding: "0.25rem 0.75rem", borderRadius: "var(--radius)", width: "auto", color: "var(--foreground)" }}>Hủy</button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <h2 style={{ margin: 0 }}>👥 Quản lý: {group.name}</h2>
            <button onClick={() => setIsEditingName(true)} style={{ color: "var(--primary)", background: "none", border: "none", cursor: "pointer", fontSize: "1.25rem" }}>
              ✏️
            </button>
          </div>
        )}
        <Link href="/groups" className="btn btn-outline" style={{ width: "auto" }}>
          ← Trở về
        </Link>
      </div>

      <div className="card mb-8">
        <h3>+ Thêm thành viên</h3>
        <form onSubmit={handleAddMember} className="flex gap-4 items-end mt-4">
          <div className="form-group mb-0" style={{ flex: 1 }}>
            <label className="form-label">Tên</label>
            <input 
              className="form-input" 
              placeholder="VD: Nguyễn Văn A"
              value={newMember.name}
              onChange={e => setNewMember({...newMember, name: e.target.value})}
            />
          </div>
          <div className="form-group mb-0">
            <label className="form-label">Emoji / Avatar</label>
            <input 
              className="form-input" 
              value={newMember.avatar}
              onChange={e => setNewMember({...newMember, avatar: e.target.value})}
              style={{ width: "100px", textAlign: "center" }}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: "auto" }}>
            Thêm
          </button>
        </form>
      </div>

      <div className="flex-col gap-4">
        <h3>Danh sách {group.members?.length} thành viên</h3>
        {group.members?.length === 0 ? (
          <p>Nhóm này chưa có thành viên nào.</p>
        ) : (
          group.members?.map((m: any) => (
            <div key={m.id} className="card flex justify-between items-center" style={{ marginBottom: "0.5rem", padding: "1rem" }}>
              <div className="flex items-center gap-4">
                <span style={{ fontSize: "1.5rem" }}>{m.avatar}</span>
                <span style={{ fontWeight: "600" }}>{m.name}</span>
              </div>
              <button 
                onClick={() => handleRemoveMember(m.id)}
                className="btn btn-danger" 
                style={{ width: "auto", padding: "0.5rem", borderRadius: "8px" }}
              >
                Xóa
              </button>
            </div>
          ))
        )}
      </div>

      <div className="mt-8" style={{ textAlign: "right", borderTop: "1px solid var(--border)", paddingTop: "2rem" }}>
        <button onClick={handleDeleteGroup} className="btn btn-outline" style={{ color: "var(--danger)", padding: "0.5rem 1rem", borderRadius: "8px", border: "1px solid var(--danger)", width: "auto" }}>
          ⚠️ Xóa nhóm này
        </button>
      </div>
    </div>
  );
}
