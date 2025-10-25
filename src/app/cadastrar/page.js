import { Suspense } from "react";
import Cadastrar from "../components/Cadastrar";

export const dynamic = "force-dynamic";

export default function CadastrarPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <Cadastrar />
    </Suspense>
  );
}
