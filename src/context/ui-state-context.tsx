"use client";

import React, { createContext, useContext, useMemo, useState } from "react";

export type ViewMode = "table" | "compact";

type UIStateContextValue = {
  viewMode: ViewMode;
  setViewMode: (value: ViewMode) => void;
  highlightLeaders: boolean;
  setHighlightLeaders: (value: boolean) => void;
};

const UIStateContext = createContext<UIStateContextValue | undefined>(
  undefined,
);

export function UIStateProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [highlightLeaders, setHighlightLeaders] = useState(true);

  const value = useMemo(
    () => ({
      viewMode,
      setViewMode,
      highlightLeaders,
      setHighlightLeaders,
    }),
    [viewMode, highlightLeaders],
  );

  return (
    <UIStateContext.Provider value={value}>
      {children}
    </UIStateContext.Provider>
  );
}

export function useUIState() {
  const context = useContext(UIStateContext);
  if (!context) {
    throw new Error("useUIState must be used within UIStateProvider");
  }
  return context;
}

