import * as THREE from "three";
import * as OBC from "@thatopen/components";

const SELECT_MATERIAL = {
  color: new THREE.Color("#ff9800"),
  renderedFaces: 0, // RenderedFaces.ONE
  opacity: 1,
  transparent: false,
};

// Attributes/relations pulled for the properties panel: built-in attributes
// plus property sets (IsDefinedBy -> HasProperties) and quantity sets.
const ITEM_DATA_CONFIG = {
  attributesDefault: true,
  relations: {
    IsDefinedBy: { attributes: true, relations: true },
    HasProperties: { attributes: true, relations: false },
    Quantities: { attributes: true, relations: false },
  },
};

export async function createViewer(container) {
  const components = new OBC.Components();
  const worlds = components.get(OBC.Worlds);
  const world = worlds.create();

  world.scene = new OBC.SimpleScene(components);
  world.renderer = new OBC.SimpleRenderer(components, container);
  world.camera = new OBC.OrthoPerspectiveCamera(components);

  components.init();

  world.scene.setup();
  world.scene.three.background = new THREE.Color("#dce3e8");

  const grids = components.get(OBC.Grids);

  const fragments = components.get(OBC.FragmentsManager);
  const workerUrl = new URL("/fragments-worker.mjs", window.location.origin).href;
  fragments.init(workerUrl);

  fragments.list.onItemSet.add(({ value: model }) => {
    model.useCamera(world.camera.three);
    world.scene.three.add(model.object);
    fragments.core.update(true);
  });

  const ifcLoader = components.get(OBC.IfcLoader);
  await ifcLoader.setup({
    autoSetWasm: false,
    wasm: { path: "/wasm/", absolute: true },
  });

  const hider = components.get(OBC.Hider);

  const clipper = components.get(OBC.Clipper);
  clipper.setup();

  const grid = grids.create(world);

  return {
    components,
    world,
    fragments,
    ifcLoader,
    hider,
    clipper,
    grid,
    models: new Map(), // modelId -> FragmentsModel
    selected: null, // { modelId, localId }
    searchIndex: null, // built lazily per loaded model
    renderStyle: "shaded",
    measurement: { points: [], lines: [] },
    planMode: false,
  };
}

export async function loadIfc(state, arrayBuffer, name) {
  const data = new Uint8Array(arrayBuffer);
  const model = await state.ifcLoader.load(data, true, name);
  state.models.set(model.modelId, model);
  state.searchIndex = null;
  await state.world.camera.fitToItems();
  return model;
}

function toClientMouse(event) {
  return new THREE.Vector2(event.clientX, event.clientY);
}

export async function pickAtPointer(state, event) {
  const dom = state.world.renderer.three.domElement;
  const result = await state.fragments.raycast({
    camera: state.world.camera.three,
    mouse: toClientMouse(event),
    dom,
  });
  if (!result) return null;
  return { modelId: result.fragments.modelId, localId: result.localId };
}

export async function selectItem(state, modelId, localId) {
  await clearSelection(state);
  const items = { [modelId]: new Set([localId]) };
  await state.fragments.highlight(SELECT_MATERIAL, items);
  state.selected = { modelId, localId };
  return getItemProperties(state, modelId, localId);
}

export async function clearSelection(state) {
  if (!state.selected) return;
  const { modelId, localId } = state.selected;
  await state.fragments.resetHighlight({ [modelId]: new Set([localId]) });
  state.selected = null;
}

export async function focusItem(state, modelId, localId) {
  await state.world.camera.fitToItems({ [modelId]: new Set([localId]) });
}

export async function getItemProperties(state, modelId, localId) {
  const model = state.models.get(modelId);
  if (!model) return null;
  // Pull guid/category from the item data itself (`_guid`/`_category` are
  // always included) rather than the separate Item.getGuid()/getCategory()
  // calls, which hit a broken worker RPC in @thatopen/fragments 3.4.7.
  const [data] = await model.getItemsData([localId], ITEM_DATA_CONFIG);
  const guid = data?._guid?.value ?? null;
  const category = data?._category?.value ?? null;
  return { modelId, localId, guid, category, data };
}

export async function getSpatialTree(state, modelId) {
  const model = state.models.get(modelId);
  if (!model) return null;
  return model.getSpatialStructure();
}

export async function resetModels(state) {
  await clearSelection(state);
  clearSections(state);
  clearMeasurements(state);
  state.renderStyle = "shaded";
  if (state.planMode) {
    await setPlanView(state, false);
  }
  for (const model of state.models.values()) {
    await model.dispose();
  }
  state.models.clear();
  state.searchIndex = null;
}

export function disposeViewer(state) {
  state.components.dispose();
}

function getPrimaryModel(state) {
  const [model] = state.models.values();
  return model ?? null;
}

// --- Category browser (also backs search and the model info summary) --------

