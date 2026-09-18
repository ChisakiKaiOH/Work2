export default function Toolbar({
  fileName,
  loading,
  onOpenFile,
  panelOpen,
  onTogglePanel,
}) {
  return (
    <header className="toolbar">
      <div className="toolbar-title">
        <span className="toolbar-app-name">IFC Reader</span>
        {fileName && <span className="toolbar-file-name">{fileName}</span>}
      </div>
      <div className="toolbar-actions">
        <label className="toolbar-button">
          {loading ? "Caricamento…" : "Apri IFC"}
          <input
            type="file"
            accept=".ifc"
            hidden
            disabled={loading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onOpenFile(file);
              e.target.value = "";
            }}
          />
        </label>
        <button
          type="button"
          className="toolbar-button toolbar-button-secondary"
          onClick={onTogglePanel}
        >
          {panelOpen ? "Chiudi pannello" : "Struttura / Proprietà"}
        </button>
      </div>
    </header>
  );
}
