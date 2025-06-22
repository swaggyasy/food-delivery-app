import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiPackage, FiDollarSign, FiBox } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { createProduct, updateProduct, getProducts } from '../../services/AdminService';
import '../../styles/AdminProducts.css';

const CATEGORIES = ['All', 'Meat', 'Lamb', 'Chicken', 'Others'];

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    image: '',
    unit: 'kg',
    customizable: true,
    minOrder: 1,
    category: 'Meat',
    stock: 0,
    status: 'active'
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      console.log('Starting to load products...'); // Debug log
      const productsList = await getProducts();
      console.log('Products loaded:', productsList); // Debug log
      
      if (!Array.isArray(productsList)) {
        console.error('Invalid products data received:', productsList);
        toast.error('Invalid product data received');
        setProducts([]);
        return;
      }

      // Validate and format each product
      const formattedProducts = productsList.map(product => ({
        id: product.id || '',
        name: product.name || 'Unnamed Product',
        price: typeof product.price === 'number' ? product.price : 0,
        description: product.description || '',
        image: product.image || '/placeholder.png',
        unit: product.unit || 'kg',
        customizable: product.customizable ?? true,
        minOrder: typeof product.minOrder === 'number' ? product.minOrder : 1,
        category: product.category || 'Uncategorized',
        stock: typeof product.stock === 'number' ? product.stock : 0,
        status: product.status || 'active'
      }));

      console.log('Formatted products:', formattedProducts); // Debug log
      setProducts(formattedProducts);
    } catch (error) {
      console.error('Error loading products:', error);
      // More specific error message based on the error type
      if (error.code === 'permission-denied') {
        toast.error('You do not have permission to view products');
      } else if (error.code === 'unavailable') {
        toast.error('Network error. Please check your connection');
      } else {
        toast.error(`Failed to load products: ${error.message}`);
      }
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = async (e) => {
    const { name, value, type, checked, files } = e.target;
    
    if (type === 'file' && files[0]) {
      try {
        setIsLoading(true);
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormData(prev => ({
            ...prev,
            image: reader.result
          }));
        };
        reader.readAsDataURL(files[0]);
      } catch (error) {
        toast.error('Error processing image');
      } finally {
        setIsLoading(false);
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.price || !formData.description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsLoading(true);
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        minOrder: parseInt(formData.minOrder),
        stock: parseInt(formData.stock)
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id, productData);
        toast.success('Product updated successfully');
      } else {
        await createProduct(productData);
        toast.success('Product created successfully');
      }

      await loadProducts();
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      toast.error(error.message || 'Failed to save product');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (product) => {
    try {
      if (!product || !product.id) {
        console.error('Invalid product data:', product);
        toast.error('Invalid product data');
        return;
      }

      setFormData({
        name: product.name || '',
        price: (product.price || 0).toString(),
        description: product.description || '',
        image: product.image || '',
        unit: product.unit || 'kg',
        customizable: product.customizable ?? true,
        minOrder: product.minOrder || 1,
        category: product.category || 'Meat',
        stock: product.stock || 0,
        status: product.status || 'active'
      });
      setEditingProduct(product);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error preparing product for edit:', error);
      toast.error('Failed to prepare product for editing');
    }
  };

  const handleDelete = async (productId) => {
    if (!productId) {
      console.error('Invalid product ID:', productId);
      toast.error('Invalid product ID');
      return;
    }

    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        setIsLoading(true);
        await updateProduct(productId, { status: 'deleted' });
        await loadProducts();
        toast.success('Product deleted successfully');
      } catch (error) {
        console.error('Error deleting product:', error);
        if (error.code === 'permission-denied') {
          toast.error('You do not have permission to delete products');
        } else {
          toast.error('Failed to delete product. Please try again.');
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      description: '',
      image: '',
      unit: 'kg',
      customizable: true,
      minOrder: 1,
      category: 'Meat',
      stock: 0,
      status: 'active'
    });
    setEditingProduct(null);
  };

  const getFilteredProducts = () => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  };

  if (isLoading) {
    return <div className="loading">Loading products...</div>;
  }

  const filteredProducts = getFilteredProducts();

  return (
    <div className="admin-products">
      <motion.div 
        className="page-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1>Product Management</h1>
        <button className="add-button" onClick={() => {
          resetForm();
          setIsModalOpen(true);
        }}>
          <FiPlus /> Add New Product
        </button>
      </motion.div>

      <motion.div 
        className="filters"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="category-filters">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {CATEGORIES.map((category, index) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </motion.div>

      <motion.div 
        className="products-grid"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <AnimatePresence>
          {filteredProducts.map((product, index) => (
            <motion.div
              key={product.id}
              className="product-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <div className="product-image">
                <img src={product.image || '/placeholder.png'} alt={product.name} />
              </div>
              <div className="product-info">
                <h3>{product.name}</h3>
                <p className="price">
                  <FiDollarSign />
                  RM {product.price ? parseFloat(product.price).toFixed(2) : '0.00'}
                </p>
                <p className="stock">
                  <FiBox />
                  Stock: {product.stock || 0} {product.unit || 'kg'}
                </p>
                <p className="category">
                  <FiPackage />
                  {product.category || 'Uncategorized'}
                </p>
              </div>
              <div className="product-actions">
                <button className="edit-btn" onClick={() => handleEdit(product)}>
                  <FiEdit2 /> Edit
                </button>
                <button className="delete-btn" onClick={() => handleDelete(product.id)}>
                  <FiTrash2 /> Delete
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              resetForm();
              setIsModalOpen(false);
            }}
          >
            <motion.div 
              className="modal-content"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()}
            >
              <button className="close-modal" onClick={() => {
                resetForm();
                setIsModalOpen(false);
              }}>
                <FiX />
              </button>
              <h2>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Product Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter product name"
                  />
                </div>
                <div className="form-group">
                  <label>Price (RM)</label>
                  <input
                    type="number"
                    name="price"
                    step="0.01"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                    placeholder="0.00"
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter product description"
                  />
                </div>
                <div className="form-group">
                  <label>Product Image</label>
                  <input
                    type="file"
                    name="image"
                    accept="image/*"
                    onChange={handleInputChange}
                    required={!editingProduct}
                  />
                  {formData.image && (
                    <div className="image-preview">
                      <img src={formData.image} alt="Preview" />
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select name="category" value={formData.category} onChange={handleInputChange}>
                    <option value="Meat">Meat</option>
                    <option value="Seafood">Seafood</option>
                    <option value="Vegetables">Vegetables</option>
                    <option value="Others">Others</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Unit</label>
                  <select name="unit" value={formData.unit} onChange={handleInputChange}>
                    <option value="kg">Kilogram (kg)</option>
                    <option value="pcs">Pieces (pcs)</option>
                    <option value="pack">Pack</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Stock</label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleInputChange}
                    required
                    placeholder="0"
                  />
                </div>
                <div className="form-group">
                  <label>Minimum Order</label>
                  <input
                    type="number"
                    name="minOrder"
                    step="0.5"
                    value={formData.minOrder}
                    onChange={handleInputChange}
                    required
                    placeholder="1"
                  />
                </div>
                <div className="form-group checkbox">
                  <label>
                    <input
                      type="checkbox"
                      name="customizable"
                      checked={formData.customizable}
                      onChange={handleInputChange}
                    />
                    Allow Customization
                  </label>
                </div>
                <button type="submit" className="submit-btn" disabled={isLoading}>
                  {isLoading ? 'Saving...' : (editingProduct ? 'Update Product' : 'Add Product')}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminProducts;