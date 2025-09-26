"use client";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";

export default function Cabecalho() {
  const { data: session, status } = useSession();

  return (
    <div>
      <h1>
        <Link href={"/"}>Sistema Inventário Tiago</Link>
      </h1>

      <div>
        {status === "loading" && (
          <span className="text-gray-500">Carregando...</span>
        )}

        {status === "authenticated" && session && (
          <div>
            {session.user?.email}
            <button onClick={() => signOut()}>Sair</button>
          </div>
        )}

        {status === "unauthenticated" && (
          <button onClick={() => signIn("google")}>Entrar com Google</button>
        )}
      </div>
    </div>
  );
}
