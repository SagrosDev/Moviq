import { createBrowserRouter, RouterProvider } from "react-router";
import { AppProviders } from "../providers/AppProviders";
import { appRoutes } from "../router";

const applicationRouter = createBrowserRouter(appRoutes);

export const App = () => (
  <AppProviders>
    <RouterProvider router={applicationRouter} />
  </AppProviders>
);
