import React, { useContext, useMemo, useState } from 'react';
import { Crown, Sparkles } from 'lucide-react';
import { AuthContext } from '../../context/authContext.js';
import { apiRequest } from '../../api/client';

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const PremiumUpgradeButton = ({
  compact = false,
  className = '',
  onSuccess,
}) => {
  const { token, user, updateUser } = useContext(AuthContext);
  const [loadingPlan, setLoadingPlan] = useState('');
  const [error, setError] = useState('');
  const [showCompactPlans, setShowCompactPlans] = useState(false);

  const plans = useMemo(
    () => [
      { id: 'monthly', label: 'Monthly', amountLabel: 'Rs 199/mo' },
      { id: 'yearly', label: 'Yearly', amountLabel: 'Rs 1499/yr' },
    ],
    [],
  );

  if (!token || user?.is_premium) {
    return null;
  }

  const startCheckout = async (plan) => {
    setError('');
    setLoadingPlan(plan);

    try {
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        throw new Error('Unable to load Razorpay checkout. Please try again.');
      }

      const order = await apiRequest('/api/payments/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plan }),
      });

      if (order.is_dummy) {
        const verification = await apiRequest('/api/payments/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            razorpay_order_id: order.order_id,
            razorpay_payment_id: 'dummy_payment_id',
            razorpay_signature: 'dummy_signature',
          }),
        });
        
        if (verification.user) {
          updateUser(verification.user);
          onSuccess?.(verification.user);
        }
        setLoadingPlan('');
        return;
      }

      const razorpay = new window.Razorpay({
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: 'AI Music Premium',
        description: `${plan === 'yearly' ? 'Yearly' : 'Monthly'} premium plan`,
        order_id: order.order_id,
        theme: { color: '#a855f7' },
        handler: async (response) => {
          try {
            const verification = await apiRequest('/api/payments/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(response),
            });

            if (verification.user) {
              updateUser(verification.user);
              onSuccess?.(verification.user);
            }
            setLoadingPlan('');
          } catch (verificationError) {
            setError(verificationError.message || 'Payment verification failed. Please contact support if money was deducted.');
            setLoadingPlan('');
          }
        },
        modal: {
          ondismiss: () => setLoadingPlan(''),
        },
      });

      razorpay.on('payment.failed', () => {
        setError('Payment was not completed. You can try again anytime.');
        setLoadingPlan('');
      });

      razorpay.open();
    } catch (checkoutError) {
      setError(checkoutError.message || 'Unable to start checkout right now.');
      setLoadingPlan('');
    }
  };

  if (compact) {
    return (
      <div className={className}>
        <button
          type="button"
          onClick={() => {
            setError('');
            setShowCompactPlans((previous) => !previous);
          }}
          disabled={Boolean(loadingPlan)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-400 to-pink-500 text-white font-semibold shadow-[0_10px_25px_rgba(251,191,36,0.25)] disabled:opacity-60"
        >
          <Crown className="w-4 h-4" />
          {loadingPlan ? 'Starting...' : 'Upgrade to Premium'}
        </button>
        {showCompactPlans && !loadingPlan && (
          <div className="mt-2 flex gap-2">
            {plans.map((plan) => (
              <button
                key={plan.id}
                type="button"
                onClick={() => startCheckout(plan.id)}
                className="rounded-full bg-white/10 px-3 py-1 text-xs text-white hover:bg-white/20"
              >
                {plan.label}
              </button>
            ))}
          </div>
        )}
        {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
      </div>
    );
  }

  return (
    <div className={`glass-surface rounded-3xl p-5 ${className}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-11 h-11 rounded-2xl bg-amber-400/20 flex items-center justify-center text-amber-300">
          <Crown className="w-5 h-5" />
        </div>
        <div>
          <h3 className="app-text font-semibold text-lg">Unlock Premium</h3>
          <p className="app-muted text-sm">Unlimited recommendations, playlists, camera mood detection, and full assistant access.</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {plans.map((plan) => (
          <button
            key={plan.id}
            type="button"
            onClick={() => startCheckout(plan.id)}
            disabled={Boolean(loadingPlan)}
            className="rounded-2xl border border-amber-300/20 bg-gradient-to-br from-amber-400/10 to-pink-500/10 px-4 py-4 text-left hover:border-amber-300/40 transition-colors disabled:opacity-60"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="app-text font-semibold">{plan.label}</p>
                <p className="text-sm text-amber-300">{plan.amountLabel}</p>
              </div>
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>
            <p className="text-xs app-muted mt-3">
              {loadingPlan === plan.id ? 'Starting Razorpay checkout...' : 'Upgrade securely with Razorpay test mode.'}
            </p>
          </button>
        ))}
      </div>

      {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
    </div>
  );
};

export default PremiumUpgradeButton;
