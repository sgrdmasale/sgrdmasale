import React, { useEffect, useMemo, useState } from 'react';

import { Helmet } from 'react-helmet';

import { useSearchParams } from 'react-router-dom';

import {
  Search,
  X,
  SlidersHorizontal,
} from 'lucide-react';

import pb from '@/lib/pocketbaseClient.js';

import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import {
  Card,
  CardContent,
} from '@/components/ui/card';

import { Skeleton } from '@/components/ui/skeleton';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { useCart } from '@/hooks/useCart.jsx';

import { toast } from 'sonner';

import ProductCard from '@/components/ProductCard.jsx';


// ======================================================
// PRODUCT CATALOG
// ======================================================

const ProductCatalog = () => {

  // ====================================================
  // URL
  // ====================================================

  const [
    searchParams,
    setSearchParams,
  ] = useSearchParams();


  // ====================================================
  // CART
  // ====================================================

  const {
    addToCart,
  } = useCart();


  // ====================================================
  // STATE
  // ====================================================

  const [
    allProducts,
    setAllProducts,
  ] = useState([]);

  const [
    categories,
    setCategories,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    categoryLoading,
    setCategoryLoading,
  ] = useState(true);

  const [
    searchQuery,
    setSearchQuery,
  ] = useState(
    searchParams.get('search') || ''
  );

  const [
    selectedCategory,
    setSelectedCategory,
  ] = useState('all');

  const [
    sortBy,
    setSortBy,
  ] = useState('newest');


  // ====================================================
  // NORMALIZE TEXT
  // ====================================================

  const normalizeText = (value) => {

    if (
      value === null ||
      value === undefined
    ) {
      return '';
    }

    return String(value)
      .normalize('NFD')
      .replace(
        /[\u0300-\u036f]/g,
        ''
      )
      .replace(
        /<[^>]*>/g,
        ' '
      )
      .replace(
        /\s+/g,
        ' '
      )
      .trim()
      .toLowerCase();

  };


  // ====================================================
  // FETCH CATEGORIES
  // ====================================================

  useEffect(() => {

    const fetchCategories = async () => {

      try {

        setCategoryLoading(true);


        const result =
          await pb
            .collection('categories')
            .getFullList({
              sort: 'name',
              $autoCancel: false,
            });


        /*
         * Support both:
         *
         * category.name
         *
         * and
         *
         * category.title
         *
         */

        const normalizedCategories =
          result
            .map((category) => ({
              ...category,

              displayName:
                category?.name ||
                category?.title ||
                'Unnamed Category',
            }))
            .sort((a, b) =>
              a.displayName
                .localeCompare(
                  b.displayName
                )
            );


        console.log(
          '[Categories] Loaded:',
          normalizedCategories
        );


        setCategories(
          normalizedCategories
        );

      } catch (error) {

        console.error(
          '[Categories] Failed to load:',
          error
        );

        setCategories([]);

        toast.error(
          'Failed to load categories'
        );

      } finally {

        setCategoryLoading(false);

      }

    };


    fetchCategories();

  }, []);


  // ====================================================
  // FETCH ALL ACTIVE PRODUCTS
  // ====================================================

  useEffect(() => {

    const fetchProducts = async () => {

      try {

        setLoading(true);


        /*
         * IMPORTANT:
         *
         * We load products WITHOUT category/search
         * filtering here.
         *
         * Filtering happens locally.
         *
         * This makes:
         *
         * Search
         * Category
         * Sort
         *
         * work together reliably.
         */

        const result =
          await pb
            .collection('products')
            .getFullList({

              filter:
                '(isDeleted = false || isDeleted = null) && status = true',

              sort: '-created',

              expand: 'category_id',

              $autoCancel: false,

            });


        console.log(
          '[Products] Loaded:',
          result.length
        );


        setAllProducts(result);

      } catch (error) {

        console.error(
          '[Products] Failed to load:',
          error
        );

        setAllProducts([]);

        toast.error(
          'Failed to load products'
        );

      } finally {

        setLoading(false);

      }

    };


    fetchProducts();

  }, []);


  // ====================================================
  // KEEP SEARCH IN SYNC WITH URL
  // ====================================================

  useEffect(() => {

    const urlSearch =
      searchParams.get('search') || '';


    if (
      urlSearch !==
      searchQuery
    ) {

      setSearchQuery(
        urlSearch
      );

    }

  }, [searchParams]);


  // ====================================================
  // FILTER + SEARCH + SORT
  // ====================================================

  const filteredProducts =
    useMemo(() => {

      let result =
        [...allProducts];


      // ================================================
      // SEARCH
      // ================================================

      const query =
        normalizeText(
          searchQuery
        );


      if (query) {

        result =
          result.filter(
            (product) => {

              const name =
                normalizeText(
                  product?.name
                );


              const description =
                normalizeText(
                  product?.description
                );


              const sku =
                normalizeText(
                  product?.sku
                );


              const categoryName =
                normalizeText(
                  product
                    ?.expand
                    ?.category_id
                    ?.name ||
                    product
                      ?.expand
                      ?.category_id
                      ?.title
                );


              const words =
                query
                  .split(/\s+/)
                  .filter(Boolean);


              /*
               * Complete query match
               */

              if (
                name.includes(query) ||
                description.includes(query) ||
                sku.includes(query) ||
                categoryName.includes(query)
              ) {
                return true;
              }


              /*
               * Individual word match
               */

              return words.some(
                (word) =>
                  name.includes(word) ||
                  description.includes(word) ||
                  sku.includes(word) ||
                  categoryName.includes(word)
              );

            }
          );

      }


      // ================================================
      // CATEGORY
      // ================================================

      if (
        selectedCategory !== 'all'
      ) {

        result =
          result.filter(
            (product) => {

              /*
               * Main relation field
               */

              const productCategory =
                product?.category_id;


              /*
               * Expanded relation
               */

              const expandedCategory =
                product
                  ?.expand
                  ?.category_id;


              /*
               * Extract IDs
               */

              const categoryId =
                expandedCategory?.id ||
                productCategory ||
                '';


              /*
               * Support relation values that
               * may be arrays.
               */

              if (
                Array.isArray(
                  productCategory
                )
              ) {

                return productCategory
                  .includes(
                    selectedCategory
                  );

              }


              return (
                categoryId ===
                selectedCategory
              );

            }
          );

      }


      // ================================================
      // SORT
      // ================================================

      if (
        sortBy === 'newest'
      ) {

        result.sort(
          (a, b) =>
            new Date(
              b.created
            ) -
            new Date(
              a.created
            )
        );

      }


      if (
        sortBy === 'price-low'
      ) {

        result.sort(
          (a, b) =>
            Number(
              a?.price || 0
            ) -
            Number(
              b?.price || 0
            )
        );

      }


      if (
        sortBy === 'price-high'
      ) {

        result.sort(
          (a, b) =>
            Number(
              b?.price || 0
            ) -
            Number(
              a?.price || 0
            )
        );

      }


      if (
        sortBy === 'name'
      ) {

        result.sort(
          (a, b) =>
            String(
              a?.name || ''
            ).localeCompare(
              String(
                b?.name || ''
              )
            )
        );

      }


      return result;

    }, [
      allProducts,
      searchQuery,
      selectedCategory,
      sortBy,
    ]);


  // ====================================================
  // SEARCH SUBMIT
  // ====================================================

  const handleSearch = (event) => {

    event.preventDefault();

    const query =
      searchQuery.trim();


    if (query) {

      setSearchParams(
        (previous) => {

          const next =
            new URLSearchParams(
              previous
            );

          next.set(
            'search',
            query
          );

          return next;

        }
      );

    } else {

      setSearchParams(
        (previous) => {

          const next =
            new URLSearchParams(
              previous
            );

          next.delete(
            'search'
          );

          return next;

        }
      );

    }

  };


  // ====================================================
  // LIVE SEARCH
  // ====================================================

  useEffect(() => {

    const timer =
      setTimeout(() => {

        const query =
          searchQuery.trim();

        const currentSearch =
          searchParams.get(
            'search'
          ) || '';


        if (
          query ===
          currentSearch
        ) {
          return;
        }


        setSearchParams(
          (previous) => {

            const next =
              new URLSearchParams(
                previous
              );


            if (query) {

              next.set(
                'search',
                query
              );

            } else {

              next.delete(
                'search'
              );

            }


            return next;

          },

          {
            replace: true,
          }
        );

      }, 300);


    return () =>
      clearTimeout(timer);

  }, [
    searchQuery,
    searchParams,
    setSearchParams,
  ]);


  // ====================================================
  // CATEGORY CHANGE
  // ====================================================

  const handleCategoryChange = (
    categoryId
  ) => {

    setSelectedCategory(
      categoryId
    );

  };


  // ====================================================
  // CLEAR ALL FILTERS
  // ====================================================

  const clearFilters = () => {

    setSearchQuery('');

    setSelectedCategory(
      'all'
    );

    setSortBy(
      'newest'
    );

    setSearchParams({});

  };


  // ====================================================
  // ADD TO CART
  // ====================================================

  const handleAddToCart = (
    product,
    priceToUse
  ) => {

    addToCart(
      {
        ...product,
        price: priceToUse,
      },
      1
    );


    toast.success(
      `${product.name} added to cart`
    );

  };


  // ====================================================
  // CHECK IF FILTERS ARE ACTIVE
  // ====================================================

  const hasActiveFilters =
    Boolean(
      searchQuery.trim()
    ) ||
    selectedCategory !== 'all' ||
    sortBy !== 'newest';


  // ====================================================
  // RENDER
  // ====================================================

  return (
    <>

      {/* =================================================
          SEO
      ================================================= */}

      <Helmet>

        <title>
          Shop Premium Spices - SGRD
        </title>

        <meta
          name="description"
          content="Browse our complete collection of premium Indian spices."
        />

      </Helmet>


      {/* =================================================
          HEADER
      ================================================= */}

      <Header />


      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <div
        className="
          max-w-7xl
          mx-auto

          px-4
          sm:px-6
          lg:px-8

          py-12
        "
      >

        {/* =================================================
            PAGE TITLE
        ================================================= */}

        <div className="mb-8">

          <h1
            className="
              text-4xl
              md:text-5xl

              font-bold

              mb-4
            "
            style={{
              letterSpacing:
                '-0.02em',
            }}
          >
            Shop premium spices
          </h1>


          <p
            className="
              text-lg

              text-muted-foreground

              max-w-2xl
            "
          >
            Explore our complete collection
            of authentic Indian spices,
            sourced directly from trusted
            farmers
          </p>

        </div>


        {/* =================================================
            FILTER BAR
        ================================================= */}

        <div
          className="
            grid

            grid-cols-1

            lg:grid-cols-4

            gap-4

            mb-8
          "
        >

          {/* =================================================
              SEARCH
          ================================================= */}

          <form
            onSubmit={
              handleSearch
            }

            className="
              lg:col-span-2
            "
          >

            <div className="relative">

              <Search
                className="
                  absolute

                  left-3

                  top-1/2

                  -translate-y-1/2

                  w-5
                  h-5

                  text-muted-foreground

                  pointer-events-none
                "
              />


              <Input
                type="text"

                placeholder="Search spices..."

                value={searchQuery}

                onChange={(event) =>
                  setSearchQuery(
                    event.target.value
                  )
                }

                autoComplete="off"

                className="
                  pl-10

                  pr-10

                  h-12

                  text-foreground

                  placeholder:text-muted-foreground

                  bg-background

                  rounded-xl

                  border-border/60

                  focus-visible:ring-primary
                "
              />


              {/* CLEAR SEARCH */}

              {searchQuery && (

                <button
                  type="button"

                  onClick={() =>
                    setSearchQuery(
                      ''
                    )
                  }

                  className="
                    absolute

                    right-3

                    top-1/2

                    -translate-y-1/2

                    w-7
                    h-7

                    rounded-full

                    flex
                    items-center
                    justify-center

                    text-muted-foreground

                    hover:bg-muted

                    hover:text-foreground

                    transition
                  "
                >

                  <X
                    className="
                      w-4
                      h-4
                    "
                  />

                </button>

              )}

            </div>

          </form>


          {/* =================================================
              CATEGORY
          ================================================= */}

          <Select
            value={
              selectedCategory
            }

            onValueChange={
              handleCategoryChange
            }

            disabled={
              categoryLoading
            }
          >

            <SelectTrigger
              className="
                h-12

                bg-background

                rounded-xl

                border-border/60
              "
            >

              <div
                className="
                  flex
                  items-center
                  gap-2
                "
              >

                <SlidersHorizontal
                  className="
                    w-4
                    h-4
                    text-muted-foreground
                  "
                />

                <SelectValue
                  placeholder={
                    categoryLoading
                      ? 'Loading categories...'
                      : 'All Categories'
                  }
                />

              </div>

            </SelectTrigger>


            <SelectContent>

              <SelectItem
                value="all"
              >
                All Categories
              </SelectItem>


              {categories.map(
                (category) => (

                  <SelectItem
                    key={category.id}
                    value={category.id}
                  >
                    {category.displayName}
                  </SelectItem>

                )
              )}

            </SelectContent>

          </Select>


          {/* =================================================
              SORT
          ================================================= */}

          <Select
            value={sortBy}

            onValueChange={
              setSortBy
            }
          >

            <SelectTrigger
              className="
                h-12

                bg-background

                rounded-xl

                border-border/60
              "
            >

              <SelectValue
                placeholder="Sort By"
              />

            </SelectTrigger>


            <SelectContent>

              <SelectItem
                value="newest"
              >
                Newest First
              </SelectItem>

              <SelectItem
                value="price-low"
              >
                Price: Low to High
              </SelectItem>

              <SelectItem
                value="price-high"
              >
                Price: High to Low
              </SelectItem>

              <SelectItem
                value="name"
              >
                Name: A to Z
              </SelectItem>

            </SelectContent>

          </Select>

        </div>


        {/* =================================================
            ACTIVE FILTER INFO
        ================================================= */}

        {!loading &&
          hasActiveFilters && (

            <div
              className="
                flex
                flex-wrap

                items-center

                gap-2

                mb-6
              "
            >

              {searchQuery.trim() && (

                <span
                  className="
                    inline-flex
                    items-center
                    gap-2

                    px-3
                    py-1.5

                    rounded-full

                    bg-primary/10

                    text-sm

                    text-primary

                    font-medium
                  "
                >
                  Search: "{searchQuery}"

                  <button
                    type="button"

                    onClick={() =>
                      setSearchQuery(
                        ''
                      )
                    }
                  >
                    <X
                      className="
                        w-3.5
                        h-3.5
                      "
                    />
                  </button>

                </span>

              )}


              {selectedCategory !==
                'all' && (

                <span
                  className="
                    inline-flex
                    items-center
                    gap-2

                    px-3
                    py-1.5

                    rounded-full

                    bg-primary/10

                    text-sm

                    text-primary

                    font-medium
                  "
                >

                  Category:{' '}

                  {
                    categories.find(
                      (category) =>
                        category.id ===
                        selectedCategory
                    )
                      ?.displayName ||
                    'Selected'
                  }


                  <button
                    type="button"

                    onClick={() =>
                      setSelectedCategory(
                        'all'
                      )
                    }
                  >

                    <X
                      className="
                        w-3.5
                        h-3.5
                      "
                    />

                  </button>

                </span>

              )}


              {hasActiveFilters && (

                <button
                  type="button"

                  onClick={
                    clearFilters
                  }

                  className="
                    text-sm

                    font-medium

                    text-muted-foreground

                    hover:text-foreground

                    underline

                    underline-offset-4

                    ml-1
                  "
                >
                  Clear all
                </button>

              )}

            </div>

          )}


        {/* =================================================
            LOADING
        ================================================= */}

        {loading ? (

          <div
            className="
              grid

              grid-cols-1
              sm:grid-cols-2
              lg:grid-cols-3
              xl:grid-cols-4

              gap-6
            "
          >

            {[
              1,
              2,
              3,
              4,
              5,
              6,
              7,
              8,
            ].map((i) => (

              <Card
                key={i}

                className="
                  border-border/50

                  rounded-2xl

                  overflow-hidden

                  shadow-sm
                "
              >

                <Skeleton
                  className="
                    w-full
                    h-64

                    rounded-none
                  "
                />


                <CardContent
                  className="p-6"
                >

                  <Skeleton
                    className="
                      h-6
                      w-3/4

                      mb-2
                    "
                  />

                  <Skeleton
                    className="
                      h-4
                      w-full

                      mb-2
                    "
                  />

                  <Skeleton
                    className="
                      h-4
                      w-2/3

                      mb-4
                    "
                  />

                  <Skeleton
                    className="
                      h-10
                      w-full

                      rounded-xl
                    "
                  />

                </CardContent>

              </Card>

            ))}

          </div>

        ) : filteredProducts.length === 0 ? (

          /* =================================================
              NO RESULTS
          ================================================= */

          <div
            className="
              text-center

              py-20

              border
              border-dashed
              border-border/60

              rounded-2xl

              bg-muted/10
            "
          >

            <div
              className="
                w-16
                h-16

                bg-muted

                rounded-full

                flex
                items-center
                justify-center

                mx-auto
                mb-4
              "
            >

              <Search
                className="
                  w-8
                  h-8

                  text-muted-foreground
                "
              />

            </div>


            <h3
              className="
                text-xl

                font-semibold

                mb-2
              "
            >
              No products found
            </h3>


            <p
              className="
                text-muted-foreground

                mb-6
              "
            >
              Try changing your search or
              category filter.
            </p>


            <Button
              className="
                rounded-xl

                px-8
              "

              onClick={
                clearFilters
              }
            >
              Clear Filters
            </Button>

          </div>

        ) : (

          /* =================================================
              PRODUCTS
          ================================================= */

          <>

            {/* RESULT COUNT */}

            <div
              className="
                mb-4

                text-sm

                text-muted-foreground

                font-medium

                flex
                items-center
              "
            >

              <span
                className="
                  w-2
                  h-2

                  rounded-full

                  bg-primary

                  mr-2
                "
              />


              Showing{' '}

              <span
                className="
                  text-foreground

                  font-semibold

                  mx-1
                "
              >
                {filteredProducts.length}
              </span>

              active{' '}

              {filteredProducts.length === 1
                ? 'product'
                : 'products'}


              {searchQuery.trim() && (
                <>
                  {' '}for{' '}

                  <span
                    className="
                      text-foreground

                      font-semibold

                      ml-1
                    "
                  >
                    "{searchQuery}"
                  </span>
                </>
              )}

            </div>


            {/* PRODUCT GRID */}

            <div
              className="
                grid

                grid-cols-1
                sm:grid-cols-2
                lg:grid-cols-3
                xl:grid-cols-4

                gap-6
              "
            >

              {filteredProducts.map(
                (product) => (

                  <ProductCard
                    key={product.id}

                    product={product}

                    onAddToCart={
                      handleAddToCart
                    }
                  />

                )
              )}

            </div>

          </>

        )}

      </div>


      {/* =================================================
          FOOTER
      ================================================= */}

      <Footer />

    </>
  );
};


export default ProductCatalog;