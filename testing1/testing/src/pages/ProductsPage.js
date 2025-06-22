import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';  // Fixed import path
import { toast } from 'react-toastify';
import { FiX, FiMinus, FiPlus, FiSearch } from 'react-icons/fi';
import { getProducts } from '../services/AdminService';  // Import the getProducts function
import '../styles/ProductsPage.css';  // Fixed CSS import path

const ProductsPage = () => {
  const { dispatch } = useCart();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [customization, setCustomization] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const productsList = await getProducts();
      console.log('Fetched products:', productsList); // Debug log
      setProducts(productsList);
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  // Get unique categories from active products
  const categories = ['all', ...new Set(products
    .filter(product => product.status === 'active')
    .map(product => product.category))];

  // Filter products based on search query and category
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const isActive = product.status === 'active';
    return matchesSearch && matchesCategory && isActive;
  });

  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setQuantity(product.minOrder);
    setCustomization('');
  };

  const closeModal = () => {
    setSelectedProduct(null);
    setQuantity(1);
    setCustomization('');
  };

  const updateQuantity = (value) => {
    if (selectedProduct) {
      const newQuantity = Math.max(selectedProduct.minOrder, quantity + value);
      setQuantity(newQuantity);
    }
  };

  const calculateTotal = () => {
    if (selectedProduct) {
      return selectedProduct.price * quantity;
    }
    return 0;
  };

  const addToCart = () => {
    if (selectedProduct) {
      dispatch({
        type: 'ADD_TO_CART',
        payload: {
          id: selectedProduct.id,
          name: selectedProduct.name,
          price: selectedProduct.price,
          quantity: quantity,
          customization: customization,
          total: calculateTotal()
        }
      });
      toast.success(`${selectedProduct.name} added to cart!`);
      closeModal();
    }
  };

  return (
    <div className="products-page">
      <div className="products-header">
        <div className="search-bar">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="category-filter">
          {categories.map(category => (
            <button
              key={category}
              className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="loading">Loading products...</div>
      ) : (
        <div className="products-grid">
          {filteredProducts.length === 0 ? (
            <div className="no-products">
              <p>No products found matching your search.</p>
            </div>
          ) : (
            filteredProducts.map(product => (
              <div key={product.id} className="product-card" onClick={() => handleProductClick(product)}>
                <div className="product-image">
                  <img src={product.image || '/placeholder.png'} alt={product.name} />
                  <span className="category-tag">{product.category}</span>
                </div>
                <div className="product-info">
                  <h3>{product.name}</h3>
                  <p className="product-description">{product.description}</p>
                  <p className="product-price">
                    RM{parseFloat(product.price).toFixed(2)}
                    <span> / {product.unit}</span>
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {selectedProduct && (
        <div className="product-modal-overlay" onClick={closeModal}>
          <div className="product-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-image">
              <img src={selectedProduct.image || '/placeholder.png'} alt={selectedProduct.name} />
            </div>
            <div className="modal-info">
              <button className="close-modal" onClick={closeModal}>
                <FiX />
              </button>
              <h2>{selectedProduct.name}</h2>
              <p className="modal-description">{selectedProduct.description}</p>
              
              <div className="quantity-controls">
                <button onClick={() => updateQuantity(-1)} disabled={quantity <= selectedProduct.minOrder}>
                  <FiMinus />
                </button>
                <input
                  type="text"
                  readOnly
                  value={quantity}
                />
                <button onClick={() => updateQuantity(1)}>
                  <FiPlus />
                </button>
              </div>

              <p className="modal-price">RM {calculateTotal().toFixed(2)}</p>

              {selectedProduct.customizable && (
                <div className="customization-section">
                  <label>Special Instructions</label>
                  <textarea
                    value={customization}
                    onChange={(e) => setCustomization(e.target.value)}
                    placeholder="e.g., less spicy, no onions..."
                  />
                </div>
              )}

              <button className="add-to-cart-btn" onClick={addToCart}>
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsPage;