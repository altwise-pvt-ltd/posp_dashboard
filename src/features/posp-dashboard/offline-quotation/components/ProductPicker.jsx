import CustomSelect from '@/features/dynamic-form/components/fields/CustomSelect';

const toOptions = (entries) =>
  entries.map((entry) => ({ value: entry.id ?? entry.code, text: entry.name }));

const PRODUCT_FIELD = {
  code: 'PRODUCT',
  label: 'Product',
  required: true,
  placeholder: 'Select a product',
  helperText: null,
};

const SUB_PRODUCT_FIELD = {
  code: 'SUB_PRODUCT',
  label: 'Sub-product',
  helperText: null,
};

function ProductPicker({
  products,
  subProducts,
  product,
  subProduct,
  productError = '',
  subProductError = '',
  onProductChange,
  onSubProductChange,
}) {
  const hasSubProducts = subProducts.length > 0;

  return (
    <div className="grid gap-gutter sm:grid-cols-2">
      <CustomSelect
        field={{ ...PRODUCT_FIELD, options: toOptions(products) }}
        value={product}
        error={productError}
        disabled={products.length === 0}
        onChange={onProductChange}
      />

      <CustomSelect
        field={{
          ...SUB_PRODUCT_FIELD,
          required: hasSubProducts,
          placeholder: hasSubProducts ? 'Select a sub-product' : 'Not applicable',
          options: toOptions(subProducts),
        }}
        value={subProduct}
        error={hasSubProducts ? subProductError : ''}
        disabled={!hasSubProducts}
        onChange={onSubProductChange}
      />
    </div>
  );
}

export default ProductPicker;
