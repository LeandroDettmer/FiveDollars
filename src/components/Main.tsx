import { useState, useEffect } from "react";
import cropAppIcon from "../../crop-app-icon.png";
import { useAppStore } from "@/store/useAppStore";
import { Collection } from "@/types";
import { generateId } from "@/lib/id";
import { isTauri, checkForUpdate, getAppVersion } from "@/lib/updater";

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
            const newCollection: Collection = {
              id: generateId(),
              name: "Nova collection",
              items: [],
            };
            addCollection(newCollection);
          }}>
            <span className="material-symbols-outlined app-empty-action-icon" aria-hidden>add</span>
            Criar nova collection
          </button>

          <button type="button" className="app-empty-action" onClick={() => {
            openNewTempRequest();
          }}>
            <span className="material-symbols-outlined app-empty-action-icon" aria-hidden>add</span>
            Criar nova rota
          </button>

          <button type="button" className="app-empty-action" onClick={() => {
            (document.querySelector(".sidebar-search-input") as HTMLInputElement)?.focus();
          }}>
            <span className="material-symbols-outlined app-empty-action-icon" aria-hidden>search</span>
            Buscar rotas...
          </button>

        </div>
      </div>

    </div>
  )
}