'use client';

import { motion } from 'framer-motion';
import { Play, Heart, Music, Sparkles, ArrowRight } from 'lucide-react';

export default function ExamplesSection() {
  const examples = [
    {
      id: 1,
      title: 'Wedding First Dance',
      description: 'A romantic ballad capturing the story of how you met and fell in love.',
      mood: 'Romantic',
      style: 'Pop Ballad',
      duration: '3:45',
      image: '/images/pexels-cottonbro-7097831.jpg',
      category: 'wedding'
    },
    {
      id: 2,
      title: 'Birthday Celebration',
      description: 'An upbeat anthem celebrating your special day and achievements.',
      mood: 'Joyful',
      style: 'Pop',
      duration: '3:20',
      image: '/images/pexels-ekaterina-121008470-9961400.jpg',
      category: 'birthday'
    },
    {
      id: 3,
      title: 'Anniversary Love Song',
      description: 'A heartfelt melody commemorating your years of love and commitment.',
      mood: 'Sentimental',
      style: 'Jazz',
      duration: '4:15',
      image: '/images/pexels-juliano-goncalves-1623825-30817330.jpg',
      category: 'anniversary'
    },
    {
      id: 4,
      title: 'Proposal Song',
      description: 'The perfect soundtrack for your marriage proposal moment.',
      mood: 'Intimate',
      style: 'Acoustic',
      duration: '3:30',
      image: '/images/pexels-obviouslyarthur-1439261.jpg',
      category: 'proposal'
    }
  ];

  const categories = [
    { id: 'all', name: 'All Examples', count: examples.length },
    { id: 'wedding', name: 'Wedding', count: examples.filter(e => e.category === 'wedding').length },
    { id: 'birthday', name: 'Birthday', count: examples.filter(e => e.category === 'birthday').length },
    { id: 'anniversary', name: 'Anniversary', count: examples.filter(e => e.category === 'anniversary').length },
    { id: 'proposal', name: 'Proposal', count: examples.filter(e => e.category === 'proposal').length }
  ];

  return (
    <div className="text-center">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="mb-16"
      >
        <div className="inline-flex items-center space-x-2 bg-accent-50 text-accent-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
          <Sparkles className="w-4 h-4" />
          <span>Sample Songs</span>
        </div>
        
        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
          Hear What's Possible
        </h2>
        
        <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
          Listen to sample songs created with our AI technology. Each one tells a unique story and captures the perfect mood for your special occasion.
        </p>
      </motion.div>

      {/* Category Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="flex flex-wrap justify-center gap-3 mb-12"
      >
        {categories.map((category) => (
          <button
            key={category.id}
            className="px-6 py-3 bg-white hover:bg-accent-50 text-gray-700 hover:text-accent-700 border-2 border-gray-200 hover:border-accent-300 rounded-2xl font-medium transition-all duration-300"
          >
            {category.name}
            <span className="ml-2 text-sm text-gray-500">({category.count})</span>
          </button>
        ))}
      </motion.div>

      {/* Examples Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8">
        {examples.map((example, index) => (
          <motion.div
            key={example.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: index * 0.1 }}
            className="group"
          >
            <div className="card-premium hover:shadow-wedding transition-all duration-500 overflow-hidden">
              {/* Image */}
              <div className="relative h-48 overflow-hidden rounded-t-2xl">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10"></div>
                <div 
                  className="w-full h-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${example.image})` }}
                ></div>
                
                {/* Play button overlay */}
                <div className="absolute inset-0 flex items-center justify-center z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-16 h-16 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg">
                    <Play className="w-8 h-8 text-accent-600 ml-1" />
                  </div>
                </div>

                {/* Category badge */}
                <div className="absolute top-4 left-4 z-30">
                  <div className="px-3 py-1 bg-accent-600 text-white text-xs font-medium rounded-full">
                    {example.category}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-accent-600 transition-colors duration-300">
                  {example.title}
                </h3>
                
                <p className="text-gray-600 mb-4 leading-relaxed">
                  {example.description}
                </p>

                {/* Song details */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Heart className="w-4 h-4 text-accent-500" />
                      <span>{example.mood}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Music className="w-4 h-4 text-accent-500" />
                      <span>{example.style}</span>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-700">{example.duration}</span>
                </div>

                {/* CTA */}
                <button className="w-full btn-outline group-hover:bg-accent-600 group-hover:text-white group-hover:border-accent-600 transition-all duration-300">
                  <div className="flex items-center justify-center space-x-2">
                    <span>Listen to Sample</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                  </div>
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Bottom CTA */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="mt-16 text-center"
      >
        <div className="bg-gradient-to-r from-accent-50 to-accent-100 rounded-3xl p-8 border-2 border-accent-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to Create Your Own Song?
          </h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Join thousands of happy customers who have created personalized songs for their special moments. Start your musical journey today.
          </p>
          <button className="btn-primary text-lg px-8 py-4">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5" />
              <span>Start Creating Now</span>
              <ArrowRight className="w-5 h-5" />
            </div>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
