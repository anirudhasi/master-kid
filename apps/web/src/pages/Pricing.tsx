import { motion } from 'framer-motion'
import { CheckCircle, X } from 'lucide-react'
import { Link } from 'react-router-dom'

const PLANS = [
  {
    name: 'Free',
    price: '₹0',
    period: 'forever',
    badge: null,
    color: '#64748B',
    bg: '#F8FAFC',
    border: '#DCE8F5',
    cta: 'Get Started',
    ctaStyle: 'btn-ghost',
    features: [
      { text: 'Up to 3 daily logs',           included: true  },
      { text: 'Basic XP & streak tracking',   included: true  },
      { text: '3 AI summaries per week',       included: true  },
      { text: 'Social feed (read-only)',        included: true  },
      { text: 'Basic student profile',         included: true  },
      { text: 'AI Learning Plan',              included: false },
      { text: 'Answer sheet checking',         included: false },
      { text: 'AI Tutor chat (Miko)',          included: false },
      { text: 'Tutor marketplace access',      included: false },
      { text: 'Weekly AI report',              included: false },
    ],
  },
  {
    name: 'Advanced',
    price: '₹149',
    period: '/month',
    badge: 'Most Popular',
    color: '#4F46E5',
    bg: 'linear-gradient(135deg,#EEF2FF,#F5F3FF)',
    border: '#A5B4FC',
    cta: 'Start Free Trial',
    ctaStyle: 'btn-primary',
    features: [
      { text: 'Unlimited daily logs',                  included: true  },
      { text: 'Full XP, streak & badge system',        included: true  },
      { text: 'Unlimited AI parent summaries',         included: true  },
      { text: 'Social feed — post & interact',         included: true  },
      { text: 'Full student profile + goals',          included: true  },
      { text: 'AI Learning Plan (CBSE/ICSE/IB)',       included: true  },
      { text: 'Answer sheet checking (10/month)',      included: true  },
      { text: 'AI Tutor Miko (20 chats/day)',          included: true  },
      { text: 'Tutor marketplace access',              included: true  },
      { text: 'Weekly AI report',                      included: false },
    ],
  },
  {
    name: 'Pro',
    price: '₹299',
    period: '/month',
    badge: 'Best for JEE/NEET',
    color: '#059669',
    bg: 'linear-gradient(135deg,#ECFDF5,#F0FDF4)',
    border: '#6EE7B7',
    cta: 'Go Pro',
    ctaStyle: 'btn-success',
    features: [
      { text: 'Everything in Advanced',               included: true  },
      { text: 'Unlimited answer sheet checking',      included: true  },
      { text: 'AI Tutor Miko — unlimited',            included: true  },
      { text: 'Weekly AI progress report',            included: true  },
      { text: 'JEE/NEET chapter tracking',            included: true  },
      { text: 'Mock test scheduler + rank estimator', included: true  },
      { text: 'AI tutor matching (Phase 3)',           included: true  },
      { text: 'Parent WhatsApp digest',               included: true  },
      { text: 'Hardware device priority access',      included: true  },
      { text: 'Dedicated support (6h response)',      included: true  },
    ],
  },
]

const REVENUE_MODELS = [
  { emoji:'🎓', title:'University Pipeline',     desc:'Top universities pay to access verified student profiles — your complete 15-year academic record becomes your admission edge.' },
  { emoji:'📚', title:'Publisher Partnerships',  desc:'NCERT, Pearson, Oxford & MTG place curated study material recommendations at the exact moment you need them.' },
  { emoji:'🏫', title:'School Licensing',        desc:'Schools get a white-label dashboard for ₹150/student/year. 1 school = 200+ families acquired at near-zero CAC.' },
  { emoji:'🤝', title:'Coaching SaaS',           desc:'FIITJEE, Aakash, Allen white-label Master-Kids as their student tracking layer. Revenue share on sessions booked.' },
  { emoji:'🏆', title:'Scholarship Marketplace', desc:'Scholarship providers pay to reach verified high-performers. Students get matched to scholarships they actually qualify for.' },
  { emoji:'💼', title:'Corporate CSR',           desc:'Tata, Infosys, Reliance Foundation fund student accounts under Companies Act 2013 CSR mandates — free access for deserving students.' },
]

