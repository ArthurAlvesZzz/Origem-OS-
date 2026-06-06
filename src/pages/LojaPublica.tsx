import { useState, useEffect } from 'react';
import { useRepositories } from '../repositories/RepositoryProvider';
import { StorefrontPlan, SubscriptionRequestData } from '../repositories/interfaces/IStorefrontRepository';
import { CheckCircle2, X, ArrowRight, QrCode, Play, Menu, ChevronDown, ChevronRight, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from '../components/ui/Toast';

export function LojaPublica() {
  const { success, error: toastError, info } = useToast();
  const { storefrontRepo, paymentRepo } = useRepositories();
  const [plans, setPlans] = useState<StorefrontPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedPlan, setSelectedPlan] = useState<StorefrontPlan | null>(null);
  const [formData, setFormData] = useState<SubscriptionRequestData>({
    planId: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    address: '',
    notes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'form' | 'pix' | 'success'>('form');
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const p = await storefrontRepo.getStorefrontPlans();
      // Embellish plans for visual prototype
      const embellishedPlans = p.map((plan, i) => ({
        ...plan,
        featured: i === 1,
        sensoryNotes: i === 0 ? ['Caramelo', 'Chocolate', 'Noz-pecã'] : ['Frutas Vermelhas', 'Jasmim', 'Mel'],
        roastProfile: i === 0 ? 'Média' : 'Média Clara',
      }));
      setPlans(embellishedPlans);
    } catch (e) {
      console.warn("Erro ao carregar loja.", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPlan = (plan: StorefrontPlan) => {
    setSelectedPlan(plan);
    setFormData(prev => ({ ...prev, planId: plan.id }));
    setCheckoutStep('form');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;
    setIsSubmitting(true);
    try {
      const req = await storefrontRepo.createSubscriptionRequest('demo', formData);
      await paymentRepo.createIntent({
        tenantId: 'demo',
        subscriptionRequestId: req.id,
        amount: selectedPlan.price,
        currency: 'BRL',
        status: 'pending',
      });
      setTimeout(() => setCheckoutStep('pix'), 800); // add artificial delay for cinematic feel
    } catch (error) {
       toastError("Erro ao enviar interesse. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSimulatePayment = () => {
    setTimeout(() => setCheckoutStep('success'), 600);
  };

  // Cinematic Animation Variants
  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 1, ease: [0.2, 0.7, 0.2, 1] as const } }
  };
  
  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.1 }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cof-black flex flex-col items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border border-cof-gold/20 border-t-cof-gold rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cof-black text-cof-sand font-sans selection:bg-cof-gold/30 selection:text-cof-black overflow-x-hidden">
      
      {/* Navigation Layer */}
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: [0.2, 0.7, 0.2, 1] }}
        className="fixed top-0 left-0 right-0 z-40 bg-cof-black/80 backdrop-blur-xl border-b border-white/5"
      >
        <div className="max-w-[1600px] mx-auto px-6 md:px-12 h-24 flex items-center justify-between">
          <div className="flex items-center gap-12">
            <div className="font-heading font-extrabold text-[22px] tracking-[0.2em] text-cof-sand uppercase">
              CofCof<span className="text-cof-gold">.</span>Co
            </div>
            <nav className="hidden lg:flex gap-10">
              {['A Torrefação', 'Cafés', 'B2B & Empresas', 'Onde Encontrar'].map((item) => (
                <a key={item} href="#" className="text-[11px] font-heading font-bold uppercase tracking-[0.18em] text-cof-sand/70 hover:text-cof-sand transition-colors relative group">
                  {item}
                  <span className="absolute -bottom-2 left-0 w-0 h-[1px] bg-cof-gold transition-all duration-300 group-hover:w-full"></span>
                </a>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="hidden md:block text-[11px] font-heading font-bold uppercase tracking-[0.18em] text-cof-sand/70 hover:text-cof-sand transition-colors">
              Login
            </a>
            <button className="hidden md:flex h-12 items-center justify-center px-8 bg-cof-gold text-cof-black font-heading font-bold text-[11px] uppercase tracking-[0.2em] hover:bg-cof-sand transition-colors overflow-hidden relative group">
              <span className="relative z-10">Clube Assinatura</span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[0.2,0.7,0.2,1]"></div>
            </button>
            <button className="lg:hidden text-cof-sand">
              <Menu size={24} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex flex-col justify-end pb-24 lg:pb-32 px-6 md:px-12 pt-40">
        <div className="absolute inset-0 z-0 select-none pointer-events-none">
          {/* Subtle slow moving gradient over dark background simulating studio light */}
          <div className="absolute inset-0 bg-cof-black z-10"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(201,162,99,0.1)_0%,_transparent_70%)] z-20"></div>
        </div>

        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="relative z-10 max-w-[1600px] mx-auto w-full"
        >
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-6 items-end">
            <div className="lg:col-span-8">
              <motion.div variants={fadeUp} className="inline-flex items-center gap-3 mb-8">
                <div className="w-12 h-[1px] bg-cof-gold"></div>
                <span className="font-heading font-bold uppercase tracking-[0.2em] text-[10px] text-cof-gold">Direto da Torrefação</span>
              </motion.div>
              <motion.h1 
                variants={fadeUp}
                className="font-heading font-extrabold uppercase tracking-tight text-5xl md:text-7xl lg:text-[7rem] leading-[0.9] text-cof-sand mb-8"
              >
                O Ritmo <br />
                <span className="text-cof-clay italic font-serif normal-case tracking-normal pr-4">da Origem</span>
              </motion.h1>
              <motion.p variants={fadeUp} className="text-lg md:text-xl text-cof-text-muted font-light max-w-xl leading-relaxed">
                Descubra microlotes exclusivos. Torramos sua seleção sob demanda e enviamos diretamente para sua casa com precisão e frescor incomparáveis.
              </motion.p>
            </div>
            
            <motion.div variants={fadeUp} className="lg:col-span-4 flex lg:justify-end">
              <button 
                onClick={() => setIsLightboxOpen(true)}
                className="group relative w-full lg:w-64 aspect-[4/5] bg-cof-sand-2 overflow-hidden flex items-center justify-center cursor-pointer"
              >
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-700 z-10"></div>
                <img 
                  src="https://images.unsplash.com/photo-1611162458324-aae1eb4129a4?q=80&w=800&auto=format&fit=crop" 
                  alt="Processo de torra" 
                  className="absolute inset-0 w-full h-full object-cover scale-100 group-hover:scale-105 transition-transform duration-1000 ease-[0.2,0.7,0.2,1]"
                />
                <div className="relative z-20 w-16 h-16 rounded-full border border-white/30 backdrop-blur-md flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-500">
                  <Play size={20} fill="currentColor" className="ml-1" />
                </div>
                <div className="absolute bottom-6 left-6 z-20 text-white">
                  <div className="font-heading font-bold text-[10px] uppercase tracking-[0.2em] mb-1">Assista</div>
                  <div className="text-sm font-light">Nossa Filosofia</div>
                </div>
              </button>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Subscription Plans Section */}
      <section className="relative py-32 bg-cof-sand text-cof-black px-6 md:px-12">
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1, ease: [0.2, 0.7, 0.2, 1] }}
          className="max-w-[1600px] mx-auto"
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
            <div>
              <h2 className="font-heading font-extrabold uppercase tracking-tight text-4xl md:text-6xl mb-6">Seu Clube</h2>
              <p className="text-cof-text-muted font-light text-lg max-w-md">
                Planos fluídos. Escolha como e quando receber o suprimento essencial para seu ritual. Cancelamento sem fricção.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-12 md:gap-x-8 lg:gap-x-12">
            {plans.map((p, idx) => (
              <motion.div 
                key={p.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, delay: idx * 0.2, ease: [0.2, 0.7, 0.2, 1] }}
                className={`relative flex flex-col group ${p.featured ? '' : 'lg:mt-12'}`}
              >
                {/* Plan Card visual wrapper */}
                <div className={`flex-1 flex flex-col p-8 md:p-12 transition-colors duration-500 bg-white shadow-[0_4px_40px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.08)] ${p.featured ? 'border-t-4 border-cof-clay' : ''}`}>
                  {p.featured && (
                    <div className="absolute top-0 right-8 -translate-y-1/2 bg-cof-clay text-cof-sand font-heading font-bold text-[9px] uppercase tracking-[0.2em] px-4 py-1.5 z-10 flex items-center gap-2">
                       A Curadoria Exata
                    </div>
                  )}

                  <div className="mb-10 flex-1">
                    <div className="font-heading font-bold uppercase tracking-[0.1em] text-cof-gold text-[10px] mb-4">
                      Assinatura
                    </div>
                    <h3 className="font-heading font-bold text-2xl md:text-3xl uppercase tracking-tight mb-4">{p.name}</h3>
                    <p className="font-light text-cof-text-muted text-sm leading-relaxed mb-8 h-16">{p.description}</p>
                    
                    <div className="flex items-end gap-2 mb-8">
                      <span className="font-heading font-bold text-4xl tracking-tight">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(p.price)}
                      </span>
                      <span className="font-heading font-bold uppercase text-[10px] tracking-widest text-cof-text-muted pb-1">
                        / {p.frequency === 'monthly' ? 'mês' : p.frequency}
                      </span>
                    </div>

                    <div className="border-t border-cof-black/10 pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs text-cof-text-muted uppercase tracking-widest font-heading font-bold">Quantidade</span>
                        <span className="text-sm font-medium">{p.packageCount}x de {p.weight}g</span>
                      </div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs text-cof-text-muted uppercase tracking-widest font-heading font-bold">Perfil</span>
                        <span className="text-sm font-medium">{(p as any).roastProfile}</span>
                      </div>
                      <div className="flex items-start justify-between">
                        <span className="text-xs text-cof-text-muted uppercase tracking-widest font-heading font-bold mt-1">Notas</span>
                        <div className="flex flex-col items-end gap-1">
                          {((p as any).sensoryNotes || []).map((n: string) => (
                            <span key={n} className="text-sm font-medium">{n}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleSelectPlan(p)}
                    className={`w-full py-5 flex items-center justify-center gap-4 font-heading font-bold uppercase text-[11px] tracking-[0.2em] transition-all duration-300 ${p.featured ? 'bg-cof-black text-cof-sand hover:bg-cof-clay' : 'bg-transparent border border-cof-black text-cof-black hover:bg-cof-black hover:text-cof-sand'}`}
                  >
                     Tornar-se Membro
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Manifesto / Editorial B2B Lead */}
      <section className="py-32 px-6 md:px-12 border-t border-white/5 relative overflow-hidden">
        <div className="max-w-[1600px] mx-auto grid lg:grid-cols-2 gap-16 items-center z-10 relative">
           <div>
             <h2 className="font-heading font-extrabold uppercase tracking-tight text-4xl md:text-5xl mb-8">Excelência para o seu <span className="text-cof-gold italic font-serif normal-case tracking-normal">Negócio</span></h2>
             <p className="text-cof-text-muted font-light text-lg mb-12 max-w-xl leading-relaxed">
               Fornecemos grãos de altíssimo nível, equipamento e treinamento para cafeterias, restaurantes e escritórios que não aceitam compromissos com a qualidade.
             </p>
             <button className="flex items-center gap-4 font-heading font-bold uppercase text-[11px] tracking-[0.2em] text-cof-sand group">
                <span className="border-b border-cof-gold pb-1 group-hover:border-cof-sand transition-colors">Acessar B2B</span>
                <ChevronRight size={14} className="text-cof-gold group-hover:text-cof-sand transition-colors group-hover:translate-x-1" />
             </button>
           </div>
           
           <div className="relative aspect-[4/3] bg-cof-sand-2 overflow-hidden">
              <img src="https://images.unsplash.com/photo-1559525839-b184a4d698c7?q=80&w=1200&auto=format&fit=crop" alt="Expresso crema" className="absolute inset-0 w-full h-full object-cover grayscale opacity-80 mix-blend-luminosity hover:grayscale-0 hover:opacity-100 transition-all duration-1000 ease-[0.2,0.7,0.2,1] scale-105 hover:scale-100" />
           </div>
        </div>
      </section>

      {/* Cinematic Modal Checkout */}
      <AnimatePresence>
        {selectedPlan && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.2, 0.7, 0.2, 1] }}
            className="fixed inset-0 z-50 flex"
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-cof-black/90 backdrop-blur-xl" onClick={() => setSelectedPlan(null)}></div>
            
            {/* Drawer/Modal Panel */}
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }}
              className="absolute right-0 top-0 bottom-0 w-full md:w-[600px] bg-cof-sand flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between p-8 border-b border-cof-black/10">
                <div className="font-heading font-extrabold uppercase tracking-[0.2em] text-cof-black text-sm">
                  Finalizar <span className="text-cof-clay">Adesão</span>
                </div>
                <button 
                  onClick={() => { setSelectedPlan(null); setCheckoutStep('form'); }} 
                  className="w-10 h-10 border border-cof-black/20 rounded-full flex items-center justify-center text-cof-black hover:bg-cof-black hover:text-cof-sand transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-8 text-cof-black relative">
                
                <AnimatePresence mode="wait">
                  {checkoutStep === 'form' && (
                    <motion.div 
                      key="form"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.4 }}
                    >
                      <div className="mb-10 bg-white p-8 border border-cof-black/5 shadow-sm">
                        <div className="font-heading font-bold uppercase tracking-[0.2em] text-[9px] text-cof-clay mb-2">Resumo do Plano</div>
                        <h3 className="font-heading font-bold text-2xl uppercase mb-1">{selectedPlan.name}</h3>
                        <p className="text-cof-text-muted text-sm">{selectedPlan.packageCount}x {selectedPlan.weight}g / {selectedPlan.frequency === 'monthly'? 'mês' : selectedPlan.frequency}</p>
                        <div className="mt-6 pt-4 border-t border-cof-black/10 flex justify-between items-center">
                           <span className="font-heading font-bold uppercase text-[10px] tracking-widest text-cof-text-muted">Total hoje</span>
                           <span className="font-heading font-bold text-xl">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedPlan.price)}</span>
                        </div>
                      </div>

                      <form onSubmit={handleSubmit} className="space-y-6">
                         <div className="font-heading font-bold uppercase tracking-[0.2em] text-[10px] text-cof-black mb-4">Dados Pessoais</div>
                         
                         <div className="space-y-1">
                            <label className="text-[10px] font-heading font-bold uppercase tracking-[0.1em] text-cof-text-muted ml-1">Nome Completo</label>
                            <input 
                              required
                              value={formData.customerName}
                              onChange={e => setFormData({...formData, customerName: e.target.value})}
                              className="w-full bg-transparent border-b border-cof-black/20 px-1 py-3 text-cof-black focus:border-cof-clay focus:outline-none transition-colors rounded-none placeholder:text-cof-black/20"
                              placeholder="Juliana Silva"
                            />
                         </div>
                         
                         <div className="grid grid-cols-2 gap-6">
                           <div className="space-y-1">
                              <label className="text-[10px] font-heading font-bold uppercase tracking-[0.1em] text-cof-text-muted ml-1">E-mail</label>
                              <input 
                                required type="email"
                                value={formData.customerEmail}
                                onChange={e => setFormData({...formData, customerEmail: e.target.value})}
                                className="w-full bg-transparent border-b border-cof-black/20 px-1 py-3 text-cof-black focus:border-cof-clay focus:outline-none transition-colors rounded-none placeholder:text-cof-black/20"
                                placeholder="nome@email.com"
                              />
                           </div>
                           <div className="space-y-1">
                              <label className="text-[10px] font-heading font-bold uppercase tracking-[0.1em] text-cof-text-muted ml-1">WhatsApp</label>
                              <input 
                                required
                                value={formData.customerPhone || ''}
                                onChange={e => setFormData({...formData, customerPhone: e.target.value})}
                                className="w-full bg-transparent border-b border-cof-black/20 px-1 py-3 text-cof-black focus:border-cof-clay focus:outline-none transition-colors rounded-none placeholder:text-cof-black/20"
                                placeholder="11 90000 0000"
                              />
                           </div>
                         </div>
                         
                         <div className="pt-8">
                             <div className="font-heading font-bold uppercase tracking-[0.2em] text-[10px] text-cof-black mb-4">Endereço de Entrega</div>
                             <textarea 
                               required
                               value={formData.address || ''}
                               onChange={e => setFormData({...formData, address: e.target.value})}
                               className="w-full bg-white border border-cof-black/10 p-5 text-cof-black focus:border-cof-clay focus:outline-none transition-colors min-h-[100px] text-sm resize-none"
                               placeholder="Ex: Av. Paulista, 1000 - Apto 55, Bela Vista, São Paulo - SP, 01310-100"
                             />
                         </div>

                         <div className="pt-8 pb-12">
                           <button 
                             type="submit" 
                             disabled={isSubmitting}
                             className="w-full py-6 bg-cof-black text-cof-sand hover:bg-cof-clay font-heading font-bold text-[11px] uppercase tracking-[0.2em] transition-all duration-300 flex justify-center items-center gap-3 disabled:opacity-50"
                           >
                             {isSubmitting ? 'Iniciando Experiência...' : 'Prosseguir para Pagamento'}
                           </button>
                         </div>
                      </form>
                    </motion.div>
                  )}

                  {checkoutStep === 'pix' && (
                     <motion.div 
                        key="pix"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.5 }}
                        className="text-center py-12"
                      >
                       <div className="font-heading font-bold uppercase tracking-[0.2em] text-[10px] text-cof-clay mb-2">Passo 2/2</div>
                       <h3 className="font-heading font-bold text-3xl uppercase mb-4">Pagamento PIX</h3>
                       <p className="text-cof-text-muted text-sm max-w-sm mx-auto leading-relaxed mb-12">
                         Utilize o aplicativo do seu banco para escanear o QR Code e confirmar sua entrada no clube.
                       </p>

                       <div className="bg-white p-8 border border-cof-black/10 inline-flex items-center justify-center mb-8 shadow-sm">
                         <QrCode size={180} className="text-cof-black" />
                       </div>

                       <div className="font-heading font-bold text-2xl text-cof-black mb-12">
                         {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedPlan.price)}
                       </div>

                       <div className="flex flex-col gap-4 max-w-sm mx-auto">
                         <button 
                           onClick={handleSimulatePayment}
                           className="w-full py-5 bg-[#528F65] text-white hover:bg-[#528F65]/80 font-heading font-bold text-[11px] uppercase tracking-[0.2em] transition-colors"
                         >
                           Simular Confirmação PIX
                         </button>
                         <button 
                           onClick={() => setCheckoutStep('form')}
                           className="w-full py-4 text-cof-text-muted hover:text-cof-black font-heading font-bold text-[10px] uppercase tracking-widest transition-colors"
                         >
                           Cancelar e Voltar
                         </button>
                       </div>
                     </motion.div>
                  )}

                  {checkoutStep === 'success' && (
                     <motion.div 
                        key="success"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }}
                        className="text-center py-20 flex flex-col items-center justify-center h-full"
                      >
                       <div className="w-24 h-24 bg-[#528F65]/10 rounded-full flex items-center justify-center text-[#528F65] mb-8 relative">
                          <motion.div 
                             initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }}
                          >
                            <CheckCircle2 size={40} strokeWidth={1.5} />
                          </motion.div>
                       </div>
                       
                       <h3 className="font-heading font-extrabold text-3xl uppercase mb-6 tracking-tight">Bem-vindo à Origem</h3>
                       <p className="text-cof-text-muted text-base max-w-md mx-auto leading-relaxed mb-12">
                         O pagamento foi confirmado. Seu lugar no clube CofCof.Co está garantido. Um especialista da nossa equipe entrará em contato via WhatsApp nas próximas horas para afinar o perfil do seu primeiro envio.
                       </p>

                       <button 
                         onClick={() => { setSelectedPlan(null); setCheckoutStep('form'); }}
                         className="w-full max-w-sm py-6 bg-cof-black text-cof-sand hover:bg-cof-clay font-heading font-bold text-[11px] uppercase tracking-[0.2em] transition-all duration-300"
                       >
                         Retornar ao Início
                       </button>
                     </motion.div>
                  )}

                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video Lightbox */}
      <AnimatePresence>
        {isLightboxOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-6"
          >
             <button onClick={() => setIsLightboxOpen(false)} className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors">
               <X size={32} strokeWidth={1} />
             </button>
             <div className="w-full max-w-5xl aspect-video bg-cof-black border border-white/10 relative overflow-hidden flex items-center justify-center">
                 {/* Video placeholder for prototype */}
                 <img src="https://images.unsplash.com/photo-1611162458324-aae1eb4129a4?q=80&w=1200&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover opacity-50" />
                 <div className="relative z-10 flex flex-col items-center">
                    <Play size={48} className="text-white/80 mb-6" strokeWidth={1} />
                    <span className="font-heading font-bold uppercase tracking-[0.2em] text-[10px] text-white">[ Espaço para Vídeo Institucional da Torrefação ]</span>
                 </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="border-t border-white/5 py-16 text-center text-cof-text-muted text-[10px] font-heading font-bold uppercase tracking-[0.2em] bg-cof-black relative z-10">
        <p>COFCOF.CO © 2026. Origem Cerrado Mineiro.</p>

        {/* GUIDA DE IMPLEMENTAÇÃO FUNCIONAL (Para a próxima IA / Shopify Liquid):
            
            1. Layout:
               - O Hero section exige um bloco customizado full-screen via SectionSettings.
               - Substituir os placeholders de imagem/video por metafields da marca ou block settings (video_url).
            
            2. Assinatura/Clube (Planos):
               - Mapear o loop de 'plans' para os produtos de assinatura do Shopify configurados no Skio/Recharge ou Selling Plans nativos.
               - O price formatado deve vir de `product.price | money`.
               
            3. Modal/Drawer de Checkout B2C:
               - Como o Shopify processa checkouts internamente, o form aqui no React deve construir o Cart via Storefront API com as properties corretas e redirecionar para a URL do Checkout.
               - No caso real, a simulação de PIX será substituída pela página de agradecimento do checkout nativo.
               
            4. Fontes e Animações:
               - 'Montserrat' (Headings) e 'DM Sans' (Body) precisam estar configuradas no theme.liquid <head>.
               - O staggering (Framer Motion) deve ser portado usando uma biblioteca vanilla de scroll reveal ou CSS keyframes acionados por um IntersectionObserver se o stack final não permitir React.
               
            5. Design System Colors:
               - "--cof-black", "--cof-sand", etc devem estar nas configurações de esquema de cores do Theme Editor.
        */}
      </footer>
    </div>
  );
}

