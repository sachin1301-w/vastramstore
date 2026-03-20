import { createBrowserRouter } from 'react-router';
import { RootLayout } from './layout/RootLayout';
import { UserTypeSelection } from './pages/UserTypeSelection';
import { Home } from './pages/Home';
import { Products } from './pages/Products';
import { ProductDetail } from './pages/ProductDetail';
import { Cart } from './pages/Cart';
import { Checkout } from './pages/Checkout';
import { OrderSuccess } from './pages/OrderSuccess';
import { About } from './pages/About';
import { Contact } from './pages/Contact';
import { AdminOrders } from './pages/AdminOrders';
import { AdminLogin } from './pages/AdminLogin';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminAddProduct } from './pages/AdminAddProduct';
import { SignUp } from './pages/SignUp';
import { SignIn } from './pages/SignIn';
import { Profile } from './pages/Profile';
import { ForgotPassword } from './pages/ForgotPassword';
import { RazorpayDebug } from './pages/RazorpayDebug';
import { ImageUploader } from './pages/ImageUploader';
import { NotFound } from './pages/NotFound';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: RootLayout,
    children: [
      { index: true, Component: UserTypeSelection },
      { path: 'home', Component: Home },
      { path: 'products', Component: Products },
      { path: 'product/:id', Component: ProductDetail },
      { path: 'cart', Component: Cart },
      { path: 'checkout', Component: Checkout },
      { path: 'order-success', Component: OrderSuccess },
      { path: 'about', Component: About },
      { path: 'contact', Component: Contact },
      { path: 'admin/orders', Component: AdminOrders },
      { path: 'admin/login', Component: AdminLogin },
      { path: 'admin/dashboard', Component: AdminDashboard },
      { path: 'admin/add-product', Component: AdminAddProduct },
      { path: 'signup', Component: SignUp },
      { path: 'signin', Component: SignIn },
      { path: 'forgot-password', Component: ForgotPassword },
      { path: 'profile', Component: Profile },
      { path: 'debug/razorpay', Component: RazorpayDebug },
      { path: 'image-uploader', Component: ImageUploader },
      { path: '*', Component: NotFound },
    ],
  },
]);