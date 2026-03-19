import { useState, useEffect } from "react";
import cropAppIcon from "../../crop-app-icon.png";
import { useAppStore } from "@/store/useAppStore";
import { useT } from "@/lib/i18n";
import { Collection } from "@/types";
import { generateId } from "@/lib/id";
import { isTauri, checkForUpdate, getAppVersion } from "@/lib/updater";
import { useKeyDown } from "@/lib/useKeyDown";
import { preventRightClickSelect, preventContextMenu } from "@/lib/utils";

export function Main() {
  const { t } = useT();
  const [version, setVersion] = useState("");
  const [newUpdateAvailable, setNewUpdateAvailable] = useState<string | null>(null);
  const { addCollection, openNewTempRequest } = useAppStore();

  useEffect(() => {
    getAppVersion().then(setVersion);

    if (isTauri()) {
      checkForUpdate()
        .then((updateStatus) => {
          if (updateStatus?.status === "available") {
            setNewUpdateAvailable(updateStatus?.version ?? "");
          }
        })
        .catch(() => {
          // Erro já convertido em UpdateStatus em updater.ts; fallback silencioso se algo escapar
        });
    }
  }, []);

  useKeyDown(["n"], (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      openNewTempRequest();
    }
  });

  useKeyDown(["j"], (e) => {
    if ((e.ctrlKey || e.metaKey) && (e.key === "j")) {
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
      name: t("sidebar.newCollection"),
      items: [],
    };
    addCollection(newCollection);
  }

  const handleSetSearchFocus = () => {
    (document.querySelector(".sidebar-search-input") as HTMLInputElement)?.focus();
  }


  return (
    <div className="app-empty-tabs" onMouseDown={preventRightClickSelect} onContextMenu={preventContextMenu}>
      <div style={{ paddingTop: "25vh" }}>
        <div>
          <img style={{ width: "12vh", borderRadius: "24px" }} src={cropAppIcon} alt="logo" />
          <p>{t("main.version")}: v{version}</p>
          {newUpdateAvailable && newUpdateAvailable !== "" &&
            <>
              <p>{t("main.newVersionAvailable", { version: newUpdateAvailable })}</p>
              <p>{t("main.goToSettingsUpdates")}</p>
            </>
          }
        </div>
        <div className="app-empty-actions">
          <button type="button" className="app-empty-action" onClick={() => {
            handleCreateCollection();
          }}>
            <span className="material-symbols-outlined app-empty-action-icon" aria-hidden>add</span>
            {t("main.createCollection")}
            <span style={{ opacity: 0.5, fontSize: "0.8em", marginLeft: "8px" }}>⌘J ·  Ctrl+J</span>
          </button>

          <button type="button" className="app-empty-action" onClick={() => {
            openNewTempRequest();
          }}>
            <span className="material-symbols-outlined app-empty-action-icon" aria-hidden>add</span>
            {t("main.createRequest")}
            <span style={{ opacity: 0.5, fontSize: "0.8em", marginLeft: "8px" }}>⌘N ·  Ctrl+N</span>
          </button>

          <button type="button" className="app-empty-action" onClick={() => {
            (document.querySelector(".sidebar-search-input") as HTMLInputElement)?.focus();
          }}>
            <span className="material-symbols-outlined app-empty-action-icon" aria-hidden>search</span>
            {t("main.searchRequests")}
            <span style={{ opacity: 0.5, fontSize: "0.8em", marginLeft: "8px" }}>⌘+K ·  Ctrl+K</span>
          </button>

        </div>
      </div>

    </div>
  )
}