import { useState } from 'react'
import { BadgeCheck, Building2, Check, Clock3, Dumbbell, Gift, ShieldAlert, Sparkles, TicketCheck } from 'lucide-react'
import { isMembershipExpired } from '../data/membership.js'
import { useMembership } from '../hooks/useMembership.js'

const premiumOptions = [
  { months: 1, duration: '1 month', price: '₹99' },
  { months: 6, duration: '6 months', price: '₹499' },
]

const benefits = {
  Free: ['Basic fitness tracking', 'Limited workout plans', 'Basic access to FitLife features'],
  Partner: ['Partner-provided access', 'Fitness tracking and workout tools', 'Access for the code’s stated duration'],
  Premium: ['Full access to FitLife features', 'More ways to plan your workouts', 'Premium access for your selected duration'],
}

function formatMembershipDate(date) {
  if (!date) return 'No expiry'
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    .format(new Date(`${date}T00:00:00`))
}

export default function MembershipPage() {
  const { membership, redeemCode, activatePremium, storageError } = useMembership()
  const [partnerCode, setPartnerCode] = useState('')
  const [codeMessage, setCodeMessage] = useState(null)
  const [purchaseDuration, setPurchaseDuration] = useState(null)
  const [purchaseMessage, setPurchaseMessage] = useState('')

  function handleRedeem(event) {
    event.preventDefault()
    const result = redeemCode(partnerCode)
    if (result.error) {
      setCodeMessage({ type: 'error', text: result.error })
      return
    }
    setCodeMessage({
      type: 'success',
      text: `Demo code accepted. Partner access is active until ${formatMembershipDate(result.membership.membershipExpiryDate)}.`,
    })
    setPartnerCode('')
  }

  function handlePremiumUpgrade() {
    const result = activatePremium(purchaseDuration)
    if (result.error) {
      setPurchaseMessage(result.error)
      return
    }
    setPurchaseMessage(`Demo upgrade complete. Premium access is active until ${formatMembershipDate(result.membership.membershipExpiryDate)}.`)
    setPurchaseDuration(null)
  }

  return (
    <div className="page-content membership-page">
      <section className="membership-heading">
        <div>
          <p className="eyebrow">Membership &amp; partnerships</p>
          <h1>Find your FitLife plan</h1>
          <p className="membership-subtitle">Choose the access that fits your routine, or get FitLife through a participating partner.</p>
        </div>
        <div className="membership-current">
          <span className="membership-current-icon"><BadgeCheck size={18} /></span>
          <span><small>Your current plan</small><strong>{membership.plan}</strong><small className="membership-current-start">Since {formatMembershipDate(membership.membershipStartDate)}</small></span>
          <span className="membership-current-expiry">{membership.membershipExpiryDate ? `${isMembershipExpired(membership) ? 'Expired' : 'Until'} ${formatMembershipDate(membership.membershipExpiryDate)}` : 'No expiry'}</span>
        </div>
      </section>

      <section className="pricing-grid" aria-label="FitLife membership plans">
        <article className="pricing-card pricing-free">
          <div className="pricing-card-heading"><span className="pricing-icon"><Dumbbell size={19} /></span>{membership.plan === 'Free' && <span className="pricing-current-label">Your plan</span>}</div>
          <p className="pricing-plan-label">Start here</p>
          <h2>Free</h2>
          <p className="pricing-description">Build healthy routines with the essentials.</p>
          <div className="pricing-price"><strong>₹0</strong><span>forever</span></div>
          <ul className="pricing-benefits">{benefits.Free.map((benefit) => <li key={benefit}><Check size={15} />{benefit}</li>)}</ul>
          <a className="pricing-secondary-action" href="#partnerships">Explore partner access</a>
        </article>

        <article className="pricing-card pricing-partner">
          <div className="pricing-card-heading"><span className="pricing-icon"><Gift size={19} /></span>{membership.plan === 'Partner' && <span className="pricing-current-label">Your plan</span>}</div>
          <p className="pricing-plan-label">A partner perk</p>
          <h2>Partner</h2>
          <p className="pricing-description">Included with participating gyms or products.</p>
          <div className="pricing-price"><strong>Free</strong><span>with a partner code</span></div>
          <ul className="pricing-benefits">{benefits.Partner.map((benefit) => <li key={benefit}><Check size={15} />{benefit}</li>)}</ul>
          <a className="pricing-secondary-action" href="#redeem-code"><TicketCheck size={15} /> Redeem partner code</a>
        </article>

        <article className="pricing-card pricing-premium">
          <div className="pricing-card-heading"><span className="pricing-icon"><Sparkles size={19} /></span>{membership.plan === 'Premium' && <span className="pricing-current-label">Your plan</span>}</div>
          <p className="pricing-plan-label">More room to grow</p>
          <h2>Premium</h2>
          <p className="pricing-description">Choose a subscription duration for added FitLife access.</p>
          <div className="premium-options" aria-label="Premium subscription durations">
            {premiumOptions.map(({ months, duration, price }) => (
              <button
                className={`premium-option${purchaseDuration === months ? ' selected' : ''}`}
                key={months}
                type="button"
                aria-pressed={purchaseDuration === months}
                onClick={() => { setPurchaseDuration(months); setPurchaseMessage('') }}
              >
                <span>{duration}</span><strong>{price}</strong>
              </button>
            ))}
          </div>
          <ul className="pricing-benefits">{benefits.Premium.map((benefit) => <li key={benefit}><Check size={15} />{benefit}</li>)}</ul>
          <p className="demo-payment-note">Demo purchase only. No payment details are collected.</p>
        </article>
      </section>

      {purchaseDuration && (
        <section className="demo-checkout" aria-label="Premium demo checkout">
          <div><p className="eyebrow">Demo checkout</p><h2>Confirm Premium for {purchaseDuration} {purchaseDuration === 1 ? 'month' : 'months'}?</h2><p>This updates your local demo membership only. There is no real charge or payment processing.</p></div>
          <div className="demo-checkout-actions">
            <button type="button" className="pricing-secondary-action" onClick={() => setPurchaseDuration(null)}>Cancel</button>
            <button type="button" className="pricing-primary-action" onClick={handlePremiumUpgrade}>Confirm demo upgrade</button>
          </div>
        </section>
      )}
      {purchaseMessage && <p className="membership-message success" role="status">{purchaseMessage}</p>}

      <section className="partner-redemption panel" id="redeem-code" aria-labelledby="redeem-heading">
        <div className="redemption-copy">
          <span className="partnership-icon"><TicketCheck size={20} /></span>
          <p className="eyebrow">Product partner access</p>
          <h2 id="redeem-heading">Have an activation code?</h2>
          <p>Enter a code from a participating product partner. This frontend demo accepts the sample codes below; it does not verify physical coupons or partner purchases.</p>
          <div className="demo-code-list"><span>Demo codes</span><code>FITLIFE-1M</code><code>FITLIFE-3M</code><code>FITLIFE-6M</code></div>
        </div>
        <form className="redemption-form" onSubmit={handleRedeem}>
          <label className="membership-field" htmlFor="partner-code">Activation code</label>
          <div className="redemption-input-row"><input id="partner-code" name="partnerCode" type="text" autoComplete="off" placeholder="e.g. FITLIFE-1M" value={partnerCode} onChange={(event) => setPartnerCode(event.target.value)} /><button className="pricing-primary-action" type="submit">Redeem code</button></div>
          {codeMessage && <p className={`membership-message ${codeMessage.type}`} role={codeMessage.type === 'error' ? 'alert' : 'status'}>{codeMessage.text}</p>}
          {membership.partnerActivationStatus === 'active' && <p className="activation-status"><BadgeCheck size={15} /> Partner activation active · expires {formatMembershipDate(membership.membershipExpiryDate)}</p>}
          {membership.partnerActivationStatus === 'expired' && <p className="activation-status expired"><Clock3 size={15} /> Previous partner access expired {formatMembershipDate(membership.membershipExpiryDate)}</p>}
          {membership.partnerActivationStatus === 'superseded' && <p className="activation-status expired"><Clock3 size={15} /> Partner access was replaced when Premium started {formatMembershipDate(membership.membershipStartDate)}</p>}
        </form>
      </section>

      <section className="partnerships-section" id="partnerships" aria-labelledby="partnerships-heading">
        <div className="partnerships-intro"><p className="eyebrow">Business &amp; partnerships</p><h2 id="partnerships-heading">Bring better wellness to your community</h2><p>FitLife offers two ways for businesses to make fitness support part of their customer experience.</p></div>
        <div className="partnership-model-grid">
          <article className="partnership-model panel">
            <span className="partnership-icon"><Building2 size={20} /></span>
            <p className="pricing-plan-label">For gyms</p>
            <h3>Gym tie-up model</h3>
            <p>FitLife can be white-labelled for a gym and offered to its registered members. A gym membership can include FitLife as a value-added service, extending support beyond the workout floor.</p>
            <ul><li>Give members a connected fitness companion.</li><li>Strengthen your membership offering with digital wellness tools.</li><li>Keep members engaged with workout planning and progress features.</li></ul>
            <span className="partnership-footnote"><Building2 size={14} /> Partnership details are illustrative; onboarding requires a business agreement.</span>
          </article>
          <article className="partnership-model panel">
            <span className="partnership-icon product"><Gift size={20} /></span>
            <p className="pricing-plan-label">For product brands</p>
            <h3>Product partner model</h3>
            <p>Product partners, such as protein supplement brands, can include a scratch coupon or activation code with a product. Customers redeem it for one month or more of FitLife access, based on the code duration.</p>
            <ul><li>Offer a useful digital benefit alongside a product.</li><li>Use duration-specific codes for partner campaigns.</li><li>Demo codes on this page show the customer redemption experience.</li></ul>
            <span className="partnership-footnote"><ShieldAlert size={14} /> Real partner verification requires a backend.</span>
          </article>
        </div>
      </section>

      <p className="membership-disclaimer"><ShieldAlert size={15} /> Frontend-only college project: demo codes and Premium upgrades are stored in this browser and are not secure or verified. Existing fitness tools remain available in the project demo regardless of plan. Real payment processing and partner-code verification require a backend.</p>
      {storageError && <p className="membership-message error" role="alert">Membership could not be saved to browser storage. Check your browser storage settings and try again.</p>}
    </div>
  )
}
