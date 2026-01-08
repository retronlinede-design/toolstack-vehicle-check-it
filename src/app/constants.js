export const APP_ID = "vehiclecheckit";
export const APP_VERSION = "v1";
export const TEMPLATE_REV = 9;

export const KEY = `toolstack.${APP_ID}.${APP_VERSION}`;
export const PROFILE_KEY = "toolstack.profile.v1";

export const HUB_URL = "https://YOUR-WIX-HUB-URL-HERE";

export const FUEL_OPTIONS = [
  "95 Super",
  "95 E10",
  "98 Super Plus",
  "Diesel",
  "Hybrid",
  "Plug-in-Hybrid",
  "Elektro",
  "Autogas (LPG)",
  "Erdgas (CNG)",
  "Wasserstoff",
  "Sonstiges",
];

export const blankVehicle = () => ({
  id: "",
  label: "",
  plate: "",
  make: "",
  model: "",
  fuelType: FUEL_OPTIONS[0],
  year: "",
  vin: "",
  tuvUntil: "",
  serviceDue: "",
  notes: "",
});
