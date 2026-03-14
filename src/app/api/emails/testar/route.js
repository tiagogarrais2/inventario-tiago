import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import { isOwner } from "../../../lib/permissoes.js";
import { EmailService } from "../../../../lib/services.js";

export async function POST(request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json(
      { error: "Acesso negado. Usuário não autenticado." },
      { status: 401 }
    );
  }

  try {
    const { inventario } = await request.json();

    if (!inventario) {
      return NextResponse.json(
        { error: "O campo inventario é obrigatório." },
        { status: 400 }
      );
    }

    const proprietario = await isOwner(inventario, session.user.email);
    if (!proprietario) {
      return NextResponse.json(
        { error: "Apenas o proprietário do inventário pode testar o email." },
        { status: 403 }
      );
    }

    const transporter = EmailService.getTransporter();

    // Verificar conexão SMTP
    await transporter.verify();

    // Enviar email de teste para o usuário logado
    await transporter.sendMail({
      from: `"Comissão de Inventário Limoeiro do Norte" <${process.env.SMTP_USER}>`,
      to: session.user.email,
      subject: "✅ Teste de Configuração de Email - Inventário",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #28a745;">✅ Configuração de Email Funcionando!</h2>
          <p>Este é um email de teste enviado pelo sistema de inventário.</p>
          <p>Se você está recebendo esta mensagem, a configuração SMTP está correta e os emails estão sendo enviados com sucesso.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 13px; color: #6c757d;">
            <strong>Inventário:</strong> ${inventario}<br/>
            <strong>Enviado para:</strong> ${session.user.email}<br/>
            <strong>Data:</strong> ${new Date().toLocaleString("pt-BR")}
          </p>
        </div>
      `,
    });

    return NextResponse.json({
      success: true,
      email: session.user.email,
    });
  } catch (error) {
    console.error("Erro ao testar configuração de email:", error);

    let mensagem = "Erro desconhecido ao testar configuração de email.";

    if (error.code === "ECONNREFUSED") {
      mensagem = `Conexão recusada pelo servidor SMTP (${process.env.SMTP_HOST}:${process.env.SMTP_PORT}). Verifique host e porta.`;
    } else if (error.code === "EAUTH") {
      mensagem = "Falha na autenticação SMTP. Verifique usuário e senha.";
    } else if (error.code === "ESOCKET") {
      mensagem =
        "Erro de conexão com o servidor SMTP. Verifique o host e a porta.";
    } else if (error.code === "ETIMEDOUT") {
      mensagem = "Tempo de conexão esgotado com o servidor SMTP.";
    } else if (error.responseCode === 535) {
      mensagem = "Credenciais SMTP inválidas. Verifique usuário e senha.";
    } else if (error.message) {
      mensagem = error.message;
    }

    return NextResponse.json({ error: mensagem }, { status: 500 });
  }
}
