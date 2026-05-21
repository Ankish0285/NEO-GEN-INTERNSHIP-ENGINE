import React from 'react';
import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className,
  isLoading,
  disabled,
  type = 'button',
  ...props
}) => {
  const variants = {
    primary: 'neo-btn neo-btn-primary',
    secondary: 'neo-btn neo-btn-ghost',
    success: 'neo-btn neo-btn-success',
    outline: 'neo-btn neo-btn-ghost border border-[#111827]/10',
    danger: 'neo-btn bg-red-600 text-white hover:bg-red-700 shadow-md',
    ghost: 'neo-btn neo-btn-ghost !min-h-0 !px-3 !py-2',
  };

  const sizes = {
    sm: '!min-h-[36px] !px-3 !py-1.5 text-sm',
    md: '',
    lg: '!min-h-[52px] !px-8 text-base',
  };

  return (
    <button
      type={type}
      className={clsx(variants[variant] || variants.primary, sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
};

export default Button;
