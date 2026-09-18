import { useEffect, useRef, useState } from "react";
import Toolbar from "./components/Toolbar";
import SpatialTree from "./components/SpatialTree";
import PropertiesPanel from "./components/PropertiesPanel";
import CategoryBrowser from "./components/CategoryBrowser";
import SearchPanel from "./components/SearchPanel";
import ModelInfoPanel from "./components/ModelInfoPanel";
import ViewControls from "./components/ViewControls";
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
  getCategoriesWithCounts,
  getModelBoxSize,
  isolateItems,
  showAllItems,
  searchItems,
  setView,
  addSectionPlane,
  clearSections,
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
  const [categories, setCategories] = useState(null);
  const [modelSize, setModelSize] = useState(null);
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
    setCategories(null);
    setModelSize(null);
    try {
      await resetModels(viewer);
      const buffer = await file.arrayBuffer();
      const model = await loadIfc(viewer, buffer, file.name);
      currentModelIdRef.current = model.modelId;
      const [spatialTree, modelCategories] = await Promise.all([
        getSpatialTree(viewer, model.modelId),
        getCategoriesWithCounts(viewer, model.modelId),
      ]);
      setTree(spatialTree);
      setCategories(modelCategories);
      setModelSize(getModelBoxSize(viewer, model.modelId));
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

  async function handleIsolateCategory(category, ids) {
    const viewer = viewerRef.current;
    const modelId = currentModelIdRef.current;
    if (!viewer || !modelId) return;
    await isolateItems(viewer, modelId, ids);
    try {
      await viewer.world.camera.fitToItems({ [modelId]: new Set(ids) });
    } catch (err) {
      console.error("fit to category failed", err);
    }
  }

  async function handleIsolateSelection(modelId, localId) {
    const viewer = viewerRef.current;
    if (!viewer) return;
    await isolateItems(viewer, modelId, [localId]);
  }

  async function handleShowAll() {
    const viewer = viewerRef.current;
    if (!viewer) return;
    await showAllItems(viewer);
  }

  async function handleSearch(query) {
    const viewer = viewerRef.current;
    const modelId = currentModelIdRef.current;
    if (!viewer || !modelId) return [];
    return searchItems(viewer, modelId, query);
  }

  async function handleSearchSelect(localId) {
    const modelId = currentModelIdRef.current;
    if (!modelId) return;
    await handlePick(modelId, localId);
    const viewer = viewerRef.current;
    try {
      await focusItem(viewer, modelId, localId);
    } catch (err) {
      console.error("focusItem failed", err);
    }
  }

  async function handleView(preset) {
    const viewer = viewerRef.current;
    if (!viewer) return;
    try {
      await setView(viewer, preset);
    } catch (err) {
      console.error("setView failed", err);
    }
  }

  function handleAddSection(axis) {
    const viewer = viewerRef.current;
    if (!viewer) return;
    try {
      addSectionPlane(viewer, axis);
    } catch (err) {
      console.error("addSectionPlane failed", err);
    }
  }

  function handleClearSections() {
    const viewer = viewerRef.current;
    if (!viewer) return;
    clearSections(viewer);
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
        <ViewControls
          visible={ready && !!fileName}
          onView={handleView}
          onAddSection={handleAddSection}
          onClearSections={handleClearSections}
          onShowAll={handleShowAll}
        />
      </div>
      {panelOpen && (
        <aside className="side-panel">
          <div className="panel-tabs">
            {[
              ["tree", "Struttura"],
              ["categories", "Categorie"],
              ["search", "Cerca"],
              ["properties", "Proprietà"],
              ["info", "Info"],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={activeTab === key ? "panel-tab active" : "panel-tab"}
                onClick={() => {
                  document.activeElement?.blur?.();
                  setActiveTab(key);
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="panel-content">
            {activeTab === "tree" && (
              <SpatialTree
                tree={tree}
                selectedLocalId={selection?.localId ?? null}
                onSelect={handleTreeSelect}
              />
            )}
            {activeTab === "categories" && (
              <CategoryBrowser categories={categories} onIsolate={handleIsolateCategory} />
            )}
            {activeTab === "search" && (
              <SearchPanel
                hasModel={!!fileName}
                onSearch={handleSearch}
                onSelect={handleSearchSelect}
                selectedLocalId={selection?.localId ?? null}
              />
            )}
            {activeTab === "properties" && (
              <PropertiesPanel selection={selection} onIsolate={handleIsolateSelection} />
            )}
            {activeTab === "info" && (
              <ModelInfoPanel fileName={fileName} categories={categories} size={modelSize} />
            )}
          </div>
        </aside>
      )}
    </div>
  );
}
