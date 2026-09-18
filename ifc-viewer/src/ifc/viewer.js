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
  grids.create(world);

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

  return {
    components,
    world,
    fragments,
    ifcLoader,
    models: new Map(), // modelId -> FragmentsModel
    selected: null, // { modelId, localId }
  };
}

export async function loadIfc(state, arrayBuffer, name) {
  const data = new Uint8Array(arrayBuffer);
  const model = await state.ifcLoader.load(data, true, name);
  state.models.set(model.modelId, model);
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
  for (const model of state.models.values()) {
    await model.dispose();
  }
  state.models.clear();
}

export function disposeViewer(state) {
  state.components.dispose();
}
