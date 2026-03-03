import { RequestPanel } from "@/components/RequestPanel";
import { ResponsePanel } from "@/components/ResponsePanel";
import { Sidebar } from "@/components/Sidebar";
import "./App.css";

function App() {
  return (
    <>
      <header className="app-header">
        Five Dollar Post <span>— Cliente HTTP desktop</span>
      </header>
      <div className="app-layout">
        <Sidebar />
        <RequestPanel />
        <ResponsePanel />
      </div>
    </>
  );
}

export default App;