// Administrative/definition entities (property sets, units, relationships,
// history...) show up in getCategories() alongside real physical elements,
// but isolating or searching for "PROPERTYSET" isn't useful in a viewer, so
// they're filtered out here for both the category browser and search.
const NON_SPATIAL_CATEGORY = /^IFC(PROPERTY|RELDEFINESBY|RELCONTAINEDIN|RELAGGREGATES|RELASSOCIATES|ELEMENTQUANTITY|QUANTITY|SIUNIT|UNITASSIGNMENT|CONVERSIONBASEDUNIT|OWNERHISTORY|PERSON|ORGANIZATION|APPLICATION|GEOMETRICREPRESENTATIONCONTEXT|MATERIAL|PRESENTATIONSTYLE|STYLEDITEM|CARTESIANPOINT|DIRECTION|AXIS2PLACEMENT|LOCALPLACEMENT)/i;

export async function getCategoriesWithCounts(state, modelId) {
  const model = state.models.get(modelId);
  if (!model) return [];
  const categories = await model.getCategories();
  const itemsByCategory = await model.getItemsOfCategories(
    categories.map((c) => new RegExp(`^${c}$`))
  );
  return Object.entries(itemsByCategory)
    .map(([category, ids]) => ({ category, ids }))
    .filter((c) => c.ids.length > 0 && !NON_SPATIAL_CATEGORY.test(c.category))
    .sort((a, b) => a.category.localeCompare(b.category));
}

// --- Model info -----------------------------------------------------------

export function getModelBoxSize(state, modelId) {
  const model = state.models.get(modelId);
  const box = model?.box;
  if (!box) return null;
  const size = box.getSize(new THREE.Vector3());
  return { x: size.x, y: size.y, z: size.z };
}

// --- Visibility (isolate / show all) ----------------------------------------

export async function isolateItems(state, modelId, localIds) {
  await state.hider.isolate({ [modelId]: new Set(localIds) });
}

export async function showAllItems(state) {
  await state.hider.set(true);
}

// --- Search ------------------------------------------------------------------

async function ensureSearchIndex(state, modelId) {
  if (state.searchIndex && state.searchIndex.modelId === modelId) {
    return state.searchIndex;
  }
  const model = state.models.get(modelId);
  if (!model) return null;
  // Reuse the same category listing as the category browser (proven
  // stable) rather than getItemsIdsWithGeometry(), which reproducibly wedges
  // the fragments worker so later selections never resolve.
  const categories = await getCategoriesWithCounts(state, modelId);
  const ids = categories.flatMap((c) => c.ids);
  const dataList = await model.getItemsData(ids, { attributesDefault: true });
  const entries = ids.map((localId, i) => ({
    localId,
    name: dataList[i]?.Name?.value ?? null,
    category: dataList[i]?._category?.value ?? null,
  }));
  state.searchIndex = { modelId, entries };
  return state.searchIndex;
}

export async function searchItems(state, modelId, query) {
  const index = await ensureSearchIndex(state, modelId);
  if (!index) return [];
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return index.entries
    .filter(
      (e) =>
        (e.name && e.name.toLowerCase().includes(q)) ||
        (e.category && e.category.toLowerCase().includes(q))
    )
    .slice(0, 200);
}

// --- Camera view presets ------------------------------------------------------

const VIEW_PRESETS = {
  top: { azimuth: 0, polar: 0.01 },
  front: { azimuth: 0, polar: Math.PI / 2 },
  iso: { azimuth: Math.PI / 4, polar: Math.PI / 3 },
};

export async function setView(state, preset) {
  const controls = state.world.camera.controls;
  if (preset === "fit") {
    await state.world.camera.fitToItems();
    return;
  }
  const angles = VIEW_PRESETS[preset];
  if (!angles) return;
  await controls.rotateTo(angles.azimuth, angles.polar, true);
  await state.world.camera.fitToItems();
}

// --- Section planes (clipping) ------------------------------------------------

export function addSectionPlane(state, axis) {
  const model = getPrimaryModel(state);
  if (!model || !model.box) return;
  const center = model.box.getCenter(new THREE.Vector3());
  if (axis === "horizontal") {
    state.clipper.createFromNormalAndCoplanarPoint(
      state.world,
      new THREE.Vector3(0, -1, 0),
      center
    );
  } else {
    const direction = state.world.camera.three.getWorldDirection(
      new THREE.Vector3()
    );
    state.clipper.createFromNormalAndCoplanarPoint(
      state.world,
      direction,
      center
    );
  }
}

export function clearSections(state) {
  state.clipper.deleteAll();
}

// --- Render styles -------------------------------------------------------

function forEachMesh(state, fn) {
  for (const model of state.models.values()) {
    model.object.traverse((child) => {
      if (child.isMesh) fn(child);
    });
  }
}

export const RENDER_STYLES = ["shaded", "wireframe", "xray"];