const fade = (d = 0) => ({
  initial:{opacity:0,y:14}, animate:{opacity:1,y:0},
  transition:{duration:0.45,delay:d,ease:[0.16,1,0.3,1]},
})

export default function Pricing() {
  return (
    <div className="page-container">

      {/* Header */}
      <motion.div {...fade(0)} style={{textAlign:'center',marginBottom:40}}>
        <p className="label" style={{marginBottom:8}}>Simple, transparent pricing</p>
        <h1 style={{fontSize:32,fontWeight:900,letterSpacing:'-0.04em',color:'#0F172A',marginBottom:12}}>
          One Student. One Goal. 15 Years.
        </h1>
        <p style={{fontSize:14,color:'#64748B',maxWidth:520,margin:'0 auto',lineHeight:1.7}}>
          Start free. Upgrade when you need the AI Learning Plan, answer sheet grading, or JEE/NEET-specific preparation tools.
        </p>
      </motion.div>

      {/* Plans */}
      <motion.div {...fade(0.05)} style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,marginBottom:48}}>
        {PLANS.map((plan,i) => (
          <div key={plan.name} style={{
            borderRadius:18,padding:28,position:'relative',
            background:plan.bg, border:`1.5px solid ${plan.border}`,
            boxShadow:i===1?'0 8px 32px rgba(79,70,229,0.15)':'0 1px 4px rgba(15,23,42,0.06)',
            transform:i===1?'scale(1.02)':'scale(1)',
          }}>
            {plan.badge && (
              <div style={{
                position:'absolute',top:-12,left:'50%',transform:'translateX(-50%)',
                padding:'4px 14px',borderRadius:20,fontSize:11,fontWeight:700,
                background:i===1?'#4F46E5':i===2?'#059669':'#64748B',color:'#fff',
                whiteSpace:'nowrap',
              }}>{plan.badge}</div>
            )}
            <div style={{marginBottom:20}}>
              <div style={{fontSize:14,fontWeight:700,color:plan.color,marginBottom:6}}>{plan.name}</div>
              <div style={{display:'flex',alignItems:'baseline',gap:2}}>
                <span style={{fontSize:36,fontWeight:900,color:'#0F172A',letterSpacing:'-0.04em'}}>{plan.price}</span>
                <span style={{fontSize:13,color:'#94A3B8'}}>{plan.period}</span>
              </div>
            </div>

            <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:24}}>
              {plan.features.map(f=>(
                <div key={f.text} style={{display:'flex',alignItems:'flex-start',gap:8}}>
                  {f.included
                    ? <CheckCircle size={14} color={plan.color} style={{marginTop:1,flexShrink:0}}/>
                    : <X size={14} color="#CBD5E1" style={{marginTop:1,flexShrink:0}}/>}
                  <span style={{fontSize:12,color:f.included?'#374151':'#94A3B8',lineHeight:1.5}}>{f.text}</span>
                </div>
              ))}
            </div>

            <Link to="/child" className={`btn ${plan.ctaStyle}`} style={{width:'100%',justifyContent:'center',fontSize:13}}>
              {plan.cta}
            </Link>
          </div>
        ))}
      </motion.div>

      {/* Annual discount */}
      <motion.div {...fade(0.1)} className="card-sky" style={{padding:24,textAlign:'center',marginBottom:48,border:'1px solid #BAE6FD'}}>
        <p style={{fontSize:14,fontWeight:700,color:'#0C4A6E',marginBottom:4}}>💰 Save 25% with Annual Plan</p>
        <p style={{fontSize:13,color:'#0369A1'}}>
          Advanced: <strong>₹1,350/year</strong> (save ₹450) · Pro: <strong>₹2,700/year</strong> (save ₹900)
        </p>
      </motion.div>

      {/* Revenue model — how we stay sustainable */}
      <motion.div {...fade(0.15)} style={{marginBottom:48}}>
        <p className="label" style={{marginBottom:8,textAlign:'center'}}>How Master-Kids stays affordable</p>
        <h2 style={{fontSize:22,fontWeight:800,color:'#0F172A',textAlign:'center',letterSpacing:'-0.03em',marginBottom:6}}>
          Beyond subscriptions — our impact model
        </h2>
        <p style={{fontSize:13,color:'#64748B',textAlign:'center',marginBottom:24,maxWidth:480,margin:'0 auto 24px'}}>
          Subscriptions are optional. The platform is sustained by institutional partnerships that align incentives — universities, publishers, and coaching chains pay us when students succeed.
        </p>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14}}>
          {REVENUE_MODELS.map(m=>(
            <div key={m.title} className="card" style={{padding:20}}>
              <div style={{fontSize:28,marginBottom:10}}>{m.emoji}</div>
              <div style={{fontSize:13,fontWeight:700,color:'#0F172A',marginBottom:6}}>{m.title}</div>
              <div style={{fontSize:12,color:'#64748B',lineHeight:1.6}}>{m.desc}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* The 15-year journey */}
      <motion.div {...fade(0.2)} style={{
        background:'linear-gradient(135deg,#1E293B 0%,#0F172A 100%)',
        borderRadius:20,padding:'40px 36px',marginBottom:40,
      }}>
        <p style={{fontSize:11,fontWeight:700,color:'#64748B',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:12,textAlign:'center'}}>Our Promise</p>
        <h2 style={{fontSize:26,fontWeight:900,color:'#F1F5F9',textAlign:'center',letterSpacing:'-0.03em',marginBottom:12}}>
          Pre-Nursery → Graduation
        </h2>
        <p style={{fontSize:14,color:'#94A3B8',textAlign:'center',lineHeight:1.8,maxWidth:560,margin:'0 auto 28px'}}>
          Join when your child is 2 years old. Stay until they walk into their graduation. One platform, one AI companion, 15+ years of personalised guidance. The earlier you start, the stronger the foundation.
        </p>
        <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:8}}>
          {[
            {emoji:'👶',label:'Pre-Nursery'},
            {emoji:'🌱',label:'Primary'},
            {emoji:'📚',label:'Middle'},
            {emoji:'🎯',label:'Secondary'},
            {emoji:'🚀',label:'JEE/NEET'},
            {emoji:'🏆',label:'Graduation'},
          ].map(s=>(
            <div key={s.label} style={{textAlign:'center',padding:'12px 6px',borderRadius:10,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)'}}>
              <div style={{fontSize:22,marginBottom:4}}>{s.emoji}</div>
              <div style={{fontSize:10,color:'#64748B',fontWeight:600}}>{s.label}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* FAQ */}
      <motion.div {...fade(0.25)}>
        <h2 style={{fontSize:20,fontWeight:800,color:'#0F172A',letterSpacing:'-0.03em',marginBottom:20}}>Common Questions</h2>
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          {[
            { q:'Can I switch between plans?', a:'Yes — upgrade, downgrade, or cancel anytime. Your child\'s data and progress history is always preserved.' },
            { q:'What boards does the AI Learning Plan support?', a:'CBSE, ICSE, IB (International Baccalaureate), and major State Boards. More boards added regularly.' },
            { q:'How does answer sheet checking work?', a:'Upload a photo of the answer sheet. The AI reads it, compares against the subject\'s syllabus, marks each question, and gives specific improvement tips — no manual work needed.' },
            { q:'What happens after Class 12?', a:'The platform transitions to graduation tracking — college semester logs, internship tracking, career goal progress, and post-grad preparation (CAT, GATE, GRE, UPSC).' },
            { q:'Is child data safe?', a:'All data is encrypted, isolated per family (Row Level Security), and fully compliant with India\'s DPDP Act. We never sell personal data. Parents control all data.' },
          ].map(item=>(
            <div key={item.q} className="card" style={{padding:20}}>
              <div style={{fontSize:13,fontWeight:700,color:'#0F172A',marginBottom:6}}>{item.q}</div>
              <div style={{fontSize:12,color:'#64748B',lineHeight:1.7}}>{item.a}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
