import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Mail, Phone, MapPin, Clock, Send } from 'lucide-react';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '/utils/supabase/info';

export function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e222e178/contact`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Message sent successfully! We will get back to you soon.');
        setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
      } else {
        toast.error(data.error || 'Failed to send message. Please try again.');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative py-16 overflow-hidden" style={{ background: 'linear-gradient(to bottom right, #fef3c7, #fed7aa)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl mb-4" style={{ color: '#111827' }}>Get In Touch</h1>
          <p className="text-lg max-w-2xl" style={{ color: '#374151' }}>
            Have a question or feedback? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl p-8 md:p-10 shadow-xl border border-gray-200">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Send className="w-6 h-6 text-amber-700" />
                </div>
                <h2 className="text-2xl md:text-3xl">Send Us A Message</h2>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="name" className="text-base mb-2 block text-gray-700">
                      Full Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter your name"
                      className="h-12 border-gray-300 focus:border-amber-700 focus:ring-amber-700"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-base mb-2 block text-gray-700">
                      Email Address <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="your.email@example.com"
                      className="h-12 border-gray-300 focus:border-amber-700 focus:ring-amber-700"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="phone" className="text-base mb-2 block text-gray-700">
                      Phone Number <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+91 98765 43210"
                      className="h-12 border-gray-300 focus:border-amber-700 focus:ring-amber-700"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="subject" className="text-base mb-2 block text-gray-700">
                      Subject <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="What is this regarding?"
                      className="h-12 border-gray-300 focus:border-amber-700 focus:ring-amber-700"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="message" className="text-base mb-2 block text-gray-700">
                    Message <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="message"
                    name="message"
                    rows={6}
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Tell us more about your inquiry..."
                    className="border-gray-300 focus:border-amber-700 focus:ring-amber-700 resize-none"
                    required
                  />
                </div>
                
                <Button
                  type="submit"
                  className="w-full h-14 text-lg bg-amber-700 hover:bg-amber-800 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="animate-pulse">Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-6">
            {/* Contact Details Card */}
            <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-200">
              <h2 className="text-2xl mb-6 text-gray-800">Contact Information</h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4 p-4 bg-amber-50 rounded-xl hover:bg-amber-100 transition-colors">
                  <div className="p-2 bg-amber-700 rounded-lg">
                    <Mail className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1 uppercase tracking-wide">Email</p>
                    <a 
                      href="mailto:vastram.pune2026@gmail.com" 
                      className="text-amber-700 hover:text-amber-800 transition-colors break-all"
                    >
                      vastram.pune2026@gmail.com
                    </a>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 p-4 bg-amber-50 rounded-xl hover:bg-amber-100 transition-colors">
                  <div className="p-2 bg-amber-700 rounded-lg">
                    <Phone className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-2 uppercase tracking-wide">Phone</p>
                    <a href="tel:+919284631943" className="block text-gray-800 hover:text-amber-700 transition-colors">
                      +91 92846 31943
                    </a>
                    <a href="tel:+918669279635" className="block text-gray-800 hover:text-amber-700 transition-colors">
                      +91 86692 79635
                    </a>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 p-4 bg-amber-50 rounded-xl hover:bg-amber-100 transition-colors">
                  <div className="p-2 bg-amber-700 rounded-lg">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-2 uppercase tracking-wide">Address</p>
                    <p className="text-gray-800 leading-relaxed">
                      Alandi Road, Vishrawadi<br />
                      Near Fish Market, Bus Stop<br />
                      Pune - 411015<br />
                      Maharashtra, India
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Business Hours Card */}
            <div className="bg-amber-700 rounded-2xl p-8 shadow-xl text-white">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Clock className="w-6 h-6" />
                </div>
                <h3 className="text-xl">Business Hours</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-3 border-b border-white/20">
                  <span className="text-amber-100">Every Day</span>
                  <span className="font-semibold">9:00 AM - 10:00 PM</span>
                </div>
                <p className="text-amber-100 text-sm mt-4 text-center">
                  Open 7 days a week
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info Section */}
        <div className="mt-16 bg-white rounded-2xl p-8 md:p-10 shadow-xl border border-gray-200 text-center">
          <h3 className="text-2xl mb-4 text-gray-800">Why Contact Us?</h3>
          <p className="text-gray-600 max-w-3xl mx-auto leading-relaxed">
            We're here to help with any questions about our products, orders, shipping, or returns. 
            Our dedicated customer service team strives to respond to all inquiries within 24 hours during business days.
          </p>
        </div>
      </div>
    </div>
  );
}