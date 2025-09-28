import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    console.log("API add-inventario simplificada chamada");
    
    return NextResponse.json({
      success: true,
      message: "API funcionando"
    });
  } catch (error) {
    console.error("Erro:", error);
    return NextResponse.json(
      { error: "Erro interno" },
      { status: 500 }
    );
  }
}