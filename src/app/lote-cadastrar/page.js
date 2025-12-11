import { Suspense } from "react";
import LoteCadastrar from "../components/LoteCadastrar";

export const dynamic = "force-dynamic";

export default function LoteCadastrarPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <LoteCadastrar />
    </Suspense>
  );
}
