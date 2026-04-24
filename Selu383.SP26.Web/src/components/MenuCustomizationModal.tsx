import { useEffect, useMemo, useRef, useState } from "react";
import type { MenuCustomization, MenuItem } from "../types/menu.types";

type MenuCustomizationModalProps = {
  item: MenuItem;
  onAddToCart: (customizations: string, unitPrice: number) => void;
  onClose: () => void;
};

function roundToCents(value: number) {
  return Math.round(value * 100) / 100;
}

function isShotOption(option: MenuCustomization) {
  return /\bshot\b/i.test(option.optionName);
}

function isSingleSelectGroup(groupName: string) {
  const normalized = groupName.trim().toLowerCase();
  return normalized === "milk" || normalized === "sweetener" || normalized === "ice";
}

function buildCustomizationLabel(option: MenuCustomization, quantity: number | null) {
  if (!quantity || quantity <= 0) {
    return option.optionName;
  }

  if (quantity === 1) {
    return option.optionName;
  }

  return `${option.optionName} x${quantity}`;
}

function groupCustomizations(customizations: MenuCustomization[]) {
  const groups = new Map<string, MenuCustomization[]>();

  customizations.forEach((customization) => {
    const key = customization.groupName.trim() || "Options";
    const current = groups.get(key);
    if (current) {
      current.push(customization);
      return;
    }
    groups.set(key, [customization]);
  });

  return [...groups.entries()]
    .map(([groupName, options]) => ({
      groupName,
      options: [...options].sort((left, right) => left.sortOrder - right.sortOrder || left.optionName.localeCompare(right.optionName)),
      sortOrder: Math.min(...options.map((option) => option.sortOrder ?? 0)),
    }))
    .sort((left, right) => left.sortOrder - right.sortOrder || left.groupName.localeCompare(right.groupName));
}