export function setRenderStyle(state, style) {
  state.renderStyle = style;
  forEachMesh(state, (mesh) => {
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const m of materials) {
      if (!m) continue;
      // Remember the fragments-provided defaults the first time we touch a
      // material, so switching back to "shaded" restores them exactly.
      if (m.userData.__origOpacity === undefined) {
        m.userData.__origOpacity = m.opacity;
        m.userData.__origTransparent = m.transparent;
      }
      m.wireframe = style === "wireframe";
      if (style === "xray") {
        m.transparent = true;
        m.opacity = 0.3;
      } else {
        m.transparent = m.userData.__origTransparent;
        m.opacity = m.userData.__origOpacity;
      }
      m.needsUpdate = true;
    }
  });
}

export function setGridVisible(state, visible) {
  if (state.grid) state.grid.visible = visible;
}

// --- Screenshot ------------------------------------------------------------

export function captureScreenshot(state) {
  const canvas = state.world.renderer.three.domElement;
  return canvas.toDataURL("image/png");
}

// --- Measurement -------------------------------------------------------------

export function startMeasurement(state) {
  state.measurement.points = [];
}

export async function addMeasurementPoint(state, event) {
  const dom = state.world.renderer.three.domElement;
  const result = await state.fragments.raycast({
    camera: state.world.camera.three,
    mouse: toClientMouse(event),
    dom,
  });
  if (!result) return null;

  state.measurement.points.push(result.point.clone());
  if (state.measurement.points.length < 2) {
    return { distance: null, done: false };
  }

  const [a, b] = state.measurement.points;
  const distance = a.distanceTo(b);
  const geometry = new THREE.BufferGeometry().setFromPoints([a, b]);
  const line = new THREE.Line(
    geometry,
    new THREE.LineBasicMaterial({ color: 0xff9800, depthTest: false })
  );
  line.renderOrder = 999;
  state.world.scene.three.add(line);
  state.measurement.lines.push(line);
  state.measurement.points = [];
  return { distance, done: true };
}

export function clearMeasurements(state) {
  for (const line of state.measurement.lines) {
    state.world.scene.three.remove(line);
    line.geometry.dispose();
    line.material.dispose();
  }
  state.measurement.points = [];
  state.measurement.lines = [];
}

// --- 2D plan view ------------------------------------------------------------

export async function setPlanView(state, enabled) {
  const camera = state.world.camera;
  state.planMode = enabled;
  if (enabled) {
    await camera.projection.set("Orthographic");
    await camera.controls.rotateTo(0, 0.001, true);
    camera.set("Plan");
  } else {
    camera.set("Orbit");
    await camera.projection.set("Perspective");
  }
  await camera.fitToItems();
}

// --- Floors (building storeys) ------------------------------------------------

function collectLocalIds(node, out) {
  if (node.localId != null) out.push(node.localId);
  for (const child of node.children || []) collectLocalIds(child, out);
}

function findStoreyNodes(node, out) {
  if (node.category && /BUILDINGSTOREY/i.test(node.category)) {
    out.push(node);
  }
  for (const child of node.children || []) findStoreyNodes(child, out);
}

// getSpatialStructure() sometimes represents a storey as a bucket node
// (category set, no localId of its own) wrapping the single real instance
// (no category, the real localId) one level down — same pattern the
// spatial tree UI unwraps. Follow that chain to find the real id.
function resolveRealLocalId(node) {
  let current = node;
  while (current.localId == null && current.children?.length === 1) {
    current = current.children[0];
  }
  return current.localId;
}

export async function getStoreys(state, modelId, tree) {
  const model = state.models.get(modelId);
  if (!model || !tree) return [];
  const storeyNodes = [];
  findStoreyNodes(tree, storeyNodes);
  if (storeyNodes.length === 0) return [];

  const pairs = storeyNodes
    .map((node) => [node, resolveRealLocalId(node)])
    .filter(([, id]) => id != null);
  const storeyIds = pairs.map(([, id]) => id);
  const dataList = storeyIds.length
    ? await model.getItemsData(storeyIds, { attributesDefault: true })
    : [];
  const dataById = new Map(storeyIds.map((id, i) => [id, dataList[i]]));

  const storeys = pairs.map(([node, resolvedId]) => {
    const ids = [];
    collectLocalIds(node, ids);
    const data = dataById.get(resolvedId);
    return {
      localId: resolvedId,
      name: data?.Name?.value ?? null,
      elevation: typeof data?.Elevation?.value === "number" ? data.Elevation.value : null,
      ids,
    };
  });

  storeys.sort((a, b) => {
    if (a.elevation != null && b.elevation != null) return a.elevation - b.elevation;
    return 0;
  });
  return storeys;
}

export async function isolateStorey(state, modelId, storey) {
  await isolateItems(state, modelId, storey.ids);
  await setPlanView(state, true);
  await state.world.camera.fitToItems({ [modelId]: new Set(storey.ids) });
}
