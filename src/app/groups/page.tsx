"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { GROUP_COLORS, GROUP_TYPES } from "@/lib/utils";

export default function GroupsPage() {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newGroup, setNewGroup] = useState({ name: "", type: "family", color: GROUP_COLORS[0] });

  const loadGroups = () => {
    fetch("/api/groups").then(r => r.json()).then(data => {
      setGroups(data);
      setLoading(false);
    });
  };

  useEffect(() => loadGroups(), []);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroup.name) return;
    await fetch("/api/groups", {
      method: "POST",
      body: JSON.stringify(newGroup),
    });
    setNewGroup({ name: "", type: "family", color: GROUP_COLORS[0] });
    loadGroups();
  };

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <h2>Quản lý Nhóm & Tham dự</h2>
        <Link href="/" className="btn btn-outline" style={{ width: "auto" }}>
          ← Quay lại
        </Link>
      </div>

      <div className="card mb-8">
        <h3>✨ Thêm nhóm mới</h3>
        <form onSubmit={handleCreateGroup} className="flex gap-4 items-end mt-4">
          <div className="form-group mb-0" style={{ flex: 1 }}>
            <label className="form-label">Tên nhóm</label>
            <input 
              className="form-input" 
              placeholder="VD: Gia đình Việt"
              value={newGroup.name}
              onChange={e => setNewGroup({...newGroup, name: e.target.value})}
            />
          </div>
          <div className="form-group mb-0">
            <label className="form-label">Phân loại</label>
            <select 
              className="form-input"
              value={newGroup.type}
              onChange={e => setNewGroup({...newGroup, type: e.target.value})}
            >
              {GROUP_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.emoji} {t.label}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: "auto" }}>
            Tạo nhóm
          </button>
        </form>
      </div>

      <div className="flex-col gap-4">
        {loading ? <p>Đang tải...</p> : groups.map(group => (
          <div key={group.id} className="card" style={{ borderLeft: `4px solid ${group.color}` }}>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <span style={{ fontSize: "1.5rem" }}>
                  {GROUP_TYPES.find(t => t.value === group.type)?.emoji}
                </span>
                <h3>{group.name}</h3>
                <span className="badge">{group.members?.length || 0} thành viên</span>
              </div>
              <Link href={`/groups/${group.id}`} className="btn btn-outline" style={{ width: "auto", fontSize: "0.875rem", padding: "0.25rem 0.75rem" }}>
                Chi tiết →
              </Link>
            </div>
            {/* Hiển thị avatar các member */}
            <div className="flex gap-2">
              {group.members?.length === 0 ? (
                <span style={{ fontSize: "0.875rem", color: "#64748b" }}>Chưa có thành viên nào. Bấm chi tiết để thêm!</span>
              ) : (
                group.members?.map((m: any) => (
                  <div key={m.id} className="badge" style={{ background: "var(--input)", padding: "0.5rem 1rem", border: "1px solid var(--border)" }}>
                    {m.avatar || "👤"} {m.name}
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
