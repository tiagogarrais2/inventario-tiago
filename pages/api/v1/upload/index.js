import { IncomingForm } from "formidable";
import { promises as fs } from "fs";
import path from "path";

export const config = {
  api: {
    bodyParser: false, // Obrigatório para processar arquivos corretamente
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ error: `Método ${req.method} não permitido` });
  }

  try {
    // Configura o formidable
    const form = new IncomingForm({ keepExtensions: true });

    // Processa o upload
    const [fields, files] = await form.parse(req);

    // Acessa o arquivo enviado
    const file = files.file[0]; // Como o arquivo está dentro de um array

    if (!file) {
      return res.status(400).json({ error: "Nenhum arquivo enviado" });
    }

    // Criando um caminho absoluto para o diretório de uploads
    const uploadDir = path.join(process.cwd(), "storage", "uploads");

    // Verificando se a pasta existe, se não, criando
    try {
      await fs.access(uploadDir);
    } catch (err) {
      await fs.mkdir(uploadDir, { recursive: true });
    }

    // Define o caminho final para o arquivo no diretório uploads
    const uploadPath = path.join(uploadDir, file.newFilename);

    // Move o arquivo para o diretório de uploads
    await fs.rename(file.filepath, uploadPath);

    res.status(200).json({
      message: "Upload realizado com sucesso",
      filename: file.originalFilename,
      path: uploadPath,
    });
  } catch (error) {
    console.error("Erro no upload:", error);
    res.status(500).json({ error: "Erro no upload do arquivo" });
  }
}
