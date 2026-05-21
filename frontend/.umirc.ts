import { defineConfig } from "umi";

export default defineConfig({
  esbuildMinifyIIFE: true,
  styles: ['@/styles/global.less'],
  routes: [
    { path: "/", component: "index" },
    { path: "/login", component: "auth/login" },
    { path: "/register", component: "auth/register" },
    { path: "/forgot-password", component: "auth/forgot-password" },
    { path: "/questions/ask", component: "questions/ask" },
    { path: "/questions/:id", component: "questions/$id" },
    { path: "/profile", component: "profile/index" },
    { path: "/profile/:username", component: "profile/$username" },
    { path: "/admin", component: "admin/index" },
    { path: "/admin/posts", component: "admin/posts" },
    { path: "/admin/posts/:id", component: "admin/posts/$id" },
    { path: "/admin/users", component: "admin/users" },
    { path: "/admin/moderation", component: "admin/moderation" },
  ],
  npmClient: 'npm',
});
