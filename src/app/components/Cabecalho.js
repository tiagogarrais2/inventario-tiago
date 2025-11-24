"use client";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import Button from "./Button";

export default function Cabecalho() {
  const { data: session, status } = useSession();

  return (
    <div>
      <h1>
        <Link href={"/"}>Sistema de Inventário</Link>
      </h1>

      <div>
        {status === "loading" && (
          <span className="text-gray-500">Carregando...</span>
        )}

        {status === "authenticated" && session && (
          <div style={{ textAlign: "center" }}>
            {session.user?.email}
            <Button onClick={() => signOut()}>Sair</Button>
          </div>
        )}

        {status === "unauthenticated" && (
          <Button onClick={() => signIn("google")}>Entrar com Google</Button>
        )}
      </div>
    </div>
  );
}
