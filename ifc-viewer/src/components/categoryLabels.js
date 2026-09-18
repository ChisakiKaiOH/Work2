export const CATEGORY_LABELS = {
  IFCPROJECT: "Progetto",
  IFCSITE: "Sito",
  IFCBUILDING: "Edificio",
  IFCBUILDINGSTOREY: "Piano",
  IFCSPACE: "Spazio",
  IFCWALL: "Muro",
  IFCWALLSTANDARDCASE: "Muro",
  IFCSLAB: "Solaio",
  IFCDOOR: "Porta",
  IFCWINDOW: "Finestra",
  IFCCOLUMN: "Pilastro",
  IFCBEAM: "Trave",
  IFCROOF: "Tetto",
  IFCSTAIR: "Scala",
  IFCSTAIRFLIGHT: "Rampa di scale",
  IFCRAILING: "Ringhiera",
  IFCCOVERING: "Rivestimento",
  IFCCURTAINWALL: "Facciata continua",
  IFCFURNISHINGELEMENT: "Arredo",
  IFCMEMBER: "Elemento strutturale",
  IFCPLATE: "Piastra",
  IFCFOOTING: "Fondazione",
  IFCPIPESEGMENT: "Tratto di tubo",
  IFCPIPEFITTING: "Raccordo tubo",
  IFCDUCTSEGMENT: "Tratto di canale",
  IFCDUCTFITTING: "Raccordo canale",
  IFCCABLECARRIERSEGMENT: "Passerella cavi",
  IFCFLOWTERMINAL: "Terminale impianto",
  IFCSANITARYTERMINAL: "Apparecchio sanitario",
  IFCLIGHTFIXTURE: "Apparecchio illuminante",
  IFCRAMP: "Rampa",
};

export function formatCategoryLabel(category) {
  if (!category) return "Elemento";
  const known = CATEGORY_LABELS[category.toUpperCase()];
  if (known) return known;
  return category.replace(/^IFC/i, "");
}
