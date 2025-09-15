import "./globals.css";

export const metadata = {
  title: "Inventário",
  description: "Aplicativo para controle de inventário",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-br">
      <body>
      {children}
      </body>
    </html>
  );
}
