import { Suspense } from "react";
import Cadastrar from "../components/Cadastrar";

export default function CadastrarPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <Cadastrar />
    </Suspense>
  );
}
