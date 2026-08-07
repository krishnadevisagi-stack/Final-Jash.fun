//file path: app/create/page.tsx

'use client';

import { useState, ChangeEvent, useEffect, useRef, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Music, Heart, ArrowRight, Crown, ArrowLeft, Camera, Lock, Sparkles, Loader2, Star, Calendar, PartyPopper, Baby, Users, Trash2, Cake, Gift, HelpCircle, Image as GalleryIcon, Plus, X, PenLine, ShieldCheck, AlertCircle, CreditCard, ChevronDown, ChevronUp } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import Script from 'next/script';

export default function CreateCelebration() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white font-serif">Loading wizard...</div>}>
      <CreateCelebrationContent />
    </Suspense>
  );
}

function generateSemanticStoryId(data: any): string {
  const isPremium = data.mode === 'PREMIUM';
  const reqPrefix = isPremium ? 'page-' : 'story-';

  if (data?.storyId && typeof data.storyId === 'string' && data.storyId.trim() !== '') {
    let existingId = data.storyId.trim();
    if (!existingId.startsWith('id-')) {
      if (isPremium && existingId.startsWith('story-')) {
        return existingId.replace(/^story-/, 'page-');
      }
      if (!isPremium && existingId.startsWith('page-')) {
        return existingId.replace(/^page-/, 'story-');
      }
      if (existingId.startsWith(reqPrefix)) {
        return existingId;
      }
    }
  }

  const defaultEvent = isPremium ? 'page' : 'story';

  let nameStr = data.names || data.creatorName || data.fatherName || data.motherName || data.name1 || data.name2 || 'celebration';
  nameStr = String(nameStr).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').substring(0, 20) || 'celebration';

  let eventStr = data.category || data.specialSubcategory || data.occasionName || defaultEvent;
  eventStr = String(eventStr).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').substring(0, 15) || defaultEvent;
  if (isPremium && eventStr === 'story') eventStr = 'page';

  const now = new Date();
  const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const day = String(now.getDate()).padStart(2, '0');
  const month = months[now.getMonth()];
  const year = String(now.getFullYear()).slice(-2);
  const dateStr = `${day}${month}${year}`;

  const salt = Math.random().toString(36).substring(2, 6);
  return `${reqPrefix}${nameStr}-${eventStr}-${dateStr}-${salt}`;
}

function CreateCelebrationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [currentStep, setCurrentStep] = useState(0);

  const [formData, setFormData] = useState({
    category: searchParams.get('category') || 'SPECIAL',
    mode: 'FREE',
    isForSelf: true,
    email: '',
    names: '',
    count: '',
    relationLabel: '',
    occasion: '',
    creatorName: '',
    creatorPhoto: null as string | null,
    photos: [] as string[],
    music: null as string | null,
    customMessage: '',
    theme: 'ROYAL',
    selectedLanguage: 'hindi' as 'hindi' | 'english',
    selectedTemplate: 1 as 1 | 2 | 3 | 4,
    generatedAIQuote: '',
    specialSubcategory: '' as 'JYANTI' | 'DIVAS' | 'FESTIVALS' | 'NEW_MEMBERS' | 'MARRIAGE_DATE_FIX' | '',
    occasionName: '',
    occasionDate: '',
    occasionTime: '',
    fatherName: '',
    motherName: '',
    name1: '',
    name2: '',
    whoAreYou: 'HUSBAND' as 'HUSBAND' | 'WIFE' | 'MALE_PARTNER' | 'FEMALE_PARTNER',
    // ── PREMIUM-ONLY FIELDS (additive — never read/used by FREE mode) ────────
    // These power the /celebrate/premium landing page exclusively. Adding
    // them here does not affect any existing free-mode field or logic.
    heroImage: null as string | null,          // dedicated full-screen hero photo
    cakeEnabled: true,                          // toggle cake-cutting section
    wishesTexts: [''] as string[],              // multiple quotes/shayari, shown after cake-cut
    // ── NEW & SEPARATE from wishesTexts above ─────────────────────────────
    // The Love Letter is its OWN feature with its OWN content — a longer,
    // single continuous letter/blessing, distinct from the short quotes
    // collected above. Both exist independently on the landing page.
    loveLetterText: '',                         // the Love Letter's own content
    secretMessages: [''] as string[],           // unlimited tap-to-open cards; add as many as needed
    secretImage: null as string | null,         // one optional secretly-revealed photo
    galleryPhotos: [] as string[],              // up to 6, separate from hero
    questions: [] as { text: string; revealOn: 'YES' | 'NO' }[], // up to 2, yes/no
    giftCardCompany: '' as '' | 'FLIPKART' | 'AMAZON' | 'MYNTRA' | 'SWIGGY' | 'ZOMATO' | 'OTHER',
    giftCardCode: '',
    premiumPrice: 99,                           // set explicitly by user in Step 17 (Set Your Value)
    premiumPrivacy: 'PUBLIC' as 'PUBLIC' | 'PRIVATE',
    freePrivacy: 'PUBLIC' as 'PUBLIC' | 'PRIVATE',
    premiumEmail: '',
    youtubeMusicUrl: '',                        // optional favourite-song YouTube URL, embedded on the landing page

    // ── AUDIO & PLAYBACK SETTINGS ─────────────────────
    storyAudioStartTimestamp: '',
    webAudioStartTimestamp: '', // e.g. '00:15' or start timestamp
  });

  const [isGeneratingQuote, setIsGeneratingQuote] = useState(false);
  const [previousQuotes, setPreviousQuotes] = useState<string[]>([]);
  const emotionalTermRef = useRef<string>('');
  const babyTermRef = useRef<string>('');
  const coupleTermRef = useRef<string>('');
  const usedBabyTerms = useRef<string[]>([]);
  const usedCoupleTerms = useRef<string[]>([]);

  const [sessionStoryId] = useState(() => 'id-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8));
  const [uploadingMap, setUploadingMap] = useState<Record<string, boolean>>({});
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);

  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
        setIsInputFocused(true);
      }
    };
    const handleFocusOut = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
        setIsInputFocused(false);
      }
    };

    window.addEventListener('focusin', handleFocusIn);
    window.addEventListener('focusout', handleFocusOut);
    return () => {
      window.removeEventListener('focusin', handleFocusIn);
      window.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  const getActiveStoryId = () => {
    if ((formData as any).storyId) return (formData as any).storyId;
    const semanticId = generateSemanticStoryId(formData);
    setFormData(prev => ({ ...prev, storyId: semanticId }));
    return semanticId;
  };

  // Razorpay states for wizard checkout
  const [paymentStatus, setPaymentStatus] = useState<'IDLE' | 'LOADING' | 'VERIFYING' | 'SUCCESS' | 'FAILED'>('IDLE');
  const [paymentError, setPaymentError] = useState<string>('');
  const [checkingPayment, setCheckingPayment] = useState<boolean>(false);
  const [unusedPayment, setUnusedPayment] = useState<{ paymentId: string; amount: number } | null>(null);
  const [isSavingFreeStory, setIsSavingFreeStory] = useState<boolean>(false);

  // Auto-save form draft whenever formData changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('jashn_creation_draft', JSON.stringify(formData));
      } catch (err) {
        console.warn('Could not save creation draft to localStorage:', err);
      }
    }
  }, [formData]);

  // Check for any pending or interrupted payment on mount (Industrial Page Refresh Recovery)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const pending = localStorage.getItem('pending_razorpay_order');
    if (pending) {
      try {
        const { orderId, email, amount } = JSON.parse(pending);
        if (orderId && email) {
          setCheckingPayment(true);
          setPaymentStatus('VERIFYING');
          fetch('/api/check-order-status', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ orderId, email, amount }),
          })
            .then(res => res.json())
            .then(result => {
              if (result.success && result.verified) {
                setPaymentStatus('SUCCESS');
                localStorage.setItem('premium_payment_id', result.paymentId);
                localStorage.setItem('premium_payment_verified_email', email);
                localStorage.removeItem('pending_razorpay_order');
                setUnusedPayment(null);
              } else {
                setPaymentStatus('IDLE');
                localStorage.removeItem('pending_razorpay_order');
              }
            })
            .catch(err => {
              console.warn('Error checking pending order status:', err);
              setPaymentStatus('IDLE');
              localStorage.removeItem('pending_razorpay_order');
            })
            .finally(() => {
              setCheckingPayment(false);
            });
        }
      } catch (e) {
        console.warn('Error parsing pending payment:', e);
        localStorage.removeItem('pending_razorpay_order');
      }
    }
  }, []);

  // Debounced email check for pre-existing unused payments (No more silent SUCCESS override!)
  useEffect(() => {
    if (!formData.premiumEmail) {
      setUnusedPayment(null);
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.premiumEmail)) {
      setUnusedPayment(null);
      return;
    }

    // If already successfully paid, no need to check or show unused payment popup
    if (paymentStatus === 'SUCCESS') return;

    const controller = new AbortController();
    const checkEmailPayment = async () => {
      try {
        setCheckingPayment(true);
        const res = await fetch(`/api/check-payment?email=${encodeURIComponent(formData.premiumEmail)}`, {
          signal: controller.signal,
        });
        const result = await res.json();
        if (result.success && result.verified) {
          setUnusedPayment({ paymentId: result.paymentId, amount: result.amount });
          setFormData(prev => ({
            ...prev,
            premiumPrice: result.amount,
            amount: result.amount
          }));
        } else {
          setUnusedPayment(null);
        }
      } catch (err: any) {
        const isAbort = err.name === 'AbortError' || 
                        err.message?.includes('aborted') || 
                        err.message?.includes('abort') || 
                        err.message?.includes('signal is aborted');
        if (!isAbort) {
          console.warn('Error checking payment:', err);
        }
      } finally {
        setCheckingPayment(false);
      }
    };

    const timer = setTimeout(checkEmailPayment, 600); // 600ms debounce
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [formData.premiumEmail, paymentStatus]);

  const executeWizardPayment = async () => {
    try {
      setPaymentStatus('LOADING');
      setPaymentError('');
      // Clear any stale pending order first to ensure clean state
      localStorage.removeItem('pending_razorpay_order');

      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: (formData.premiumPrice || 99) * 100, // in paise
          currency: 'INR',
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create Razorpay order');
      }

      const orderData = await res.json();

      // Store in localStorage immediately as pending to allow refresh recovery
      localStorage.setItem('pending_razorpay_order', JSON.stringify({
        orderId: orderData.order_id,
        email: formData.premiumEmail,
        amount: formData.premiumPrice || 99,
      }));

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Jashn Premium Creation',
        description: `Premium Celebration Creation: ${formData.names || formData.occasionName || 'Celebration'}`,
        order_id: orderData.order_id,
        prefill: {
          email: formData.premiumEmail,
        },
        handler: async function (response: any) {
          try {
            setPaymentStatus('VERIFYING');
            const verifyRes = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                email: formData.premiumEmail,
                amount: formData.premiumPrice || 99,
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              setPaymentStatus('SUCCESS');
              localStorage.setItem('premium_payment_id', response.razorpay_payment_id);
              localStorage.setItem('premium_payment_verified_email', formData.premiumEmail);
              localStorage.removeItem('pending_razorpay_order');
              setUnusedPayment(null);
            } else {
              setPaymentStatus('FAILED');
              setPaymentError(verifyData.error || 'Payment verification failed.');
              localStorage.removeItem('pending_razorpay_order');
            }
          } catch (err: any) {
            console.warn('Error during signature verification:', err);
            setPaymentStatus('FAILED');
            setPaymentError('Verification request failed. Please contact support.');
            localStorage.removeItem('pending_razorpay_order');
          }
        },
        modal: {
          ondismiss: function () {
            setPaymentStatus('FAILED');
            setPaymentError('Payment window was closed.');
            localStorage.removeItem('pending_razorpay_order');
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (resp: any) {
        console.warn('Razorpay payment failed event:', resp.error);
        setPaymentStatus('FAILED');
        setPaymentError(resp.error?.description || 'Payment processing failed.');
        localStorage.removeItem('pending_razorpay_order');
      });
      rzp.open();
    } catch (err: any) {
      console.warn('Payment Error:', err);
      setPaymentStatus('FAILED');
      setPaymentError(err.message || 'Payment initialization failed.');
      localStorage.removeItem('pending_razorpay_order');
    }
  };

  const handleWizardPayment = async () => {
    if (!formData.premiumEmail) {
      alert('Please enter your email address first.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.premiumEmail)) {
      alert('Please enter a valid email address.');
      return;
    }

    // Direct execution for production payment gateway
    executeWizardPayment();
  };

  // ─────────────────────────────────────────────────────────────
  // TASK 1 — UNIVERSAL BACK BUTTON (BULLETPROOF ARCHITECTURE)
  //
  // DESIGN PRINCIPLE — Single Source of Truth:
  //   The browser's popstate event is THE ONLY place that calls
  //   setCurrentStep when going backward. No other code path
  //   touches state during back navigation. This eliminates the
  //   previous double-decrement bug where handleBack() called
  //   both setCurrentStep AND history.back() (which fired popstate
  //   which called setCurrentStep a second time).
  //
  // HISTORY STACK MANAGEMENT:
  //   • On mount:   replaceState({ jashnWizard:true, step:0 })
  //                 Stamps the current entry (does NOT add to stack)
  //   • On forward: pushState({ jashnWizard:true, step:N })
  //                 Adds exactly one entry per step. Going back
  //                 then forward truncates the forward stack via
  //                 native browser behavior — no duplicates possible.
  //   • On back:    ONLY window.history.back() is called.
  //                 popstate fires → handler reads e.state.step →
  //                 setCurrentStep(e.state.step). If e.state has no
  //                 jashnWizard key (went past step 0) → go home.
  //
  // LOOP PREVENTION:
  //   Native history.pushState truncates forward entries on each
  //   push, so back→forward→back never creates duplicates.
  //   History is always a clean linear sequence: [home, step0,
  //   step1, step2, ...] with each step appearing exactly once.
  //
  // ALL BACK METHODS UNIFIED:
  //   Hardware button / gesture / browser nav bar / keyboard →
  //   all fire the popstate event → handled identically.
  //   Virtual back button → calls window.history.back() → popstate.
  //   One code path. Zero duplication.
  // ─────────────────────────────────────────────────────────────

  useEffect(() => {
    // Stamp the current browser history entry as wizard step 0.
    // replaceState (not pushState) so we don't add to the stack —
    // the entry behind this one remains the user's previous page.
    window.history.replaceState({ jashnWizard: true, step: 0 }, '');

    const onPopState = (e: PopStateEvent) => {
      if (e.state && e.state.jashnWizard === true) {
        // Moved to a wizard entry — sync React state to its step
        setCurrentStep(e.state.step as number);
      }
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []); // Runs once. setCurrentStep is stable (React guarantee).

  // Keyboard back: Alt+Left (universal) + Backspace (when not typing)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const inTextField =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        window.history.back();
      } else if (e.key === 'Backspace' && !inTextField) {
        e.preventDefault();
        window.history.back();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // HIGH-LEVEL SECURITY GUARD: Prevent proceeding past Step 17 in Premium mode without 100% verified payment
  useEffect(() => {
    if (formData.mode === 'PREMIUM') {
      const flow = getStepFlow();
      const step17Index = flow.indexOf(17);
      if (step17Index >= 0 && currentStep > step17Index && paymentStatus !== 'SUCCESS') {
        console.warn('[Security Guard] Attempted step bypass without verified payment. Resetting to Step 17.');
        setCurrentStep(step17Index);
      }
    }
  }, [currentStep, formData.mode, paymentStatus]);

  const getStepFlow = () => {
    if (formData.category === 'SPECIAL') {
      return [0, 2, 3, 4, 5];
    }
    // ── PREMIUM-ONLY BRANCH (fully separated — zero shared content steps) ───
    // FIX: Previously this branch continued into steps 2,3,4,5 — which are
    // Free-mode's "Enter Details" (relation-label prompts), "Memories &
    // Tunes" (5-photo uploader that duplicates/conflicts with Premium's own
    // 6-photo gallery), "Choose Message" (Free's AI-quote/template system),
    // and "Select Theme" (Royal Gold picker — Premium's landing page is
    // already gold-themed by design). That caused Free-mode questions to
    // visibly "mix into" the Premium flow, exactly as reported.
    //
    // Premium now has its OWN complete, self-contained step sequence with
    // NO overlap with Free-mode steps 2/3/4/5 whatsoever. Step 17 (new) is
    // the FIRST premium step — it collects the price/value the creator sets
    // for this page. No payment gateway exists yet, so the user simply enters
    // a number and continues straight through. Once a payment interface is
    // wired up later, this same step becomes the actual checkout gate and
    // the rest of the flow (steps 16, 10-15) will only unlock after payment
    // succeeds — for now, entering a value is enough to proceed.
    // Step 16 collects the one generic field Premium's hero needs (`names`,
    // reusing the same field for storage — not free-mode UI/logic, just the
    // field). Music upload is folded into step 13 (Gallery) since it's
    // already the "media" step, using the exact same handleFileUpload
    // ('MUSIC') used by Free mode — reused verbatim, it's generic.
    // Step 18 (new) is a SEPARATE step for the Love Letter feature — its own
    // dedicated field (loveLetterText), distinct from Step 11's short
    // wishesTexts quotes. These are two different features that both exist
    // independently on the landing page; Step 18 must never replace Step 11.
    if (formData.mode === 'PREMIUM') {
      return [1, 17, 16, 10, 11, 18, 12, 13, 14, 15];
    }
    return [1, 2, 3, 4, 5];
  };

  const getCurrentStepValue = () => {
    const flow = getStepFlow();
    return flow[currentStep] || 0;
  };

  const handleNext = async () => {
    const flow = getStepFlow();
    const stepValue = flow[currentStep] || 0;

    // STEP 2 Validation: Free Story Mode Email Recovery Input
    if (stepValue === 2 && formData.mode === 'FREE') {
      if (!formData.email) {
        alert('Please enter your email address for story recovery.');
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        alert('Please enter a valid email address.');
        return;
      }
    }

    // STEP 17 Validation: Set Your Value, Email & Privacy Selection
    if (stepValue === 17) {
      if (!formData.premiumPrice || formData.premiumPrice < 1) {
        alert('Please enter a valid amount.');
        return;
      }
      if (!formData.premiumEmail) {
        alert('Please enter your email address.');
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.premiumEmail)) {
        alert('Please enter a valid email address.');
        return;
      }
      if (!formData.premiumPrivacy) {
        alert('Please select your privacy preference.');
        return;
      }
      if (formData.mode === 'PREMIUM' && paymentStatus !== 'SUCCESS') {
        alert('Payment not confirmed! You must complete and verify payment before proceeding.');
        return;
      }
    }

    const isLastStep = currentStep >= flow.length - 1;

    if (isLastStep) {
      if (formData.mode === 'PREMIUM' && paymentStatus !== 'SUCCESS') {
        alert('Access Denied: High-level security active. Valid payment verification is required to create a premium celebration page.');
        return;
      }
      if (isFormSubmitting) return;
      setIsFormSubmitting(true);

      if (formData.category === 'MARRIAGE' || formData.category === 'RELATIONSHIP' || formData.category === 'BIRTHDAY') {
        const term = getRandomEmotionalTerm();
        emotionalTermRef.current = term;
      }

      // Baby terms for New Member - BOTH For Me AND For Other
      if (formData.specialSubcategory === 'NEW_MEMBERS') {
        const term = getBabyTerm();
        babyTermRef.current = term;
      }

      // Couple terms for Wedding Date - BOTH For Me AND For Other
      if (formData.specialSubcategory === 'MARRIAGE_DATE_FIX') {
        const term = getCoupleTerm();
        coupleTermRef.current = term;
      }

      let finalFormData: any = { 
        ...formData,
        emotionalTerm: emotionalTermRef.current,
        babyTerm: babyTermRef.current,
        coupleTerm: coupleTermRef.current,
        termLine: emotionalTermRef.current || babyTermRef.current || coupleTermRef.current || (formData as any).relation || formData.relationLabel || ''
      };
      if (formData.isForSelf && !formData.creatorName) {
        if (formData.category === 'BIRTHDAY') {
          finalFormData = { ...finalFormData, creatorName: formData.names || '' };
        } else if (formData.specialSubcategory === 'NEW_MEMBERS') {
          if (formData.fatherName || formData.motherName) {
            finalFormData = { ...finalFormData, creatorName: formData.fatherName || formData.motherName };
          }
        } else if (formData.specialSubcategory === 'MARRIAGE_DATE_FIX') {
          if (formData.name1 || formData.name2) {
            finalFormData = { ...finalFormData, creatorName: formData.name1 || formData.name2 };
          }
        }
      }

      const newStoryId = generateSemanticStoryId(finalFormData);
      finalFormData.storyId = newStoryId;
      if (typeof window !== 'undefined') {
        finalFormData.paymentId = localStorage.getItem('premium_payment_id') || (formData as any).paymentId || '';
      }

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('celebrationData', JSON.stringify(finalFormData));
          localStorage.setItem('storyId', newStoryId);
          localStorage.setItem('premiumStoryId', newStoryId);
          localStorage.setItem('freeStoryId', newStoryId);
          localStorage.setItem('emotionalTerm', emotionalTermRef.current);
          localStorage.setItem('babyTerm', babyTermRef.current);
          localStorage.setItem('coupleTerm', coupleTermRef.current);
        } catch (err) {
          console.warn('Could not save celebrationData to localStorage:', err);
        }
      }

      setIsFormSubmitting(true);

      // Save story to Firestore and GCS before navigating
      if (finalFormData.mode !== 'PREMIUM') {
        try {
          const saveRes = await fetch('/api/free-story', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              storyId: newStoryId,
              email: finalFormData.email || finalFormData.premiumEmail || '',
              celebrationData: finalFormData
            })
          });
          const saveJson = await saveRes.json();
          if (saveJson.storyId) {
            finalFormData.storyId = saveJson.storyId;
          }
        } catch (err) {
          console.error('Initial story save error:', err);
        }
      }

      // Industrial-grade image pre-decoding before page transition
      const imagesToPreload = [
        ...(Array.isArray(finalFormData.photos) ? finalFormData.photos : []),
        finalFormData.heroImage,
        finalFormData.creatorPhoto,
        finalFormData.secretImage,
        ...(Array.isArray(finalFormData.galleryPhotos) ? finalFormData.galleryPhotos : [])
      ].filter((u): u is string => Boolean(u && typeof u === 'string'));

      if (imagesToPreload.length > 0) {
        await Promise.all(
          imagesToPreload.map(url => new Promise<void>(resolve => {
            const img = new Image();
            img.src = url;
            const done = () => {
              if ('decode' in img && typeof img.decode === 'function') {
                img.decode().then(resolve).catch(resolve);
              } else {
                resolve();
              }
            };
            if (img.complete && img.naturalWidth > 0) done();
            else {
              img.onload = done;
              img.onerror = () => resolve();
            }
          }))
        );
      }

      if (formData.mode === 'PREMIUM') {
        router.push(`/celebrate/premium?pageId=${newStoryId}`);
      } else {
        router.push(`/celebrate/preview?storyId=${newStoryId}`);
      }
    } else {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      // Push a history entry stamped with the new step number.
      // Native pushState truncates any forward entries — so if the
      // user went back then forward, the old forward entry is gone
      // before the new one is added. No duplicates, no loops.
      window.history.pushState({ jashnWizard: true, step: nextStep }, '');
    }
  };

  const getRandomEmotionalTerm = () => {
    let terms: string[] = [];

    if (formData.category === 'MARRIAGE') {
      if (formData.whoAreYou === 'HUSBAND') {
        terms = [
          "My Beautiful Wife", "My Better Half", "My Life Partner",
          "My Soulmate", "My Queen", "My Everything",
          "My World", "My Love", "My Beloved Wife"
        ];
      } else {
        terms = [
          "My Handsome Husband", "My Better Half", "My Life Partner",
          "My Soulmate", "My King", "My Everything",
          "My World", "My Love", "My Beloved Husband"
        ];
      }
    } else if (formData.category === 'RELATIONSHIP') {
      if (formData.whoAreYou === 'MALE_PARTNER') {
        terms = [
          "My Cute Girl", "My Pretty Love", "My Heart's Beat",
          "My Sweetheart", "My Jaan", "My Sunshine",
          "My Forever Crush", "My Princess", "My Baby"
        ];
      } else {
        terms = [
          "My Cute Boy", "My Handsome Love", "My Heart's Beat",
          "My Sweetheart", "My Jaan", "My Sunshine",
          "My Forever Crush", "My Prince", "My Baby"
        ];
      }
    }

    const availableTerms = terms.filter(t => t !== emotionalTermRef.current);
    return availableTerms[Math.floor(Math.random() * availableTerms.length)] || terms[0];
  };

  // Baby term generation for New Member
  const getBabyTerm = () => {
    const terms = [
      "My Baby", "Little One", "Tiny Human", "Sweet One", "Small Joy",
      "Pure Love", "New Life", "Little Soul", "Mini Human", "Baby Love",
      "Tiny Joy", "Little Smile", "Small Wonder", "Pure Joy", "Little Miracle"
    ];

    const availableTerms = terms.filter(t => !usedBabyTerms.current.includes(t));

    if (availableTerms.length === 0) {
      usedBabyTerms.current = [];
      availableTerms.push(...terms);
    }

    const term = availableTerms[Math.floor(Math.random() * availableTerms.length)];
    usedBabyTerms.current.push(term);

    return term;
  };

  // Couple term generation for Wedding Date
  const getCoupleTerm = () => {
    const terms = [
      "Baby On Way", "Baby Coming Soon", "Little One Coming",
      "New Member Coming", "Mini Human Loading", "Tiny Boss Coming",
      "Sleep Gone Soon", "Parents Upgrade Loading"
    ];

    const availableTerms = terms.filter(t => !usedCoupleTerms.current.includes(t));

    if (availableTerms.length === 0) {
      usedCoupleTerms.current = [];
      availableTerms.push(...terms);
    }

    const term = availableTerms[Math.floor(Math.random() * availableTerms.length)];
    usedCoupleTerms.current.push(term);

    return term;
  };

  const getOrdinal = (n: string) => {
    const s = ["th", "st", "nd", "rd"];
    const v = parseInt(n) || 0;
    const v100 = v % 100;
    return n + (s[(v100 - 20) % 10] || s[v100] || s[0]);
  };

  // TASK 8/9/11: Separate templates for "For Yourself" (SELF) and "For Others" (OTHER)
  const SELF_TEMPLATES = {
    BIRTHDAY: {
      1: {
        hindi: `आज मेरा [Age]वाँ जन्मदिन है। हे प्रभु, मेरी अब तक की भूलों को क्षमा करें और आगे मुझे सद्बुद्धि व सन्मार्ग पर चलने की शक्ति दें।`,
        english: `Today is my [Age]th birthday. Dear God, please forgive my past mistakes and grant me wisdom and the strength to walk on the right path ahead.`
      },
      2: {
        hindi: `ईश्वर की कृपा से आज मेरे जीवन के [Age] वर्ष पूर्ण हुए। मेरी गलतियों को माफ करें और आने वाला जीवन शुभ, सफल व मंगलमय बनाएं।`,
        english: `By God's grace, [Age] years of my life are complete today. Please forgive my mistakes and bless the life ahead to be auspicious, successful, and joyful.`
      },
      3: {
        hindi: `आज [Age] वर्ष पूरे होने पर मैं ईश्वर के चरणों में नमन करता हूँ। हे भगवान, मेरी रक्षा करें और आगे मेरे लिए अच्छा ही अच्छा हो, ऐसी कृपा करें।`,
        english: `On completing [Age] years today, I bow at God's feet. O Lord, protect me and bless me so that only good things come my way from here on.`
      }
    },
    RELATIONSHIP: {
      1: {
        hindi: `आज हमारी रिलेशनशिप एनिवर्सरी है। हे भगवान, इतना अच्छा जीवनसाथी देने के लिए धन्यवाद, हमारा रिश्ता सदा प्रेम व विश्वास से भरा रहे।`,
        english: `Today is our relationship anniversary. Thank you, God, for such a wonderful partner — may our relationship always be filled with love and trust.`
      },
      2: {
        hindi: `ईश्वर का आभार है कि आपने हमें एक-दूसरे से जोड़ा। हमारे रिश्ते पर अपनी कृपा बनाए रखें और जीवन को सुखमय करें।`,
        english: `We are grateful to God for bringing us together. Please continue to bless our relationship and make our lives filled with happiness.`
      },
      3: {
        hindi: `आज हमारे प्रेम संबंध का पावन दिन है। हे प्रभु, हमारा साथ यूँ ही बना रहे और हमारे जीवन में हमेशा शांति रहे।`,
        english: `Today is the sacred day of our love bond. O Lord, may we always stay together and may there always be peace in our lives.`
      }
    },
    MARRIAGE: {
      1: {
        hindi: `आज हमारी विवाह वर्षगांठ है। हे ईश्वर, इतने अच्छे जीवनसाथी के लिए धन्यवाद, हमारे वैवाहिक जीवन को सदा सुखी रखें।`,
        english: `Today is our wedding anniversary. Thank you, God, for such a wonderful life partner — please keep our married life always happy.`
      },
      2: {
        hindi: `भगवान की कृपा से आज हम अपनी शादी की सालगिरह मना रहे हैं। हम दोनों पर अपनी अनुकंपा बनाए रखें और जीवन को आनंदमय करें।`,
        english: `By God's grace, we are celebrating our wedding anniversary today. Please continue to shower your blessings on us both and fill our life with joy.`
      },
      3: {
        hindi: `आज हमारे दांपत्य जीवन का एक और पवित्र वर्ष पूर्ण हुआ। हे प्रभु, हमारे रिश्ते में प्रेम, समझ और समर्पण बनाए रखें।`,
        english: `Another sacred year of our married life is complete today. O Lord, please keep love, understanding, and dedication in our relationship.`
      }
    }
  };

  const TEMPLATES = {
    MARRIAGE: {
      1: {
        hindi: `[Years] वर्षों के इस पवित्र बंधन पर [Name] को दिल से हार्दिक बधाई और अनेक शुभकामनाएं।`,
        english: `Heartfelt congratulations and best wishes to [Name] on [Years] years of this sacred bond.`
      },
      2: {
        hindi: `[Years] वर्षों से प्यार, समर्पण और विश्वास का सुंदर सफर तय करते हुए [Name] को विवाह वर्षगांठ की हार्दिक शुभकामनाएं।`,
        english: `Warmest wishes to [Name] on their wedding anniversary, celebrating [Years] beautiful years of love, devotion, and trust.`
      },
      3: {
        hindi: `[Name] को [Years]वीं विवाह वर्षगांठ की बहुत-बहुत बधाई।`,
        english: `Heartiest congratulations to [Name] on their [Years]th wedding anniversary.`
      }
    },
    RELATIONSHIP: {
      1: {
        hindi: `[Years] वर्षों से साथ, समझ और प्यार का यह सफर [Name] के लिए हमेशा मुस्कुराहटों से भरा रहे।`,
        english: `May this beautiful journey of [Years] years of companionship, understanding, and love continue to bring smiles to [Name].`
      },
      2: {
        hindi: `[Years] वर्षों की खूबसूरत बॉन्डिंग के लिए [Name] को दिल से बधाई और शुभकामनाएं।`,
        english: `Heartfelt congratulations and best wishes to [Name] for [Years] years of beautiful bonding.`
      },
      3: {
        hindi: `[Name] को [Years]वीं रिलेशनशिप एनिवर्सरी मुबारक।`,
        english: `Happy [Years]th relationship anniversary to [Name].`
      }
    },
    BIRTHDAY: {
      1: {
        hindi: `[Name] को जन्मदिन के इस खास अवसर पर ढेर सारी बधाई, खुशियां और उज्जवल भविष्य की शुभकामनाएं।`,
        english: `Heartiest congratulations to [Name] on this special birthday, with wishes for happiness and a bright future ahead.`
      },
      2: {
        hindi: `इस नए साल के साथ [Name] के जीवन में और अधिक सफलता, स्वास्थ्य और खुशियां आएं — जन्मदिन मुबारक।`,
        english: `Wishing [Name] greater success, good health, and happiness in the coming year — Happy Birthday.`
      },
      3: {
        hindi: `[Name] को जन्मदिन की हार्दिक बधाई और शुभकामनाएं।`,
        english: `Heartfelt birthday wishes to [Name].`
      }
    },
    JYANTI: {
      1: {
        hindi: `[Naam] की जयंती पर उनके विचारों और आदर्शों को नमन।`,
        english: `Salutations to the thoughts and ideals of [Naam] on their birth anniversary.`
      },
      2: {
        hindi: `[Naam] के जीवन और संघर्ष से प्रेरित होकर, आज हम उनकी जयंती पर श्रद्धांजलि अर्पित करते हैं।`,
        english: `Inspired by the life and struggles of [Naam], we offer our tribute on their birth anniversary today.`
      },
      3: {
        hindi: `[Naam] जयंती पर शत-शत नमन।`,
        english: `Respectful salutations on [Naam] Jayanti.`
      }
    },
    DIVAS: {
      1: {
        hindi: `[Divas ka Naam] के अवसर पर इसके महत्व को समझें और इसे अपने जीवन का हिस्सा बनाएं।`,
        english: `On the occasion of [Divas ka Naam], let us understand its importance and make it a part of our lives.`
      },
      2: {
        hindi: `[Divas ka Naam] हमें जिम्मेदारी, जागरूकता और सकारात्मक बदलाव की याद दिलाता है।`,
        english: `[Divas ka Naam] reminds us of responsibility, awareness, and positive change.`
      },
      3: {
        hindi: `[Divas ka Naam] पर देश और समाज के प्रति अपनी जिम्मेदारी को याद करें।`,
        english: `Remember your responsibility towards the nation and society on [Divas ka Naam].`
      }
    },
    FESTIVALS: {
      1: {
        hindi: `इस पवित्र अवसर पर आप और आपके परिवार को [Festival Name] की हार्दिक शुभकामनाएं।`,
        english: `Heartfelt wishes to you and your family on the sacred occasion of [Festival Name].`
      },
      2: {
        hindi: `[Festival Name] के शुभ अवसर पर सुख, शांति और समृद्धि आपके जीवन में बनी रहे।`,
        english: `May happiness, peace, and prosperity remain in your life on the auspicious occasion of [Festival Name].`
      },
      3: {
        hindi: `खुशियों और उमंग से भरा [Festival Name] आपके जीवन को रोशन करे।`,
        english: `May [Festival Name] filled with joy and enthusiasm illuminate your life.`
      }
    },
    NEW_MEMBERS: {
      forOther: {
        1: {
          hindi: `[Date] को [Time] पर [Father Name] और [Mother Name] के परिवार में एक नए सदस्य का आगमन हुआ। इस शुभ अवसर पर ढेर सारी बधाइयां।`,
          english: `A new member arrived in the family of [Father Name] and [Mother Name] on [Date] at [Time]. Heartiest congratulations on this auspicious occasion.`
        },
        2: {
          hindi: `भगवान की कृपा से [Date] को [Time] पर [Father Name] और [Mother Name] के घर एक नन्हे मेहमान का आगमन हुआ। परिवार को हार्दिक शुभकामनाएं।`,
          english: `By God's grace, a little guest arrived at [Father Name] and [Mother Name]'s home on [Date] at [Time]. Heartfelt wishes to the family.`
        },
        3: {
          hindi: `[Father Name] और [Mother Name] के घर [Date] को [Time] पर खुशियों ने दस्तक दी — नए सदस्य के आगमन पर बधाई।`,
          english: `Happiness knocked on [Father Name] and [Mother Name]'s door on [Date] at [Time] — congratulations on the arrival of a new member.`
        }
      },
      forMe: {
        1: {
          hindi: `[Date] को [Time] पर हमारे परिवार में एक नए सदस्य का स्वागत। इस खुशी को आपके साथ साझा करते हुए हर्ष हो रहा है।`,
          english: `Welcoming a new member to our family on [Date] at [Time]. Delighted to share this joy with you.`
        },
        2: {
          hindi: `भगवान की कृपा से [Date] को [Time] पर हमारे घर एक नन्हे फरिश्ते का आगमन हुआ। आपके आशीर्वाद की अपेक्षा है।`,
          english: `By God's grace, a little angel arrived at our home on [Date] at [Time]. Seeking your blessings.`
        },
        3: {
          hindi: `[Date] को [Time] पर हमारे जीवन में खुशियों का नया अध्याय शुरू हुआ — नए सदस्य के स्वागत में।`,
          english: `A new chapter of happiness began in our lives on [Date] at [Time] — welcoming our new family member.`
        }
      }
    },
    MARRIAGE_DATE_FIX: {
      forOther: {
        1: {
          hindi: `खुशी के साथ सूचित किया जाता है कि [Name 1] और [Name 2] के विवाह की शुभ तिथि [Date] निश्चित हुई है। आशीर्वाद अपेक्षित।`,
          english: `It is joyfully announced that the auspicious wedding date of [Name 1] and [Name 2] has been fixed on [Date]. Blessings are awaited.`
        },
        2: {
          hindi: `दो परिवारों की रज़ा और आशीर्वाद से [Name 1] और [Name 2] के शुभ विवाह की तिथि [Date] तय हुई।`,
          english: `With the consent and blessings of two families, the auspicious wedding date of [Name 1] and [Name 2] has been set on [Date].`
        },
        3: {
          hindi: `प्यार और परंपरा के संगम के साथ [Name 1] और [Name 2] के विवाह की शुभ तिथि [Date] निश्चित हुई।`,
          english: `With the union of love and tradition, the auspicious wedding date of [Name 1] and [Name 2] has been fixed on [Date].`
        }
      },
      forMe: {
        1: {
          hindi: `हर्ष के साथ सूचित करते हैं कि हमारे विवाह की शुभ तिथि [Date] निश्चित हुई है। आप सभी का आशीर्वाद और उपस्थिति अपेक्षित है।`,
          english: `We are delighted to announce that our wedding date has been fixed on [Date]. Your blessings and presence are requested.`
        },
        2: {
          hindi: `परिवार और मित्रों के आशीर्वाद से हमारे विवाह की शुभ तिथि [Date] तय हुई है। आपकी उपस्थिति से यह दिन और भी खास होगा।`,
          english: `With the blessings of family and friends, our wedding date has been set on [Date]. Your presence will make this day more special.`
        },
        3: {
          hindi: `नए जीवन की शुरुआत करते हुए, हमारे विवाह की शुभ तिथि [Date] निश्चित की है। आप सभी को निमंत्रण एवं आशीर्वाद की अपेक्षा।`,
          english: `Beginning a new life together, we have fixed our wedding date on [Date]. Inviting you all with request for blessings.`
        }
      }
    }
  };

  const fillPlaceholders = (template: string, data = formData): string => {
    let filled = template;

    if (data.category === 'MARRIAGE' || data.category === 'RELATIONSHIP') {
      if (data.isForSelf) {
        filled = filled.replace(/\[Name\]/g, data.names || '[Name]');
      } else {
        filled = filled.replace(/\[Name\]/g, data.relationLabel || data.names || '[Name]');
      }
    } else {
      filled = filled.replace(/\[Name\]/g, data.names || '[Name]');
    }

    filled = filled.replace(/\[Years\]/g, data.count || '[Years]');
    filled = filled.replace(/\[Age\]/g, data.count || '[Age]');
    filled = filled.replace(/\[Naam\]/g, data.occasionName || '[Naam]');
    filled = filled.replace(/\[Divas ka Naam\]/g, data.occasionName || '[Divas ka Naam]');
    filled = filled.replace(/\[Festival Name\]/g, data.occasionName || '[Festival Name]');
    filled = filled.replace(/\[Date\]/g, data.occasionDate || '[Date]');
    filled = filled.replace(/\[Time\]/g, data.occasionTime || '[Time]');
    filled = filled.replace(/\[Father Name\]/g, data.fatherName || '[Father Name]');
    filled = filled.replace(/\[Mother Name\]/g, data.motherName || '[Mother Name]');
    filled = filled.replace(/\[Name 1\]/g, data.name1 || '[Name 1]');
    filled = filled.replace(/\[Name 2\]/g, data.name2 || '[Name 2]');

    return filled;
  };

  const getPreviewForTemplate = (templateNum: 1 | 2 | 3): string => {
    let templateKey = formData.category;
    if (formData.category === 'SPECIAL') {
      templateKey = formData.specialSubcategory;
    }

    if (formData.isForSelf && (formData.category === 'MARRIAGE' || formData.category === 'RELATIONSHIP' || formData.category === 'BIRTHDAY')) {
      const selfTemplates = (SELF_TEMPLATES as any)[formData.category];
      if (selfTemplates && selfTemplates[templateNum]) {
        const rawTemplate = selfTemplates[templateNum][formData.selectedLanguage] || '';
        return fillPlaceholders(rawTemplate);
      }
    }

    const templates = TEMPLATES[templateKey as keyof typeof TEMPLATES];
    if (!templates) return 'Enter details to preview';

    let template;

    if (templateKey === 'NEW_MEMBERS' || templateKey === 'MARRIAGE_DATE_FIX') {
      const subTemplates = templates as any;
      template = formData.isForSelf ? subTemplates.forMe[templateNum] : subTemplates.forOther[templateNum];
    } else {
      template = (templates as any)[templateNum];
    }

    if (!template) return '';

    const rawTemplate = template[formData.selectedLanguage] || '';
    return fillPlaceholders(rawTemplate);
  };

  const generateAIQuote = async () => {
    setIsGeneratingQuote(true);
    setFormData(prev => ({ ...prev, generatedAIQuote: '' }));

    try {
      const response = await fetch('/api/generate-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          occasion: formData.category,
          language: formData.selectedLanguage,
          isForSelf: formData.isForSelf,
          subcategory: formData.specialSubcategory,
          targetName: formData.isForSelf ? formData.names : formData.relationLabel,
          years: formData.count,
          age: formData.count,
          occasionName: formData.occasionName,
          previousQuotes: previousQuotes,
          timestamp: Date.now()
        })
      });

      const data = await response.json();

      if (data.fallback) {
        console.log('Using fallback quote');
      }

      const newQuote = data.quote;
      setFormData(prev => ({ ...prev, generatedAIQuote: newQuote }));
      setPreviousQuotes(prev => [...prev, newQuote]);

    } catch (error: any) {
      console.error('AI Error:', error);
      alert('Quote generation failed. Please try again.');
    } finally {
      setIsGeneratingQuote(false);
    }
  };

  const getCurrentQuote = () => {
    if (formData.selectedTemplate === 4) {
      return fillPlaceholders(formData.generatedAIQuote || '');
    }
    return getPreviewForTemplate(formData.selectedTemplate as 1 | 2 | 3);
  };

  useEffect(() => {
    const stepValue = getCurrentStepValue();
    if (stepValue === 4) {
      const quote = getCurrentQuote();
      if (quote && quote !== 'Enter details to preview') {
        setFormData(prev => ({ ...prev, customMessage: quote }));
      }
    }
  }, [currentStep, formData.selectedTemplate, formData.selectedLanguage]);

  const readAndCompressImage = (file: File, maxWidth = 1200, maxHeight = 1200, quality = 0.8): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
        return;
      }

      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = (e) => {
        const img = document.createElement('img');
        img.onerror = reject;
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxHeight) {
            if (width / height > maxWidth / maxHeight) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
          const dataUrl = canvas.toDataURL(mimeType, quality);
          resolve(dataUrl);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const uploadFileToCloud = async (
    fileOrDataUrl: File | string,
    mediaKey: string,
    targetStoryId: string,
    email?: string
  ): Promise<string> => {
    setUploadingMap(prev => ({ ...prev, [mediaKey]: true }));
    try {
      let dataUri = '';
      if (typeof fileOrDataUrl === 'string') {
        dataUri = fileOrDataUrl;
      } else if (mediaKey === 'music' || fileOrDataUrl.type.startsWith('audio/')) {
        dataUri = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => resolve('');
          reader.readAsDataURL(fileOrDataUrl);
        });
      } else {
        dataUri = await readAndCompressImage(fileOrDataUrl);
      }

      const res = await fetch('/api/upload-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storyId: targetStoryId,
          mediaType: mediaKey,
          dataUri,
          email: email || '',
          mode: formData.mode === 'PREMIUM' ? 'landing' : 'story'
        })
      });
      const json = await res.json();
      if (json.success && json.url) {
        console.log(`[Instant Upload] Successfully uploaded ${mediaKey} -> ${json.url}`);
        return json.url;
      }
      return dataUri;
    } catch (err) {
      console.error(`[Instant Upload Error] ${mediaKey}:`, err);
      if (typeof fileOrDataUrl === 'string') return fileOrDataUrl;
      if (mediaKey === 'music' || fileOrDataUrl.type.startsWith('audio/')) {
        return await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => resolve('');
          reader.readAsDataURL(fileOrDataUrl);
        });
      }
      try {
        return await readAndCompressImage(fileOrDataUrl);
      } catch {
        return '';
      }
    } finally {
      setUploadingMap(prev => {
        const copy = { ...prev };
        delete copy[mediaKey];
        return copy;
      });
    }
  };

  // ── UPLOAD SIZE VALIDATION CONSTANTS ──────────────────────────────────────────
  // Chosen to optimize GCS Free Tier quota, prevent serverless body size payload
  // timeouts, and guarantee smooth high-speed uploads on mobile networks.
  const MAX_SINGLE_IMAGE_SIZE_MB = 10;    // 10 MB limit per individual photo
  const MAX_SINGLE_AUDIO_SIZE_MB = 15;    // 15 MB limit for background music track
  const MAX_COMBINED_UPLOAD_SIZE_MB = 25;  // 25 MB total combined media upload payload

  /**
   * Validates individual and combined upload file sizes BEFORE upload processing begins.
   * Returns true if valid, or false if validation failed (and displays user notification).
   */
  const validateUploadSizes = (
    newFiles: File[],
    type: 'PHOTO' | 'MUSIC' | 'CREATOR' | 'HERO' | 'GALLERY' | 'SECRET'
  ): boolean => {
    if (!newFiles || newFiles.length === 0) return true;

    // 1. Individual File Size Validation
    for (const file of newFiles) {
      const fileSizeMB = file.size / (1024 * 1024);
      const isAudio = type === 'MUSIC' || file.type.startsWith('audio/');
      const maxSingleSize = isAudio ? MAX_SINGLE_AUDIO_SIZE_MB : MAX_SINGLE_IMAGE_SIZE_MB;

      if (fileSizeMB > maxSingleSize) {
        alert(
          `Upload Rejected: "${file.name}" is too large.\n\n` +
          `• Selected File Size: ${fileSizeMB.toFixed(1)} MB\n` +
          `• Maximum Allowed Limit: ${maxSingleSize} MB\n\n` +
          `Please select a lighter ${isAudio ? 'audio file' : 'image'} (under ${maxSingleSize} MB).`
        );
        return false;
      }
    }

    // 2. Combined Batch Payload Validation
    const newBatchSizeMB = newFiles.reduce((sum, f) => sum + (f.size / (1024 * 1024)), 0);

    if (newBatchSizeMB > MAX_COMBINED_UPLOAD_SIZE_MB) {
      alert(
        `Upload Rejected: Total upload size exceeds supported limit.\n\n` +
        `• Current Batch Total: ${newBatchSizeMB.toFixed(1)} MB\n` +
        `• Maximum Allowed Combined Total: ${MAX_COMBINED_UPLOAD_SIZE_MB} MB\n\n` +
        `Please select lighter files or upload fewer files at once.`
      );
      return false;
    }

    return true;
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>, type: 'PHOTO' | 'MUSIC' | 'CREATOR') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Execute upload size validation before upload processing starts
    if (!validateUploadSizes(Array.from(files), type)) {
      if (e.target) e.target.value = '';
      return;
    }

    const currentStoryId = getActiveStoryId();
    const currentEmail = formData.email || formData.premiumEmail || '';

    try {
      if (type === 'MUSIC') {
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => resolve('');
          reader.readAsDataURL(files[0]);
        });
        if (dataUrl) {
          setFormData(prev => ({ ...prev, music: dataUrl }));
          uploadFileToCloud(files[0], 'music', currentStoryId, currentEmail).then(cloudUrl => {
            if (cloudUrl) setFormData(prev => ({ ...prev, music: cloudUrl }));
          });
        }
      } else if (type === 'CREATOR') {
        const dataUrl = await readAndCompressImage(files[0]);
        setFormData(prev => ({ ...prev, creatorPhoto: dataUrl }));
        uploadFileToCloud(files[0], 'creator', currentStoryId, currentEmail).then(cloudUrl => {
          setFormData(prev => ({ ...prev, creatorPhoto: cloudUrl }));
        });
      } else {
        const remainingSlots = 5 - formData.photos.length;
        if (remainingSlots <= 0) {
          alert('Maximum 5 images allowed');
          return;
        }

        const filesToAdd = Array.from(files).slice(0, remainingSlots);
        const startIndex = formData.photos.length;

        const dataUrls: string[] = [];
        for (const file of filesToAdd) {
          try {
            const url = await readAndCompressImage(file);
            if (url) dataUrls.push(url);
          } catch (e) {
            console.warn('[Image Read Error] Skipping corrupted image:', e);
          }
        }

        if (dataUrls.length > 0) {
          setFormData(prev => ({ ...prev, photos: [...prev.photos, ...dataUrls] }));

          filesToAdd.forEach((file, i) => {
            const photoIndex = startIndex + i;
            const mediaKey = `photo_${photoIndex}`;
            uploadFileToCloud(file, mediaKey, currentStoryId, currentEmail).then(cloudUrl => {
              if (cloudUrl) {
                setFormData(prev => {
                  const updated = [...prev.photos];
                  updated[photoIndex] = cloudUrl;
                  return { ...prev, photos: updated };
                });
              }
            });
          });
        }
      }
    } catch (err) {
      console.error('Error reading file:', err);
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  const removePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const renderInput = (placeholder: string, value: string, key: string, type: string = "text") => (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={e => setFormData({ ...formData, [key]: e.target.value })}
      className="w-full bg-[#2A0A0A]/40 border border-[#d4af37]/30 p-4 rounded-xl text-white outline-none focus:border-[#d4af37] transition-colors placeholder:text-white/30"
    />
  );

  // ── PREMIUM-ONLY HANDLERS ────────
  const handleHeroUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (!validateUploadSizes(Array.from(files), 'HERO')) {
      if (e.target) e.target.value = '';
      return;
    }
    const currentStoryId = getActiveStoryId();
    const currentEmail = formData.email || formData.premiumEmail || '';
    try {
      const dataUrl = await readAndCompressImage(files[0]);
      setFormData(prev => ({ ...prev, heroImage: dataUrl }));
      uploadFileToCloud(files[0], 'hero', currentStoryId, currentEmail).then(cloudUrl => {
        setFormData(prev => ({ ...prev, heroImage: cloudUrl }));
      });
    } catch (err) {
      console.error('Error reading hero image:', err);
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  const handleGalleryUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (!validateUploadSizes(Array.from(files), 'GALLERY')) {
      if (e.target) e.target.value = '';
      return;
    }
    const remainingSlots = 6 - formData.galleryPhotos.length;
    if (remainingSlots <= 0) { alert('Maximum 6 images allowed'); return; }
    const currentStoryId = getActiveStoryId();
    const currentEmail = formData.email || formData.premiumEmail || '';
    try {
      const filesToAdd = Array.from(files).slice(0, remainingSlots);
      const startIndex = formData.galleryPhotos.length;

      const dataUrls: string[] = [];
      for (const file of filesToAdd) {
        try {
          const url = await readAndCompressImage(file);
          if (url) dataUrls.push(url);
        } catch (e) {
          console.warn('[Gallery Read Error] Skipping corrupted image:', e);
        }
      }

      if (dataUrls.length > 0) {
        setFormData(prev => ({ ...prev, galleryPhotos: [...prev.galleryPhotos, ...dataUrls] }));

        filesToAdd.forEach((file, i) => {
          const galleryIndex = startIndex + i;
          const mediaKey = `gallery_${galleryIndex}`;
          uploadFileToCloud(file, mediaKey, currentStoryId, currentEmail).then(cloudUrl => {
            if (cloudUrl) {
              setFormData(prev => {
                const updated = [...prev.galleryPhotos];
                updated[galleryIndex] = cloudUrl;
                return { ...prev, galleryPhotos: updated };
              });
            }
          });
        });
      }
    } catch (err) {
      console.error('Error reading gallery images:', err);
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  const removeGalleryPhoto = (index: number) => {
    setFormData(prev => ({ ...prev, galleryPhotos: prev.galleryPhotos.filter((_, i) => i !== index) }));
  };

  const setSecretMessage = (index: number, text: string) => {
    setFormData(prev => {
      const next = [...prev.secretMessages];
      next[index] = text;
      return { ...prev, secretMessages: next };
    });
  };

  const addSecretMessage = () => {
    setFormData(prev => ({ ...prev, secretMessages: [...prev.secretMessages, ''] }));
  };

  const removeSecretMessage = (index: number) => {
    setFormData(prev => ({ ...prev, secretMessages: prev.secretMessages.filter((_, i) => i !== index) }));
  };

  const handleSecretImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (!validateUploadSizes(Array.from(files), 'SECRET')) {
      if (e.target) e.target.value = '';
      return;
    }
    const currentStoryId = getActiveStoryId();
    const currentEmail = formData.email || formData.premiumEmail || '';
    try {
      const dataUrl = await readAndCompressImage(files[0]);
      setFormData(prev => ({ ...prev, secretImage: dataUrl }));
      uploadFileToCloud(files[0], 'secret', currentStoryId, currentEmail).then(cloudUrl => {
        setFormData(prev => ({ ...prev, secretImage: cloudUrl }));
      });
    } catch (err) {
      console.error('Error reading secret image:', err);
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  const addWish = () => {
    if (formData.wishesTexts.length >= 4) { alert('Maximum 4 wishes allowed'); return; }
    setFormData(prev => ({ ...prev, wishesTexts: [...prev.wishesTexts, ''] }));
  };

  const updateWish = (index: number, text: string) => {
    setFormData(prev => {
      const next = [...prev.wishesTexts];
      next[index] = text;
      return { ...prev, wishesTexts: next };
    });
  };

  const removeWish = (index: number) => {
    setFormData(prev => ({ ...prev, wishesTexts: prev.wishesTexts.filter((_, i) => i !== index) }));
  };

  const addQuestion = () => {
    if (formData.questions.length >= 2) { alert('Maximum 2 questions allowed'); return; }
    setFormData(prev => ({ ...prev, questions: [...prev.questions, { text: '', revealOn: 'YES' }] }));
  };

  const updateQuestion = (index: number, patch: Partial<{ text: string; revealOn: 'YES' | 'NO' }>) => {
    setFormData(prev => {
      const next = [...prev.questions];
      next[index] = { ...next[index], ...patch };
      return { ...prev, questions: next };
    });
  };

  const removeQuestion = (index: number) => {
    setFormData(prev => ({ ...prev, questions: prev.questions.filter((_, i) => i !== index) }));
  };

  const stepValue = getCurrentStepValue();

  const needsForMeForOther = formData.specialSubcategory === 'NEW_MEMBERS' || formData.specialSubcategory === 'MARRIAGE_DATE_FIX';
  const showForMeForOther = (formData.category !== 'SPECIAL' || needsForMeForOther);

  const showWhoAreYou = (formData.category === 'MARRIAGE' || formData.category === 'RELATIONSHIP') && formData.isForSelf;

  return (
    <div className="fixed inset-0 w-full h-full bg-transparent overflow-hidden">
      <div className="fixed top-4 sm:top-6 left-0 right-0 w-full flex justify-center z-20 pointer-events-none px-6">
        <div className="w-full max-w-xs sm:max-w-md h-1 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-[#d4af37]"
            animate={{ width: `${((currentStep + 1) / getStepFlow().length) * 100}%` }}
          />
        </div>
      </div>

      <div className="w-full h-full overflow-y-auto no-scrollbar px-4 sm:px-6 pt-12 pb-36 sm:pb-40">
        <div className="min-h-full flex flex-col items-center justify-center">
          <div className="w-full max-w-md min-h-[400px] flex items-center justify-center my-auto">
            <AnimatePresence mode='wait'>

            {/* STEP 0: Select Celebration Type (Special Date only) */}
            {stepValue === 0 && (
              <motion.div
                key="step0"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="w-full space-y-4"
              >
                <h2 className="text-3xl font-serif text-[#d4af37] mb-8 text-center">Select Celebration Type</h2>

                <div className="flex flex-wrap gap-3 justify-center">
                  {[
                    { key: 'JYANTI', label: 'Jayanti', icon: Star },
                    { key: 'DIVAS', label: 'Special Day', icon: Calendar },
                    { key: 'FESTIVALS', label: 'Festivals', icon: PartyPopper },
                    { key: 'NEW_MEMBERS', label: 'New Member', icon: Baby },
                    { key: 'MARRIAGE_DATE_FIX', label: 'Wedding Date', icon: Users }
                  ].map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      onClick={() => setFormData({ ...formData, specialSubcategory: key as any, mode: 'FREE' })}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-full border transition-all duration-200 font-semibold text-sm ${
                        formData.specialSubcategory === key
                          ? 'bg-[#d4af37] text-[#2A0A0A] border-[#d4af37] shadow-[0_0_12px_rgba(212,175,55,0.4)]'
                          : 'bg-[#3D1010]/40 text-white/80 border-[#d4af37]/20 hover:border-[#d4af37]/60 hover:bg-[#d4af37]/10'
                      }`}
                    >
                      <Icon size={16} />
                      {label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* STEP 1: Select Style */}
            {stepValue === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full">
                <h2 className="text-3xl font-serif text-[#d4af37] mb-8 text-center">Select Style</h2>
                <div onClick={() => setFormData({ ...formData, mode: 'FREE' })} className={`p-6 mb-4 rounded-xl border transition-all cursor-pointer ${formData.mode === 'FREE' ? 'bg-[#d4af37]/20 border-[#d4af37]' : 'glass-panel border-white/10 opacity-70 hover:opacity-100'}`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-white text-lg">Story Mode</span>
                    <Heart size={20} className="text-pink-500" />
                  </div>
                  <p className="text-white/60 text-sm">Best for celebrations.</p>
                </div>
                <div onClick={() => setFormData({ ...formData, mode: 'PREMIUM' })} className={`p-6 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${formData.mode === 'PREMIUM' ? 'bg-gradient-to-br from-[#d4af37]/10 to-[#3D1010]/80 border-[#d4af37]' : 'glass-panel border-white/10 opacity-70 hover:opacity-100'}`}>
                  <div className="absolute top-0 right-0 bg-[#d4af37] text-[#2A0A0A] text-[10px] font-bold px-2 py-1">PREMIUM</div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-[#d4af37] text-lg flex items-center gap-2"><Crown size={18} /> Web Page Mode</span>
                  </div>
                  <p className="text-white/60 text-sm">Full Landing Page experience.</p>
                </div>
              </motion.div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                PREMIUM-ONLY STEPS (17, 16, 10–15) — fully self-contained block.
                Only reachable when formData.mode === 'PREMIUM' via the
                getStepFlow() branch above. Free mode / SPECIAL category
                flows never include these step numbers, so this block is
                simply invisible/inert for every other flow. Zero overlap
                with Free-mode steps 2/3/4/5 — Premium never visits them. ══ */}

            {/* STEP 17: Set Your Value */}
            {stepValue === 17 && (
              <motion.div key="step17" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full space-y-5 text-center">
                <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
                
                <h2 className="text-2xl font-serif text-[#d4af37]">Set Your Value</h2>
                <p className="text-white/50 text-sm">
                  This is the value your recipient will see stamped on their page. Complete the payment below to activate your premium page.
                </p>
                <div className="space-y-4 text-left">
                  <div>
                    <label className="block text-xs uppercase tracking-wider font-mono text-white/50 mb-1.5">Contribution Amount (₹)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#d4af37] font-bold">₹</span>
                      <input
                        type="number"
                        min={1}
                        placeholder="99"
                        disabled={paymentStatus === 'SUCCESS'}
                        value={formData.premiumPrice || ''}
                        onChange={e => setFormData(prev => ({ ...prev, premiumPrice: Math.max(1, parseInt(e.target.value) || 0), amount: Math.max(1, parseInt(e.target.value) || 0) }))}
                        className="w-full bg-[#2A0A0A]/40 border border-[#d4af37]/30 p-4 pl-9 rounded-xl text-white outline-none focus:border-[#d4af37] disabled:opacity-50 transition-colors text-lg font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider font-mono text-white/50 mb-1.5">Email Address</label>
                    <input
                      type="email"
                      placeholder="e.g., you@example.com"
                      disabled={paymentStatus === 'SUCCESS'}
                      value={formData.premiumEmail || ''}
                      onChange={e => setFormData(prev => ({ ...prev, premiumEmail: e.target.value }))}
                      className="w-full bg-[#2A0A0A]/40 border border-[#d4af37]/30 p-4 rounded-xl text-white outline-none focus:border-[#d4af37] disabled:opacity-50 transition-colors text-sm"
                    />
                    <p className="mt-2 text-xs text-[#d4af37]/80 leading-normal font-sans">
                      इस ईमेल पर आपका बनाया गया सेलिब्रेशन पेज का लिंक भेज दिया जाएगा।
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider font-mono text-white/50 mb-1.5">Page Privacy</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, premiumPrivacy: 'PUBLIC' }))}
                        className={`py-3 rounded-xl text-sm font-bold border transition-all ${formData.premiumPrivacy === 'PUBLIC' ? 'bg-[#d4af37] text-[#2A0A0A] border-[#d4af37]' : 'bg-[#2A0A0A]/40 text-white/50 border-white/10'}`}
                      >
                        Public
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, premiumPrivacy: 'PRIVATE' }))}
                        className={`py-3 rounded-xl text-sm font-bold border transition-all ${formData.premiumPrivacy === 'PRIVATE' ? 'bg-[#d4af37] text-[#2A0A0A] border-[#d4af37]' : 'bg-[#2A0A0A]/40 text-white/50 border-white/10'}`}
                      >
                        Private
                      </button>
                    </div>
                    <p className="text-[11px] text-white/40 mt-1.5 leading-relaxed">
                      {formData.premiumPrivacy === 'PUBLIC' 
                        ? 'Anyone can view this page from the leaderboard.' 
                        : 'Only your name and amount will show on the leaderboard; the page link remains hidden.'}
                    </p>
                  </div>

                  {/* Razorpay Standard Payment Section */}
                  <div className="mt-6 pt-4 border-t border-white/5 space-y-3">
                    {/* If there is an unused payment found under their email, let them explicitly claim it */}
                    {unusedPayment && paymentStatus !== 'SUCCESS' && (
                      <div className="p-4 bg-amber-950/40 border border-[#d4af37]/30 rounded-xl space-y-2 text-center">
                        <div className="text-sm font-bold text-[#d4af37] flex items-center justify-center gap-1.5">
                          <span>✨ Unused contribution of ₹{unusedPayment.amount} found!</span>
                        </div>
                        <p className="text-xs text-white/70 leading-normal font-sans">
                          A previous verified contribution under {formData.premiumEmail} was saved. Click below to apply it and unlock creation immediately.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            const verifiedAmount = unusedPayment.amount;
                            setFormData(prev => {
                              const updated = {
                                ...prev,
                                premiumPrice: verifiedAmount,
                                amount: verifiedAmount
                              };
                              try {
                                localStorage.setItem('celebrationData', JSON.stringify(updated));
                              } catch (_) {}
                              return updated;
                            });
                            setPaymentStatus('SUCCESS');
                            localStorage.setItem('premium_payment_id', unusedPayment.paymentId);
                            localStorage.setItem('premium_payment_verified_email', formData.premiumEmail);
                          }}
                          className="w-full py-2.5 bg-gradient-to-r from-[#d4af37] to-[#f3e5ab] text-[#2D0A0A] font-extrabold text-sm rounded-lg hover:shadow-[0_0_15px_rgba(212,175,55,0.3)] transition-all cursor-pointer"
                        >
                          Apply Existing Payment (₹{unusedPayment.amount})
                        </button>
                      </div>
                    )}

                    {checkingPayment ? (
                      <div className="flex items-center justify-center p-4 bg-[#2A0A0A]/20 border border-[#d4af37]/20 rounded-xl space-x-3">
                        <Loader2 className="w-5 h-5 text-[#d4af37] animate-spin" />
                        <span className="text-sm text-white/70 font-sans">Checking payment records...</span>
                      </div>
                    ) : paymentStatus === 'SUCCESS' ? (
                      <div className="p-4 bg-emerald-950/30 border border-emerald-500/30 rounded-xl text-center space-y-2">
                        <div className="flex items-center justify-center space-x-2 text-emerald-400 font-bold">
                          <ShieldCheck className="w-6 h-6" />
                          <span>Payment Verified Successfully</span>
                        </div>
                        <p className="text-xs text-emerald-400/80">
                          Your premium features are unlocked! Click the Arrow button below to design your page.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {paymentStatus === 'LOADING' || paymentStatus === 'VERIFYING' ? (
                          <div className="flex flex-col items-center justify-center p-5 bg-[#2A0A0A]/30 border border-[#d4af37]/20 rounded-xl space-y-3">
                            <Loader2 className="w-7 h-7 text-[#d4af37] animate-spin" />
                            <span className="text-sm font-bold text-[#d4af37]">
                              {paymentStatus === 'LOADING' ? 'Initializing Payment Gateway...' : 'Verifying Secure Signature...'}
                            </span>
                          </div>
                        ) : (
                          <>
                            {paymentStatus === 'FAILED' && (
                              <div className="p-3 bg-rose-950/40 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-start space-x-2">
                                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                <span>{paymentError || 'Payment failed. Please try again.'}</span>
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={handleWizardPayment}
                              className="w-full flex items-center justify-center space-x-3 py-4 bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#d4af37] text-[#2D0A0A] font-extrabold rounded-xl hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer shadow-lg"
                            >
                              <CreditCard className="w-5 h-5" />
                              <span>Pay ₹{formData.premiumPrice || 99} as Per Value & Proceed</span>
                            </button>
                            <p className="text-[10px] text-[#d4af37]/80 text-center flex items-center justify-center space-x-1 font-sans">
                              <Lock className="w-3 h-3 text-[#d4af37]" />
                              <span>256-bit Encrypted Checkout powered by Razorpay Gateway</span>
                            </p>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 16: Basic Info (the ONE generic field Premium needs) */}
            {stepValue === 16 && (
              <motion.div key="step16" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full space-y-5 text-center">
                <h2 className="text-2xl font-serif text-[#d4af37]">Who is this for?</h2>
                <p className="text-white/50 text-sm">This becomes the headline on your landing page hero.</p>
                {renderInput('e.g., Priya & Rahul, or Happy Birthday Aryan', formData.names, 'names')}
              </motion.div>
            )}

            {/* STEP 10: Hero Image */}
            {stepValue === 10 && (
              <motion.div key="step10" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full space-y-5 text-center">
                <h2 className="text-2xl font-serif text-[#d4af37]">Hero Photo</h2>
                <p className="text-white/50 text-sm">This photo fills the entire top of your landing page.</p>
                <label className="block w-full aspect-[4/5] border-2 border-dashed border-[#d4af37]/40 rounded-2xl cursor-pointer hover:bg-[#d4af37]/10 transition-colors overflow-hidden relative">
                  {formData.heroImage ? (
                    <img src={formData.heroImage} className="w-full h-full object-cover" alt="Hero" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                      <Camera size={40} className="text-[#d4af37]" />
                      <span className="text-white/60 text-sm font-medium">Tap to upload hero photo</span>
                      <span className="text-[#d4af37]/70 text-xs font-mono">Max 10MB (JPG, PNG, WEBP)</span>
                    </div>
                  )}
                  <input type="file" accept="image/*" hidden onChange={handleHeroUpload} />
                </label>
              </motion.div>
            )}

            {/* STEP 11: Cake & Wishes */}
            {stepValue === 11 && (
              <motion.div key="step11" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full space-y-5">
                <h2 className="text-2xl font-serif text-[#d4af37] text-center">Cake & Wishes</h2>
                <div onClick={() => setFormData({ ...formData, cakeEnabled: !formData.cakeEnabled })} className={`p-5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${formData.cakeEnabled ? 'bg-[#d4af37]/20 border-[#d4af37]' : 'glass-panel border-white/10'}`}>
                  <span className="flex items-center gap-3 font-bold text-white"><Cake size={22} className="text-[#d4af37]" /> Include Cake-Cutting</span>
                  <div className={`w-12 h-7 rounded-full relative transition-colors ${formData.cakeEnabled ? 'bg-[#d4af37]' : 'bg-white/20'}`}>
                    <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${formData.cakeEnabled ? 'left-6' : 'left-1'}`} />
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-white/50 text-xs uppercase tracking-widest flex items-center gap-2"><PenLine size={14} /> Your Wishes / Shayari</p>
                  {formData.wishesTexts.map((wish, i) => (
                    <div key={i} className="relative">
                      <textarea
                        placeholder={i === 0 ? 'Write a quote, shayari, or wish that appears after the cake is cut...' : `Another wish or quote ${i + 1}...`}
                        value={wish}
                        onChange={e => updateWish(i, e.target.value)}
                        className="w-full h-24 bg-[#2A0A0A]/40 border border-[#d4af37]/30 p-4 rounded-xl text-white outline-none focus:border-[#d4af37] resize-none leading-relaxed font-['Georgia',serif] text-sm"
                      />
                      {formData.wishesTexts.length > 1 && (
                        <button onClick={() => removeWish(i)} className="absolute top-2 right-2 text-white/30 hover:text-red-400">
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                  {formData.wishesTexts.length < 4 && (
                    <button onClick={addWish} className="w-full py-2.5 rounded-xl border border-dashed border-[#d4af37]/40 text-[#d4af37] text-sm flex items-center justify-center gap-2 hover:bg-[#d4af37]/10">
                      <Plus size={15} /> Add Another Wish
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {/* STEP 18: Love Letter — a NEW, SEPARATE feature from Step 11's
                Wishes/Shayari above. Its own dedicated field, its own step,
                its own section on the landing page. Never merges with Wishes. */}
            {stepValue === 18 && (
              <motion.div key="step18" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full space-y-4 text-center">
                <h2 className="text-2xl font-serif text-[#d4af37] flex items-center justify-center gap-2"><Heart size={22} /> Love Letter</h2>
                <p className="text-white/50 text-sm">Optional. A longer, heartfelt letter — separate from your Wishes above. Shown as its own section, styled like a real letter.</p>
                <textarea
                  placeholder="Write your full letter here... 'My dearest, from the day we met...'"
                  value={formData.loveLetterText}
                  onChange={e => setFormData({ ...formData, loveLetterText: e.target.value })}
                  className="w-full h-48 bg-[#2A0A0A]/40 border border-[#d4af37]/30 p-4 rounded-xl text-white outline-none focus:border-[#d4af37] resize-none leading-relaxed font-['Georgia',serif] text-sm text-left"
                />
              </motion.div>
            )}

            {/* STEP 12: Secret Messages (unlimited) + optional Secret Photo */}
            {stepValue === 12 && (
              <motion.div key="step12" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full space-y-4">
                <h2 className="text-2xl font-serif text-[#d4af37] text-center">Secret Messages</h2>
                <p className="text-white/50 text-sm text-center">Add as many tap-to-open cards as you like. Leave one blank to skip it.</p>
                {formData.secretMessages.map((msg, i) => (
                  <div key={i} className="relative space-y-1">
                    <p className="text-white/40 text-xs uppercase tracking-widest flex items-center gap-2"><Lock size={12} /> Message {i + 1}</p>
                    <textarea
                      placeholder={`Secret message ${i + 1} (optional)`}
                      value={msg}
                      onChange={e => setSecretMessage(i, e.target.value)}
                      className="w-full h-20 bg-[#2A0A0A]/40 border border-[#d4af37]/30 p-3 rounded-xl text-white text-sm outline-none focus:border-[#d4af37] resize-none"
                    />
                    {formData.secretMessages.length > 1 && (
                      <button onClick={() => removeSecretMessage(i)} className="absolute top-0 right-0 text-white/30 hover:text-red-400">
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
                <button onClick={addSecretMessage} className="w-full py-2.5 rounded-xl border border-dashed border-[#d4af37]/40 text-[#d4af37] text-sm flex items-center justify-center gap-2 hover:bg-[#d4af37]/10">
                  <Plus size={15} /> Add Another Secret Message
                </button>

                <div className="pt-4 border-t border-white/10 space-y-2">
                  <p className="text-white/40 text-xs uppercase tracking-widest flex items-center gap-2"><Camera size={12} /> Secret Photo (optional)</p>
                  <label className="block w-full aspect-video border-2 border-dashed border-[#d4af37]/40 rounded-xl cursor-pointer hover:bg-[#d4af37]/10 transition-colors overflow-hidden relative">
                    {formData.secretImage ? (
                      <img src={formData.secretImage} className="w-full h-full object-cover" alt="Secret" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                        <Lock size={24} className="text-[#d4af37]" />
                        <span className="text-white/60 text-xs">A photo revealed only on tap</span>
                        <span className="text-[#d4af37]/70 text-[11px] font-mono">Max 10MB</span>
                      </div>
                    )}
                    <input type="file" accept="image/*" hidden onChange={handleSecretImageUpload} />
                  </label>
                </div>
              </motion.div>
            )}

            {/* STEP 13: Gallery (up to 6) */}
            {stepValue === 13 && (
              <motion.div key="step13" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full space-y-5 text-center">
                <h2 className="text-2xl font-serif text-[#d4af37] flex items-center justify-center gap-2"><GalleryIcon size={22} /> Gallery</h2>
                <p className="text-white/50 text-sm">Optional. Up to 6 photos in a premium grid.</p>
                <label className={`block w-full p-8 border-2 border-dashed rounded-xl transition-colors ${formData.galleryPhotos.length >= 6 ? 'opacity-50 cursor-not-allowed border-white/20' : 'border-[#d4af37]/40 cursor-pointer hover:bg-[#d4af37]/10'}`}>
                  <Upload className="mx-auto text-[#d4af37] mb-2" />
                  <span className="text-white/70 block">Upload Photos ({formData.galleryPhotos.length}/6)</span>
                  <span className="text-[#d4af37]/70 text-xs font-mono block mt-1">Max 10MB per photo • Max 25MB total batch</span>
                  <input type="file" multiple accept="image/*" hidden onChange={handleGalleryUpload} disabled={formData.galleryPhotos.length >= 6} />
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {formData.galleryPhotos.map((img, i) => (
                    <div key={i} className="relative aspect-square">
                      <img src={img} className="w-full h-full object-cover rounded-lg border border-white/20" alt="" />
                      <button onClick={() => removeGalleryPhoto(i)} className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs hover:bg-red-600">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-white/10 space-y-3">
                  <p className="text-[#d4af37] text-xs font-semibold uppercase tracking-wider text-center flex items-center justify-center gap-1.5">
                    <Music size={14} /> 1. Upload Music File (MP3 / Audio)
                  </p>
                  <label className="flex items-center justify-center gap-3 w-full p-4 border border-dashed border-white/30 rounded-xl cursor-pointer hover:bg-white/5 transition-colors">
                    <Music className="text-[#d4af37]" size={18} />
                    <span className="text-white/70 text-sm">
                      {formData.music ? 'Music Audio File Added ✓' : 'Add Background Audio File (Max 15MB)'}
                    </span>
                    <input type="file" accept="audio/*" hidden onChange={(e) => handleFileUpload(e, 'MUSIC')} />
                  </label>
                </div>

                <div className="pt-3 border-t border-white/10 space-y-2 text-left">
                  <p className="text-[#d4af37] text-xs font-semibold uppercase tracking-wider text-center flex items-center justify-center gap-1.5">
                    <Sparkles size={14} /> 2. Or Add Video / YouTube Song URL
                  </p>
                  {renderInput('Paste Video / Song URL (e.g. YouTube / MP4)', formData.youtubeMusicUrl, 'youtubeMusicUrl')}
                </div>

                {/* Optional Start Timestamp Field — Minutes & Seconds */}
                <div className="pt-3 border-t border-white/10 text-left space-y-1.5">
                  <label className="text-white/80 text-xs font-medium block">
                    Start Timestamp for Audio / Video (Minutes &amp; Seconds):
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-white/50 text-[10px] block mb-1">Minutes</span>
                      <input
                        type="number"
                        min="0"
                        max="180"
                        placeholder="00"
                        value={(() => {
                          const val = formData.webAudioStartTimestamp || '';
                          if (val.includes(':')) return val.split(':')[0];
                          const totalSecs = parseInt(val) || 0;
                          return totalSecs ? Math.floor(totalSecs / 60).toString() : '';
                        })()}
                        onChange={e => {
                          const mins = parseInt(e.target.value) || 0;
                          const currentVal = formData.webAudioStartTimestamp || '00:00';
                          const secs = currentVal.includes(':') ? (parseInt(currentVal.split(':')[1]) || 0) : 0;
                          const formatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
                          setFormData(p => ({ ...p, webAudioStartTimestamp: formatted }));
                        }}
                        className="w-full bg-[#2A0A0A]/40 border border-[#d4af37]/30 p-3 rounded-xl text-xs text-white outline-none focus:border-[#d4af37] transition-colors placeholder:text-white/30"
                      />
                    </div>
                    <div>
                      <span className="text-white/50 text-[10px] block mb-1">Seconds</span>
                      <input
                        type="number"
                        min="0"
                        max="59"
                        placeholder="00"
                        value={(() => {
                          const val = formData.webAudioStartTimestamp || '';
                          if (val.includes(':')) return val.split(':')[1];
                          const totalSecs = parseInt(val) || 0;
                          return totalSecs ? (totalSecs % 60).toString() : '';
                        })()}
                        onChange={e => {
                          const rawSecs = parseInt(e.target.value) || 0;
                          const secs = Math.min(59, Math.max(0, rawSecs));
                          const currentVal = formData.webAudioStartTimestamp || '00:00';
                          const mins = currentVal.includes(':') ? (parseInt(currentVal.split(':')[0]) || 0) : 0;
                          const formatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
                          setFormData(p => ({ ...p, webAudioStartTimestamp: formatted }));
                        }}
                        className="w-full bg-[#2A0A0A]/40 border border-[#d4af37]/30 p-3 rounded-xl text-xs text-white outline-none focus:border-[#d4af37] transition-colors placeholder:text-white/30"
                      />
                    </div>
                  </div>
                  <p className="text-white/40 text-[11px]">
                    Set start playback point in Minutes and Seconds (e.g. 01 min 30 sec).
                  </p>
                </div>
              </motion.div>
            )}

            {/* STEP 14: Interactive Questions (up to 2) */}
            {stepValue === 14 && (
              <motion.div key="step14" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full space-y-4">
                <h2 className="text-2xl font-serif text-[#d4af37] text-center flex items-center justify-center gap-2"><HelpCircle size={22} /> Yes/No Question</h2>
                <p className="text-white/50 text-sm text-center">Optional. Up to 2 questions your guest answers with Yes or No.</p>
                {formData.questions.map((q, i) => (
                  <div key={i} className="p-4 rounded-xl border border-[#d4af37]/30 bg-[#2A0A0A]/40 space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        placeholder={`Question ${i + 1} (e.g., Do you love me?)`}
                        value={q.text}
                        onChange={e => updateQuestion(i, { text: e.target.value })}
                        className="flex-1 bg-transparent border-b border-[#d4af37]/30 py-2 text-white outline-none focus:border-[#d4af37] placeholder:text-white/30"
                      />
                      <button onClick={() => removeQuestion(i)} className="text-white/40 hover:text-red-400"><X size={18} /></button>
                    </div>
                    {i === 0 && (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-white/50">Reveal gift card when answer is:</span>
                        <button onClick={() => updateQuestion(i, { revealOn: 'YES' })} className={`px-3 py-1 rounded-full font-bold ${q.revealOn === 'YES' ? 'bg-[#d4af37] text-[#2A0A0A]' : 'bg-white/10 text-white/50'}`}>Yes</button>
                        <button onClick={() => updateQuestion(i, { revealOn: 'NO' })} className={`px-3 py-1 rounded-full font-bold ${q.revealOn === 'NO' ? 'bg-[#d4af37] text-[#2A0A0A]' : 'bg-white/10 text-white/50'}`}>No</button>
                      </div>
                    )}
                  </div>
                ))}
                {formData.questions.length < 2 && (
                  <button onClick={addQuestion} className="w-full py-3 rounded-xl border border-dashed border-[#d4af37]/40 text-[#d4af37] flex items-center justify-center gap-2 hover:bg-[#d4af37]/10">
                    <Plus size={16} /> Add Question
                  </button>
                )}
              </motion.div>
            )}

            {/* STEP 15: Gift Card */}
            {stepValue === 15 && (
              <motion.div key="step15" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full space-y-5">
                <h2 className="text-2xl font-serif text-[#d4af37] text-center flex items-center justify-center gap-2"><Gift size={22} /> Gift Card</h2>
                <p className="text-white/50 text-sm text-center">Optional. Skip if you don't want to attach a gift code.</p>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { key: 'FLIPKART', label: 'Flipkart' },
                    { key: 'AMAZON', label: 'Amazon' },
                    { key: 'MYNTRA', label: 'Myntra' },
                    { key: 'SWIGGY', label: 'Swiggy' },
                    { key: 'ZOMATO', label: 'Zomato' },
                    { key: 'OTHER', label: 'Other' },
                  ] as const).map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setFormData({ ...formData, giftCardCompany: formData.giftCardCompany === key ? '' : key })}
                      className={`py-3 rounded-xl border text-xs font-bold transition-all ${formData.giftCardCompany === key ? 'bg-[#d4af37] text-[#2A0A0A] border-[#d4af37]' : 'border-white/10 text-white/60 hover:border-[#d4af37]/40'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {formData.giftCardCompany && (
                  renderInput('Gift Card Code', formData.giftCardCode, 'giftCardCode')
                )}
                {formData.questions.length === 0 && formData.giftCardCompany && (
                  <p className="text-white/40 text-xs text-center">No question added — the gift card will always be visible.</p>
                )}
              </motion.div>
            )}

            {/* STEP 2: Enter Details */}
            {stepValue === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full space-y-5">
                <h2 className="text-2xl font-serif text-[#d4af37] text-center mb-4">Enter Details</h2>

                {showForMeForOther && (
                  <div className="flex bg-[#3D1010]/50 p-1 rounded-full border border-white/10 mb-6">
                    <button
                      onClick={() => setFormData({ ...formData, isForSelf: true })}
                      className={`flex-1 py-2 rounded-full text-sm font-bold transition-all ${formData.isForSelf ? 'bg-[#d4af37] text-[#2A0A0A]' : 'text-white/50'}`}
                    >
                      For Yourself
                    </button>
                    <button
                      onClick={() => setFormData({ ...formData, isForSelf: false })}
                      className={`flex-1 py-2 rounded-full text-sm font-bold transition-all ${!formData.isForSelf ? 'bg-[#d4af37] text-[#2A0A0A]' : 'text-white/50'}`}
                    >
                      For Other
                    </button>
                  </div>
                )}

                {formData.category === 'SPECIAL' && (
                  <>
                    {formData.specialSubcategory === 'JYANTI' && (
                      <>
                        {renderInput("Jayanti Name (e.g., Gandhi Jayanti)", formData.occasionName, 'occasionName')}
                        {renderInput("Date (e.g., 2 October)", formData.occasionDate, 'occasionDate')}
                        <div className="flex gap-3">
                          {renderInput("Your Name (Creator)", formData.creatorName, 'creatorName')}
                          <label className="w-14 h-[58px] flex-shrink-0 bg-[#2A0A0A]/40 border border-[#d4af37]/30 rounded-xl flex items-center justify-center cursor-pointer hover:bg-[#d4af37]/10 transition-colors overflow-hidden">
                            {formData.creatorPhoto ? <img src={formData.creatorPhoto} className="w-full h-full object-cover" alt="" /> : <Camera size={20} className="text-[#d4af37]" />}
                            <input type="file" accept="image/*" hidden onChange={(e) => handleFileUpload(e, 'CREATOR')} />
                          </label>
                        </div>
                      </>
                    )}

                    {formData.specialSubcategory === 'DIVAS' && (
                      <>
                        {renderInput("Day Name (e.g., World Environment Day)", formData.occasionName, 'occasionName')}
                        {renderInput("Date (e.g., 5 June)", formData.occasionDate, 'occasionDate')}
                        <div className="flex gap-3">
                          {renderInput("Your Name (Creator)", formData.creatorName, 'creatorName')}
                          <label className="w-14 h-[58px] flex-shrink-0 bg-[#2A0A0A]/40 border border-[#d4af37]/30 rounded-xl flex items-center justify-center cursor-pointer hover:bg-[#d4af37]/10 transition-colors overflow-hidden">
                            {formData.creatorPhoto ? <img src={formData.creatorPhoto} className="w-full h-full object-cover" alt="" /> : <Camera size={20} className="text-[#d4af37]" />}
                            <input type="file" accept="image/*" hidden onChange={(e) => handleFileUpload(e, 'CREATOR')} />
                          </label>
                        </div>
                      </>
                    )}

                    {formData.specialSubcategory === 'FESTIVALS' && (
                      <>
                        {renderInput("Festival Name (e.g., Diwali)", formData.occasionName, 'occasionName')}
                        {renderInput("Date (e.g., 12 November)", formData.occasionDate, 'occasionDate')}
                        <div className="flex gap-3">
                          {renderInput("Your Name (Creator)", formData.creatorName, 'creatorName')}
                          <label className="w-14 h-[58px] flex-shrink-0 bg-[#2A0A0A]/40 border border-[#d4af37]/30 rounded-xl flex items-center justify-center cursor-pointer hover:bg-[#d4af37]/10 transition-colors overflow-hidden">
                            {formData.creatorPhoto ? <img src={formData.creatorPhoto} className="w-full h-full object-cover" alt="" /> : <Camera size={20} className="text-[#d4af37]" />}
                            <input type="file" accept="image/*" hidden onChange={(e) => handleFileUpload(e, 'CREATOR')} />
                          </label>
                        </div>
                      </>
                    )}

                    {formData.specialSubcategory === 'NEW_MEMBERS' && (
                      <>
                        {renderInput("Date (e.g., 15 March 2024)", formData.occasionDate, 'occasionDate')}
                        {renderInput("Time (e.g., 10:30 AM)", formData.occasionTime, 'occasionTime')}
                        {renderInput("Father's Name", formData.fatherName, 'fatherName')}
                        {renderInput("Mother's Name", formData.motherName, 'motherName')}
                        {!formData.isForSelf && (
                          <div className="flex gap-3">
                            {renderInput("Your Name (Creator)", formData.creatorName, 'creatorName')}
                            <label className="w-14 h-[58px] flex-shrink-0 bg-[#2A0A0A]/40 border border-[#d4af37]/30 rounded-xl flex items-center justify-center cursor-pointer hover:bg-[#d4af37]/10 transition-colors overflow-hidden">
                              {formData.creatorPhoto ? <img src={formData.creatorPhoto} className="w-full h-full object-cover" alt="" /> : <Camera size={20} className="text-[#d4af37]" />}
                              <input type="file" accept="image/*" hidden onChange={(e) => handleFileUpload(e, 'CREATOR')} />
                            </label>
                          </div>
                        )}
                      </>
                    )}

                    {formData.specialSubcategory === 'MARRIAGE_DATE_FIX' && (
                      <>
                        {renderInput("Bride/Groom Name", formData.name1, 'name1')}
                        {renderInput("Groom/Bride Name", formData.name2, 'name2')}
                        {renderInput("Wedding Date (e.g., 20 December 2024)", formData.occasionDate, 'occasionDate')}
                        {!formData.isForSelf && (
                          <div className="flex gap-3">
                            {renderInput("Your Name (Creator)", formData.creatorName, 'creatorName')}
                            <label className="w-14 h-[58px] flex-shrink-0 bg-[#2A0A0A]/40 border border-[#d4af37]/30 rounded-xl flex items-center justify-center cursor-pointer hover:bg-[#d4af37]/10 transition-colors overflow-hidden">
                              {formData.creatorPhoto ? <img src={formData.creatorPhoto} className="w-full h-full object-cover" alt="" /> : <Camera size={20} className="text-[#d4af37]" />}
                              <input type="file" accept="image/*" hidden onChange={(e) => handleFileUpload(e, 'CREATOR')} />
                            </label>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}

                {(formData.category === 'MARRIAGE' || formData.category === 'RELATIONSHIP') && (
                  <>
                    {renderInput(formData.isForSelf ? "Partner's Name" : "Couple Name", formData.names, 'names')}
                    {renderInput("Years? (e.g. 5)", formData.count, 'count', 'number')}
                    {!formData.isForSelf && renderInput("Your Relation (e.g. Bhaiya & Bhabhi)", formData.relationLabel, 'relationLabel')}

                    {showWhoAreYou && (
                      <div className="pt-4 border-t border-white/10">
                        <p className="text-[#d4af37] text-sm font-bold mb-3">Who Are You?</p>
                        <div className="flex gap-3">
                          {formData.category === 'MARRIAGE' ? (
                            <>
                              <label className="flex-1 cursor-pointer">
                                <input
                                  type="radio"
                                  name="whoAreYou"
                                  value="HUSBAND"
                                  checked={formData.whoAreYou === 'HUSBAND'}
                                  onChange={() => setFormData({ ...formData, whoAreYou: 'HUSBAND' })}
                                  className="hidden"
                                />
                                <div className={`p-3 rounded-xl border text-center transition-all ${formData.whoAreYou === 'HUSBAND' ? 'bg-[#d4af37]/20 border-[#d4af37] text-[#d4af37]' : 'border-white/10 text-white/50'}`}>
                                  Husband
                                </div>
                              </label>
                              <label className="flex-1 cursor-pointer">
                                <input
                                  type="radio"
                                  name="whoAreYou"
                                  value="WIFE"
                                  checked={formData.whoAreYou === 'WIFE'}
                                  onChange={() => setFormData({ ...formData, whoAreYou: 'WIFE' })}
                                  className="hidden"
                                />
                                <div className={`p-3 rounded-xl border text-center transition-all ${formData.whoAreYou === 'WIFE' ? 'bg-[#d4af37]/20 border-[#d4af37] text-[#d4af37]' : 'border-white/10 text-white/50'}`}>
                                  Wife
                                </div>
                              </label>
                            </>
                          ) : (
                            <>
                              <label className="flex-1 cursor-pointer">
                                <input
                                  type="radio"
                                  name="whoAreYou"
                                  value="MALE_PARTNER"
                                  checked={formData.whoAreYou === 'MALE_PARTNER'}
                                  onChange={() => setFormData({ ...formData, whoAreYou: 'MALE_PARTNER' })}
                                  className="hidden"
                                />
                                <div className={`p-3 rounded-xl border text-center transition-all ${formData.whoAreYou === 'MALE_PARTNER' ? 'bg-[#d4af37]/20 border-[#d4af37] text-[#d4af37]' : 'border-white/10 text-white/50'}`}>
                                  Male Partner
                                </div>
                              </label>
                              <label className="flex-1 cursor-pointer">
                                <input
                                  type="radio"
                                  name="whoAreYou"
                                  value="FEMALE_PARTNER"
                                  checked={formData.whoAreYou === 'FEMALE_PARTNER'}
                                  onChange={() => setFormData({ ...formData, whoAreYou: 'FEMALE_PARTNER' })}
                                  className="hidden"
                                />
                                <div className={`p-3 rounded-xl border text-center transition-all ${formData.whoAreYou === 'FEMALE_PARTNER' ? 'bg-[#d4af37]/20 border-[#d4af37] text-[#d4af37]' : 'border-white/10 text-white/50'}`}>
                                  Female Partner
                                </div>
                              </label>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {formData.category === 'BIRTHDAY' && (
                  <>
                    {renderInput("Birthday Person Name", formData.names, 'names')}
                    {renderInput("Which Birthday? (e.g. 20)", formData.count, 'count', 'number')}
                    {!formData.isForSelf && renderInput("Your Relation", formData.relationLabel, 'relationLabel')}
                  </>
                )}

                {/* Creator details for "For Others" - name + photo always together */}
                {!formData.isForSelf && formData.category !== 'SPECIAL' && (
                  <div className="pt-4 border-t border-white/10 space-y-3">
                    <p className="text-[#d4af37] text-xs uppercase tracking-widest text-center mb-2">Creator Details</p>
                    <div className="flex gap-3">
                      {renderInput("Your Name", formData.creatorName, 'creatorName')}
                      <label className="w-14 h-[58px] flex-shrink-0 bg-[#2A0A0A]/40 border border-[#d4af37]/30 rounded-xl flex items-center justify-center cursor-pointer hover:bg-[#d4af37]/10 transition-colors overflow-hidden">
                        {formData.creatorPhoto ? <img src={formData.creatorPhoto} className="w-full h-full object-cover" alt="" /> : <Camera size={20} className="text-[#d4af37]" />}
                        <input type="file" accept="image/*" hidden onChange={(e) => handleFileUpload(e, 'CREATOR')} />
                      </label>
                    </div>
                  </div>
                )}

                {/* Recovery Email */}
                <div className="pt-4 border-t border-white/10 space-y-3">
                  <p className="text-[#d4af37] text-xs uppercase tracking-widest text-center mb-1">Story Recovery</p>
                  {renderInput("Your Email (for recovery & link)", formData.email || '', 'email', 'email')}
                </div>

                {/* Leaderboard Privacy */}
                <div className="pt-4 border-t border-white/10 space-y-3">
                  <p className="text-[#d4af37] text-xs uppercase tracking-widest text-center mb-1">Leaderboard Privacy</p>
                  <div className="flex bg-[#3D1010]/50 p-1 rounded-full border border-white/10">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, freePrivacy: 'PUBLIC' })}
                      className={`flex-1 py-2 rounded-full text-xs font-bold transition-all ${
                        formData.freePrivacy === 'PUBLIC'
                          ? 'bg-[#d4af37] text-[#2A0A0A]'
                          : 'text-white/50'
                      }`}
                    >
                      Public (Show on Leaderboard)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, freePrivacy: 'PRIVATE' })}
                      className={`flex-1 py-2 rounded-full text-xs font-bold transition-all ${
                        formData.freePrivacy === 'PRIVATE'
                          ? 'bg-[#d4af37] text-[#2A0A0A]'
                          : 'text-white/50'
                      }`}
                    >
                      Private (Hidden from Leaderboard)
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 3: Memories & Tunes */}
            {stepValue === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full space-y-6 text-center">
                <h2 className="text-2xl font-serif text-[#d4af37]">Memories & Tunes</h2>
                <label className="flex items-center justify-center gap-3 w-full p-4 border border-dashed border-white/30 rounded-xl cursor-pointer hover:bg-white/5 transition-colors">
                  <Music className="text-[#d4af37]" />
                  <span className="text-white/70 text-sm flex items-center gap-2">
                    {formData.music ? (
                      <>
                        Music Track Added
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <circle cx="8" cy="8" r="7" fill="#4ade80" fillOpacity="0.2" stroke="#4ade80" strokeWidth="1.5"/>
                          <path d="M4.5 8L7 10.5L11.5 6" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </>
                    ) : "Upload Song File (MP3, Max 15MB)"}
                  </span>
                  <input type="file" accept="audio/*" hidden onChange={(e) => handleFileUpload(e, 'MUSIC')} />
                </label>

                {/* Optional Start Timestamp Field — Minutes & Seconds */}
                <div className="pt-3 border-t border-white/10 text-left space-y-1.5">
                  <label className="text-white/80 text-xs font-medium block">
                    Start Timestamp for Music (Minutes &amp; Seconds):
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-white/50 text-[10px] block mb-1">Minutes</span>
                      <input
                        type="number"
                        min="0"
                        max="180"
                        placeholder="00"
                        value={(() => {
                          const val = formData.storyAudioStartTimestamp || '';
                          if (val.includes(':')) return val.split(':')[0];
                          const totalSecs = parseInt(val) || 0;
                          return totalSecs ? Math.floor(totalSecs / 60).toString() : '';
                        })()}
                        onChange={e => {
                          const mins = parseInt(e.target.value) || 0;
                          const currentVal = formData.storyAudioStartTimestamp || '00:00';
                          const secs = currentVal.includes(':') ? (parseInt(currentVal.split(':')[1]) || 0) : 0;
                          const formatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
                          setFormData(p => ({ ...p, storyAudioStartTimestamp: formatted }));
                        }}
                        className="w-full bg-[#2A0A0A]/40 border border-[#d4af37]/30 p-3 rounded-xl text-xs text-white outline-none focus:border-[#d4af37] transition-colors placeholder:text-white/30"
                      />
                    </div>
                    <div>
                      <span className="text-white/50 text-[10px] block mb-1">Seconds</span>
                      <input
                        type="number"
                        min="0"
                        max="59"
                        placeholder="00"
                        value={(() => {
                          const val = formData.storyAudioStartTimestamp || '';
                          if (val.includes(':')) return val.split(':')[1];
                          const totalSecs = parseInt(val) || 0;
                          return totalSecs ? (totalSecs % 60).toString() : '';
                        })()}
                        onChange={e => {
                          const rawSecs = parseInt(e.target.value) || 0;
                          const secs = Math.min(59, Math.max(0, rawSecs));
                          const currentVal = formData.storyAudioStartTimestamp || '00:00';
                          const mins = currentVal.includes(':') ? (parseInt(currentVal.split(':')[0]) || 0) : 0;
                          const formatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
                          setFormData(p => ({ ...p, storyAudioStartTimestamp: formatted }));
                        }}
                        className="w-full bg-[#2A0A0A]/40 border border-[#d4af37]/30 p-3 rounded-xl text-xs text-white outline-none focus:border-[#d4af37] transition-colors placeholder:text-white/30"
                      />
                    </div>
                  </div>
                  <p className="text-white/40 text-[11px]">
                    Set start playback point in Minutes and Seconds (e.g. 01 min 30 sec).
                  </p>
                </div>

                <div className="space-y-3">
                  <label className={`block w-full p-8 border-2 border-dashed rounded-xl transition-colors ${formData.photos.length >= 5 ? 'opacity-50 cursor-not-allowed border-white/20' : 'border-[#d4af37]/40 cursor-pointer hover:bg-[#d4af37]/10'}`}>
                    <Upload className="mx-auto text-[#d4af37] mb-2" />
                    <span className="text-white/70 block">Upload Photos ({formData.photos.length}/5)</span>
                    <span className="text-[#d4af37]/70 text-xs font-mono block mt-1">Max 10MB per photo • Max 25MB total batch</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      hidden
                      onChange={(e) => handleFileUpload(e, 'PHOTO')}
                      disabled={formData.photos.length >= 5}
                    />
                  </label>

                  {formData.photos.length >= 5 && (
                    <p className="text-yellow-500 text-xs">Maximum 5 images allowed</p>
                  )}
                </div>

                <div className="flex gap-2 overflow-x-auto py-2 no-scrollbar">
                  {formData.photos.map((img, i) => (
                    <div key={i} className="relative flex-shrink-0">
                      <img src={img} className="w-16 h-16 object-cover rounded-lg border border-white/20" alt="" />
                      <button
                        onClick={() => removePhoto(i)}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs hover:bg-red-600"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* STEP 4: Choose Message */}
            {stepValue === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full space-y-4">
                <h2 className="text-2xl font-serif text-[#d4af37] text-center">Choose Message</h2>

                <div className="flex justify-center gap-2 mb-4">
                  <button onClick={() => setFormData({ ...formData, selectedLanguage: 'hindi' })} className={`px-4 py-2 rounded-lg text-sm font-bold ${formData.selectedLanguage === 'hindi' ? 'bg-[#d4af37] text-[#2A0A0A]' : 'bg-white/10 text-white/50'}`}>हिंदी</button>
                  <button onClick={() => setFormData({ ...formData, selectedLanguage: 'english' })} className={`px-4 py-2 rounded-lg text-sm font-bold ${formData.selectedLanguage === 'english' ? 'bg-[#d4af37] text-[#2A0A0A]' : 'bg-white/10 text-white/50'}`}>English</button>
                </div>

                <div className="space-y-3">
                  <p className="text-white/50 text-xs uppercase tracking-widest text-center">Select Template</p>

                  {[1, 2, 3].map((num) => (
                    <div key={num} onClick={() => setFormData({ ...formData, selectedTemplate: num as 1 | 2 | 3 })} className={`p-4 rounded-xl border cursor-pointer ${formData.selectedTemplate === num ? 'bg-[#d4af37]/20 border-[#d4af37]' : 'border-white/10'}`}>
                      <div className="flex items-start gap-3">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 ${formData.selectedTemplate === num ? 'border-[#d4af37] bg-[#d4af37]' : 'border-white/30'}`}>
                          {formData.selectedTemplate === num && <div className="w-2 h-2 bg-[#2A0A0A] rounded-full" />}
                        </div>
                        <p className="text-white/90 text-sm leading-relaxed font-['Georgia',serif]">{getPreviewForTemplate(num as 1 | 2 | 3)}</p>
                      </div>
                    </div>
                  ))}

                  <div onClick={() => setFormData({ ...formData, selectedTemplate: 4 })} className={`p-4 rounded-xl border cursor-pointer ${formData.selectedTemplate === 4 ? 'bg-gradient-to-br from-[#d4af37]/20 to-[#8a6e15]/20 border-[#d4af37]' : 'border-white/10'}`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 ${formData.selectedTemplate === 4 ? 'border-[#d4af37] bg-[#d4af37]' : 'border-white/30'}`}>
                        {formData.selectedTemplate === 4 && <div className="w-2 h-2 bg-[#2A0A0A] rounded-full" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles size={16} className="text-[#d4af37]" />
                          <span className="text-[#d4af37] font-bold text-sm">AI Generated</span>
                        </div>
                        {formData.selectedTemplate === 4 && (
                          <>
                            {!formData.generatedAIQuote ? (
                              <button onClick={(e) => { e.stopPropagation(); generateAIQuote(); }} disabled={isGeneratingQuote} className="w-full bg-[#d4af37] text-[#2A0A0A] py-2 px-4 rounded-lg font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                                {isGeneratingQuote ? <><Loader2 size={16} className="animate-spin" />Generating...</> : <><Sparkles size={16} />Free Generate</>}
                              </button>
                            ) : (
                              <div className="space-y-2">
                                <p className="text-white/90 text-sm leading-relaxed font-['Georgia',serif]">{fillPlaceholders(formData.generatedAIQuote)}</p>
                                <button onClick={(e) => { e.stopPropagation(); generateAIQuote(); }} disabled={isGeneratingQuote} className="text-[#d4af37] text-xs underline disabled:opacity-50">
                                  {isGeneratingQuote ? 'Generating...' : 'Regenerate'}
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <p className="text-white/50 text-xs uppercase text-center mb-3">Or Custom</p>
                  <textarea placeholder="Write your own..." value={formData.customMessage} onChange={e => setFormData({ ...formData, customMessage: e.target.value })} className="w-full h-32 bg-[#2A0A0A]/40 border border-[#d4af37]/30 p-4 rounded-xl text-white outline-none focus:border-[#d4af37] resize-none leading-relaxed font-['Georgia',serif]" />
                </div>
              </motion.div>
            )}

            {/* STEP 5: Select Theme */}
            {stepValue === 5 && (
              <motion.div key="step5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full space-y-6">
                <h2 className="text-2xl font-serif text-[#d4af37] text-center">Select Theme</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div onClick={() => setFormData({ ...formData, theme: 'ROYAL' })} className={`relative p-4 rounded-xl border-2 cursor-pointer ${formData.theme === 'ROYAL' ? 'border-[#d4af37] bg-[#d4af37]/10' : 'border-white/10 opacity-60'}`}>
                    <div className="h-20 bg-gradient-to-b from-[#2A0A0A] to-[#3D1010] rounded-lg mb-2 flex items-center justify-center border border-[#d4af37]/20"><Crown size={24} className="text-[#d4af37]" /></div>
                    <p className={`text-center font-serif ${formData.theme === 'ROYAL' ? 'text-[#d4af37]' : 'text-white'}`}>Royal Gold</p>
                    {formData.theme === 'ROYAL' && <div className="absolute top-2 right-2 w-3 h-3 bg-[#d4af37] rounded-full shadow-[0_0_10px_#d4af37]" />}
                  </div>
                  {['Cool', 'Minimal', 'Festive'].map((t) => (
                    <div key={t} className="relative p-4 rounded-xl border opacity-50 cursor-not-allowed grayscale">
                      <div className="absolute inset-0 flex items-center justify-center z-10">
                        <div className="bg-black/80 px-3 py-1 rounded-full flex items-center gap-1 border border-white/10"><Lock size={10} className="text-white/70" /><span className="text-[10px] text-white/70">Soon</span></div>
                      </div>
                      <div className="h-20 bg-gray-800 rounded-lg mb-2" />
                      <p className="text-center text-white/40">{t}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>

      {/* Floating Bottom Navigation Buttons — Fixed to Viewport Bottom Corners, Fully Responsive */}
      {(() => {
        const isStep17PaymentLocked = formData.mode === 'PREMIUM' && getCurrentStepValue() === 17 && paymentStatus !== 'SUCCESS';
        const isNextDisabled = isFormSubmitting || isStep17PaymentLocked;

        return (
          <div className={`fixed bottom-6 sm:bottom-8 inset-x-0 w-full z-40 pointer-events-none flex items-center justify-between px-6 sm:px-10 md:px-12 lg:px-16 transition-all duration-300 ${isInputFocused ? 'max-sm:opacity-0 max-sm:pointer-events-none max-sm:translate-y-6' : 'opacity-100'}`}>
            <button
              onClick={() => window.history.back()}
              className="pointer-events-auto w-14 h-14 sm:w-16 sm:h-16 bg-[#3D1010] border border-[#d4af37]/30 rounded-full flex items-center justify-center text-white shadow-xl hover:scale-105 active:scale-95 transition-all"
              aria-label="Previous step"
            >
              <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7" />
            </button>
            <button
              onClick={handleNext}
              disabled={isNextDisabled}
              className={`pointer-events-auto w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all ${
                isStep17PaymentLocked
                  ? 'bg-[#d4af37]/20 text-white/30 border border-[#d4af37]/20 shadow-none cursor-not-allowed opacity-40 scale-95'
                  : 'bg-[#d4af37] text-[#2A0A0A] shadow-[0_0_20px_rgba(212,175,55,0.4)] hover:scale-105 active:scale-95 cursor-pointer opacity-100'
              } disabled:cursor-not-allowed`}
              aria-label="Next step"
            >
              {isFormSubmitting ? (
                <Loader2 className="w-6 h-6 sm:w-7 sm:h-7 animate-spin text-[#2A0A0A]" />
              ) : (
                <ArrowRight className={`w-6 h-6 sm:w-7 sm:h-7 ${isStep17PaymentLocked ? 'text-white/30' : 'text-[#2A0A0A]'}`} />
              )}
            </button>
          </div>
        );
      })()}

      {/* No test mode modal */}
    </div>
  );
}

// sync
