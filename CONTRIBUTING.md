# 🤝 Contributing to Invonaut

Thank you for your interest in contributing to Invonaut! While this is currently a solo project, contributions, suggestions, and feedback are welcome.

---

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)

---

## 📜 Code of Conduct

### Our Standards

- **Be respectful**: Treat everyone with respect and kindness
- **Be constructive**: Provide helpful feedback and suggestions
- **Be patient**: Remember that everyone has different skill levels
- **Be professional**: Keep discussions focused on the project

### Unacceptable Behavior

- Harassment, discrimination, or offensive language
- Trolling or deliberately disruptive behavior
- Sharing others' private information
- Any illegal activity

---

## 🎯 How Can I Contribute?

### Reporting Bugs

Found a bug? Help us fix it:

1. **Check existing issues** to avoid duplicates
2. **Create a new issue** with the "Bug Report" template
3. **Include details**:
   - Clear description of the bug
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots (if applicable)
   - Browser/OS information
   - Error messages from console

**Example Bug Report**:
```
**Description**: Logo upload fails for SVG files

**Steps to Reproduce**:
1. Go to Settings page
2. Click "Upload Logo"
3. Select an SVG file (< 10MB)
4. Click "Save Changes"

**Expected**: Logo uploads successfully
**Actual**: Error: "Failed to upload logo"

**Console Error**: 
TypeError: Cannot read property 'url' of undefined

**Environment**:
- Browser: Chrome 120
- OS: Windows 11
- Invonaut Version: 0.95.0
```

### Suggesting Features

Have an idea for improvement?

1. **Check existing feature requests** to avoid duplicates
2. **Create a new issue** with the "Feature Request" template
3. **Explain**:
   - What problem does it solve?
   - How would it work?
   - Why is it valuable to users?
   - Any implementation ideas

**Example Feature Request**:
```
**Feature**: Dark mode support

**Problem**: Users working late hours experience eye strain with light theme

**Proposed Solution**: 
- Add dark mode toggle in Settings
- Store preference in user_profiles table
- Apply dark theme across all pages
- Default to system preference

**Benefits**:
- Improved user experience
- Reduced eye strain
- Modern aesthetic option

**Implementation Ideas**:
- Use Tailwind dark mode classes
- Add dark: variants to all components
```

### Improving Documentation

Documentation improvements are always welcome:

- Fix typos or unclear instructions
- Add missing information
- Improve code examples
- Update outdated content

Submit changes via Pull Request with clear descriptions.

---

## 🛠️ Development Setup

### Prerequisites

- Node.js 18+ and npm
- Git
- Code editor (VS Code recommended)
- Supabase account (free tier)
- OpenAI API key
- Resend API key

### Initial Setup

1. **Fork the repository**
   ```bash
   # Click "Fork" on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/Invonaut-mvp.git
   cd Invonaut-mvp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   OPENAI_API_KEY=your_openai_key
   RESEND_API_KEY=your_resend_key
   ```

4. **Set up Supabase database**
   - Follow instructions in README.md
   - Run SQL schema migration
   - Create `logos` storage bucket

