/**
 * Substitui variáveis no formato {{nome}} pelo valor do ambiente ativo.
 */
export function resolveEnvInString(
  text: string,
  variables: Record<string, string>
): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return variables[key] ?? `{{${key}}}`;
  });
}
