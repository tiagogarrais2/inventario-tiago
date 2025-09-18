const fs = require('fs');

// Número de objetos que você quer gerar
const NUM_REGISTROS = 50;

function gerarDadoAleatorio(tipo) {
  switch (tipo) {
    case 'numero':
      return Math.floor(Math.random() * 100000) + 1;
    case 'data':
      const dia = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
      const mes = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
      const ano = Math.floor(Math.random() * 6) + 2019; // entre 2019 e 2024
      return `${dia}/${mes}/${ano}`;
    case 'valor':
      return (Math.random() * 1000 + 50).toFixed(2);
    case 'serie':
      return Math.random().toString(36).substring(2, 10).toUpperCase();
    case 'descricao':
      const descricoes = ["Impressora", "Monitor", "Teclado", "Mouse", "Switch de rede", "Servidor"];
      const desc = descricoes[Math.floor(Math.random() * descricoes.length)];
      return `${desc} - Modelo ${Math.floor(Math.random() * 9999)}.`;
    case 'nome_setor':
      const nomes = ["Jose", "Maria", "Carlos", "Ana"];
      const sobrenomes = ["Silva", "Santos", "Oliveira", "Souza"];
      const setores = ["TI", "RH", "Financeiro", "Logística"];
      const campus = ["Sede", "Filial A", "Filial B"];
      return `${nomes[Math.floor(Math.random() * nomes.length)]} ${sobrenomes[Math.floor(Math.random() * sobrenomes.length)]} (${setores[Math.floor(Math.random() * setores.length)]} - ${campus[Math.floor(Math.random() * campus.length)]})`;
    case 'estado':
      const estados = ["Bom", "Regular", "Ruim", "Inservível"];
      return estados[Math.floor(Math.random() * estados.length)];
    default:
      return Math.random().toString(36).substring(2, 8);
  }
}

const inventario = [];

for (let i = 1; i <= NUM_REGISTROS; i++) {
  const valorAquisicao = parseFloat(gerarDadoAleatorio('valor'));
  const valorDepreciado = (valorAquisicao * 0.1).toFixed(2);
  const cargaAtual = gerarDadoAleatorio('nome_setor');
  const partesCarga = cargaAtual.match(/\((.*?)\s-\s(.*?)\)/);

  inventario.push({
    "#": String(i),
    "NUMERO": String(gerarDadoAleatorio('numero')),
    "STATUS": "Ativo",
    "ED": `4490.${String(Math.floor(Math.random() * 99)).padStart(2, '0')}.${String(Math.floor(Math.random() * 99)).padStart(2, '0')}`,
    "CONTA CONTABIL": `12311.${String(Math.floor(Math.random() * 99)).padStart(2, '0')}.${String(Math.floor(Math.random() * 99)).padStart(2, '0')}`,
    "DESCRICAO": gerarDadoAleatorio('descricao'),
    "RÓTULOS": "-",
    "CARGA ATUAL": cargaAtual,
    "SETOR DO RESPONSÁVEL": partesCarga ? partesCarga[1] : "-",
    "CAMPUS DA CARGA": partesCarga ? partesCarga[2] : "-",
    "CARGA CONTÁBIL": `inventario carga contabil ${gerarDadoAleatorio('numero')}`,
    "VALOR AQUISIÇÃO": String(valorAquisicao),
    "VALOR DEPRECIADO": valorDepreciado,
    "NUMERO NOTA FISCAL": String(gerarDadoAleatorio('numero')),
    "NÚMERO DE SÉRIE": gerarDadoAleatorio('serie'),
    "DATA DA ENTRADA": gerarDadoAleatorio('data'),
    "DATA DA CARGA": gerarDadoAleatorio('data'),
    "FORNECEDOR": `Fornecedor ${gerarDadoAleatorio('serie')}`,
    "SALA": `SALA ${gerarDadoAleatorio()}`,
    "ESTADO DE CONSERVAÇÃO": gerarDadoAleatorio('estado'),
  });
}

const jsonString = JSON.stringify(inventario, null, 2);

fs.writeFile('inventario.json', jsonString, (err) => {
  if (err) {
    console.error("Erro ao salvar o arquivo:", err);
    return;
  }
  console.log(`Arquivo 'inventario.json' com ${NUM_REGISTROS} registros foi gerado com sucesso!`);
});
