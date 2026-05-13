import { defineConfig } from "umi";

export default defineConfig({
  plugins: ["@umijs/plugins/dist/model"],
  routes: [
    { path: "/", component: "index" },
    { path: "/docs", component: "docs" },
  ],
  npmClient: 'npm',
  utoopack: {},
  model: {},
});
