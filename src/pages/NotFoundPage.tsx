import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <section className="page">
      <h2>Página no encontrada</h2>
      <Link to="/operacion">Volver a Operación</Link>
    </section>
  );
}
