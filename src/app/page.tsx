import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { 
  FileText, 
  Users, 
  BarChart3, 
  Zap,
  CheckCircle,
  ArrowRight
} from 'lucide-react'

export default function Home() {
  const features = [
    {
      icon: FileText,
      title: 'Invoice Management',
      description: 'Create, send, and track invoices with ease. Automated reminders and payment tracking.'
    },
    {
      icon: Users,
      title: 'Client Management',
      description: 'Organize your clients, track their information, and manage relationships effectively.'
    },
    {
      icon: BarChart3,
      title: 'Analytics & Reports',
      description: 'Get insights into your business performance with detailed analytics and reports.'
    },
    {
      icon: Zap,
      title: 'Automation',
      description: 'Automate repetitive tasks and streamline your workflow for maximum efficiency.'
    }
  ]

  const benefits = [
    'Save 10+ hours per week on administrative tasks',
    'Reduce invoice processing time by 80%',
    'Improve cash flow with automated reminders',
    'Professional invoices that get paid faster'
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Streamline Your Business with{' '}
              <span className="text-primary">Flowance</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              A comprehensive SaaS platform that helps you manage invoices, clients, 
              and business operations with ease. Focus on what matters most - growing your business.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button size="lg" className="bg-primary hover:bg-primary/90">
                  Get Started Free
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything you need to manage your business
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features designed to simplify your workflow and boost productivity
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <Card key={index} className="p-6 text-center hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {feature.description}
                  </p>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Why choose Flowance?
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Join thousands of businesses that have transformed their operations with Flowance.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-secondary mr-3" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Ready to get started?
              </h3>
              <p className="text-gray-600 mb-6">
                Sign up today and experience the difference Flowance can make for your business.
              </p>
              <div className="space-y-4">
                <Link href="/signup" className="block">
                  <Button className="w-full bg-primary hover:bg-primary/90">
                    Start Free Trial
                  </Button>
                </Link>
                <p className="text-sm text-gray-500 text-center">
                  No credit card required • 14-day free trial
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to streamline your business?
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Join Flowance today and take control of your business operations.
          </p>
          <Link href="/signup">
            <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-gray-100">
              Get Started Now
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
