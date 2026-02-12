/**
 * Returns a random welcome message for the dashboard
 * Provides variety and engagement instead of repetitive "Welcome back!"
 */
export function getWelcomeMessage(): string {
    const messages = [
      "Let's get to work!",
      "Ready to get paid?",
      "Time to invoice!",
      "Your business awaits",
      "Let's make it happen",
      "Here's your overview",
      "Time to grow your business",
      "Let's track that revenue",
      "Your invoicing hub",
      "Business insights, at a glance",
      "Let's chase those payments",
      "Revenue tracking made easy",
      "Your financial command center",
      "Time to close some deals",
      "Let's boost that cash flow",
      "Invoice like a pro",
      "Your business, simplified",
      "Time to make money moves",
      "Let's get those invoices sent",
      "Your payments, organized",
    ]
  
    // Return random message
    return messages[Math.floor(Math.random() * messages.length)]
  }
  
  /**
   * Optional: Returns a time-based greeting + motivational phrase
   * Alternative approach that combines greeting with random phrase
   */
  export function getTimeBasedWelcome(): string {
    const hour = new Date().getHours()
    
    let greeting = "Good evening"
    if (hour < 12) greeting = "Good morning"
    else if (hour < 18) greeting = "Good afternoon"
  
    const phrases = [
      "Let's get to work!",
      "Ready to make it happen?",
      "Time to grow your business",
      "Let's track that revenue",
      "Your business awaits",
    ]
  
    const phrase = phrases[Math.floor(Math.random() * phrases.length)]
    
    return `${greeting}! ${phrase}`
  }