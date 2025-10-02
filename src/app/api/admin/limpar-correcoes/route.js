import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import prisma from "@/lib/db.js";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new Response(`
        <html>
          <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>❌ Acesso Negado</h2>
            <p>Você precisa estar logado para acessar esta funcionalidade.</p>
            <a href="/auth/signin">Fazer Login</a>
          </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // Verificar se foi solicitada a limpeza
    const url = new URL(request.url);
    const confirmar = url.searchParams.get('confirmar');
    
    if (confirmar === 'sim') {
      console.log('🧹 Iniciando limpeza das correções de teste...');
      
      // Contar correções antes
      const totalAntes = await prisma.correcaoItem.count();
      console.log(`📊 Total de correções encontradas: ${totalAntes}`);
      
      // Deletar todas as correções
      const resultado = await prisma.correcaoItem.deleteMany({});
      
      console.log(`✅ ${resultado.count} correções removidas com sucesso!`);
      
      return new Response(`
        <html>
          <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>✅ Limpeza Concluída!</h2>
            <p><strong>${resultado.count}</strong> correções foram removidas com sucesso.</p>
            <p>📋 Os dados originais dos itens foram preservados.</p>
            <a href="/api/admin/limpar-correcoes" style="color: blue;">← Voltar</a>
          </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // Mostrar página de confirmação
    const totalCorrecoes = await prisma.correcaoItem.count();
    
    return new Response(`
      <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>🧹 Limpeza de Correções de Teste</h2>
          <p><strong>Usuário:</strong> ${session.user.name || session.user.email}</p>
          <p><strong>Correções encontradas:</strong> ${totalCorrecoes}</p>
          
          ${totalCorrecoes > 0 ? `
            <div style="background: #fff3cd; border: 1px solid #ffeeba; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3>⚠️ Atenção</h3>
              <p>Esta ação irá <strong>deletar TODAS as ${totalCorrecoes} correções</strong> do banco de dados.</p>
              <p>✅ Os dados originais dos itens <strong>NÃO serão afetados</strong>.</p>
              <p>❌ Esta ação <strong>não pode ser desfeita</strong>.</p>
            </div>
            
            <a href="/api/admin/limpar-correcoes?confirmar=sim" 
               onclick="return confirm('Tem certeza que deseja deletar todas as correções?')"
               style="background: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
              🗑️ Confirmar Limpeza
            </a>
          ` : `
            <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px;">
              <p>✅ Nenhuma correção encontrada para limpar.</p>
            </div>
          `}
          
          <p style="margin-top: 30px;">
            <a href="/" style="color: blue;">← Voltar ao Sistema</a>
          </p>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });

  } catch (error) {
    console.error("❌ Erro ao acessar limpeza:", error);
    return new Response(`
      <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>❌ Erro</h2>
          <p>Erro interno do servidor: ${error.message}</p>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    console.log('🧹 Iniciando limpeza das correções de teste...');
    
    // Contar correções antes
    const totalAntes = await prisma.correcaoItem.count();
    console.log(`📊 Total de correções encontradas: ${totalAntes}`);
    
    // Deletar todas as correções
    const resultado = await prisma.correcaoItem.deleteMany({});
    
    console.log(`✅ ${resultado.count} correções removidas com sucesso!`);
    
    return NextResponse.json({
      success: true,
      message: `${resultado.count} correções removidas com sucesso!`,
      totalAntes,
      totalRemovidas: resultado.count
    });

  } catch (error) {
    console.error("❌ Erro ao limpar correções:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}