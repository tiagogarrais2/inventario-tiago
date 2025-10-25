"use client";

import React, { useState, useEffect } from "react";

export default function TimerText({
  initialTime = 3,
  finalText = "Nenhum inventário disponível.",
}) {
  // Validações dos props
  const validatedInitialTime =
    typeof initialTime === "number" && initialTime > 0 ? initialTime : 3;
  const validatedFinalText = finalText || "Nenhum inventário disponível.";

  const [timeLeft, setTimeLeft] = useState(validatedInitialTime);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  if (timeLeft > 0) {
    return (
      <li style={{ color: "#666", fontStyle: "italic" }}>
        Carregando inventários... ({timeLeft}s)
      </li>
    );
  }

  // Se finalText for um componente React/JSX, renderiza diretamente
  if (React.isValidElement(validatedFinalText)) {
    return validatedFinalText;
  }

  // Caso contrário, renderiza como string em um <li>
  return <li>{validatedFinalText}</li>;
}
