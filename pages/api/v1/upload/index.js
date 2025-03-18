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
    const form = new IncomingForm({
      keepExtensions: true,
    });

    // Processa o upload
    const [fields, files] = await form.parse(req);
    const file = files.file[0];

    if (!file) {
      return res.status(400).json({ error: "Nenhum arquivo enviado" });
    }

    // Criando um caminho absoluto para o diretório de uploads
    const uploadDir = path.join(process.cwd(), "storage", "uploads");

    // Verificando se a pasta existe, se não, criando
    await fs.mkdir(uploadDir, { recursive: true });

    // Caminho final para o arquivo no diretório de uploads
    const uploadPath = path.join(uploadDir, file.newFilename);

    // Usando copyFile ao invés de rename, para evitar o erro EXDEV
    await fs.copyFile(file.filepath, uploadPath);

    // Opcional: Remover o arquivo temporário após a cópia
    await fs.unlink(file.filepath);

    res.status(200).json({
      message: "Upload realizado com sucesso",
      filename: file.newFilename,
      path: uploadPath,
    });
  } catch (error) {
    console.error("Erro no upload:", error);
    res.status(500).json({ error: "Erro no upload do arquivo" });
  }
}
