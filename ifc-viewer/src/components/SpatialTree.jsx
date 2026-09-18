import { useState } from "react";
import { formatCategoryLabel } from "./categoryLabels";
import { simplifySpatialTree } from "../ifc/viewer";

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
  const simplified = simplifySpatialTree(tree);
  return (
    <div className="spatial-tree">
      <TreeNode node={simplified} depth={0} selectedLocalId={selectedLocalId} onSelect={onSelect} />
    </div>
  );
}
