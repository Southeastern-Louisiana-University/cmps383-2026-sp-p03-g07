export type MenuCustomization = {
  id: number;
  groupName: string;
  optionName: string;
  additionalPrice: number;
  isDefault: boolean;
  sortOrder: number;
};

export type MenuItem = {
  id: number;
  name: string;
  category: string;
  description: string;
  price: number;
  isAvailable: boolean;
  locationId: number;
  imageUrl: string;
  calories: number;
  isFeatured: boolean;
  inventoryCount: number;
  preparationTag: string;
  customizations: MenuCustomization[];
};
