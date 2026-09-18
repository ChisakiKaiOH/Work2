import { useEffect, useRef, useState } from "react";
import Toolbar from "./components/Toolbar";
import SpatialTree from "./components/SpatialTree";
import PropertiesPanel from "./components/PropertiesPanel";
import {
  createViewer,
  loadIfc,
  pickAtPointer,
  selectItem,
  clearSelection,
  focusItem,
  getSpatialTree,
  resetModels,
  disposeViewer,
} from "./ifc/viewer";
import "./App.css";

const TAP_MAX_MOVEMENT = 8; // px
const TAP_MAX_DURATION = 500; // ms

export default function App() {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const pointerDownRef = useRef(null);
  const currentModelIdRef = useRef(null);

  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [tree, setTree] = useState(null);
  const [selection, setSelection] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("tree");

  useEffect(() => {
    let cancelled = false;
    let viewer = null;
    (async () => {
      const created = await createViewer(containerRef.current);
      if (cancelled) {
        disposeViewer(created);
        return;
      }
      viewer = created;
      viewerRef.current = created;
      setReady(true);
    })();
    return () => {
      cancelled = true;
      if (viewer) {
        disposeViewer(viewer);
        viewerRef.current = null;
      }
    };
  }, []);

  async function handleOpenFile(file) {
    const viewer = viewerRef.current;
    if (!viewer) return;
    setLoading(true);
    setError(null);
    setSelection(null);
    setTree(null);
    try {
      await resetModels(viewer);
      const buffer = await file.arrayBuffer();
      const model = await loadIfc(viewer, buffer, file.name);
      currentModelIdRef.current = model.modelId;
      const spatialTree = await getSpatialTree(viewer, model.modelId);
      setTree(spatialTree);
      setFileName(file.name);
      setPanelOpen(true);
      setActiveTab("tree");
    } catch (err) {
      console.error(err);
      setError(
        "Impossibile leggere il file IFC. Controlla che sia un file .ifc valido."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handlePick(modelId, localId) {
    const viewer = viewerRef.current;
    if (!viewer) return;
    const props = await selectItem(viewer, modelId, localId);
    setSelection(props);
    setActiveTab("properties");
    setPanelOpen(true);
  }

  async function handleTreeSelect(localId) {
    const viewer = viewerRef.current;
    const modelId = currentModelIdRef.current;
    if (!viewer || !modelId) return;
    await handlePick(modelId, localId);
    try {
      await focusItem(viewer, modelId, localId);
    } catch (err) {
      console.error("focusItem failed", err);
    }
  }

  function handlePointerDown(e) {
    pointerDownRef.current = {
      x: e.clientX,
      y: e.clientY,
      t: performance.now(),
    };
  }

  async function handlePointerUp(e) {
    const start = pointerDownRef.current;
    pointerDownRef.current = null;
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    const dist = Math.hypot(dx, dy);
    const duration = performance.now() - start.t;
    if (dist > TAP_MAX_MOVEMENT || duration > TAP_MAX_DURATION) return;

    const viewer = viewerRef.current;
    if (!viewer) return;
    const hit = await pickAtPointer(viewer, e);
    if (hit) {
      await handlePick(hit.modelId, hit.localId);
    } else {
      await clearSelection(viewer);
      setSelection(null);
    }
  }

  return (
    <div className="app">
      <Toolbar
        fileName={fileName}
        loading={loading}
        onOpenFile={handleOpenFile}
        panelOpen={panelOpen}
        onTogglePanel={() => setPanelOpen((v) => !v)}
      />
      <div className="viewer-area">
        <div
          ref={containerRef}
          className="viewer-canvas"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
        />
        {!ready && <div className="viewer-loading">Inizializzazione motore 3D…</div>}
        {!fileName && ready && (
          <div className="viewer-hint">
            Apri un file .ifc per iniziare la navigazione del modello
          </div>
        )}
        {error && <div className="viewer-error">{error}</div>}
      </div>
      {panelOpen && (
        <aside className="side-panel">
          <div className="panel-tabs">
            <button
              type="button"
              className={activeTab === "tree" ? "panel-tab active" : "panel-tab"}
              onClick={() => setActiveTab("tree")}
            >
              Struttura
            </button>
            <button
              type="button"
              className={
                activeTab === "properties" ? "panel-tab active" : "panel-tab"
              }
              onClick={() => setActiveTab("properties")}
            >
              Proprietà
            </button>
          </div>
          <div className="panel-content">
            {activeTab === "tree" ? (
              <SpatialTree
                tree={tree}
                selectedLocalId={selection?.localId ?? null}
                onSelect={handleTreeSelect}
              />
            ) : (
              <PropertiesPanel selection={selection} />
            )}
          </div>
        </aside>
      )}
    </div>
  );
}
