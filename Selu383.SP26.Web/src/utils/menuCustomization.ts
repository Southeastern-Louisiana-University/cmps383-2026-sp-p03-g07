import type { MenuCustomization, MenuItem } from "../types/menu.types";

export type MenuCustomizationSelection = Record<string, string>;

export type MenuCustomizationGroup = {
  groupName: string;
  options: MenuCustomization[];
};

function toCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

export function groupMenuCustomizations(customizations: MenuCustomization[]) {
  const groupedCustomizations = new Map<string, MenuCustomization[]>();

  customizations
    .slice()
    .sort((left, right) => left.sortOrder - right.sortOrder || left.optionName.localeCompare(right.optionName))
    .forEach((customization) => {
      const existingGroup = groupedCustomizations.get(customization.groupName);

      if (existingGroup) {
        existingGroup.push(customization);
        return;
      }

      groupedCustomizations.set(customization.groupName, [customization]);
    });

  return [...groupedCustomizations.entries()].map<MenuCustomizationGroup>(([groupName, options]) => ({
    groupName,
    options,
  }));
}

export function getDefaultCustomizationSelection(item: Pick<MenuItem, "customizations">) {
  return groupMenuCustomizations(item.customizations).reduce<MenuCustomizationSelection>((selection, group) => {
    const defaultOption = group.options.find((option) => option.isDefault) ?? group.options[0];

    if (defaultOption) {
      selection[group.groupName] = defaultOption.optionName;
    }

    return selection;
  }, {});
}

export function normalizeCustomizationSelection(
  item: Pick<MenuItem, "customizations">,
  selection?: MenuCustomizationSelection,
) {
  const defaultSelection = getDefaultCustomizationSelection(item);

  return groupMenuCustomizations(item.customizations).reduce<MenuCustomizationSelection>((nextSelection, group) => {
    const selectedOptionName = selection?.[group.groupName];
    const selectedOption = group.options.find((option) => option.optionName === selectedOptionName)
      ?? group.options.find((option) => option.optionName === defaultSelection[group.groupName])
      ?? group.options[0];

    if (selectedOption) {
      nextSelection[group.groupName] = selectedOption.optionName;
    }

    return nextSelection;
  }, {});
}

export function getCustomizationSummary(
  item: Pick<MenuItem, "customizations">,
  selection?: MenuCustomizationSelection,
) {
  const resolvedSelection = normalizeCustomizationSelection(item, selection);
  return groupMenuCustomizations(item.customizations)
    .map((group) => resolvedSelection[group.groupName])
    .filter(Boolean)
    .join(", ");
}

export function calculateMenuItemPrice(
  item: Pick<MenuItem, "price" | "customizations">,
  selection?: MenuCustomizationSelection,
) {
  const resolvedSelection = normalizeCustomizationSelection(item, selection);

  const additionalPrice = groupMenuCustomizations(item.customizations).reduce((sum, group) => {
    const selectedOption = group.options.find((option) => option.optionName === resolvedSelection[group.groupName]);
    return sum + (selectedOption?.additionalPrice ?? 0);
  }, 0);

  return toCurrency(item.price + additionalPrice);
}
