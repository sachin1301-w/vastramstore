import { Heart, Sparkles, TrendingUp, Shield, Package, Star } from 'lucide-react';
import { Link } from 'react-router';

export function About() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-amber-500 to-orange-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-block p-3 bg-white/20 rounded-full mb-4">
            <Sparkles className="w-10 h-10" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3">About VASTRAM</h1>
          <p className="text-lg md:text-xl text-white/90">Fashion that tells your story</p>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-12 bg-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4 text-gray-900">Our Story</h2>
          <p className="text-lg text-gray-700 mb-4">
            Founded in 2020, VASTRAM started with a simple mission: to bring premium fashion to everyone. 
            What began as a small workshop has grown into a trusted fashion destination.
          </p>
          <p className="text-lg text-gray-700">
            Today, we proudly serve over 50,000 happy customers across India, delivering quality, 
            style, and exceptional service with every order.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg p-6 text-center shadow-sm">
              <Heart className="w-12 h-12 text-amber-600 mx-auto mb-3" />
              <p className="text-3xl font-bold text-gray-900 mb-1">2020</p>
              <p className="text-gray-600">Founded</p>
            </div>

            <div className="bg-white rounded-lg p-6 text-center shadow-sm">
              <Star className="w-12 h-12 text-orange-600 mx-auto mb-3 fill-orange-600" />
              <p className="text-3xl font-bold text-gray-900 mb-1">50K+</p>
              <p className="text-gray-600">Happy Customers</p>
            </div>

            <div className="bg-white rounded-lg p-6 text-center shadow-sm">
              <div className="flex justify-center gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-amber-500 text-amber-500" />
                ))}
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">4.9/5</p>
              <p className="text-gray-600">Rating</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-12 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">Why Choose VASTRAM</h2>
          
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Premium Quality</h3>
              <p className="text-sm text-gray-600">Only the finest materials</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Latest Trends</h3>
              <p className="text-sm text-gray-600">Always stay stylish</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Shield className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">100% Secure</h3>
              <p className="text-sm text-gray-600">Safe payments guaranteed</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Package className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Fast Delivery</h3>
              <p className="text-sm text-gray-600">Quick & reliable shipping</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-amber-600 to-orange-600 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Start Your Fashion Journey</h2>
          <p className="text-lg mb-6 text-white/90">Discover styles that fit your life</p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 bg-white text-amber-700 px-6 py-3 rounded-full font-bold hover:bg-gray-100 transition-colors"
          >
            <span>Start Shopping</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </section>
    </div>
  );
}