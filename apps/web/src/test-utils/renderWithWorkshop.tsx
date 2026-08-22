import type { ReactElement } from "react";
import { render } from "@testing-library/react";
import { WorkshopProvider } from "@/lib/workshop/WorkshopContext";

export function renderWithWorkshop(ui: ReactElement) {
  return render(<WorkshopProvider>{ui}</WorkshopProvider>);
}