5. **Run development server**
   ```bash
   npm run dev
   ```
   
   Open [http://localhost:3000](http://localhost:3000)

6. **Verify setup**
   - Sign up for a test account
   - Create a test client
   - Create a test invoice
   - Test all major features

---

## 🔄 Development Workflow

### Branching Strategy

- `main` - Production-ready code
- `develop` - Development branch (if needed)
- `feature/feature-name` - New features
- `fix/bug-name` - Bug fixes
- `docs/update-name` - Documentation updates

### Workflow Steps

1. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write clean, readable code
   - Follow coding standards (below)
   - Add comments where needed
   - Update documentation

3. **Test your changes**
   ```bash
   npm run build  # Check for build errors
   npm run lint   # Check for linting errors
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create Pull Request**
   - Go to GitHub
   - Click "New Pull Request"
   - Fill out PR template
   - Wait for review

---

## 💻 Coding Standards

### TypeScript

- **Use TypeScript strict mode** (already enabled)
- **Define types for all props and functions**
  ```typescript
  // Good
  type InvoiceProps = {
    invoiceId: string
    amount: number
  }
  
  // Bad
  function handleInvoice(props: any) { ... }
  ```

- **Avoid `any` type** - Use proper types or `unknown`
- **Use interfaces for objects, types for unions**
  ```typescript
  interface User {
    id: string
    name: string
  }
  
  type Status = 'draft' | 'sent' | 'paid' | 'overdue'
  ```

### React Components

- **Use functional components** (no class components)
- **Server Components by default**, Client Components only when needed
  ```typescript
  // Server Component (default)
  export default async function InvoicePage() { ... }
  
  // Client Component (interactive)
  'use client'
  export function InvoiceForm() { ... }
  ```

- **Destructure props** for clarity
  ```typescript
  // Good
  function Button({ label, onClick }: ButtonProps) { ... }
  
  // Bad
  function Button(props) { ... }
  ```

- **Use meaningful component names**
  - PascalCase for components: `InvoiceList`, `ClientCard`
  - camelCase for utilities: `formatCurrency`, `calculateTotal`

### Styling

- **Use Tailwind CSS only** (no custom CSS files)
- **Use core utility classes** (no custom Tailwind plugins)
  ```tsx
  // Good
  <div className="rounded-xl border-2 border-gray-100 p-8">
  
  // Bad (custom classes)
  <div className="custom-card special-border">
  ```

- **Consistent spacing**: Use Tailwind's spacing scale (p-4, p-8, space-y-6)
- **Responsive design**: Use sm:, md:, lg: breakpoints
- **Dark mode ready**: Add dark: variants where appropriate

### File Organization

```
src/
├── app/                    # Next.js pages and routes
│   ├── (auth)/            # Auth pages
│   ├── dashboard/         # Dashboard pages
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/               # Base UI components
│   ├── clients/          # Client-specific
│   ├── invoices/         # Invoice-specific
│   └── settings/         # Settings-specific
├── lib/                   # Utility functions
│   ├── supabase/         # Database clients
│   ├── ai/               # AI logic
│   ├── email/            # Email templates
│   └── pdf/              # PDF generation
└── types/                 # TypeScript types (if needed)
```

### Naming Conventions

- **Files**: kebab-case (`invoice-list.tsx`, `send-email.ts`)
- **Components**: PascalCase (`InvoiceList`, `ClientCard`)
- **Functions**: camelCase (`calculateTotal`, `formatDate`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_FILE_SIZE`, `DEFAULT_COLOR`)
- **Database tables**: snake_case (`user_profiles`, `invoice_items`)

---

## 📝 Commit Guidelines

### Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, no logic change)
- `refactor:` - Code refactoring (no feature change)
- `perf:` - Performance improvements
- `test:` - Adding or updating tests
- `chore:` - Build process, dependencies, tooling

### Examples

```bash
# Feature
git commit -m "feat(invoices): add bulk delete functionality"

# Bug fix
git commit -m "fix(auth): resolve login redirect issue"

# Documentation
git commit -m "docs(readme): update installation instructions"

# Multiple changes
git commit -m "feat(white-label): add logo upload and color picker

- Implemented drag-and-drop logo upload
- Added dual color picker with react-colorful
- Applied branding to PDFs and emails
- Added tier gating for Professional/Business plans"
```

### Commit Best Practices

