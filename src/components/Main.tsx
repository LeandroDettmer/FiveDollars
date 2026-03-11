import { useState, useEffect } from "react";
import cropAppIcon from "../../crop-app-icon.png";
import { useAppStore } from "@/store/useAppStore";
import { Collection } from "@/types";
import { generateId } from "@/lib/id";
import { isTauri, checkForUpdate, getAppVersion } from "@/lib/updater";
import { useKeyDown } from "@/lib/useKeyDown";

export function Main() {
  const [version, setVersion] = useState("");
  const [newUpdateAvailable, setNewUpdateAvailable] = useState<string | null>(null);
  const { addCollection, openNewTempRequest } = useAppStore();

  useEffect(() => {
    getAppVersion().then(setVersion);

    if (isTauri()) {
      checkForUpdate().then((updateStatus) => {
        if (updateStatus?.status === "available") {
          setNewUpdateAvailable(updateStatus?.version ?? "");
        }
      });
    }
  }, []);

  useKeyDown(["n"], (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      openNewTempRequest();
    }
  });

  useKeyDown(["c"], (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      handleCreateCollection();
    }
  });

  useKeyDown(["k"], (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      handleSetSearchFocus();
    }
  });

  const handleCreateCollection = () => {
    const newCollection: Collection = {
      id: generateId(),
      name: "Nova collection",
      items: [],
    };
    addCollection(newCollection);
  }

  const handleSetSearchFocus = () => {
    (document.querySelector(".sidebar-search-input") as HTMLInputElement)?.focus();
  }


  return (
    <div className="app-empty-tabs">
      <div style={{ paddingTop: "25vh" }}>
        <div>
          <img style={{ width: "12vh", borderRadius: "24px" }} src={cropAppIcon} alt="logo" />
          <p>Versão: v{version}</p>
          {newUpdateAvailable && newUpdateAvailable !== "" &&
            <>
              <p>Nova versão disponível: {newUpdateAvailable}</p>
              <p>Acesse Configurações/Atualizações para atualizar</p>
            </>
          }
        </div>
        <div className="app-empty-actions">
          <button type="button" className="app-empty-action" onClick={() => {
            handleCreateCollection();
          }}>
            <span className="material-symbols-outlined app-empty-action-icon" aria-hidden>add</span>
            Criar nova collection
            <span style={{ opacity: 0.5, fontSize: "0.8em", marginLeft: "8px" }}>⌘C ·  Ctrl+C</span>
          </button>

          <button type="button" className="app-empty-action" onClick={() => {
            openNewTempRequest();
          }}>
            <span className="material-symbols-outlined app-empty-action-icon" aria-hidden>add</span>
            Criar nova rota
            <span style={{ opacity: 0.5, fontSize: "0.8em", marginLeft: "8px" }}>⌘N ·  Ctrl+N</span>
          </button>

          <button type="button" className="app-empty-action" onClick={() => {
            (document.querySelector(".sidebar-search-input") as HTMLInputElement)?.focus();
          }}>
            <span className="material-symbols-outlined app-empty-action-icon" aria-hidden>search</span>
            Buscar rotas...
            <span style={{ opacity: 0.5, fontSize: "0.8em", marginLeft: "8px" }}>⌘+K ·  Ctrl+K</span>
          </button>

        </div>
      </div>

    </div>
  )
}