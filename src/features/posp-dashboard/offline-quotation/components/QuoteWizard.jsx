import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Loader2, PackageOpen, RefreshCw, TriangleAlert } from 'lucide-react';
import { resolveVisibleSections } from '@/features/dynamic-form/lib/visibleSections';
import CustomButton from '@/shared/components/CustomButton';
import { findLobProducts, findProductSubProducts } from '../api/quoteCatalogApi';
import { useQuoteMetadata } from '../hooks/useQuoteMetadata';
import LobGrid from './LobGrid';
import ProductPicker from './ProductPicker';
import QuoteFormFields from './QuoteFormFields';
import QuoteNotice from './QuoteNotice';
import QuoteWizardFooter from './QuoteWizardFooter';
import QuoteWizardStepper from './QuoteWizardStepper';

const entryKey = (entry) => entry?.id ?? entry?.code ?? null;

const STEPS = [{ name: 'Line of business' }, { name: 'Product' }, { name: 'Quote details' }];

const FORM_STEP = 2;

function QuoteWizard({ catalog }) {
  const [lob, setLob] = useState('');
  const [product, setProduct] = useState('');
  const [subProduct, setSubProduct] = useState('');
  const [quoteScope, setQuoteScope] = useState(null);

  const [stepIndex, setStepIndex] = useState(0);
  const [furthestIndex, setFurthestIndex] = useState(0);
  const [catalogError, setCatalogError] = useState('');

  const topRef = useRef(null);
  const steppedRef = useRef(false);

  const {
    metadata,
    loading: metadataLoading,
    error: metadataError,
    retry: retryMetadata,
  } = useQuoteMetadata(quoteScope);

  const products = findLobProducts(catalog, lob);
  const subProducts = findProductSubProducts(catalog, lob, product);

  const selectedLob = catalog.find((entry) => entryKey(entry) === lob);
  const selectedProduct = products.find((entry) => entryKey(entry) === product);
  const selectedSubProduct = subProducts.find((entry) => entryKey(entry) === subProduct);

  const sections = useMemo(
    () => (metadata ? resolveVisibleSections(metadata.sections, metadata.directives) : []),
    [metadata]
  );

  useEffect(() => {
    if (!steppedRef.current) {
      steppedRef.current = true;
      return;
    }
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [stepIndex]);

  const goTo = (index) => {
    const next = Math.min(Math.max(index, 0), STEPS.length - 1);
    setCatalogError('');
    setStepIndex(next);
    setFurthestIndex((prev) => Math.max(prev, next));
  };

  const goBack = () => {
    setCatalogError('');
    setStepIndex((prev) => Math.max(0, prev - 1));
  };

  const jumpTo = (index) => {
    if (index <= furthestIndex) goTo(index);
  };

  const selectLob = (next) => {
    if (next !== lob) {
      setLob(next);
      setProduct('');
      setSubProduct('');
      setQuoteScope(null);
      setFurthestIndex(0);
    }

    if (findLobProducts(catalog, next).length === 0) {
      setCatalogError('No products are published under this line yet.');
      return;
    }

    goTo(1);
  };

  const selectProduct = (next) => {
    setProduct(next);
    setSubProduct('');
    setQuoteScope(null);
    setCatalogError('');
    setFurthestIndex(1);
  };

  const selectSubProduct = (next) => {
    setSubProduct(next);
    setQuoteScope(null);
    setCatalogError('');
    setFurthestIndex(1);
  };

  const continueFromProduct = () => {
    if (!product) {
      setCatalogError('Select a product to continue.');
      return;
    }
    if (subProducts.length > 0 && !subProduct) {
      setCatalogError('Select a sub-product to continue.');
      return;
    }

    if (!quoteScope) {
      setQuoteScope({
        productId: entryKey(selectedProduct),
        subProductId: entryKey(selectedSubProduct),
      });
    }

    goTo(FORM_STEP);
  };

  const scopeLabel = [selectedLob, selectedProduct, selectedSubProduct]
    .filter(Boolean)
    .map((entry) => entry.name)
    .join(' › ');

  const footerMessage = catalogError || scopeLabel || `Step ${stepIndex + 1} of ${STEPS.length}`;

  const renderStep = () => {
    if (stepIndex === 0) {
      return (
        <>
          <LobGrid lobs={catalog} selected={lob} onSelect={selectLob} />
          <QuoteWizardFooter
            message={catalogError || 'Pick a line of business to continue.'}
            invalid={Boolean(catalogError)}
          />
        </>
      );
    }

    if (stepIndex === 1) {
      return (
        <>
          {products.length === 0 ? (
            <p className="font-body-md text-body-md text-on-surface-variant">
              No products are published under this line yet.
            </p>
          ) : (
            <ProductPicker
              products={products}
              subProducts={subProducts}
              product={product}
              subProduct={subProduct}
              productError={!product ? catalogError : ''}
              subProductError={product ? catalogError : ''}
              onProductChange={selectProduct}
              onSubProductChange={selectSubProduct}
            />
          )}
          <QuoteWizardFooter
            message={footerMessage}
            invalid={Boolean(catalogError)}
            onBack={goBack}
          >
            <CustomButton
              variant="primary"
              size="md"
              rightIcon={<ArrowRight />}
              onClick={continueFromProduct}
            >
              Continue
            </CustomButton>
          </QuoteWizardFooter>
        </>
      );
    }

    if (metadataLoading) {
      return (
        <>
          <QuoteNotice
            icon={<Loader2 size={20} className="animate-spin" />}
            title="Building the form"
            body={`Fetching the questions for ${scopeLabel}.`}
          />
          <QuoteWizardFooter message={scopeLabel} onBack={goBack} />
        </>
      );
    }

    if (metadataError) {
      return (
        <>
          <QuoteNotice
            icon={<TriangleAlert size={20} />}
            title="Couldn't load the form"
            body={metadataError?.message || 'The questions for this product could not be fetched.'}
            action={
              <CustomButton
                variant="primary"
                size="md"
                leftIcon={<RefreshCw />}
                onClick={retryMetadata}
                className="mt-2"
              >
                Try again
              </CustomButton>
            }
          />
          <QuoteWizardFooter message={scopeLabel} onBack={goBack} />
        </>
      );
    }

    if (!metadata || sections.length === 0) {
      return (
        <>
          <QuoteNotice
            icon={<PackageOpen size={20} />}
            title="No questions configured"
            body={`The back office hasn't published a form for ${scopeLabel} yet.`}
          />
          <QuoteWizardFooter message={scopeLabel} onBack={goBack} />
        </>
      );
    }

    return (
      <QuoteFormFields
        key={`${metadata.productId}-${metadata.subProductId ?? ''}`}
        metadata={metadata}
        onBack={goBack}
      />
    );
  };

  return (
    <div ref={topRef} className="flex scroll-mt-4 flex-col gap-gutter">
      <QuoteWizardStepper
        steps={STEPS}
        current={stepIndex}
        furthest={furthestIndex}
        onJump={jumpTo}
      />

      <div key={stepIndex} className="anim-fade flex flex-col gap-gutter">
        {renderStep()}
      </div>
    </div>
  );
}

export default QuoteWizard;