- ✅ Write in present tense ("add feature" not "added feature")
- ✅ Use imperative mood ("fix bug" not "fixes bug")
- ✅ Keep first line under 72 characters
- ✅ Reference issues/PRs when relevant (#123)
- ✅ Commit working code (builds successfully)
- ❌ Don't commit broken code
- ❌ Don't commit secrets or API keys
- ❌ Don't commit node_modules or .env files

---

## 🔀 Pull Request Process

### Before Submitting

1. **Update from main**
   ```bash
   git checkout main
   git pull origin main
   git checkout your-branch
   git rebase main
   ```

2. **Test thoroughly**
   - [ ] Code builds without errors (`npm run build`)
   - [ ] No linting errors (`npm run lint`)
   - [ ] Feature works as expected
   - [ ] No regressions (existing features still work)
   - [ ] Tested on multiple browsers (Chrome, Firefox, Safari)
   - [ ] Mobile responsive (if UI changes)

3. **Update documentation**
   - [ ] Update README.md if setup changed
   - [ ] Update USER_GUIDE.md if user-facing
   - [ ] Update API.md if API changes
   - [ ] Add entry to CHANGELOG.md

### PR Title Format

Same as commit messages:
```
feat(scope): description
fix(scope): description
docs(scope): description
```

### PR Description Template

```markdown
## Description
Brief summary of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Changes Made
- Added X feature
- Fixed Y bug
- Updated Z documentation

## Testing
- [ ] Tested locally
- [ ] Tested all affected features
- [ ] No console errors
- [ ] Cross-browser tested

## Screenshots (if applicable)
[Add screenshots of UI changes]

## Related Issues
Closes #123
Relates to #456

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-reviewed code
- [ ] Commented complex code
- [ ] Updated documentation
- [ ] No breaking changes (or documented)
```

### Review Process

1. **Automated checks run** (build, lint)
2. **Code review** by maintainer
3. **Request changes** if needed
4. **Approval** once ready
5. **Merge** into main

### After Merge

- Delete your feature branch
- Pull latest main
- Start next feature

---

## 🧪 Testing Guidelines

### Manual Testing

Always test these flows:

**Authentication**:
- [ ] Sign up with new email
- [ ] Email verification
- [ ] Login
- [ ] Logout
- [ ] Password reset

**Client Management**:
- [ ] Create client
- [ ] Edit client
- [ ] Delete client (no invoices)
- [ ] Search clients

**Invoice Management**:
- [ ] Create invoice
- [ ] Edit draft invoice
- [ ] Send invoice
- [ ] Mark as paid
- [ ] Delete invoice

**White Label** (if applicable):
- [ ] Upload logo
- [ ] Change colors
- [ ] Save settings
- [ ] Verify PDF branding
- [ ] Verify email branding

### Edge Cases to Test

- Very long client names (200 chars)
- Large invoice amounts ($999,999.99)
- Many line items (10+)
- Empty states (no clients, no invoices)
- Network errors (offline mode)
- Invalid file uploads (wrong format, too large)

### Browser Testing

Test on:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

### Mobile Testing

Test responsive design:
- Mobile (375px width)
- Tablet (768px width)
- Desktop (1280px+ width)

---

## 📚 Documentation

### When to Update Documentation

Update docs when you:
- Add a new feature
- Change existing functionality
- Fix a bug that affects usage
- Update setup process
- Add new API routes
- Change environment variables

### Documentation Files

- **README.md** - Setup, features, technical overview
- **USER_GUIDE.md** - End-user instructions
- **DEPLOYMENT.md** - Production deployment steps
- **API.md** - API documentation
- **CHANGELOG.md** - Version history
- **CONTRIBUTING.md** - This file

### Code Comments

Add comments for:
- Complex logic or algorithms
- Non-obvious code
- Important security checks
- Workarounds or hacks
- TODOs (with context)

```typescript
// Good comment
// Calculate days overdue by comparing due date with current date
// This accounts for timezone differences using UTC
const daysOverdue = Math.floor(
  (now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
)

// Bad comment
// Add 1
const total = subtotal + 1
```

---

## 🚀 Feature Development Checklist

When adding a new feature:

**Planning**:
- [ ] Feature clearly defined
- [ ] User benefit identified
- [ ] Technical approach planned
- [ ] Database changes documented
- [ ] UI mockups created (if applicable)

**Development**:
- [ ] Code written and tested
- [ ] TypeScript types defined
- [ ] Error handling implemented
- [ ] Loading states added
- [ ] Empty states designed
- [ ] Mobile responsive

**Testing**:
- [ ] Feature works as expected
- [ ] Edge cases handled
- [ ] No regressions
- [ ] Cross-browser tested
- [ ] Performance acceptable

**Documentation**:
- [ ] README.md updated
- [ ] USER_GUIDE.md updated
- [ ] API.md updated (if API changes)
- [ ] CHANGELOG.md entry added
- [ ] Code comments added

**Review**:
- [ ] Self-reviewed code
- [ ] No console errors or warnings
- [ ] Linting passes
- [ ] Build succeeds
- [ ] Ready for PR

---

## 💡 Tips for Contributors

### Getting Started

- **Start small**: Fix typos, improve docs, fix small bugs
- **Ask questions**: Create an issue if you're unsure about something
- **Read existing code**: Learn the patterns and style
- **Test thoroughly**: Don't submit untested code

### Best Practices

- **One feature per PR**: Keep changes focused
- **Write clean code**: Readable > clever
- **Add comments**: Explain why, not what
- **Test edge cases**: Think about what could go wrong
- **Update docs**: Make it easy for others

### Communication

- **Be clear**: Explain what and why
- **Be responsive**: Reply to review comments
- **Be patient**: Reviews take time
- **Be respectful**: We're all learning

---

## 📞 Getting Help

### Questions?

- **Create an issue** with the "Question" label
- **Email**: kamohelo.thakhisi@gmail.com
- **Check documentation**: README.md, USER_GUIDE.md, API.md

### Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Conventional Commits](https://www.conventionalcommits.org/)

---

## 🎉 Thank You!

Thank you for contributing to Invonaut! Every contribution, no matter how small, helps make this project better.

**Happy coding!** 🚀

---

**Last Updated**: January 18, 2026  
**Maintainer**: Kamohelo Thakhisi  
**License**: Private (not licensed for public use)