import React, { useEffect, useMemo, useState } from "react";
import { Check, Database, Pencil, Plus, RefreshCw, ShieldCheck, Trash2, X } from "lucide-react";
import { SectionTotalsBar } from "../utils/AdminHelpers";

const SKIP_EDIT_COLS = new Set(["id", "created_at", "updated_at", "password_hash", "passport_hash", "passport_ciphertext"]);

export default function AdminDatabaseSection({ showToast, onSessionExpired, onOverviewRefresh }) {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [dbData, setDbData] = useState({
    dbPath: "backend/data/auth.sqlite",
    integrityStatus: "ok",
    dbSizeKb: 0,
    totalRows: 0,
    tables: []
  });
  const [selectedTableName, setSelectedTableName] = useState("accounts");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createDraft, setCreateDraft] = useState({});
  const [editingRow, setEditingRow] = useState(null);
  const [editDraft, setEditDraft] = useState({});

  const loadDatabase = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/database", { credentials: "include" });
      if (response.status === 401 && onSessionExpired) {
        onSessionExpired();
        return;
      }
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Ma’lumotlar bazasini yuklab bo‘lmadi.");
      setDbData(data);
      if (data.tables?.length > 0 && !data.tables.some((t) => t.name === selectedTableName)) {
        setSelectedTableName(data.tables[0].name);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDatabase();
  }, []);

  const activeTable = useMemo(
    () => (dbData.tables || []).find((t) => t.name === selectedTableName) || dbData.tables?.[0] || null,
    [dbData.tables, selectedTableName]
  );

  const editableColumns = useMemo(() => {
    if (!activeTable) return [];
    return (activeTable.columns || []).filter((c) => !SKIP_EDIT_COLS.has(c.name));
  }, [activeTable]);

  const filteredRows = useMemo(() => {
    if (!activeTable) return [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return activeTable.rows || [];
    return (activeTable.rows || []).filter((row) =>
      Object.values(row).some((val) => String(val ?? "").toLowerCase().includes(q))
    );
  }, [activeTable, searchQuery]);

  const runDbAction = async ({ url, method = "POST", body, busyKey, successMsg }) => {
    setBusy(busyKey);
    try {
      const response = await fetch(url, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        credentials: "include",
        body: body ? JSON.stringify(body) : undefined
      });
      if (response.status === 401 && onSessionExpired) {
        onSessionExpired();
        return null;
      }
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Baza amalini bajarib bo‘lmadi.");
      if (Array.isArray(data.tables)) setDbData(data);
      if (showToast && (successMsg || data.message)) showToast(successMsg || data.message);
      if (onOverviewRefresh) onOverviewRefresh();
      return data;
    } catch (err) {
      if (showToast) showToast(err.message);
      return null;
    } finally {
      setBusy("");
    }
  };

  const openEditRow = (row) => {
    const draft = {};
    editableColumns.forEach((col) => {
      draft[col.name] = row[col.name] ?? "";
    });
    setEditDraft(draft);
    setEditingRow(row);
  };

  return (
    <>
      <SectionTotalsBar
        items={[
          { label: "SQLite jadvallar", value: `${(dbData.tables || []).length} ta`, tone: "is-blue", sub: dbData.dbPath },
          { label: "Jami yozuvlar", value: `${dbData.totalRows || 0} ta`, tone: "is-green", sub: "Barcha bo‘limlar bo‘yicha" },
          { label: "Baza hajmi", value: `${dbData.dbSizeKb || 0} KB`, sub: "WAL rejimida faol" },
          {
            label: "Baza butunligi",
            value: String(dbData.integrityStatus || "ok").toUpperCase(),
            tone: dbData.integrityStatus === "ok" ? "is-green" : "is-red",
            sub: "PRAGMA integrity_check"
          }
        ]}
      />

      {error && <div className="auth-error-alert" role="alert">{error}</div>}

      <div className="admin-filter-toolbar">
        <div className="admin-filter-pills" style={{ flexWrap: "wrap" }}>
          {(dbData.tables || []).map((t) => (
            <button
              key={t.name}
              type="button"
              className={`compare-tab-btn ${activeTable?.name === t.name ? "active" : ""}`}
              onClick={() => {
                setSelectedTableName(t.name);
                setShowCreateForm(false);
                setEditingRow(null);
                setCreateDraft({});
              }}
            >
              {t.name} ({t.rowCount})
            </button>
          ))}
        </div>

        <div className="admin-search-controls">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={busy === "db-sync"}
            onClick={() =>
              runDbAction({
                url: "/api/admin/database/sync",
                method: "POST",
                busyKey: "db-sync"
              })
            }
          >
            <ShieldCheck size={14} /> {busy === "db-sync" ? "Tekshirilmoqda..." : "Bazani tekshirish & Sinxronlash"}
          </button>
          <button type="button" className="btn btn-outline btn-sm" onClick={loadDatabase} disabled={loading}>
            <RefreshCw size={14} /> {loading ? "Yuklanmoqda..." : "Yangilash"}
          </button>
        </div>
      </div>

      {activeTable && (
        <section className="admin-panel-card">
          <div className="admin-panel-card-head">
            <div>
              <h2>
                <Database size={18} /> {activeTable.name} ({activeTable.rowCount} ta qator)
              </h2>
              <small style={{ color: "var(--color-muted)", fontSize: 12.5 }}>
                Bog‘lanish: {activeTable.relation}
              </small>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Jadval ichidan qidirish..."
                style={{ padding: "7px 12px", borderRadius: 10, border: "1.5px solid #d5e5fc", fontSize: 13 }}
              />
              {!activeTable.readonly && activeTable.name !== "homepage_settings" && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    setShowCreateForm((v) => !v);
                    setCreateDraft({});
                  }}
                >
                  <Plus size={14} /> {showCreateForm ? "Yopish" : "Yangi qator qo‘shish"}
                </button>
              )}
            </div>
          </div>

          <div className="admin-db-schema-strip">
            {(activeTable.columns || []).map((col) => (
              <span key={col.name} className="admin-db-col-chip">
                <b>{col.name}</b>
                <small>{col.type || "TEXT"}{col.pk ? " • PK" : ""}{col.notnull ? " • *" : ""}</small>
              </span>
            ))}
          </div>

          {showCreateForm && !activeTable.readonly && (
            <form
              className="admin-modal-form"
              style={{ background: "#f7faff", padding: 14, borderRadius: 12, border: "1px solid #d5e5fc", marginBottom: 14 }}
              onSubmit={async (e) => {
                e.preventDefault();
                const ok = await runDbAction({
                  url: `/api/admin/database/${activeTable.name}/rows`,
                  method: "POST",
                  body: createDraft,
                  busyKey: `create-row-${activeTable.name}`
                });
                if (ok) {
                  setCreateDraft({});
                  setShowCreateForm(false);
                }
              }}
            >
              {editableColumns.map((col) => (
                <label className="input-group" key={col.name}>
                  <span>
                    {col.name === "password_ciphertext" ? "Parol (kamida 6 belgi)" : col.name}
                    {col.notnull && col.dflt_value === null ? " *" : ""}
                  </span>
                  <input
                    placeholder={col.type || "Qiymat..."}
                    value={createDraft[col.name] ?? ""}
                    onChange={(e) => setCreateDraft((p) => ({ ...p, [col.name]: e.target.value }))}
                  />
                </label>
              ))}
              <div className="is-full" style={{ display: "flex", gap: 8 }}>
                <button type="submit" className="btn btn-primary btn-sm" disabled={busy === `create-row-${activeTable.name}`}>
                  <Plus size={14} /> Bazaga qo‘shish
                </button>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowCreateForm(false)}>
                  Bekor
                </button>
              </div>
            </form>
          )}

          {editingRow && (
            <div className="modal-backdrop" onClick={() => setEditingRow(null)}>
              <div className="modal-card admin-modal-card" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close-btn" onClick={() => setEditingRow(null)} aria-label="Yopish">
                  <X size={20} />
                </button>
                <h2 style={{ margin: "0 0 8px", color: "var(--blue-navy)" }}>
                  {activeTable.name} • #{editingRow.id} qatorni tahrirlash
                </h2>
                <form
                  className="admin-modal-form"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const ok = await runDbAction({
                      url: `/api/admin/database/${activeTable.name}/rows/${editingRow.id}`,
                      method: "PATCH",
                      body: editDraft,
                      busyKey: `edit-row-${editingRow.id}`
                    });
                    if (ok) setEditingRow(null);
                  }}
                >
                  {editableColumns.map((col) => (
                    <label className="input-group" key={col.name}>
                      <span>{col.name === "password_ciphertext" ? "Yangi parol (ixtiyoriy)" : col.name}</span>
                      <input
                        value={editDraft[col.name] ?? ""}
                        onChange={(e) => setEditDraft((p) => ({ ...p, [col.name]: e.target.value }))}
                      />
                    </label>
                  ))}
                  <button type="submit" className="btn btn-primary is-full" disabled={busy === `edit-row-${editingRow.id}`}>
                    <Check size={14} /> O‘zgarishlarni bazaga saqlash
                  </button>
                </form>
              </div>
            </div>
          )}

          {filteredRows.length === 0 ? (
            <div className="admin-dorm-empty">Ushbu jadvalda mos qatorlar yo‘q.</div>
          ) : (
            <div className="admin-db-table-wrap">
              <table className="admin-db-table">
                <thead>
                  <tr>
                    {(activeTable.columns || []).map((col) => (
                      <th key={col.name}>{col.name}</th>
                    ))}
                    {!activeTable.readonly && activeTable.hasId && <th>Amallar</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row, idx) => (
                    <tr key={row.id ?? idx}>
                      {(activeTable.columns || []).map((col) => {
                        const raw = row[col.name];
                        const display = raw === null || raw === undefined ? "—" : String(raw);
                        return (
                          <td key={col.name} title={display}>
                            {display.length > 65 ? `${display.slice(0, 65)}…` : display}
                          </td>
                        );
                      })}
                      {!activeTable.readonly && activeTable.hasId && (
                        <td>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => openEditRow(row)}
                              title="Tahrirlash"
                            >
                              <Pencil size={12} />
                            </button>
                            {activeTable.name !== "homepage_settings" && !(activeTable.name === "accounts" && row.role === "admin") && (
                              <button
                                type="button"
                                className="avatar-remove-btn"
                                title="O‘chirish"
                                disabled={busy === `del-row-${row.id}`}
                                onClick={() =>
                                  runDbAction({
                                    url: `/api/admin/database/${activeTable.name}/rows/${row.id}`,
                                    method: "DELETE",
                                    busyKey: `del-row-${row.id}`
                                  })
                                }
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </>
  );
}
