import { useState, useEffect, useRef } from "react";
import type { Environment } from "@/types";
import { useAppStore } from "@/store/useAppStore";

/** Primeira opção = sem cor (""), depois paleta predefinida */
const ENV_COLORS = [
  "",
  "#f48771",
  "#4ec9b0",
  "#569cd6",
  "#dcdcaa",
  "#c586c0",
  "#4fc1ff",
];

interface EnvironmentEditorProps {
  env: Environment | null;
  onClose: () => void;
}

export function EnvironmentEditor({ env, onClose }: EnvironmentEditorProps) {
  const { updateEnvironment, removeEnvironment } = useAppStore();
  const [name, setName] = useState(env?.name ?? "");
  const [vars, setVars] = useState<Array<{ key: string; value: string }>>([]);
  const [visible, setVisible] = useState<Record<number, boolean>>({});
  const [selectedColor, setSelectedColor] = useState<string | undefined>(env?.color ?? "");
  const [customColors, setCustomColors] = useState<string[]>([]);
  const [showColorPickerPanel, setShowColorPickerPanel] = useState(false);
  const [pendingCustomColor, setPendingCustomColor] = useState("#4fc1ff");
  const colorInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (env) {
      setName(env.name);
      const color = env.color ?? "";
      setSelectedColor(color);
      if (color && !ENV_COLORS.includes(color)) {
        setCustomColors([color]);
      } else {
        setCustomColors([]);
      }
      setVars(
        Object.entries(env.variables).map(([key, value]) => ({ key, value }))
      );
      if (Object.keys(env.variables).length === 0) {
        setVars([{ key: "", value: "" }]);
      }
    }
  }, [env]);

  const updateVar = (index: number, field: "key" | "value", value: string) => {
    setVars((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addVar = () => {
    setVars((prev) => [...prev, { key: "", value: "" }]);
  };

  const removeVar = (index: number) => {
    setVars((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleVisible = (index: number) => {
    setVisible((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const save = () => {
    if (!env) return;
    const variables: Record<string, string> = {};
    vars.forEach(({ key, value }) => {
      const k = key.trim();
      if (k) variables[k] = value;
    });
    updateEnvironment(env.id, {
      name: name.trim() || env.name,
      variables,
      color: selectedColor && selectedColor.trim() ? selectedColor.trim() : undefined,
    });
    onClose();
  };

  const handleAddColor = () => {
    const initial =
      selectedColor && selectedColor.startsWith("#") ? selectedColor : "#4fc1ff";
    setPendingCustomColor(initial);
    setShowColorPickerPanel(true);
    setTimeout(() => colorInputRef.current?.click(), 0);
  };

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hex = e.target.value;
    if (showColorPickerPanel) {
      setPendingCustomColor(hex);
    } else {
      setSelectedColor(hex);
    }
  };

  const handleCustomColorOk = () => {
    setSelectedColor(pendingCustomColor);
    if (
      pendingCustomColor &&
      !ENV_COLORS.includes(pendingCustomColor) &&
      !customColors.includes(pendingCustomColor)
    ) {
      setCustomColors((prev) => [...prev, pendingCustomColor]);
    }
    setShowColorPickerPanel(false);
  };

  const handleCustomColorCancel = () => {
    setShowColorPickerPanel(false);
  };

  if (!env) return null;

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal-content env-editor-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="env-editor-title"
      >
        <div className="modal-header">
          <h2 id="env-editor-title" className="modal-title">
            {env.name}
          </h2>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <div className="env-editor-name">
            <label htmlFor="env-name">Nome do ambiente</label>
            <input
              id="env-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex: 3_production"
            />
          </div>
          <div className="env-editor-color">
            <span className="env-editor-color-label">Cor do ambiente</span>
            <div className="env-editor-color-swatches" role="group" aria-label="Selecionar cor">
              {ENV_COLORS.map((hex) => (
                <button
                  key={hex || "none"}
                  type="button"
                  className={`env-swatch ${!hex ? "env-swatch--none" : ""} ${selectedColor === hex ? "env-swatch--selected" : ""}`}
                  style={hex ? { background: hex } : undefined}
                  onClick={() => setSelectedColor(hex)}
                  title={hex ? hex : "Sem cor"}
                  aria-pressed={selectedColor === hex}
                  aria-label={hex ? `Cor ${hex}` : "Sem cor"}
                >
                  {selectedColor === hex && hex && <span className="env-swatch-check" aria-hidden>✓</span>}
                </button>
              ))}
              {customColors.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  className={`env-swatch ${selectedColor === hex ? "env-swatch--selected" : ""}`}
                  style={{ background: hex }}
                  onClick={() => setSelectedColor(hex)}
                  title={hex}
                  aria-pressed={selectedColor === hex}
                  aria-label={`Cor personalizada ${hex}`}
                >
                  {selectedColor === hex && <span className="env-swatch-check" aria-hidden>✓</span>}
                </button>
              ))}
              <button
                type="button"
                className="env-swatch env-swatch-add"
                onClick={handleAddColor}
                title="Adicionar cor"
                aria-label="Adicionar cor personalizada"
              >
                +
              </button>
            </div>
            {showColorPickerPanel && (
              <div className="env-editor-color-panel">
                <span className="env-editor-color-panel-label">Cor personalizada</span>
                <div className="env-editor-color-panel-row">
                  <div
                    className="env-editor-color-preview"
                    style={{ background: pendingCustomColor }}
                    onClick={() => colorInputRef.current?.click()}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && colorInputRef.current?.click()}
                    title="Clique para abrir o seletor"
                  />
                  <input
                    ref={colorInputRef}
                    type="color"
                    className="env-editor-color-input"
                    value={pendingCustomColor}
                    onChange={handleCustomColorChange}
                    aria-label="Selecionar cor"
                  />
                  <div className="env-editor-color-panel-buttons">
                    <button
                      type="button"
                      className="btn-secondary env-panel-btn"
                      onClick={handleCustomColorCancel}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      className="btn-primary env-panel-btn"
                      onClick={handleCustomColorOk}
                    >
                      OK
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="env-editor-table-wrap">
            <table className="env-editor-table">
              <thead>
                <tr>
                  <th>Variável</th>
                  <th>Valor</th>
                  <th aria-label="Visibilidade" />
                </tr>
              </thead>
              <tbody>
                {vars.map((row, index) => (
                  <tr key={index}>
                    <td>
                      <input
                        type="text"
                        value={row.key}
                        onChange={(e) => updateVar(index, "key", e.target.value)}
                        placeholder="ex: baseUrl"
                      />
                    </td>
                    <td>
                      <input
                        type={visible[index] ? "text" : "password"}
                        value={row.value}
                        onChange={(e) => updateVar(index, "value", e.target.value)}
                        placeholder="valor"
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="env-eye-btn"
                        onClick={() => toggleVisible(index)}
                        title={visible[index] ? "Ocultar" : "Mostrar"}
                        aria-label={visible[index] ? "Ocultar valor" : "Mostrar valor"}
                      >
                        <span className="eye-icon" aria-hidden>
                          {visible[index] ? "Ocultar" : "Ver"}
                        </span>
                      </button>
                      <button
                        type="button"
                        className="env-remove-var-btn"
                        onClick={() => removeVar(index)}
                        title="Remover"
                      >
                        −
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button type="button" className="env-add-var-btn" onClick={addVar}>
            + Adicionar variável
          </button>
        </div>
        <div className="modal-footer">
          <button
            type="button"
            className="btn-danger"
            onClick={() => {
              removeEnvironment(env.id);
              onClose();
            }}
            title="Remover este ambiente"
          >
            Remover ambiente
          </button>
          <div className="modal-footer-right">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="button" className="btn-primary" onClick={save}>
              Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export { ENV_COLORS };
