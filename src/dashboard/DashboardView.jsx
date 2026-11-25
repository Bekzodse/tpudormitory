import React from "react";
import DashboardKpiGrid from "./DashboardKpiGrid";
import DashboardFloorMap from "./DashboardFloorMap";
import DashboardTaskPanels from "./DashboardTaskPanels";

export default function DashboardView({
  overview,
  totals,
  roomsByFloor,
  onInspectRoom,
  onNavigate,
  busyId,
  runAdminRequest
}) {
  return (
    <>
      <DashboardKpiGrid overview={overview} totals={totals} />
      <DashboardFloorMap roomsByFloor={roomsByFloor} onInspectRoom={onInspectRoom} />
      <DashboardTaskPanels
        overview={overview}
        totals={totals}
        onNavigate={onNavigate}
        busyId={busyId}
        runAdminRequest={runAdminRequest}
      />
    </>
  );
}
