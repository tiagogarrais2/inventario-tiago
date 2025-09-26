import "./globals.css";
import Cabecalho from "./components/Cabecalho";
import Providers from "./components/Providers";

export const metadata = {
  title: "Inventário Tiago",
  description: "Aplicativo para controle de inventário",
  icons: {
    icon: "/favicon-32x32.png", // Ícone padrão
    shortcut: "/favicon-16x16.png", // Atalho para navegadores antigos
    apple: "/apple-touch-icon.png", // Ícone para dispositivos Apple
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-br">
      <body>
        <Providers>
          <Cabecalho />
          {children}
        </Providers>
      </body>
    </html>
  );
}
