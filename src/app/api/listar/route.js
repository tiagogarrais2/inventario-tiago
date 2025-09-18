import fs from "fs";
import path from "path";

export async function GET(req, res) {
  const baseDir = path.join(process.cwd(), "public");
  let pastasComArquivos = [];

  try {
    const pastas = fs
      .readdirSync(baseDir, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);

    for (const pasta of pastas) {
      const cabecalhosPath = path.join(baseDir, pasta, "cabecalhos.json");
      const salasPath = path.join(baseDir, pasta, "salas.json");
      const inventarioPath = path.join(baseDir, pasta, "inventario.json");

      if (
        fs.existsSync(cabecalhosPath) &&
        fs.existsSync(salasPath) &&
        fs.existsSync(inventarioPath)
      ) {
        pastasComArquivos.push(pasta);
      }
    }

    return new Response(JSON.stringify({ pastas: pastasComArquivos }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
