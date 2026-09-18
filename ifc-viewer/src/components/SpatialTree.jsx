import { useState } from "react";
import { formatCategoryLabel } from "./categoryLabels";

// getSpatialStructure() interleaves two kinds of noise nodes with the real
// spatial hierarchy: bare relation-edge wrappers (no category, single
// child) and type-bucket labels (a category but no localId) wrapping their
// single concrete instance (no category, a real localId). Collapse both so
// the tree reads as a clean Project > Site > Building > Storey > Element
// hierarchy, and let leaf instances inherit their bucket's category label
// when a bucket groups more than one of them.
function simplify(node, inheritedCategory = null) {
  if (!node) return node;
  let current = node;
  while (current.children && current.children.length === 1) {
    const child = current.children[0];
    if (current.category == null) {
      current = child;
      continue;
    }
    if (current.localId == null && child.category == null) {
      current = {
        category: current.category,
        localId: child.localId,
        children: child.children,
      };
      continue;
    }
    break;
  }
  const category = current.category ?? inheritedCategory;
  return {
    ...current,
    category,
    children: (current.children || []).map((c) => simplify(c, category)),
  };
}

function TreeNode({ node, depth, selectedLocalId, onSelect }) {
  const [open, setOpen] = useState(depth < 4);
  const hasChildren = node.children && node.children.length > 0;
  const isSelectable = node.localId !== null;
  const isSelected = isSelectable && node.localId === selectedLocalId;

  return (
    <div className="tree-node" style={{ paddingLeft: depth * 14 }}>
      <div className={`tree-row ${isSelected ? "tree-row-selected" : ""}`}>
        {hasChildren ? (
          <button
            type="button"
            className="tree-toggle"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Comprimi" : "Espandi"}
          >
            {open ? "▾" : "▸"}
          </button>
        ) : (
          <span className="tree-toggle tree-toggle-spacer" />
        )}
        <button
          type="button"
          className="tree-label"
          disabled={!isSelectable}
          onClick={() => isSelectable && onSelect(node.localId)}
        >
          {formatCategoryLabel(node.category)}
        </button>
      </div>
      {hasChildren && open && (
        <div className="tree-children">
          {node.children.map((child, i) => (
            <TreeNode
              key={`${child.localId ?? "n"}-${i}`}
              node={child}
              depth={depth + 1}
              selectedLocalId={selectedLocalId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SpatialTree({ tree, selectedLocalId, onSelect }) {
  if (!tree) {
    return <div className="panel-empty">Apri un file IFC per esplorare la struttura.</div>;
  }
  const simplified = simplify(tree);
  return (
    <div className="spatial-tree">
      <TreeNode node={simplified} depth={0} selectedLocalId={selectedLocalId} onSelect={onSelect} />
    </div>
  );
}
