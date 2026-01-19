import { useContext, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppContext } from '../App';
import { ArrowLeft, QrCode, Clock, Calendar } from 'lucide-react';
import { toast } from 'sonner';

export function BookingPaymentScreen() {
  const navigate = useNavigate();
  const { bookingId } = useParams<{ bookingId: string }>();
  const context = useContext(AppContext);
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);

  // Get booking from context
  const booking = context?.bookings.find((b) => b.id === bookingId);
  const warnet = context?.cafes.find((c) => c.id === booking?.cafeId);

  if (!booking || !warnet) {
    navigate('/home');
    return null;
  }

  const isMember = context?.user?.role === 'member' && 
    context.user.cafeWallets?.some((w) => w.cafeId === warnet.id);

  const pricePerHour = isMember ? warnet.memberPricePerHour : warnet.regularPricePerHour;
  const totalPrice = pricePerHour * booking.duration;

  const paymentMethods = [
    { id: 'bca', name: 'BCA', type: 'bank', logo: '🏦' },
    { id: 'mandiri', name: 'Mandiri', type: 'bank', logo: '🏦' },
    { id: 'bni', name: 'BNI', type: 'bank', logo: '🏦' },
    { id: 'gopay', name: 'GoPay', type: 'ewallet', logo: '💳' },
    { id: 'ovo', name: 'OVO', type: 'ewallet', logo: '💳' },
    { id: 'dana', name: 'DANA', type: 'ewallet', logo: '💳' },
    { id: 'qris', name: 'QRIS', type: 'qris', logo: '📱' }
  ];

  const handleConfirmPayment = () => {
    if (!selectedPayment) {
      toast.error('Please select a payment method');
      return;
    }

    // Update booking payment status
    context?.updateBooking(booking.id, {
      paymentStatus: 'paid',
    });
    
    toast.success('✅ Payment successful! Timer starts after login at the café.');
    
    setTimeout(() => {
      navigate(`/booking-history`);
    }, 1000);
  };

  return (
    <div className="min-h-screen pb-32">
      {/* Header */}
      <div className="bg-slate-900/30 backdrop-blur-lg border-b border-slate-800/50 sticky top-0 z-10">
        <div className="px-6 py-5">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-slate-200 mb-1">Booking & Payment</h1>
          <p className="text-slate-400">Complete your reservation</p>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Order Summary */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-6">
          <h3 className="text-slate-200 mb-4">Order Summary</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <p className="text-slate-400">Warnet</p>
              <p className="text-slate-200">{warnet.name}</p>
            </div>
            <div className="flex justify-between">
              <p className="text-slate-400">PC Number</p>
              <p className="text-slate-200">PC {booking.pcNumber}</p>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-slate-400">Order Date</p>
              <div className="flex items-center gap-2 text-slate-200">
                <Calendar className="w-4 h-4" />
                {new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </div>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-slate-400">Order Time</p>
              <div className="flex items-center gap-2 text-slate-200">
                <Clock className="w-4 h-4" />
                {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            <div className="flex justify-between">
              <p className="text-slate-400">Price/hour</p>
              <p className="text-slate-200">Rp {pricePerHour.toLocaleString()}</p>
            </div>
            
            <div className="border-t border-slate-800 pt-3 mt-3">
            <div className="flex justify-between items-center">
              <p className="text-slate-200">Duration</p>
              <span className="text-cyan-400">{booking.duration} hours</span>
            </div>
            </div>

            
            <div className="border-t border-slate-800 pt-3">
              <div className="flex justify-between">
                <p className="text-slate-200">Total Price</p>
                <p className="text-cyan-400 text-xl">Rp {totalPrice.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-6">
          <h3 className="text-slate-200 mb-4">Payment Method</h3>
          
          {/* Bank Transfer */}
          <div className="mb-4">
            <p className="text-slate-400 mb-3 text-sm">Bank Transfer</p>
            <div className="grid grid-cols-3 gap-3">
              {paymentMethods.filter(p => p.type === 'bank').map(method => (
                <button
                  key={method.id}
                  onClick={() => setSelectedPayment(method.id)}
                  className={`
                    bg-slate-950/50 border rounded-2xl p-4 flex flex-col items-center gap-2 transition-all
                    ${selectedPayment === method.id 
                      ? 'border-cyan-500 bg-cyan-500/10' 
                      : 'border-slate-800/50 hover:border-slate-700'
                    }
                  `}
                >
                  <span className="text-2xl">{method.logo}</span>
                  <p className={`text-sm ${selectedPayment === method.id ? 'text-cyan-400' : 'text-slate-300'}`}>
                    {method.name}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* E-Wallet */}
          <div className="mb-4">
            <p className="text-slate-400 mb-3 text-sm">E-Wallet</p>
            <div className="grid grid-cols-3 gap-3">
              {paymentMethods.filter(p => p.type === 'ewallet').map(method => (
                <button
                  key={method.id}
                  onClick={() => setSelectedPayment(method.id)}
                  className={`
                    bg-slate-950/50 border rounded-2xl p-4 flex flex-col items-center gap-2 transition-all
                    ${selectedPayment === method.id 
                      ? 'border-cyan-500 bg-cyan-500/10' 
                      : 'border-slate-800/50 hover:border-slate-700'
                    }
                  `}
                >
                  <span className="text-2xl">{method.logo}</span>
                  <p className={`text-sm ${selectedPayment === method.id ? 'text-cyan-400' : 'text-slate-300'}`}>
                    {method.name}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* QRIS */}
          <div>
            <p className="text-slate-400 mb-3 text-sm">Quick Payment</p>
            <button
              onClick={() => setSelectedPayment('qris')}
              className={`
                w-full bg-slate-950/50 border rounded-2xl p-5 flex items-center gap-4 transition-all
                ${selectedPayment === 'qris' 
                  ? 'border-cyan-500 bg-cyan-500/10' 
                  : 'border-slate-800/50 hover:border-slate-700'
                }
              `}
            >
              <div className={`p-3 rounded-xl ${selectedPayment === 'qris' ? 'bg-cyan-500/20' : 'bg-slate-800/50'}`}>
                <QrCode className={`w-6 h-6 ${selectedPayment === 'qris' ? 'text-cyan-400' : 'text-slate-400'}`} />
              </div>
              <div className="flex-1 text-left">
                <p className={selectedPayment === 'qris' ? 'text-cyan-400' : 'text-slate-300'}>QRIS</p>
                <p className="text-slate-400 text-sm">Scan to pay with any e-wallet</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Confirm Button - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900/80 backdrop-blur-xl border-t border-slate-800/50 px-6 py-5">
        <button
          onClick={handleConfirmPayment}
          disabled={!selectedPayment}
          className={`
            w-full rounded-2xl py-4 transition-all
            ${selectedPayment
              ? 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white shadow-lg shadow-cyan-500/25'
              : 'bg-slate-800/50 text-slate-500 cursor-not-allowed'
            }
          `}
        >
          CONFIRM & PAY
        </button>
      </div>
    </div>
  );
}
