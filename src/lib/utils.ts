export const preventRightClickSelect = (e: React.MouseEvent) => {
  if (e.button === 2) e.preventDefault();
};

export const preventContextMenu = (e: React.MouseEvent) => {
  e.preventDefault();
};