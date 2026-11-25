import React from "react";
import { formatUzs } from "../admin-panel/utils/AdminHelpers";

export default function DashboardKpiGrid({ overview, totals }) {
  return (
    <div className="admin-kpi-grid">
      <div className="admin-kpi-card">
        <small>Jami xonalar fondi</small>
        <strong>{totals.totalRooms} ta xona</strong>
        <span>{totals.totalSpots} o‘rin • {overview.dormRooms.length} ta raqamlangan xona</span>
      </div>
      <div className="admin-kpi-card is-green">
        <small>Bo‘sh joylar soni</small>
        <strong>{totals.availableSpots} ta joy</strong>
        <span>Band qilingan: {totals.occupiedSpots} ta ({totals.occPct}%)</span>
      </div>
      <div className="admin-kpi-card is-blue">
        <small>Oylik yig‘ilgan tushum</small>
        <strong>{formatUzs(totals.collectedRevenue)}</strong>
        <span>To‘langan: {totals.paidCount}/{overview.residents.length} talaba</span>
      </div>
      <div className="admin-kpi-card">
        <small>E’tibor talab qiladi</small>
        <strong>{totals.pendingBookings + totals.openMaintCount} ta vazifa</strong>
        <span>{totals.pendingBookings} ta yangi ariza • {totals.openMaintCount} ta texnik ish</span>
      </div>
    </div>
  );
}