export default function MenuCustomizationModal({ item, onAddToCart, onClose }: MenuCustomizationModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const groups = useMemo(() => groupCustomizations(item.customizations ?? []), [item.customizations]);

  const defaultSelectedIds = useMemo(() => {
    return new Set(
      (item.customizations ?? [])
        .filter((option) => option.isDefault && !isShotOption(option))
        .map((option) => option.id),
    );
  }, [item.customizations]);

  const defaultShotQuantities = useMemo(() => {
    const quantities: Record<number, number> = {};
    (item.customizations ?? []).forEach((option) => {
      if (!isShotOption(option)) {
        return;
      }
      quantities[option.id] = option.isDefault ? 1 : 0;
    });
    return quantities;
  }, [item.customizations]);

  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set(defaultSelectedIds));
  const [shotQuantities, setShotQuantities] = useState<Record<number, number>>(() => ({ ...defaultShotQuantities }));

  useEffect(() => {
    // Ensure a fresh state each time the user opens a different item.
    setSelectedIds(new Set(defaultSelectedIds));
    setShotQuantities({ ...defaultShotQuantities });
  }, [defaultSelectedIds, defaultShotQuantities, item.id]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  const { customizationsLabel, extraCost } = useMemo(() => {
    const selectedOptions = (item.customizations ?? [])
      .filter((option) => selectedIds.has(option.id))
      .sort((left, right) => left.sortOrder - right.sortOrder || left.optionName.localeCompare(right.optionName));

    const selectedWithQuantities: Array<{ option: MenuCustomization; quantity: number | null }> = [
      ...selectedOptions.map((option) => ({ option, quantity: null })),
    ];

    (item.customizations ?? [])
      .filter((option) => isShotOption(option))
      .sort((left, right) => left.sortOrder - right.sortOrder || left.optionName.localeCompare(right.optionName))
      .forEach((option) => {
        const quantity = shotQuantities[option.id] ?? 0;
        if (quantity > 0) {
          selectedWithQuantities.push({ option, quantity });
        }
      });

    const label = selectedWithQuantities
      .map(({ option, quantity }) => buildCustomizationLabel(option, quantity))
      .join(", ");

    const extras = roundToCents(
      selectedOptions.reduce((sum, option) => sum + (option.additionalPrice ?? 0), 0)
      + (item.customizations ?? [])
        .filter((option) => isShotOption(option))
        .reduce((sum, option) => sum + (option.additionalPrice ?? 0) * (shotQuantities[option.id] ?? 0), 0),
    );

    return { customizationsLabel: label, extraCost: extras };
  }, [item.customizations, selectedIds, shotQuantities]);

  const unitPrice = useMemo(() => roundToCents(item.price + extraCost), [extraCost, item.price]);

  function toggleMultiSelect(optionId: number) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(optionId)) {
        next.delete(optionId);
      } else {
        next.add(optionId);
      }
      return next;
    });
  }

  function toggleSingleSelect(groupOptionIds: number[], nextId: number) {
    const hasDefaultInGroup = (item.customizations ?? []).some((option) => groupOptionIds.includes(option.id) && option.isDefault);

    setSelectedIds((current) => {
      const next = new Set(current);
      const isAlreadySelected = next.has(nextId);

      groupOptionIds.forEach((id) => next.delete(id));

      if (!isAlreadySelected) {
        next.add(nextId);
      } else if (hasDefaultInGroup) {
        // Keep one selection in "required-ish" groups like Milk.
        const defaultId = (item.customizations ?? []).find((option) => groupOptionIds.includes(option.id) && option.isDefault)?.id;
        if (defaultId !== undefined) {
          next.add(defaultId);
        }
      }

      return next;
    });
  }

    function adjustShot(optionId: number, delta: number) {
        setShotQuantities((current) => {
            const next = { ...current };
            const newQuantity = (next[optionId] ?? 0) + delta;
            // Limit espresso shots to a maximum of 3
            next[optionId] = Math.max(0, Math.min(3, newQuantity));
            return next;
        });
    }

  function resetToDefault() {
    setSelectedIds(new Set(defaultSelectedIds));
    setShotQuantities({ ...defaultShotQuantities });
  }

  function addToCart() {
    onAddToCart(customizationsLabel, unitPrice);
    onClose();
  }

  return (
    <div
      className="order-coffeehouse-modal-backdrop"
      role="presentation"
      onClick={onClose}
    >
      <section
        aria-label={`Customize ${item.name}`}
        aria-modal="true"
        className="order-coffeehouse-modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <header className="order-coffeehouse-modal-header">
          <div>
            <p className="order-coffeehouse-modal-kicker">Customize</p>
            <h2>{item.name}</h2>
          </div>
          <button
            aria-label="Close customization"
            className="order-coffeehouse-modal-close"
            onClick={onClose}
            ref={closeButtonRef}
            type="button"
          >
            Close
          </button>
        </header>

        {item.description ? <p className="order-coffeehouse-modal-description">{item.description}</p> : null}

        <div className="order-coffeehouse-modal-body">
          {groups.length === 0 ? (
            <p className="order-coffeehouse-modal-empty">No customizations available for this item.</p>
          ) : (
            groups.map((group) => {
              const shotOptions = group.options.filter((option) => isShotOption(option));
              const standardOptions = group.options.filter((option) => !isShotOption(option));
              const isSingleSelect = isSingleSelectGroup(group.groupName);
              const groupOptionIds = standardOptions.map((option) => option.id);

              return (
                <section className="order-coffeehouse-modal-group" key={group.groupName}>
                  <div className="order-coffeehouse-modal-group-heading">
                    <h3>{group.groupName}</h3>
                    {isSingleSelect ? <span>Pick one</span> : <span>Add or remove</span>}
                  </div>

                  {standardOptions.length > 0 ? (
                    <div className="order-coffeehouse-option-grid">
                      {standardOptions.map((option) => {
                        const isSelected = selectedIds.has(option.id);
                        const priceTag = option.additionalPrice > 0 ? `+$${option.additionalPrice.toFixed(2)}` : option.additionalPrice < 0 ? `-$${Math.abs(option.additionalPrice).toFixed(2)}` : null;

                        return (
                          <button
                            className={isSelected ? "order-coffeehouse-option-chip selected" : "order-coffeehouse-option-chip"}
                            key={option.id}
                            onClick={() => (isSingleSelect ? toggleSingleSelect(groupOptionIds, option.id) : toggleMultiSelect(option.id))}
                            type="button"
                          >
                            <span>{option.optionName}</span>
                            {priceTag ? <b>{priceTag}</b> : null}
                          </button>
                        );
                      })}
                    </div>
                  ) : null}

                  {shotOptions.length > 0 ? (
                    <div className="order-coffeehouse-shot-list">
                      {shotOptions.map((option) => {
                        const quantity = shotQuantities[option.id] ?? 0;
                        const priceTag = option.additionalPrice > 0 ? `+$${option.additionalPrice.toFixed(2)}/ea` : null;

                        return (
                          <div className="order-coffeehouse-shot-row" key={option.id}>
                            <div className="order-coffeehouse-shot-copy">
                              <strong>{option.optionName}</strong>
                              {priceTag ? <span>{priceTag}</span> : null}
                            </div>
                            <div className="order-coffeehouse-shot-stepper" role="group" aria-label={`${option.optionName} quantity`}>
                              <button
                                className="order-coffeehouse-stepper-button"
                                onClick={() => adjustShot(option.id, -1)}
                                type="button"
                              >
                                -
                              </button>
                              <span className="order-coffeehouse-stepper-value" aria-live="polite">
                                {quantity}
                              </span>
                              <button
                                className="order-coffeehouse-stepper-button"
                                onClick={() => adjustShot(option.id, 1)}
                                type="button"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </section>
              );
            })
          )}
        </div>

        <footer className="order-coffeehouse-modal-footer">
          <div className="order-coffeehouse-modal-summary">
            <p>{customizationsLabel || "Standard build"}</p>
            <strong>${unitPrice.toFixed(2)}</strong>
          </div>
          <div className="order-coffeehouse-modal-actions">
            <button className="order-coffeehouse-modal-secondary" onClick={resetToDefault} type="button">
              Reset
            </button>
            <button className="order-coffeehouse-modal-primary" onClick={addToCart} type="button">
              Add to cart
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
