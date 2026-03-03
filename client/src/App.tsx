import { useEffect } from "react";
import { RequestPanel } from "@/components/RequestPanel";
import { ResponsePanel } from "@/components/ResponsePanel";
import { Sidebar } from "@/components/Sidebar";
import { ResizableSidebar } from "@/components/ResizableSidebar";
import { useAppStore } from "@/store/useAppStore";
import { loadAppData } from "@/lib/persistence";
import "./App.css";

function App() {
  const setStateFromPersisted = useAppStore((s) => s.setStateFromPersisted);

  useEffect(() => {
    loadAppData().then(setStateFromPersisted);
  }, [setStateFromPersisted]);

  return (
    <>
      <header className="app-header">
        Five Dollar Post <span>— Cliente HTTP desktop</span>
      </header>
      <div className="app-layout">
        <ResizableSidebar className="sidebar">
          <Sidebar />
        </ResizableSidebar>
        <div className="app-main-area">
          <RequestPanel />
          <ResponsePanel />
        </div>
      </div>
    </>
  );
}

export default App;
