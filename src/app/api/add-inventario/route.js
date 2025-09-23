import { promises as fs } from 'fs';
import path from 'path';

export async function POST(request) {
  const { nome, ...itemData } = await request.json();

  const filePath = path.join(process.cwd(), 'public', nome, 'inventario.json');

  try {
    const fileContents = await fs.readFile(filePath, 'utf8');
    const dados = JSON.parse(fileContents);

    // Adiciona as informações de inventário
    itemData.salaEncontrada = itemData.SALA; // Assume SALA como salaEncontrada
    itemData.dataInventario = itemData["DATA DO INVENTARIO"];
    itemData.status = itemData.STATUS;
    itemData.inventariante = itemData["SERVIDOR(A) INVENTARIANTE"];

    dados.push(itemData);

    await fs.writeFile(filePath, JSON.stringify(dados, null, 2));
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Erro ao adicionar item' }), { status: 500 });
  }
}