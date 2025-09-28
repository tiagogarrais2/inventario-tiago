import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    console.log("API add-inventario sendo chamada");
    
    const data = await request.json();
    console.log("Dados recebidos:", data);
    
    return NextResponse.json({
      success: true,
      message: "API funcionando sem autenticação",
      data: data
    });
  } catch (error) {
    console.error("Erro:", error);
    return NextResponse.json(
      { error: "Erro interno" },
      { status: 500 }
    );
  }
}