/**
 * Returns a random welcome message for the dashboard.
 * Written to speak to all ICPs: freelancers, consultants,
 * agency owners, and small business owners.
 */
export function getWelcomeMessage(): string {
  const messages = [
    // Universal / business health
    "Here's your overview",
    "Your business at a glance",
    "Your financial command center",
    "Business insights, front and center",
    "Your business, simplified",
    "Everything in one place",
    "Your numbers, your way",
    "Stay on top of your business",

    // Cash flow / revenue focused
    "Let's track that revenue",
    "Ready to boost cash flow?",
    "Let's keep the money moving",
    "Revenue tracking made easy",
    "Your cash flow snapshot",
    "Let's close the books strong",
    "Time to make money moves",

    // Action / growth oriented
    "Let's make it happen",
    "Ready to grow?",
    "Time to close some deals",
    "Let's get to work",
    "Your next move starts here",
    "Let's build something great",
    "Time to level up",

    // Client / contract focused (small biz + agency)
    "Your clients are waiting",
    "Manage clients, contracts, and cash",
    "From contract to cash — let's go",
    "Your pipeline at a glance",
    "Stay ahead of your contracts",

    // Invoicing focused (freelancer + consultant)
    "Ready to get paid?",
    "Time to invoice",
    "Your payments, organized",
    "Let's chase those payments",
    "Get paid faster, stress less",
  ]

  return messages[Math.floor(Math.random() * messages.length)]
}

/**
 * Optional: Returns a time-based greeting + motivational phrase
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