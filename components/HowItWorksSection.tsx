'use client';
import { motion } from 'framer-motion';
import { Music, Sparkles, CreditCard, Heart, ArrowRight, PenTool } from 'lucide-react';

export default function HowItWorksSection() {
  const steps = [
    {
      icon: <PenTool className="w-12 h-12" />,
      title: 'Describe Your Vision',
      description: 'Tell us about your special moment, the mood you want, and any specific details that matter to you.',
      color: 'from-blue-500 to-indigo-600'
    },
    {
      icon: <Sparkles className="w-12 h-12" />,
      title: 'AI Creates Your Song',
      description: 'Our advanced AI analyzes your vision and composes a unique, personalized song just for you.',
      color: 'from-violet-500 to-purple-600'
    },
    {
      icon: <Heart className="w-12 h-12" />,
      title: 'Review & Perfect',
      description: 'Listen to your song and regenerate if needed. Get it exactly right with our 3-try system.',
      color: 'from-pink-500 to-red-600'
    }
  ];

  return (
    <div className="text-center">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="mb-16"
      >
        <h2 className="text-4xl font-bold text-gray-900 mb-6">
          Create Your Song in{' '}
          <span className="text-gradient-wedding">3 Simple Steps</span>
        </h2>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          From idea to finished song in minutes. Our AI-powered platform makes creating personalized music as easy as describing your vision.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-8 mb-16">
        {steps.map((step, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: index * 0.2 }}
            whileHover={{ 
              scale: 1.05, 
              y: -10,
              rotateY: 5
            }}
            className="group"
          >
            <div className="relative">
              {/* Animated background circle */}
              <motion.div
                className={`absolute inset-0 bg-gradient-to-br ${step.color} rounded-full opacity-20 blur-xl`}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.2, 0.4, 0.2]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: index * 0.5
                }}
              />
              
              {/* Step number */}
              <motion.div
                className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg"
                initial={{ scale: 0, rotate: -180 }}
                whileInView={{ scale: 1, rotate: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.3, type: "spring" }}
                whileHover={{ scale: 1.2, rotate: 360 }}
              >
                {index + 1}
              </motion.div>

              {/* Main card */}
              <div className="relative bg-white/90 backdrop-blur-md rounded-3xl p-8 border-2 border-white/60 shadow-xl hover:shadow-2xl transition-all duration-500 group-hover:border-violet-200">
                <motion.div
                  className={`w-20 h-20 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-lg`}
                  whileHover={{ 
                    scale: 1.1, 
                    rotate: [0, -10, 10, 0],
                    y: -5
                  }}
                  transition={{ duration: 0.3 }}
                >
                  {step.icon}
                </motion.div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-violet-700 transition-colors duration-300">
                  {step.title}
                </h3>
                
                <p className="text-gray-600 leading-relaxed">
                  {step.description}
                </p>

                {/* Animated underline */}
                <motion.div
                  className="w-0 h-1 bg-gradient-to-r from-violet-500 to-purple-600 rounded-full mx-auto mt-4"
                  initial={{ width: 0 }}
                  whileInView={{ width: "60%" }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: index * 0.2 }}
                  whileHover={{ width: "80%" }}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Enhanced bottom CTA with animations */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.8 }}
        className="text-center"
      >
        <div className="relative bg-gradient-to-r from-violet-50 to-purple-50 rounded-3xl p-8 border-2 border-violet-200 max-w-4xl mx-auto overflow-hidden">
          {/* Animated background elements */}
          <motion.div
            className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-violet-200/30 to-purple-300/30 rounded-full blur-2xl"
            animate={{
              x: [0, 100, 0],
              y: [0, -50, 0],
              scale: [1, 1.2, 1]
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute bottom-0 right-0 w-40 h-40 bg-gradient-to-br from-pink-200/30 to-red-300/30 rounded-full blur-2xl"
            animate={{
              x: [0, -80, 0],
              y: [0, 60, 0],
              scale: [1, 1.3, 1]
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2
            }}
          />

          <div className="relative z-10">
            <motion.div 
              className="flex items-center justify-center space-x-3 mb-4"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 1 }}
            >
              <Heart className="w-8 h-8 text-violet-600 animate-heartbeat" />
              <h3 className="text-2xl font-bold text-gray-900">Ready to Create Your Perfect Song?</h3>
            </motion.div>
            
            <motion.p 
              className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 1.2 }}
            >
              Join thousands of happy customers who have created personalized songs for their special moments. Start your musical journey today.
            </motion.p>
            
            <motion.button 
              className="btn-primary text-lg px-8 py-4 group"
              onClick={() => {
                const el = document.getElementById('composer');
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              whileHover={{ 
                scale: 1.05, 
                y: -3,
                boxShadow: "0 25px 50px -12px rgba(139, 92, 246, 0.4)"
              }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 1.4 }}
            >
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 animate-pulse" />
                <span>Start Creating Now</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </div>
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
