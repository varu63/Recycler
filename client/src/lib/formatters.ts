export const listingName = (listing: {
  productName?: string;
  materialName?: string;
  materialType?: string;
}) => listing.productName || listing.materialName || listing.materialType || 'Material';

export const formatPrice = (_price: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(_price) + '/kg';

export const formatNumber = (num: number) => num.toLocaleString();
