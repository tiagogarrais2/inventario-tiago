import { CORES } from "./utils";

const ORDEM_CONSERVACAO = [
  "Novo",
  "Bom",
  "Regular",
  "Ocioso",
  "Recuperável",
  "Antieconômico",
  "Irrecuperável",
];

export function buildPieProgressoData(estatisticas) {
  return {
    labels: ["Inventariados", "Pendentes"],
    datasets: [
      {
        data: [
          estatisticas.itensInventariados,
          estatisticas.itensNaoInventariados,
        ],
        backgroundColor: ["#16a34a", "#dc2626"],
      },
    ],
  };
}

export function buildPieStatusData(itensPorStatus) {
  const labels = Object.keys(itensPorStatus);
  const values = Object.values(itensPorStatus);
  return {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: CORES.slice(0, labels.length),
      },
    ],
  };
}

export function buildBarSalasData(estatisticasPorSala) {
  const salasTop = [...estatisticasPorSala]
    .sort((a, b) => b.totalItens - a.totalItens)
    .slice(0, 5);
  return {
    salasTop,
    chartData: {
      labels: salasTop.map((s) =>
        s.nome.length > 20 ? s.nome.substring(0, 20) + "…" : s.nome
      ),
      datasets: [
        {
          label: "Inventariados",
          data: salasTop.map((s) => s.itensInventariados),
          backgroundColor: "#16a34a",
        },
        {
          label: "Pendentes",
          data: salasTop.map((s) => s.itensNaoInventariados),
          backgroundColor: "#dc2626",
        },
      ],
    },
  };
}

export function buildPieEstadoData(estadoConservacao) {
  const entriesOrdenados = Object.entries(estadoConservacao).sort(
    ([a], [b]) => {
      const ia = ORDEM_CONSERVACAO.findIndex(
        (o) => o.toLowerCase() === a.toLowerCase()
      );
      const ib = ORDEM_CONSERVACAO.findIndex(
        (o) => o.toLowerCase() === b.toLowerCase()
      );
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    }
  );
  const labels = entriesOrdenados.map(([k]) => k);
  const values = entriesOrdenados.map(([, v]) => v);
  return {
    entriesOrdenados,
    chartData: {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: CORES.slice(0, labels.length),
        },
      ],
    },
  };
}

export function buildBarMarcasData(topMarcas) {
  return {
    labels: topMarcas.map((m) =>
      m.nome.length > 25 ? m.nome.substring(0, 25) + "…" : m.nome
    ),
    datasets: [
      {
        label: "Quantidade de bens",
        data: topMarcas.map((m) => m.quantidade),
        backgroundColor: "#9333ea",
      },
    ],
  };
}

export const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: "top" } },
  scales: {
    x: { ticks: { maxRotation: 45, minRotation: 25, font: { size: 10 } } },
  },
};

export const pieOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: "right" } },
};
