'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

// Context para gerenciar as notificações
const NotificationContext = createContext();

// Hook para usar as notificações
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications deve ser usado dentro de NotificationProvider');
  }
  return context;
};

// Provider das notificações
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [confirmations, setConfirmations] = useState([]);

  const addNotification = useCallback((message, type = 'info', duration = 5000) => {
    const id = Date.now() + Math.random();
    const notification = { id, message, type, duration };
    
    setNotifications(prev => [...prev, notification]);
    
    // Remove automaticamente após o tempo especificado
    if (duration > 0) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(notification => notification.id !== id));
      }, duration);
    }
    
    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Métodos de conveniência
  const showSuccess = useCallback((message, duration) => addNotification(message, 'success', duration), [addNotification]);
  const showError = useCallback((message, duration) => addNotification(message, 'error', duration), [addNotification]);
  const showInfo = useCallback((message, duration) => addNotification(message, 'info', duration), [addNotification]);
  const showWarning = useCallback((message, duration) => addNotification(message, 'warning', duration), [addNotification]);

  // Métodos de confirmação
  const showConfirmation = useCallback((message, onConfirm, onCancel) => {
    const id = Date.now() + Math.random();
    
    const confirmation = {
      id,
      message,
      onConfirm: () => {
        onConfirm && onConfirm();
        setConfirmations(prev => prev.filter(conf => conf.id !== id));
      },
      onCancel: () => {
        onCancel && onCancel();
        setConfirmations(prev => prev.filter(conf => conf.id !== id));
      }
    };

    setConfirmations(prev => [...prev, confirmation]);
    return id;
  }, []);

  const showPrompt = useCallback((message, placeholder = "", onConfirm, onCancel) => {
    const id = Date.now() + Math.random();
    
    const prompt = {
      id,
      message,
      placeholder,
      isPrompt: true,
      onConfirm: (value) => {
        onConfirm && onConfirm(value);
        removeConfirmation(id);
      },
      onCancel: () => {
        onCancel && onCancel();
        removeConfirmation(id);
      }
    };

    setConfirmations(prev => [...prev, prompt]);
    return id;
  }, []);

  const removeConfirmation = useCallback((id) => {
    setConfirmations(prev => prev.filter(conf => conf.id !== id));
  }, []);

  const value = {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    showConfirmation,
    showPrompt
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationContainer />
      <ConfirmationContainer 
        confirmations={confirmations} 
        removeConfirmation={removeConfirmation} 
      />
    </NotificationContext.Provider>
  );
};

// Container que renderiza as notificações
const NotificationContainer = () => {
  const { notifications, removeNotification } = useNotifications();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
};

// Item individual de notificação
const NotificationItem = ({ notification, onClose }) => {
  const { type, message } = notification;

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500 border-green-600 text-white';
      case 'error':
        return 'bg-red-500 border-red-600 text-white';
      case 'warning':
        return 'bg-yellow-500 border-yellow-600 text-white';
      case 'info':
      default:
        return 'bg-blue-500 border-blue-600 text-white';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
      default:
        return 'ℹ';
    }
  };

  return (
    <div className={`
      flex items-center justify-between
      min-w-80 max-w-md p-4 rounded-lg border-l-4 shadow-lg
      transform transition-all duration-300 ease-in-out
      ${getTypeStyles()}
    `}>
      <div className="flex items-center space-x-3">
        <span className="text-lg font-bold">{getIcon()}</span>
        <span className="text-sm font-medium">{message}</span>
      </div>
      <button
        onClick={onClose}
        className="ml-4 text-white hover:text-gray-200 font-bold text-lg leading-none"
        aria-label="Fechar notificação"
      >
        ×
      </button>
    </div>
  );
};

// Hook para confirmações personalizadas
export const useConfirmation = () => {
  const [confirmations, setConfirmations] = useState([]);

  const showConfirmation = useCallback((message, onConfirm, onCancel) => {
    const id = Date.now() + Math.random();
    
    const confirmation = {
      id,
      message,
      onConfirm: () => {
        onConfirm && onConfirm();
        removeConfirmation(id);
      },
      onCancel: () => {
        onCancel && onCancel();
        removeConfirmation(id);
      }
    };

    setConfirmations(prev => [...prev, confirmation]);
    return id;
  }, []);

  const removeConfirmation = useCallback((id) => {
    setConfirmations(prev => prev.filter(conf => conf.id !== id));
  }, []);

  const showPrompt = useCallback((message, placeholder = "", onConfirm, onCancel) => {
    const id = Date.now() + Math.random();
    
    const prompt = {
      id,
      message,
      placeholder,
      isPrompt: true,
      onConfirm: (value) => {
        onConfirm && onConfirm(value);
        removeConfirmation(id);
      },
      onCancel: () => {
        onCancel && onCancel();
        removeConfirmation(id);
      }
    };

    setConfirmations(prev => [...prev, prompt]);
    return id;
  }, []);

  return { 
    confirmations, 
    showConfirmation, 
    showPrompt,
    ConfirmationContainer: () => (
      <ConfirmationContainer 
        confirmations={confirmations} 
        removeConfirmation={removeConfirmation} 
      />
    )
  };
};

// Container para confirmações
const ConfirmationContainer = ({ confirmations, removeConfirmation }) => {
  if (confirmations.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      {confirmations.map((confirmation) => (
        confirmation.isPrompt ? (
          <PromptDialog
            key={confirmation.id}
            {...confirmation}
          />
        ) : (
          <ConfirmationDialog
            key={confirmation.id}
            {...confirmation}
          />
        )
      ))}
    </div>
  );
};

// Componente de diálogo de confirmação
const ConfirmationDialog = ({ message, onConfirm, onCancel }) => {
  return (
    <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-xl max-w-md mx-4">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Confirmação</h3>
        <p className="text-sm text-gray-600 whitespace-pre-line">{message}</p>
      </div>
      <div className="flex justify-end space-x-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        >
          Confirmar
        </button>
      </div>
    </div>
  );
};

// Componente de diálogo de prompt
const PromptDialog = ({ message, placeholder, onConfirm, onCancel }) => {
  const [inputValue, setInputValue] = useState('');

  const handleConfirm = () => {
    onConfirm(inputValue);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleConfirm();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-xl max-w-md mx-4">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Confirmação</h3>
        <p className="text-sm text-gray-600 whitespace-pre-line mb-4">{message}</p>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
        />
      </div>
      <div className="flex justify-end space-x-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={handleConfirm}
          className="px-4 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        >
          Confirmar
        </button>
      </div>
    </div>
  );
};