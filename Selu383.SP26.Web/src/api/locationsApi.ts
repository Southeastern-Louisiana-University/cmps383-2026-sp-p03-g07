import { apiRequest } from "./client";
import type { Location, LocationInput } from "../types/location.types";

export const locationsApi = {
  getLocations() {
    return apiRequest<Location[]>("/api/locations");
  },
  createLocation(input: LocationInput) {
    return apiRequest<Location>("/api/locations", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  updateLocation(id: number, input: LocationInput) {
    return apiRequest<Location>(`/api/locations/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    });
  },
  deleteLocation(id: number) {
    return apiRequest<void>(`/api/locations/${id}`, {
      method: "DELETE",
    });
  },
};
