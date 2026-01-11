import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'outline';
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  className = '', 
  ...props 
}) => {
  const baseStyles = "fun-font font-bold py-3 px-6 rounded-2xl transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_0_0_rgba(0,0,0,0.1)] active:shadow-none active:translate-y-1";
  
  const variants = {
    primary: "bg-blue-500 hover:bg-blue-600 text-white shadow-blue-700/20",
    secondary: "bg-yellow-400 hover:bg-yellow-500 text-yellow-900 shadow-yellow-600/20",
    success: "bg-green-500 hover:bg-green-600 text-white shadow-green-700/20",
    outline: "bg-white border-2 border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-500"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
