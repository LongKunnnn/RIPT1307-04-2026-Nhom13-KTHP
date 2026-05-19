import { defineConfig } from "umi";

export default defineConfig({
<<<<<<< HEAD
  esbuildMinifyIIFE: true,
  styles: ['@/styles/global.less'],
=======
  plugins: ["@umijs/plugins/dist/model"],
>>>>>>> 9cb5e9d8bed8a284c14e2f6b0384853955764bf3
  routes: [
    { path: "/", component: "index" },
    { path: "/login", component: "auth/login" },
    { path: "/register", component: "auth/register" },
    { path: "/forgot-password", component: "auth/forgot-password" },
    { path: "/questions/ask", component: "questions/ask" },
    { path: "/questions/:id", component: "questions/$id" },
    { path: "/admin", component: "admin/index" },
    { path: "/admin/posts", component: "admin/posts" },
    { path: "/admin/posts/:id", component: "admin/posts/$id" },
    { path: "/admin/users", component: "admin/users" },
    { path: "/admin/moderation", component: "admin/moderation" },
  ],
  npmClient: 'npm',
});
