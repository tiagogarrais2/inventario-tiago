"use client";
import React, { useState } from "react";

export default function Button({
  children,
  onClick,
  disabled = false,
  style = {},
  className = "",
  disableTime = 5000,
  ...props
}) {
  const [isDisabled, setIsDisabled] = useState(false);

  const handleClick = (event) => {
    // Se já está desabilitado por prop externa, previne a ação
    if (disabled) {
      event.preventDefault();
      return;
    }

    // Se já está no timeout de bloqueio, previne apenas se não for submit
    if (isDisabled && props.type !== "submit") {
      event.preventDefault();
      return;
    }

    // Aplica o bloqueio visual
    setIsDisabled(true);

    // Executa a função onClick se existir
    if (onClick) {
      onClick(event);
    }

    // Reabilita o botão após o tempo especificado
    setTimeout(() => {
      setIsDisabled(false);
    }, disableTime);
  };

  // Para botões de submit, nunca desabilita fisicamente durante o timeout
  const isButtonDisabled = disabled;

  return (
    <button
      {...props}
      onClick={handleClick}
      disabled={isButtonDisabled}
      className={className}
      style={{
        opacity: disabled || isDisabled ? 0.5 : 1,
        cursor: disabled || isDisabled ? "not-allowed" : "pointer",
        transition: "opacity 0.2s ease",
        ...style,
      }}
    >
      {children}
    </button>
  );
}
