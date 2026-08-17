const express = require('express');
const router = express.Router();
const { mockDB } = require('../models/store');
const { authMiddleware } = require('../middleware/authMiddleware');

// Get Subscription Plans
router.get('/plans', (req, res) => {
  const plans = [
    {
      id: 'free',
      name: 'Starter Forge',
      price: '$0',
      priceMonthly: 0,
      description: 'Ideal for casual learners and quick study sessions.',
      features: [
        '5 AI Quiz Generations / day',
        'Text & Web URL extraction',
        'Basic MCQ & True/False',
        '3D Flashcard flip mode',
        'Public battle rooms'
      ],
      cta: 'Current Plan',
      highlighted: false
    },
    {
      id: 'pro',
      name: 'Pro Alchemist',
      price: '$19',
      priceMonthly: 19,
      period: '/month',
      description: 'For power students, researchers, and professional certifiers.',
      features: [
        'Unlimited AI Generations (Gemini + Groq)',
        '7 Input Modalities (PDF, DOCX, PPT, Vision, YouTube)',
        'Full Bloom’s Taxonomy Engine (6 Cognitive Tiers)',
        'Personalized Adaptive Learning & Study Planner',
        'Official Downloadable PDF Certificates',
        'Priority Battle Arena hosting'
      ],
      cta: 'Upgrade to Pro',
      highlighted: true
    },
    {
      id: 'team',
      name: 'Enterprise Matrix',
      price: '$99',
      priceMonthly: 99,
      period: '/month',
      description: 'For universities, coding bootcamps, and corporate L&D.',
      features: [
        'Everything in Pro + Unlimited Seats',
        'Team Workspaces & Role-Based Access',
        'Teacher & Enterprise Skill Gap Dashboards',
        'Custom Webhooks & LMS API Integration',
        'Dedicated 24/7 SLA Support'
      ],
      cta: 'Upgrade to Enterprise',
      highlighted: false
    }
  ];

  res.json({ success: true, plans });
});

// Create Checkout Session (Stripe / Razorpay mock simulation)
router.post('/checkout', authMiddleware, (req, res) => {
  const { planId, paymentGateway = 'stripe' } = req.body;
  const user = mockDB.users.find(u => u._id === req.user?._id) || mockDB.users[0];

  user.plan = planId || 'pro';

  res.json({
    success: true,
    message: `Subscription successfully upgraded to ${planId.toUpperCase()}!`,
    subscription: {
      plan: user.plan,
      gateway: paymentGateway,
      status: 'active',
      renewsAt: new Date(Date.now() + 30 * 86400000).toISOString()
    }
  });
});

module.exports = router;
