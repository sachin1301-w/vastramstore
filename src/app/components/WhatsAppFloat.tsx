import { MessageCircle } from 'lucide-react';
import { motion } from 'motion/react';

export function WhatsAppFloat() {
  return (
    <motion.a
      href="https://wa.me/918237641126?text=Hello%2C%20I%27m%20interested%20in%20your%20products"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300"
      aria-label="Chat on WhatsApp"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1, duration: 0.5, type: 'spring', stiffness: 200 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      <MessageCircle className="w-7 h-7" />
      
      {/* Pulse animation ring */}
      <motion.span
        className="absolute inset-0 rounded-full bg-green-400"
        initial={{ scale: 1, opacity: 0.7 }}
        animate={{ scale: 1.5, opacity: 0 }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatType: 'loop',
        }}
      />
    </motion.a>
  );
}
