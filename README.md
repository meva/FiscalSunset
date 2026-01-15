<div align="center">
<img width="1200" height="475" alt="RetireSmart Banner" src="https://raw.githubusercontent.com/meva/retiresmart_-tax-efficient-withdrawal-strategist-3/refs/heads/main/Images/Accumulation.png?token=GHSAT0AAAAAADSEVQE27F4FU7JSV5EPU7W62KTJKFA" />

# RetireSmart: Tax-Efficient Withdrawal Strategist

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![React](https://img.shields.io/badge/React-19.2-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2-purple.svg)](https://vitejs.dev/)

**A powerful retirement planning tool that implements sophisticated tax-efficient withdrawal strategies to help you keep more of your money in retirement.**

[Features](#-features) • [Demo](#-demo) • [Installation](#-installation) • [Usage](#-usage) • [Tech Stack](#%EF%B8%8F-tech-stack) • [Contributing](#-contributing) • [License](#-license)

</div>

---

## 📖 Overview

RetireSmart is a comprehensive retirement planning calculator that helps you optimize your withdrawal strategy across multiple account types. It implements the "RetireSmart Approach" to minimize taxes by analyzing your assets, income, and spending needs to generate an optimal withdrawal strategy.

The tool prioritizes tax-efficient withdrawals by:
- Leveraging 0% capital gains tax brackets
- Strategic Roth conversions based on tax bracket headroom
- Social Security benefit taxation optimization
- IRMAA (Medicare premium) cliff avoidance
- Senior deduction phase-out considerations

## ✨ Features

### 🏦 Multi-Account Support
- **Traditional IRA/401(k)** - Pre-tax retirement accounts with RMD tracking
- **Roth IRA** - Tax-free growth and qualified withdrawals
- **Taxable Brokerage** - Capital gains optimization with qualified dividend tracking
- **Health Savings Account (HSA)** - Triple tax-advantaged healthcare savings

### 📊 Four Integrated Planning Modules

| Module | Description |
|--------|-------------|
| **Accumulation** | Pre-retirement savings strategy and growth projections |
| **Withdrawal** | Tax-optimized withdrawal sequence recommendations |
| **Longevity** | Asset depletion analysis with Monte Carlo-style projections |
| **Reference** | Comprehensive guide: how-to, tax strategies, 2025 tax brackets, and disclaimers |


### 🧠 Smart Tax Optimization
- **Two-Layer Cake Method** - Optimal stacking of ordinary income and capital gains
- **Social Security "Torpedo" Detection** - Avoid 50-85% benefit taxation zones
- **IRMAA Cliff Awareness** - Medicare premium surcharge avoidance
- **RMD Calculations** - Automatic Required Minimum Distribution tracking (age 73+)
- **Roth Conversion Optimizer** - "Fill Strategy" algorithm for optimal conversions

### 🤖 AI-Powered Insights (Optional)
- Integrated Google Gemini AI for personalized financial advice
- Contextual recommendations based on your specific situation
- Withdrawal rate analysis against the 4-5% rule of thumb

### 🎨 Modern UI/UX
- Responsive design works on desktop and mobile
- Dark/Light mode toggle
- Interactive charts powered by Recharts
- Real-time calculation updates
- **Local Persistence** - Auto-saves your data to your device (IndexedDB)
- **Privacy First** - Zero-data collection; everything runs client-side

## 🚀 Demo

The application runs entirely in the browser with client-side calculations. Your financial data never leaves your device (unless you opt to use the optional AI advisor feature).

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.0.0 or higher) - [Download here](https://nodejs.org/)
- **npm** (v9.0.0 or higher) - Comes with Node.js
- **Git** - [Download here](https://git-scm.com/)

## 💾 Installation

### Clone from GitHub

```bash
# Clone the repository
git clone https://github.com/meva/retiresmart-tax-efficient-withdrawal-strategist.git

# Navigate to the project directory
cd retiresmart-tax-efficient-withdrawal-strategist

# Install dependencies
npm install
```

### API Key Configuration

The application uses Google Gemini for optional AI insights. 
- You do **not** need an environment variable.
- Simply click the **Settings (Gear Icon)** in the top right of the application to enter your key locally.
- Your key is stored securely on your own device.

To obtain a Gemini API key:
1. Visit [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Navigate to API Keys section
4. Create a new API key

## 🛠️ Development

### Run Locally

You can run the application in two modes:

**1. Web Mode (Browser)**
Runs as a standard web application in your default browser.
```bash
npm run dev -- --mode web
```

**2. Desktop Mode (Electron)**
Runs as a native desktop application window.
```bash
npm run dev
```

The application will be available at `http://localhost:5173` if running in web mode.

The application will be available at `http://localhost:5173` (or the next available port).

### Build for Production

```bash
# Create an optimized production build
npm run build

# Preview the production build locally
npm run preview

### Deployment

#### Option 1: Static Web Hosting (AWS S3, GCS, Netlify, etc.)
You can generate a static distribution folder to host the web version anywhere.

```bash
# Generate the 'dist' folder
./prepare-dist.sh
```

This will create a `dist` folder containing:
- `index.html` (Entry point)
- `assets/` (Compiled JavaScript and CSS)

Upload the contents of this folder to your static file host.
```

### Project Structure

```
retiresmart-tax-efficient-withdrawal-strategist/
├── components/              # React components
│   ├── AccumulationStrategy.tsx   # Pre-retirement planning module
│   ├── InputSection.tsx           # User profile input form
│   ├── LongevityAnalysis.tsx      # Asset depletion projections
│   ├── StrategyResults.tsx        # Withdrawal strategy display
│   └── TaxReference.tsx           # Tax rules reference guide
├── services/                # Business logic
│   ├── calculationEngine.ts       # Core tax & strategy calculations
│   └── geminiService.ts           # Google Gemini AI integration
├── App.tsx                  # Main application component
├── constants.ts             # Tax brackets, RMD tables, thresholds
├── types.ts                 # TypeScript type definitions
├── index.html               # Entry HTML file
├── index.tsx                # React entry point
├── vite.config.ts           # Vite configuration
├── tsconfig.json            # TypeScript configuration
├── package.json             # Dependencies and scripts
└── README.md                # This file
```

## ⚙️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **React 19** | UI Framework with latest features |
| **TypeScript 5.8** | Type-safe JavaScript |
| **Vite 6** | Next-generation frontend tooling |
| **Recharts** | Interactive charting library |
| **Lucide React** | Beautiful icon library |
| **Google Gemini AI** | Optional AI-powered insights |

## 📚 Tax Calculations

The application implements 2025 tax rules including:

### Federal Tax Brackets (2025)
- 10% / 12% / 22% / 24% / 32% / 35% / 37%

### Capital Gains Tax Brackets (2025)
- 0% / 15% / 20%

### Special Considerations
- **Standard Deduction**: $15,000 (Single) / $30,000 (MFJ)
- **Age 65+ Additional**: $1,950 (Single) / $1,550 per person (MFJ)
- **OBBBA Senior Deduction**: Up to $6,000 (Single) / $12,000 (MFJ)
- **RMD Start Age**: 73 years old

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

### Getting Started

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Maintain consistent code formatting
- Add comments for complex tax calculations
- Update tests if applicable
- Update documentation as needed

### Reporting Issues

Found a bug or have a feature request? Please [open an issue](https://github.com/meva/retiresmart-tax-efficient-withdrawal-strategist/issues) with:

- Clear description of the problem/feature
- Steps to reproduce (for bugs)
- Expected vs actual behavior
- Screenshots if applicable

## ⚠️ Disclaimer | 🛑 LEGAL DISCLAIMER

> **This tool is for educational purposes only.**
> 
> RetireSmart does not provide professional financial, tax, legal, or investment advice. The calculations and strategies presented are based on general tax rules and may not account for your complete financial situation.
> 
> Always consult with a qualified financial advisor, tax professional, or fiduciary before making any financial decisions. Tax laws change frequently, and individual circumstances vary significantly. USE AT YOUR OWN RISK! By using this code, you agree that the author is not liable for any financial loss, IRS penalties, or "tax torpedoes" you may encounter.



## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2025 RetireSmart

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 🙏 Acknowledgments

- Tax strategy concepts inspired by various retirement planning resources
- Built with [React](https://react.dev/) and [Vite](https://vitejs.dev/)
- Icons by [Lucide](https://lucide.dev/)
- Charts by [Recharts](https://recharts.org/)
- Built with [Google Gemini](https://aistudio.google.com/) and using AntiGravity 


---

<div align="center">

**Made with ❤️ for a better retirement**

⭐ Star this repo if you find it helpful!

</div>
