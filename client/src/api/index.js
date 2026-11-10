// client/src/api/index.js
import { demoApi } from "../lib/demoEngine.js";
import { restApi } from "./restApi.js";

export const isDemo = import.meta.env.VITE_DEMO === "true" || import.meta.env.VITE_DEMO === "1";

export const api = isDemo ? demoApi : restApi;

export { resetDemo } from "../lib/demoEngine.js";
