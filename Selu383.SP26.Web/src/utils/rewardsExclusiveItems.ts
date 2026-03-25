const rewardsExclusiveItemNames = [
  "Brown Sugar Shaker",
  "Cold Brew",
  "Latte",
] as const;

const normalizedRewardsExclusiveItemNames = new Set(
  rewardsExclusiveItemNames.map((name) => name.toLowerCase()),
);

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeName(value: string) {
  return value.trim().toLowerCase();
}

export function isRewardsExclusiveItemName(name: string) {
  return normalizedRewardsExclusiveItemNames.has(normalizeName(name));
}

export function textMentionsRewardsExclusiveItem(text: string) {
  const normalizedText = text.toLowerCase();

  return rewardsExclusiveItemNames.some((name) => normalizedText.includes(name.toLowerCase()));
}

export function filterRewardsExclusiveNamedItems<T extends { name: string }>(items: T[]) {
  return items.filter((item) => !isRewardsExclusiveItemName(item.name));
}

export function filterRewardsExclusiveOrderItems<T extends { itemName: string }>(items: T[]) {
  return items.filter((item) => !isRewardsExclusiveItemName(item.itemName));
}

export function stripRewardsExclusiveItemNames(text: string) {
  return rewardsExclusiveItemNames.reduce((result, itemName) => {
    const pattern = new RegExp(escapeRegExp(itemName), "gi");
    return result.replace(pattern, "featured reward");
  }, text);
}
