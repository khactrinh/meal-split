"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GROUP_TYPES } from "@/lib/utils";

export default function NewSessionPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/groups").then(r => r.json()).then(setGroups);
  }, []);

  const toggleGroup = (groupId: string) => {
    if (selectedGroups.includes(groupId)) {
      setSelectedGroups(selectedGroups.filter(id => id !== groupId));
    } else {
      setSelectedGroups([...selectedGroups, groupId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || selectedGroups.length === 0) {
      alert("Vui lòng nhập tên buổi tiệc và chọn ít nhất 1 nhóm/người tham dự!");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/sessions", {
      method: "POST",
      body: JSON.stringify({ ...formData, groupIds: selectedGroups }),
    });

    if (res.ok) {
      const data = await res.json();
      router.push(`/sessions/${data.id}`);
    } else {
      alert("Có lỗi xảy ra, vui lòng thử lại.");
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-8 flex-mobile-col">
        <h2>🎉 Tạo phiên bàn tiệc mới</h2>
        <Link href="/" className="btn btn-outline" style={{ width: "auto" }}>
          Hủy bỏ
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="flex-col gap-4">
        <div className="card mb-4">
          <div className="form-group">
            <label className="form-label">Tên buổi tiệc / Ăn uống</label>
            <input 
              className="form-input" 
              placeholder="VD: Nhậu cuối tuần, Lẩu thái trưa T7..." 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              autoFocus
              required
            />
          </div>
          <div className="form-group mb-0">
            <label className="form-label">Ghi chú (Tùy chọn)</label>
            <input 
              className="form-input" 
              placeholder="Ghi chú thêm cho địa điểm hoặc nội dung..." 
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>
        </div>

        <div className="card mb-8">
          <h3>👨‍👩‍👧 Ai sẽ tham dự? (Chọn nhóm)</h3>
          <p>Chọn các nhóm (gia đình, cặp đôi, bạn bè) đã có sẵn.</p>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "1rem", marginTop: "1rem" }}>
            {groups.length === 0 ? (
              <p style={{ gridColumn: "span 2", textAlign: "center", padding: "2rem" }}>
                Chưa có nhóm nào. Vui lòng <Link href="/groups" style={{ color: "var(--primary)" }}>tạo nhóm trước</Link>.
              </p>
            ) : groups.map(group => (
              <div 
                key={group.id} 
                onClick={() => toggleGroup(group.id)}
                className="card"
                style={{ 
                  margin: 0, 
                  cursor: "pointer", 
                  border: selectedGroups.includes(group.id) ? `2px solid var(--primary)` : "2px solid var(--border)",
                  background: selectedGroups.includes(group.id) ? "rgba(99, 102, 241, 0.1)" : "var(--card)",
                  padding: "1rem"
                }}
              >
                <div className="flex justify-between items-center mb-2">
                  <span style={{ fontSize: "1.5rem" }}>
                    {GROUP_TYPES.find(t => t.value === group.type)?.emoji}
                  </span>
                  <div style={{
                    width: "24px", height: "24px", borderRadius: "50%",
                    background: selectedGroups.includes(group.id) ? "var(--primary)" : "transparent",
                    border: "2px solid var(--primary)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "white"
                  }}>
                    {selectedGroups.includes(group.id) && "✓"}
                  </div>
                </div>
                <h4>{group.name}</h4>
                <p style={{ margin: 0, fontSize: "0.875rem" }}>{group.members?.length} thành viên</p>
              </div>
            ))}
          </div>
        </div>

        <button 
          type="submit" 
          className="btn btn-primary" 
          style={{ fontSize: "1.25rem", padding: "1rem", width: "100%" }}
          disabled={loading || selectedGroups.length === 0}
        >
          {loading ? "Đang xử lý..." : "Tiếp tục thêm hóa đơn →"}
        </button>
      </form>
    </div>
  );
}
