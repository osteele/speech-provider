function prepareLanguageTag(tag: string): string {
  return tag.trim().replaceAll("_", "-");
}

export function normalizeLanguageTag(tag: string): string {
  const prepared = prepareLanguageTag(tag);
  try {
    return new Intl.Locale(prepared).toString().toLowerCase();
  } catch {
    return prepared.toLowerCase();
  }
}

export function getPrimaryLanguage(tag: string): string {
  const prepared = prepareLanguageTag(tag);
  try {
    return new Intl.Locale(prepared).language.toLowerCase();
  } catch {
    return prepared.split("-")[0].toLowerCase();
  }
}
