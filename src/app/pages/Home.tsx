import { Link } from 'react-router';
import { ProductCard } from '../components/ProductCard';
import { Button } from '../components/ui/button';
import { products } from '../data/products';
import { motion } from 'motion/react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { Truck } from 'lucide-react';

export function Home() {
  const featuredProducts = products.filter((p) => p.featured);

  // Slider settings
  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    pauseOnHover: true,
    arrows: true,
  };

  // Slideshow images
  const slides = [
    {
      id: 1,
      image: 'https://images.unsplash.com/photo-1757598079169-b8655dc3e933?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjBldGhuaWMlMjBzdWl0JTIwc2Fsd2FyJTIwa2FtZWV6fGVufDF8fHx8MTc3Mzg0MTk5N3ww&ixlib=rb-4.1.0&q=80&w=1080',
      title: 'KAASHVI JENIKA',
      subtitle: 'Exclusive Red Ethnic Collection'
    },
    {
      id: 2,
      image: 'https://images.unsplash.com/photo-1739429945494-1d27f2ba95f2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVnYW50JTIwc2FyZWUlMjB3b21hbiUyMHBvcnRyYWl0fGVufDF8fHx8MTc3MzgyODkwNXww&ixlib=rb-4.1.0&q=80&w=1080',
      title: 'Discover Your Style',
      subtitle: 'Premium Ethnic Wear'
    },
    {
      id: 3,
      image: 'https://images.unsplash.com/photo-1760461804065-febded675ae2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZWF1dGlmdWwlMjBpbmRpYW4lMjBicmlkZSUyMGxlaGVuZ2F8ZW58MXx8fHwxNzczODI4OTA1fDA&ixlib=rb-4.1.0&q=80&w=1080',
      title: 'Bridal Collection',
      subtitle: 'Wedding & Festive Wear'
    },
    {
      id: 4,
      image: 'https://images.unsplash.com/photo-1664636404761-d3aa86169911?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHlsaXNoJTIwa3VydGElMjBmYXNoaW9uJTIwbW9kZWx8ZW58MXx8fHwxNzczODI4OTA2fDA&ixlib=rb-4.1.0&q=80&w=1080',
      title: 'Trendy Kurtas',
      subtitle: 'Casual & Party Wear'
    },
    {
      id: 5,
      image: 'https://images.unsplash.com/photo-1654764746221-7bc58ef4dbad?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cmFkaXRpb25hbCUyMGluZGlhbiUyMGRyZXNzJTIwYmVhdXRpZnVsfGVufDF8fHx8MTc3MzgyODkwNnww&ixlib=rb-4.1.0&q=80&w=1080',
      title: 'Elegant Anarkalis',
      subtitle: 'Traditional Elegance'
    }
  ];

  // Animation variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  const fadeIn = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.8 }
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const scaleIn = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: { 
      scale: 1, 
      opacity: 1,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section with Slideshow */}
      <section className="relative overflow-hidden">
        <div className="slideshow-container">
          <Slider {...sliderSettings}>
            {slides.map((slide) => (
              <div key={slide.id} className="relative">
                <div className="relative h-[450px] md:h-[550px] lg:h-[650px]">
                  <img 
                    src={slide.image} 
                    alt={slide.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-end md:items-center justify-center pb-20 md:pb-0">
                    <div className="text-center text-white px-6 max-w-5xl">
                      <motion.div
                        className="mb-6"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      >
                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-4 tracking-tight">
                          VASTRAM
                        </h1>
                        <div className="w-24 h-1 bg-amber-500 mx-auto mb-6"></div>
                      </motion.div>
                      <motion.h2 
                        className="text-2xl md:text-4xl lg:text-5xl mb-3 font-light tracking-wide"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                      >
                        {slide.title}
                      </motion.h2>
                      <motion.p 
                        className="text-lg md:text-xl lg:text-2xl mb-10 text-amber-300 font-light"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
                      >
                        {slide.subtitle}
                      </motion.p>
                      <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
                      >
                        <Link to="/products">
                          <Button 
                            size="lg" 
                            className="bg-white hover:bg-amber-50 text-black px-10 py-7 text-lg font-medium rounded-none border-2 border-white hover:border-amber-500 transition-all duration-300"
                          >
                            Explore Collection
                          </Button>
                        </Link>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </Slider>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
          >
            <h2 className="text-4xl md:text-5xl mb-5 tracking-tight bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">Featured Products</h2>
            <p className="text-gray-600 text-lg tracking-wide">Discover our handpicked collection</p>
          </motion.div>
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            {featuredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                variants={scaleIn}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </motion.div>
          <motion.div 
            className="text-center mt-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
          >
            <Link to="/products">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button variant="outline" size="lg">
                  View All Products
                </Button>
              </motion.div>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <motion.div 
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div 
              className="text-center"
              variants={fadeInUp}
              whileHover={{ scale: 1.05, transition: { duration: 0.3 } }}
            >
              <motion.div 
                className="bg-amber-700 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                whileHover={{ rotate: 360, transition: { duration: 0.6 } }}
              >
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </motion.div>
              <h3 className="text-xl mb-2">Best Prices</h3>
              <p className="text-gray-600">Competitive prices on all products</p>
            </motion.div>
            <motion.div 
              className="text-center"
              variants={scaleIn}
            >
              <motion.div 
                className="bg-amber-700 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                whileHover={{ rotate: 360, scale: 1.2 }}
                transition={{ duration: 0.5 }}
              >
                <Truck className="w-8 h-8" />
              </motion.div>
              <h3 className="text-xl mb-2">Free Shipping</h3>
              <p className="text-gray-600">Free delivery on orders over ₹500</p>
            </motion.div>
            <motion.div 
              className="text-center"
              variants={fadeInUp}
              whileHover={{ scale: 1.05, transition: { duration: 0.3 } }}
            >
              <motion.div 
                className="bg-amber-700 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                whileHover={{ rotate: 360, transition: { duration: 0.6 } }}
              >
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </motion.div>
              <h3 className="text-xl mb-2">Secure Payment</h3>
              <p className="text-gray-600">100% secure payment processing</p>
            </motion.div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}