import { useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { ResizableSidebar } from "@/components/ResizableSidebar";
import { ResizableMainArea } from "@/components/ResizableMainArea";
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
        FiveDollars <span>— Cliente HTTP desktop</span>
      </header>
      <div className="app-layout">
        <ResizableSidebar className="sidebar">
          <Sidebar />
        </ResizableSidebar>
        <ResizableMainArea />
      </div>
    </>
  );
}

export default App;
