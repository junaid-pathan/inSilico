import * as backendApi from "./backendApi";
import * as mockApi from "./mockApi";

const apiMode = import.meta.env.VITE_API_MODE ?? "backend";

export const api = apiMode === "backend" ? backendApi : mockApi;
export const API_MODE = apiMode;
