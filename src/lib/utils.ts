/** Evita autocapitalização e autocorreção do SO (ex.: WebKit) em campos técnicos. */
export const noAutoTextProps = {
  autoCapitalize: "off" as const,
  autoCorrect: "off" as const,
  spellCheck: false as const,
};

export const preventRightClickSelect = (e: React.MouseEvent) => {
  if (e.button === 2) e.preventDefault();
};

export const preventContextMenu = (e: React.MouseEvent) => {
  e.preventDefault();
};