import { TEMPLATE_REV, FUEL_OPTIONS } from "./constants";
import { uid } from "../lib/core";

export function defaultTemplate() {
  const sid = () => uid("s");
  const iid = () => uid("i");

  return {
    rev: TEMPLATE_REV,
    name: "Default Vehicle Check",
    sections: [
      {
        id: sid(),
        title: "Exterior",
        items: [
          { id: iid(), label: "Tyres (pressure / condition)", severity: "ok" },
          { id: iid(), label: "Lights (all working)", severity: "ok" },
          { id: iid(), label: "Windows / mirrors clean", severity: "ok" },
          { id: iid(), label: "Body damage check", severity: "ok" },
        ],
      },
      {
        id: sid(),
        title: "Interior",
        items: [
          { id: iid(), label: "Cabin clean", severity: "ok" },
          { id: iid(), label: "Cabin damage", severity: "ok" },
          { id: iid(), label: "Documents present (registration/insurance)", severity: "ok" },
          { id: iid(), label: "Charging cables / accessories", severity: "ok" },
        ],
      },
      {
        id: sid(),
        title: "Safety",
        items: [
          { id: iid(), label: "Warning triangle", severity: "ok" },
          { id: iid(), label: "High-visibility vest", severity: "ok" },
          { id: iid(), label: "First aid kit", severity: "ok" },
          { id: iid(), label: "Spare tyre / Puncture Kit", severity: "ok" },
          { id: iid(), label: "Jack & tools", severity: "ok" },
        ],
      },
      {
        id: sid(),
        title: "Vehicle status",
        items: [
          { id: iid(), label: "Oil level", severity: "ok" },
          { id: iid(), label: "Coolant level", severity: "ok" },
          { id: iid(), label: "No warning lights", severity: "ok" },
          { id: iid(), label: "Wipers / washer fluid", severity: "ok" },
          { id: iid(), label: "AdBlue level (if applicable)", severity: "ok" },
        ],
      },
    ],
  };
}

// kept here so the defaults live together
export function defaultProfile(PROFILE_KEY) {
  return {
    org: "ToolStack",
    user: "",
    language: "EN",
    logo: "",
    vehicles: [
      {
        id: "bmw-530i",
        plate: "",
        make: "BMW",
        model: "530i",
        fuelType: FUEL_OPTIONS[0],
        year: "",
        vin: "",
        tuvUntil: "",
        serviceDue: "",
        notes: "",
      },
      {
        id: "vito-119",
        plate: "",
        make: "Mercedes",
        model: "Vito 119",
        fuelType: "Diesel",
        year: "",
        vin: "",
        tuvUntil: "",
        serviceDue: "",
        notes: "",
      },
    ],
  };
}
