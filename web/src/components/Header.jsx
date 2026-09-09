import React, { useEffect, useRef, useState } from 'react';

import {
  Link,
  useNavigate,
  useLocation,
} from 'react-router-dom';

import {
  Search,
  ShoppingCart,
  User,
  Menu,
  X,
  LogOut,
  Package,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext.jsx';
import { useCart } from '@/hooks/useCart.jsx';
import { useCartSidebar } from '@/contexts/CartSidebarContext.jsx';

import PromotionalStripe from '@/components/PromotionalStripe.jsx';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import pb from '@/lib/pocketbaseClient.js';


// ======================================================
// HEADER COMPONENT
// ======================================================

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    isAuthenticated,
    isAdmin,
    logout,
  } = useAuth();

  const {
    getCartItemCount,
  } = useCart();

  const {
    toggleCart,
  } = useCartSidebar();


  // ======================================================
  // STATE
  // ======================================================

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  const [searchQuery, setSearchQuery] =
    useState('');

  const [searchResults, setSearchResults] =
    useState([]);

  const [searchLoading, setSearchLoading] =
    useState(false);

  const [showSearchResults, setShowSearchResults] =
    useState(false);

  const [hasPromo, setHasPromo] =
    useState(false);


  // Refs used for outside click
  const desktopSearchRef = useRef(null);
  const mobileSearchRef = useRef(null);


  const cartItemCount =
    getCartItemCount() || 0;


  // ======================================================
  // HELPER - NORMALIZE SEARCH TEXT
  // ======================================================

  const normalizeText = (value) => {
    if (
      value === null ||
      value === undefined
    ) {
      return '';
    }

    return String(value)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  };


  // ======================================================
  // LIVE PRODUCT SEARCH
  // ======================================================

  useEffect(() => {
    const query =
      normalizeText(searchQuery);


    // Empty search
    if (!query) {
      setSearchResults([]);
      setShowSearchResults(false);
      setSearchLoading(false);
      return;
    }


    // Show dropdown
    setShowSearchResults(true);
    setSearchLoading(true);


    // Debounce search
    const timer = setTimeout(
      async () => {

        try {

          /*
           * IMPORTANT
           * -----------------------------------------------
           * We use the SAME PocketBase collection as
           * ProductCatalog.jsx.
           *
           * ProductCatalog currently uses:
           *
           * pb.collection('products').getFullList(...)
           *
           * Therefore Header must search the same source.
           */

          const products =
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
            '[Header Search] Products loaded:',
            products.length
          );


          // =================================================
          // SEARCH AND RANK PRODUCTS
          // =================================================

          const results =
            products

              .map((product) => {

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
                      ?.name
                  );


                let score = 0;


                // -----------------------------------------
                // EXACT PRODUCT NAME
                // -----------------------------------------

                if (
                  name === query
                ) {
                  score += 1000;
                }


                // -----------------------------------------
                // PRODUCT NAME STARTS WITH SEARCH
                // -----------------------------------------

                if (
                  name.startsWith(query)
                ) {
                  score += 700;
                }


                // -----------------------------------------
                // PRODUCT NAME CONTAINS SEARCH
                // -----------------------------------------

                if (
                  name.includes(query)
                ) {
                  score += 500;
                }


                // -----------------------------------------
                // SKU
                // -----------------------------------------

                if (
                  sku &&
                  sku.includes(query)
                ) {
                  score += 300;
                }


                // -----------------------------------------
                // CATEGORY
                // -----------------------------------------

                if (
                  categoryName &&
                  categoryName.includes(query)
                ) {
                  score += 200;
                }


                // -----------------------------------------
                // DESCRIPTION
                // -----------------------------------------

                if (
                  description &&
                  description.includes(query)
                ) {
                  score += 100;
                }


                // -----------------------------------------
                // WORD-BY-WORD MATCHING
                // -----------------------------------------

                const words =
                  query
                    .split(/\s+/)
                    .filter(Boolean);


                words.forEach(
                  (word) => {

                    if (
                      name.includes(word)
                    ) {
                      score += 120;
                    }

                    if (
                      categoryName.includes(word)
                    ) {
                      score += 60;
                    }

                    if (
                      description.includes(word)
                    ) {
                      score += 30;
                    }

                    if (
                      sku.includes(word)
                    ) {
                      score += 40;
                    }

                  }
                );


                return {
                  ...product,
                  searchScore: score,
                };

              })

              // Only matched products
              .filter(
                (product) =>
                  product.searchScore > 0
              )

              // Highest relevance first
              .sort(
                (a, b) =>
                  b.searchScore -
                  a.searchScore
              )

              // Only show top 6
              .slice(0, 6);


          console.log(
            '[Header Search] Query:',
            query
          );

          console.log(
            '[Header Search] Results:',
            results.map(
              (product) =>
                product.name
            )
          );


          setSearchResults(results);

        } catch (error) {

          console.error(
            '[Header Search] Failed:',
            error
          );

          setSearchResults([]);

        } finally {

          setSearchLoading(false);

        }

      },
      250
    );


    return () => {
      clearTimeout(timer);
    };

  }, [searchQuery]);


  // ======================================================
  // CLOSE SEARCH WHEN CLICKING OUTSIDE
  // ======================================================

  useEffect(() => {

    const handleClickOutside = (
      event
    ) => {

      const desktopInside =
        desktopSearchRef.current?.contains(
          event.target
        );

      const mobileInside =
        mobileSearchRef.current?.contains(
          event.target
        );


      if (
        !desktopInside &&
        !mobileInside
      ) {
        setShowSearchResults(false);
      }

    };


    document.addEventListener(
      'mousedown',
      handleClickOutside
    );


    return () => {

      document.removeEventListener(
        'mousedown',
        handleClickOutside
      );

    };

  }, []);


  // ======================================================
  // SEARCH SUBMIT
  // ======================================================

  const handleSearch = (event) => {

    event.preventDefault();

    const query =
      searchQuery.trim();


    if (!query) {
      return;
    }


    setShowSearchResults(false);

    setMobileMenuOpen(false);

    navigate(
      `/shop?search=${encodeURIComponent(
        query
      )}`
    );

    setSearchQuery('');

  };


  // ======================================================
  // PRODUCT CLICK
  // ======================================================

  const handleProductClick = (
    product
  ) => {

    if (!product?.id) {
      return;
    }


    setSearchQuery('');

    setSearchResults([]);

    setShowSearchResults(false);

    setMobileMenuOpen(false);


    /*
     * Product Detail Route
     */
    navigate(
      `/product/${product.id}`
    );

  };


  // ======================================================
  // CLEAR SEARCH
  // ======================================================

  const clearSearch = () => {

    setSearchQuery('');

    setSearchResults([]);

    setShowSearchResults(false);

  };


  // ======================================================
  // LOGOUT
  // ======================================================

  const handleLogout = () => {

    logout();

    navigate('/');

  };


  // ======================================================
  // NAVIGATION LINKS
  // ======================================================

  const navLinks = [
    {
      path: '/',
      label: 'Home',
    },
    {
      path: '/shop',
      label: 'Products',
    },
    {
      path: '/about',
      label: 'Our Story',
    },
    {
      path: '/contact',
      label: 'Contact',
    },
  ];


  const isActive = (path) =>
    location.pathname === path;


  // ======================================================
  // PRODUCT IMAGE
  // ======================================================

  const getProductImage = (
    product
  ) => {

    if (!product?.image) {
      return null;
    }


    try {

      return pb.files.getURL(
        product,
        product.image
      );

    } catch (error) {

      console.error(
        '[Header] Image URL error:',
        error
      );

      return null;

    }

  };


  // ======================================================
  // PRODUCT PRICE
  // ======================================================

  const getProductPrice = (
    product
  ) => {

    if (
      product?.price === null ||
      product?.price === undefined
    ) {
      return '';
    }


    const numericPrice =
      Number(product.price);


    if (
      Number.isNaN(numericPrice)
    ) {
      return '';
    }


    return `₹${numericPrice.toFixed(2)}`;

  };


  // ======================================================
  // SEARCH DROPDOWN
  // ======================================================

  const SearchDropdown = () => {

    if (
      !showSearchResults ||
      !searchQuery.trim()
    ) {
      return null;
    }


    return (

      <div
        className="
          absolute
          top-[calc(100%+10px)]
          left-0
          right-0

          bg-background

          border
          border-border/60

          rounded-2xl

          shadow-xl

          overflow-hidden

          z-[9999]

          animate-in
          fade-in
          slide-in-from-top-2

          duration-200
        "
      >

        {/* =================================================
            SEARCH LOADING
        ================================================= */}

        {searchLoading && (

          <div
            className="
              p-6
              text-center
            "
          >

            <div
              className="
                w-6
                h-6

                mx-auto

                border-2
                border-primary
                border-t-transparent

                rounded-full

                animate-spin
              "
            />

            <p
              className="
                mt-3

                text-sm

                text-muted-foreground
              "
            >
              Searching products...
            </p>

          </div>

        )}


        {/* =================================================
            PRODUCTS FOUND
        ================================================= */}

        {!searchLoading &&
          searchResults.length > 0 && (

            <div>

              {/* Dropdown header */}

              <div
                className="
                  flex
                  items-center
                  justify-between

                  px-4
                  pt-4
                  pb-2
                "
              >

                <p
                  className="
                    text-xs

                    font-semibold

                    uppercase

                    tracking-wider

                    text-muted-foreground
                  "
                >
                  Products
                </p>


                <span
                  className="
                    text-xs

                    text-muted-foreground
                  "
                >
                  {searchResults.length}
                </span>

              </div>


              {/* Product results */}

              <div
                className="
                  px-2
                  pb-2

                  max-h-[420px]

                  overflow-y-auto
                  
                  [scrollbar-width:none]
    [-ms-overflow-style:none]

    [&::-webkit-scrollbar]:hidden
                "
              >

                {searchResults.map(
                  (product) => {

                    const image =
                      getProductImage(
                        product
                      );

                    const productName =
                      product?.name ||
                      'Product';

                    const productPrice =
                      getProductPrice(
                        product
                      );

                    const category =
                      product
                        ?.expand
                        ?.category_id
                        ?.name ||
                      '';


                    return (

                      <button
                        type="button"

                        key={product.id}

                        onClick={() =>
                          handleProductClick(
                            product
                          )
                        }

                        className="
                          w-full

                          flex
                          items-center
                          gap-3

                          p-2

                          rounded-xl

                          text-left

                          hover:bg-muted/80

                          active:scale-[0.99]

                          transition-all
                          duration-150

                          group
                        "
                      >

                        {/* Product image */}

                        <div
                          className="
                            w-14
                            h-14

                            flex-shrink-0

                            rounded-xl

                            overflow-hidden

                            bg-muted

                            border
                            border-border/50
                          "
                        >

                          {image ? (

                            <img
                              src={image}

                              alt={productName}

                              loading="lazy"

                              className="
                                w-full
                                h-full

                                object-cover

                                group-hover:scale-105

                                transition-transform
                                duration-200
                              "
                            />

                          ) : (

                            <div
                              className="
                                w-full
                                h-full

                                flex
                                items-center
                                justify-center
                              "
                            >

                              <Package
                                className="
                                  w-5
                                  h-5

                                  text-muted-foreground
                                "
                              />

                            </div>

                          )}

                        </div>


                        {/* Product information */}

                        <div
                          className="
                            flex-1

                            min-w-0
                          "
                        >

                          <p
                            className="
                              text-sm

                              font-semibold

                              text-foreground

                              truncate
                            "
                          >
                            {productName}
                          </p>


                          {product?.description ? (

                            <p
                              className="
                                text-xs

                                text-muted-foreground

                                truncate

                                mt-0.5
                              "
                            >
                              {String(
                                product.description
                              )
                                .replace(
                                  /<[^>]*>/g,
                                  ' '
                                )
                                .trim()}
                            </p>

                          ) : category ? (

                            <p
                              className="
                                text-xs

                                text-muted-foreground

                                truncate

                                mt-0.5
                              "
                            >
                              {category}
                            </p>

                          ) : null}

                        </div>


                        {/* Product price */}

                        {productPrice && (

                          <span
                            className="
                              flex-shrink-0

                              text-sm

                              font-semibold

                              text-primary
                            "
                          >
                            {productPrice}
                          </span>

                        )}


                        {/* Arrow */}

                        <ArrowRight
                          className="
                            w-4
                            h-4

                            flex-shrink-0

                            text-muted-foreground

                            opacity-0

                            -translate-x-1

                            group-hover:opacity-100

                            group-hover:translate-x-0

                            group-hover:text-primary

                            transition-all
                          "
                        />

                      </button>

                    );

                  }
                )}

              </div>


              {/* View all */}

              <button
                type="button"

                onClick={handleSearch}

                className="
                  w-full

                  flex
                  items-center
                  justify-center
                  gap-2

                  px-4
                  py-3

                  border-t
                  border-border/50

                  text-sm

                  font-medium

                  text-primary

                  hover:bg-primary/5

                  transition-colors
                "
              >

                View all results

                <ArrowRight
                  className="
                    w-4
                    h-4
                  "
                />

              </button>

            </div>

          )}


        {/* =================================================
            NO RESULTS
        ================================================= */}

        {!searchLoading &&
          searchResults.length === 0 && (

            <div
              className="
                p-7

                text-center
              "
            >

              <div
                className="
                  w-14
                  h-14

                  mx-auto
                  mb-3

                  rounded-full

                  bg-muted

                  flex
                  items-center
                  justify-center
                "
              >

                <Search
                  className="
                    w-6
                    h-6

                    text-muted-foreground
                  "
                />

              </div>


              <p
                className="
                  font-semibold

                  text-foreground
                "
              >
                No products found
              </p>


              <p
                className="
                  text-sm

                  text-muted-foreground

                  mt-1
                "
              >
                Try another spice or product name.
              </p>


              {/* Search suggestions */}

              <div
                className="
                  flex

                  flex-wrap

                  items-center

                  justify-center

                  gap-2

                  mt-4
                "
              >

                {[
                  'Haldi',
                  'Mirch',
                  'Garam Masala',
                  'Dhania',
                ].map(
                  (suggestion) => (

                    <button
                      key={suggestion}

                      type="button"

                      onClick={() =>
                        setSearchQuery(
                          suggestion
                        )
                      }

                      className="
                        px-3
                        py-1.5

                        rounded-full

                        bg-muted

                        text-xs

                        font-medium

                        hover:bg-primary/10

                        hover:text-primary

                        transition-colors
                      "
                    >
                      {suggestion}
                    </button>

                  )
                )}

              </div>

            </div>

          )}

      </div>

    );

  };


  // ======================================================
  // RENDER
  // ======================================================

  return (
    <>

      {/* ==================================================
          PROMOTIONAL STRIPE
      ================================================== */}

      <PromotionalStripe
        onStateChange={
          setHasPromo
        }
      />


      {/* ==================================================
          HEADER
      ================================================== */}

      <header
        className={`
          sticky
          top-0
          z-50

          bg-background/90

          backdrop-blur-md

          border-b
          border-border/50

          shadow-sm

          transition-all
          duration-300

          ${hasPromo
            ? 'mt-10 md:mt-12'
            : 'mt-0'
          }
        `}
      >

        <div
          className="
            max-w-7xl

            mx-auto

            px-4
            sm:px-6
            lg:px-8

            w-full
          "
        >

          <div
            className="
              header-wrapper
            "
          >

            {/* ==================================================
                LOGO
            ================================================== */}

            <Link
              to="/"

              className="
                flex-shrink-0

                group

                flex
                items-center
                gap-3
              "
            >

              <img
                src="https://horizons-cdn.hostinger.com/ec989fa5-b26b-4f0e-b1fb-7655d0da715c/fd86f6287aeec79dae55a25e55821f3f.png"

                alt="SGRD Logo"

                className="
                  header-logo-img

                  group-hover:scale-105

                  transition-transform

                  duration-200
                "
              />

            </Link>


            {/* ==================================================
                DESKTOP NAVIGATION
            ================================================== */}

            <nav
              className="
                hidden
                md:flex

                items-center

                space-x-1
                lg:space-x-2

                flex-1

                justify-center

                px-8
              "
            >

              {navLinks.map(
                (link) => (

                  <Link
                    key={link.path}

                    to={link.path}

                    className={`
                      text-sm
                      lg:text-base

                      font-medium

                      transition-all
                      duration-200

                      relative

                      py-2
                      px-4

                      rounded-full

                      hover:bg-muted

                      whitespace-nowrap

                      ${isActive(
                      link.path
                    )

                        ? 'text-primary bg-primary/5'

                        : 'text-muted-foreground hover:text-foreground'
                      }
                    `}
                  >

                    {link.label}

                  </Link>

                )
              )}

            </nav>


            {/* ==================================================
                DESKTOP SEARCH
            ================================================== */}

            <form
              onSubmit={handleSearch}

              className="
                hidden
                lg:flex

                items-center

                flex-1

                max-w-sm

                mx-4
              "
            >

              <div
                ref={
                  desktopSearchRef
                }

                className="
                  relative

                  w-full
                "
              >

                {/* Input */}

                <div
                  className="
                    relative

                    group
                  "
                >

                  <Search
                    className="
                      absolute

                      left-3

                      top-1/2

                      -translate-y-1/2

                      w-4
                      h-4

                      text-muted-foreground

                      group-focus-within:text-primary

                      transition-colors

                      pointer-events-none

                      z-10
                    "
                  />


                  <Input
                    type="text"

                    placeholder="Search premium spices..."

                    value={searchQuery}

                    autoComplete="off"

                    onChange={(event) =>
                      setSearchQuery(
                        event.target.value
                      )
                    }

                    onFocus={() => {

                      if (
                        searchQuery.trim()
                      ) {

                        setShowSearchResults(
                          true
                        );

                      }

                    }}

                    className="
                      pl-10
                      pr-10

                      bg-muted/50

                      text-foreground

                      placeholder:text-muted-foreground

                      border-transparent

                      focus-visible:border-primary

                      focus-visible:ring-1

                      focus-visible:ring-primary

                      rounded-full

                      transition-all
                    "
                  />


                  {/* Clear button */}

                  {searchQuery && (

                    <button
                      type="button"

                      onClick={
                        clearSearch
                      }

                      aria-label="Clear search"

                      className="
                        absolute

                        right-3

                        top-1/2

                        -translate-y-1/2

                        w-6
                        h-6

                        rounded-full

                        flex
                        items-center
                        justify-center

                        text-muted-foreground

                        hover:text-foreground

                        hover:bg-muted

                        transition

                        z-10
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


                {/* Search dropdown */}

                <SearchDropdown />

              </div>

            </form>


            {/* ==================================================
                RIGHT ACTIONS
            ================================================== */}

            <div
              className="
                flex
                items-center

                space-x-2
                sm:space-x-3

                flex-shrink-0
              "
            >

              {/* CART */}

              <Button
                variant="ghost"
                size="icon"

                className="
                  relative

                  rounded-full

                  hover:bg-primary/10

                  hover:text-primary

                  transition-colors

                  h-10
                  w-10

                  sm:h-12
                  sm:w-12
                "

                onClick={
                  toggleCart
                }

                aria-label="Shopping Cart"
              >

                <ShoppingCart
                  className="
                    w-5
                    h-5

                    sm:w-6
                    sm:h-6
                  "
                />


                {cartItemCount > 0 && (

                  <span
                    className="
                      absolute

                      top-0
                      right-0

                      -translate-y-1/4
                      translate-x-1/4

                      w-5
                      h-5

                      bg-primary

                      text-primary-foreground

                      text-[10px]

                      font-bold

                      rounded-full

                      flex
                      items-center
                      justify-center

                      border-2
                      border-background

                      shadow-sm
                    "
                  >
                    {cartItemCount}
                  </span>

                )}

              </Button>


              {/* USER MENU */}

              {isAuthenticated ? (

                <DropdownMenu>

                  <DropdownMenuTrigger
                    asChild
                  >

                    <Button
                      variant="ghost"
                      size="icon"

                      className="
                        rounded-full

                        hover:bg-primary/10

                        hover:text-primary

                        transition-colors

                        h-10
                        w-10

                        sm:h-12
                        sm:w-12
                      "
                    >

                      <User
                        className="
                          w-5
                          h-5

                          sm:w-6
                          sm:h-6
                        "
                      />

                    </Button>

                  </DropdownMenuTrigger>


                  <DropdownMenuContent
                    align="end"

                    className="
                      w-56

                      p-2

                      rounded-2xl

                      shadow-lg

                      border-border/50
                    "
                  >

                    <DropdownMenuItem

                      onClick={() =>
                        navigate(
                          isAdmin
                            ? '/admin'
                            : '/profile'
                        )
                      }

                      className="
                        cursor-pointer

                        py-2.5

                        rounded-xl

                        focus:bg-muted
                      "
                    >

                      {isAdmin ? (

                        <ShieldCheck
                          className="
                            w-4
                            h-4

                            mr-3

                            text-primary
                          "
                        />

                      ) : (

                        <User
                          className="
                            w-4
                            h-4

                            mr-3

                            text-muted-foreground
                          "
                        />

                      )}


                      <span
                        className="
                          font-medium
                        "
                      >
                        {isAdmin
                          ? 'Admin Dashboard'
                          : 'My Profile'}
                      </span>

                    </DropdownMenuItem>


                    {!isAdmin && (

                      <DropdownMenuItem

                        onClick={() =>
                          navigate(
                            '/my-orders'
                          )
                        }

                        className="
                          cursor-pointer

                          py-2.5

                          rounded-xl

                          focus:bg-muted
                        "
                      >

                        <Package
                          className="
                            w-4
                            h-4

                            mr-3

                            text-muted-foreground
                          "
                        />


                        <span
                          className="
                            font-medium
                          "
                        >
                          My Orders
                        </span>

                      </DropdownMenuItem>

                    )}


                    <DropdownMenuSeparator
                      className="my-1"
                    />


                    <DropdownMenuItem

                      onClick={
                        handleLogout
                      }

                      className="
                        cursor-pointer

                        py-2.5

                        rounded-xl

                        text-destructive

                        focus:text-destructive

                        focus:bg-destructive/10
                      "
                    >

                      <LogOut
                        className="
                          w-4
                          h-4

                          mr-3
                        "
                      />


                      <span
                        className="
                          font-medium
                        "
                      >
                        Logout
                      </span>

                    </DropdownMenuItem>

                  </DropdownMenuContent>

                </DropdownMenu>

              ) : (

                <div
                  className="
                    hidden

                    md:flex

                    items-center

                    gap-2
                  "
                >

                  <Button
                    variant="default"

                    onClick={() =>
                      navigate('/login')
                    }

                    className="
                      rounded-full

                      px-6

                      bg-primary

                      hover:bg-primary/90

                      text-primary-foreground

                      shadow-sm

                      hover:shadow

                      transition-all

                      active:scale-95
                    "
                  >
                    Login
                  </Button>

                </div>

              )}


              {/* MOBILE MENU BUTTON */}

              <Button
                variant="ghost"
                size="icon"

                className="
                  md:hidden

                  rounded-full

                  h-10
                  w-10

                  hover:bg-muted
                "

                onClick={() =>
                  setMobileMenuOpen(
                    !mobileMenuOpen
                  )
                }

                aria-label="Toggle Menu"
              >

                {mobileMenuOpen ? (

                  <X
                    className="
                      w-6
                      h-6
                    "
                  />

                ) : (

                  <Menu
                    className="
                      w-6
                      h-6
                    "
                  />

                )}

              </Button>

            </div>

          </div>


          {/* ==================================================
              MOBILE MENU
          ================================================== */}

          {mobileMenuOpen && (

            <div
              className="
                md:hidden

                py-4

                border-t
                border-border/50

                animate-in
                slide-in-from-top-4
                fade-in

                duration-200
              "
            >

              {/* MOBILE SEARCH */}

              <form
                onSubmit={
                  handleSearch
                }

                className="
                  mb-6

                  px-2
                "
              >

                <div
                  ref={
                    mobileSearchRef
                  }

                  className="
                    relative

                    w-full
                  "
                >

                  <Search
                    className="
                      absolute

                      left-3

                      top-1/2

                      -translate-y-1/2

                      w-4
                      h-4

                      text-muted-foreground

                      pointer-events-none

                      z-10
                    "
                  />


                  <Input
                    type="text"

                    placeholder="Search spices..."

                    value={searchQuery}

                    autoComplete="off"

                    onChange={(event) =>
                      setSearchQuery(
                        event.target.value
                      )
                    }

                    onFocus={() => {

                      if (
                        searchQuery.trim()
                      ) {

                        setShowSearchResults(
                          true
                        );

                      }

                    }}

                    className="
                      pl-10
                      pr-10

                      bg-muted

                      text-foreground

                      placeholder:text-muted-foreground

                      rounded-full

                      border-transparent

                      focus-visible:ring-primary
                    "
                  />


                  {/* Clear */}

                  {searchQuery && (

                    <button
                      type="button"

                      onClick={
                        clearSearch
                      }

                      className="
                        absolute

                        right-3

                        top-1/2

                        -translate-y-1/2

                        w-6
                        h-6

                        flex
                        items-center
                        justify-center

                        text-muted-foreground

                        hover:text-foreground

                        z-10
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


                  {/* Mobile dropdown */}

                  <SearchDropdown />

                </div>

              </form>


              {/* MOBILE NAV */}

              <nav
                className="
                  flex

                  flex-col

                  space-y-1

                  px-2
                "
              >

                {navLinks.map(
                  (link) => (

                    <Link
                      key={link.path}

                      to={link.path}

                      onClick={() =>
                        setMobileMenuOpen(
                          false
                        )
                      }

                      className={`
                        px-4

                        py-3

                        rounded-xl

                        text-base

                        font-medium

                        transition-colors

                        whitespace-nowrap

                        ${isActive(
                        link.path
                      )

                          ? 'bg-primary/10 text-primary'

                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }
                      `}
                    >

                      {link.label}

                    </Link>

                  )
                )}


                {/* My Orders */}

                {isAuthenticated &&
                  !isAdmin && (

                    <Link
                      to="/my-orders"

                      onClick={() =>
                        setMobileMenuOpen(
                          false
                        )
                      }

                      className={`
                        px-4

                        py-3

                        rounded-xl

                        text-base

                        font-medium

                        transition-colors

                        ${isActive(
                        '/my-orders'
                      )

                          ? 'bg-primary/10 text-primary'

                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }
                      `}
                    >
                      My Orders
                    </Link>

                  )}


                {/* Login */}

                {!isAuthenticated && (

                  <div
                    className="
                      flex

                      flex-col

                      gap-2

                      mt-4
                      pt-4

                      border-t
                      border-border/50
                    "
                  >

                    <Link
                      to="/login"

                      onClick={() =>
                        setMobileMenuOpen(
                          false
                        )
                      }

                      className="
                        px-4
                        py-3

                        rounded-xl

                        text-base

                        font-medium

                        bg-primary

                        text-primary-foreground

                        text-center

                        hover:bg-primary/90

                        transition-colors
                      "
                    >
                      Login
                    </Link>

                  </div>

                )}

              </nav>

            </div>

          )}

        </div>

      </header>

    </>
  );
};


export default Header;