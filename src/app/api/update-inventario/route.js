import { promises as fs } from 'fs';
import path from 'path';

export async function POST(request) {
  const { nome, numero, salaEncontrada, dataInventario, status, inventariante } = await request.json();

  const filePath = path.join(process.cwd(), 'public', nome, 'inventario.json');

  try {
    const fileContents = await fs.readFile(filePath, 'utf8');
    const dados = JSON.parse(fileContents);

    const itemIndex = dados.findIndex((item) => String(item.NUMERO) === numero);
    if (itemIndex === -1) {
      return new Response(JSON.stringify({ error: 'Item não encontrado' }), { status: 404 });
    }

    // Adiciona as informações
    dados[itemIndex].salaEncontrada = salaEncontrada;
    dados[itemIndex].dataInventario = dataInventario;
    dados[itemIndex].status = status;
    dados[itemIndex].inventariante = inventariante;

    await fs.writeFile(filePath, JSON.stringify(dados, null, 2));
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Erro ao atualizar' }), { status: 500 });
  }
}