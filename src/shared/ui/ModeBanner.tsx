import { FlaskConical } from "lucide-react";

export function ModeBanner() {
  return (
    <div className="mode-banner" role="status">
      <FlaskConical aria-hidden="true" size={16} />
      <strong>Modo contrato · datos de desarrollo</strong>
      <span>Simulación local con datos sintéticos</span>
    </div>
  );
}
