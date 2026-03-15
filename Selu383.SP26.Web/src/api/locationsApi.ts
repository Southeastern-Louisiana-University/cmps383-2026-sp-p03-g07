import { apiRequest } from "./client";
import type { Location } from "../types/location.types";

export const locationsApi = {
  getLocations() {
    return apiRequest<Location[]>("/api/locations");
  },
};
