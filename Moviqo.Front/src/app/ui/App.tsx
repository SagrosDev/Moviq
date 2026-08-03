import { HomePage } from "../../pages/home";
import { AppProviders } from "../providers/AppProviders";

export function App() {
  return (
    <AppProviders>
      <HomePage />
    </AppProviders>
  );
}
