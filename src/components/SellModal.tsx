import React from 'react';
import { ShoeProduct, ShoeColor, SaleOrder } from '../types';
import { CartModal } from './CartModal';

export interface SellModalProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedProduct?: ShoeProduct | null;
  preSelectedSize?: number;
  preSelectedColor?: ShoeColor;
  onSaleSuccess: (saleOrder: SaleOrder) => void;
}

export const SellModal: React.FC<SellModalProps> = (props) => {
  return <CartModal {...props} />;
};
